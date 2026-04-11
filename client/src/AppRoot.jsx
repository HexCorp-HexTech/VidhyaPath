import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import LearningPage from "./pages/LearningPage";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
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
  onDashboard,
  showLogout = true,
  showDashboard = false,
}) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        {title}
        {subtitle ? <span className="topbar-sub">{subtitle}</span> : null}
      </div>
      <div className="topbar-actions">
        <button className="topbar-lang-btn" onClick={onToggleLang}>
          {lang === "en" ? "हिंदी" : "EN"}
        </button>
        {showDashboard ? (
          <button className="btn btn-ghost btn-sm" onClick={onDashboard}>
            🏠 Dashboard
          </button>
        ) : null}
        {showLogout ? (
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            Sign Out
          </button>
        ) : null}
      </div>
    </header>
  );
}

function StudentShell({ lang, onToggleLang, onLogout, studentData }) {
  const navigate = useNavigate();
  const location = useLocation();
  const onDashboard = location.pathname === "/dashboard";

  return (
    <div className="main-area">
      <ShellHeader
        title="Learning Hub"
        subtitle="Personalized syllabus, AI lesson, notes, and quiz in one flow."
        lang={lang}
        onToggleLang={onToggleLang}
        onLogout={onLogout}
        showDashboard={!onDashboard}
        onDashboard={() => navigate("/dashboard")}
      />
      <main className="page-content">
        <Routes>
          <Route path="/dashboard" element={<StudentDashboard student={studentData} />} />
          <Route path="/learning" element={<LearningPage student={studentData} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function TeacherShell({ lang, onToggleLang, onLogout, teacherData }) {
  return (
    <div className="main-area">
      <ShellHeader
        title="Teacher Dashboard"
        subtitle={teacherData?.school || "Manage personalized student syllabus."}
        lang={lang}
        onToggleLang={onToggleLang}
        onLogout={onLogout}
      />
      <main className="page-content">
        <TeacherDashboard teacherData={teacherData} />
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

    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function AppRoot() {
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
    navigate("/dashboard");
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
        navigate("/dashboard");
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
              studentData={studentData}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
