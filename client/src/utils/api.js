export const API_BASE = import.meta.env.DEV ? "http://localhost:3001/api" : "/api";

const OFFLINE_QUEUE_KEY = "pw_offline_queue";
const CACHE_PREFIX = "pw_cache_";

function getHeaders() {
  return { "Content-Type": "application/json" };
}

function cacheKey(key) {
  return `${CACHE_PREFIX}${key}`;
}

function writeCache(key, data) {
  try {
    localStorage.setItem(cacheKey(key), JSON.stringify({ data, updatedAt: Date.now() }));
  } catch (error) {
    console.warn("Cache write failed", error);
  }
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(cacheKey(key));
    return raw ? JSON.parse(raw).data : null;
  } catch {
    return null;
  }
}

function enqueueOfflineAction(action) {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
  queue.push({ ...action, timestamp: Date.now() });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: getHeaders(),
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

async function requestWithCache(path, cacheName, options = {}) {
  try {
    const data = await request(path, options);
    writeCache(cacheName, data);
    return data;
  } catch (error) {
    const cached = readCache(cacheName);
    if (cached) {
      return { ...cached, offline: true };
    }
    throw error;
  }
}

export async function syncOfflineActions() {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
  if (queue.length === 0) return;

  const remaining = [];
  for (const action of queue) {
    try {
      await request(action.path, {
        method: action.method,
        body: JSON.stringify(action.body),
      });
    } catch {
      remaining.push(action);
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
}

export function getSavedStudentId() {
  return localStorage.getItem("pw_student_id");
}

export function getSavedRole() {
  return localStorage.getItem("pw_user_role");
}

export function getSavedTeacher() {
  try {
    return JSON.parse(localStorage.getItem("pw_teacher"));
  } catch {
    return null;
  }
}

export function getLanguage() {
  return localStorage.getItem("pw_language") || "en";
}

export function setLanguage(lang) {
  localStorage.setItem("pw_language", lang);
}

export function logout() {
  localStorage.removeItem("pw_student_id");
  localStorage.removeItem("pw_teacher");
  localStorage.removeItem("pw_user_role");
}

export async function studentSignup(profile) {
  const student = await request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(profile),
  });
  localStorage.setItem("pw_student_id", student.id);
  localStorage.setItem("pw_user_role", "student");
  writeCache(`student_${student.id}`, student);
  return student;
}

export async function studentLogin(username, password) {
  const student = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem("pw_student_id", student.id);
  localStorage.setItem("pw_user_role", "student");
  writeCache(`student_${student.id}`, student);
  return student;
}

export async function teacherSignup(profile) {
  return request("/auth/teacher/signup", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function teacherLoginAuth(username, password) {
  const teacher = await request("/teacher/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem("pw_teacher", JSON.stringify(teacher));
  localStorage.setItem("pw_user_role", "teacher");
  return teacher;
}

export async function createStudent(profile) {
  const student = await request("/students", {
    method: "POST",
    body: JSON.stringify(profile),
  });
  writeCache(`student_${student.id}`, student);
  localStorage.setItem("pw_student_id", student.id);
  return student;
}

export async function getStudent(id) {
  return requestWithCache(`/students/${id}`, `student_${id}`);
}

export async function generatePath(studentId) {
  return request("/path/generate", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId }),
  });
}

export async function getTeacherStudents(classCode) {
  const path = classCode
    ? `/teacher/students?class_code=${encodeURIComponent(classCode)}`
    : "/teacher/students";
  return requestWithCache(path, `teacher_students_${classCode || "all"}`);
}

export async function getStudentSyllabus(studentId) {
  return requestWithCache(
    `/student/syllabus?studentId=${encodeURIComponent(studentId)}`,
    `syllabus_${studentId}`
  );
}

export async function addStudentModule(payload) {
  const data = await request("/teacher/add-module", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  localStorage.removeItem(cacheKey(`syllabus_${payload.studentId}`));
  return data;
}

export async function removeStudentModule(payload) {
  const data = await request("/teacher/remove-module", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  localStorage.removeItem(cacheKey(`syllabus_${payload.studentId}`));
  return data;
}

export async function getLessonContent({ studentId, standard, subject, chapter }) {
  return requestWithCache("/content/lesson", `lesson_${studentId}_${subject}_${chapter}`, {
    method: "POST",
    body: JSON.stringify({ studentId, standard, subject, chapter }),
  });
}

export async function getNotesContent({ studentId, standard, subject, chapter, lesson }) {
  return requestWithCache("/content/notes", `notes_${studentId}_${subject}_${chapter}`, {
    method: "POST",
    body: JSON.stringify({ studentId, standard, subject, chapter, lesson }),
  });
}

export async function getQuizContent({ studentId, standard, subject, chapter }) {
  return requestWithCache("/content/quiz", `quiz_${studentId}_${subject}_${chapter}`, {
    method: "POST",
    body: JSON.stringify({ studentId, standard, subject, chapter }),
  });
}

export async function submitQuiz(studentId, topicName, score, answers, questions, timeTaken) {
  const body = {
    student_id: studentId,
    topic_name: topicName,
    score,
    answers,
    questions,
    time_taken: timeTaken,
  };

  try {
    return await request("/quiz/submit", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch {
    enqueueOfflineAction({ path: "/quiz/submit", method: "POST", body });
    return {
      score,
      status: score >= Math.ceil((questions?.length || 1) * 0.7) ? "strong" : "complete",
      analysis: null,
      feedback: {
        encouragement: "Saved offline. Your result will sync automatically.",
        focus_next: "You can keep learning with cached lessons, notes, and syllabus.",
      },
      offline: true,
    };
  }
}

export async function sendChatMessage(studentId, message, history) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId, message, history }),
  });
}

export function getCachedLearningBundle(studentId, subject, chapter) {
  return {
    lesson: readCache(`lesson_${studentId}_${subject}_${chapter}`),
    notes: readCache(`notes_${studentId}_${subject}_${chapter}`),
    quiz: readCache(`quiz_${studentId}_${subject}_${chapter}`),
  };
}
