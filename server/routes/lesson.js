import { Router } from 'express';
import { getOne } from '../db.js';
import { isAIAvailable, generateDetailedNotes } from '../claude.js';
import { getChapters, getSubjects } from '../syllabus.js';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';

async function generateLessonAI(topicName, grade, level, language, board) {
  if (!API_KEY || !API_KEY.startsWith('sk-or-')) return null;
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'PathWise Learning'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a patient ${board || 'CBSE'} Class ${grade} teacher. Explain concepts simply using everyday examples. Include ALL formulas with Unicode (², ³, √, π, ÷, ×). Always respond with valid JSON only — no markdown, no code fences.`
          },
          {
            role: 'user',
            content: `Create a DETAILED lesson on "${topicName}" for ${board || 'CBSE'} Grade ${grade} student at ${level} level.

Return JSON:
{
  "title": "Lesson title",
  "introduction": "3-4 sentences introducing the topic with its real-life relevance",
  "sections": [
    {
      "heading": "Section heading",
      "content": "3-5 detailed paragraphs. Include formulas using Unicode (², √, π). Give step-by-step explanations. Use Indian examples (₹, cricket, market).",
      "example": "A fully worked-out numerical example with step-by-step solution",
      "tip": "A memory trick or exam tip"
    }
  ],
  "key_points": ["Point 1 with formula if applicable", "Point 2", "Point 3", "Point 4", "Point 5"],
  "practice_problems": [
    {"problem": "A numerical problem", "hint": "Which formula/method to use", "answer": "Step-by-step answer"}
  ],
  "formulas": ["Formula 1: name = expression", "Formula 2: name = expression"],
  "real_world": "2-3 sentences about real-life applications",
  "encouragement": "1 sentence of encouragement"
}

Include 4-5 sections, 5-6 key points, 3-4 practice problems, and ALL relevant formulas.
Each section content must be 3+ paragraphs with detailed explanations — NOT just 1-2 lines.
Respond in ${language === 'hi' ? 'Hindi' : 'English'}.`
          }
        ],
        max_tokens: 8192,
        temperature: 0.7
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch (err) {
    console.error('Lesson generation error:', err.message);
    return null;
  }
}

function generateLessonLocal(topicName, grade, level, language) {
  const isHindi = language === 'hi';
  return {
    title: topicName,
    introduction: isHindi
      ? `आज हम "${topicName}" के बारे में विस्तार से सीखेंगे। यह ${grade}वीं कक्षा का एक बहुत महत्वपूर्ण अध्याय है। इस पाठ में हम मूल अवधारणाओं, सूत्रों, और हल किए गए उदाहरणों को समझेंगे।`
      : `Today we'll learn about "${topicName}" in detail. This is an important chapter in Grade ${grade}. We'll cover core concepts, formulas, and solved examples.`,
    sections: [
      {
        heading: isHindi ? "मूल अवधारणा" : "The Basic Idea",
        content: isHindi
          ? `"${topicName}" को समझने के लिए हमें पहले इसकी बुनियादी बातें जानना ज़रूरी है। यह विषय कक्षा ${grade} के पाठ्यक्रम में बहुत महत्वपूर्ण है और परीक्षा में इससे कई सवाल आते हैं।\n\nइस विषय की शुरुआत सरल समझ से होती है। जैसे-जैसे आप अभ्यास करेंगे, आपकी समझ गहरी होती जाएगी। याद रखें — हर बड़ी इमारत की शुरुआत नींव से होती है।\n\nरोज़मर्रा की ज़िंदगी में यह विषय हर जगह दिखता है — बाज़ार में सामान खरीदते समय, खाना बनाते समय, या खेल का स्कोर रखते समय।`
          : `To understand "${topicName}", we first need to know its basics. This topic is very important in Grade ${grade} curriculum and many exam questions come from it.\n\nThe topic starts with simple understanding. As you practice, your understanding deepens. Remember — every big building starts with a strong foundation.\n\nIn daily life, this topic appears everywhere — when shopping at the market, cooking food, or keeping game scores.`,
        example: isHindi
          ? "उदाहरण: अगर एक किलो चावल ₹50 का है, तो 3.5 किलो चावल का दाम = ₹50 × 3.5 = ₹175"
          : "Example: If 1 kg rice costs ₹50, then 3.5 kg costs = ₹50 × 3.5 = ₹175",
        tip: isHindi
          ? "💡 टिप: नया विषय हमेशा आसान उदाहरणों से शुरू करें, फिर कठिन सवालों की ओर बढ़ें।"
          : "💡 Tip: Always start a new topic with simple examples, then move to harder problems."
      },
      {
        heading: isHindi ? "सूत्र और नियम" : "Formulas & Rules",
        content: isHindi
          ? `इस अध्याय के सभी महत्वपूर्ण सूत्रों को याद करना ज़रूरी है। सूत्र केवल याद करने से काम नहीं चलता — उन्हें समझना ज़रूरी है कि वे कैसे और क्यों काम करते हैं।\n\nहर सूत्र को कम से कम 3-4 सवालों में अभ्यास करें। पहले सरल संख्याओं से शुरू करें, फिर जटिल सवालों पर जाएँ।\n\nपरीक्षा में सूत्र लिखना अंक दिलाता है — इसलिए हमेशा सूत्र पहले लिखें, फिर मान रखें, और फिर हल करें।`
          : `It's important to memorize all key formulas of this chapter. But just memorizing isn't enough — understanding how and why they work is crucial.\n\nPractice each formula in at least 3-4 problems. Start with simple numbers, then move to complex ones.\n\nIn exams, writing formulas earns marks — so always write formula first, substitute values, then solve.`,
        example: isHindi
          ? "चरण 1: सूत्र लिखें → चरण 2: दिए गए मान रखें → चरण 3: गणना करें → चरण 4: इकाई लिखें → चरण 5: उत्तर जाँचें"
          : "Step 1: Write formula → Step 2: Substitute values → Step 3: Calculate → Step 4: Write units → Step 5: Verify answer",
        tip: isHindi
          ? "💡 टिप: सूत्रों को फ्लैशकार्ड पर लिखें और रोज़ सुबह 5 मिनट देखें — एक हफ्ते में सब याद हो जाएगा!"
          : "💡 Tip: Write formulas on flashcards and review 5 minutes every morning — you'll memorize them in a week!"
      },
      {
        heading: isHindi ? "हल किया गया उदाहरण" : "Solved Example",
        content: isHindi
          ? `आइए एक सवाल को चरण-दर-चरण हल करते हैं। ध्यान से हर कदम समझें और खुद भी कॉपी में करके देखें।\n\nपहले सवाल पढ़ें और समझें कि क्या पूछा गया है। फिर सोचें कि कौन सा सूत्र या तरीका इस्तेमाल होगा।\n\nजब आप खुद हल करें, तो हर कदम लिखें — परीक्षा में कदम-दर-कदम लिखने से पूरे अंक मिलते हैं, भले ही अंतिम उत्तर गलत हो।`
          : `Let's solve a problem step-by-step. Carefully understand each step and try solving it yourself in your notebook.\n\nFirst read the question and understand what's being asked. Then think about which formula or method to use.\n\nWhen you solve it yourself, write every step — in exams, showing steps earns full marks even if the final answer has a small error.`,
        example: isHindi
          ? "दिया: ... | ज्ञात करना: ... | हल: सूत्र → मान रखें → गणना → उत्तर = ..."
          : "Given: ... | Find: ... | Solution: Formula → Substitute → Calculate → Answer = ...",
        tip: isHindi
          ? "💡 टिप: परीक्षा में 'दिया,' 'ज्ञात करना,' और 'सूत्र' अलग-अलग लिखने से अंक बढ़ते हैं।"
          : "💡 Tip: In exams, writing 'Given,' 'To Find,' and 'Formula' separately earns more marks."
      }
    ],
    key_points: isHindi
      ? ["मूल अवधारणा को अच्छे से समझें", "सभी सूत्र याद करें और अभ्यास करें", "रोज़ 15 मिनट अभ्यास करें", "गलतियाँ पहचानें और सुधारें", "असल ज़िंदगी से जोड़कर समझें"]
      : ["Master the basic concept", "Memorize and practice all formulas", "Practice 15 minutes daily", "Identify and fix your mistakes", "Connect to real-life examples"],
    practice_problems: [
      { problem: isHindi ? "इस विषय की सबसे ज़रूरी बात अपने शब्दों में लिखें।" : "Write the most important idea of this topic in your own words.", hint: isHindi ? "मुख्य सूत्र या नियम के बारे में सोचिए।" : "Think about the main formula or rule.", answer: isHindi ? "अपनी समझ लिखें — कोई एक सही जवाब नहीं है!" : "Write your understanding — there's no single correct answer!" },
      { problem: isHindi ? "इस विषय से जुड़ा एक सवाल खुद बनाएँ और हल करें।" : "Create your own problem on this topic and solve it.", hint: isHindi ? "छोटी संख्याएँ इस्तेमाल करें।" : "Use small numbers to keep it simple.", answer: isHindi ? "अपना सवाल और हल जाँचें!" : "Check if your question and answer make sense!" },
      { problem: isHindi ? "इस विषय में सबसे आम गलती क्या होती है? कैसे बचें?" : "What's the most common mistake in this topic? How to avoid it?", hint: isHindi ? "सूत्र या चरण भूलने के बारे में सोचें।" : "Think about formula or step-skipping errors.", answer: isHindi ? "हर सवाल में सूत्र पहले लिखें और इकाई मत भूलें!" : "Always write formula first and don't forget units!" }
    ],
    real_world: isHindi
      ? `"${topicName}" का उपयोग इंजीनियर, डॉक्टर, और दुकानदार सभी करते हैं। बैंक में ब्याज गणना, दुकान में लाभ-हानि, और निर्माण में माप — सब इसी विषय पर आधारित है।`
      : `"${topicName}" is used by engineers, doctors, and shopkeepers. Bank interest calculation, profit-loss in shops, and measurements in construction — all depend on this topic.`,
    encouragement: isHindi
      ? "आप बहुत अच्छा कर रहे हैं! 🌟 हर दिन थोड़ा पढ़ने से बड़ा फ़र्क पड़ता है। हिम्मत रखिए!"
      : "You're doing amazing! 🌟 A little study every day makes a big difference. Keep going!"
  };
}

// Generate lesson for a topic
router.post('/generate', async (req, res) => {
  try {
    const { student_id, topic_name } = req.body;
    const student = getOne('SELECT * FROM students WHERE id = ?', [student_id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    let lesson = null;
    if (isAIAvailable()) {
      console.log(`🤖 Generating detailed lesson for "${topic_name}" (${student.board} Class ${student.grade})...`);
      lesson = await generateLessonAI(topic_name, student.grade, student.level, student.language, student.board);
    }
    if (!lesson) {
      console.log(`📚 Generating local lesson for "${topic_name}"...`);
      lesson = generateLessonLocal(topic_name, student.grade, student.level, student.language);
    }

    res.json({ topic: topic_name, lesson, ai_powered: isAIAvailable() });
  } catch (err) {
    console.error('Error generating lesson:', err);
    res.status(500).json({ error: 'Failed to generate lesson' });
  }
});

// Pre-generate chapter-wise notes — uses AI for detailed content when available
router.post('/notes', async (req, res) => {
  try {
    const { board, grade, subjects, student_id } = req.body;
    const subjectList = subjects ? subjects.split(',').map(s => s.trim()) : getSubjects(board || 'CBSE', parseInt(grade) || 8);
    const notes = {};
    const student = student_id ? getOne('SELECT * FROM students WHERE id = ?', [student_id]) : null;

    for (const subject of subjectList) {
      const chapters = getChapters(board || 'CBSE', subject, parseInt(grade) || 8);
      if (chapters.length === 0) continue;

      // For each chapter, try AI-generated deep notes first
      const chapterNotes = [];
      for (const ch of chapters) {
        let chapterData = null;
        
        let weakConcepts = [];
        if (student) {
          try {
            const pastProgress = getOne('SELECT weak_concepts FROM topic_progress WHERE student_id = ? AND topic_name = ?', [student.id, ch.name]);
            if (pastProgress?.weak_concepts) {
              weakConcepts = JSON.parse(pastProgress.weak_concepts);
            }
          } catch (e) {}
        }
        
        // Try AI for detailed notes (only for first 3 chapters to avoid timeout)
        if (isAIAvailable() && chapterNotes.length < 3) {
          try {
            chapterData = await generateDetailedNotes(ch.name, board || 'CBSE', parseInt(grade) || 8, subject, student?.language || 'en', weakConcepts);
          } catch (e) {
            console.log(`AI notes failed for ${ch.name}, using fallback`);
          }
        }

        // Fallback: generate detailed notes from syllabus data
        if (!chapterData) {
          chapterData = {
            chapter: ch.name,
            important_topics: ch.important,
            common_weak_areas: ch.weak_common,
            summary: `The chapter "${ch.name}" is a fundamental component of the ${board || 'CBSE'} Class ${grade} ${subject} curriculum. It primarily covers core themes such as ${ch.important.join(', ')}. Understanding these foundational elements is critical, especially since students frequently struggle with nuances such as ${ch.weak_common.join(' and ')}. Mastering this chapter builds the necessary groundwork for more advanced topics in higher classes.`,
            key_concepts: ch.important.map((topic, i) => ({
              concept: topic,
              explanation: `The concept of ${topic} is highly essential in this subject. It refers to the fundamental rules governing this specific area of study. In real-world applications, ${topic} can be observed in various daily phenomena and industrial applications. Understanding the mechanics of ${topic} allows you to not only score well in exams but also apply theoretical knowledge to practical, every-day problems. Ensure you thoroughly review the steps involved in deriving or applying this concept.`,
              formula: i === 0 && subject === 'Math' ? 'Formula Placeholder: x = (-b ± √(b² - 4ac)) / 2a' : null,
              example: `For instance, if you are asked to demonstrate ${topic}, always begin by writing down the given values, followed by the applicable formula, and then systematically show all step-by-step calculations before arriving at the final unit-labeled answer.`
            })),
            study_tips: [
              `Focus early on mastering ${ch.important[0]} as it forms the basis for the rest of the chapter.`,
              `Practice at least 10 varied numericals or conceptual questions related to ${ch.important[1] || ch.important[0]} to ensure rapid recall during exams.`,
              `Beware of common pitfalls linked to ${ch.weak_common[0]}; double-check your initial assumptions and sign conventions here.`,
              `Create a one-page summary sheet containing diagrams and formulas for quick 5-minute revisions every morning.`
            ],
            exam_tips: [
              `Examiners frequently test this chapter with application-based questions rather than direct definitions.`,
              `Always provide a well-labelled diagram or step-by-step logical deduction to secure maximum partial marks even if the final answer is slightly off.`
            ],
            practice_questions: [
              `Q1: Analyze the principles behind ${ch.important[0]} and apply it to a real-world scenario. (Hint: Break down the definition into three distinct parts)`,
              `Q2: Solve a complex problem involving both ${ch.important[0]} and ${ch.important[1] || 'its applications'}. (Hint: Write down what is 'Given' first)`
            ]
          };
        }

        chapterNotes.push(chapterData);
      }

      notes[subject] = chapterNotes;
    }

    console.log(`📚 Generated notes for ${board} Class ${grade}: ${Object.keys(notes).join(', ')} (${Object.values(notes).flat().length} chapters)`);
    res.json({ notes, board, grade, ai_powered: isAIAvailable() });
  } catch (err) {
    console.error('Notes generation error:', err);
    res.status(500).json({ error: 'Failed to generate notes' });
  }
});

// Get AI-detailed notes for a single chapter
router.post('/chapter-notes', async (req, res) => {
  try {
    const { chapter, board, grade, subject, student_id } = req.body;
    const student = student_id ? getOne('SELECT * FROM students WHERE id = ?', [student_id]) : null;
    
    let weakConcepts = [];
    if (student) {
      try {
        const pastProgress = getOne('SELECT weak_concepts FROM topic_progress WHERE student_id = ? AND topic_name = ?', [student.id, chapter]);
        if (pastProgress?.weak_concepts) {
          weakConcepts = JSON.parse(pastProgress.weak_concepts);
        }
      } catch (e) {}
    }

    let notes = null;
    if (isAIAvailable()) {
      console.log(`🤖 Generating detailed notes for "${chapter}" (${board} Class ${grade} ${subject})...`);
      notes = await generateDetailedNotes(chapter, board || 'CBSE', parseInt(grade) || 8, subject, student?.language || 'en', weakConcepts);
    }

    if (!notes) {
      const chapters = getChapters(board || 'CBSE', subject, parseInt(grade) || 8);
      const ch = chapters.find(c => c.name === chapter) || chapters[0];
      if (ch) {
        notes = {
          chapter: ch.name,
          important_topics: ch.important,
          common_weak_areas: ch.weak_common,
          summary: `${ch.name}: Focus on ${ch.important.join(', ')}. Common mistakes: ${ch.weak_common.join(', ')}.`,
          study_tips: [`Practice ${ch.important[0]} daily`, `Avoid: ${ch.weak_common[0]}`]
        };
      }
    }

    res.json({ notes, ai_powered: isAIAvailable() });
  } catch (err) {
    console.error('Chapter notes error:', err);
    res.status(500).json({ error: 'Failed to generate chapter notes' });
  }
});

export default router;
