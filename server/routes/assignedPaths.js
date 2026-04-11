import { Router } from 'express';
import { runSQL, getOne, getAll } from '../db.js';
import { generateTopicExplanation, isContentAIAvailable } from '../services/aiContentService.js';

const router = Router();

// Teacher assigns a learning path to a student
router.post('/assign', (req, res) => {
  try {
    const { teacher_id, student_id, title, topics } = req.body;

    if (!teacher_id || !student_id || !title?.trim() || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ error: 'teacher_id, student_id, title, and topics[] are required' });
    }

    // Verify teacher exists
    const teacher = getOne('SELECT id FROM teachers WHERE id = ?', [teacher_id]);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    // Verify student exists
    const student = getOne('SELECT id FROM students WHERE id = ?', [student_id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Clean topics
    const cleanedTopics = topics.map(t => String(t).trim()).filter(Boolean);
    if (cleanedTopics.length === 0) {
      return res.status(400).json({ error: 'At least one valid topic is required' });
    }

    const result = runSQL(
      'INSERT INTO teacher_assigned_paths (teacher_id, student_id, title, topics_json) VALUES (?, ?, ?, ?)',
      [teacher_id, student_id, title.trim(), JSON.stringify(cleanedTopics)]
    );

    res.status(201).json({
      id: Number(result.lastInsertRowid),
      teacher_id,
      student_id,
      title: title.trim(),
      topics: cleanedTopics,
      status: 'active',
      assigned_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error assigning path:', err);
    res.status(500).json({ error: 'Failed to assign learning path' });
  }
});

// Get all assigned paths for a student
router.get('/student/:studentId', (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const paths = getAll(
      'SELECT tap.*, t.name as teacher_name FROM teacher_assigned_paths tap JOIN teachers t ON t.id = tap.teacher_id WHERE tap.student_id = ? ORDER BY tap.assigned_at DESC',
      [studentId]
    );

    const result = paths.map(p => ({
      id: p.id,
      title: p.title,
      topics: JSON.parse(p.topics_json || '[]'),
      status: p.status,
      assigned_at: p.assigned_at,
      teacher_name: p.teacher_name,
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching assigned paths:', err);
    res.status(500).json({ error: 'Failed to fetch assigned paths' });
  }
});

// Get AI-generated content for a specific topic in an assigned path
router.get('/content/:pathId/:topicIndex', async (req, res) => {
  try {
    const pathId = parseInt(req.params.pathId);
    const topicIndex = parseInt(req.params.topicIndex);

    // Get the path
    const path = getOne('SELECT * FROM teacher_assigned_paths WHERE id = ?', [pathId]);
    if (!path) return res.status(404).json({ error: 'Path not found' });

    const topics = JSON.parse(path.topics_json || '[]');
    if (topicIndex < 0 || topicIndex >= topics.length) {
      return res.status(400).json({ error: 'Invalid topic index' });
    }

    const topicName = topics[topicIndex];

    // Check cache first
    const cached = getOne(
      'SELECT * FROM assigned_path_content WHERE path_id = ? AND topic_index = ?',
      [pathId, topicIndex]
    );

    if (cached) {
      return res.json({
        topic: topicName,
        content: cached.content,
        source: 'cache',
        ai_powered: true,
      });
    }

    // Generate with AI
    let content = null;
    let source = 'fallback';

    if (isContentAIAvailable()) {
      const aiResult = await generateTopicExplanation(topicName);
      if (aiResult.success) {
        content = aiResult.data;
        source = 'ai';
      } else {
        console.warn(`[AssignedPath] AI failed for "${topicName}": ${aiResult.reason}`);
      }
    }

    // Fallback content if AI unavailable or failed
    if (!content) {
      content = `${topicName}\n\n` +
        `This topic covers the fundamentals of ${topicName}. ` +
        `Understanding ${topicName} is important as it forms a building block for more advanced concepts.\n\n` +
        `Key points to study:\n` +
        `• What is ${topicName} and why does it matter?\n` +
        `• Core principles and definitions\n` +
        `• How ${topicName} connects to other topics you've learned\n` +
        `• Practice problems and real-world applications\n\n` +
        `Ask your teacher for more details or use the chatbot for specific questions about ${topicName}.`;
      source = 'fallback';
    }

    // Cache the generated content
    runSQL(
      'INSERT INTO assigned_path_content (path_id, topic_index, topic_name, content) VALUES (?, ?, ?, ?)',
      [pathId, topicIndex, topicName, content]
    );

    res.json({
      topic: topicName,
      content,
      source,
      ai_powered: source === 'ai',
    });
  } catch (err) {
    console.error('Error generating topic content:', err);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

export default router;
