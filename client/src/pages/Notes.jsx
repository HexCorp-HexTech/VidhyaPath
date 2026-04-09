import { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';

function ConceptCard({ concept, lang }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 12 }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: expanded ? 'rgba(240,94,35,0.04)' : 'var(--bgCard)', transition: 'background 0.15s', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: expanded ? 'var(--saffronL)' : 'rgba(12,27,51,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
            {expanded ? '📖' : '📌'}
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{concept.concept}</span>
        </div>
        <span style={{ fontSize: 18, color: 'var(--sub)', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'none' }}>›</span>
      </div>

      {expanded && (
        <div style={{ padding: '0 18px 20px', borderTop: '1px solid var(--border)' }}>
          {/* Explanation */}
          <div style={{ paddingTop: 16, fontSize: 14, color: 'var(--textMid)', lineHeight: 1.85, whiteSpace: 'pre-wrap', marginBottom: 14 }}>
            {concept.explanation}
          </div>

          {/* Formula */}
          {concept.formula && (
            <div style={{ background: 'var(--navy)', borderRadius: 10, padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>📐</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 4 }}>Formula</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#fff' }}>{concept.formula}</div>
              </div>
            </div>
          )}

          {/* Example */}
          {concept.example && (
            <div style={{ background: 'rgba(240,94,35,0.06)', border: '1px solid rgba(240,94,35,0.15)', borderLeft: '3px solid var(--saffron)', borderRadius: '0 10px 10px 0', padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--saffron)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 5 }}>
                {lang === 'hi' ? '💡 उदाहरण' : '💡 Worked Example'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--textMid)', lineHeight: 1.7 }}>{concept.example}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Notes({ lang, studentId, board, grade, onBack, onStartQuiz }) {
  const [notes, setNotes]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [expanded, setExpanded]   = useState(null);
  const [fetchingChapter, setFetchingChapter] = useState(null);
  const [chapterDetails, setChapterDetails]   = useState({});

  useEffect(() => {
    const cached = localStorage.getItem('pw_offline_notes');
    if (cached) {
      try {
        const p = JSON.parse(cached);
        setNotes(p);
        const f = Object.keys(p)[0];
        if (f) setSelected(f);
        setLoading(false);
        return;
      } catch {}
    }
    fetch(`${API_BASE}/lesson/notes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, board: board || 'CBSE', grade: grade || 8 }),
    })
      .then(r => r.json())
      .then(d => {
        if (d?.notes) {
          setNotes(d.notes);
          localStorage.setItem('pw_offline_notes', JSON.stringify(d.notes));
          const f = Object.keys(d.notes)[0];
          if (f) setSelected(f);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId, board, grade]);

  const fetchChapterDetail = async (chapterName, subject) => {
    const key = `${subject}_${chapterName}`;
    if (chapterDetails[key]) return; // already fetched
    setFetchingChapter(key);
    try {
      const res = await fetch(`${API_BASE}/lesson/chapter-notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter: chapterName, board: board || 'CBSE', grade: grade || 8, subject, student_id: studentId }),
      });
      const data = await res.json();
      if (data?.notes) {
        setChapterDetails(prev => ({ ...prev, [key]: data.notes }));
      }
    } catch {}
    setFetchingChapter(null);
  };

  const toggleChapter = (i, chapterName, subject) => {
    if (expanded === i) { setExpanded(null); return; }
    setExpanded(i);
    fetchChapterDetail(chapterName, subject);
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <h3>{lang === 'hi' ? 'नोट्स लोड हो रहे हैं...' : 'Loading your study notes...'}</h3>
    </div>
  );

  const subjects = Object.keys(notes);
  const chapters = selected ? (notes[selected] || []) : [];

  const subjectIcons = { Math: '📐', Science: '🔬', English: '📖', Hindi: '🔤', 'Social Science': '🌍' };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, marginBottom: 4 }}>
          {lang === 'hi' ? 'विस्तृत अध्ययन नोट्स' : 'Detailed Study Notes'}
        </h2>
        <p style={{ color: 'var(--sub)', fontSize: 14 }}>
          {board || 'CBSE'} · Class {grade || '8'} · {lang === 'hi' ? 'हर concept की पूरी व्याख्या' : 'In-depth explanation of every concept'}
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--sub)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{lang === 'hi' ? 'अभी नोट्स नहीं' : 'No notes yet'}</div>
          <p>{lang === 'hi' ? 'ऑनबोर्डिंग पूरी करें' : 'Complete onboarding to generate notes'}</p>
        </div>
      ) : (
        <div className="notes-layout">
          {/* Subject sidebar */}
          <div className="notes-subjects-sidebar">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, marginBottom: 12, color: 'var(--sub)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Subjects</div>
            {subjects.map(s => (
              <button key={s} className={`notes-subject-btn ${selected === s ? 'active' : ''}`}
                onClick={() => { setSelected(s); setExpanded(null); }}>
                <span>{subjectIcons[s] || '📚'}</span>
                <span>{s}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.6 }}>{notes[s]?.length || 0}</span>
              </button>
            ))}
            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--sub)', lineHeight: 1.7, padding: '12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              📶 {lang === 'hi' ? 'सभी नोट्स ऑफलाइन उपलब्ध हैं।' : 'All notes cached for offline use.'}
            </div>
          </div>

          {/* Chapter list */}
          <div>
            {selected && (
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 18 }}>
                {subjectIcons[selected]} {selected} <span style={{ fontSize: 13, color: 'var(--sub)', fontWeight: 500 }}>— {chapters.length} {lang === 'hi' ? 'अध्याय' : 'Chapters'}</span>
              </div>
            )}

            {chapters.map((ch, i) => {
              const key = `${selected}_${ch.chapter}`;
              const detail = chapterDetails[key];
              const isLoading = fetchingChapter === key;
              const isOpen = expanded === i;

              return (
                <div key={i} className="chapter-accordion">
                  <div className="chapter-acc-header" onClick={() => toggleChapter(i, ch.chapter, selected)}>
                    <div className="chapter-num">{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div className="chapter-name">{ch.chapter}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        {ch.important_topics?.length > 0 && <span className="tag tag-saffron">{ch.important_topics.length} topics</span>}
                        {ch.common_weak_areas?.length > 0 && <span className="tag tag-red">{ch.common_weak_areas.length} weak areas</span>}
                        {detail?.key_concepts?.length > 0 && <span className="tag tag-teal">{detail.key_concepts.length} concepts</span>}
                      </div>
                    </div>
                    <div className={`chapter-arrow ${isOpen ? 'open' : ''}`}>›</div>
                  </div>

                  {isOpen && (
                    <div className="chapter-body">
                      {/* Summary */}
                      {(detail?.summary || ch.summary) && (
                        <div style={{ background: 'rgba(12,27,51,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 20, fontSize: 14, color: 'var(--textMid)', lineHeight: 1.8 }}>
                          {detail?.summary || ch.summary}
                        </div>
                      )}

                      {isLoading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', color: 'var(--sub)', fontSize: 14 }}>
                          <div className="loading-spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
                          {lang === 'hi' ? 'AI विस्तृत नोट्स बना रहा है...' : 'AI is generating detailed notes...'}
                        </div>
                      )}

                      {/* Detailed concepts - the main feature */}
                      {detail?.key_concepts?.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>🧠</span>
                            <span>{lang === 'hi' ? 'मुख्य Concepts' : 'Key Concepts'}</span>
                            <span style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 500 }}>({detail.key_concepts.length})</span>
                          </div>
                          {detail.key_concepts.map((concept, j) => (
                            <ConceptCard key={j} concept={concept} lang={lang} />
                          ))}
                        </div>
                      )}

                      {/* Fallback: important topics as tags if no detail yet */}
                      {!detail && !isLoading && ch.important_topics?.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div className="chapter-tags-label">⭐ {lang === 'hi' ? 'महत्वपूर्ण विषय' : 'Important Topics'}</div>
                          <div className="chapter-tags" style={{ marginTop: 8 }}>
                            {ch.important_topics.map(t => <span key={t} className="tag tag-saffron" style={{ margin: '3px' }}>{t}</span>)}
                          </div>
                        </div>
                      )}

                      {/* Weak areas */}
                      {(detail?.common_weak_areas || ch.common_weak_areas)?.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--red)', marginBottom: 10 }}>
                            ⚠ {lang === 'hi' ? 'आम गलतियाँ' : 'Common Mistakes'}
                          </div>
                          {(detail?.common_weak_areas || ch.common_weak_areas).map((w, j) => (
                            <div key={j} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--textMid)', alignItems: 'flex-start' }}>
                              <span style={{ color: 'var(--red)', fontWeight: 800, flexShrink: 0 }}>✗</span>
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Study tips */}
                      {(detail?.study_tips || ch.study_tips)?.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
                            💡 {lang === 'hi' ? 'पढ़ाई के सुझाव' : 'Study Tips'}
                          </div>
                          {(detail?.study_tips || ch.study_tips).map((tip, j) => (
                            <div key={j} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--textMid)', lineHeight: 1.6, alignItems: 'flex-start' }}>
                              <span style={{ color: 'var(--teal)', fontWeight: 800, flexShrink: 0 }}>→</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Exam tips */}
                      {detail?.exam_tips?.length > 0 && (
                        <div style={{ background: 'var(--goldL)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 16 }}>
                          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--gold)', marginBottom: 8 }}>🎯 {lang === 'hi' ? 'परीक्षा टिप्स' : 'Exam Tips'}</div>
                          {detail.exam_tips.map((tip, j) => (
                            <div key={j} style={{ fontSize: 13, color: 'var(--textMid)', padding: '4px 0', lineHeight: 1.6 }}>• {tip}</div>
                          ))}
                        </div>
                      )}

                      {/* Practice questions */}
                      {detail?.practice_questions?.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
                            🧪 {lang === 'hi' ? 'अभ्यास प्रश्न' : 'Practice Questions'}
                          </div>
                          {detail.practice_questions.map((q, j) => (
                            <div key={j} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 8, fontSize: 13, color: 'var(--textMid)', lineHeight: 1.6 }}>
                              <span style={{ fontWeight: 700, color: 'var(--navy)' }}>Q{j + 1}:</span> {q}
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => onStartQuiz(ch.chapter)}>
                          📝 {lang === 'hi' ? 'इस chapter पर quiz' : 'Quiz this chapter'}
                        </button>
                        {!detail && !isLoading && (
                          <button className="btn btn-ghost btn-sm" onClick={() => fetchChapterDetail(ch.chapter, selected)}>
                            ✨ {lang === 'hi' ? 'AI से विस्तृत नोट्स लें' : 'Load AI detailed notes'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
