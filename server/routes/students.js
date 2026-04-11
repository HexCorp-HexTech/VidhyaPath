import { Router } from 'express';
import { runSQL, getOne, getAll } from '../db.js';
import { generatePath, isAIAvailable } from '../claude.js';
import { localGeneratePath } from '../localAI.js';

const router = Router();

// Create student (used during onboarding after signup)
router.post('/', async (req, res) => {
  try {
    const { id, name, age, grade, board, goals, level, study_time, language, device_type, connectivity } = req.body;

    // If id provided, update existing student profile
    if (id) {
      runSQL(
        `UPDATE students SET name=?, age=?, grade=?, board=?, goals=?, level=?, study_time=?, language=?, device_type=?, connectivity=?, last_active_date=datetime('now')
         WHERE id=?`,
        [name, age, grade, board || 'CBSE', goals, level, study_time, language, device_type || 'mobile', connectivity || '3g', id]
      );
      const student = getOne('SELECT * FROM students WHERE id = ?', [id]);
      return res.json({ ...student, password: undefined });
    }

    // Legacy: create without auth (backward compat)
    const result = runSQL(
      `INSERT INTO students (username, password, name, age, grade, board, goals, level, study_time, language, device_type, connectivity, last_active_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [`student_${Date.now()}`, '1234', name, age, grade, board || 'CBSE', goals, level, study_time, language, device_type || 'mobile', connectivity || '3g']
    );

    const student = getOne('SELECT * FROM students WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ ...student, password: undefined });
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Get student with path and progress
router.get('/:id', (req, res) => {
  try {
    const student = getOne('SELECT * FROM students WHERE id = ?', [parseInt(req.params.id)]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const currentPath = getOne('SELECT * FROM learning_paths WHERE student_id = ? ORDER BY generated_at DESC', [student.id]);
    const progress = getAll('SELECT * FROM topic_progress WHERE student_id = ?', [student.id]);

    // Check re-engagement
    let needsReengagement = false;
    if (student.last_active_date) {
      const daysSince = Math.floor((new Date() - new Date(student.last_active_date)) / (1000 * 60 * 60 * 24));
      needsReengagement = daysSince >= 3;
    }

    res.json({
      ...student,
      password: undefined,
      current_path: currentPath ? {
        id: currentPath.id,
        generated_at: currentPath.generated_at,
        path_json: JSON.parse(currentPath.path_json || '[]'),
        update_reason: currentPath.update_reason
      } : null,
      progress,
      needs_reengagement: needsReengagement
    });
  } catch (err) {
    console.error('Error getting student:', err);
    res.status(500).json({ error: 'Failed to get student' });
  }
});

export default router;
