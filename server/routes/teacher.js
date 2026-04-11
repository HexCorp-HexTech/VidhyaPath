import { Router } from 'express';
import { getOne, getAll } from '../db.js';

const router = Router();

// Teacher login (legacy PIN support + new auth)
router.post('/login', (req, res) => {
  try {
    const { username, password, pin } = req.body;
    
    // Support legacy PIN login
    if (pin) {
      const teacher = getOne('SELECT * FROM teachers WHERE password = ?', [pin]);
      if (!teacher) return res.status(401).json({ error: 'Invalid PIN' });
      return res.json({ id: teacher.id, name: teacher.name, class_code: teacher.class_code, school: teacher.school, authenticated: true });
    }

    // Username/password login
    if (!username || !password) return res.status(400).json({ error: 'Credentials required' });

    const teacher = getOne('SELECT * FROM teachers WHERE username = ? AND password = ?', [username, password]);
    if (!teacher) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ id: teacher.id, name: teacher.name, class_code: teacher.class_code, school: teacher.school, authenticated: true });
  } catch (err) {
    console.error('Teacher login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get students for teacher's class only
router.get('/students', (req, res) => {
  try {
    const classCode = req.query.class_code;
    
    let students;
    if (classCode) {
      // Scoped to teacher's class
      students = getAll('SELECT * FROM students WHERE class_code = ? ORDER BY created_at DESC', [classCode]);
    } else {
      // Fallback: show all (for demo)
      students = getAll('SELECT * FROM students ORDER BY created_at DESC');
    }
    
    const summaries = students.map(student => {
      const progress = getAll('SELECT * FROM topic_progress WHERE student_id = ?', [student.id]);
      
      const totalTopics = progress.length;
      const completedTopics = progress.filter(p => ['complete', 'strong', 'weak'].includes(p.status)).length;
      const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      // Unpack weak areas and explicit test scores
      const recentScores = [];
      const weakAreas = [];
      
      progress.forEach(p => {
        if (p.quiz_score !== null && p.quiz_score !== undefined) {
          recentScores.push({ topic: p.topic_name, score: `${p.quiz_score}/5`, status: p.status });
        }
        
        if (p.status === 'weak' || p.weak_concepts) {
          try {
            const concepts = p.weak_concepts ? JSON.parse(p.weak_concepts) : [];
            if (Array.isArray(concepts)) {
              concepts.forEach(c => {
                if (!weakAreas.includes(c)) weakAreas.push(`${p.topic_name}: ${c.substring(0, 40)}...`);
              });
            } else if (p.status === 'weak') {
              weakAreas.push(p.topic_name);
            }
          } catch(e) {
            if (p.status === 'weak') weakAreas.push(p.topic_name);
          }
        }
      });

      let daysSinceActive = 0;
      if (student.last_active_date) {
        daysSinceActive = Math.floor((new Date() - new Date(student.last_active_date)) / (1000 * 60 * 60 * 24));
      }

      return {
        id: student.id, name: student.name, grade: student.grade,
        board: student.board, goals: student.goals, level: student.level,
        progress_percent: progressPercent,
        completed_topics: completedTopics, total_topics: totalTopics,
        weak_areas: weakAreas.slice(0, 8), // Limit to top 8 distinct weaknesses
        recent_scores: recentScores.slice(-5), // Last 5 scores
        streak_count: student.streak_count || 0,
        last_active: student.last_active_date,
        days_since_active: daysSinceActive,
        is_inactive: daysSinceActive >= 5
      };
    });

    res.json(summaries);
  } catch (err) {
    console.error('Error getting teacher students:', err);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

// Get all quiz attempts for a specific student (full history)
router.get('/student/:id/quiz-history', (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const student = getOne('SELECT id, name, grade, board FROM students WHERE id = ?', [studentId]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Try quiz_attempts table first (full history), fall back to topic_progress
    let attempts = [];
    try {
      attempts = getAll(
        `SELECT id, topic_name, score, total, status, weak_concepts, attempted_at
         FROM quiz_attempts WHERE student_id = ? ORDER BY attempted_at DESC`,
        [studentId]
      ).map(a => ({
        id: a.id,
        topic: a.topic_name,
        score: a.score,
        total: a.total,
        percentage: Math.round((a.score / (a.total || 1)) * 100),
        status: a.status,
        weak_concepts: (() => { try { return JSON.parse(a.weak_concepts || '[]'); } catch { return []; } })(),
        attempted_at: a.attempted_at,
      }));
    } catch(e) {
      // quiz_attempts table may not exist in older DBs
    }

    // If no attempts table data, fall back to topic_progress records
    if (attempts.length === 0) {
      const progress = getAll(
        `SELECT topic_name, quiz_score, attempts, status, weak_concepts, last_attempt
         FROM topic_progress WHERE student_id = ? AND quiz_score IS NOT NULL ORDER BY last_attempt DESC`,
        [studentId]
      );
      attempts = progress.map(p => ({
        id: null,
        topic: p.topic_name,
        score: p.quiz_score,
        total: 5,
        percentage: Math.round((p.quiz_score / 5) * 100),
        status: p.status,
        weak_concepts: (() => { try { return JSON.parse(p.weak_concepts || '[]'); } catch { return []; } })(),
        attempted_at: p.last_attempt,
        attempt_count: p.attempts,
      }));
    }

    res.json({ student, attempts });
  } catch (err) {
    console.error('Quiz history error:', err);
    res.status(500).json({ error: 'Failed to get quiz history' });
  }
});

// Monthly report for a student: grouped by month, summary stats
router.get('/student/:id/monthly-report', (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const student = getOne('SELECT id, name, grade, board, goals, level FROM students WHERE id = ?', [studentId]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Fetch all topic progress
    const allProgress = getAll(
      `SELECT topic_name, quiz_score, attempts, status, weak_concepts, last_attempt
       FROM topic_progress WHERE student_id = ?`,
      [studentId]
    );

    // Try quiz_attempts for monthly breakdown
    let monthlyData = {};
    try {
      const attempts = getAll(
        `SELECT topic_name, score, total, status, attempted_at
         FROM quiz_attempts WHERE student_id = ? ORDER BY attempted_at ASC`,
        [studentId]
      );

      attempts.forEach(a => {
        const d = new Date(a.attempted_at);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthLabel, key: monthKey, attempts: 0, total_score: 0, total_possible: 0, topics: new Set(), strong: 0, weak: 0 };
        }
        monthlyData[monthKey].attempts += 1;
        monthlyData[monthKey].total_score += a.score;
        monthlyData[monthKey].total_possible += (a.total || 5);
        monthlyData[monthKey].topics.add(a.topic_name);
        if (a.status === 'strong') monthlyData[monthKey].strong += 1;
        if (a.status === 'weak') monthlyData[monthKey].weak += 1;
      });
    } catch(e) {
      // Fall back to topic_progress last_attempt dates
      allProgress.forEach(p => {
        if (!p.last_attempt) return;
        const d = new Date(p.last_attempt);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthLabel, key: monthKey, attempts: 0, total_score: 0, total_possible: 0, topics: new Set(), strong: 0, weak: 0 };
        }
        monthlyData[monthKey].attempts += (p.attempts || 1);
        monthlyData[monthKey].total_score += (p.quiz_score || 0);
        monthlyData[monthKey].total_possible += 5;
        monthlyData[monthKey].topics.add(p.topic_name);
        if (p.status === 'strong') monthlyData[monthKey].strong += 1;
        if (p.status === 'weak') monthlyData[monthKey].weak += 1;
      });
    }

    const months = Object.values(monthlyData)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(m => ({
        month: m.month,
        key: m.key,
        attempts: m.attempts,
        avg_score_pct: m.total_possible > 0 ? Math.round((m.total_score / m.total_possible) * 100) : 0,
        topics_covered: m.topics.size,
        strong_topics: m.strong,
        weak_topics: m.weak,
      }));

    // Overall summary
    const totalTopics = allProgress.length;
    const strongTopics = allProgress.filter(p => p.status === 'strong').length;
    const weakTopics = allProgress.filter(p => p.status === 'weak').length;
    const completedTopics = allProgress.filter(p => ['complete', 'strong'].includes(p.status)).length;
    const avgScore = allProgress.filter(p => p.quiz_score !== null).length > 0
      ? Math.round(allProgress.filter(p => p.quiz_score !== null).reduce((s, p) => s + (p.quiz_score || 0), 0) / allProgress.filter(p => p.quiz_score !== null).length * 20)
      : 0;

    const weakAreas = allProgress
      .filter(p => p.status === 'weak')
      .flatMap(p => { try { return JSON.parse(p.weak_concepts || '[]').slice(0, 2); } catch { return [p.topic_name]; } })
      .slice(0, 10);

    res.json({
      student,
      summary: { total_topics: totalTopics, completed_topics: completedTopics, strong_topics: strongTopics, weak_topics: weakTopics, avg_score_pct: avgScore },
      months,
      weak_areas: weakAreas,
    });
  } catch (err) {
    console.error('Monthly report error:', err);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

export default router;
