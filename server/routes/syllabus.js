import { Router } from "express";
import { getAll, getOne, runSQL } from "../db.js";
import { getChapters } from "../syllabus.js";

const router = Router();

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function buildDefaultSyllabus(student) {
  const goals = String(student.goals || "Math")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return goals.map((subject) => {
    const chapters = getChapters(student.board || "CBSE", subject, student.grade || 8);
    return {
      subject,
      chapters: chapters.map((chapter) => chapter.name),
      topics: chapters.flatMap((chapter) => chapter.important || []),
      personalized: false,
    };
  });
}

router.get("/student/syllabus", (req, res) => {
  try {
    const studentId = Number(req.query.studentId);
    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }

    const student = getOne("SELECT * FROM students WHERE id = ?", [studentId]);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const personalized = getAll(
      "SELECT * FROM student_syllabus WHERE student_id = ? ORDER BY subject ASC",
      [studentId]
    ).map((row) => ({
      id: row.id,
      studentId: row.student_id,
      subject: row.subject,
      chapters: JSON.parse(row.chapters || "[]"),
      topics: JSON.parse(row.topics || "[]"),
      personalized: true,
      updatedAt: row.updated_at,
    }));

    res.json({
      studentId,
      syllabus: personalized.length > 0 ? personalized : buildDefaultSyllabus(student),
    });
  } catch (error) {
    console.error("Student syllabus error:", error);
    res.status(500).json({ error: "Failed to load syllabus" });
  }
});

router.post("/teacher/add-module", (req, res) => {
  try {
    const studentId = Number(req.body.studentId);
    const subject = String(req.body.subject || "").trim();
    const chapters = normalizeList(req.body.chapters);
    const topics = normalizeList(req.body.topics);

    if (!studentId || !subject) {
      return res.status(400).json({ error: "studentId and subject are required" });
    }

    const student = getOne("SELECT id FROM students WHERE id = ?", [studentId]);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const existing = getOne(
      "SELECT * FROM student_syllabus WHERE student_id = ? AND subject = ?",
      [studentId, subject]
    );

    const mergedChapters = existing
      ? Array.from(new Set([...JSON.parse(existing.chapters || "[]"), ...chapters]))
      : chapters;
    const mergedTopics = existing
      ? Array.from(new Set([...JSON.parse(existing.topics || "[]"), ...topics]))
      : topics;

    if (existing) {
      runSQL(
        `UPDATE student_syllabus
         SET chapters = ?, topics = ?, updated_at = datetime('now')
         WHERE student_id = ? AND subject = ?`,
        [JSON.stringify(mergedChapters), JSON.stringify(mergedTopics), studentId, subject]
      );
    } else {
      runSQL(
        `INSERT INTO student_syllabus (student_id, subject, chapters, topics, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [studentId, subject, JSON.stringify(mergedChapters), JSON.stringify(mergedTopics)]
      );
    }

    const updated = getOne(
      "SELECT * FROM student_syllabus WHERE student_id = ? AND subject = ?",
      [studentId, subject]
    );

    res.json({
      id: updated.id,
      studentId,
      subject,
      chapters: JSON.parse(updated.chapters || "[]"),
      topics: JSON.parse(updated.topics || "[]"),
      updatedAt: updated.updated_at,
    });
  } catch (error) {
    console.error("Add module error:", error);
    res.status(500).json({ error: "Failed to update syllabus" });
  }
});

router.post("/teacher/remove-module", (req, res) => {
  try {
    const studentId = Number(req.body.studentId);
    const subject = String(req.body.subject || "").trim();
    const chaptersToRemove = normalizeList(req.body.chapters);
    const topicsToRemove = normalizeList(req.body.topics);

    if (!studentId || !subject) {
      return res.status(400).json({ error: "studentId and subject are required" });
    }

    const existing = getOne(
      "SELECT * FROM student_syllabus WHERE student_id = ? AND subject = ?",
      [studentId, subject]
    );

    if (!existing) {
      return res.json({ studentId, subject, chapters: [], topics: [] });
    }

    const chapters = JSON.parse(existing.chapters || "[]").filter(
      (chapter) => !chaptersToRemove.includes(chapter)
    );
    const topics = JSON.parse(existing.topics || "[]").filter(
      (topic) => !topicsToRemove.includes(topic)
    );

    if (chapters.length === 0 && topics.length === 0) {
      runSQL("DELETE FROM student_syllabus WHERE student_id = ? AND subject = ?", [
        studentId,
        subject,
      ]);
      return res.json({ studentId, subject, chapters: [], topics: [] });
    }

    runSQL(
      `UPDATE student_syllabus
       SET chapters = ?, topics = ?, updated_at = datetime('now')
       WHERE student_id = ? AND subject = ?`,
      [JSON.stringify(chapters), JSON.stringify(topics), studentId, subject]
    );

    res.json({ studentId, subject, chapters, topics });
  } catch (error) {
    console.error("Remove module error:", error);
    res.status(500).json({ error: "Failed to remove syllabus module" });
  }
});

export default router;
