import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Clock, Plus, Bell, CheckCircle2, Trash2 } from 'lucide-react';

interface TimetableEntry {
  id: number;
  topic: string;
  start_time: string;
  end_time: string;
  date: string;
}
export default function Timetable({ user }: { user: any }) {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  
  // Form States
  const [topic, setTopic] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    const [tRes, rRes] = await Promise.all([
      fetch(`/api/timetable/${user.id}`),
      fetch(`/api/reminders/${user.id}`)
    ]);
    setEntries(await tRes.json());
  };

  const handleAddEntry = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, topic, startTime, endTime, date }),
    });
    if (res.ok) {
      fetchData();
      setIsAddingEntry(false);
      setTopic('');
      setStartTime('');
      setEndTime('');
      logHistory(`Scheduled study topic: ${topic} for ${date}`);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    const res = await fetch(`/api/timetable/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchData();
      logHistory(`Deleted study session`);
    }
  };



  const logHistory = async (action: string) => {
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, action }),
    });
  };

  const sortedEntries = [...entries].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.start_time.localeCompare(b.start_time);
  });


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Timetable Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Timetable</h1>
          <button 
            onClick={() => setIsAddingEntry(true)}
            className="sapphire-btn flex items-center gap-2"
          >
            <Plus size={20} /> Add Topic
          </button>
        </div>

        <div className="space-y-4">
          {sortedEntries.length === 0 ? (
            <div className="card text-center py-12">
              <CalendarIcon className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 text-lg">Your timetable is empty. Start planning your study sessions!</p>
            </div>
          ) : (
            sortedEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card flex items-center justify-between group"
              >
                <div className="flex items-center gap-6">
                  <div className="text-center min-w-20">
                    <p className="text-xs font-bold text-sapphire uppercase tracking-widest mb-1">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-lg font-bold dark:text-white">{entry.start_time}</p>
                    <p className="text-xs text-gray-400">to {entry.end_time}</p>
                  </div>
                  <div className="h-12 w-px bg-gray-100 dark:bg-gray-700" />
                  <div>
                    <h3 className="text-xl font-bold dark:text-white">{entry.topic}</h3>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                      <Clock size={14} />
                      <span>Study Session</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>


      {/* Modals */}
      <AnimatePresence>
        {isAddingEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 dark:text-white">Schedule Study Topic</h2>
              <form onSubmit={handleAddEntry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic</label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Quantum Physics Review"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsAddingEntry(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:text-white font-bold">Cancel</button>
                  <button type="submit" className="flex-1 sapphire-btn font-bold">Schedule</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
}
