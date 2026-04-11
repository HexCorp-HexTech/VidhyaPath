import { useState, useEffect } from 'react';
import { createStudent, generatePath, API_BASE } from '../utils/api';

export default function Onboarding({ t, lang, studentId, onComplete, toggleLang }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:'', age:'', grade:'', board:'CBSE', goals:[], level:'', study_time:'30 min', language: lang });
  const [loading, setLoading] = useState(false);
  const totalSteps = 5;

  const up = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleGoal = id => setForm(f => ({ ...f, goals: f.goals.includes(id) ? f.goals.filter(g=>g!==id) : [...f.goals, id] }));

  const stepMeta = [
    { label: lang==='hi'?'स्वागत':'Welcome',     desc:'Get started' },
    { label: lang==='hi'?'आपके बारे में':'About You', desc:'Name & age' },
    { label: lang==='hi'?'आपकी कक्षा':'Your Class', desc:'Board & grade' },
    { label: lang==='hi'?'विषय':'Subjects',        desc:'Pick subjects' },
    { label: lang==='hi'?'स्तर':'Level',           desc:'Your level' },
  ];
  const valid = [true, form.name.trim().length>=2&&form.age, form.grade&&form.board, form.goals.length>0, !!form.level];

  const subjects = [
    { id:'Math',           emoji:'📐', label:lang==='hi'?'गणित':'Math' },
    { id:'Science',        emoji:'🔬', label:lang==='hi'?'विज्ञान':'Science' },
    { id:'English',        emoji:'📖', label:lang==='hi'?'अंग्रेज़ी':'English' },
    { id:'Hindi',          emoji:'🔤', label:'Hindi' },
    { id:'Social Science', emoji:'🌍', label:lang==='hi'?'सामाजिक विज्ञान':'Social Science' },
  ];
  const levels = [
    { id:'beginner',     label:lang==='hi'?'शुरुआती':'Beginner',     desc:lang==='hi'?'बुनियादी बातें सीखनी हैं':'Need to learn the basics' },
    { id:'intermediate', label:lang==='hi'?'मध्यम':'Intermediate', desc:lang==='hi'?'कुछ विषय आते हैं':'Know some topics already' },
    { id:'advanced',     label:lang==='hi'?'उन्नत':'Advanced',       desc:lang==='hi'?'बोर्ड परीक्षा की तैयारी':'Preparing for board exams' },
  ];
  const grades = ['6','7','8','9','10','11','12'];
  const boards = ['CBSE','ICSE','State Board'];

  const handleFinish = async () => {
    setLoading(true);
    try {
      const profile = { id:studentId, name:form.name.trim()||'Student', age:parseInt(form.age)||14, grade:parseInt(form.grade)||8, board:form.board, goals:form.goals.join(','), level:form.level||'beginner', study_time:form.study_time, language:lang, device_type:'desktop', connectivity:'4g' };
      const student = await createStudent(profile);
      const sid = student.id || studentId;
      await generatePath(sid);
      try {
        const r = await fetch(`${API_BASE}/lesson/notes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({student_id:sid,board:form.board,grade:parseInt(form.grade)||8,subjects:form.goals.join(',')})});
        const d = await r.json(); if(d?.notes) localStorage.setItem('pw_offline_notes',JSON.stringify(d.notes));
      } catch {}
      onComplete(sid);
    } catch (err) { console.error(err); setLoading(false); }
  };

  if (loading) return (
    <div className="onboard-root" style={{alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div className="loading-spinner" style={{margin:'0 auto 16px'}} />
        <div style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:900,color:'#fff',marginBottom:8}}>🤖 {lang==='hi'?'AI आपका पाठ्यक्रम बना रहा है...':'Building your personalised learning path...'}</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>{form.board} Class {form.grade} · {form.goals.join(', ')}</div>
      </div>
    </div>
  );

  return (
    <div className="onboard-root">
      {/* Left steps sidebar */}
      <div className="onboard-sidebar">
        <div className="onboard-sidebar-logo">
          <div className="login-brand-icon">V</div>
          <div style={{fontFamily:'var(--font-display)',fontWeight:900,fontSize:18,color:'#fff'}}>Vidya<span style={{color:'var(--saffron)'}}>Path</span></div>
        </div>
        <div className="onboard-sidebar-steps">
          {stepMeta.map((s,i) => (
            <div key={i} className={`onboard-step-item ${step===i+1?'active':step>i+1?'done':''}`}>
              <div className="onboard-step-num">{step>i+1?'✓':i+1}</div>
              <div className="onboard-step-text">
                <div className="onboard-step-label">{s.label}</div>
                <div className="onboard-step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:'auto',paddingTop:32}}>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.25)',lineHeight:1.6}}>All data is stored securely. Your progress syncs across devices when connected.</div>
        </div>
      </div>

      {/* Main card */}
      <div className="onboard-main">
        <div className="onboard-card">
          <div className="onboard-card-step">Step {step} of {totalSteps}</div>

          {step===1&&(<>
            <div className="onboard-card-title">{lang==='hi'?'VidyaPath में आपका स्वागत है 🎓':'Welcome to VidyaPath 🎓'}</div>
            <div className="onboard-card-sub">{lang==='hi'?'भारत के छात्रों के लिए AI-संचालित अनुकूल शिक्षा।':'AI-powered adaptive learning built for Indian students.'}</div>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:8}}>
              {[['🤖','AI-Generated Quizzes & Lessons','Unique content every time, tailored to your level'],['📶','100% Offline Support','Study without internet. Data syncs when you reconnect.'],['📊','Adaptive Learning Path','The system learns your weaknesses and focuses on them.'],['🌐','Hindi + English','Full bilingual support for all Indian boards.']].map(([icon,title,desc])=>(
                <div key={title} style={{display:'flex',gap:14,padding:'12px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'var(--radius-sm)'}}>
                  <div style={{fontSize:22,width:28,flexShrink:0}}>{icon}</div>
                  <div><div style={{fontWeight:700,fontSize:13,color:'#fff',marginBottom:2}}>{title}</div><div style={{fontSize:12,color:'rgba(255,255,255,0.45)'}}>{desc}</div></div>
                </div>
              ))}
            </div>
          </>)}

          {step===2&&(<>
            <div className="onboard-card-title">{lang==='hi'?'आपके बारे में बताएं':'Tell us about you'}</div>
            <div className="onboard-card-sub">{lang==='hi'?'हम सब कुछ आपके लिए बनाएंगे।':"We'll personalise everything for you."}</div>
            <div className="onboard-field"><label className="onboard-label">{lang==='hi'?'पूरा नाम':'Full Name'}</label><input className="onboard-input" placeholder={lang==='hi'?'जैसे: प्रिया शर्मा':'e.g. Priya Sharma'} value={form.name} onChange={e=>up('name',e.target.value)} /></div>
            <div className="onboard-field"><label className="onboard-label">{lang==='hi'?'उम्र':'Age'}</label><input className="onboard-input" type="number" placeholder="e.g. 14" value={form.age} onChange={e=>up('age',e.target.value)} /></div>
            <div className="onboard-field"><label className="onboard-label">{lang==='hi'?'रोज़ पढ़ने का समय':'Daily study time'}</label>
              <div className="onboard-grid-3">{['15 min','30 min','45 min','1 hour','1.5 hours','2 hours'].map(t=>(<div key={t} className={`onboard-chip ${form.study_time===t?'selected':''}`} onClick={()=>up('study_time',t)}>{t}</div>))}</div>
            </div>
          </>)}

          {step===3&&(<>
            <div className="onboard-card-title">{lang==='hi'?'आपकी कक्षा':'Your Class'}</div>
            <div className="onboard-card-sub">{lang==='hi'?'बोर्ड और कक्षा चुनें।':'Select your board and grade.'}</div>
            <div className="onboard-field"><label className="onboard-label">Board</label>
              {boards.map(b=>(<div key={b} className={`onboard-list-item ${form.board===b?'selected':''}`} onClick={()=>up('board',b)}><div className={`onboard-list-item-check`}>{form.board===b?'✓':''}</div><div className="onboard-item-body"><div className="onboard-item-label">{b}</div></div></div>))}
            </div>
            <div className="onboard-field"><label className="onboard-label">{lang==='hi'?'कक्षा':'Grade / Standard'}</label>
              <div className="onboard-grid">{grades.map(g=>(<div key={g} className={`onboard-chip ${form.grade===g?'selected':''}`} onClick={()=>up('grade',g)}>{lang==='hi'?`कक्षा ${g}`:`Grade ${g}`}</div>))}</div>
            </div>
          </>)}

          {step===4&&(<>
            <div className="onboard-card-title">{lang==='hi'?'विषय चुनें':'Choose Subjects'}</div>
            <div className="onboard-card-sub">{lang==='hi'?'जो विषय पढ़ने हैं वो चुनें (एक से ज़्यादा)':'Pick the subjects you want to study (select multiple)'}</div>
            <div className="onboard-grid">
              {subjects.map(s=>(<div key={s.id} className={`onboard-chip ${form.goals.includes(s.id)?'selected':''}`} onClick={()=>toggleGoal(s.id)} style={{padding:'14px'}}>{s.emoji}<br/><span style={{fontSize:12,marginTop:4,display:'block'}}>{s.label}</span></div>))}
            </div>
            <div className="onboard-info-box" style={{marginTop:16}}>📱 {lang==='hi'?'सभी नोट्स और क्विज़ ऑफलाइन काम करते हैं।':'All notes and quizzes work 100% offline. Progress syncs when you reconnect.'}</div>
          </>)}

          {step===5&&(<>
            <div className="onboard-card-title">{lang==='hi'?'अपना स्तर बताएं':'Your Current Level'}</div>
            <div className="onboard-card-sub">{lang==='hi'?'हम इसी के अनुसार पढ़ाएंगे।':"We'll adapt the difficulty to your level."}</div>
            {levels.map(lv=>(<div key={lv.id} className={`onboard-list-item ${form.level===lv.id?'selected':''}`} onClick={()=>up('level',lv.id)}><div className="onboard-list-item-check">{form.level===lv.id?'✓':''}</div><div className="onboard-item-body"><div className="onboard-item-label">{lv.label}</div><div className="onboard-item-desc">{lv.desc}</div></div></div>))}
          </>)}

          <div className="onboard-footer">
            <button className="btn btn-primary btn-lg" disabled={!valid[step-1]} onClick={step<totalSteps?()=>setStep(s=>s+1):handleFinish} style={{flex:1}}>
              {step<totalSteps?(lang==='hi'?'आगे →':'Continue →'):(lang==='hi'?'🚀 शुरू करें':'🚀 Start Learning')}
            </button>
            {step>1&&<span className="onboard-back-link" onClick={()=>setStep(s=>s-1)}>← {lang==='hi'?'वापस':'Back'}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
