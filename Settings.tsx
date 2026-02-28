import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, History, Shield, X, Lock, CheckCircle2 } from 'lucide-react';

interface HistoryEntry {
  id: number;
  action: string;
  timestamp: string;
}

interface SettingsProps {
  user: any;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Settings({ user, isDarkMode, toggleDarkMode }: SettingsProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'history'>('general');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, user.id]);

  const fetchHistory = async () => {
    const res = await fetch(`/api/history/${user.id}`);
    const data = await res.json();
    setHistory(data);
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newPassword }),
      });

      if (res.ok) {
        setPasswordSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsChangingPassword(false);
          setPasswordSuccess(false);
        }, 2000);
      } else {
        setPasswordError('Failed to update password');
      }
    } catch (err) {
      setPasswordError('Connection error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your account and app preferences</p>
      </header>

      <div className="flex gap-4 border-b border-black/5 dark:border-white/5 pb-4">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'general' ? 'bg-sapphire text-white' : 'text-gray-500 hover:bg-sapphire/5'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'history' ? 'bg-sapphire text-white' : 'text-gray-500 hover:bg-sapphire/5'
          }`}
        >
          Study Assistant History
        </button>
      </div>

      {activeTab === 'general' ? (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
              <Sun className="text-sapphire" size={24} />
              Appearance
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold dark:text-white">Dark Mode</p>
                <p className="text-sm text-gray-500">Switch between light and dark themes</p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`w-14 h-8 rounded-full p-1 transition-all ${
                  isDarkMode ? 'bg-sapphire' : 'bg-gray-200'
                }`}
              >
                <motion.div
                  animate={{ x: isDarkMode ? 24 : 0 }}
                  className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center"
                >
                  {isDarkMode ? <Moon size={14} className="text-sapphire" /> : <Sun size={14} className="text-amber-500" />}
                </motion.div>
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
              <Shield className="text-sapphire" size={24} />
              Account Security
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/5">
                <span className="text-gray-600 dark:text-gray-400">Username</span>
                <span className="font-bold dark:text-white">{user.username}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/5">
                <span className="text-gray-600 dark:text-gray-400">Role</span>
                <span className="font-bold dark:text-white capitalize">{user.role}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Password</span>
                <button 
                  onClick={() => setIsChangingPassword(true)}
                  className="text-sapphire font-bold hover:underline"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
            <History className="text-sapphire" size={24} />
            Activity History
          </h2>
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No activity recorded yet.</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="flex items-start gap-4 py-3 border-b border-black/5 dark:border-white/5 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-sapphire mt-2" />
                  <div>
                    <p className="font-medium dark:text-white">{entry.action}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isChangingPassword && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                  <Lock className="text-sapphire" size={24} />
                  Change Password
                </h2>
                <button onClick={() => setIsChangingPassword(false)}><X size={24} className="text-gray-400" /></button>
              </div>

              {passwordSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-lg font-bold dark:text-white">Password updated successfully!</p>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                      required
                    />
                  </div>
                  {passwordError && (
                    <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                      {passwordError}
                    </p>
                  )}
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsChangingPassword(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:text-white font-bold">Cancel</button>
                    <button type="submit" className="flex-1 sapphire-btn font-bold">Update Password</button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
