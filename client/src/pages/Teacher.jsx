import { useState, useEffect } from 'react';
import { API_BASE, assignPathToStudent, getAssignedPaths, getTeacherQuizScores, generateTeacherAIReport } from '../utils/api';

function RingSmall({ value = 0, size = 48, color = 'var(--saffron)' }) {
  const sw = 5, r = (size - sw) / 2, circ = 2 * Math.PI * r, dash = (value / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 12, color: 'var(--text)', lineHeight: 1 }}>{Math.round(value)}%</span>
      </div>
    </div>
  );
}

export default function Teacher({ t, lang, teacherData, onBack }) {
  const [students, setStudents]       = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tab, setTab]                 = useState('overview'); // overview | students | syllabus
  const [syllabusEdit, setSyllabusEdit] = useState({});
  const [savingEdit, setSavingEdit]   = useState(false);
  const [editSuccess, setEditSuccess] = useState(null);
  const [searchQ, setSearchQ]         = useState('');
  const [assignTitle, setAssignTitle]   = useState({});
  const [assignTopics, setAssignTopics] = useState({});
  const [assigning, setAssigning]       = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(null);
  const [assignError, setAssignError]   = useState(null);
  const [assignedPaths, setAssignedPaths] = useState({});
  const [quizScores, setQuizScores] = useState([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [scoreFilter, setScoreFilter] = useState('all'); // all | weak | strong
  const [scoreSearch, setScoreSearch] = useState('');

  useEffect(() => {
    if (!teacherData?.class_code) { setLoading(false); return; }
    fetch(`${API_BASE}/teacher/students?class_code=${encodeURIComponent(teacherData.class_code)}`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.students || []);
        setStudents(arr);
        // Compute stats
        if (arr.length > 0) {
          const avgProgress = Math.round(arr.reduce((a, s) => a + (s.progress_percent || 0), 0) / arr.length);
          const activeToday = arr.filter(s => s.days_since_active === 0).length;
          const weakCount = arr.reduce((a, s) => a + (s.weak_areas?.length || 0), 0);
          setStats({ avg_progress: avgProgress, active_today: activeToday, weak_count: weakCount });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [teacherData]);

  const initials = n => (n || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const pctColor = p => p >= 70 ? 'var(--green)' : p >= 40 ? 'var(--gold)' : 'var(--red)';

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.board?.toLowerCase().includes(searchQ.toLowerCase())
  );

  // Save syllabus override for a student
  const saveSyllabusEdit = async (studentId, newTopics) => {
    setSavingEdit(true);
    try {
      const res = await fetch(`${API_BASE}/path/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, teacher_topics: newTopics }),
      });
      if (res.ok) { setEditSuccess(studentId); setTimeout(() => setEditSuccess(null), 3000); }
    } catch {}
    setSavingEdit(false);
  };

  // Load assigned paths when student is selected
  useEffect(() => {
    if (selectedStudent?.id && !assignedPaths[selectedStudent.id]) {
      getAssignedPaths(selectedStudent.id).then(paths => {
        setAssignedPaths(prev => ({ ...prev, [selectedStudent.id]: paths }));
      }).catch(() => {});
    }
  }, [selectedStudent]);

  // Load quiz scores when switching to scores tab
  useEffect(() => {
    if (tab === 'scores' && quizScores.length === 0 && !scoresLoading) {
      setScoresLoading(true);
      getTeacherQuizScores(teacherData?.class_code).then(data => {
        setQuizScores(data.scores || []);
      }).catch(() => {}).finally(() => setScoresLoading(false));
    }
  }, [tab]);

  // Assign path handler
  const handleAssignPath = async (studentId) => {
    const title = (assignTitle[studentId] || '').trim();
    const topicsRaw = (assignTopics[studentId] || '').trim();
    if (!title || !topicsRaw) return;

    const topics = topicsRaw.split(',').map(t => t.trim()).filter(Boolean);
    if (topics.length === 0) return;

    setAssigning(true);
    setAssignError(null);
    try {
      await assignPathToStudent(teacherData.id, studentId, title, topics);
      setAssignSuccess(studentId);
      setAssignTitle(prev => ({ ...prev, [studentId]: '' }));
      setAssignTopics(prev => ({ ...prev, [studentId]: '' }));
      // Refresh assigned paths
      const updated = await getAssignedPaths(studentId);
      setAssignedPaths(prev => ({ ...prev, [studentId]: updated }));
      setTimeout(() => setAssignSuccess(null), 3000);
    } catch (err) {
      setAssignError(err.message || 'Failed to assign path');
      setTimeout(() => setAssignError(null), 5000);
    }
    setAssigning(false);
  };

  // Student detail modal
  if (selectedStudent) {
    const s = selectedStudent;
    const pct = s.progress_percent || 0;
    return (
      <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
        <div className="modal-card" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setSelectedStudent(null)}>✕</button>

          {/* Header */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
            <div className="student-avatar" style={{ width: 52, height: 52, fontSize: 18 }}>{initials(s.name)}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, color: 'var(--text)' }}>{s.name}</div>
              <div style={{ fontSize: 13, color: 'var(--sub)', marginTop: 2 }}>
                {s.board || 'CBSE'} · Class {s.grade || '–'} · {s.level || 'beginner'} · 🔥 {s.streak_count || 0} days
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <RingSmall value={pct} size={60} color={pctColor(pct)} />
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Progress</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: pctColor(pct) }}>{pct}% · {s.completed_topics || 0}/{s.total_topics || 0} topics</span>
            </div>
            <div className="progress-track" style={{ height: 10 }}>
              <div className="progress-fill" style={{ width: `${pct}%`, background: pctColor(pct), height: '100%' }} />
            </div>
          </div>

          {/* Test scores */}
          {s.recent_scores?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, marginBottom: 12 }}>📝 Recent Test Results</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.recent_scores.map((score, i) => {
                  const [num, total] = (score.score || '0/5').split('/').map(Number);
                  const pct2 = Math.round((num / (total || 5)) * 100);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: pct2 >= 80 ? 'var(--greenL)' : pct2 >= 60 ? 'var(--goldL)' : 'var(--redL)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 14, color: pct2 >= 80 ? 'var(--green)' : pct2 >= 60 ? 'var(--gold)' : 'var(--red)', flexShrink: 0 }}>
                        {pct2}%
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{score.topic}</div>
                        <div style={{ fontSize: 11, color: 'var(--sub)' }}>Score: {score.score} · <span className={`tag tag-${score.status === 'strong' ? 'teal' : score.status === 'weak' ? 'red' : 'green'}`} style={{ fontSize: 10 }}>{score.status}</span></div>
                      </div>
                      <div className="progress-track" style={{ width: 80, height: 5 }}>
                        <div className="progress-fill" style={{ width: `${pct2}%`, background: pct2 >= 80 ? 'var(--green)' : pct2 >= 60 ? 'var(--gold)' : 'var(--red)', height: '100%' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weak areas */}
          {s.weak_areas?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--red)', marginBottom: 10 }}>⚡ Weak Areas ({s.weak_areas.length})</div>
              {s.weak_areas.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--textMid)' }}>
                  <span style={{ color: 'var(--red)', fontWeight: 800 }}>✗</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Syllabus override for this student */}
          <div style={{ background: 'rgba(12,27,51,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, marginBottom: 8 }}>📚 Adjust Learning Path</div>
            <div style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 10 }}>
              Add additional topics this student should focus on (comma-separated):
            </div>
            <textarea
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font)', resize: 'vertical', minHeight: 80, outline: 'none', background: '#fff' }}
              placeholder="e.g. Linear Equations, Probability, Trigonometry basics..."
              value={syllabusEdit[s.id] || ''}
              onChange={e => setSyllabusEdit(prev => ({ ...prev, [s.id]: e.target.value }))}
              onFocus={e => e.target.style.borderColor = 'var(--saffron)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button className="btn btn-primary btn-sm" disabled={savingEdit || !syllabusEdit[s.id]?.trim()}
                onClick={() => saveSyllabusEdit(s.id, syllabusEdit[s.id]?.split(',').map(t => t.trim()).filter(Boolean))}>
                {savingEdit ? '⏳ Saving...' : '💾 Update Path'}
              </button>
              {editSuccess === s.id && <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>✓ Path updated!</span>}
            </div>
          </div>

          {/* Assign Learning Path */}
          <div style={{ background: 'linear-gradient(135deg, rgba(255,153,51,0.06), rgba(19,136,8,0.06))', border: '1.5px solid var(--saffron)', borderRadius: 'var(--radius-sm)', padding: '16px', marginTop: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, marginBottom: 4, color: 'var(--saffron)' }}>📋 Assign Learning Path</div>
            <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 12 }}>
              Create a named path with topics. Each topic gets AI-generated explanations visible to the student.
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="Path title (e.g. Algebra Foundations)"
              value={assignTitle[s.id] || ''}
              onChange={e => setAssignTitle(prev => ({ ...prev, [s.id]: e.target.value }))}
              style={{ marginBottom: 8, background: '#fff' }}
            />
            <textarea
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font)', resize: 'vertical', minHeight: 70, outline: 'none', background: '#fff' }}
              placeholder="Topics (comma-separated): e.g. Linear Equations, Quadratic Equations, Polynomials"
              value={assignTopics[s.id] || ''}
              onChange={e => setAssignTopics(prev => ({ ...prev, [s.id]: e.target.value }))}
              onFocus={e => e.target.style.borderColor = 'var(--saffron)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
              <button
                className="btn btn-primary btn-sm"
                disabled={assigning || !(assignTitle[s.id]?.trim()) || !(assignTopics[s.id]?.trim())}
                onClick={() => handleAssignPath(s.id)}
                style={{ background: 'var(--saffron)' }}
              >
                {assigning ? '⏳ Assigning...' : '📋 Assign Path'}
              </button>
              {assignSuccess === s.id && <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>✓ Path assigned!</span>}
              {assignError && <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>✗ {assignError}</span>}
            </div>

            {/* Previously assigned paths */}
            {assignedPaths[s.id]?.length > 0 && (
              <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Previously Assigned</div>
                {assignedPaths[s.id].map(ap => (
                  <div key={ap.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--saffronL)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>📋</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ap.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--sub)' }}>{ap.topics.length} topics · {new Date(ap.assigned_at).toLocaleDateString()}</div>
                    </div>
                    <span className={`tag ${ap.status === 'active' ? 'tag-green' : 'tag-navy'}`} style={{ fontSize: 10 }}>{ap.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div className="teacher-hero">
        <div>
          <div className="teacher-hero-name">{teacherData?.name || 'Teacher'}</div>
          <div className="teacher-hero-sub">
            {teacherData?.school || 'VidyaPath Educator'} ·{' '}
            {lang === 'hi' ? 'कक्षा कोड:' : 'Class Code:'}{' '}
            <strong style={{ color: 'var(--saffron)', letterSpacing: 2 }}>{teacherData?.class_code}</strong>
          </div>
          <div className="teacher-stats">
            <div className="teacher-stat-box"><div className="teacher-stat-val">{students.length}</div><div className="teacher-stat-lbl">{lang === 'hi' ? 'छात्र' : 'Students'}</div></div>
            <div className="teacher-stat-box"><div className="teacher-stat-val">{stats?.avg_progress || 0}%</div><div className="teacher-stat-lbl">{lang === 'hi' ? 'औसत प्रगति' : 'Avg Progress'}</div></div>
            <div className="teacher-stat-box"><div className="teacher-stat-val" style={{ color: 'var(--green)' }}>{stats?.active_today || 0}</div><div className="teacher-stat-lbl">{lang === 'hi' ? 'आज सक्रिय' : 'Active Today'}</div></div>
            <div className="teacher-stat-box"><div className="teacher-stat-val" style={{ color: 'var(--red)' }}>{stats?.weak_count || 0}</div><div className="teacher-stat-lbl">{lang === 'hi' ? 'कमज़ोर areas' : 'Weak Areas'}</div></div>
          </div>
        </div>
        <div className="teacher-code-box">
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Share with students</div>
          <div className="teacher-code">{teacherData?.class_code}</div>
          <div className="teacher-code-label">{lang === 'hi' ? 'छात्र signup पर यह code डालें' : 'Students enter this on signup'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bgCard)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 4 }}>
        {[
          { id: 'overview', label: '📊 Class Overview' },
          { id: 'students', label: `👨‍🎓 Students (${students.length})` },
          { id: 'scores', label: '📝 Quiz Scores' },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: 10, fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s',
            background: tab === tb.id ? 'var(--saffron)' : 'transparent',
            color: tab === tb.id ? '#fff' : 'var(--sub)',
          }}>{tb.label}</button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div>
          {loading ? (
            <div className="loading-screen" style={{ minHeight: 200 }}><div className="loading-spinner" /></div>
          ) : students.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--sub)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🎓</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{lang === 'hi' ? 'अभी कोई छात्र नहीं' : 'No students yet'}</div>
              <p>{lang === 'hi' ? `छात्रों को code "${teacherData?.class_code}" से जोड़ें` : `Share code "${teacherData?.class_code}" with students to get started`}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Progress distribution */}
              <div className="card">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, marginBottom: 16 }}>📈 Progress Distribution</div>
                {[
                  { label: 'Excellent (80%+)', color: 'var(--green)', count: students.filter(s => (s.progress_percent || 0) >= 80).length },
                  { label: 'Good (60–79%)', color: 'var(--teal)', count: students.filter(s => (s.progress_percent || 0) >= 60 && (s.progress_percent || 0) < 80).length },
                  { label: 'Average (40–59%)', color: 'var(--gold)', count: students.filter(s => (s.progress_percent || 0) >= 40 && (s.progress_percent || 0) < 60).length },
                  { label: 'Needs Help (<40%)', color: 'var(--red)', count: students.filter(s => (s.progress_percent || 0) < 40).length },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 13, color: 'var(--textMid)' }}>{row.label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, color: row.color }}>{row.count}</div>
                  </div>
                ))}
              </div>

              {/* Weak areas across class */}
              <div className="card">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, marginBottom: 16, color: 'var(--red)' }}>⚡ Class-wide Weak Areas</div>
                {(() => {
                  const allWeak = {};
                  students.forEach(s => s.weak_areas?.forEach(w => {
                    const key = w.substring(0, 40);
                    allWeak[key] = (allWeak[key] || 0) + 1;
                  }));
                  const sorted = Object.entries(allWeak).sort((a, b) => b[1] - a[1]).slice(0, 8);
                  return sorted.length > 0 ? sorted.map(([topic, count]) => (
                    <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ flex: 1, fontSize: 12, color: 'var(--textMid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic}</div>
                      <span className="tag tag-red">{count} {count === 1 ? 'student' : 'students'}</span>
                    </div>
                  )) : <div style={{ fontSize: 13, color: 'var(--sub)', textAlign: 'center', padding: '20px 0' }}>No weak areas detected 🎉</div>;
                })()}
              </div>

              {/* Inactive students */}
              <div className="card">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, marginBottom: 16 }}>⏰ Inactive Students (&gt;3 days)</div>
                {students.filter(s => s.is_inactive).length === 0
                  ? <div style={{ fontSize: 13, color: 'var(--green)', textAlign: 'center', padding: '20px 0' }}>All students are active! 🎉</div>
                  : students.filter(s => s.is_inactive).map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                      <div className="student-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials(s.name)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--sub)' }}>{s.days_since_active}d inactive</div>
                      </div>
                      <span className="tag tag-red">{s.days_since_active}d ago</span>
                    </div>
                  ))
                }
              </div>

              {/* Top performers */}
              <div className="card">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, marginBottom: 16 }}>🏆 Top Performers</div>
                {[...students].sort((a, b) => (b.progress_percent || 0) - (a.progress_percent || 0)).slice(0, 5).map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--sub)', width: 24, textAlign: 'center', flexShrink: 0 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </div>
                    <div className="student-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials(s.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--sub)' }}>🔥 {s.streak_count || 0} days · {s.board} Class {s.grade}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16, color: 'var(--green)' }}>{s.progress_percent || 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Students tab */}
      {tab === 'students' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <input
              className="form-input"
              placeholder="🔍 Search students..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              style={{ maxWidth: 320, background: 'var(--bgCard)' }}
            />
          </div>
          {loading ? (
            <div className="loading-screen" style={{ minHeight: 200 }}><div className="loading-spinner" /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 14 }}>
              {filteredStudents.map((s, i) => {
                const pct = s.progress_percent || 0;
                return (
                  <div key={s.id || i} className="student-card" onClick={() => setSelectedStudent(s)} style={{ cursor: 'pointer' }}>
                    <div className="student-avatar">{initials(s.name)}</div>
                    <div className="student-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div className="student-name">{s.name}</div>
                        {s.is_inactive && <span className="tag tag-red" style={{ fontSize: 10 }}>Inactive</span>}
                      </div>
                      <div className="student-meta">
                        <span>{s.board || 'CBSE'} · Class {s.grade || '–'}</span>
                        <span>🔥 {s.streak_count || 0}d</span>
                        <span style={{ color: pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--gold)' : 'var(--red)', fontWeight: 700 }}>{pct}%</span>
                      </div>
                      {s.recent_scores?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                          {s.recent_scores.slice(-3).map((score, j) => {
                            const [num, total] = (score.score || '0/5').split('/').map(Number);
                            const p = Math.round((num / (total || 5)) * 100);
                            return <span key={j} className={`tag tag-${p >= 80 ? 'teal' : p >= 60 ? 'gold' : 'red'}`} style={{ fontSize: 10 }}>{score.topic?.substring(0, 15)}… {p}%</span>;
                          })}
                        </div>
                      )}
                      <div className="student-bar" style={{ marginTop: 8 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pctColor(pct), borderRadius: 99, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                    <RingSmall value={pct} size={50} color={pctColor(pct)} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quiz Scores tab */}
      {tab === 'scores' && (
        <div>
          {/* AI Report Section */}
          <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(10,22,40,0.03), rgba(240,94,35,0.04))', border: '1.5px solid var(--saffron)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>🤖 AI Class Report</div>
                <div style={{ fontSize: 13, color: 'var(--sub)', marginTop: 4 }}>AI-generated analysis of quiz performance, weak topics, and students needing attention</div>
              </div>
              <button
                className="btn btn-primary"
                disabled={reportLoading}
                onClick={async () => {
                  setReportLoading(true);
                  setReportError(null);
                  try {
                    const data = await generateTeacherAIReport(teacherData?.class_code);
                    setAiReport(data.report);
                  } catch (err) {
                    setReportError(err.message || 'Failed to generate report');
                  }
                  setReportLoading(false);
                }}
              >
                {reportLoading ? '⏳ Analyzing...' : aiReport ? '🔄 Regenerate Report' : '✨ Generate Report'}
              </button>
            </div>
            {reportError && <div style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>✗ {reportError}</div>}

            {aiReport && (
              <div className="ai-report-content" style={{ animation: 'fadeUp 0.3s ease' }}>
                {/* Overall Assessment */}
                <div style={{ background: 'var(--bgCard)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>📋 Overall Assessment</div>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{aiReport.overall_assessment}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {/* Weak Topics */}
                  <div style={{ background: 'var(--bgCard)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>🔴 Weak Topics</div>
                    {(aiReport.weak_topics || []).length === 0
                      ? <div style={{ fontSize: 13, color: 'var(--sub)', textAlign: 'center', padding: '12px 0' }}>No weak topics detected 🎉</div>
                      : (aiReport.weak_topics || []).map((t, i) => (
                        <div key={i} style={{ padding: '10px 0', borderBottom: i < aiReport.weak_topics.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t.topic}</span>
                            <span className={`tag tag-${t.severity === 'high' ? 'red' : t.severity === 'medium' ? 'gold' : 'green'}`} style={{ fontSize: 10 }}>
                              {t.severity} · {t.student_count} student{t.student_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.5 }}>{t.suggestion}</div>
                        </div>
                      ))
                    }
                  </div>

                  {/* Students Needing Help */}
                  <div style={{ background: 'var(--bgCard)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>🟡 Students Needing Help</div>
                    {(aiReport.students_needing_help || []).length === 0
                      ? <div style={{ fontSize: 13, color: 'var(--sub)', textAlign: 'center', padding: '12px 0' }}>All students on track! 🎉</div>
                      : (aiReport.students_needing_help || []).map((s, i) => (
                        <div key={i} style={{ padding: '10px 0', borderBottom: i < aiReport.students_needing_help.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div className="student-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(s.name)}</div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.name}</span>
                            <span className={`tag tag-${s.priority === 'urgent' ? 'red' : s.priority === 'moderate' ? 'gold' : 'green'}`} style={{ fontSize: 9 }}>{s.priority}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.5, marginBottom: 2 }}>{s.reason}</div>
                          <div style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>💡 {s.recommendation}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Action Items */}
                <div style={{ background: 'linear-gradient(135deg, var(--navy), var(--navyM))', borderRadius: 'var(--radius)', padding: '20px 22px' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>💡 Recommended Actions</div>
                  {(aiReport.action_items || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < (aiReport.action_items || []).length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--saffronGlow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'var(--saffron)', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontWeight: 500 }}>{item}</div>
                    </div>
                  ))}
                  {(aiReport.class_strengths || []).length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>✅ CLASS STRENGTHS</div>
                      {aiReport.class_strengths.map((s, i) => (
                        <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', padding: '3px 0' }}>• {s}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="form-input"
              placeholder="🔍 Search student or topic..."
              value={scoreSearch}
              onChange={e => setScoreSearch(e.target.value)}
              style={{ maxWidth: 280, background: 'var(--bgCard)' }}
            />
            <div style={{ display: 'flex', gap: 4, background: 'var(--bgCard)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'weak', label: '🔴 Weak' },
                { id: 'strong', label: '🟢 Strong' },
              ].map(f => (
                <button key={f.id} onClick={() => setScoreFilter(f.id)} style={{
                  padding: '6px 14px', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: scoreFilter === f.id ? 'var(--navy)' : 'transparent',
                  color: scoreFilter === f.id ? '#fff' : 'var(--sub)',
                  fontFamily: 'var(--font)', transition: 'all 0.15s'
                }}>{f.label}</button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--sub)', fontWeight: 600 }}>
              {quizScores.length} quiz result{quizScores.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Scores Table */}
          {scoresLoading ? (
            <div className="loading-screen" style={{ minHeight: 200 }}><div className="loading-spinner" /></div>
          ) : quizScores.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--sub)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No quiz results yet</div>
              <p>Students haven't taken any quizzes yet. Results will appear here once they do.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="quiz-scores-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Topic</th>
                    <th>Score</th>
                    <th>%</th>
                    <th>Attempts</th>
                    <th>Status</th>
                    <th>Weak Concepts</th>
                  </tr>
                </thead>
                <tbody>
                  {quizScores
                    .filter(s => {
                      if (scoreFilter === 'weak') return s.status === 'weak';
                      if (scoreFilter === 'strong') return s.status === 'strong';
                      return true;
                    })
                    .filter(s => {
                      if (!scoreSearch.trim()) return true;
                      const q = scoreSearch.toLowerCase();
                      return s.student_name?.toLowerCase().includes(q) || s.topic?.toLowerCase().includes(q);
                    })
                    .map((s, i) => (
                      <tr key={i} className={s.status === 'weak' ? 'row-weak' : s.status === 'strong' ? 'row-strong' : ''}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="student-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(s.student_name)}</div>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{s.student_name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.topic}</td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16, color: s.percentage >= 80 ? 'var(--green)' : s.percentage >= 60 ? 'var(--gold)' : 'var(--red)' }}>
                            {s.score}/{s.total}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="progress-track" style={{ width: 50, height: 5 }}>
                              <div className="progress-fill" style={{ width: `${s.percentage}%`, background: s.percentage >= 80 ? 'var(--green)' : s.percentage >= 60 ? 'var(--gold)' : 'var(--red)', height: '100%' }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: s.percentage >= 80 ? 'var(--green)' : s.percentage >= 60 ? 'var(--gold)' : 'var(--red)' }}>{s.percentage}%</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--sub)' }}>{s.attempts}×</td>
                        <td>
                          <span className={`tag tag-${s.status === 'strong' ? 'teal' : s.status === 'weak' ? 'red' : s.status === 'complete' ? 'green' : 'navy'}`} style={{ fontSize: 10 }}>{s.status}</span>
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--sub)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.weak_concepts?.length > 0 ? s.weak_concepts.join('; ') : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
