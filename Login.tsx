import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { LogIn, UserPlus, GraduationCap } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();
      if (response.ok) {
        onLogin(data);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-orange-light dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl shadow-sapphire/10 border border-black/5 dark:border-white/5"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-sapphire rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-sapphire/30">
           <img 
              src="/assets/studyspark-logo.png" 
          alt="StudySpark" 
    className="w-12 h-12 object-contain" 
  />
</div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Planner</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {isRegistering ? 'Create your account' : 'Welcome back!'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2 rounded-xl border font-bold transition-all ${
                role === 'student' ? 'bg-sapphire text-white border-sapphire' : 'border-gray-200 dark:border-gray-700 dark:text-white'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('lecturer')}
              className={`flex-1 py-2 rounded-xl border font-bold transition-all ${
                role === 'lecturer' ? 'bg-sapphire text-white border-sapphire' : 'border-gray-200 dark:border-gray-700 dark:text-white'
              }`}
            >
              Lecturer
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-sapphire focus:border-transparent outline-none transition-all"
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-sapphire focus:border-transparent outline-none transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-sapphire text-white py-3 rounded-xl font-bold text-lg hover:bg-sapphire-light shadow-lg shadow-sapphire/20 transition-all flex items-center justify-center gap-2"
          >
            {isRegistering ? <UserPlus size={20} /> : <LogIn size={20} />}
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sapphire dark:text-sapphire-light font-medium hover:underline"
          >
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
