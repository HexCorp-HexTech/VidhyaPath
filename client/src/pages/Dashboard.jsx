import { useState, useEffect, useCallback } from 'react';
import { getStudent, updatePath, getReEngagement } from '../utils/api';

function RingChart({ value=0, size=90, color='var(--saffron)', label }) {
  const sw=8, r=(size-sw)/2, circ=2*Math.PI*r, dash=(value/100)*circ;
  return (
    <div className="ring-chart" style={{width:size,height:size}}>
      <svg width={size} height={size}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={sw}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round" style={{transition:'stroke-dasharray 0.9s ease'}}/></svg>
      <div className="ring-chart-inner"><div className="ring-chart-val">{Math.round(value)}</div>{label&&<div className="ring-chart-lbl">{label}</div>}</div>
    </div>
  );
}

export default function Dashboard({ t, lang, studentId, onStartQuiz, onStartLesson }) {
  const [student, setStudent]         = useState(null);
  const [topics, setTopics]           = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [pathUpdateNotif, setPathUpdateNotif] = useState(null);
  const [reengagement, setReengagement] = useState(null);
  const [loading, setLoading]         = useState(true);

  const loadStudent = useCallback(async () => {
    try {
      const data = await getStudent(studentId);
      if (!data) return;
      setStudent(data);
      if (data.current_path?.path_json) {
        setTopics(data.current_path.path_json.map(topic => {
          const prog = data.progress?.find(p => p.topic_name === topic.topic);
          return { ...topic, status: prog?.status||'pending', quiz_score: prog?.quiz_score, feedback: prog?.feedback?JSON.parse(prog.feedback):null };
        }));
      }
      if (data.needs_reengagement) {
        const msg = await getReEngagement(studentId);
        if (msg) setReengagement(msg);
      }
      setLoading(false);
    } catch { setLoading(false); }
  }, [studentId]);

  useEffect(() => { loadStudent(); }, [loadStudent]);

  const handlePathUpdate = async () => {
    try {
      const result = await updatePath(studentId);
      if (result?.topics) {
        setTopics(result.topics.map(t => ({ ...t, status:'pending' })));
        setPathUpdateNotif(result.update_reason);
        setTimeout(() => setPathUpdateNotif(null), 8000);
      }
    } catch {}
  };

  if (loading) return <div className="loading-screen"><div className="loading-spinner"/><h3>{t('common','loading')}</h3></div>;

  const completed   = topics.filter(t=>['complete','strong','weak'].includes(t.status)).length;
  const strong      = topics.filter(t=>t.status==='strong').length;
  const weak        = topics.filter(t=>t.status==='weak');
  const pct         = topics.length>0 ? Math.round((completed/topics.length)*100) : 0;
  const nextTopic   = topics.find(t=>t.status==='pending');

  const greeting = new Date().getHours()<12?(lang==='hi'?'सुप्रभात':'Good Morning'):new Date().getHours()<17?(lang==='hi'?'नमस्ते':'Good Afternoon'):(lang==='hi'?'शुभ संध्या':'Good Evening');

  const statusColor = s => s==='strong'?'var(--teal)':s==='complete'?'var(--green)':s==='weak'?'var(--red)':'var(--textMid)';
  const statusLabel = s => ({ pending:lang==='hi'?'बाकी':'Pending', complete:lang==='hi'?'पूर्ण':'Done', strong:lang==='hi'?'मजबूत':'Strong', weak:lang==='hi'?'कमज़ोर':'Weak' }[s]||s);
  const statusTagClass = s => ({ pending:'tag-navy', complete:'tag-green', strong:'tag-teal', weak:'tag-red' }[s]||'tag-navy');

  // Topic detail modal
  if (selectedTopic) return (
    <div className="modal-overlay" onClick={()=>setSelectedTopic(null)}>
      <div className="modal-card" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={()=>setSelectedTopic(null)}>✕</button>
        <div className="modal-title">{selectedTopic.topic}</div>
        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          <span className={`tag ${statusTagClass(selectedTopic.status)}`}>{statusLabel(selectedTopic.status)}</span>
          <span className="tag tag-navy">{'★'.repeat(selectedTopic.difficulty||3)}</span>
          <span className="tag tag-navy">⏱ {selectedTopic.duration_minutes||20} min</span>
        </div>
        <div className="modal-section"><div className="modal-section-label">Why it matters</div><div className="modal-section-text">{selectedTopic.why_it_matters}</div></div>
        <div className="modal-section"><div className="modal-section-label">Resource</div><div className="modal-section-text">{selectedTopic.resource_description}</div></div>
        {selectedTopic.feedback&&<div className="modal-section"><div className="modal-section-label">Last feedback</div><div className="modal-section-text">{selectedTopic.feedback.encouragement}</div>{selectedTopic.feedback.focus_next&&<div style={{marginTop:6,fontSize:13,color:'var(--saffron)',fontWeight:600}}>{selectedTopic.feedback.focus_next}</div>}</div>}
        <div className="modal-actions">
          <button className="btn btn-primary btn-lg" onClick={()=>{setSelectedTopic(null);onStartLesson(selectedTopic.topic);}}>📖 {lang==='hi'?'पहले पढ़ें':'Study First'}</button>
          {(selectedTopic.status==='pending'||selectedTopic.status==='weak')&&<button className="btn btn-ghost btn-lg" onClick={()=>{setSelectedTopic(null);onStartQuiz(selectedTopic.topic);}}>📝 {selectedTopic.status==='weak'?(lang==='hi'?'दोबारा क्विज़':'Retake Quiz'):(lang==='hi'?'क्विज़ दें':'Take Quiz')}</button>}
          {selectedTopic.status==='strong'&&<div className="tag tag-teal" style={{padding:'10px 18px',fontSize:14}}>✅ {lang==='hi'?'मजबूत':'Strong'}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Re-engagement */}
      {reengagement&&(
        <div className="reengagement-banner">
          <div className="reengagement-text"><h3>🎉 {t('reengagement','welcome_back')}</h3><p>{reengagement.motivation}</p><p style={{marginTop:4}}>{reengagement.recap}</p></div>
          <button className="btn btn-primary" onClick={()=>{setReengagement(null);if(nextTopic)setSelectedTopic(nextTopic);}}>⚡ {t('reengagement','catch_up')}</button>
        </div>
      )}
      {pathUpdateNotif&&(
        <div className="path-update-notif">
          <span style={{fontSize:20}}>🔄</span>
          <p><strong>{t('dashboard','path_updated')}:</strong> {pathUpdateNotif}</p>
        </div>
      )}

      {/* Hero */}
      <div className="hero-banner">
        <div className="hero-left">
          <div className="hero-greeting">{greeting},</div>
          <div className="hero-name">{student?.name?.split(' ')[0]||'Student'} 👋</div>
          <div className="hero-tags">
            <span className="hero-tag hero-tag-streak">🔥 {student?.streak_count||0} day streak</span>
            {student?.board&&<span className="hero-tag hero-tag-board">{student.board}</span>}
            {student?.grade&&<span className="hero-tag hero-tag-grade">Class {student.grade}</span>}
            {student?.level&&<span className="hero-tag" style={{background:'rgba(139,92,246,0.2)',color:'#c4b5fd'}}>{student.level}</span>}
          </div>
        </div>
        <div className="hero-right">
          <div>
            <RingChart value={pct} size={90} color="var(--saffron)" label={lang==='hi'?'पूर्ण':'done'} />
          </div>
          <div className="quick-actions">
            {nextTopic&&<div className="quick-action-btn" onClick={()=>onStartLesson(nextTopic.topic)}><span className="qa-icon">📖</span><div><div className="qa-text">{lang==='hi'?'पढ़ें':'Study'}</div><div className="qa-sub" style={{maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nextTopic.topic}</div></div></div>}
            {nextTopic&&<div className="quick-action-btn" onClick={()=>onStartQuiz(nextTopic.topic)}><span className="qa-icon">📝</span><div><div className="qa-text">{lang==='hi'?'क्विज़':'Quick Quiz'}</div><div className="qa-sub">{lang==='hi'?'तैयार हैं?':'Ready to test?'}</div></div></div>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-grid">
        {[
          {icon:'📚',bg:'rgba(12,27,51,0.07)', val:topics.length, lbl:lang==='hi'?'कुल विषय':'Total Topics', sub:lang==='hi'?'आपके पाठ्यक्रम में':'In your path'},
          {icon:'✅',bg:'var(--greenL)',       val:completed,      lbl:lang==='hi'?'पूरे किए':'Completed',     sub:`${pct}% ${lang==='hi'?'हो गया':'done'}`, subColor:'var(--green)'},
          {icon:'🏆',bg:'var(--tealL)',        val:strong,         lbl:lang==='hi'?'मजबूत':'Strong Topics',   sub:lang==='hi'?'बढ़िया प्रदर्शन':'Great performance', subColor:'var(--teal)'},
          {icon:'⚡',bg:'var(--redL)',         val:weak.length,    lbl:lang==='hi'?'कमज़ोर':'Needs Work',     sub:lang==='hi'?'ध्यान दें':'Needs attention', subColor:weak.length>0?'var(--red)':'var(--green)'},
        ].map((s,i)=>(
          <div key={i} className="stat-card">
            <div className="stat-icon-wrap" style={{background:s.bg}}>{s.icon}</div>
            <div className="stat-body">
              <div className="stat-val">{s.val}</div>
              <div className="stat-lbl">{s.lbl}</div>
              <div className="stat-sub"><span className="stat-sub-up" style={{color:s.subColor||'var(--sub)'}}>{s.sub}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-col */}
      <div className="dashboard-main-grid">
        {/* Topic list */}
        <div>
          <div className="section-header">
            <div className="section-title">{lang==='hi'?'आपका लर्निंग पाथ':'Learning Path'} <span style={{fontSize:13,color:'var(--sub)',fontWeight:500}}>({topics.length} {lang==='hi'?'विषय':'topics'})</span></div>
            {weak.length>=3&&<button className="btn btn-ghost btn-sm" onClick={handlePathUpdate}>🔄 {lang==='hi'?'अपडेट':'Update Path'}</button>}
          </div>
          {topics.length===0?(<div className="card" style={{textAlign:'center',padding:'3rem',color:'var(--sub)'}}><div style={{fontSize:48,marginBottom:12}}>📚</div><div style={{fontSize:16,fontWeight:700,color:'var(--text)',marginBottom:6}}>{lang==='hi'?'अभी कोई विषय नहीं':'No topics yet'}</div><p>{lang==='hi'?'ऑनबोर्डिंग पूरी करें':'Complete onboarding to generate your path'}</p></div>)
          :(topics.map((topic,i)=>{
            const scorePct = topic.quiz_score!=null?Math.round((topic.quiz_score/5)*100):null;
            return (
              <div key={topic.topic} className="topic-row" onClick={()=>setSelectedTopic(topic)}>
                <div className={`topic-row-num ${topic.status}`}>{topic.status==='strong'?'✓':topic.status==='complete'?'✓':topic.status==='weak'?'!':i+1}</div>
                <div className="topic-row-body">
                  <div className="topic-row-name">{topic.topic}</div>
                  <div className="topic-row-meta">
                    <span>{'★'.repeat(topic.difficulty||3)}{'☆'.repeat(5-(topic.difficulty||3))}</span>
                    <span>⏱ {topic.duration_minutes||20} min</span>
                    {topic.chapter&&<span>📖 {topic.chapter}</span>}
                    {scorePct!=null&&<span style={{color:scorePct>=80?'var(--green)':scorePct>=60?'var(--gold)':'var(--red)',fontWeight:700}}>Last: {scorePct}%</span>}
                  </div>
                  {scorePct!=null&&<div className="topic-progress-bar" style={{marginTop:6}}><div className="topic-progress-fill" style={{width:`${scorePct}%`,background:scorePct>=80?'var(--green)':scorePct>=60?'var(--gold)':'var(--red)'}}/></div>}
                </div>
                <div className="topic-row-right" onClick={e=>e.stopPropagation()}>
                  <span className={`tag ${statusTagClass(topic.status)}`}>{statusLabel(topic.status)}</span>
                  <button className="btn btn-ghost btn-sm" onClick={()=>onStartLesson(topic.topic)}>📖</button>
                  <button className="btn btn-primary btn-sm" onClick={()=>onStartQuiz(topic.topic)}>📝 {lang==='hi'?'क्विज़':'Quiz'}</button>
                </div>
              </div>
            );
          }))}
        </div>

        {/* Right panel */}
        <div className="sidebar-panel">
          {/* Weak areas */}
          {weak.length>0&&(
            <div className="panel-card">
              <div className="panel-title" style={{color:'var(--red)'}}>⚡ {lang==='hi'?'कमज़ोर क्षेत्र':'Weak Areas'}</div>
              {weak.slice(0,5).map(w=>(
                <div key={w.topic} className="weak-area-item">
                  <div className="weak-area-name">{w.topic}</div>
                  <button className="btn btn-danger btn-sm" onClick={()=>onStartQuiz(w.topic)}>{lang==='hi'?'सुधारें':'Practice'}</button>
                </div>
              ))}
              {weak.length>5&&<div style={{fontSize:12,color:'var(--sub)',marginTop:8,textAlign:'center'}}>+{weak.length-5} more weak areas</div>}
            </div>
          )}

          {/* Student info */}
          {student&&(
            <div className="panel-card">
              <div className="panel-title">{lang==='hi'?'आपका प्रोफ़ाइल':'Your Profile'}</div>
              {[
                ['🏫','Board',student.board||'CBSE'],
                ['📚','Grade',`Class ${student.grade||'–'}`],
                ['⚡','Level',student.level||'–'],
                ['⏱','Study Time',student.study_time||'30 min'],
                ['📝','Subjects',(student.goals||'').split(',').filter(Boolean).join(', ')||'–'],
              ].map(([icon,label,val])=>(
                <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontSize:13,color:'var(--sub)'}}>{icon} {label}</span>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Progress summary */}
          <div className="panel-card">
            <div className="panel-title">{lang==='hi'?'प्रगति':'Progress'}</div>
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
              <RingChart value={pct} size={72} color="var(--saffron)" label="%" />
              <div>
                <div style={{fontFamily:'var(--font-display)',fontWeight:900,fontSize:24,color:'var(--text)'}}>{pct}%</div>
                <div style={{fontSize:12,color:'var(--sub)'}}>{lang==='hi'?'पाठ्यक्रम पूरा':'Path complete'}</div>
              </div>
            </div>
            {[
              {label:lang==='hi'?'पूरे किए':'Completed', val:completed, color:'var(--green)'},
              {label:lang==='hi'?'मजबूत':'Strong',      val:strong,    color:'var(--teal)'},
              {label:lang==='hi'?'कमज़ोर':'Weak',       val:weak.length,color:'var(--red)'},
              {label:lang==='hi'?'बाकी':'Pending',      val:topics.length-completed, color:'var(--sub)'},
            ].map(row=>(
              <div key={row.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0'}}>
                <span style={{fontSize:12,color:'var(--sub)'}}>{row.label}</span>
                <span style={{fontSize:14,fontWeight:800,color:row.color}}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
