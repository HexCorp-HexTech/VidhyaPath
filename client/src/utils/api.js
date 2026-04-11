export const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

function getHeaders() {
  return { 'Content-Type': 'application/json' };
}

function queueOfflineAction(action) {
  const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
  queue.push({ ...action, timestamp: Date.now() });
  localStorage.setItem('offlineQueue', JSON.stringify(queue));
}

export async function syncOfflineActions() {
  const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
  if (queue.length === 0) return;
  const remaining = [];
  for (const action of queue) {
    try {
      await fetch(`${API_BASE}${action.url}`, { method: action.method, headers: getHeaders(), body: JSON.stringify(action.body) });
    } catch { remaining.push(action); }
  }
  localStorage.setItem('offlineQueue', JSON.stringify(remaining));
}

function cacheData(key, data) {
  try { localStorage.setItem(`pw_${key}`, JSON.stringify({ data, cached_at: Date.now() })); } catch (e) { console.warn('Cache write failed:', e); }
}

function getCachedData(key) {
  try { const item = localStorage.getItem(`pw_${key}`); if (item) return JSON.parse(item).data; } catch { }
  return null;
}

// ===== AUTH =====
export async function studentSignup(profile) {
  const res = await fetch(`${API_BASE}/auth/signup`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(profile) });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Signup failed'); }
  const student = await res.json();
  localStorage.setItem('pw_student_id', student.id);
  localStorage.setItem('pw_user_role', 'student');
  cacheData(`student_${student.id}`, student);
  return student;
}

export async function studentLogin(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ username, password }) });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Login failed'); }
  const student = await res.json();
  localStorage.setItem('pw_student_id', student.id);
  localStorage.setItem('pw_user_role', 'student');
  cacheData(`student_${student.id}`, student);
  return student;
}

export async function teacherSignup(profile) {
  const res = await fetch(`${API_BASE}/auth/teacher/signup`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(profile) });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Signup failed'); }
  return await res.json();
}

export async function teacherLoginAuth(username, password) {
  const res = await fetch(`${API_BASE}/teacher/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ username, password }) });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Login failed'); }
  const teacher = await res.json();
  localStorage.setItem('pw_teacher', JSON.stringify(teacher));
  localStorage.setItem('pw_user_role', 'teacher');
  return teacher;
}

export function logout() {
  localStorage.removeItem('pw_student_id');
  localStorage.removeItem('pw_teacher');
  localStorage.removeItem('pw_user_role');
}

export function getSavedRole() {
  return localStorage.getItem('pw_user_role');
}

export function getSavedTeacher() {
  try { return JSON.parse(localStorage.getItem('pw_teacher')); } catch { return null; }
}

// ===== STUDENT API =====
export async function createStudent(profile) {
  try {
    const res = await fetch(`${API_BASE}/students`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(profile) });
    const student = await res.json();
    cacheData(`student_${student.id}`, student);
    localStorage.setItem('pw_student_id', student.id);
    return student;
  } catch (err) { console.error('Create student failed:', err); throw err; }
}

export async function getStudent(id) {
  try {
    const res = await fetch(`${API_BASE}/students/${id}`);
    const data = await res.json();
    cacheData(`student_${id}`, data);
    return data;
  } catch { return getCachedData(`student_${id}`); }
}

export async function generatePath(studentId) {
  try {
    const res = await fetch(`${API_BASE}/path/generate`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ student_id: studentId }) });
    const data = await res.json();
    cacheData(`path_${studentId}`, data);
    return data;
  } catch { return getCachedData(`path_${studentId}`); }
}

export async function updatePath(studentId) {
  try {
    const res = await fetch(`${API_BASE}/path/update`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ student_id: studentId }) });
    const data = await res.json();
    cacheData(`path_${studentId}`, data);
    return data;
  } catch { return getCachedData(`path_${studentId}`); }
}

export async function generateQuiz(studentId, topicName) {
  try {
    const res = await fetch(`${API_BASE}/quiz/generate`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ student_id: studentId, topic_name: topicName }) });
    const data = await res.json();
    // Don't cache quizzes so they're always fresh
    return data;
  } catch { return getCachedData(`quiz_${topicName}`); }
}

export async function generateLesson(studentId, topicName) {
  try {
    const res = await fetch(`${API_BASE}/lesson/generate`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ student_id: studentId, topic_name: topicName }) });
    const data = await res.json();
    cacheData(`lesson_${topicName}`, data);
    return data;
  } catch { return getCachedData(`lesson_${topicName}`); }
}

export async function submitQuiz(studentId, topicName, score, answers, questions, timeTaken) {
  const body = { student_id: studentId, topic_name: topicName, score, answers, questions };
  try {
    const res = await fetch(`${API_BASE}/quiz/submit`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
    return await res.json();
  } catch {
    queueOfflineAction({ url: '/quiz/submit', method: 'POST', body });
    return { score, status: score >= 4 ? 'strong' : score < 3 ? 'weak' : 'complete', feedback: null, analysis: null, needs_path_update: false };
  }
}

export async function teacherLogin(pin) {
  const res = await fetch(`${API_BASE}/teacher/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ pin }) });
  if (!res.ok) throw new Error('Invalid PIN');
  return await res.json();
}

export async function getTeacherStudents(classCode) {
  const url = classCode ? `${API_BASE}/teacher/students?class_code=${encodeURIComponent(classCode)}` : `${API_BASE}/teacher/students`;
  const res = await fetch(url);
  return await res.json();
}

export async function getReEngagement(studentId) {
  try { const res = await fetch(`${API_BASE}/reengagement/${studentId}`); return await res.json(); } catch { return null; }
}

export async function getLessonContent(standard, subject, chapter) {
  const cacheKey = `content_lesson_${standard}_${subject}_${chapter}`;
  try {
    const res = await fetch(`${API_BASE}/content/lesson`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ standard, subject, chapter }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to load lesson");
    }
    const data = await res.json();
    cacheData(cacheKey, data);
    return data;
  } catch {
    return getCachedData(cacheKey);
  }
}

export async function getNotesContent(standard, subject, chapter) {
  const cacheKey = `content_notes_${standard}_${subject}_${chapter}`;
  try {
    const res = await fetch(`${API_BASE}/content/notes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ standard, subject, chapter }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to load notes");
    }
    const data = await res.json();
    cacheData(cacheKey, data);
    return data;
  } catch {
    return getCachedData(cacheKey);
  }
}

export async function getQuizContent(standard, subject, chapter) {
  const cacheKey = `content_quiz_${standard}_${subject}_${chapter}`;
  try {
    const res = await fetch(`${API_BASE}/content/quiz`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ standard, subject, chapter }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to load quiz");
    }
    const data = await res.json();
    cacheData(cacheKey, data);
    return data;
  } catch {
    return getCachedData(cacheKey);
  }
}

// ===== TEACHER-ASSIGNED PATHS =====
export async function assignPathToStudent(teacherId, studentId, title, topics) {
  const res = await fetch(`${API_BASE}/assigned-paths/assign`, {
    method: 'POST', headers: getHeaders(),
    body: JSON.stringify({ teacher_id: teacherId, student_id: studentId, title, topics }),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to assign path'); }
  return await res.json();
}

export async function getAssignedPaths(studentId) {
  const cacheKey = `assigned_paths_${studentId}`;
  try {
    const res = await fetch(`${API_BASE}/assigned-paths/student/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    cacheData(cacheKey, data);
    return data;
  } catch { return getCachedData(cacheKey) || []; }
}

export async function getAssignedTopicContent(pathId, topicIndex) {
  const cacheKey = `assigned_content_${pathId}_${topicIndex}`;
  try {
    const res = await fetch(`${API_BASE}/assigned-paths/content/${pathId}/${topicIndex}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    cacheData(cacheKey, data);
    return data;
  } catch { return getCachedData(cacheKey); }
}

// ===== TEACHER ANALYTICS =====
export async function getTeacherQuizScores(classCode) {
  const url = classCode
    ? `${API_BASE}/teacher/quiz-scores?class_code=${encodeURIComponent(classCode)}`
    : `${API_BASE}/teacher/quiz-scores`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch { return { scores: [], student_count: 0 }; }
}

export async function generateTeacherAIReport(classCode) {
  const res = await fetch(`${API_BASE}/teacher/ai-report`, {
    method: 'POST', headers: getHeaders(),
    body: JSON.stringify({ class_code: classCode }),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to generate report'); }
  return await res.json();
}

export function getSavedStudentId() { return localStorage.getItem('pw_student_id'); }
export function getLanguage() { return localStorage.getItem('pw_language') || 'en'; }
export function setLanguage(lang) { localStorage.setItem('pw_language', lang); }
