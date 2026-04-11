import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health endpoint for connectivity check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Import routes
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import pathRoutes from './routes/paths.js';
import quizRoutes from './routes/quiz.js';
import teacherRoutes from './routes/teacher.js';
import reengagementRoutes from './routes/reengagement.js';
import lessonRoutes from './routes/lesson.js';
import chatRoutes from './routes/chat.js';
import contentRoutes from './routes/content.js';
import assignedPathsRoutes from './routes/assignedPaths.js';

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/path', pathRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/reengagement', reengagementRoutes);
app.use('/api/lesson', lessonRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/assigned-paths', assignedPathsRoutes);

// Vercel doesn't use app.listen, it intercepts exports
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   🎓 PathWise Server Running            ║
║   http://localhost:${PORT}                 ║
╚══════════════════════════════════════════╝
    `);
  });
}

export default app;
