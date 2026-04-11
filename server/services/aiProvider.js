import dotenv from "dotenv";

dotenv.config();

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

export function getAIConfig() {
  return {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
  };
}

export function hasAIKey() {
  const { apiKey } = getAIConfig();
  return Boolean(apiKey && apiKey.startsWith("sk-or-"));
}

export async function callAI(messages, options = {}) {
  if (!hasAIKey()) {
    return null;
  }

  const { apiKey, model } = getAIConfig();
  const {
    temperature = 0.4,
    maxTokens = 2500,
    title = "PathWise AI",
  } = options;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3001",
        "X-Title": title,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter request failed:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("AI provider error:", error.message);
    return null;
  }
}
