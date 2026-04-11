import { Router } from 'express';
import { getOne, getAll, runSQL } from '../db.js';
import { generateQuiz as aiGenerateQuiz, generateFeedback, isAIAvailable } from '../claude.js';
import { localGenerateQuiz, localGenerateFeedback } from '../localAI.js';

const router = Router();

// Generate quiz — dynamic, level-aware, chapter-specific
router.post('/generate', async (req, res) => {
  try {
    const { student_id, topic_name } = req.body;
    const student = getOne('SELECT * FROM students WHERE id = ?', [student_id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Get student's past weak concepts for this topic to focus on them
    const pastProgress = getOne('SELECT weak_concepts, attempts FROM topic_progress WHERE student_id = ? AND topic_name = ?', [student_id, topic_name]);
    const pastWeak = pastProgress?.weak_concepts ? JSON.parse(pastProgress.weak_concepts) : [];
    const attemptCount = pastProgress?.attempts || 0;

    let questions = null;

    if (isAIAvailable()) {
      console.log(`🤖 Generating dynamic quiz: "${topic_name}" for ${student.name} (level: ${student.level}, board: ${student.board}, attempt: ${attemptCount + 1})`);
      questions = await aiGenerateQuiz(topic_name, student.grade, student.language, student.board, pastWeak, attemptCount);
    }

    if (!questions || !Array.isArray(questions)) {
      console.log(`📝 Generating local dynamic quiz: "${topic_name}" (${student.level})`);
      questions = localGenerateQuiz(topic_name, student.grade, student.level);
    }

    res.json({ topic: topic_name, questions, ai_powered: isAIAvailable(), attempt: attemptCount + 1 });
  } catch (err) {
    console.error('Quiz generation error:', err);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Submit quiz — with detailed per-student weakness analysis
router.post('/submit', async (req, res) => {
  try {
    const { student_id, topic_name, score, answers, questions } = req.body;
    const student = getOne('SELECT * FROM students WHERE id = ?', [student_id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const path = getOne('SELECT * FROM learning_paths WHERE student_id = ? ORDER BY generated_at DESC', [student_id]);
    const totalQuestions = Array.isArray(questions) && questions.length > 0 ? questions.length : 5;
    const percentage = Math.round((score / totalQuestions) * 100);
    const status = percentage >= 80 ? 'strong' : percentage >= 50 ? 'complete' : 'weak';
    const isHindi = student.language === 'hi';

    // Get all weak areas for context
    const weakTopics = getAll("SELECT topic_name FROM topic_progress WHERE student_id = ? AND status = 'weak'", [student_id]);
    const weakAreas = weakTopics.map(t => t.topic_name);

    // Generate AI feedback
    let feedback;
    if (isAIAvailable()) {
      feedback = await generateFeedback(score, topic_name, weakAreas, student.language);
    }
    if (!feedback) {
      feedback = localGenerateFeedback(score, topic_name, weakAreas, student.language);
    }

    // Build detailed analysis with per-student weakness tracking
    const analysis = {
      score, total: totalQuestions,
      percentage,
      status, topic: topic_name,
      board: student.board || 'CBSE',
      grade: student.grade,
      level: student.level,
      time_taken: req.body.time_taken || null,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      student_weak_concepts: [] // Per-student, not generic
    };

    // Analyze individual answers — build per-student weakness profile
    const weakConcepts = [];
    if (answers && questions) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const userAnswer = answers[i];
        const isCorrect = userAnswer === q.correct_answer;
        if (isCorrect) {
          analysis.strengths.push(q.question);
        } else {
          analysis.weaknesses.push({
            question: q.question,
            your_answer: userAnswer,
            correct: q.correct_answer,
            explanation: q.explanation
          });
          // Extract the concept this question tests
          weakConcepts.push(q.question.substring(0, 80));
        }
      }
    }

    analysis.student_weak_concepts = weakConcepts;

    // Smart recommendations based on THIS student's specific wrong answers
    if (weakConcepts.length > 0) {
      const weakSummary = weakConcepts.slice(0, 3).join('; ');
      analysis.recommendations = isHindi
        ? [
            `आपको इन विषयों पर फिर से ध्यान देना चाहिए: ${weakSummary}`,
            'पहले पाठ ("📖 पढ़ें") दोबारा पढ़ें, फिर क्विज़ दें',
            `${weakConcepts.length} सवाल गलत हुए — इन concepts को समझें`
          ]
        : [
            `Focus on these concepts you got wrong: ${weakSummary}`,
            'Re-read the lesson ("📖 Study") first, then retake the quiz',
            `You missed ${weakConcepts.length} concepts — review them carefully`
          ];
    } else {
      analysis.recommendations = isHindi
        ? ['🏆 परफेक्ट स्कोर! अगले विषय पर जाएँ', 'Advanced सवाल भी आज़माएँ']
        : ['🏆 Perfect score! Move to the next topic', 'Try advanced questions on this topic'];
    }

    // Save progress with per-student weak concepts
    const existing = getOne('SELECT id, attempts FROM topic_progress WHERE student_id = ? AND topic_name = ?', [student_id, topic_name]);
    if (existing) {
      runSQL("UPDATE topic_progress SET status = ?, quiz_score = ?, feedback = ?, weak_concepts = ?, attempts = ?, last_attempt = datetime('now') WHERE id = ?",
        [status, score, JSON.stringify(feedback), JSON.stringify(weakConcepts), (existing.attempts || 0) + 1, existing.id]);
    } else {
      runSQL("INSERT INTO topic_progress (student_id, topic_name, status, quiz_score, feedback, weak_concepts, attempts, last_attempt) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))",
        [student_id, topic_name, status, score, JSON.stringify(feedback), JSON.stringify(weakConcepts)]);
    }

    // Log every attempt for history
    try {
      runSQL("INSERT INTO quiz_attempts (student_id, topic_name, score, total, status, weak_concepts, attempted_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
        [student_id, topic_name, score, totalQuestions, status, JSON.stringify(weakConcepts)]);
    } catch(e) { console.warn('quiz_attempts insert failed:', e.message); }

    // Update streak and last active
    try {
      runSQL("UPDATE students SET last_active = datetime('now'), streak_count = streak_count + 1 WHERE id = ?", [student_id]);
    } catch(e) {}

    // Update student progress percentage
    const allTopics = getAll('SELECT status FROM topic_progress WHERE student_id = ?', [student_id]);
    const completed = allTopics.filter(t => ['complete', 'strong'].includes(t.status)).length;
    const pathTopics = path ? JSON.parse(path.path_json || '[]').length : allTopics.length;
    const progressPct = pathTopics > 0 ? Math.round((completed / pathTopics) * 100) : 0;
    try {
      runSQL('UPDATE students SET progress_percent = ? WHERE id = ?', [progressPct, student_id]);
    } catch(e) {}

    // Check if path needs update (3+ weak)
    const totalWeak = getAll("SELECT COUNT(*) as cnt FROM topic_progress WHERE student_id = ? AND status = 'weak'", [student_id]);
    const needsUpdate = (totalWeak[0]?.cnt || 0) >= 3;

    res.json({
      score, status, feedback, analysis,
      needs_path_update: needsUpdate,
      ai_powered: isAIAvailable()
    });
  } catch (err) {
    console.error('Quiz submit error:', err);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get per-student weakness for a specific topic
router.get('/weakness/:student_id/:topic', (req, res) => {
  try {
    const progress = getOne('SELECT weak_concepts, quiz_score, attempts, status FROM topic_progress WHERE student_id = ? AND topic_name = ?',
      [req.params.student_id, req.params.topic]);
    if (!progress) return res.json({ weaknesses: [], attempts: 0 });
    
    res.json({
      weaknesses: progress.weak_concepts ? JSON.parse(progress.weak_concepts) : [],
      score: progress.quiz_score,
      attempts: progress.attempts,
      status: progress.status
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get weakness' });
  }
});

// Get all weaknesses for a student (across all topics)
router.get('/weaknesses/:student_id', (req, res) => {
  try {
    const all = getAll("SELECT topic_name, weak_concepts, quiz_score, attempts FROM topic_progress WHERE student_id = ? AND status = 'weak'",
      [req.params.student_id]);
    
    const weaknesses = all.map(t => ({
      topic: t.topic_name,
      concepts: t.weak_concepts ? JSON.parse(t.weak_concepts) : [],
      score: t.quiz_score,
      attempts: t.attempts
    }));
    
    res.json({ weaknesses });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get weaknesses' });
  }
});

export default router;
