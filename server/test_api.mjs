import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.OPENROUTER_API_KEY;
const models = ['google/gemini-2.0-flash-001', 'anthropic/claude-3-haiku', 'anthropic/claude-sonnet-4.6'];

for (const model of models) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost:3001' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say "hello" in JSON: {"msg":"hello"}' }],
        max_tokens: 50
      })
    });
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || data.error?.message || 'no response';
    console.log(`${model}: ${response.status} → ${content.substring(0, 80)}`);
  } catch (e) {
    console.log(`${model}: ERROR → ${e.message}`);
  }
}
