import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vercel Serverless Hack: Vercel's filesystem is read-only except for /tmp.
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
const DB_PATH = isVercel 
  ? '/tmp/pathwise.db' 
  : path.join(__dirname, 'pathwise.db');

// Create database with better-sqlite3 (10x faster, production-ready)
const db = new Database(DB_PATH);

// Performance pragmas for handling large-scale concurrent access
db.pragma('journal_mode = WAL');       // Write-Ahead Logging for concurrent reads/writes
db.pragma('cache_size = -16000');      // 16MB cache for fast queries
db.pragma('synchronous = NORMAL');     // Balance of speed and safety
db.pragma('temp_store = MEMORY');      // Temp data in memory
db.pragma('mmap_size = 268435456');    // 256MB memory-mapped I/O for large datasets
db.pragma('page_size = 4096');         // Optimal page size
db.pragma('busy_timeout = 5000');      // Wait 5s on lock contention

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER DEFAULT 14,
    grade INTEGER DEFAULT 8,
    board TEXT DEFAULT 'CBSE',
    goals TEXT DEFAULT 'Math',
    level TEXT DEFAULT 'beginner',
    study_time TEXT DEFAULT '30 min',
    language TEXT DEFAULT 'en',
    device_type TEXT DEFAULT 'mobile',
    connectivity TEXT DEFAULT '3g',
    streak_count INTEGER DEFAULT 0,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    progress_percent REAL DEFAULT 0,
    needs_reengagement INTEGER DEFAULT 0,
    username TEXT DEFAULT '',
    password TEXT DEFAULT '',
    class_code TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pin TEXT DEFAULT '1234',
    username TEXT DEFAULT '',
    password TEXT DEFAULT '',
    class_code TEXT DEFAULT '',
    school TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS learning_paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    path_json TEXT NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ai_powered INTEGER DEFAULT 0,
    update_reason TEXT DEFAULT '',
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS topic_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    path_id INTEGER,
    topic_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    quiz_score INTEGER,
    feedback TEXT,
    attempts INTEGER DEFAULT 0,
    last_attempt DATETIME,
    completed_at DATETIME,
    weak_concepts TEXT DEFAULT '',
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    action TEXT DEFAULT '',
    topic TEXT,
    score INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS student_syllabus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    chapters TEXT NOT NULL DEFAULT '[]',
    topics TEXT NOT NULL DEFAULT '[]',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject),
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    topic_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'complete',
    weak_concepts TEXT DEFAULT '[]',
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
  );
`);

// Migration: add columns safely
const addColumnSafe = (table, column, def) => {
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`); } catch(e) {}
};

addColumnSafe('students', 'username', "TEXT DEFAULT ''");
addColumnSafe('students', 'password', "TEXT DEFAULT ''");
addColumnSafe('students', 'board', "TEXT DEFAULT 'CBSE'");
addColumnSafe('students', 'class_code', "TEXT DEFAULT ''");
addColumnSafe('students', 'last_active_date', "DATETIME");
addColumnSafe('teachers', 'username', "TEXT DEFAULT ''");
addColumnSafe('teachers', 'password', "TEXT DEFAULT ''");
addColumnSafe('teachers', 'class_code', "TEXT DEFAULT ''");
addColumnSafe('teachers', 'school', "TEXT DEFAULT ''");
addColumnSafe('topic_progress', 'path_id', "INTEGER");
addColumnSafe('topic_progress', 'weak_concepts', "TEXT DEFAULT ''");
addColumnSafe('topic_progress', 'attempts', "INTEGER DEFAULT 0");
addColumnSafe('topic_progress', 'completed_at', "DATETIME");
addColumnSafe('learning_paths', 'update_reason', "TEXT DEFAULT ''");
addColumnSafe('student_syllabus', 'updated_at', "DATETIME DEFAULT CURRENT_TIMESTAMP");

// Ensure quiz_attempts table exists (migration for existing DBs)
try {
  db.exec(`CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    topic_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'complete',
    weak_concepts TEXT DEFAULT '[]',
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
  )`);
} catch(e) {}

// Indexes for fast queries at scale (thousands of students)
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
  CREATE INDEX IF NOT EXISTS idx_students_class_code ON students(class_code);
  CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
  CREATE INDEX IF NOT EXISTS idx_students_board ON students(board);
  CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);
  CREATE INDEX IF NOT EXISTS idx_teachers_class_code ON teachers(class_code);
  CREATE INDEX IF NOT EXISTS idx_learning_paths_student ON learning_paths(student_id);
  CREATE INDEX IF NOT EXISTS idx_topic_progress_student ON topic_progress(student_id);
  CREATE INDEX IF NOT EXISTS idx_topic_progress_topic ON topic_progress(topic_name);
  CREATE INDEX IF NOT EXISTS idx_topic_progress_compound ON topic_progress(student_id, topic_name);
  CREATE INDEX IF NOT EXISTS idx_topic_progress_status ON topic_progress(student_id, status);
  CREATE INDEX IF NOT EXISTS idx_sessions_student ON sessions(student_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON sessions(student_id, timestamp);
  CREATE INDEX IF NOT EXISTS idx_student_syllabus_student ON student_syllabus(student_id);
  CREATE INDEX IF NOT EXISTS idx_student_syllabus_subject ON student_syllabus(student_id, subject);
  CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);
  CREATE INDEX IF NOT EXISTS idx_quiz_attempts_topic ON quiz_attempts(student_id, topic_name);
`);

// Seed demo teacher if none
const teacherCount = db.prepare('SELECT COUNT(*) as count FROM teachers').get();
if (teacherCount.count === 0) {
  db.prepare(`INSERT INTO teachers (name, pin, username, password, class_code, school) VALUES (?, ?, ?, ?, ?, ?)`)
    .run('Demo Teacher', '1234', 'teacher1', '1234', 'CLASS-8A', 'Demo School');
  console.log('👨‍🏫 Demo teacher seeded (teacher1/1234, class: CLASS-8A)');
}

console.log('✅ Database initialized (better-sqlite3, WAL mode, 16MB cache, indexed)');

// ===== Helper functions =====
export function runSQL(sql, params = []) {
  return db.prepare(sql).run(...params);
}

export function getOne(sql, params = []) {
  return db.prepare(sql).get(...params);
}

export function getAll(sql, params = []) {
  return db.prepare(sql).all(...params);
}

// Transaction helper for batch operations
export function runTransaction(fn) {
  const transaction = db.transaction(fn);
  return transaction();
}

export default db;
