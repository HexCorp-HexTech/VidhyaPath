import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuizContent } from "../utils/api";
import { useAppStore } from "../store/useAppStore";

export default function Quiz() {
  const navigate = useNavigate();
  const standard = useAppStore((state) => state.standard);
  const subject = useAppStore((state) => state.subject);
  const currentChapter = useAppStore((state) => state.currentChapter);
  const notes = useAppStore((state) => state.notes);
  const quiz = useAppStore((state) => state.quiz);
  const setQuiz = useAppStore((state) => state.setQuiz);
  const setScore = useAppStore((state) => state.setScore);
  const [answers, setAnswers] = useState({});
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState("");
  const [aiMeta, setAiMeta] = useState({ source: null, ai_powered: false, reason: null });

  useEffect(() => {
    let isMounted = true;

    async function loadQuiz() {
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

      if (!notes) {
        navigate("/notes", { replace: true });
        return;
      }

      if (quiz.length === 0) {
        setIsPreparing(true);
        setError("");
        const data = await getQuizContent(standard, subject, currentChapter);
        if (!isMounted) return;

        if (data?.quiz?.length) {
          setQuiz(data.quiz);
          setAiMeta({
            source: data.source || null,
            ai_powered: data.ai_powered || false,
            reason: data.reason || null,
          });
        } else {
          setError("Quiz could not be loaded right now.");
        }

        setIsPreparing(false);
      }
    }

    loadQuiz();
    return () => {
      isMounted = false;
    };
  }, [currentChapter, navigate, notes, quiz.length, setQuiz, standard, subject]);

  if (!standard || !subject || !currentChapter || !notes) {
    return null;
  }

  if (isPreparing) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <h3>Preparing quiz...</h3>
        <p>Generating questions for {currentChapter}.</p>
      </div>
    );
  }

  if (error && quiz.length === 0) {
    return (
      <section className="pipeline-page">
        <div className="pipeline-content-card">
          <span className="tag tag-red">Content Error</span>
          <h1 className="pipeline-title">Quiz unavailable</h1>
          <p className="pipeline-copy">{error}</p>
          <div className="pipeline-actions">
            <button className="btn btn-ghost btn-lg" onClick={() => navigate("/notes")}>
              Back to Notes
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => navigate(0)}>
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  const handleSelect = (questionIndex, option) => {
    setAnswers((current) => ({
      ...current,
      [questionIndex]: option,
    }));
  };

  const handleSubmit = () => {
    let correct = 0;

    quiz.forEach((question, index) => {
      if (answers[index] === question.answer) {
        correct += 1;
      }
    });

    setScore(correct);
    navigate("/result");
  };

  const allAnswered = quiz.every((_, index) => answers[index]);

  return (
    <section className="pipeline-page">
      <div className="pipeline-content-card">
        <span className="tag tag-gold">Quiz</span>
        <h1 className="pipeline-title">{currentChapter}</h1>
        <p className="pipeline-subtitle">
          Class {standard} · {subject}
        </p>

        {/* AI source status banner */}
        {aiMeta.source === "ai" && (
          <div className="ai-status-banner ai-success">
            <span className="ai-status-icon">🤖</span>
            <span>AI-powered quiz generated successfully</span>
          </div>
        )}
        {aiMeta.source === "fallback" && aiMeta.reason && (
          <div className="ai-status-banner ai-fallback">
            <span className="ai-status-icon">⚠️</span>
            <span>
              AI generation failed — using fallback quiz.
              <span className="ai-reason"> Reason: {aiMeta.reason}</span>
            </span>
          </div>
        )}

        <div className="quiz-question-stack">
          {quiz.map((question, index) => (
            <div className="quiz-question-card" key={question.question}>
              <div className="quiz-question-title">
                Q{index + 1}. {question.question}
              </div>
              <div className="quiz-options-list">
                {question.options.map((option) => (
                  <button
                    key={option}
                    className={`quiz-option-pill ${
                      answers[index] === option ? "selected" : ""
                    }`}
                    onClick={() => handleSelect(index, option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AI Generated marker at bottom for AI quizzes */}
        {aiMeta.source === "ai" && (
          <p className="ai-generated-marker" style={{ textAlign: "center", marginTop: "1rem" }}>
            ✨ AI Generated
          </p>
        )}

        <div className="pipeline-actions">
          <button className="btn btn-ghost btn-lg" onClick={() => navigate("/notes")}>
            Back to Notes
          </button>
          <button
            className="btn btn-primary btn-lg"
            disabled={!allAnswered}
            onClick={handleSubmit}
          >
            Submit Quiz
          </button>
        </div>
      </div>
    </section>
  );
}
