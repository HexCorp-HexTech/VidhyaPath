import { Router } from 'express';
import { runSQL, getOne, getAll } from '../db.js';
import { generatePath, updatePath, isAIAvailable } from '../claude.js';
import { localGeneratePath, localUpdatePath } from '../localAI.js';

const router = Router();

// Generate initial learning path
router.post('/generate', async (req, res) => {
  try {
    const { student_id } = req.body;
    const student = getOne('SELECT * FROM students WHERE id = ?', [student_id]);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    let topics = null;

    // Try online AI first (Claude via OpenRouter)
    if (isAIAvailable()) {
      console.log('🤖 Generating path with AI (OpenRouter)...');
      topics = await generatePath(student);
    }

    // Fallback to local AI engine
    if (!topics || !Array.isArray(topics)) {
      console.log('📚 Generating path with local AI engine...');
      topics = localGeneratePath(student);
    }

    // Save to database
    const result = runSQL('INSERT INTO learning_paths (student_id, path_json) VALUES (?, ?)', [student_id, JSON.stringify(topics)]);
    const pathId = result.lastInsertRowid;

    // Initialize topic progress entries
    for (const topic of topics) {
      runSQL('INSERT INTO topic_progress (student_id, path_id, topic_name, status) VALUES (?, ?, ?, ?)',
        [student_id, pathId, topic.topic, 'pending']);
    }

    res.json({
      path_id: pathId,
      topics,
      ai_powered: isAIAvailable()
    });
  } catch (err) {
    console.error('Error generating path:', err);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
});

// Update learning path based on progress
router.post('/update', async (req, res) => {
  try {
    const { student_id } = req.body;
    const student = getOne('SELECT * FROM students WHERE id = ?', [student_id]);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const progress = getAll('SELECT * FROM topic_progress WHERE student_id = ?', [student_id]);
    
    const completedTopics = progress.filter(p => ['complete', 'strong', 'weak'].includes(p.status)).map(p => p.topic_name);
    const weakAreas = progress.filter(p => p.status === 'weak').map(p => p.topic_name);
    const strongAreas = progress.filter(p => p.status === 'strong').map(p => p.topic_name);

    let topics = null;

    if (isAIAvailable()) {
      console.log('🤖 Updating path with AI (OpenRouter)...');
      topics = await updatePath(student, completedTopics, weakAreas, strongAreas);
    }

    if (!topics || !Array.isArray(topics)) {
      console.log('📚 Updating path with local AI engine...');
      topics = localUpdatePath(student, completedTopics, weakAreas, strongAreas);
    }

    const reason = weakAreas.length > 0
      ? `Revisiting weak areas: ${weakAreas.join(', ')}`
      : 'Path updated based on your progress';

    const result = runSQL('INSERT INTO learning_paths (student_id, path_json, update_reason) VALUES (?, ?, ?)',
      [student_id, JSON.stringify(topics), reason]);
    const pathId = result.lastInsertRowid;

    for (const topic of topics) {
      const existing = getOne('SELECT id FROM topic_progress WHERE student_id = ? AND topic_name = ?', [student_id, topic.topic]);
      if (!existing) {
        runSQL('INSERT INTO topic_progress (student_id, path_id, topic_name, status) VALUES (?, ?, ?, ?)',
          [student_id, pathId, topic.topic, 'pending']);
      }
    }

    res.json({
      path_id: pathId,
      topics,
      update_reason: reason,
      ai_powered: isAIAvailable()
    });
  } catch (err) {
    console.error('Error updating path:', err);
    res.status(500).json({ error: 'Failed to update learning path' });
  }
});

export default router;
