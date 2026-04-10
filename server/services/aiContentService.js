import dotenv from "dotenv";
dotenv.config();

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.0-flash-001";
const TIMEOUT_MS = 30000; // 30 second timeout

// ── helpers ──────────────────────────────────────────────────────────────

function getAPIKey() {
  return process.env.OPENROUTER_API_KEY || "";
}

function hasAIKey() {
  const key = getAPIKey();
  return Boolean(key && key.startsWith("sk-or-"));
}

/**
 * Structured result returned by every AI content helper.
 * @typedef {{ success: boolean, data: any, reason: string|null }} AIResult
 */
function ok(data) {
  return { success: true, data, reason: null };
}
function fail(reason) {
  return { success: false, data: null, reason };
}

// ── core OpenRouter caller with full error diagnostics ───────────────

async function callOpenRouter(systemPrompt, userPrompt, temperature = 0.4, maxTokens = 2500) {
  const apiKey = getAPIKey();

  if (!apiKey) {
    return fail("Missing OPENROUTER_API_KEY — no API key configured on server");
  }
  if (!apiKey.startsWith("sk-or-")) {
    return fail("Invalid OPENROUTER_API_KEY — key must start with sk-or-");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3001",
        "X-Title": "VidhyaPath Learning",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = "";
      try {
        const body = await response.text();
        // Try to extract a human-readable message
        try {
          const parsed = JSON.parse(body);
          errorDetail = parsed?.error?.message || parsed?.error || body.slice(0, 200);
        } catch {
          errorDetail = body.slice(0, 200);
        }
      } catch {
        errorDetail = "Could not read error body";
      }
      return fail(`OpenRouter HTTP ${response.status}: ${errorDetail}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    if (!content) {
      return fail("OpenRouter returned empty content — model may have blocked the response");
    }

    return ok(content);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      return fail(`OpenRouter request timed out after ${TIMEOUT_MS / 1000}s`);
    }
    return fail(`Network/fetch error: ${error.message}`);
  }
}

// ── Validators ───────────────────────────────────────────────────────

function validateNotes(notes) {
  if (!Array.isArray(notes) || notes.length < 3) return null;
  const cleaned = notes
    .map((item) => String(item || "").replace(/^[*-]\s*/, "").replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
  if (cleaned.length < 3) return null;
  return cleaned;
}

function validateLesson(text) {
  if (typeof text !== "string") return null;
  const cleaned = text.trim();
  if (!cleaned) return null;
  const lines = cleaned.split(/\n+/).filter(Boolean);
  if (lines.length < 5) return null;
  return cleaned;
}

function validateQuiz(quiz) {
  if (!Array.isArray(quiz) || quiz.length < 3 || quiz.length > 10) return null;

  const normalized = quiz.map((question) => {
    if (!question || typeof question.question !== "string") return null;
    if (!Array.isArray(question.options) || question.options.length !== 4) return null;
    const options = question.options.map((option) => String(option || "").trim());
    const answer = String(question.answer || "").trim();
    if (!answer || !options.includes(answer) || options.some((o) => !o)) return null;
    return { question: question.question.trim(), options, answer };
  });

  return normalized.every(Boolean) ? normalized : null;
}

// ── Notes Generation ─────────────────────────────────────────────────

export async function generateNotesWithAI(standard, subject, chapter) {
  const result = await callOpenRouter(
    "You are an expert revision coach for Indian school students. Output ONLY the bullet points. Do NOT include any introductory text, headings, or explanations before the points.",
    `Create concise revision notes for "${chapter}" in class ${standard} ${subject}.

Requirements:
- Exactly 5 bullet points
- Each point should be a key concept or formula
- Focus on exam-important points
- Keep each point to 1-2 sentences
- Do NOT include any intro text like "Here are..." — start directly with points

Output format (plain text, one point per line, start directly):
- Point 1
- Point 2
- Point 3
- Point 4
- Point 5`,
    0.4,
    1500
  );

  if (!result.success) {
    console.error(`[AI Notes] Failed for "${chapter}": ${result.reason}`);
    return { success: false, data: null, reason: result.reason };
  }

  const text = result.data;
  const rawLines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[*-]\s*/, "").replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean)
    // Filter out introductory/meta lines that are not actual notes
    .filter((line) => {
      const lower = line.toLowerCase();
      // Skip lines that are clearly introductory
      if (lower.startsWith("okay") || lower.startsWith("sure") || lower.startsWith("here are") || lower.startsWith("here's") || lower.startsWith("following")) return false;
      // Skip lines ending with ':' that are likely headers
      if (lower.endsWith(":") && line.length < 60) return false;
      return true;
    });

  const notes = validateNotes(rawLines);
  if (!notes) {
    return {
      success: false,
      data: null,
      reason: `AI returned invalid notes format (got ${rawLines.length} lines, need ≥3 valid points)`,
    };
  }

  // Keep only the first 5 actual notes, then append marker
  const trimmedNotes = notes.slice(0, 5);

  // Append the AI-generated marker as the last line
  trimmedNotes.push("✨ AI Generated");

  return { success: true, data: trimmedNotes, reason: null };
}

// ── Lesson Generation ────────────────────────────────────────────────

export async function generateLessonWithAI(standard, subject, chapter) {
  const result = await callOpenRouter(
    "You are an expert school teacher. Follow the user's structure exactly. Output only plain text.",
    `Explain the chapter "${chapter}" for a class ${standard} ${subject} student.

Requirements:
- 15 to 30 lines
- Simple language a student can understand
- Step-by-step explanation
- Include examples from daily life
- Include any formulas using Unicode symbols (², ³, √, π, θ, ÷, ×)
- No bullet points, write in paragraph form

Output ONLY plain text.`,
    0.5,
    3000
  );

  if (!result.success) {
    console.error(`[AI Lesson] Failed for "${chapter}": ${result.reason}`);
    return { success: false, data: null, reason: result.reason };
  }

  const lesson = validateLesson(result.data);
  if (!lesson) {
    const lineCount = (result.data || "").split(/\n+/).filter(Boolean).length;
    return {
      success: false,
      data: null,
      reason: `AI returned lesson too short (${lineCount} lines, need ≥5)`,
    };
  }

  // Append AI generated marker
  const markedLesson = lesson + "\n\n✨ AI Generated";

  return { success: true, data: markedLesson, reason: null };
}

// ── Quiz Generation ──────────────────────────────────────────────────

export async function generateQuizWithAI(standard, subject, chapter) {
  const result = await callOpenRouter(
    "You are an expert quiz generator for Indian school students. Output JSON only with no markdown or fences.",
    `Generate a quiz for "${chapter}" for class ${standard} ${subject}.

Requirements:
- 5 multiple choice questions
- Each question has exactly 4 options
- Provide correct answer that matches one option exactly
- Questions should test understanding, not just memory

Output JSON format ONLY (no markdown, no code fences):
[
  {
    "question": "...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A"
  }
]`,
    0.3,
    2500
  );

  if (!result.success) {
    console.error(`[AI Quiz] Failed for "${chapter}": ${result.reason}`);
    return { success: false, data: null, reason: result.reason };
  }

  const text = result.data;

  try {
    // Try to extract JSON array from the response
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(arrayMatch ? arrayMatch[0] : text);
    const quiz = validateQuiz(parsed);

    if (!quiz) {
      return {
        success: false,
        data: null,
        reason: `AI returned quiz with invalid structure (missing fields, wrong option count, or answer not in options)`,
      };
    }

    return { success: true, data: quiz, reason: null };
  } catch (parseError) {
    return {
      success: false,
      data: null,
      reason: `AI returned non-JSON response: ${parseError.message}`,
    };
  }
}

// ── Availability check ───────────────────────────────────────────────

export function isContentAIAvailable() {
  return hasAIKey();
}
