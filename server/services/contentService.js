import { syllabusDB } from "../data/syllabusDB.js";
import {
  generateLessonWithAI,
  generateNotesWithAI,
  generateQuizWithAI,
  isContentAIAvailable,
} from "./aiContentService.js";

function normalizeStandard(standard) {
  return String(standard || "").replace(/[^0-9]/g, "");
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function resolveSubject(standard, subject) {
  const subjects = Object.keys(syllabusDB[standard] || {});
  return (
    subjects.find((key) => normalizeKey(key) === normalizeKey(subject)) || null
  );
}

function resolveChapter(standard, subject, chapter) {
  const chapters = Object.keys(syllabusDB[standard]?.[subject] || {});
  return (
    chapters.find((key) => normalizeKey(key) === normalizeKey(chapter)) || null
  );
}

function getLocalChapter(standardInput, subjectInput, chapterInput) {
  const standard = normalizeStandard(standardInput);
  const subject = resolveSubject(standard, subjectInput);
  if (!subject) return null;
  const chapter = resolveChapter(standard, subject, chapterInput);
  if (!chapter) return null;

  return {
    standard,
    subject,
    chapter,
    data: syllabusDB[standard][subject][chapter],
  };
}

// ── Lesson ───────────────────────────────────────────────────────────

export async function getLesson(standard, subject, chapter) {
  // Try AI first
  if (isContentAIAvailable()) {
    const aiResult = await generateLessonWithAI(standard, subject, chapter);
    if (aiResult.success && aiResult.data) {
      return {
        lesson: aiResult.data,
        source: "ai",
        ai_powered: true,
        reason: null,
      };
    }
    // AI failed — fall through to local with reason
    const local = getLocalChapter(standard, subject, chapter);
    if (local?.data?.lesson) {
      return {
        lesson: local.data.lesson,
        source: "fallback",
        ai_powered: false,
        reason: aiResult.reason,
      };
    }
    // No local data either
    throw new Error(aiResult.reason || "Lesson content unavailable");
  }

  // No AI key — use local directly
  const local = getLocalChapter(standard, subject, chapter);
  if (local?.data?.lesson) {
    return { lesson: local.data.lesson, source: "db", ai_powered: false, reason: null };
  }

  throw new Error("Lesson content unavailable");
}

// ── Notes ────────────────────────────────────────────────────────────

export async function getNotes(standard, subject, chapter) {
  // Try AI first
  if (isContentAIAvailable()) {
    const aiResult = await generateNotesWithAI(standard, subject, chapter);
    if (aiResult.success && aiResult.data) {
      return {
        notes: aiResult.data,
        source: "ai",
        ai_powered: true,
        reason: null,
      };
    }
    // AI failed — fall through to local with reason
    const local = getLocalChapter(standard, subject, chapter);
    if (local?.data?.notes) {
      return {
        notes: local.data.notes,
        source: "fallback",
        ai_powered: false,
        reason: aiResult.reason,
      };
    }
    // No local data either
    throw new Error(aiResult.reason || "Notes content unavailable");
  }

  // No AI key — use local directly
  const local = getLocalChapter(standard, subject, chapter);
  if (local?.data?.notes) {
    return { notes: local.data.notes, source: "db", ai_powered: false, reason: null };
  }

  throw new Error("Notes content unavailable");
}

// ── Quiz ─────────────────────────────────────────────────────────────

export async function getQuiz(standard, subject, chapter) {
  // Try AI first
  if (isContentAIAvailable()) {
    const aiResult = await generateQuizWithAI(standard, subject, chapter);
    if (aiResult.success && aiResult.data) {
      return {
        quiz: aiResult.data,
        source: "ai",
        ai_powered: true,
        reason: null,
      };
    }
    // AI failed — fall through to local with reason
    const local = getLocalChapter(standard, subject, chapter);
    if (local?.data?.quiz) {
      return {
        quiz: local.data.quiz,
        source: "fallback",
        ai_powered: false,
        reason: aiResult.reason,
      };
    }
    // No local data either
    throw new Error(aiResult.reason || "Quiz content unavailable");
  }

  // No AI key — use local directly
  const local = getLocalChapter(standard, subject, chapter);
  if (local?.data?.quiz) {
    return { quiz: local.data.quiz, source: "db", ai_powered: false, reason: null };
  }

  throw new Error("Quiz content unavailable");
}

export function hasPrototypeChapter(standard, subject, chapter) {
  return Boolean(getLocalChapter(standard, subject, chapter));
}
