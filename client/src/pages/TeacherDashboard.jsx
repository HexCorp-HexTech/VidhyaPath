import { useEffect, useMemo, useState } from "react";
import {
  addStudentModule,
  getStudentMonthlyReport,
  getStudentQuizHistory,
  getStudentSyllabus,
  getTeacherStudents,
  removeStudentModule,
} from "../utils/api";

function RingSmall({ value = 0, size = 48, color = "var(--saffron)" }) {
  const sw = 5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round" />
      </svg>
      <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
        <span style={{ fontFamily:"var(--font-display)",fontWeight:900,fontSize:12 }}>{Math.round(value)}%</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    strong:  { label:"Strong",  color:"#059669", bg:"rgba(5,150,105,0.12)" },
    complete:{ label:"Done",    color:"#2563eb", bg:"rgba(37,99,235,0.12)" },
    weak:    { label:"Weak",    color:"#dc2626", bg:"rgba(220,38,38,0.12)" },
    pending: { label:"Pending", color:"#6b7280", bg:"rgba(107,114,128,0.12)" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ padding:"2px 8px",borderRadius:999,fontSize:11,fontWeight:700,color:s.color,background:s.bg,letterSpacing:0.4 }}>
      {s.label}
    </span>
  );
}

// ── SYLLABUS TAB ───────────────────────────────────────────────────────────────
function SyllabusTab({ selectedStudentId, selectedStudent }) {
  const [syllabusRows, setSyllabusRows] = useState([]);
  const [subject, setSubject] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [chapterInput, setChapterInput] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedStudentId) return;
      try {
        const data = await getStudentSyllabus(selectedStudentId);
        if (cancelled) return;
        setSyllabusRows(data.syllabus || []);
        setSubject(cur => cur || data.syllabus?.[0]?.subject || "");
      } catch(e) { if (!cancelled) setStatus(e.message); }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedStudentId]);

  async function refreshSyllabus() {
    if (!selectedStudentId) return;
    const data = await getStudentSyllabus(selectedStudentId);
    setSyllabusRows(data.syllabus || []);
  }

  async function handleAssign() {
    const resolvedSubject = subjectInput.trim() || subject;
    if (!selectedStudentId || !resolvedSubject) { setStatus("Please enter or select a subject."); return; }
    if (!chapterInput.trim() && !topicInput.trim()) { setStatus("Add at least one chapter or topic."); return; }
    setSaving(true); setStatus("");
    try {
      await addStudentModule({ studentId: selectedStudentId, subject: resolvedSubject, chapters: chapterInput, topics: topicInput });
      setChapterInput(""); setTopicInput(""); setSubjectInput("");
      await refreshSyllabus();
      setSubject(resolvedSubject);
      setStatus("✓ Syllabus updated successfully.");
    } catch(e) { setStatus("Error: " + e.message); } finally { setSaving(false); }
  }

  async function handleRemove(type, value) {
    if (!selectedStudentId || !subject) return;
    setSaving(true); setStatus("");
    try {
      await removeStudentModule({ studentId: selectedStudentId, subject, chapters: type==="chapter"?[value]:[], topics: type==="topic"?[value]:[] });
      await refreshSyllabus();
      setStatus("✓ Module removed.");
    } catch(e) { setStatus("Error: " + e.message); } finally { setSaving(false); }
  }

  const activeRow = syllabusRows.find(r => r.subject === subject) || null;

  if (!selectedStudent) return <div className="pipeline-summary-hint" style={{ marginTop:24 }}>Select a student to manage their syllabus.</div>;

  return (
    <div style={{ display:"grid",gap:16,marginTop:16 }}>
      {status ? (
        <div className="card" style={{ borderColor:status.startsWith("✓")?"rgba(5,150,105,0.3)":"rgba(220,38,38,0.3)", color:status.startsWith("✓")?"#059669":"#dc2626", padding:"12px 16px" }}>{status}</div>
      ) : null}

      <div className="card">
        <div className="pipeline-summary-label">Subject</div>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginTop:12 }}>
          {syllabusRows.map(row => (
            <button key={row.subject} className={`quiz-option-pill ${subject===row.subject&&!subjectInput?"selected":""}`}
              onClick={() => { setSubject(row.subject); setSubjectInput(""); }} type="button" style={{ width:"auto" }}>
              {row.subject}
            </button>
          ))}
        </div>
        <div style={{ marginTop:14 }}>
          <input className="form-input" placeholder="Or type a new subject (e.g. Physics, History, Geography)"
            value={subjectInput} onChange={e => { setSubjectInput(e.target.value); if (e.target.value) setSubject(""); }} />
        </div>
      </div>

      <div className="card">
        <div className="pipeline-summary-label">Add chapters &amp; topics</div>
        <div className="pipeline-summary-hint">Assigning to: <strong>{subjectInput.trim() || subject || "—"}</strong></div>
        <div style={{ display:"grid",gap:12,marginTop:16 }}>
          <input className="form-input" placeholder="Chapter names, comma-separated (e.g. Algebra, Fractions)"
            value={chapterInput} onChange={e => setChapterInput(e.target.value)} />
          <input className="form-input" placeholder="Topic names, comma-separated (e.g. Linear Equations, HCF)"
            value={topicInput} onChange={e => setTopicInput(e.target.value)} />
          <button className="btn btn-primary" disabled={saving||(!subjectInput.trim()&&!subject)} onClick={handleAssign} type="button">
            {saving ? "Saving…" : "Assign to student"}
          </button>
        </div>
      </div>

      {activeRow ? (
        <div className="card">
          <div className="pipeline-summary-label">Current syllabus — {activeRow.subject}</div>
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:10 }}>CHAPTERS ({activeRow.chapters?.length||0})</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {(activeRow.chapters||[]).length===0
                ? <span className="pipeline-summary-hint">No chapters yet.</span>
                : (activeRow.chapters||[]).map(ch => (
                  <button key={ch} className="tag tag-saffron" onClick={() => handleRemove("chapter",ch)} type="button" title="Click to remove">{ch} ×</button>
                ))}
            </div>
          </div>
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:10 }}>TOPICS ({activeRow.topics?.length||0})</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {(activeRow.topics||[]).length===0
                ? <span className="pipeline-summary-hint">No topics yet.</span>
                : (activeRow.topics||[]).map(tp => (
                  <button key={tp} className="tag tag-teal" onClick={() => handleRemove("topic",tp)} type="button" title="Click to remove">{tp} ×</button>
                ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── QUIZ HISTORY TAB ───────────────────────────────────────────────────────────
function QuizHistoryTab({ selectedStudentId, selectedStudent }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedStudentId) return;
    let cancelled = false;
    setLoading(true); setError(""); setData(null);
    getStudentQuizHistory(selectedStudentId)
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedStudentId]);

  if (!selectedStudent) return <div className="pipeline-summary-hint" style={{ marginTop:24 }}>Select a student to view their quiz history.</div>;
  if (loading) return <div className="loading-screen" style={{ minHeight:200 }}><div className="loading-spinner" /><p>Loading quiz history…</p></div>;
  if (error) return <div className="card" style={{ color:"#dc2626",marginTop:20 }}>{error}</div>;

  const attempts = data?.attempts || [];

  return (
    <div style={{ marginTop:16,display:"grid",gap:12 }}>
      <div className="card">
        <div className="pipeline-summary-label">Quiz attempts — {selectedStudent.name}</div>
        <div className="pipeline-summary-hint">{attempts.length} attempt{attempts.length!==1?"s":""} recorded</div>
      </div>
      {attempts.length===0 ? (
        <div className="card"><div className="pipeline-summary-hint">No quiz attempts yet for this student.</div></div>
      ) : attempts.map((a,i) => {
        const pct = a.percentage ?? Math.round(((a.score??0)/(a.total||5))*100);
        const dateStr = a.attempted_at
          ? new Date(a.attempted_at).toLocaleString("en-IN",{ day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit" })
          : "—";
        return (
          <div key={a.id??i} className="card" style={{ display:"grid",gap:10 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8 }}>
              <div>
                <div style={{ fontWeight:700,fontSize:15 }}>{a.topic}</div>
                <div style={{ fontSize:12,color:"var(--muted)",marginTop:2 }}>{dateStr}</div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ fontFamily:"var(--font-display)",fontWeight:900,fontSize:18 }}>{a.score??"—"} / {a.total??5}</span>
                <RingSmall value={pct} color={pct>=80?"#059669":pct>=50?"var(--saffron)":"#dc2626"} size={44} />
                <StatusBadge status={a.status} />
              </div>
            </div>
            {a.weak_concepts?.length>0 ? (
              <div>
                <div style={{ fontSize:12,fontWeight:600,color:"var(--muted)",marginBottom:6 }}>CONCEPTS MISSED</div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  {a.weak_concepts.slice(0,4).map((c,ci) => (
                    <span key={ci} className="tag tag-red" style={{ fontSize:11 }}>{c.length>50?c.substring(0,50)+"…":c}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ── MONTHLY REPORT TAB ─────────────────────────────────────────────────────────
function MonthlyReportTab({ selectedStudentId, selectedStudent }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedStudentId) return;
    let cancelled = false;
    setLoading(true); setError(""); setReport(null);
    getStudentMonthlyReport(selectedStudentId)
      .then(d => { if (!cancelled) setReport(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedStudentId]);

  if (!selectedStudent) return <div className="pipeline-summary-hint" style={{ marginTop:24 }}>Select a student to view their monthly report.</div>;
  if (loading) return <div className="loading-screen" style={{ minHeight:200 }}><div className="loading-spinner" /><p>Generating report…</p></div>;
  if (error) return <div className="card" style={{ color:"#dc2626",marginTop:20 }}>{error}</div>;
  if (!report) return null;

  const { summary, months, weak_areas } = report;

  return (
    <div style={{ marginTop:16,display:"grid",gap:16 }}>
      <div className="card">
        <div className="pipeline-summary-label">Overall performance — {selectedStudent.name}</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(110px,1fr))",gap:12,marginTop:16 }}>
          {[
            { label:"Topics Covered", val:summary.completed_topics, color:"var(--saffron)" },
            { label:"Total Topics",   val:summary.total_topics,     color:"var(--muted)" },
            { label:"Strong Topics",  val:summary.strong_topics,    color:"#059669" },
            { label:"Weak Topics",    val:summary.weak_topics,      color:"#dc2626" },
            { label:"Avg Score",      val:`${summary.avg_score_pct}%`, color:"var(--saffron)" },
          ].map(item => (
            <div key={item.label} className="teacher-stat-box" style={{ textAlign:"center" }}>
              <div className="teacher-stat-val" style={{ color:item.color }}>{item.val}</div>
              <div className="teacher-stat-lbl">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="pipeline-summary-label">Month-by-month breakdown</div>
        {months.length===0 ? (
          <div className="pipeline-summary-hint" style={{ marginTop:12 }}>No monthly data available yet — quiz submissions will appear here.</div>
        ) : (
          <div style={{ display:"grid",gap:12,marginTop:16 }}>
            {months.map(m => (
              <div key={m.key} style={{ border:"1px solid var(--border)",borderRadius:12,padding:"14px 16px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8 }}>
                  <div>
                    <div style={{ fontWeight:700,fontSize:15 }}>{m.month}</div>
                    <div style={{ fontSize:12,color:"var(--muted)",marginTop:3 }}>
                      {m.attempts} quiz attempt{m.attempts!==1?"s":""} · {m.topics_covered} topic{m.topics_covered!==1?"s":""}
                    </div>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                    <RingSmall value={m.avg_score_pct} color={m.avg_score_pct>=75?"#059669":m.avg_score_pct>=50?"var(--saffron)":"#dc2626"} size={48} />
                    <div style={{ fontSize:12,display:"grid",gap:3 }}>
                      <span style={{ color:"#059669",fontWeight:600 }}>✓ {m.strong_topics} strong</span>
                      <span style={{ color:"#dc2626",fontWeight:600 }}>✗ {m.weak_topics} weak</span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop:12,height:6,background:"var(--border)",borderRadius:999,overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${m.avg_score_pct}%`,borderRadius:999,
                    background:m.avg_score_pct>=75?"#059669":m.avg_score_pct>=50?"var(--saffron)":"#dc2626",
                    transition:"width 0.4s ease" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {weak_areas?.length>0 ? (
        <div className="card">
          <div className="pipeline-summary-label">Areas needing attention</div>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginTop:14 }}>
            {weak_areas.map((area,i) => (
              <span key={i} className="tag tag-red" style={{ fontSize:12 }}>{area.length>60?area.substring(0,60)+"…":area}</span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function TeacherDashboard({ teacherData }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [activeTab, setActiveTab] = useState("syllabus");
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTeacherStudents(teacherData?.class_code)
      .then(data => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data.students || [];
        setStudents(list);
        if (!selectedStudentId && list[0]?.id) setSelectedStudentId(list[0].id);
      })
      .catch(e => { if (!cancelled) setFetchError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherData?.class_code]);

  const filteredStudents = useMemo(
    () => students.filter(s =>
      s.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
      s.board?.toLowerCase().includes(searchQ.toLowerCase())
    ),
    [searchQ, students]
  );

  const selectedStudent = students.find(s => s.id === selectedStudentId) || null;

  const tabs = [
    { id:"syllabus",        label:"📚 Syllabus" },
    { id:"quiz-history",    label:"📝 Quiz Attempts" },
    { id:"monthly-report",  label:"📊 Monthly Report" },
  ];

  return (
    <div>
      <div className="teacher-hero">
        <div>
          <div className="teacher-hero-name">{teacherData?.name || "Teacher"}</div>
          <div className="teacher-hero-sub">
            {teacherData?.school || "VidyaPath Educator"} • Class code{" "}
            <strong style={{ color:"var(--saffron)",letterSpacing:2 }}>{teacherData?.class_code}</strong>
          </div>
          <div className="teacher-stats">
            <div className="teacher-stat-box">
              <div className="teacher-stat-val">{students.length}</div>
              <div className="teacher-stat-lbl">Students</div>
            </div>
            <div className="teacher-stat-box">
              <div className="teacher-stat-val">{students.filter(s=>s.is_inactive).length}</div>
              <div className="teacher-stat-lbl">Need follow-up</div>
            </div>
            <div className="teacher-stat-box">
              <div className="teacher-stat-val">
                {Math.round(students.reduce((sum,s)=>sum+(s.progress_percent||0),0)/(students.length||1))}%
              </div>
              <div className="teacher-stat-lbl">Avg progress</div>
            </div>
          </div>
        </div>
        <div className="teacher-code-box">
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:6 }}>Share with students</div>
          <div className="teacher-code">{teacherData?.class_code}</div>
          <div className="teacher-code-label">Students use this during signup.</div>
        </div>
      </div>

      {fetchError ? <div className="card" style={{ marginBottom:20,color:"#dc2626" }}>{fetchError}</div> : null}

      <div className="teacher-layout">
        {/* Student list */}
        <div className="card">
          <div className="pipeline-summary-label">Students</div>
          <input className="form-input" placeholder="Search students" value={searchQ}
            onChange={e => setSearchQ(e.target.value)} style={{ marginTop:14 }} />
          <div style={{ display:"grid",gap:12,marginTop:16 }}>
            {loading ? (
              <div className="loading-screen" style={{ minHeight:180 }}><div className="loading-spinner" /></div>
            ) : filteredStudents.length===0 ? (
              <div className="pipeline-summary-hint">No students found.</div>
            ) : filteredStudents.map(s => (
              <button key={s.id} className="student-card" type="button"
                onClick={() => setSelectedStudentId(s.id)}
                style={{ cursor:"pointer",textAlign:"left",
                  borderColor:s.id===selectedStudentId?"rgba(240,94,35,0.4)":"var(--border)",
                  background:s.id===selectedStudentId?"rgba(240,94,35,0.04)":undefined }}>
                <div className="student-avatar">
                  {(s.name||"?").split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div className="student-body">
                  <div className="student-name">{s.name}</div>
                  <div className="student-meta">
                    <span>{s.board}</span>
                    <span>Class {s.grade}</span>
                    <span>{s.progress_percent||0}% done</span>
                    {s.is_inactive ? <span style={{ color:"#dc2626" }}>⚠ Inactive</span> : null}
                  </div>
                </div>
                <RingSmall value={s.progress_percent||0} />
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div>
          {selectedStudent ? (
            <div className="card" style={{ marginBottom:12 }}>
              <div style={{ display:"flex",alignItems:"center",gap:16,flexWrap:"wrap" }}>
                <div className="student-avatar" style={{ width:48,height:48,fontSize:18,borderRadius:12 }}>
                  {(selectedStudent.name||"?").split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:800,fontSize:18 }}>{selectedStudent.name}</div>
                  <div style={{ fontSize:13,color:"var(--muted)",marginTop:2 }}>
                    {selectedStudent.board} · Class {selectedStudent.grade} · {selectedStudent.level}
                  </div>
                </div>
                <div style={{ marginLeft:"auto",display:"flex",gap:8,flexWrap:"wrap" }}>
                  <StatusBadge status={selectedStudent.is_inactive?"pending":"complete"} />
                  <span style={{ fontSize:13,color:"var(--muted)",alignSelf:"center" }}>
                    🔥 {selectedStudent.streak_count||0} streak
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:4 }}>
            {tabs.map(tab => (
              <button key={tab.id}
                className={`quiz-option-pill ${activeTab===tab.id?"selected":""}`}
                onClick={() => setActiveTab(tab.id)} type="button"
                style={{ width:"auto",fontSize:13,padding:"8px 16px" }}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab==="syllabus"       && <SyllabusTab      selectedStudentId={selectedStudentId} selectedStudent={selectedStudent} />}
          {activeTab==="quiz-history"   && <QuizHistoryTab   selectedStudentId={selectedStudentId} selectedStudent={selectedStudent} />}
          {activeTab==="monthly-report" && <MonthlyReportTab selectedStudentId={selectedStudentId} selectedStudent={selectedStudent} />}
        </div>
      </div>
    </div>
  );
}
