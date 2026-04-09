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

export default router;
