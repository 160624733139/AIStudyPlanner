import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const apiKey = process.env.GEMINI_API_KEY;
const appUrl = process.env.APP_URL;

console.log("Gemini API Key:", apiKey);
console.log("App URL:", appUrl);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('study_assistant.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'student'
  );

  CREATE TABLE IF NOT EXISTS learning_paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    is_industrial BOOLEAN DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path_id INTEGER,
    title TEXT,
    content TEXT,
    pdf_url TEXT,
    resource_link TEXT,
    completed BOOLEAN DEFAULT 0,
    order_index INTEGER,
    FOREIGN KEY(path_id) REFERENCES learning_paths(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lecturer_id INTEGER,
    title TEXT,
    description TEXT,
    date TEXT,
    location TEXT,
    FOREIGN KEY(lecturer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER,
    question TEXT,
    options TEXT,
    correct_answer INTEGER,
    FOREIGN KEY(module_id) REFERENCES modules(id)
  );

  CREATE TABLE IF NOT EXISTS timetable_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    topic TEXT,
    start_time TEXT,
    end_time TEXT,
    date TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    remind_at TEXT,
    is_done BOOLEAN DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_module_progress (
    user_id INTEGER,
    module_id INTEGER,
    completed BOOLEAN DEFAULT 0,
    PRIMARY KEY(user_id, module_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(module_id) REFERENCES modules(id)
  );
`);

// Add columns if they don't exist (SQLite 3.32.0+)
try {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'");
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE learning_paths ADD COLUMN is_industrial BOOLEAN DEFAULT 0");
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE modules ADD COLUMN pdf_url TEXT");
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE modules ADD COLUMN resource_link TEXT");
} catch (e) {
  // Column already exists
}

const app = express();
app.use(express.json());

// Auth Routes
app.post('/api/auth/register', (req, res) => {
  const { username, password, role } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    const info = stmt.run(username, password, role || 'student');
    res.json({ id: info.lastInsertRowid, username, role: role || 'student' });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ? AND role = ?').get(username, password, role);
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: 'Invalid credentials or role' });
  }
});

app.post('/api/auth/change-password', (req, res) => {
  const { userId, newPassword } = req.body;
  try {
    const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
    stmt.run(newPassword, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Learning Path Routes
app.get('/api/learning-paths/:userId', (req, res) => {
  try {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.userId);
    let paths;
    if (user && user.role === 'lecturer') {
      paths = db.prepare('SELECT * FROM learning_paths WHERE user_id = ?').all(req.params.userId);
    } else {
      // Students see all paths created by lecturers + their own paths
      paths = db.prepare(`
        SELECT lp.* 
        FROM learning_paths lp
        JOIN users u ON lp.user_id = u.id
        WHERE u.role = 'lecturer' OR lp.user_id = ?
      `).all(req.params.userId);
    }
    res.json(paths);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch learning paths' });
  }
});

app.post('/api/learning-paths', (req, res) => {
  try {
    const { userId, title, isIndustrial } = req.body;
    const stmt = db.prepare('INSERT INTO learning_paths (user_id, title, is_industrial) VALUES (?, ?, ?)');
    const info = stmt.run(userId, title, isIndustrial ? 1 : 0);
    res.json({ id: info.lastInsertRowid, title, is_industrial: isIndustrial });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create learning path' });
  }
});

app.get('/api/modules/:pathId', (req, res) => {
  try {
    const userId = req.query.userId;
    let modules;
    if (userId) {
      modules = db.prepare(`
        SELECT m.*, COALESCE(ump.completed, 0) as completed
        FROM modules m
        LEFT JOIN user_module_progress ump ON m.id = ump.module_id AND ump.user_id = ?
        WHERE m.path_id = ?
        ORDER BY m.order_index
      `).all(userId, req.params.pathId);
    } else {
      modules = db.prepare('SELECT * FROM modules WHERE path_id = ? ORDER BY order_index').all(req.params.pathId);
    }
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

app.post('/api/modules', (req, res) => {
  try {
    const { pathId, title, content, pdfUrl, resourceLink, orderIndex } = req.body;
    const stmt = db.prepare('INSERT INTO modules (path_id, title, content, pdf_url, resource_link, order_index) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(pathId, title, content, pdfUrl, resourceLink, orderIndex);
    res.json({ id: info.lastInsertRowid, title });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create module' });
  }
});

// Event Routes
app.get('/api/events', (req, res) => {
  try {
    const events = db.prepare('SELECT * FROM events ORDER BY date ASC').all();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/api/events', (req, res) => {
  try {
    const { lecturerId, title, description, date, location } = req.body;
    const stmt = db.prepare('INSERT INTO events (lecturer_id, title, description, date, location) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(lecturerId, title, description, date, location);
    res.json({ id: info.lastInsertRowid, title });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.get('/api/events/:eventId/enrollments', (req, res) => {
  try {
    const enrollments = db.prepare(`
      SELECT users.username, enrollments.timestamp 
      FROM enrollments 
      JOIN users ON enrollments.user_id = users.id 
      WHERE enrollments.event_id = ?
      ORDER BY enrollments.timestamp DESC
    `).all(req.params.eventId);
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

app.get('/api/enrollments/:userId', (req, res) => {
  try {
    const enrollments = db.prepare('SELECT event_id FROM enrollments WHERE user_id = ?').all(req.params.userId);
    res.json(enrollments.map((e) => e.event_id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

app.post('/api/enrollments', (req, res) => {
  const { userId, eventId } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO enrollments (user_id, event_id) VALUES (?, ?)');
    stmt.run(userId, eventId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Already enrolled' });
  }
});

app.patch('/api/modules/:id/complete', (req, res) => {
  try {
    const { completed, userId } = req.body;
    const stmt = db.prepare(`
      INSERT INTO user_module_progress (user_id, module_id, completed)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, module_id) DO UPDATE SET completed = excluded.completed
    `);
    stmt.run(userId, req.params.id, completed ? 1 : 0);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update module completion' });
  }
});

// Quiz Routes
app.get('/api/quizzes/:moduleId', (req, res) => {
  try {
    const quizzes = db.prepare('SELECT * FROM quizzes WHERE module_id = ?').all(req.params.moduleId);
    res.json(quizzes.map((q) => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

app.post('/api/quizzes', (req, res) => {
  try {
    const { moduleId, question, options, correctAnswer } = req.body;
    const stmt = db.prepare('INSERT INTO quizzes (module_id, question, options, correct_answer) VALUES (?, ?, ?, ?)');
    const info = stmt.run(moduleId, question, JSON.stringify(options), correctAnswer);
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Timetable Routes
app.get('/api/timetable/:userId', (req, res) => {
  try {
    const entries = db.prepare('SELECT * FROM timetable_entries WHERE user_id = ?').all(req.params.userId);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timetable entries' });
  }
});

app.post('/api/timetable', (req, res) => {
  try {
    const { userId, topic, startTime, endTime, date } = req.body;
    const stmt = db.prepare('INSERT INTO timetable_entries (user_id, topic, start_time, end_time, date) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(userId, topic, startTime, endTime, date);
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create timetable entry' });
  }
});

app.delete('/api/timetable/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM timetable_entries WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete timetable entry' });
  }
});

// Reminder Routes
app.get('/api/reminders/:userId', (req, res) => {
  try {
    const reminders = db.prepare('SELECT * FROM reminders WHERE user_id = ?').all(req.params.userId);
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

app.post('/api/reminders', (req, res) => {
  try {
    const { userId, content, remindAt } = req.body;
    const stmt = db.prepare('INSERT INTO reminders (user_id, content, remind_at) VALUES (?, ?, ?)');
    const info = stmt.run(userId, content, remindAt);
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

app.patch('/api/reminders/:id/toggle', (req, res) => {
  try {
    const { isDone } = req.body;
    db.prepare('UPDATE reminders SET is_done = ? WHERE id = ?').run(isDone ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle reminder' });
  }
});

app.delete('/api/reminders/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM reminders WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// History Routes
app.get('/api/history/:userId', (req, res) => {
  try {
    const history = db.prepare('SELECT * FROM history WHERE user_id = ? ORDER BY timestamp DESC').all(req.params.userId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.post('/api/history', (req, res) => {
  try {
    const { userId, action } = req.body;
    db.prepare('INSERT INTO history (user_id, action) VALUES (?, ?)').run(userId, action);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record history' });
  }
});

// Vite Integration
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});