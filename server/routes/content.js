import { Router } from "express";
import {
  generateLesson,
  generateNotes,
  generateQuiz,
} from "../services/aiService.js";

const router = Router();

function validateSelection(body) {
  const standard = String(body.standard || "").trim();
  const subject = String(body.subject || "").trim();
  const chapter = String(body.chapter || "").trim();
  const studentId = Number(body.studentId || 0) || null;

  if (!standard || !subject || !chapter) {
    return null;
  }

  return { standard, subject, chapter, studentId };
}

router.post("/lesson", async (req, res) => {
  const selection = validateSelection(req.body);
  if (!selection) {
    return res.status(400).json({ error: "standard, subject, and chapter are required" });
  }

  try {
    const result = await generateLesson(selection.chapter, null, {
      standard: selection.standard,
      subject: selection.subject,
      studentId: selection.studentId,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load lesson" });
  }
});

router.post("/notes", async (req, res) => {
  const selection = validateSelection(req.body);
  if (!selection) {
    return res.status(400).json({ error: "standard, subject, and chapter are required" });
  }

  try {
    const lessonText = String(req.body.lesson || "").trim();
    const result = await generateNotes(selection.chapter, lessonText, {
      standard: selection.standard,
      subject: selection.subject,
      studentId: selection.studentId,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load notes" });
  }
});

router.post("/quiz", async (req, res) => {
  const selection = validateSelection(req.body);
  if (!selection) {
    return res.status(400).json({ error: "standard, subject, and chapter are required" });
  }

  try {
    const result = await generateQuiz(selection.chapter, {
      standard: selection.standard,
      subject: selection.subject,
      studentId: selection.studentId,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load quiz" });
  }
});

export default router;
