import { useState, useEffect } from 'react';
import { generateQuiz, submitQuiz, updatePath } from '../utils/api';

// Strip "A) " prefix that localAI includes in option text
function cleanOptionText(text) {
  if (!text) return '';
  return text.replace(/^[A-D]\)\s*/, '').trim();
}

function RingResult({ value = 0, size = 100, color = 'var(--saffron)' }) {
  const sw = 9, r = (size - sw) / 2, circ = 2 * Math.PI * r, dash = (value / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 24, color: '#fff', lineHeight: 1 }}>{Math.round(value)}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>%</span>
      </div>
    </div>
  );
}

export default function Quiz({ t, lang, studentId, topicName, onComplete }) {
  const [questions, setQuestions]     = useState([]);
  const [currentQ, setCurrentQ]       = useState(0);
  const [selected, setSelected]       = useState(null);
  const [answered, setAnswered]       = useState(false);
  const [answers, setAnswers]         = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [timer, setTimer]             = useState(0);
  const startTime                     = useState(Date.now())[0];

  useEffect(() => {
    generateQuiz(studentId, topicName)
      .then(data => { if (data?.questions) setQuestions(data.questions); setLoading(false); })
      .catch(() => setLoading(false));
  }, [studentId, topicName]);

  useEffect(() => {
    if (!loading && !showResults) {
      const iv = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(iv);
    }
  }, [loading, showResults]);

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const submitAnswer = () => {
    if (!selected) return;
    setAnswered(true);
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    if (currentQ + 1 >= questions.length) finish(newAnswers);
  };

  const next = () => { setCurrentQ(i => i + 1); setSelected(null); setAnswered(false); };

  const finish = async (finalAnswers) => {
    setSubmitting(true);
    const score = finalAnswers.filter((a, i) => a === questions[i]?.correct_answer).length;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await submitQuiz(studentId, topicName, score, finalAnswers, questions, timeTaken);
      setResult(res);
      if (res.needs_path_update) await updatePath(studentId);
    } catch { setResult({ score, feedback: null, analysis: null }); }
    setShowResults(true);
    setSubmitting(false);
  };

  const getOptions = (q) => {
    // Handle both formats:
    // Format 1 (localAI): options: ["A) text", "B) text", ...]
    // Format 2 (AI): option_a, option_b, option_c, option_d fields
    const letters = ['A', 'B', 'C', 'D'];
    return letters.map(letter => {
      let text = q[`option_${letter.toLowerCase()}`];
      if (!text && q.options) {
        const idx = letter.charCodeAt(0) - 65;
        text = q.options[idx] || '';
      }
      return { letter, text: cleanOptionText(text) };
    }).filter(o => o.text);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div className="loading-spinner" />
      <h3 style={{ fontFamily: 'var(--font-display)' }}>{lang === 'hi' ? 'AI क्विज़ बना रहा है...' : 'Generating your quiz...'}</h3>
      <p style={{ color: 'var(--sub)', fontSize: 13 }}>🤖 Unique questions tailored for "{topicName}"</p>
    </div>
  );

  if (submitting) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div className="loading-spinner" />
      <h3 style={{ fontFamily: 'var(--font-display)' }}>{lang === 'hi' ? 'AI विश्लेषण कर रहा है...' : 'Analysing your performance...'}</h3>
    </div>
  );

  if (showResults) {
    const score = answers.filter((a, i) => a === questions[i]?.correct_answer).length;
    const pct = Math.round((score / questions.length) * 100);
    const ringColor = pct >= 80 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f87171';
    const statusMsg = pct >= 80 ? (lang === 'hi' ? '🎉 शानदार प्रदर्शन!' : '🎉 Outstanding work!')
      : pct >= 60 ? (lang === 'hi' ? '💪 अच्छा किया!' : '💪 Good effort!')
      : pct >= 40 ? (lang === 'hi' ? '📖 और अभ्यास करो' : '📖 Keep practising!')
      : (lang === 'hi' ? '🔄 दोबारा पढ़ें' : '🔄 Review & retry');
    const wrong = questions.map((q, i) => ({ q, chosen: answers[i], correct: answers[i] === q.correct_answer })).filter(r => !r.correct);

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="result-hero-card">
          <RingResult value={pct} size={110} color={ringColor} />
          <div className="result-info">
            <div className="result-headline">{statusMsg}</div>
            <div className="result-sub">{topicName} · {lang === 'hi' ? 'क्विज़ पूरा हुआ' : 'Quiz completed'}</div>
            <div className="result-metrics">
              <div className="result-metric"><div className="result-metric-val" style={{ color: '#34d399' }}>{score}/{questions.length}</div><div className="result-metric-lbl">{lang === 'hi' ? 'सही' : 'Correct'}</div></div>
              <div className="result-metric"><div className="result-metric-val">{pct}%</div><div className="result-metric-lbl">Score</div></div>
              <div className="result-metric"><div className="result-metric-val" style={{ color: '#fbbf24' }}>+{score * 10}</div><div className="result-metric-lbl">XP</div></div>
              <div className="result-metric"><div className="result-metric-val">{fmt(timer)}</div><div className="result-metric-lbl">Time</div></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'flex-start' }}>
            <button className="btn btn-ghost btn-lg" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }} onClick={onComplete}>{lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</button>
            <button className="btn btn-primary btn-lg" onClick={() => { setShowResults(false); setCurrentQ(0); setSelected(null); setAnswered(false); setAnswers([]); setResult(null); setTimer(0); }}>{lang === 'hi' ? 'दोबारा' : 'Retry'}</button>
          </div>
        </div>

        <div className="results-layout">
          <div>
            {result?.feedback?.encouragement && (
              <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg,var(--navy),var(--navyM))', border: 'none', padding: '20px 24px' }}>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontStyle: 'italic' }}>"{result.feedback.encouragement}"</div>
                {result.feedback.focus_next && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--saffron)', fontWeight: 700 }}>→ {result.feedback.focus_next}</div>}
              </div>
            )}
            {result?.analysis?.recommendations?.length > 0 && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, marginBottom: 12 }}>📋 {lang === 'hi' ? 'सुझाव' : 'Recommendations'}</div>
                {result.analysis.recommendations.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14, color: 'var(--textMid)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--saffron)', fontWeight: 800 }}>→</span><span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
            {wrong.length > 0 && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, marginBottom: 12, color: 'var(--red)' }}>❌ {lang === 'hi' ? 'गलत जवाब — समीक्षा करें' : 'Mistakes to Review'}</div>
                {wrong.map((item, i) => {
                  const opts = getOptions(item.q);
                  const chosenOpt = opts.find(o => o.letter === item.chosen);
                  const correctOpt = opts.find(o => o.letter === item.q.correct_answer);
                  return (
                    <div key={i} className="mistake-row-card">
                      <div className="mistake-q">Q{i + 1}: {item.q.question}</div>
                      <div className="mistake-answers">
                        <span className="tag tag-red">{lang === 'hi' ? 'आपका:' : 'You:'} {item.chosen}) {chosenOpt?.text}</span>
                        <span className="tag tag-green">{lang === 'hi' ? 'सही:' : 'Correct:'} {item.q.correct_answer}) {correctOpt?.text}</span>
                      </div>
                      {item.q.explanation && <div className="mistake-expl" style={{ marginTop: 8 }}>{item.q.explanation}</div>}
                    </div>
                  );
                })}
              </div>
            )}
            {wrong.length === 0 && score === questions.length && (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--greenL)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, color: 'var(--green)' }}>{lang === 'hi' ? 'परफेक्ट स्कोर!' : 'Perfect Score!'}</div>
                <div style={{ fontSize: 14, color: 'var(--green)', marginTop: 6 }}>{lang === 'hi' ? 'आपने सभी सवाल सही किए 🎉' : 'You answered every question correctly 🎉'}</div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="quiz-sidebar-panel">
            <div className="quiz-sidebar-card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, marginBottom: 14 }}>📊 Question by Question</div>
              {questions.map((q, i) => {
                const correct = answers[i] === q.correct_answer;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: correct ? 'var(--greenL)' : 'var(--redL)', color: correct ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                      {correct ? '✓' : '✗'}
                    </span>
                    <div style={{ fontSize: 12, color: 'var(--textMid)', lineHeight: 1.5, flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>Q{i + 1}: {q.question?.substring(0, 60)}{q.question?.length > 60 ? '…' : ''}</div>
                      {!correct && <div style={{ color: 'var(--red)', fontSize: 11 }}>Correct: {q.correct_answer}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  if (!q) return null;
  const opts = getOptions(q);
  const prevAnswersCount = answers.length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="quiz-header-card">
        <div className="quiz-timer-badge">⏱ {fmt(timer)}</div>
        <div className="quiz-progress-outer">
          <div className="quiz-q-label">
            {lang === 'hi' ? 'सवाल' : 'Question'} {currentQ + 1} {lang === 'hi' ? 'में से' : 'of'} {questions.length} · <span style={{ color: 'var(--saffron)' }}>{topicName}</span>
          </div>
          <div className="progress-track" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${(currentQ / questions.length) * 100}%`, background: 'var(--saffron)' }} />
          </div>
          <div className="quiz-dots" style={{ marginTop: 8 }}>
            {questions.map((_, i) => (
              <div key={i} className={`quiz-dot${i < prevAnswersCount
                ? (answers[i] === questions[i].correct_answer ? ' answered-right' : ' answered-wrong')
                : i === currentQ ? ' current' : ''}`} />
            ))}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={onComplete}>{lang === 'hi' ? 'छोड़ें' : 'Quit'}</button>
      </div>

      <div className="quiz-layout">
        {/* Main */}
        <div>
          <div className="question-card">
            <div className="question-topic">{q.topic || topicName}</div>
            <div className="question-text">{q.question}</div>
          </div>

          {opts.map(({ letter, text }) => {
            const isChosen = selected === letter;
            const isCorrect = letter === q.correct_answer;
            let cls = 'option-btn';
            if (answered) {
              cls += ' answered-state';
              if (isCorrect) cls += ' opt-correct';
              else if (isChosen) cls += ' opt-wrong';
            } else if (isChosen) cls += ' selected';
            return (
              <button key={letter} className={cls} onClick={() => !answered && setSelected(letter)}>
                <div className="option-letter">{letter}</div>
                <div className="option-text">{text}</div>
                {answered && isCorrect && <span className="option-icon">✓</span>}
                {answered && isChosen && !isCorrect && <span className="option-icon">✗</span>}
              </button>
            );
          })}

          {answered && q.explanation && (
            <div className="quiz-explanation">
              <div className="quiz-expl-title">💡 {lang === 'hi' ? 'व्याख्या' : 'Explanation'}</div>
              <div className="quiz-expl-text">{q.explanation}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {!answered && (
              <button className="btn btn-primary btn-xl btn-full" disabled={!selected} onClick={submitAnswer}>
                {lang === 'hi' ? 'जवाब दें' : 'Submit Answer'}
              </button>
            )}
            {answered && currentQ + 1 < questions.length && (
              <button className="btn btn-teal btn-xl btn-full" onClick={next}>
                {lang === 'hi' ? 'अगला सवाल →' : 'Next Question →'}
              </button>
            )}
            {answered && currentQ + 1 >= questions.length && (
              <button className="btn btn-primary btn-xl btn-full" onClick={() => finish(answers)}>
                {lang === 'hi' ? 'परिणाम देखें 🎯' : 'See Results 🎯'}
              </button>
            )}
          </div>
          {!answered && !selected && (
            <div style={{ textAlign: 'center', color: 'var(--sub)', fontSize: 13, padding: '10px 0' }}>
              {lang === 'hi' ? 'एक जवाब चुनें' : 'Select an answer to continue'}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="quiz-sidebar-panel">
          <div className="quiz-sidebar-card">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, marginBottom: 12 }}>📊 {lang === 'hi' ? 'स्कोर' : 'Live Score'}</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, background: 'var(--greenL)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 24, color: 'var(--green)' }}>{answers.filter((a, i) => a === questions[i]?.correct_answer).length}</div>
                <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>{lang === 'hi' ? 'सही' : 'Correct'}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--redL)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 24, color: 'var(--red)' }}>{answers.length - answers.filter((a, i) => a === questions[i]?.correct_answer).length}</div>
                <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700 }}>{lang === 'hi' ? 'गलत' : 'Wrong'}</div>
              </div>
            </div>
            {questions.map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: i < answers.length ? (answers[i] === questions[i].correct_answer ? 'var(--greenL)' : 'var(--redL)') : i === currentQ ? 'var(--saffronL)' : 'var(--border)', color: i < answers.length ? (answers[i] === questions[i].correct_answer ? 'var(--green)' : 'var(--red)') : i === currentQ ? 'var(--saffron)' : 'var(--sub)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>
                  {i < answers.length ? (answers[i] === questions[i].correct_answer ? '✓' : '✗') : i === currentQ ? '→' : i + 1}
                </span>
                <span style={{ color: i === currentQ ? 'var(--saffron)' : i < answers.length ? (answers[i] === questions[i].correct_answer ? 'var(--green)' : 'var(--red)') : 'var(--sub)', fontWeight: i === currentQ ? 800 : 500 }}>
                  {lang === 'hi' ? 'सवाल' : 'Q'}{i + 1}
                </span>
              </div>
            ))}
          </div>
          <div className="quiz-sidebar-card">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, marginBottom: 8 }}>💡 Tips</div>
            <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.8 }}>
              • {lang === 'hi' ? 'सभी options ध्यान से पढ़ें' : 'Read all options carefully'}<br />
              • {lang === 'hi' ? 'गलत होने पर explanation देखें' : 'Check explanation if wrong'}<br />
              • {lang === 'hi' ? 'हर quiz में नए सवाल होते हैं' : 'Every quiz has unique questions'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
