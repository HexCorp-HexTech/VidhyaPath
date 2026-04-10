const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

function hasAIKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  return Boolean(apiKey && apiKey.startsWith("sk-or-"));
}

async function callOpenRouter(systemPrompt, userPrompt, temperature = 0.4) {
  if (!hasAIKey()) {
    return null;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3001",
        "X-Title": "PathWise Content",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter content error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("OpenRouter request failed:", error.message);
    return null;
  }
}

function validateLesson(text) {
  if (typeof text !== "string") return null;
  const cleaned = text.trim();
  if (!cleaned) return null;
  const lines = cleaned.split(/\n+/).filter(Boolean);
  if (lines.length < 10) return null;
  return cleaned;
}

function validateNotes(notes) {
  if (!Array.isArray(notes) || notes.length !== 5) return null;
  const cleaned = notes.map((item) => String(item || "").replace(/^[*-]\s*/, "").trim());
  if (cleaned.some((item) => !item)) return null;
  return cleaned;
}

function validateQuiz(quiz) {
  if (!Array.isArray(quiz) || quiz.length < 3 || quiz.length > 5) return null;

  const normalized = quiz.map((question) => {
    if (!question || typeof question.question !== "string") return null;
    if (!Array.isArray(question.options) || question.options.length !== 4) return null;
    const options = question.options.map((option) => String(option || "").trim());
    const answer = String(question.answer || "").trim();
    if (!answer || !options.includes(answer) || options.some((option) => !option)) {
      return null;
    }
    return {
      question: question.question.trim(),
      options,
      answer,
    };
  });

  return normalized.every(Boolean) ? normalized : null;
}

export async function generateLessonWithAI(standard, subject, chapter) {
  const text = await callOpenRouter(
    "You are an expert school teacher. Follow the user's structure exactly. Output only plain text.",
    `Explain the chapter "${chapter}" for a class ${standard} ${subject} student.

Requirements:
- 15 to 30 lines
- Simple language
- Step-by-step explanation
- Include examples
- No bullet points
- Make it easy to understand

Output ONLY plain text.`
  );

  return validateLesson(text);
}

export async function generateNotesWithAI(standard, subject, chapter) {
  const text = await callOpenRouter(
    "You are an expert revision coach. Follow the user's structure exactly.",
    `Create concise revision notes for "${chapter}" in class ${standard} ${subject}.

Requirements:
- Exactly 5 bullet points
- Each point short and important
- Focus on key concepts
- No explanation, only points

Output format:
- Point 1
- Point 2
- Point 3
- Point 4
- Point 5`
  );

  if (!text) return null;
  const notes = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[*-]\s*/, ""));

  return validateNotes(notes);
}

export async function generateQuizWithAI(standard, subject, chapter) {
  const text = await callOpenRouter(
    "You are an expert quiz generator. Output JSON only with no markdown or fences.",
    `Generate a quiz for "${chapter}" for class ${standard} ${subject}.

Requirements:
- 5 multiple choice questions
- Each question has 4 options
- Provide correct answer

Output JSON format ONLY:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "answer": "A"
  }
]`,
    0.3
  );

  if (!text) return null;

  try {
    const match = text.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : text);
    return validateQuiz(parsed);
  } catch {
    return null;
  }
}

export function isContentAIAvailable() {
  return hasAIKey();
}

