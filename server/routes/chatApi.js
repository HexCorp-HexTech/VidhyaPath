import { Router } from "express";
import { getOne } from "../db.js";
import { generateChatReply } from "../services/aiService.js";
import { getChapters, getSyllabusContext } from "../syllabus.js";

const router = Router();

function generateSmartReply(message, student) {
  const msg = String(message || "").toLowerCase();
  const isHindi = student.language === "hi";
  const name = student.name;
  const board = student.board || "CBSE";
  const grade = student.grade || 8;

  if (msg.includes("hello") || msg.includes("hi") || msg.includes("namaste") || msg.includes("नमस्ते")) {
    return isHindi
      ? `नमस्ते ${name}! मैं आपका VidyaPath AI Tutor हूँ। आप ${board} Class ${grade} के किसी भी topic के बारे में पूछ सकते हैं।`
      : `Hello ${name}! I'm your VidyaPath AI Tutor. Ask me about any ${board} Class ${grade} topic.`;
  }

  if (msg.includes("quiz") || msg.includes("test")) {
    return isHindi
      ? "किसी भी chapter को खोलिए, पहले lesson और notes देखिए, फिर quiz stage पर जाकर test submit कीजिए।"
      : "Open a chapter, review the lesson and notes, then move to the quiz stage and submit the test.";
  }

  const subjects = String(student.goals || "Math")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const subject of subjects) {
    const chapters = getChapters(board, subject, grade);
    const match = chapters.find((chapter) => msg.includes(chapter.name.toLowerCase()));
    if (match) {
      return isHindi
        ? `"${match.name}" में ध्यान देने वाले विषय हैं: ${match.important.join(", ")}. सामान्य गलतियाँ: ${match.weak_common.join(", ")}.`
        : `For "${match.name}", focus on ${match.important.join(", ")}. Common mistakes: ${match.weak_common.join(", ")}.`;
    }
  }

  return isHindi
    ? `${name}, अपना सवाल थोड़ा और specific लिखिए, जैसे "fractions समझाओ" या "trigonometry help".`
    : `${name}, ask a more specific study question, for example "Explain fractions" or "Help me with trigonometry".`;
}

async function handleChat(req, res) {
  try {
    const { student_id, message, history } = req.body;
    const student = getOne("SELECT * FROM students WHERE id = ?", [student_id]);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const result = await generateChatReply(student_id, message, history);
    if (result?.reply) {
      return res.json({ reply: result.reply, ai_powered: result.aiPowered });
    }

    const syllabusCtx = getSyllabusContext(student.board || "CBSE", student.grade, student.goals);
    const reply = generateSmartReply(message, student, syllabusCtx);
    return res.json({ reply, ai_powered: false });
  } catch (error) {
    console.error("Chat route error:", error);
    return res.status(500).json({ error: "Chat failed" });
  }
}

router.post("/", handleChat);
router.post("/message", handleChat);

export default router;
