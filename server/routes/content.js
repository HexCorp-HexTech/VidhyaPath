import { Router } from "express";
import { getLesson, getNotes, getQuiz } from "../services/contentService.js";

const router = Router();

function validateSelection(body) {
  const standard = String(body.standard || "").trim();
  const subject = String(body.subject || "").trim();
  const chapter = String(body.chapter || "").trim();

  if (!standard || !subject || !chapter) {
    return null;
  }

  return { standard, subject, chapter };
}

router.post("/lesson", async (req, res) => {
  const selection = validateSelection(req.body);
  if (!selection) {
    return res.status(400).json({ error: "standard, subject, and chapter are required" });
  }

  try {
    const result = await getLesson(
      selection.standard,
      selection.subject,
      selection.chapter
    );
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
    const result = await getNotes(
      selection.standard,
      selection.subject,
      selection.chapter
    );
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
    const result = await getQuiz(
      selection.standard,
      selection.subject,
      selection.chapter
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load quiz" });
  }
});

export default router;
