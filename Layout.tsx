import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar, Settings, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: ReactNode;
  user: any;
  onLogout: () => void;
}

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Learning Plans', path: '/learning-plans', icon: BookOpen },
    { name: 'Timetable', path: '/timetable', icon: Calendar },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-black/5 dark:border-white/5 flex items-center px-4 z-50">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-sapphire hover:bg-sapphire/5 rounded-lg transition-all"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="ml-3 flex items-center gap-2">
          <Sparkles className="text-sapphire" size={20} />
          <span className="font-bold text-gray-900 dark:text-white">Smart AI Study Planner</span>
        </div>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-black/5 dark:border-white/5 
        flex flex-col z-50 transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center gap-3">
          <img 
            src="/assets/logo.png" 
            alt="Study spark" 
            className="h-16 w-auto object-contain" 
          />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
          </h1>
        </div>

        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-sapphire text-white shadow-lg shadow-sapphire/20' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-sapphire/5 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-sapphire/10 flex items-center justify-center text-sapphire font-bold">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate dark:text-white">{user.username}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 mt-16 lg:mt-0">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
