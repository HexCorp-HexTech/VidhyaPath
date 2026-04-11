import { Router } from 'express';
import { getOne, getAll } from '../db.js';
import { generateTeacherReport, isAIAvailable } from '../claude.js';

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

// Get detailed quiz scores for all students in a class
router.get('/quiz-scores', (req, res) => {
  try {
    const classCode = req.query.class_code;
    
    let students;
    if (classCode) {
      students = getAll('SELECT id, name, grade, board FROM students WHERE class_code = ? ORDER BY name ASC', [classCode]);
    } else {
      students = getAll('SELECT id, name, grade, board FROM students ORDER BY name ASC');
    }

    const allScores = [];
    
    for (const student of students) {
      const progress = getAll(
        'SELECT topic_name, quiz_score, attempts, status, weak_concepts, last_attempt FROM topic_progress WHERE student_id = ? AND quiz_score IS NOT NULL ORDER BY last_attempt DESC',
        [student.id]
      );

      for (const p of progress) {
        let weakConcepts = [];
        try {
          weakConcepts = p.weak_concepts ? JSON.parse(p.weak_concepts) : [];
          if (!Array.isArray(weakConcepts)) weakConcepts = [];
        } catch { weakConcepts = []; }

        allScores.push({
          student_id: student.id,
          student_name: student.name,
          grade: student.grade,
          board: student.board,
          topic: p.topic_name,
          score: p.quiz_score,
          total: 5,
          percentage: Math.round((p.quiz_score / 5) * 100),
          attempts: p.attempts || 1,
          status: p.status,
          weak_concepts: weakConcepts.map(c => typeof c === 'string' ? c.substring(0, 60) : ''),
          last_attempt: p.last_attempt
        });
      }
    }

    res.json({ scores: allScores, student_count: students.length });
  } catch (err) {
    console.error('Quiz scores error:', err);
    res.status(500).json({ error: 'Failed to get quiz scores' });
  }
});

// Generate AI-powered class analytics report
router.post('/ai-report', async (req, res) => {
  try {
    const { class_code } = req.body;

    let students;
    if (class_code) {
      students = getAll('SELECT * FROM students WHERE class_code = ? ORDER BY name ASC', [class_code]);
    } else {
      students = getAll('SELECT * FROM students ORDER BY name ASC');
    }

    if (students.length === 0) {
      return res.json({ report: null, message: 'No students in class' });
    }

    // Build comprehensive class data for AI
    const studentSummaries = [];
    const topicWeakMap = {};

    for (const student of students) {
      const progress = getAll(
        'SELECT topic_name, quiz_score, attempts, status, weak_concepts FROM topic_progress WHERE student_id = ?',
        [student.id]
      );

      const quizzed = progress.filter(p => p.quiz_score !== null && p.quiz_score !== undefined);
      const avgScore = quizzed.length > 0
        ? Math.round((quizzed.reduce((sum, p) => sum + p.quiz_score, 0) / quizzed.length) * 10) / 10
        : 0;

      const weakTopics = progress
        .filter(p => p.status === 'weak')
        .map(p => p.topic_name);

      // Track class-wide weak topics
      weakTopics.forEach(t => {
        topicWeakMap[t] = (topicWeakMap[t] || 0) + 1;
      });

      const completedCount = progress.filter(p => ['complete', 'strong'].includes(p.status)).length;
      let statusLabel = 'on-track';
      if (weakTopics.length >= 3) statusLabel = 'struggling';
      else if (avgScore < 2 && quizzed.length > 0) statusLabel = 'needs-help';
      else if (quizzed.length === 0) statusLabel = 'no-quizzes-taken';

      studentSummaries.push({
        name: student.name,
        grade: student.grade,
        board: student.board || 'CBSE',
        quizCount: quizzed.length,
        avgScore,
        weakTopics,
        completedCount,
        status: statusLabel
      });
    }

    const topWeakTopics = Object.entries(topicWeakMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    const avgProgress = Math.round(
      students.reduce((sum, s) => sum + (s.progress_percent || 0), 0) / students.length
    );

    const classData = {
      totalStudents: students.length,
      avgProgress,
      studentSummaries,
      topWeakTopics
    };

    // Try AI report
    let report = null;
    if (isAIAvailable()) {
      console.log(`🤖 Generating AI teacher report for ${students.length} students...`);
      report = await generateTeacherReport(classData);
    }

    // Fallback: generate a local summary
    if (!report) {
      const struggling = studentSummaries.filter(s => s.status === 'struggling' || s.status === 'needs-help');
      report = {
        overall_assessment: `Class has ${students.length} students with an average progress of ${avgProgress}%. ${struggling.length} student(s) need additional attention.`,
        weak_topics: topWeakTopics.slice(0, 5).map(t => ({
          topic: t.topic,
          student_count: t.count,
          severity: t.count >= 3 ? 'high' : t.count >= 2 ? 'medium' : 'low',
          suggestion: `Review "${t.topic}" with the class and provide extra practice problems.`
        })),
        students_needing_help: struggling.map(s => ({
          name: s.name,
          reason: `Weak in ${s.weakTopics.length} topic(s): ${s.weakTopics.slice(0, 3).join(', ')}. Average score: ${s.avgScore}/5.`,
          priority: s.weakTopics.length >= 3 ? 'urgent' : 'moderate',
          recommendation: `Provide one-on-one tutoring focused on: ${s.weakTopics.slice(0, 2).join(', ')}.`
        })),
        class_strengths: ['Students are actively taking quizzes', 'Learning path system is being used'],
        action_items: [
          `Focus class revision on: ${topWeakTopics.slice(0, 2).map(t => t.topic).join(', ') || 'N/A'}`,
          `Check in with ${struggling.length} struggling student(s) individually`,
          'Assign extra practice on weak topics via the Learning Paths feature'
        ]
      };
    }

    res.json({ report, ai_powered: isAIAvailable(), class_data_summary: { total: students.length, avg_progress: avgProgress, weak_topic_count: topWeakTopics.length } });
  } catch (err) {
    console.error('AI report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;

