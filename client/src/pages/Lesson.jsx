import { useState, useEffect } from 'react';
import { generateLesson } from '../utils/api';

export default function Lesson({ t, lang, studentId, topicName, onComplete, onStartQuiz }) {
  const [lesson, setLesson]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState(0);
  const [revealed, setRevealed]     = useState({});

  useEffect(() => {
    generateLesson(studentId, topicName)
      .then(data => { if (data?.lesson) setLesson(data.lesson); setLoading(false); })
      .catch(() => setLoading(false));
  }, [studentId, topicName]);

  if (loading) return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <div className="loading-spinner"/>
      <h3 style={{fontFamily:'var(--font-display)'}}>{lang==='hi'?'पाठ तैयार किया जा रहा है...':'Preparing your lesson...'}</h3>
      <p style={{color:'var(--sub)',fontSize:13}}>🤖 AI is crafting study material for "{topicName}"</p>
    </div>
  );

  if (!lesson) return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,padding:24}}>
      <div style={{fontSize:48}}>😕</div>
      <h3 style={{fontFamily:'var(--font-display)'}}>{lang==='hi'?'पाठ उपलब्ध नहीं':'Lesson not available'}</h3>
      <button className="btn btn-primary" onClick={onComplete}>← {t('common','back')}</button>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      {/* Header */}
      <div className="lesson-header-card">
        <div>
          <div className="lesson-badge">📖 {lang==='hi'?'पाठ':'Lesson'}</div>
          <div className="lesson-title">{lesson.title||topicName}</div>
          {lesson.real_world&&<div className="lesson-meta">🌍 Includes real-world applications</div>}
        </div>
        <div style={{display:'flex',gap:10,flexShrink:0}}>
          <button className="btn btn-ghost btn-lg" style={{borderColor:'rgba(255,255,255,0.2)',color:'rgba(255,255,255,0.8)'}} onClick={onComplete}>← {t('common','back')}</button>
          <button className="btn btn-primary btn-lg" onClick={()=>onStartQuiz(topicName)}>📝 {lang==='hi'?'क्विज़ दें':'Take Quiz'}</button>
        </div>
      </div>

      {/* 2-col layout */}
      <div className="lesson-layout">
        {/* Main content */}
        <div>
          {lesson.introduction&&(
            <div className="card" style={{marginBottom:12,fontSize:14,color:'var(--textMid)',lineHeight:1.8}}>{lesson.introduction}</div>
          )}

          {lesson.sections?.map((sec,i)=>(
            <div key={i} className="lesson-accordion">
              <div className="lesson-acc-header" onClick={()=>setExpanded(expanded===i?-1:i)}>
                <div className="lesson-acc-title">{sec.heading}</div>
                <div className={`lesson-acc-arrow ${expanded===i?'open':''}`}>›</div>
              </div>
              {expanded===i&&(
                <div className="lesson-acc-body">
                  <div className="lesson-acc-content">{sec.content}</div>
                  {sec.example&&<div className="lesson-example">💡 {sec.example}</div>}
                  {sec.tip&&<div className="lesson-tip">💡 {sec.tip}</div>}
                </div>
              )}
            </div>
          ))}

          {lesson.key_points?.length>0&&(
            <div className="lesson-keypoints-card">
              <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:14,marginBottom:12}}>⭐ {lang==='hi'?'मुख्य बिंदु':'Key Points'}</div>
              {lesson.key_points.map((pt,i)=>(
                <div key={i} className="keypoint-row"><div className="keypoint-dot"/><div className="keypoint-text">{pt}</div></div>
              ))}
            </div>
          )}

          {lesson.practice_problems?.length>0&&(
            <div className="card" style={{marginBottom:12}}>
              <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:14,marginBottom:14}}>🧪 {lang==='hi'?'अभ्यास':'Practice Problems'}</div>
              {lesson.practice_problems.map((prob,i)=>(
                <div key={i} className="practice-item">
                  <div className="practice-q">Q{i+1}: {prob.problem}</div>
                  {prob.hint&&<div className="practice-hint">💡 Hint: {prob.hint}</div>}
                  {!revealed[i]?<button className="btn btn-ghost btn-sm" onClick={()=>setRevealed(r=>({...r,[i]:true}))}>{lang==='hi'?'उत्तर देखें':'Show Answer'}</button>
                  :<div className="practice-answer">✅ {prob.answer}</div>}
                </div>
              ))}
            </div>
          )}

          {lesson.real_world&&<div className="lesson-realworld">🌍 <strong>{lang==='hi'?'असल जीवन में:':'In real life:'}</strong> {lesson.real_world}</div>}
          {lesson.encouragement&&<div className="lesson-encourage">{lesson.encouragement} 🌟</div>}

          <div style={{display:'flex',gap:12,paddingTop:8}}>
            <button className="btn btn-ghost btn-lg" onClick={onComplete}>← {t('common','back')}</button>
            <button className="btn btn-primary btn-lg btn-full" onClick={()=>onStartQuiz(topicName)}>📝 {lang==='hi'?'अब क्विज़ दें':'Take Quiz Now'}</button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lesson-sidebar-panel">
          {lesson.formulas?.length>0&&(
            <div className="formulas-card">
              <div className="formulas-title">📐 {lang==='hi'?'सूत्र':'Formulas'}</div>
              {lesson.formulas.map((f,i)=><div key={i} className="formula-pill">{f}</div>)}
            </div>
          )}
          <div className="lesson-sidebar-card">
            <div className="lsc-title">📖 {lang==='hi'?'इस पाठ में':'In this lesson'}</div>
            <div style={{fontSize:13,color:'var(--sub)',marginBottom:10}}>{lesson.sections?.length||0} sections · {lesson.key_points?.length||0} key points · {lesson.practice_problems?.length||0} practice problems</div>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {lesson.sections?.map((sec,i)=>(
                <div key={i} onClick={()=>setExpanded(i)} style={{fontSize:13,color:expanded===i?'var(--saffron)':'var(--textMid)',fontWeight:expanded===i?700:500,cursor:'pointer',padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
                  {i+1}. {sec.heading}
                </div>
              ))}
            </div>
          </div>
          <div className="lesson-sidebar-card">
            <div className="lsc-title">💡 {lang==='hi'?'पढ़ाई टिप':'Study Tip'}</div>
            <div style={{fontSize:13,color:'var(--textMid)',lineHeight:1.7}}>
              {lang==='hi'?'हर section को ध्यान से पढ़ें। उदाहरणों को खुद हल करें। क्विज़ से पहले कम से कम एक बार notes review करें।':'Read each section carefully. Try solving examples yourself before revealing answers. Review notes once before taking the quiz.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
