import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

export default function Result() {
  const navigate = useNavigate();
  const standard = useAppStore((state) => state.standard);
  const subject = useAppStore((state) => state.subject);
  const score = useAppStore((state) => state.score);
  const quiz = useAppStore((state) => state.quiz);
  const currentChapter = useAppStore((state) => state.currentChapter);
  const resetFlow = useAppStore((state) => state.resetFlow);
  const setChapter = useAppStore((state) => state.setChapter);

  useEffect(() => {
    if (!quiz.length) {
      navigate("/syllabus", { replace: true });
    }
  }, [navigate, quiz.length]);

  if (!quiz.length) {
    return null;
  }

  const handleBackToChapter = () => {
    resetFlow();
    setChapter(null);
    navigate("/chapter");
  };

  const percentage = Math.round(((score || 0) / quiz.length) * 100);

  return (
    <section className="pipeline-page">
      <div className="result-panel">
        <span className="tag tag-green">Flow Complete</span>
        <h1 className="pipeline-title">Your score is ready.</h1>
        <p className="pipeline-subtitle">
          {standard} · {subject} · <strong>{currentChapter}</strong>
        </p>

        <div className="result-score-card">
          <div className="result-score-value">
            {score} / {quiz.length}
          </div>
          <div className="result-score-label">{percentage}% correct</div>
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleBackToChapter}>
          Back to Chapters
        </button>
      </div>
    </section>
  );
}
