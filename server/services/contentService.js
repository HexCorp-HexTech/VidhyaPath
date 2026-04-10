import { syllabusDB } from "../data/syllabusDB.js";
import {
  generateLessonWithAI,
  generateNotesWithAI,
  generateQuizWithAI,
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

export async function getLesson(standard, subject, chapter) {
  const local = getLocalChapter(standard, subject, chapter);
  if (local?.data?.lesson) {
    return { lesson: local.data.lesson, source: "db" };
  }

  const aiLesson = await generateLessonWithAI(standard, subject, chapter);
  if (aiLesson) {
    return { lesson: aiLesson, source: "ai" };
  }

  throw new Error("Lesson content unavailable");
}

export async function getNotes(standard, subject, chapter) {
  const local = getLocalChapter(standard, subject, chapter);
  if (local?.data?.notes) {
    return { notes: local.data.notes, source: "db" };
  }

  const aiNotes = await generateNotesWithAI(standard, subject, chapter);
  if (aiNotes) {
    return { notes: aiNotes, source: "ai" };
  }

  throw new Error("Notes content unavailable");
}

export async function getQuiz(standard, subject, chapter) {
  const local = getLocalChapter(standard, subject, chapter);
  if (local?.data?.quiz) {
    return { quiz: local.data.quiz, source: "db" };
  }

  const aiQuiz = await generateQuizWithAI(standard, subject, chapter);
  if (aiQuiz) {
    return { quiz: aiQuiz, source: "ai" };
  }

  throw new Error("Quiz content unavailable");
}

export function hasPrototypeChapter(standard, subject, chapter) {
  return Boolean(getLocalChapter(standard, subject, chapter));
}

