import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotesContent } from "../utils/api";
import { useAppStore } from "../store/useAppStore";

export default function Notes() {
  const navigate = useNavigate();
  const standard = useAppStore((state) => state.standard);
  const subject = useAppStore((state) => state.subject);
  const currentChapter = useAppStore((state) => state.currentChapter);
  const lesson = useAppStore((state) => state.lesson);
  const notes = useAppStore((state) => state.notes);
  const setNotes = useAppStore((state) => state.setNotes);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState("");
  const [aiMeta, setAiMeta] = useState({ source: null, ai_powered: false, reason: null });

  useEffect(() => {
    let isMounted = true;

    async function loadNotes() {
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
        navigate("/lesson", { replace: true });
        return;
      }

      if (!notes) {
        setIsPreparing(true);
        setError("");
        const data = await getNotesContent(standard, subject, currentChapter);
        if (!isMounted) return;

        if (data?.notes) {
          setNotes(data.notes);
          setAiMeta({
            source: data.source || null,
            ai_powered: data.ai_powered || false,
            reason: data.reason || null,
          });
        } else {
          setError("Notes could not be loaded right now.");
        }

        setIsPreparing(false);
      }
    }

    loadNotes();
    return () => {
      isMounted = false;
    };
  }, [currentChapter, lesson, navigate, notes, setNotes, standard, subject]);

  if (!standard || !subject || !currentChapter || !lesson) {
    return null;
  }

  if (isPreparing) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <h3>Preparing notes...</h3>
        <p>Collecting the key points for {currentChapter}.</p>
      </div>
    );
  }

  if (error && !notes) {
    return (
      <section className="pipeline-page">
        <div className="pipeline-content-card">
          <span className="tag tag-red">Content Error</span>
          <h1 className="pipeline-title">Notes unavailable</h1>
          <p className="pipeline-copy">{error}</p>
          <div className="pipeline-actions">
            <button className="btn btn-ghost btn-lg" onClick={() => navigate("/lesson")}>
              Back to Lesson
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
        <span className="tag tag-teal">Notes</span>
        <h1 className="pipeline-title">{currentChapter}</h1>
        <p className="pipeline-subtitle">
          Class {standard} · {subject}
        </p>

        {/* AI source status banner */}
        {aiMeta.source === "ai" && (
          <div className="ai-status-banner ai-success">
            <span className="ai-status-icon">🤖</span>
            <span>AI-powered notes generated successfully</span>
          </div>
        )}
        {aiMeta.source === "fallback" && aiMeta.reason && (
          <div className="ai-status-banner ai-fallback">
            <span className="ai-status-icon">⚠️</span>
            <span>
              AI generation failed — using fallback notes.
              <span className="ai-reason"> Reason: {aiMeta.reason}</span>
            </span>
          </div>
        )}

        <ul className="pipeline-notes-list">
          {(notes || []).map((item, idx) => {
            // Check if this is the AI Generated marker
            const isAIMarker = item === "✨ AI Generated";
            return (
              <li key={idx} className={isAIMarker ? "ai-generated-marker" : ""}>
                {item}
              </li>
            );
          })}
        </ul>
        <div className="pipeline-actions">
          <button className="btn btn-ghost btn-lg" onClick={() => navigate("/lesson")}>
            Back to Lesson
          </button>
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/quiz")} disabled={!notes}>
            Next: Quiz
          </button>
        </div>
      </div>
    </section>
  );
}
