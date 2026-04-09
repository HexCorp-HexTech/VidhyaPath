import { useState, useEffect, useCallback } from 'react';
import './App.css';
import en from './i18n/en.json';
import hi from './i18n/hi.json';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Lesson from './pages/Lesson';
import Quiz from './pages/Quiz';
import Teacher from './pages/Teacher';
import Chatbot from './pages/Chatbot';
import Notes from './pages/Notes';
import {
  getSavedStudentId, getSavedRole, getSavedTeacher, getLanguage,
  setLanguage as saveLanguage, syncOfflineActions, logout as doLogout,
  getStudent, API_BASE
} from './utils/api';

const i18nData = { en, hi };

function initials(name = '?') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function Sidebar({ page, setPage, student, teacherData, lang, isOffline, collapsed, setCollapsed, onLogout }) {
  const navItems = student ? [
    { id: 'dashboard', icon: '⊞', label: lang === 'hi' ? 'होम' : 'Home' },
    { id: 'notes',     icon: '📋', label: lang === 'hi' ? 'नोट्स' : 'Notes' },
    { id: 'teacher',   icon: '👨‍🏫', label: lang === 'hi' ? 'शिक्षक' : 'Teacher' },
  ] : [
    { id: 'teacher', icon: '👨‍🏫', label: lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard' },
  ];

  const completedCount = 0; // Could wire to progress data

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">V</div>
        {!collapsed && (
          <div>
            <div className="sidebar-logo-text">Vidya<span>Path</span></div>
            <div className="sidebar-logo-sub">ज्ञान की राह</div>
          </div>
        )}
      </div>

      {/* User */}
      {(student || teacherData) && (
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {initials((student?.name || teacherData?.name || '?'))}
          </div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{student?.name || teacherData?.name}</div>
              <div className="sidebar-user-meta">
                {student ? `${student.board || 'CBSE'} · Class ${student.grade || '–'}` : `Teacher · ${teacherData?.class_code}`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">Menu</div>}
        {navItems.map(item => (
          <button key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}

        {!collapsed && <div className="nav-section-label" style={{ marginTop: 8 }}>Quick Actions</div>}
        {student && (
          <button className="nav-item" onClick={() => setPage('lesson-quick')} title={collapsed ? 'Study' : undefined}>
            <span className="nav-icon">📖</span>
            {!collapsed && <span className="nav-label">{lang === 'hi' ? 'पढ़ें' : 'Study'}</span>}
          </button>
        )}
        {student && (
          <button className="nav-item" onClick={() => setPage('quiz-quick')} title={collapsed ? 'Quiz' : undefined}>
            <span className="nav-icon">📝</span>
            {!collapsed && <span className="nav-label">{lang === 'hi' ? 'क्विज़' : 'Quiz'}</span>}
          </button>
        )}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', marginBottom: 8 }}>
            <div className="sidebar-online-dot" style={{ background: isOffline ? '#F59E0B' : '#10B981' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              {isOffline ? 'Offline mode' : 'Connected'}
            </span>
          </div>
        )}
        <button className="nav-item" onClick={onLogout} title={collapsed ? 'Sign Out' : undefined}
          style={{ color: 'rgba(239,68,68,0.7)', marginBottom: 6 }}>
          <span className="nav-icon">🚪</span>
          {!collapsed && <span className="nav-label">{lang === 'hi' ? 'साइन आउट' : 'Sign Out'}</span>}
        </button>
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(c => !c)}>
          <span>{collapsed ? '→' : '←'}</span>
          <span className="sidebar-collapse-label">Collapse</span>
        </button>
      </div>
    </aside>
  );
}

export default function App() {
  const [page, setPage] = useState('loading');
  const [studentId, setStudentId] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  const [quizTopic, setQuizTopic] = useState(null);
  const [lessonTopic, setLessonTopic] = useState(null);
  const [lang, setLang] = useState(getLanguage());
  const [isOffline, setIsOffline] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const t = useCallback((section, key) => {
    return i18nData[lang]?.[section]?.[key] || i18nData['en']?.[section]?.[key] || key;
  }, [lang]);

  const checkConnectivity = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      if (res.ok) { setIsOffline(false); return true; }
    } catch {}
    setIsOffline(true); return false;
  };

  useEffect(() => {
    const role = getSavedRole();
    if (role === 'teacher') {
      const teacher = getSavedTeacher();
      if (teacher) { setTeacherData(teacher); setPage('teacher'); }
      else setPage('login');
    } else if (role === 'student') {
      const savedId = getSavedStudentId();
      if (savedId) {
        const sid = parseInt(savedId);
        setStudentId(sid);
        getStudent(sid).then(data => { if (data) setStudentData(data); }).catch(() => {});
        setPage('dashboard');
      } else setPage('login');
    } else setPage('login');

    checkConnectivity();
    const interval = setInterval(checkConnectivity, 10000);
    const goOnline = () => { checkConnectivity(); syncOfflineActions(); };
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener('beforeunload', doLogout);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('beforeunload', doLogout);
    };
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'hi' : 'en';
    setLang(newLang); saveLanguage(newLang);
  };

  const handleStudentLogin = (student) => {
    setStudentId(student.id); setStudentData(student);
    setPage(!student.grade || !student.goals ? 'onboarding' : 'dashboard');
  };
  const handleTeacherLogin = (teacher) => { setTeacherData(teacher); setPage('teacher'); };
  const handleOnboardingComplete = (id) => {
    setStudentId(id);
    getStudent(id).then(data => { if (data) setStudentData(data); }).catch(() => {});
    setPage('dashboard');
  };
  const handleStartLesson = (topicName) => { setLessonTopic(topicName); setPage('lesson'); };
  const handleStartQuiz   = (topicName) => { setQuizTopic(topicName); setLessonTopic(null); setPage('quiz'); };
  const handleQuizComplete   = () => { setQuizTopic(null);   setPage('dashboard'); };
  const handleLessonComplete = () => { setLessonTopic(null); setPage('dashboard'); };
  const handleLogout = () => {
    doLogout(); setStudentId(null); setStudentData(null); setTeacherData(null);
    setShowChatbot(false); setPage('login');
  };

  // Full-screen pages (no shell)
  if (page === 'loading') {
    return (
      <div className="loading-screen" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner" />
        <h3>VidyaPath</h3>
        <p>Loading your learning experience...</p>
      </div>
    );
  }
  if (page === 'login') {
    return <Login t={t} lang={lang} onStudentLogin={handleStudentLogin} onTeacherLogin={handleTeacherLogin} toggleLang={toggleLang} />;
  }
  if (page === 'onboarding') {
    return <Onboarding t={t} lang={lang} studentId={studentId} onComplete={handleOnboardingComplete} toggleLang={toggleLang} />;
  }
  if (page === 'lesson' && studentId && lessonTopic) {
    return <Lesson t={t} lang={lang} studentId={studentId} topicName={lessonTopic} onComplete={handleLessonComplete} onStartQuiz={handleStartQuiz} />;
  }
  if (page === 'quiz' && studentId && quizTopic) {
    return <Quiz t={t} lang={lang} studentId={studentId} topicName={quizTopic} onComplete={handleQuizComplete} />;
  }

  // Shell pages
  const pageTitles = {
    dashboard: { title: lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard', sub: studentData?.name ? `Welcome back, ${studentData.name.split(' ')[0]}` : '' },
    notes:     { title: lang === 'hi' ? 'अध्ययन नोट्स' : 'Study Notes', sub: `${studentData?.board || 'CBSE'} · Class ${studentData?.grade || ''}` },
    teacher:   { title: lang === 'hi' ? 'शिक्षक डैशबोर्ड' : 'Teacher Dashboard', sub: teacherData?.school || '' },
  };
  const { title, sub } = pageTitles[page] || { title: 'VidyaPath', sub: '' };

  return (
    <div className="app-shell">
      <Sidebar
        page={page} setPage={setPage}
        student={studentData} teacherData={teacherData}
        lang={lang} isOffline={isOffline}
        collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
        onLogout={handleLogout}
      />

      <div className="main-area">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-title">
            {title}
            {sub && <span className="topbar-sub">{sub}</span>}
          </div>
          <div className="topbar-actions">
            {isOffline && (
              <div className="offline-pill">
                <span>📡</span> {lang === 'hi' ? 'ऑफलाइन' : 'Offline'}
              </div>
            )}
            {studentData && (
              <>
                <div className="topbar-streak">🔥 {studentData.streak_count || 0}</div>
                <div className="topbar-badge">⚡ {studentData.progress_percent || 0}%</div>
              </>
            )}
            <button className="topbar-lang-btn" onClick={toggleLang}>
              {lang === 'en' ? 'हिंदी' : 'EN'}
            </button>
            {studentId && (
              <button className="topbar-icon-btn" onClick={() => setShowChatbot(true)} title="AI Tutor">
                🤖
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {page === 'dashboard' && studentId && (
            <Dashboard t={t} lang={lang} studentId={studentId} onStartQuiz={handleStartQuiz} onStartLesson={handleStartLesson} />
          )}
          {page === 'notes' && studentId && (
            <Notes lang={lang} studentId={studentId} board={studentData?.board} grade={studentData?.grade} onBack={() => setPage('dashboard')} onStartQuiz={handleStartQuiz} />
          )}
          {page === 'teacher' && (
            <Teacher t={t} lang={lang} teacherData={teacherData} onBack={() => setPage(studentId ? 'dashboard' : 'login')} />
          )}
        </main>
      </div>

      {/* Chatbot */}
      {showChatbot && studentId && (
        <Chatbot lang={lang} studentId={studentId} onClose={() => setShowChatbot(false)} />
      )}
    </div>
  );
}
