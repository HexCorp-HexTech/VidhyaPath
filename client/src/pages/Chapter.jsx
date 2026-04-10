import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

export default function Chapter() {
  const navigate = useNavigate();
  const standard = useAppStore((state) => state.standard);
  const subject = useAppStore((state) => state.subject);
  const syllabus = useAppStore((state) => state.syllabus);
  const currentChapter = useAppStore((state) => state.currentChapter);
  const setChapter = useAppStore((state) => state.setChapter);
  const resetFlow = useAppStore((state) => state.resetFlow);

  useEffect(() => {
    if (!standard) {
      navigate("/syllabus", { replace: true });
      return;
    }

    if (!subject || syllabus.length === 0) {
      navigate("/subject", { replace: true });
    }
  }, [navigate, standard, subject, syllabus.length]);

  if (!standard || !subject || syllabus.length === 0) {
    return null;
  }

  const handleClick = (chapter) => {
    resetFlow();
    setChapter(chapter);
    navigate("/lesson");
  };

  return (
    <section className="pipeline-page">
      <div className="pipeline-hero">
        <div className="pipeline-hero-copy">
          <span className="tag tag-gold">Step 3: Select Chapter</span>
          <h1 className="pipeline-title">Choose a chapter in {subject}.</h1>
          <p className="pipeline-subtitle">
            Standard: {standard}. Subject: {subject}. This chapter will drive the lesson, notes, quiz, and result.
          </p>
        </div>
        <div className="pipeline-summary-card">
          <div className="pipeline-summary-label">Current selection</div>
          <div className="pipeline-summary-value">
            {currentChapter || "No chapter selected yet"}
          </div>
          <div className="pipeline-summary-hint">
            Picking a new chapter resets the generated lesson flow.
          </div>
        </div>
      </div>

      <div className="pipeline-grid">
        {syllabus.map((item) => (
          <button
            key={item.chapter}
            className="chapter-select-card"
            onClick={() => handleClick(item.chapter)}
          >
            <div className="chapter-select-icon">CH</div>
            <div className="chapter-select-title">{item.chapter}</div>
            <div className="chapter-select-copy">
              Start the learning flow for this chapter.
            </div>
            <span className="chapter-select-cta">Open lesson →</span>
          </button>
        ))}
      </div>
    </section>
  );
}
