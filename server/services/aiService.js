import { getOne } from "../db.js";
import { getChapters, getSyllabusContext } from "../syllabus.js";
import {
  generateLessonWithAI,
  generateNotesWithAI,
  generateQuizWithAI,
} from "./aiContentService.js";
import { callAI, hasAIKey } from "./aiProvider.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function getStudentContext(studentId) {
  if (!studentId) return null;
  return getOne("SELECT * FROM students WHERE id = ?", [studentId]) || null;
}

function buildLessonFallback(topic, student, subject) {
  const grade = student?.grade || 8;
  const board = student?.board || "CBSE";
  const lines = [
    `${topic} is part of ${board} Class ${grade} ${subject}.`,
    `Start by understanding the main idea in simple words before memorising rules.`,
    `Break the chapter into small concepts and connect each one to an everyday example.`,
    `Notice what changes and what stays constant when you solve a question on ${topic}.`,
    `Write the important rule, then solve one easy example, then one exam-style example.`,
    `If you get stuck, go back to the definition and identify which keyword the question is testing.`,
    `Revision works best when you explain the concept aloud in your own words.`,
    `Finish by checking common mistakes and correcting them before moving on.`,
  ];

  return lines.join("\n");
}

function buildNotesFallback(topic, lessonText) {
  const base = normalizeText(lessonText);
  const firstSentence = base.split(/[.!?]\s/).find(Boolean) || `${topic} is an important topic.`;

  return [
    `${topic}: begin with the core definition and what the chapter is mainly about.`,
    firstSentence,
    `List the main rule or formula used in ${topic} before solving questions.`,
    `Practice one simple example and one application-based example for better recall.`,
    `Review common mistakes and keywords from the chapter before the quiz.`,
  ];
}

function buildQuizFallback(topic) {
  return [
    {
      question: `What is the safest first step when solving a question from ${topic}?`,
      options: [
        "Identify the concept being tested",
        "Guess the final answer",
        "Skip the question",
        "Memorise only the last line",
      ],
      answer: "Identify the concept being tested",
    },
    {
      question: `Why should you practise examples for ${topic}?`,
      options: [
        "To connect the rule with actual usage",
        "Only to fill notebook pages",
        "Because theory never matters",
        "So you can avoid revision",
      ],
      answer: "To connect the rule with actual usage",
    },
    {
      question: `Which habit improves retention for ${topic}?`,
      options: [
        "Short daily revision",
        "Ignoring mistakes",
        "Studying once a month",
        "Reading only headings",
      ],
      answer: "Short daily revision",
    },
  ];
}

function inferSubject(topic, student) {
  const goals = String(student?.goals || "").split(",").map((item) => item.trim()).filter(Boolean);
  for (const subject of goals) {
    const chapters = getChapters(student?.board || "CBSE", subject, student?.grade || 8);
    if (chapters.some((chapter) => chapter.name.toLowerCase() === topic.toLowerCase())) {
      return subject;
    }
  }
  return goals[0] || "General Studies";
}

export async function generateLesson(topic, level, options = {}) {
  const student = getStudentContext(options.studentId);
  const subject = options.subject || inferSubject(topic, student);
  const standard = options.standard || student?.grade || 8;
  const aiLesson = await generateLessonWithAI(standard, subject, topic);

  if (aiLesson) {
    return { lesson: aiLesson, source: "ai", subject };
  }

  return {
    lesson: buildLessonFallback(topic, { ...student, level }, subject),
    source: "local",
    subject,
  };
}

export async function generateNotes(topic, lesson, options = {}) {
  const student = getStudentContext(options.studentId);
  const subject = options.subject || inferSubject(topic, student);
  const standard = options.standard || student?.grade || 8;
  const aiNotes = await generateNotesWithAI(standard, subject, topic);

  if (aiNotes) {
    return { notes: aiNotes, source: "ai", subject };
  }

  return {
    notes: buildNotesFallback(topic, lesson),
    source: "local",
    subject,
  };
}

export async function generateQuiz(topic, options = {}) {
  const student = getStudentContext(options.studentId);
  const subject = options.subject || inferSubject(topic, student);
  const standard = options.standard || student?.grade || 8;
  const aiQuiz = await generateQuizWithAI(standard, subject, topic);

  if (aiQuiz) {
    return { quiz: aiQuiz, source: "ai", subject };
  }

  return {
    quiz: buildQuizFallback(topic),
    source: "local",
    subject,
  };
}

function buildChatFallback(student, message) {
  const name = student?.name || "Student";
  const board = student?.board || "CBSE";
  const grade = student?.grade || 8;

  return `${name}, I can still help with ${board} Class ${grade} topics. Ask a more specific question about "${message}" or open the lesson and notes for that chapter first.`;
}

export async function generateChatReply(studentId, message, history = []) {
  const student = getStudentContext(studentId);
  if (!student) return null;

  if (!hasAIKey()) {
    return { reply: buildChatFallback(student, message), aiPowered: false };
  }

  const syllabusCtx = getSyllabusContext(student.board || "CBSE", student.grade, student.goals);
  const reply = await callAI(
    [
      {
        role: "system",
        content: `You are VidyaPath AI Tutor, a warm and concise tutor for ${student.board || "CBSE"} Class ${student.grade} students.
- Keep answers easy to understand
- Use concrete school-life examples
- Be encouraging and direct
- Align to this syllabus when relevant:
${syllabusCtx}
- Respond in ${student.language === "hi" ? "Hindi" : "English"}`,
      },
      ...(history || []).slice(-8).map((item) => ({
        role: item.role,
        content: item.content,
      })),
      { role: "user", content: message },
    ],
    {
      temperature: 0.6,
      maxTokens: 1200,
      title: "VidhyaPath Chat",
    }
  );

  if (reply) {
    return { reply, aiPowered: true };
  }

  return { reply: buildChatFallback(student, message), aiPowered: false };
}
