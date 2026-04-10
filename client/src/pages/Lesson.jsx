import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLessonContent } from "../utils/api";
import { useAppStore } from "../store/useAppStore";

export default function Lesson() {
  const navigate = useNavigate();
  const standard = useAppStore((state) => state.standard);
  const subject = useAppStore((state) => state.subject);
  const currentChapter = useAppStore((state) => state.currentChapter);
  const lesson = useAppStore((state) => state.lesson);
  const setLesson = useAppStore((state) => state.setLesson);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState("");
  const [aiMeta, setAiMeta] = useState({ source: null, ai_powered: false, reason: null });

  useEffect(() => {
    let isMounted = true;

    async function loadLesson() {
      if (!standard) {
        navigate("/syllabus", { replace: true });
        return;
      }

      if (!subject) {
        navigate("/subject", { replace: true });
        return;
      }

      if (!currentChapter) {
        navigate("/chapter", { replace: true });
        return;
      }

      if (!lesson) {
        setIsPreparing(true);
        setError("");
        const data = await getLessonContent(standard, subject, currentChapter);
        if (!isMounted) return;

        if (data?.lesson) {
          setLesson(data.lesson);
          setAiMeta({
            source: data.source || null,
            ai_powered: data.ai_powered || false,
            reason: data.reason || null,
          });
        } else {
          setError("Lesson content could not be loaded right now.");
        }

        setIsPreparing(false);
      }
    }

    loadLesson();
    return () => {
      isMounted = false;
    };
  }, [currentChapter, lesson, navigate, setLesson, standard, subject]);

  if (!standard || !subject || !currentChapter) {
    return null;
  }

  if (isPreparing) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <h3>Preparing lesson...</h3>
        <p>Loading the lesson for {currentChapter}.</p>
      </div>
    );
  }

  if (error && !lesson) {
    return (
      <section className="pipeline-page">
        <div className="pipeline-content-card">
          <span className="tag tag-red">Content Error</span>
          <h1 className="pipeline-title">Lesson unavailable</h1>
          <p className="pipeline-copy">{error}</p>
          <div className="pipeline-actions">
            <button className="btn btn-ghost btn-lg" onClick={() => navigate("/chapter")}>
              Back to Chapters
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => navigate(0)}>
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pipeline-page">
      <div className="pipeline-content-card">
        <span className="tag tag-saffron">Lesson</span>
        <h1 className="pipeline-title">{currentChapter}</h1>
        <p className="pipeline-subtitle">
          Class {standard} · {subject}
        </p>

        {/* AI source status banner */}
        {aiMeta.source === "ai" && (
          <div className="ai-status-banner ai-success">
            <span className="ai-status-icon">🤖</span>
            <span>AI-powered lesson generated successfully</span>
          </div>
        )}
        {aiMeta.source === "fallback" && aiMeta.reason && (
          <div className="ai-status-banner ai-fallback">
            <span className="ai-status-icon">⚠️</span>
            <span>
              AI generation failed — using fallback lesson.
              <span className="ai-reason"> Reason: {aiMeta.reason}</span>
            </span>
          </div>
        )}

        <p className="pipeline-copy" style={{ whiteSpace: "pre-line" }}>
          {lesson}
        </p>
        <div className="pipeline-actions">
          <button className="btn btn-ghost btn-lg" onClick={() => navigate("/chapter")}>
            Back to Chapters
          </button>
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/notes")} disabled={!lesson}>
            Next: Notes
          </button>
        </div>
      </div>
    </section>
  );
}
