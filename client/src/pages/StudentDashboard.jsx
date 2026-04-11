import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chatbot from "./Chatbot";
import { getStudent, getStudentSyllabus } from "../utils/api";
import { useAppStore } from "../store/useAppStore";

function DashboardCard({ title, copy, action, onClick, accent = "var(--saffron)" }) {
  return (
    <div className="card" style={{ borderTop: `4px solid ${accent}` }}>
      <div className="pipeline-summary-value" style={{ fontSize: 24 }}>
        {title}
      </div>
      <p className="pipeline-summary-hint" style={{ marginTop: 10 }}>
        {copy}
      </p>
      <button className="btn btn-primary" onClick={onClick} type="button" style={{ marginTop: 18 }}>
        {action}
      </button>
    </div>
  );
}

export default function StudentDashboard({ student }) {
  const navigate = useNavigate();
  const currentChapter = useAppStore((state) => state.currentChapter);
  const setStandard = useAppStore((state) => state.setStandard);
  const setSubject = useAppStore((state) => state.setSubject);
  const setSyllabus = useAppStore((state) => state.setSyllabus);
  const setSyllabusSubjects = useAppStore((state) => state.setSyllabusSubjects);
  const resetFlow = useAppStore((state) => state.resetFlow);

  const [studentProfile, setStudentProfile] = useState(student || null);
  const [syllabusRows, setSyllabusRows] = useState([]);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      if (!student?.id) return;

      const [profile, syllabusData] = await Promise.all([
        getStudent(student.id),
        getStudentSyllabus(student.id),
      ]);

      if (cancelled) return;
      setStudentProfile(profile || student);
      setSyllabusRows(syllabusData.syllabus || []);
      if (profile?.grade) {
        setStandard(String(profile.grade));
      }
      setSyllabusSubjects(syllabusData.syllabus || []);
    }

    loadDashboard().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setStandard, setSyllabusSubjects, student]);

  const firstSubject = syllabusRows[0];
  const firstChapter = firstSubject?.chapters?.[0] || null;
  const totalChapters = useMemo(
    () => syllabusRows.reduce((sum, row) => sum + (row.chapters?.length || 0), 0),
    [syllabusRows]
  );

  function openLearning(stage = "lesson") {
    const targetSubject = firstSubject?.subject || "";
    const targetChapter = currentChapter || firstChapter;
    if (targetSubject) {
      setSubject(targetSubject);
      setSyllabus((firstSubject?.chapters || []).map((chapter) => ({ chapter })));
    }
    resetFlow();
    navigate("/learning", {
      state: {
        subject: targetSubject,
        chapter: targetChapter,
        stage,
      },
    });
  }

  return (
    <section className="pipeline-page">
      <div className="pipeline-hero">
        <div className="pipeline-hero-copy">
          <span className="tag tag-saffron">Student Dashboard</span>
          <h1 className="pipeline-title">
            Welcome back, {studentProfile?.name?.split(" ")[0] || "Student"}
          </h1>
          <p className="pipeline-subtitle">
            Access your syllabus, continue learning, take a test, or ask the AI tutor for help.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <span className="tag tag-teal">{studentProfile?.board || "CBSE"}</span>
            <span className="tag tag-gold">Class {studentProfile?.grade || "-"}</span>
            <span className="tag tag-green">{totalChapters} chapters available</span>
          </div>
        </div>
        <div className="pipeline-summary-card">
          <div className="pipeline-summary-label">Continue learning</div>
          <div className="pipeline-summary-value">{currentChapter || firstChapter || "No chapter selected"}</div>
          <div className="pipeline-summary-hint">
            Pick up where you left off or jump straight into the next test.
          </div>
        </div>
      </div>

      <div className="pipeline-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <DashboardCard
          title="Syllabus"
          copy="Browse your assigned subjects and chapters."
          action="Open syllabus"
          onClick={() => navigate("/learning")}
          accent="var(--teal)"
        />
        <DashboardCard
          title="Continue Learning"
          copy="Resume the current lesson and notes flow."
          action="Continue"
          onClick={() => openLearning("lesson")}
          accent="var(--saffron)"
        />
        <DashboardCard
          title="Quiz / Test"
          copy="Jump directly into the chapter test and submit your score."
          action="Take test"
          onClick={() => openLearning("quiz")}
          accent="var(--gold)"
        />
        <DashboardCard
          title="AI Tutor"
          copy="Open the chatbot and ask for help with any chapter."
          action="Open chatbot"
          onClick={() => setShowChatbot(true)}
          accent="var(--green)"
        />
      </div>

      <div className="card">
        <div className="pipeline-summary-label">Assigned syllabus</div>
        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {syllabusRows.map((row) => (
            <div key={row.subject} className="chapter-accordion" style={{ marginBottom: 0 }}>
              <div className="chapter-acc-header" style={{ cursor: "default" }}>
                <div className="chapter-num">{(row.chapters || []).length}</div>
                <div className="chapter-name">{row.subject}</div>
              </div>
              <div className="chapter-body" style={{ display: "block" }}>
                <div className="chapter-tags">
                  {(row.chapters || []).map((chapter) => (
                    <span key={chapter} className="tag tag-saffron">
                      {chapter}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showChatbot ? (
        <Chatbot
          lang={studentProfile?.language || "en"}
          studentId={studentProfile?.id}
          onClose={() => setShowChatbot(false)}
        />
      ) : null}
    </section>
  );
}
