/**
 * Mock Test Data Seeder — 50 Indian-origin students
 * 7 students flagged as needing help (weak in multiple topics, low scores)
 * Run: node seed_mock_students.js
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'pathwise.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

// ── Indian-origin student names ──────────────────────────────────────────────
const studentsData = [
  // 7 students NEEDING HELP (low scores, multiple weak topics)
  { name: 'Arjun Sharma',      level: 'beginner',     needsHelp: true },
  { name: 'Priya Kumari',      level: 'beginner',     needsHelp: true },
  { name: 'Ravi Vishwakarma',  level: 'beginner',     needsHelp: true },
  { name: 'Kavita Yadav',      level: 'beginner',     needsHelp: true },
  { name: 'Sunil Paswan',      level: 'beginner',     needsHelp: true },
  { name: 'Meena Devi',        level: 'beginner',     needsHelp: true },
  { name: 'Deepak Rajbhar',    level: 'beginner',     needsHelp: true },

  // 43 students performing at various levels
  { name: 'Ananya Gupta',       level: 'intermediate' },
  { name: 'Rohan Mehta',        level: 'advanced' },
  { name: 'Ishita Patel',       level: 'intermediate' },
  { name: 'Vivek Singh',        level: 'advanced' },
  { name: 'Sneha Reddy',        level: 'intermediate' },
  { name: 'Aditya Joshi',       level: 'advanced' },
  { name: 'Pooja Deshmukh',     level: 'intermediate' },
  { name: 'Rahul Verma',        level: 'intermediate' },
  { name: 'Nisha Iyer',         level: 'advanced' },
  { name: 'Amit Tiwari',        level: 'intermediate' },
  { name: 'Divya Nair',         level: 'advanced' },
  { name: 'Siddharth Kapoor',   level: 'intermediate' },
  { name: 'Ritika Malhotra',    level: 'advanced' },
  { name: 'Kunal Saxena',       level: 'intermediate' },
  { name: 'Tanvi Bhat',         level: 'advanced' },
  { name: 'Harsh Pandey',       level: 'intermediate' },
  { name: 'Simran Kaur',        level: 'advanced' },
  { name: 'Manish Dubey',       level: 'intermediate' },
  { name: 'Anjali Mishra',      level: 'intermediate' },
  { name: 'Varun Chauhan',      level: 'advanced' },
  { name: 'Shruti Kulkarni',    level: 'intermediate' },
  { name: 'Akash Thakur',       level: 'advanced' },
  { name: 'Megha Banerjee',     level: 'intermediate' },
  { name: 'Nikhil Srivastava',  level: 'advanced' },
  { name: 'Swati Aggarwal',     level: 'intermediate' },
  { name: 'Dev Chatterjee',     level: 'advanced' },
  { name: 'Neha Rawat',         level: 'intermediate' },
  { name: 'Gaurav Bhatt',       level: 'intermediate' },
  { name: 'Pallavi Menon',      level: 'advanced' },
  { name: 'Rajesh Pillai',      level: 'intermediate' },
  { name: 'Kriti Agarwal',      level: 'advanced' },
  { name: 'Saurabh Rastogi',    level: 'intermediate' },
  { name: 'Tanya Sethi',        level: 'advanced' },
  { name: 'Mohit Goswami',      level: 'intermediate' },
  { name: 'Aarti Hegde',        level: 'advanced' },
  { name: 'Pankaj Rana',        level: 'intermediate' },
  { name: 'Ritu Bose',          level: 'intermediate' },
  { name: 'Ashok Tripathi',     level: 'intermediate' },
  { name: 'Suman Das',          level: 'advanced' },
  { name: 'Vikram Rathore',     level: 'advanced' },
  { name: 'Lakshmi Krishnan',   level: 'intermediate' },
  { name: 'Chetan Naik',        level: 'intermediate' },
  { name: 'Bhavna Choudhary',   level: 'advanced' },
  { name: 'Yash Shukla',        level: 'intermediate' },
];

// ── Topics pool ──────────────────────────────────────────────────────────────
const mathTopics = [
  'Linear Equations', 'Quadratic Equations', 'Polynomials', 'Trigonometry',
  'Probability', 'Statistics', 'Mensuration', 'Circles and Theorems',
  'Number Systems', 'Coordinate Geometry', 'Algebra Basics', 'Surface Area and Volume',
  'Sequences and Series', 'Sets and Venn Diagrams', 'Ratio and Proportion'
];

const weakConcepts = {
  'Linear Equations': ['variable isolation', 'balancing equations', 'word problems'],
  'Quadratic Equations': ['factoring', 'discriminant', 'completing the square'],
  'Polynomials': ['degree identification', 'factor theorem', 'remainder theorem'],
  'Trigonometry': ['sin/cos/tan ratios', 'angle measurement', 'identity proofs'],
  'Probability': ['conditional probability', 'independent events', 'Bayes theorem'],
  'Statistics': ['mean vs median', 'standard deviation', 'data interpretation'],
  'Mensuration': ['area formulas', 'volume calculation', 'unit conversion'],
  'Circles and Theorems': ['tangent properties', 'arc length', 'sector area'],
  'Number Systems': ['irrational numbers', 'prime factorization', 'HCF/LCM'],
  'Coordinate Geometry': ['slope calculation', 'distance formula', 'midpoint'],
  'Algebra Basics': ['simplification', 'like terms', 'exponent rules'],
  'Surface Area and Volume': ['cylinder volume', 'cone surface area', 'composite solids'],
  'Sequences and Series': ['AP formula', 'GP common ratio', 'sum of n terms'],
  'Sets and Venn Diagrams': ['union/intersection', 'subset identification', 'De Morgan laws'],
  'Ratio and Proportion': ['cross multiplication', 'direct proportion', 'inverse proportion']
};

// ── Helper: random int in range ──────────────────────────────────────────────
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr, n) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

// ── Ensure class code and teacher exist ──────────────────────────────────────
const CLASS_CODE = 'CLASS-8A';
const teacher = db.prepare('SELECT id FROM teachers WHERE class_code = ?').get(CLASS_CODE);
if (!teacher) {
  console.error(`❌ No teacher found with class_code "${CLASS_CODE}". Seed a teacher first.`);
  process.exit(1);
}

console.log(`\n🎓 Seeding 50 mock students into class "${CLASS_CODE}"...\n`);

const insertStudent = db.prepare(`
  INSERT INTO students (name, age, grade, board, goals, level, study_time, language, device_type, connectivity, streak_count, last_active, progress_percent, needs_reengagement, username, password, class_code)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertProgress = db.prepare(`
  INSERT INTO topic_progress (student_id, topic_name, status, quiz_score, feedback, attempts, last_attempt, completed_at, weak_concepts)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const boards = ['CBSE', 'ICSE', 'State Board'];

const seedAll = db.transaction(() => {
  for (const s of studentsData) {
    const age = randInt(13, 16);
    const grade = randInt(8, 10);
    const board = boards[randInt(0, boards.length - 1)];
    const streak = s.needsHelp ? randInt(0, 3) : randInt(2, 45);
    const studyTime = s.needsHelp ? '15 min' : ['30 min', '45 min', '1 hour'][randInt(0, 2)];

    // Days since active
    const daysAgo = s.needsHelp ? randInt(3, 12) : randInt(0, 4);
    const lastActive = new Date(Date.now() - daysAgo * 86400000).toISOString();

    // Username: lowercase, no spaces
    const username = s.name.toLowerCase().replace(/\s+/g, '_');

    // Progress percent
    let progressPercent;
    if (s.needsHelp) {
      progressPercent = randInt(5, 32);
    } else if (s.level === 'advanced') {
      progressPercent = randInt(70, 98);
    } else {
      progressPercent = randInt(40, 78);
    }

    const result = insertStudent.run(
      s.name, age, grade, board, 'Math', s.level, studyTime, 'en',
      ['mobile', 'desktop', 'tablet'][randInt(0, 2)],
      ['3g', '4g', 'wifi'][randInt(0, 2)],
      streak, lastActive, progressPercent,
      s.needsHelp ? 1 : 0,
      username, '1234', CLASS_CODE
    );

    const studentId = result.lastInsertRowid;

    // Generate quiz topic progress
    if (s.needsHelp) {
      // Struggling students: many weak topics, low scores
      const topicCount = randInt(5, 8);
      const topics = pick(mathTopics, topicCount);
      for (const topic of topics) {
        const score = randInt(0, 2); // very low
        const status = 'weak';
        const attempts = randInt(1, 3);
        const concepts = pick(weakConcepts[topic] || [], randInt(1, 3));
        const dAgo = randInt(1, 14);
        const lastAttempt = new Date(Date.now() - dAgo * 86400000).toISOString();

        insertProgress.run(
          studentId, topic, status, score,
          `Needs significant improvement in ${topic}`,
          attempts, lastAttempt, null,
          JSON.stringify(concepts)
        );
      }
    } else if (s.level === 'advanced') {
      // Strong students: high scores, mostly strong/complete
      const topicCount = randInt(6, 12);
      const topics = pick(mathTopics, topicCount);
      for (const topic of topics) {
        const score = randInt(4, 5);
        const status = score === 5 ? 'strong' : 'complete';
        const attempts = randInt(1, 2);
        const dAgo = randInt(0, 7);
        const lastAttempt = new Date(Date.now() - dAgo * 86400000).toISOString();
        const completedAt = status === 'strong' ? lastAttempt : null;

        insertProgress.run(
          studentId, topic, status, score,
          `Good understanding of ${topic}`,
          attempts, lastAttempt, completedAt,
          '[]'
        );
      }
    } else {
      // Intermediate students: mixed scores
      const topicCount = randInt(4, 9);
      const topics = pick(mathTopics, topicCount);
      for (const topic of topics) {
        const score = randInt(2, 5);
        let status;
        if (score >= 4) status = score === 5 ? 'strong' : 'complete';
        else if (score <= 2) status = 'weak';
        else status = 'complete';

        const attempts = randInt(1, 4);
        const concepts = score <= 2 ? pick(weakConcepts[topic] || [], randInt(1, 2)) : [];
        const dAgo = randInt(0, 10);
        const lastAttempt = new Date(Date.now() - dAgo * 86400000).toISOString();

        insertProgress.run(
          studentId, topic, status, score,
          score <= 2 ? `Needs practice in ${topic}` : `Progressing well in ${topic}`,
          attempts, lastAttempt, score >= 4 ? lastAttempt : null,
          JSON.stringify(concepts)
        );
      }
    }

    const helpTag = s.needsHelp ? ' ⚠️ NEEDS HELP' : '';
    console.log(`  ✅ ${s.name} (${s.level}, ${progressPercent}% progress, streak ${streak}d)${helpTag}`);
  }
});

seedAll();

const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students WHERE class_code = ?').get(CLASS_CODE);
const totalProgress = db.prepare('SELECT COUNT(*) as count FROM topic_progress').get();

console.log(`
╔══════════════════════════════════════════════════════╗
║   ✅ Mock Data Seeded Successfully!                 ║
║                                                      ║
║   Students in ${CLASS_CODE}: ${String(totalStudents.count).padStart(3)}                          ║
║   Quiz results: ${String(totalProgress.count).padStart(4)}                              ║
║   Students needing help: 7                           ║
║                                                      ║
║   Login as any student: username/1234                ║
║   Teacher login: teacher1/1234                       ║
╚══════════════════════════════════════════════════════╝
`);

db.close();
