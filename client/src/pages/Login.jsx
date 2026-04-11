import { useState } from 'react';
import { studentLogin, studentSignup, teacherLoginAuth, teacherSignup } from '../utils/api';

export default function Login({ t, lang, onStudentLogin, onTeacherLogin, toggleLang }) {
  const [mode, setMode] = useState('student');
  const [tab, setTab]   = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [classCode, setClassCode] = useState('');
  const [school, setSchool]     = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const reset = () => { setError(''); setUsername(''); setPassword(''); setName(''); setClassCode(''); setSchool(''); };

  const submit = async () => {
    if (!username || !password) { setError('Enter username and password'); return; }
    setLoading(true); setError('');
    try {
      if (mode === 'student') {
        if (tab === 'login') { onStudentLogin(await studentLogin(username, password)); }
        else {
          if (!name) { setError('Enter your name'); setLoading(false); return; }
          if (password.length < 4) { setError('Password must be at least 4 characters'); setLoading(false); return; }
          onStudentLogin(await studentSignup({ username, password, name, class_code: classCode }));
        }
      } else {
        if (tab === 'login') { onTeacherLogin(await teacherLoginAuth(username, password)); }
        else {
          if (!name || !classCode) { setError('Fill all required fields'); setLoading(false); return; }
          await teacherSignup({ username, password, name, class_code: classCode, school });
          onTeacherLogin(await teacherLoginAuth(username, password));
        }
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const features = [
    { icon: '🤖', text: 'AI-generated personalised lessons & quizzes' },
    { icon: '📶', text: 'Works 100% offline — no internet needed' },
    { icon: '📊', text: 'Adaptive learning path that evolves with you' },
    { icon: '🌐', text: 'Hindi + English, all Indian boards supported' },
  ];

  return (
    <div className="login-root">
      {/* Left panel */}
      <div className="login-panel-left">
        <div className="login-left-decoration" />
        <div className="login-left-decoration2" />
        <div className="login-brand">
          <div className="login-brand-icon">V</div>
          <div>
            <div className="login-brand-text">Vidya<span>Path</span></div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>ज्ञान की राह</div>
          </div>
        </div>

        <div className="login-left-body">
          <div className="login-left-headline">
            AI-powered learning for<br /><span>every Indian student</span>
          </div>
          <div className="login-left-sub">
            Personalised study paths, adaptive quizzes, and real-time coaching — aligned to CBSE, ICSE, and State Board syllabi for Classes 6–12.
          </div>
          <div className="login-features">
            {features.map(f => (
              <div key={f.text} className="login-feature">
                <div className="login-feature-icon">{f.icon}</div>
                <div className="login-feature-text">{f.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="login-left-footer">
          Trusted by students across India 🇮🇳
        </div>
      </div>

      {/* Right panel */}
      <div className="login-panel-right">
        <div className="login-form-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <div className="login-form-title">{tab === 'login' ? 'Welcome back' : 'Create account'}</div>
              <div className="login-form-sub">{tab === 'login' ? 'Sign in to continue learning' : 'Join VidyaPath today'}</div>
            </div>
            <button className="topbar-lang-btn" onClick={toggleLang}>{lang === 'en' ? 'हिंदी' : 'EN'}</button>
          </div>

          <div className="role-tabs">
            <button className={`role-tab ${mode === 'student' ? 'active' : ''}`} onClick={() => { setMode('student'); reset(); }}>🎒 {lang === 'hi' ? 'छात्र' : 'Student'}</button>
            <button className={`role-tab ${mode === 'teacher' ? 'active' : ''}`} onClick={() => { setMode('teacher'); reset(); }}>👨‍🏫 {lang === 'hi' ? 'शिक्षक' : 'Teacher'}</button>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>{lang === 'hi' ? 'लॉगिन' : 'Sign In'}</button>
            <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>{lang === 'hi' ? 'साइन अप' : 'Sign Up'}</button>
          </div>

          {tab === 'signup' && (
            <div className="form-field">
              <label className="form-label">{lang === 'hi' ? 'पूरा नाम' : 'Full Name'}</label>
              <input className="form-input" placeholder={lang === 'hi' ? 'अपना नाम' : 'e.g. Priya Sharma'} value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div className="form-field">
            <label className="form-label">Username</label>
            <input className="form-input" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div className="form-field">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoComplete={tab === 'signup' ? 'new-password' : 'current-password'} />
          </div>
          {tab === 'signup' && mode === 'student' && (
            <div className="form-field">
              <label className="form-label">Class Code <span style={{ fontWeight: 400, color: 'var(--sub)', textTransform: 'none' }}>(optional)</span></label>
              <input className="form-input" placeholder="e.g. CLASS-8A" value={classCode} onChange={e => setClassCode(e.target.value.toUpperCase())} />
              <div className="form-help">Ask your teacher for the class code</div>
            </div>
          )}
          {tab === 'signup' && mode === 'teacher' && (
            <>
              <div className="form-field">
                <label className="form-label">Class Code <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="form-input" placeholder="e.g. CLASS-8A" value={classCode} onChange={e => setClassCode(e.target.value.toUpperCase())} />
                <div className="form-help">Create a unique code — students use this to join your class</div>
              </div>
              <div className="form-field">
                <label className="form-label">School Name</label>
                <input className="form-input" placeholder="e.g. Delhi Public School" value={school} onChange={e => setSchool(e.target.value)} />
              </div>
            </>
          )}

          {error && <div className="form-error">{error}</div>}

          <button className="btn btn-primary btn-full btn-lg" onClick={submit} disabled={loading} style={{ marginTop: 4 }}>
            {loading ? '⏳ Please wait...' : tab === 'login' ? '🔓 Sign In' : '🚀 Create Account'}
          </button>

          <div className="form-footer">
            Made for students across India 🇮🇳 · AI-powered · Offline-first
          </div>
        </div>
      </div>
    </div>
  );
}
