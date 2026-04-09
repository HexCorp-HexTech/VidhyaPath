import { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../utils/api';

export default function Chatbot({ lang, studentId, onClose }) {
  const [messages, setMessages] = useState([
    { role:'assistant', content: lang==='hi'?'नमस्ते! 😊 मैं VidyaPath AI Tutor हूँ। कोई भी पढ़ाई का सवाल पूछें!':"Hi! 😊 I'm VidyaPath AI Tutor. Ask me anything about your studies!" }
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);

  const send = async (text) => {
    const msg=(text||input).trim();
    if(!msg||loading) return;
    setInput('');
    setMessages(prev=>[...prev,{role:'user',content:msg}]);
    setLoading(true);
    try {
      const res=await fetch(`${API_BASE}/chat/message`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({student_id:studentId,message:msg,history:messages.slice(-8)})});
      const data=await res.json();
      setMessages(prev=>[...prev,{role:'assistant',content:data.reply,ai:data.ai_powered}]);
    } catch {
      setMessages(prev=>[...prev,{role:'assistant',content:lang==='hi'?'❌ जवाब नहीं मिला। फिर कोशिश करें।':'❌ Could not get a response. Please try again.'}]);
    }
    setLoading(false);
  };

  const prompts = lang==='hi'
    ? ['मेरी कमज़ोरियाँ?','fraction समझाओ','क्विज़ कैसे लें?','पढ़ाई टिप्स']
    : ['My weak areas?','Explain fractions','How to take quiz?','Study tips'];

  return (
    <div className="chatbot-overlay" onClick={onClose}>
      <div className="chatbot-window" onClick={e=>e.stopPropagation()}>
        <div className="chatbot-header">
          <div className="chatbot-avatar-wrap">🤖</div>
          <div><div className="chatbot-header-name">VidyaPath AI Tutor</div><div className="chatbot-header-sub">{loading?'Thinking...':lang==='hi'?'हमेशा मदद के लिए तैयार':'Always here to help'}</div></div>
          <button className="chatbot-close" onClick={onClose}>✕</button>
        </div>

        <div className="chatbot-messages">
          {messages.map((m,i)=>(
            <div key={i} className={`chat-bubble-wrap ${m.role}`}>
              <div className="chat-bubble">{m.content}</div>
            </div>
          ))}
          {loading&&<div className="chat-bubble-wrap assistant"><div className="chat-typing"><div className="chat-dot"/><div className="chat-dot"/><div className="chat-dot"/></div></div>}
          <div ref={endRef}/>
        </div>

        <div className="quick-prompts">
          {prompts.map(p=><button key={p} className="quick-prompt-btn" onClick={()=>send(p)}>{p}</button>)}
        </div>

        <div className="chatbot-input-row">
          <textarea className="chatbot-input" rows={1} placeholder={lang==='hi'?'कोई भी सवाल पूछें...':'Ask anything about your studies...'} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} />
          <button className="chatbot-send" onClick={()=>send()} disabled={loading||!input.trim()}>→</button>
        </div>
      </div>
    </div>
  );
}
