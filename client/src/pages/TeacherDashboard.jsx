import { useEffect, useMemo, useState } from "react";
import {
  addStudentModule,
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 12 }}>
          {Math.round(value)}%
        </span>
      </div>
    </div>
  );
}

export default function TeacherDashboard({ teacherData }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [syllabusRows, setSyllabusRows] = useState([]);
  const [subject, setSubject] = useState("");
  const [chapterInput, setChapterInput] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      setLoading(true);
      try {
        const data = await getTeacherStudents(teacherData?.class_code);
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data.students || [];
        setStudents(list);
        if (!selectedStudentId && list[0]?.id) {
          setSelectedStudentId(list[0].id);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStudents();
    return () => {
      cancelled = true;
    };
  }, [selectedStudentId, teacherData?.class_code]);

  useEffect(() => {
    let cancelled = false;

    async function loadSyllabus() {
      if (!selectedStudentId) return;
      try {
        const data = await getStudentSyllabus(selectedStudentId);
        if (cancelled) return;
        setSyllabusRows(data.syllabus || []);
        setSubject((current) => current || data.syllabus?.[0]?.subject || "");
      } catch (error) {
        if (!cancelled) {
          setStatus(error.message);
        }
      }
    }

    loadSyllabus();
    return () => {
      cancelled = true;
    };
  }, [selectedStudentId]);

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          student.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
          student.board?.toLowerCase().includes(searchQ.toLowerCase())
      ),
    [searchQ, students]
  );

  const selectedStudent = students.find((student) => student.id === selectedStudentId) || null;
  const activeRow = syllabusRows.find((row) => row.subject === subject) || null;

  async function refreshSyllabus() {
    if (!selectedStudentId) return;
    const data = await getStudentSyllabus(selectedStudentId);
    setSyllabusRows(data.syllabus || []);
  }

  async function handleAssign() {
    if (!selectedStudentId || !subject) return;
    setSaving(true);
    setStatus("");
    try {
      await addStudentModule({
        studentId: selectedStudentId,
        subject,
        chapters: chapterInput,
        topics: topicInput,
      });
      setChapterInput("");
      setTopicInput("");
      await refreshSyllabus();
      setStatus("Syllabus updated.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(type, value) {
    if (!selectedStudentId || !subject) return;
    setSaving(true);
    setStatus("");
    try {
      await removeStudentModule({
        studentId: selectedStudentId,
        subject,
        chapters: type === "chapter" ? [value] : [],
        topics: type === "topic" ? [value] : [],
      });
      await refreshSyllabus();
      setStatus("Module removed.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="teacher-hero">
        <div>
          <div className="teacher-hero-name">{teacherData?.name || "Teacher"}</div>
          <div className="teacher-hero-sub">
            {teacherData?.school || "VidyaPath Educator"} • Class code{" "}
            <strong style={{ color: "var(--saffron)", letterSpacing: 2 }}>{teacherData?.class_code}</strong>
          </div>
          <div className="teacher-stats">
            <div className="teacher-stat-box">
              <div className="teacher-stat-val">{students.length}</div>
              <div className="teacher-stat-lbl">Students</div>
            </div>
            <div className="teacher-stat-box">
              <div className="teacher-stat-val">{students.filter((student) => student.is_inactive).length}</div>
              <div className="teacher-stat-lbl">Need follow-up</div>
            </div>
            <div className="teacher-stat-box">
              <div className="teacher-stat-val">
                {Math.round(
                  students.reduce((sum, student) => sum + (student.progress_percent || 0), 0) /
                    (students.length || 1)
                )}
                %
              </div>
              <div className="teacher-stat-lbl">Avg progress</div>
            </div>
          </div>
        </div>
        <div className="teacher-code-box">
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Share with students</div>
          <div className="teacher-code">{teacherData?.class_code}</div>
          <div className="teacher-code-label">Students use this during signup.</div>
        </div>
      </div>

      {status ? <div className="card" style={{ marginBottom: 20 }}>{status}</div> : null}

      <div className="results-layout">
        <div className="card">
          <div className="pipeline-summary-label">Students</div>
          <input
            className="form-input"
            placeholder="Search students"
            value={searchQ}
            onChange={(event) => setSearchQ(event.target.value)}
            style={{ marginTop: 14 }}
          />
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {loading ? (
              <div className="loading-screen" style={{ minHeight: 180 }}>
                <div className="loading-spinner" />
              </div>
            ) : (
              filteredStudents.map((student) => (
                <button
                  key={student.id}
                  className="student-card"
                  type="button"
                  onClick={() => setSelectedStudentId(student.id)}
                  style={{
                    cursor: "pointer",
                    textAlign: "left",
                    borderColor:
                      student.id === selectedStudentId ? "rgba(240,94,35,0.3)" : "var(--border)",
                  }}
                >
                  <div className="student-avatar">
                    {(student.name || "?")
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="student-body">
                    <div className="student-name">{student.name}</div>
                    <div className="student-meta">
                      <span>{student.board}</span>
                      <span>Class {student.grade}</span>
                      <span>{student.progress_percent || 0}% done</span>
                    </div>
                  </div>
                  <RingSmall value={student.progress_percent || 0} />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="pipeline-summary-label">Personalized syllabus</div>
          <div className="pipeline-summary-value" style={{ marginTop: 8 }}>
            {selectedStudent?.name || "Choose a student"}
          </div>
          <div className="pipeline-summary-hint">
            Add or remove chapters and topics. The student learning page reads from this syllabus directly.
          </div>

          {selectedStudent ? (
            <>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                {syllabusRows.map((row) => (
                  <button
                    key={row.subject}
                    className={`quiz-option-pill ${subject === row.subject ? "selected" : ""}`}
                    onClick={() => setSubject(row.subject)}
                    type="button"
                    style={{ width: "auto" }}
                  >
                    {row.subject}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                <input
                  className="form-input"
                  placeholder="Add chapter names, comma separated"
                  value={chapterInput}
                  onChange={(event) => setChapterInput(event.target.value)}
                />
                <input
                  className="form-input"
                  placeholder="Add topic names, comma separated"
                  value={topicInput}
                  onChange={(event) => setTopicInput(event.target.value)}
                />
                <button className="btn btn-primary" disabled={saving || !subject} onClick={handleAssign} type="button">
                  {saving ? "Saving..." : "Assign to student"}
                </button>
              </div>

              <div style={{ marginTop: 24 }}>
                <div className="pipeline-summary-label">Current chapters</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {(activeRow?.chapters || []).map((chapter) => (
                    <button
                      key={chapter}
                      className="tag tag-saffron"
                      onClick={() => handleRemove("chapter", chapter)}
                      type="button"
                    >
                      {chapter} ×
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div className="pipeline-summary-label">Current topics</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {(activeRow?.topics || []).map((topic) => (
                    <button
                      key={topic}
                      className="tag tag-teal"
                      onClick={() => handleRemove("topic", topic)}
                      type="button"
                    >
                      {topic} ×
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
