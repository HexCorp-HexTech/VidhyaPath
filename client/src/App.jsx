import { useCallback, useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Teacher from "./pages/Teacher";
import Syllabus from "./pages/Syllabus";
import Subject from "./pages/Subject";
import Chapter from "./pages/Chapter";
import Lesson from "./pages/Lesson";
import Notes from "./pages/Notes";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import AssignedPaths from "./pages/AssignedPaths";
import Chatbot from "./pages/Chatbot";
import en from "./i18n/en.json";
import hi from "./i18n/hi.json";
import {
  getLanguage,
  getSavedRole,
  getSavedStudentId,
  getSavedTeacher,
  getStudent,
  logout as doLogout,
  setLanguage as saveLanguage,
} from "./utils/api";

const i18nData = { en, hi };

function ShellHeader({
  title,
  subtitle,
  lang,
  onToggleLang,
  onLogout,
  showLogout = true,
  showAssigned = false,
}) {
  const nav = useNavigate();
  return (
    <header className="topbar">
      <div className="topbar-title">
        {title}
        {subtitle ? <span className="topbar-sub">{subtitle}</span> : null}
      </div>
      <div className="topbar-actions">
        {showAssigned ? (
          <button className="btn btn-ghost btn-sm" onClick={() => nav("/assigned-paths")} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            📋 Assigned
          </button>
        ) : null}
        <button className="topbar-lang-btn" onClick={onToggleLang}>
          {lang === "en" ? "हिंदी" : "EN"}
        </button>
        {showLogout ? (
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            Sign Out
          </button>
        ) : null}
      </div>
    </header>
  );
}

function StudentShell({ lang, onToggleLang, onLogout }) {
  const location = useLocation();
  const [showChat, setShowChat] = useState(false);
  const studentId = getSavedStudentId();

  const stepTitles = {
    "/syllabus": {
      title: "Standard",
      subtitle: "Choose a standard to load the syllabus.",
    },
    "/subject": {
      title: "Subject",
      subtitle: "Select a subject before choosing a chapter.",
    },
    "/chapter": {
      title: "Chapter",
      subtitle: "Choose a chapter from the selected syllabus.",
    },
    "/lesson": {
      title: "Lesson",
      subtitle: "Read the generated lesson before moving on.",
    },
    "/notes": {
      title: "Notes",
      subtitle: "Review concise notes from the selected chapter.",
    },
    "/quiz": {
      title: "Quiz",
      subtitle: "Answer all questions to unlock your result.",
    },
    "/result": {
      title: "Result",
      subtitle: "See your score and restart the flow cleanly.",
    },
    "/assigned-paths": {
      title: "Assigned Paths",
      subtitle: "Learning paths assigned by your teacher.",
    },
  };

  const currentMeta =
    stepTitles[location.pathname] || stepTitles["/syllabus"];

  return (
    <div className="main-area">
      <ShellHeader
        title={currentMeta.title}
        subtitle={currentMeta.subtitle}
        lang={lang}
        onToggleLang={onToggleLang}
        onLogout={onLogout}
        showAssigned={true}
      />
      <main className="page-content">
        <Routes>
          <Route path="/syllabus" element={<Syllabus />} />
          <Route path="/subject" element={<Subject />} />
          <Route path="/chapter" element={<Chapter />} />
          <Route path="/lesson" element={<Lesson />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/result" element={<Result />} />
          <Route path="/assigned-paths" element={<AssignedPaths />} />
          <Route path="*" element={<Navigate to="/syllabus" replace />} />
        </Routes>
      </main>

      {/* Floating Chat Button */}
      <button
        className="chat-fab"
        onClick={() => setShowChat(true)}
        title={lang === 'hi' ? 'AI Tutor से बात करें' : 'Chat with AI Tutor'}
        aria-label="Open AI Tutor Chat"
      >
        <span className="chat-fab-icon">🤖</span>
        <span className="chat-fab-pulse" />
      </button>

      {/* Chatbot Overlay */}
      {showChat && (
        <Chatbot
          lang={lang}
          studentId={studentId}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}

function TeacherShell({ lang, onToggleLang, onLogout, teacherData }) {
  return (
    <div className="main-area">
      <ShellHeader
        title="Teacher Dashboard"
        subtitle={teacherData?.school || "Teacher tools remain unchanged."}
        lang={lang}
        onToggleLang={onToggleLang}
        onLogout={onLogout}
      />
      <main className="page-content">
        <Teacher
          t={(section, key) =>
            i18nData[lang]?.[section]?.[key] ||
            i18nData.en?.[section]?.[key] ||
            key
          }
          lang={lang}
          teacherData={teacherData}
          onBack={() => onLogout()}
        />
      </main>
    </div>
  );
}

function RootRedirect({ role, studentData, teacherData }) {
  if (role === "teacher" && teacherData) {
    return <Navigate to="/teacher" replace />;
  }

  if (role === "student") {
    if (studentData && (!studentData.grade || !studentData.goals)) {
      return <Navigate to="/onboarding" replace />;
    }

    return <Navigate to="/syllabus" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(getLanguage());
  const [role, setRole] = useState(getSavedRole());
  const [studentData, setStudentData] = useState(null);
  const [studentId, setStudentId] = useState(getSavedStudentId());
  const [teacherData, setTeacherData] = useState(getSavedTeacher());
  const [authLoading, setAuthLoading] = useState(true);

  const t = useCallback(
    (section, key) =>
      i18nData[lang]?.[section]?.[key] ||
      i18nData.en?.[section]?.[key] ||
      key,
    [lang]
  );

  useEffect(() => {
    const savedRole = getSavedRole();
    const savedTeacher = getSavedTeacher();
    const savedStudentId = getSavedStudentId();

    setRole(savedRole);
    setTeacherData(savedTeacher);
    setStudentId(savedStudentId);

    if (savedRole === "student" && savedStudentId) {
      getStudent(savedStudentId)
        .then((data) => {
          setStudentData(data || null);
        })
        .finally(() => setAuthLoading(false));
      return;
    }

    setAuthLoading(false);
  }, []);

  const toggleLang = () => {
    const nextLang = lang === "en" ? "hi" : "en";
    setLang(nextLang);
    saveLanguage(nextLang);
  };

  const handleStudentLogin = (student) => {
    setRole("student");
    setStudentData(student);
    setStudentId(student.id);
    if (!student.grade || !student.goals) {
      navigate("/onboarding");
      return;
    }
    navigate("/syllabus");
  };

  const handleTeacherLogin = (teacher) => {
    setRole("teacher");
    setTeacherData(teacher);
    navigate("/teacher");
  };

  const handleOnboardingComplete = (id) => {
    setRole("student");
    setStudentId(id);
    getStudent(id)
      .then((data) => {
        setStudentData(data || null);
      })
      .finally(() => {
        navigate("/syllabus");
      });
  };

  const handleLogout = () => {
    doLogout();
    setRole(null);
    setStudentData(null);
    setStudentId(null);
    setTeacherData(null);
    navigate("/login");
  };

  if (authLoading) {
    return (
      <div className="loading-screen" style={{ minHeight: "100vh" }}>
        <div className="loading-spinner" />
        <h3>VidyaPath</h3>
        <p>Loading your learning experience...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <RootRedirect
            role={role}
            studentData={studentData}
            teacherData={teacherData}
          />
        }
      />
      <Route
        path="/login"
        element={
          <Login
            t={t}
            lang={lang}
            onStudentLogin={handleStudentLogin}
            onTeacherLogin={handleTeacherLogin}
            toggleLang={toggleLang}
          />
        }
      />
      <Route
        path="/onboarding"
        element={
          role !== "student" || !studentId ? (
            <Navigate to="/login" replace />
          ) : (
            <Onboarding
              t={t}
              lang={lang}
              studentId={studentId}
              onComplete={handleOnboardingComplete}
              toggleLang={toggleLang}
            />
          )
        }
      />
      <Route
        path="/teacher"
        element={
          role !== "teacher" || !teacherData ? (
            <Navigate to="/login" replace />
          ) : (
            <TeacherShell
              lang={lang}
              onToggleLang={toggleLang}
              onLogout={handleLogout}
              teacherData={teacherData}
            />
          )
        }
      />
      <Route
        path="/*"
        element={
          role === "student" ? (
            <StudentShell
              lang={lang}
              onToggleLang={toggleLang}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
