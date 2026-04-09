import { Router } from 'express';
import { runSQL, getOne } from '../db.js';

const router = Router();

// Student Signup
router.post('/signup', (req, res) => {
  try {
    const { username, password, name, age, grade, board, goals, level, study_time, language, device_type, connectivity, class_code } = req.body;
    
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, and name are required' });
    }

    // Check if username exists
    const existing = getOne('SELECT id FROM students WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const result = runSQL(
      `INSERT INTO students (username, password, name, age, grade, board, goals, level, study_time, language, device_type, connectivity, class_code, last_active_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [username, password, name, age || null, grade || null, board || 'CBSE', goals || 'Math', level || 'beginner', study_time || '30 min', language || 'en', device_type || 'mobile', connectivity || '3g', class_code || '']
    );

    const student = getOne('SELECT * FROM students WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ ...student, password: undefined });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Student Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const student = getOne('SELECT * FROM students WHERE username = ? AND password = ?', [username, password]);
    if (!student) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last active
    runSQL("UPDATE students SET last_active_date = datetime('now') WHERE id = ?", [student.id]);
    runSQL('INSERT INTO sessions (student_id) VALUES (?)', [student.id]);

    res.json({ ...student, password: undefined });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Teacher Signup
router.post('/teacher/signup', (req, res) => {
  try {
    const { username, password, name, class_code, school } = req.body;
    if (!username || !password || !name || !class_code) {
      return res.status(400).json({ error: 'Username, password, name, and class code are required' });
    }

    const existing = getOne('SELECT id FROM teachers WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    runSQL(
      'INSERT INTO teachers (username, password, name, class_code, school) VALUES (?, ?, ?, ?, ?)',
      [username, password, name, class_code, school || '']
    );

    res.status(201).json({ success: true, class_code });
  } catch (err) {
    console.error('Teacher signup error:', err);
    res.status(500).json({ error: 'Teacher signup failed' });
  }
});

// Teacher Login
router.post('/teacher/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const teacher = getOne('SELECT * FROM teachers WHERE username = ? AND password = ?', [username, password]);
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ id: teacher.id, name: teacher.name, class_code: teacher.class_code, school: teacher.school, authenticated: true });
  } catch (err) {
    console.error('Teacher login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
