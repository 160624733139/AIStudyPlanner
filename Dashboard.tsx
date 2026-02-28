import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calendar, Clock, CheckCircle2, ArrowRight, Plus, MapPin, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
}

export default function Dashboard({ user }: { user: any }) {
  const [stats, setStats] = useState({
    paths: 0,
    modules: 0,
    completed: 0,
    reminders: 0
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [enrolledEvents, setEnrolledEvents] = useState<number[]>([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', location: '' });
  const [showEnrollSuccess, setShowEnrollSuccess] = useState(false);
  const [selectedEventForList, setSelectedEventForList] = useState<Event | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<{ username: string, timestamp: string }[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchEvents();
    if (user.role === 'student') fetchEnrollments();
  }, [user.id]);

  const fetchStats = async () => {
    try {
      const [pathsRes, remindersRes] = await Promise.all([
        fetch(`/api/learning-paths/${user.id}`),
        fetch(`/api/reminders/${user.id}`)
      ]);
      
      const paths = await pathsRes.json();
      const reminders = await remindersRes.json();
      
      let totalModules = 0;
      let completedModules = 0;
      
      for (const path of paths) {
        const modRes = await fetch(`/api/modules/${path.id}?userId=${user.id}`);
        const modules = await modRes.json();
        totalModules += modules.length;
        completedModules += modules.filter((m: any) => m.completed).length;
      }

      setStats({
        paths: paths.length,
        modules: totalModules,
        completed: completedModules,
        reminders: reminders.filter((r: any) => !r.is_done).length
      });
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchEvents = async () => {
    const res = await fetch('/api/events');
    const data = await res.json();
    setEvents(data);
  };

  const fetchEnrollments = async () => {
    const res = await fetch(`/api/enrollments/${user.id}`);
    const data = await res.json();
    setEnrolledEvents(data);
  };

  const handleAddEvent = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newEvent, lecturerId: user.id }),
    });
    if (res.ok) {
      fetchEvents();
      setIsAddingEvent(false);
      setNewEvent({ title: '', description: '', date: '', location: '' });
    }
  };

  const handleEnroll = async (eventId: number) => {
    const res = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, eventId }),
    });
    if (res.ok) {
      setEnrolledEvents([...enrolledEvents, eventId]);
      setShowEnrollSuccess(true);
      setTimeout(() => setShowEnrollSuccess(false), 3000);
    }
  };

  const fetchEnrolledStudents = async (event: Event) => {
    setSelectedEventForList(event);
    setIsLoadingStudents(true);
    try {
      const res = await fetch(`/api/events/${event.id}/enrollments`);
      const data = await res.json();
      setEnrolledStudents(data);
    } catch (err) {
      console.error('Failed to fetch students');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const cards = [
    { title: 'Learning Paths', value: stats.paths, icon: BookOpen, color: 'bg-blue-500', link: '/learning-plans' },
    { title: 'Modules Done', value: `${stats.completed}/${stats.modules}`, icon: CheckCircle2, color: 'bg-green-500', link: '/learning-plans' },
    { title: 'Pending Reminders', value: stats.reminders, icon: Clock, color: 'bg-amber-500', link: '/timetable' },
    { title: 'Next Study Session', value: '2:00 PM', icon: Calendar, color: 'bg-sapphire', link: '/timetable' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Hello, {user.username}! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
            {user.role === 'lecturer' ? 'Manage your courses and events.' : 'Ready to crush your study goals today?'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Current Date</p>
          <p className="text-xl font-bold dark:text-white">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card group hover:shadow-xl hover:shadow-sapphire/5 transition-all cursor-pointer"
          >
            <Link to={card.link}>
              <div className="flex justify-between items-start mb-4">
                <div className={`${card.color} p-3 rounded-xl text-white shadow-lg`}>
                  <card.icon size={24} />
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-sapphire transition-colors" size={20} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">{card.title}</p>
              <h3 className="text-3xl font-bold mt-1 dark:text-white">{card.value}</h3>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                <Calendar className="text-sapphire" size={24} />
                Upcoming Events & Programs
              </h2>
              {user.role === 'lecturer' && (
                <button 
                  onClick={() => setIsAddingEvent(true)}
                  className="sapphire-btn flex items-center gap-2 py-1 text-sm"
                >
                  <Plus size={16} /> Add Event
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {events.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No upcoming events.</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="p-4 rounded-xl border border-black/5 dark:border-white/5 bg-orange-light/20 dark:bg-gray-700/30 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">{event.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{event.description}</p>
                      <div className="flex gap-4 mt-2 text-xs font-medium text-gray-400">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {event.date}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                        {user.role === 'lecturer' && (
                          <button 
                            onClick={() => fetchEnrolledStudents(event)}
                            className="flex items-center gap-1 text-sapphire hover:underline"
                          >
                            <Users size={12} /> View Enrolled Students
                          </button>
                        )}
                      </div>
                    </div>
                    {user.role === 'student' && (
                      <button
                        onClick={() => handleEnroll(event.id)}
                        disabled={enrolledEvents.includes(event.id)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                          enrolledEvents.includes(event.id)
                            ? 'bg-green-500/10 text-green-600 cursor-default'
                            : 'bg-sapphire text-white hover:bg-sapphire-light'
                        }`}
                      >
                        {enrolledEvents.includes(event.id) ? 'Enrolled' : 'Enroll Now'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
            <Clock className="text-sapphire" size={24} />
            Quick Pomodoro
          </h2>
          <div className="text-center py-4">
            <p className="text-4xl font-mono font-bold text-sapphire mb-4">25:00</p>
            <Link to="/learning-plans" className="sapphire-btn w-full inline-block">
              Go to Timer
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddingEvent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 dark:text-white">Add Upcoming Event</h2>
              <form onSubmit={handleAddEvent} className="space-y-4">
                <input
                  type="text"
                  placeholder="Event Title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire resize-none"
                  rows={3}
                  required
                />
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                  required
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                  required
                />
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsAddingEvent(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:text-white font-bold">Cancel</button>
                  <button type="submit" className="flex-1 sapphire-btn font-bold">Add Event</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showEnrollSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50"
          >
            <CheckCircle2 size={24} />
            <span className="font-bold">Successfully enrolled to the program/event!</span>
          </motion.div>
        )}

        {selectedEventForList && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold dark:text-white">Enrolled Students</h2>
                  <p className="text-sm text-gray-500">{selectedEventForList.title}</p>
                </div>
                <button onClick={() => setSelectedEventForList(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="max-h-100 overflow-y-auto space-y-3 pr-2">
                {isLoadingStudents ? (
                  <p className="text-center py-8 text-gray-500">Loading students...</p>
                ) : enrolledStudents.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No students enrolled yet.</p>
                ) : (
                  enrolledStudents.map((student, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sapphire/10 flex items-center justify-center text-sapphire font-bold">
                          {student.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold dark:text-white">{student.username}</p>
                          <p className="text-xs text-gray-500">Student</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(student.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
              
              <button 
                onClick={() => setSelectedEventForList(null)}
                className="w-full mt-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:text-white font-bold"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
