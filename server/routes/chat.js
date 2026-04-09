import { Router } from 'express';
import { getOne } from '../db.js';
import { isAIAvailable } from '../claude.js';
import { getSyllabusContext, getChapters } from '../syllabus.js';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';

// AI Chat - student asks study questions
router.post('/message', async (req, res) => {
  try {
    const { student_id, message, history } = req.body;
    const student = getOne('SELECT * FROM students WHERE id = ?', [student_id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const syllabusCtx = getSyllabusContext(student.board || 'CBSE', student.grade, student.goals);

    // Try AI first
    if (API_KEY && API_KEY.startsWith('sk-or-')) {
      try {
        const messages = [
          {
            role: 'system',
            content: `You are PathWise AI Tutor — a warm, patient, encouraging tutor for Indian ${student.board || 'CBSE'} Class ${student.grade} students. 

RULES:
- Explain concepts at Grade 6 reading level maximum
- Use real-life examples from India (markets, festivals, cooking, cricket)
- If student asks about a topic, reference the actual ${student.board} Class ${student.grade} syllabus
- Be encouraging — these are students from underprivileged backgrounds
- Keep answers concise (2-4 paragraphs max)
- Use emojis to make it friendly
- If asked to solve a problem, show step-by-step
- Respond in ${student.language === 'hi' ? 'Hindi' : 'English'}

SYLLABUS CONTEXT:
${syllabusCtx}`
          },
          ...(history || []).slice(-8).map(h => ({ role: h.role, content: h.content })),
          { role: 'user', content: message }
        ];

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'PathWise Chatbot'
          },
          body: JSON.stringify({ model: MODEL, messages, max_tokens: 1024, temperature: 0.7 })
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content || '';
          if (reply) return res.json({ reply, ai_powered: true });
        } else {
          const errText = await response.text();
          console.error('Chat AI HTTP error:', response.status, errText);
        }
      } catch (err) {
        console.error('Chat AI error:', err.message);
      }
    }

    // Smart fallback — NOT "offline" — uses syllabus data to give real answers
    const reply = generateSmartReply(message, student, syllabusCtx);
    res.json({ reply, ai_powered: false });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

function generateSmartReply(message, student, syllabusCtx) {
  const msg = message.toLowerCase();
  const isHindi = student.language === 'hi';
  const name = student.name;
  const board = student.board || 'CBSE';
  const grade = student.grade || 8;

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('namaste') || msg.includes('नमस्ते')) {
    return isHindi
      ? `नमस्ते ${name}! 😊 मैं PathWise AI Tutor हूँ। आप मुझसे ${board} Class ${grade} के किसी भी विषय के बारे में पूछ सकते हैं। क्या पढ़ना है आज?`
      : `Hello ${name}! 😊 I'm your PathWise AI Tutor. You can ask me about any ${board} Class ${grade} topic. What would you like to study today?`;
  }

  if (msg.includes('weak') || msg.includes('कमज़ोर') || msg.includes('difficult') || msg.includes('hard')) {
    return isHindi
      ? `कोई बात नहीं ${name}! 💪 हर किसी को कुछ विषय कठिन लगते हैं। सबसे अच्छा तरीका है कि बुनियादी बातों से शुरू करें। Dashboard पर जाकर "📖 पढ़ें" बटन दबाएँ और फिर क्विज़ दें — इससे आपको पता चलेगा कहाँ सुधार की ज़रूरत है!`
      : `No worries ${name}! 💪 Everyone finds some topics hard. The best approach is to start from basics. Go to Dashboard, click "📖 Study" to read the lesson first, then take the quiz — it will show you exactly where to improve!`;
  }

  if (msg.includes('syllabus') || msg.includes('chapter') || msg.includes('पाठ्यक्रम') || msg.includes('अध्याय')) {
    // Actually list the chapters from syllabus
    const subjects = (student.goals || 'Math').split(',').map(s => s.trim());
    let chapterList = '';
    for (const sub of subjects) {
      const chapters = getChapters(board, sub, grade);
      if (chapters.length > 0) {
        chapterList += `\n📚 ${sub}:\n`;
        chapters.forEach((ch, i) => { chapterList += `  ${i+1}. ${ch.name}\n`; });
      }
    }
    return isHindi
      ? `${name}, आपका ${board} Class ${grade} पाठ्यक्रम:\n${chapterList}\n"📋 Notes" पर जाकर हर अध्याय के विस्तृत नोट्स पढ़ सकते हैं! 📖`
      : `${name}, here's your ${board} Class ${grade} syllabus:\n${chapterList}\nGo to "📋 Notes" to read detailed notes for each chapter! 📖`;
  }

  if (msg.includes('quiz') || msg.includes('test') || msg.includes('क्विज़') || msg.includes('परीक्षा')) {
    return isHindi
      ? `क्विज़ लेने के लिए Dashboard पर किसी भी विषय के आगे "📝 क्विज़" बटन दबाएँ। AI आपके स्तर के हिसाब से अलग-अलग सवाल बनाता है! क्विज़ के बाद विस्तृत विश्लेषण मिलेगा! 📊`
      : `To take a quiz, go to Dashboard and click "📝 Quiz" next to any topic. AI creates unique questions based on your level! After the quiz, you'll get a detailed RPG-style analysis! 📊`;
  }

  if (msg.includes('help') || msg.includes('मदद') || msg.includes('how') || msg.includes('कैसे')) {
    return isHindi
      ? `मैं आपकी मदद के लिए हूँ! 🎓\n• किसी भी विषय पर सवाल पूछें\n• "fraction क्या है?" जैसे सवाल करें\n• Dashboard से पढ़ें और क्विज़ दें\n• Notes में अध्यायवार नोट्स देखें\n\nबस पूछिए, मैं समझा दूँगा! 😊`
      : `I'm here to help! 🎓\n• Ask me about any topic\n• Try questions like "What is a fraction?"\n• Use Dashboard to study and take quizzes\n• Check Notes for chapter-wise study material\n\nJust ask, and I'll explain! 😊`;
  }

  // Try to match the message to a syllabus topic and give intelligent answer
  const subjects = (student.goals || 'Math').split(',').map(s => s.trim());
  for (const sub of subjects) {
    const chapters = getChapters(board, sub, grade);
    for (const ch of chapters) {
      const chLower = ch.name.toLowerCase();
      if (msg.includes(chLower) || chLower.split(' ').some(word => word.length > 3 && msg.includes(word.toLowerCase()))) {
        const topics = ch.important.join(', ');
        const weakAreas = ch.weak_common.join(', ');
        return isHindi
          ? `${name}, "${ch.name}" एक महत्वपूर्ण अध्याय है! 📖\n\n📌 मुख्य विषय: ${topics}\n\n⚠️ आम गलतियाँ: ${weakAreas}\n\n💡 सुझाव: पहले Notes में इस अध्याय के नोट्स पढ़ें, फिर क्विज़ दें। हर गलती से सीखें!\n\nक्या आप इस विषय के बारे में कुछ और जानना चाहते हैं?`
          : `${name}, "${ch.name}" is an important chapter! 📖\n\n📌 Key topics: ${topics}\n\n⚠️ Common mistakes: ${weakAreas}\n\n💡 Tip: Read the notes for this chapter first, then take the quiz. Learn from every mistake!\n\nWould you like to know more about this topic?`;
      }
    }
  }

  // Default — DO NOT say "offline mode"
  return isHindi
    ? `${name}, अच्छा सवाल है! 🤔 मैं अभी इस सवाल का विस्तृत जवाब देने की कोशिश कर रहा हूँ। कृपया "📖 पढ़ें" बटन से इस विषय के नोट्स देखें या "📋 Notes" से अध्यायवार पढ़ें। अगर कोई specific सवाल पूछना है, तो बताइए — जैसे "fraction क्या है?" या "Pythagoras theorem समझाओ"! 😊`
    : `${name}, great question! 🤔 For this topic, check the "📖 Study" section for detailed notes or go to "📋 Notes" for chapter-wise material. Try asking specific questions like "What is a fraction?" or "Explain Pythagoras theorem" — I can help much better with specific topics! 😊`;
}

export default router;
