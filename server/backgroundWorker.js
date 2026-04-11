import { getOne, runSQL, getAll } from './db.js';
import { generateDetailedNotes, generateQuiz, isAIAvailable, fetchRealTimeSyllabus } from './claude.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Asynchronously auto-prepares detailed notes and quizzes for a student's fetched syllabus.
 * Limits preparation to core path top 10 topics initially to avoid API exhaustion on OpenRouter.
 */
export async function autoPrepareStudentResources(student_id) {
  if (!isAIAvailable()) {
    console.log(`[Worker] AI not available. Skipping auto-prep for student ${student_id}`);
    return;
  }

  try {
    const student = getOne('SELECT * FROM students WHERE id = ?', [student_id]);
    if (!student) return;

    let syllabusRow = getOne('SELECT * FROM student_syllabuses WHERE student_id = ?', [student_id]);
    
    // If not fetched yet, fetch and save real-time syllabus
    if (!syllabusRow) {
      console.log(`[Worker] Fetching real-time official syllabus from web for student ${student_id}...`);
      const dynamicSyllabus = await fetchRealTimeSyllabus(student.board, student.grade);
      
      if (dynamicSyllabus) {
        runSQL('INSERT INTO student_syllabuses (student_id, board, grade, syllabus_json) VALUES (?, ?, ?, ?)',
               [student_id, student.board, student.grade, JSON.stringify(dynamicSyllabus)]);
        syllabusRow = { syllabus_json: JSON.stringify(dynamicSyllabus) };
      } else {
        console.log(`[Worker] Failed to fetch. Halting worker for student ${student_id}`);
        return;
      }
    }

    const syllabusJson = JSON.parse(syllabusRow.syllabus_json);
    let allChapters = [];

    // Flatten into a processable linear array
    for (const [subject, chapters] of Object.entries(syllabusJson)) {
      for (const ch of chapters) {
        allChapters.push({ subject, name: ch.name });
      }
    }

    // Limit to the first 6 chapters (1-2 per subject) to drastically cut down token bloat while still "preparing" for them 
    const targetChapters = allChapters.slice(0, 6);
    console.log(`[Worker] Auto-preparing ${targetChapters.length} chapters out of ${allChapters.length} total for student ${student_id}...`);

    for (const chapter of targetChapters) {
      // Check if notes already exist
      const existingNote = getOne('SELECT id FROM student_saved_notes WHERE student_id = ? AND chapter = ?', [student_id, chapter.name]);
      if (!existingNote) {
        console.log(`[Worker] Generating massive notes for ${student_id} -> ${chapter.name}`);
        const notesObj = await generateDetailedNotes(chapter.name, student.board, student.grade, chapter.subject, student.language || 'en', []);
        
        if (notesObj) {
          runSQL('INSERT INTO student_saved_notes (student_id, chapter, notes_json) VALUES (?, ?, ?)',
            [student_id, chapter.name, JSON.stringify(notesObj)]);
        }
      }

      // Check if quiz already exists
      const existingQuiz = getOne('SELECT id FROM student_saved_quizzes WHERE student_id = ? AND chapter = ?', [student_id, chapter.name]);
      if (!existingQuiz) {
        console.log(`[Worker] Generating quiz for ${student_id} -> ${chapter.name}`);
        // Default quiz generation call
        const quizObj = await generateQuiz(chapter.name, student.grade, student.language || 'en', student.board, [], 0);
        
        if (quizObj && Array.isArray(quizObj)) {
          runSQL('INSERT INTO student_saved_quizzes (student_id, chapter, quiz_json) VALUES (?, ?, ?)',
            [student_id, chapter.name, JSON.stringify(quizObj)]);
        }
      }
      
      // Delay so we don't trigger OpenRouter strict RPM limits
      await new Promise(r => setTimeout(r, 4000));
    }

    console.log(`[Worker] Finished background resource prep for student ${student_id}.`);

  } catch (error) {
    console.error(`[Worker] Auto-prep failed for student ${student_id}:`, error);
  }
}
