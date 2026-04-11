import dotenv from 'dotenv';
import { getSyllabusContext } from './syllabus.js';
dotenv.config();

const API_KEY = process.env.OPENROUTER_API_KEY;
const hasValidKey = API_KEY && API_KEY.startsWith('sk-or-');
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';

if (hasValidKey) {
  console.log('✅ OpenRouter API connected — AI-powered responses enabled');
} else {
  console.log('⚠️  No OpenRouter API key — using local AI engine');
}

async function callAI(systemPrompt, userPrompt, maxTokens = 4096) {
  if (!hasValidKey) return null;
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter API error:', response.status, errText);
      return null;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]);
    return text;
  } catch (err) {
    console.error('AI API error:', err.message);
    return null;
  }
}

export async function generatePath(student) {
  const syllabusCtx = getSyllabusContext(student.board || 'CBSE', student.grade, student.goals);
  
  const systemPrompt = `You are an adaptive learning assistant for Indian students. Create personalized learning paths aligned to ${student.board || 'CBSE'} syllabus. Respond with valid JSON only — no markdown, no code fences.`;
  
  const userPrompt = `Student: ${student.name}, Age ${student.age}, Grade ${student.grade}, Board: ${student.board || 'CBSE'}, Goals: ${student.goals}, Level: ${student.level}, Study time: ${student.study_time}/day.

=== SYLLABUS REFERENCE ===
${syllabusCtx}
=== END ===

Generate a personalized 2-week learning path. Focus on commonly weak areas first to build strong foundations.
Return JSON array of 8-12 topics:
[{"topic": "Chapter: Specific topic", "why_it_matters": "Why important + common mistakes", "duration_minutes": 30, "difficulty": 2, "resource_description": "Study guide", "chapter": "Chapter name", "is_weak_area": true}]
Respond in ${student.language === 'hi' ? 'Hindi' : 'English'}`;

  return await callAI(systemPrompt, userPrompt);
}

export async function updatePath(student, completedTopics, weakAreas, strongAreas) {
  const syllabusCtx = getSyllabusContext(student.board || 'CBSE', student.grade, student.goals);
  
  const systemPrompt = `You are an adaptive learning assistant. Update learning path based on progress. Respond with valid JSON only.`;
  const userPrompt = `Student ${student.name}, Grade ${student.grade}, Board: ${student.board || 'CBSE'}, Goals: ${student.goals}.
Completed: ${completedTopics.join(', ')}.
Weak: ${weakAreas.join(', ') || 'None'}.
Strong: ${strongAreas.join(', ') || 'None'}.

=== SYLLABUS ===
${syllabusCtx}
=== END ===

Return JSON array of 8-12 topics:
[{"topic": "...", "why_it_matters": "...", "duration_minutes": 30, "difficulty": 2, "resource_description": "...", "chapter": "...", "is_review": false, "is_weak_area": false}]
Respond in ${student.language === 'hi' ? 'Hindi' : 'English'}`;

  return await callAI(systemPrompt, userPrompt);
}

// UPGRADED: Weakness-aware dynamic quiz generation
export async function generateQuiz(topicName, grade, language, board, pastWeaknesses = [], attemptCount = 0) {
  const syllabusCtx = getSyllabusContext(board || 'CBSE', grade, '');
  
  let weaknessContext = '';
  if (pastWeaknesses.length > 0) {
    weaknessContext = `\n\nThis student has taken this quiz ${attemptCount} time(s) before and got these concepts wrong:\n${pastWeaknesses.map((w, i) => `${i+1}. ${w}`).join('\n')}\nGenerate DIFFERENT questions this time. Focus MORE on the concepts they got wrong. Make questions that test understanding from different angles.`;
  }
  
  const systemPrompt = `You are a quiz generator for Indian ${board || 'CBSE'} Class ${grade} students. Generate UNIQUE questions each time — never repeat the same question. Each question must test conceptual understanding, not just memorization. Respond with valid JSON only — no markdown, no code fences.`;
  
  const userPrompt = `Generate 5 MCQs on "${topicName}" for ${board || 'CBSE'} Grade ${grade}.
${weaknessContext}

=== SYLLABUS ===
${syllabusCtx}
=== END ===

IMPORTANT: Generate completely UNIQUE questions different from any previous quiz. Use randomized scenarios, numbers, and contexts.
Each question should test a DIFFERENT concept/sub-topic within "${topicName}".

Return JSON: [{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct_answer": "A", "explanation": "Detailed explanation of why this is correct, with the formula/concept"}]
Respond in ${language === 'hi' ? 'Hindi' : 'English'}.`;

  return await callAI(systemPrompt, userPrompt);
}

export async function generateFeedback(score, topicName, weakAreas, language) {
  const systemPrompt = `You are an encouraging learning coach for Indian students. Keep language at Grade 6 reading level. Respond with valid JSON only.`;
  const userPrompt = `Student scored ${score}/5 on "${topicName}". Weak areas: ${weakAreas.join(', ') || 'None'}.
Return JSON: {"encouragement": "2 sentences of encouragement", "focus_next": "1 sentence on what to study next"}
Respond in ${language === 'hi' ? 'Hindi' : 'English'}.`;
  return await callAI(systemPrompt, userPrompt);
}

export async function generateReEngagement(student, lastTopic) {
  const systemPrompt = `You are a motivational learning coach. Keep it warm and simple. Respond with valid JSON only.`;
  const userPrompt = `Student ${student.name} hasn't studied in days. Last topic: "${lastTopic}".
Return JSON: {"motivation": "2 warm sentences", "recap": "1 sentence recap", "quick_tip": "1 study tip"}
Respond in ${student.language === 'hi' ? 'Hindi' : 'English'}.`;
  return await callAI(systemPrompt, userPrompt);
}

// NEW: Generate detailed AI-powered notes for a chapter
export async function generateDetailedNotes(chapterName, board, grade, subject, language, pastWeaknesses = []) {
  const syllabusCtx = getSyllabusContext(board || 'CBSE', grade, subject);
  
  let weaknessContext = '';
  if (pastWeaknesses && pastWeaknesses.length > 0) {
    weaknessContext = `\n\nIMPORTANT: The student has previously struggled with these concepts in this chapter: ${pastWeaknesses.join(', ')}. Please EMBHASIZE these topics in the notes. Simplify the explanations for these specific weak areas and provide extra examples to help the student overcome their difficulties.`;
  }
  
  const systemPrompt = `You are an expert ${board} Class ${grade} ${subject} teacher. Create detailed, exam-ready study notes with formulas, diagrams (as text), examples, and key points. Focus especially on strengthening the student's weak areas. Respond with valid JSON only — no markdown, no code fences.`;
  
  const userPrompt = `Create detailed study notes for the chapter "${chapterName}" from ${board} Class ${grade} ${subject}.${weaknessContext}

=== SYLLABUS ===
${syllabusCtx}
=== END ===

Return JSON:
{
  "chapter": "${chapterName}",
  "summary": "3-4 sentence overview of this chapter",
  "key_concepts": [
    {
      "concept": "Concept name",
      "explanation": "Detailed 3-5 sentence explanation with real-life examples (Make it simpler if it's one of their weak areas)",
      "formula": "Any relevant formula (use Unicode: ², ³, √, π, θ, ÷, ×, ≤, ≥, →) or null",
      "example": "A worked-out numerical example if applicable, or a practical example"
    }
  ],
  "important_topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
  "common_weak_areas": ["Weak area 1", "Weak area 2", "Weak area 3"],
  "study_tips": ["Tip 1", "Tip 2", "Tip 3"],
  "exam_tips": ["What examiners look for", "Common marking scheme patterns"],
  "practice_questions": ["Question 1 with hint", "Question 2 with hint"]
}

Make it DETAILED — each concept should have 3-5 sentences minimum, not just 1 line.
Include ALL formulas relevant to this chapter.
Respond in ${language === 'hi' ? 'Hindi' : 'English'}.`;

  return await callAI(systemPrompt, userPrompt, 8192);
}

// NEW: Generate AI-powered teacher analytics report
export async function generateTeacherReport(classData) {
  const systemPrompt = `You are an educational data analyst for Indian schools. Analyze student performance data and produce actionable insights for teachers. Respond with valid JSON only — no markdown, no code fences.`;
  
  const userPrompt = `Analyze this class performance data and generate an insightful report for the teacher.

=== CLASS DATA ===
Total Students: ${classData.totalStudents}
Average Progress: ${classData.avgProgress}%

Per-student quiz results:
${classData.studentSummaries.map(s => `- ${s.name} (Class ${s.grade}, ${s.board}): ${s.quizCount} quizzes taken, avg score ${s.avgScore}/5, weak topics: [${s.weakTopics.join(', ')}], status: ${s.status}`).join('\n')}

Most failed topics across class:
${classData.topWeakTopics.map(t => `- "${t.topic}": ${t.count} students struggling`).join('\n')}
=== END ===

Return JSON:
{
  "overall_assessment": "2-3 sentence summary of the class's overall performance",
  "weak_topics": [
    {"topic": "Topic name", "student_count": 5, "severity": "high/medium/low", "suggestion": "What the teacher should do about this topic"}
  ],
  "students_needing_help": [
    {"name": "Student name", "reason": "Why they need help", "priority": "urgent/moderate/low", "recommendation": "Specific action for the teacher"}
  ],
  "class_strengths": ["Area where class is doing well 1", "Area 2"],
  "action_items": ["Concrete step 1 for the teacher", "Concrete step 2", "Concrete step 3"]
}

Be specific and practical. Focus on actionable advice. Flag students who have multiple weak areas or consistently low scores as needing human help.`;

  return await callAI(systemPrompt, userPrompt, 4096);
}

export function isAIAvailable() {
  return hasValidKey;
}
