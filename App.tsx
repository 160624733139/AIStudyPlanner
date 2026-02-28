/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LearningPlans from './pages/LearningPlans';
import Timetable from './pages/Timetable';
import Settings from './pages/Settings';
import Layout from './components/Layout';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Dashboard user={user} /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/learning-plans" 
          element={user ? <Layout user={user} onLogout={handleLogout}><LearningPlans user={user} /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/timetable" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Timetable user={user} /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/settings" 
          element={user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Settings user={user} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            </Layout>
          ) : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}
