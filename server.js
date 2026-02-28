"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var vite_1 = require("vite");
var better_sqlite3_1 = require("better-sqlite3");
var path_1 = require("path");
var url_1 = require("url");
var __dirname = path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url));
var db = new better_sqlite3_1.default('study_assistant.db');
// Initialize Database
db.exec("\n  CREATE TABLE IF NOT EXISTS users (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    username TEXT UNIQUE,\n    password TEXT,\n    role TEXT DEFAULT 'student'\n  );\n\n  CREATE TABLE IF NOT EXISTS learning_paths (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    user_id INTEGER,\n    title TEXT,\n    is_industrial BOOLEAN DEFAULT 0,\n    FOREIGN KEY(user_id) REFERENCES users(id)\n  );\n\n  CREATE TABLE IF NOT EXISTS modules (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    path_id INTEGER,\n    title TEXT,\n    content TEXT,\n    pdf_url TEXT,\n    resource_link TEXT,\n    completed BOOLEAN DEFAULT 0,\n    order_index INTEGER,\n    FOREIGN KEY(path_id) REFERENCES learning_paths(id)\n  );\n\n  CREATE TABLE IF NOT EXISTS events (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    lecturer_id INTEGER,\n    title TEXT,\n    description TEXT,\n    date TEXT,\n    location TEXT,\n    FOREIGN KEY(lecturer_id) REFERENCES users(id)\n  );\n\n  CREATE TABLE IF NOT EXISTS enrollments (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    user_id INTEGER,\n    event_id INTEGER,\n    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,\n    FOREIGN KEY(user_id) REFERENCES users(id),\n    FOREIGN KEY(event_id) REFERENCES events(id)\n  );\n\n  CREATE TABLE IF NOT EXISTS quizzes (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    module_id INTEGER,\n    question TEXT,\n    options TEXT,\n    correct_answer INTEGER,\n    FOREIGN KEY(module_id) REFERENCES modules(id)\n  );\n\n  CREATE TABLE IF NOT EXISTS timetable_entries (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    user_id INTEGER,\n    topic TEXT,\n    start_time TEXT,\n    end_time TEXT,\n    date TEXT,\n    FOREIGN KEY(user_id) REFERENCES users(id)\n  );\n\n  CREATE TABLE IF NOT EXISTS reminders (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    user_id INTEGER,\n    content TEXT,\n    remind_at TEXT,\n    is_done BOOLEAN DEFAULT 0,\n    FOREIGN KEY(user_id) REFERENCES users(id)\n  );\n\n  CREATE TABLE IF NOT EXISTS history (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    user_id INTEGER,\n    action TEXT,\n    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,\n    FOREIGN KEY(user_id) REFERENCES users(id)\n  );\n\n  CREATE TABLE IF NOT EXISTS user_module_progress (\n    user_id INTEGER,\n    module_id INTEGER,\n    completed BOOLEAN DEFAULT 0,\n    PRIMARY KEY(user_id, module_id),\n    FOREIGN KEY(user_id) REFERENCES users(id),\n    FOREIGN KEY(module_id) REFERENCES modules(id)\n  );\n\n  -- Add role column if it doesn't exist (SQLite 3.32.0+)\n  -- For simplicity in this environment, we'll try to add it and ignore error if exists\n");
try {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'");
}
catch (e) { }
try {
    db.exec("ALTER TABLE learning_paths ADD COLUMN is_industrial BOOLEAN DEFAULT 0");
}
catch (e) { }
try {
    db.exec("ALTER TABLE modules ADD COLUMN pdf_url TEXT");
}
catch (e) { }
try {
    db.exec("ALTER TABLE modules ADD COLUMN resource_link TEXT");
}
catch (e) { }
var app = (0, express_1.default)();
app.use(express_1.default.json());
// Auth Routes
app.post('/api/auth/register', function (req, res) {
    var _a = req.body, username = _a.username, password = _a.password, role = _a.role;
    try {
        var stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
        var info = stmt.run(username, password, role || 'student');
        res.json({ id: info.lastInsertRowid, username: username, role: role || 'student' });
    }
    catch (err) {
        res.status(400).json({ error: 'Username already exists' });
    }
});
app.post('/api/auth/login', function (req, res) {
    var _a = req.body, username = _a.username, password = _a.password, role = _a.role;
    var user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ? AND role = ?').get(username, password, role);
    if (user) {
        res.json(user);
    }
    else {
        res.status(401).json({ error: 'Invalid credentials or role' });
    }
});
app.post('/api/auth/change-password', function (req, res) {
    var _a = req.body, userId = _a.userId, newPassword = _a.newPassword;
    try {
        var stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
        stmt.run(newPassword, userId);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update password' });
    }
});
// Learning Path Routes
app.get('/api/learning-paths/:userId', function (req, res) {
    var user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.userId);
    var paths;
    if (user && user.role === 'lecturer') {
        paths = db.prepare('SELECT * FROM learning_paths WHERE user_id = ?').all(req.params.userId);
    }
    else {
        // Students see all paths created by lecturers + their own paths
        paths = db.prepare("\n      SELECT lp.* \n      FROM learning_paths lp\n      JOIN users u ON lp.user_id = u.id\n      WHERE u.role = 'lecturer' OR lp.user_id = ?\n    ").all(req.params.userId);
    }
    res.json(paths);
});
app.post('/api/learning-paths', function (req, res) {
    var _a = req.body, userId = _a.userId, title = _a.title, isIndustrial = _a.isIndustrial;
    var stmt = db.prepare('INSERT INTO learning_paths (user_id, title, is_industrial) VALUES (?, ?, ?)');
    var info = stmt.run(userId, title, isIndustrial ? 1 : 0);
    res.json({ id: info.lastInsertRowid, title: title, is_industrial: isIndustrial });
});
app.get('/api/modules/:pathId', function (req, res) {
    var userId = req.query.userId;
    var modules;
    if (userId) {
        modules = db.prepare("\n      SELECT m.*, COALESCE(ump.completed, 0) as completed\n      FROM modules m\n      LEFT JOIN user_module_progress ump ON m.id = ump.module_id AND ump.user_id = ?\n      WHERE m.path_id = ?\n      ORDER BY m.order_index\n    ").all(userId, req.params.pathId);
    }
    else {
        modules = db.prepare('SELECT * FROM modules WHERE path_id = ? ORDER BY order_index').all(req.params.pathId);
    }
    res.json(modules);
});
app.post('/api/modules', function (req, res) {
    var _a = req.body, pathId = _a.pathId, title = _a.title, content = _a.content, pdfUrl = _a.pdfUrl, resourceLink = _a.resourceLink, orderIndex = _a.orderIndex;
    var stmt = db.prepare('INSERT INTO modules (path_id, title, content, pdf_url, resource_link, order_index) VALUES (?, ?, ?, ?, ?, ?)');
    var info = stmt.run(pathId, title, content, pdfUrl, resourceLink, orderIndex);
    res.json({ id: info.lastInsertRowid, title: title });
});
// Event Routes
app.get('/api/events', function (req, res) {
    var events = db.prepare('SELECT * FROM events ORDER BY date ASC').all();
    res.json(events);
});
app.post('/api/events', function (req, res) {
    var _a = req.body, lecturerId = _a.lecturerId, title = _a.title, description = _a.description, date = _a.date, location = _a.location;
    var stmt = db.prepare('INSERT INTO events (lecturer_id, title, description, date, location) VALUES (?, ?, ?, ?, ?)');
    var info = stmt.run(lecturerId, title, description, date, location);
    res.json({ id: info.lastInsertRowid, title: title });
});
app.get('/api/events/:eventId/enrollments', function (req, res) {
    var enrollments = db.prepare("\n    SELECT users.username, enrollments.timestamp \n    FROM enrollments \n    JOIN users ON enrollments.user_id = users.id \n    WHERE enrollments.event_id = ?\n    ORDER BY enrollments.timestamp DESC\n  ").all(req.params.eventId);
    res.json(enrollments);
});
app.get('/api/enrollments/:userId', function (req, res) {
    var enrollments = db.prepare('SELECT event_id FROM enrollments WHERE user_id = ?').all(req.params.userId);
    res.json(enrollments.map(function (e) { return e.event_id; }));
});
app.post('/api/enrollments', function (req, res) {
    var _a = req.body, userId = _a.userId, eventId = _a.eventId;
    try {
        var stmt = db.prepare('INSERT INTO enrollments (user_id, event_id) VALUES (?, ?)');
        stmt.run(userId, eventId);
        res.json({ success: true });
    }
    catch (err) {
        res.status(400).json({ error: 'Already enrolled' });
    }
});
app.patch('/api/modules/:id/complete', function (req, res) {
    var _a = req.body, completed = _a.completed, userId = _a.userId;
    var stmt = db.prepare("\n    INSERT INTO user_module_progress (user_id, module_id, completed)\n    VALUES (?, ?, ?)\n    ON CONFLICT(user_id, module_id) DO UPDATE SET completed = excluded.completed\n  ");
    stmt.run(userId, req.params.id, completed ? 1 : 0);
    res.json({ success: true });
});
// Quiz Routes
app.get('/api/quizzes/:moduleId', function (req, res) {
    var quizzes = db.prepare('SELECT * FROM quizzes WHERE module_id = ?').all(req.params.moduleId);
    res.json(quizzes.map(function (q) { return (__assign(__assign({}, q), { options: JSON.parse(q.options) })); }));
});
app.post('/api/quizzes', function (req, res) {
    var _a = req.body, moduleId = _a.moduleId, question = _a.question, options = _a.options, correctAnswer = _a.correctAnswer;
    var stmt = db.prepare('INSERT INTO quizzes (module_id, question, options, correct_answer) VALUES (?, ?, ?, ?)');
    var info = stmt.run(moduleId, question, JSON.stringify(options), correctAnswer);
    res.json({ id: info.lastInsertRowid });
});
// Timetable Routes
app.get('/api/timetable/:userId', function (req, res) {
    var entries = db.prepare('SELECT * FROM timetable_entries WHERE user_id = ?').all(req.params.userId);
    res.json(entries);
});
app.post('/api/timetable', function (req, res) {
    var _a = req.body, userId = _a.userId, topic = _a.topic, startTime = _a.startTime, endTime = _a.endTime, date = _a.date;
    var stmt = db.prepare('INSERT INTO timetable_entries (user_id, topic, start_time, end_time, date) VALUES (?, ?, ?, ?, ?)');
    var info = stmt.run(userId, topic, startTime, endTime, date);
    res.json({ id: info.lastInsertRowid });
});
app.delete('/api/timetable/:id', function (req, res) {
    db.prepare('DELETE FROM timetable_entries WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});
// Reminder Routes
app.get('/api/reminders/:userId', function (req, res) {
    var reminders = db.prepare('SELECT * FROM reminders WHERE user_id = ?').all(req.params.userId);
    res.json(reminders);
});
app.post('/api/reminders', function (req, res) {
    var _a = req.body, userId = _a.userId, content = _a.content, remindAt = _a.remindAt;
    var stmt = db.prepare('INSERT INTO reminders (user_id, content, remind_at) VALUES (?, ?, ?)');
    var info = stmt.run(userId, content, remindAt);
    //schedule the reminder --- 
    const remindTime = new Date(remindAt).getTime(); 
    const delay = remindTime - Date.now(); 
    if (delay > 0) { setTimeout(() => { 
        // For now, just log. Later you can push via WebSocket or send to frontend. 
        console.log("Reminder for user " + userId + ": " + content); 
        // Example: if using WebSockets // io.to(userId).emit("reminder", { content }); 
        },delay); 
    }
    res.json({ id: info.lastInsertRowid });
});
app.patch('/api/reminders/:id/toggle', function (req, res) {
    var isDone = req.body.isDone;
    db.prepare('UPDATE reminders SET is_done = ? WHERE id = ?').run(isDone ? 1 : 0, req.params.id);
    res.json({ success: true });
});
app.delete('/api/reminders/:id', function (req, res) {
    db.prepare('DELETE FROM reminders WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});
// History Routes
app.get('/api/history/:userId', function (req, res) {
    var history = db.prepare('SELECT * FROM history WHERE user_id = ? ORDER BY timestamp DESC').all(req.params.userId);
    res.json(history);
});
app.post('/api/history', function (req, res) {
    var _a = req.body, userId = _a.userId, action = _a.action;
    db.prepare('INSERT INTO history (user_id, action) VALUES (?, ?)').run(userId, action);
    res.json({ success: true });
});
// Vite Integration
var startServer = function () { return __awaiter(void 0, void 0, void 0, function () {
    var vite, PORT;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(process.env.NODE_ENV !== 'production')) return [3 /*break*/, 2];
                return [4 /*yield*/, (0, vite_1.createServer)({
                        server: { middlewareMode: true },
                        appType: 'spa',
                    })];
            case 1:
                vite = _a.sent();
                app.use(vite.middlewares);
                return [3 /*break*/, 3];
            case 2:
                app.use(express_1.default.static(path_1.default.join(__dirname, 'dist')));
                app.get('*', function (req, res) {
                    res.sendFile(path_1.default.join(__dirname, 'dist', 'index.html'));
                });
                _a.label = 3;
            case 3:
              const PORT = process.env.PORT || 4000;

                app.listen(PORT, '0.0.0.0', () => {
                console.log(`Server running on http://localhost:${PORT}`);
                });
  
                return [2 /*return*/];
        }
    });
}); };
startServer();
