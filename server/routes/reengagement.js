import { Router } from 'express';
import { getOne } from '../db.js';
import { generateReEngagement, isAIAvailable } from '../claude.js';
import { localGenerateReEngagement } from '../localAI.js';

const router = Router();

router.get('/:student_id', async (req, res) => {
  try {
    const student = getOne('SELECT * FROM students WHERE id = ?', [parseInt(req.params.student_id)]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const lastTopic = getOne(
      "SELECT topic_name FROM topic_progress WHERE student_id = ? AND status != 'pending' ORDER BY completed_at DESC LIMIT 1",
      [parseInt(req.params.student_id)]
    );

    const topicName = lastTopic ? lastTopic.topic_name : 'your learning path';

    let message = null;
    if (isAIAvailable()) {
      message = await generateReEngagement(student, topicName);
    }
    if (!message) {
      message = localGenerateReEngagement(student, topicName);
    }

    res.json(message);
  } catch (err) {
    console.error('Error generating re-engagement:', err);
    res.status(500).json({ error: 'Failed to generate message' });
  }
});

export default router;
