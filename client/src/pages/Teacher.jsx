import { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';

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
    </div>
  );
}
