import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import {
  getCachedLearningBundle,
  getLessonContent,
  getNotesContent,
  getQuizContent,
  getStudentSyllabus,
  submitQuiz,
  syncOfflineActions,
} from "../utils/api";

function EmptyState({ title, copy }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
      <div className="pipeline-title" style={{ fontSize: 28 }}>
        {title}
      </div>
      <p className="pipeline-subtitle" style={{ margin: "12px auto 0", maxWidth: 560 }}>
        {copy}
      </p>
    </div>
  );
}

function normalizeQuizForSubmit(quiz) {
  return quiz.map((item) => ({
    question: item.question,
    correct_answer: item.answer,
    explanation: item.explanation || "",
  }));
}

export default function LearningPage({ student }) {
  const location = useLocation();
  const standard = useAppStore((state) => state.standard);
  const subject = useAppStore((state) => state.subject);
  const syllabus = useAppStore((state) => state.syllabus);
  const syllabusSubjects = useAppStore((state) => state.syllabusSubjects);
  const currentChapter = useAppStore((state) => state.currentChapter);
  const lesson = useAppStore((state) => state.lesson);
  const notes = useAppStore((state) => state.notes);
  const quiz = useAppStore((state) => state.quiz);
  const score = useAppStore((state) => state.score);
  const quizResult = useAppStore((state) => state.quizResult);
  const setStandard = useAppStore((state) => state.setStandard);
  const setSubject = useAppStore((state) => state.setSubject);
  const setSyllabus = useAppStore((state) => state.setSyllabus);
  const setSyllabusSubjects = useAppStore((state) => state.setSyllabusSubjects);
  const setChapter = useAppStore((state) => state.setChapter);
  const setLesson = useAppStore((state) => state.setLesson);
  const setNotes = useAppStore((state) => state.setNotes);
  const setQuiz = useAppStore((state) => state.setQuiz);
  const setScore = useAppStore((state) => state.setScore);
  const setQuizResult = useAppStore((state) => state.setQuizResult);
  const resetFlow = useAppStore((state) => state.resetFlow);

  const [loadingSyllabus, setLoadingSyllabus] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [activeStage, setActiveStage] = useState("lesson");

  useEffect(() => {
    function handleOnline() {
      setOffline(false);
      syncOfflineActions();
    }

    function handleOffline() {
      setOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSyllabus() {
      if (!student?.id) return;

      setLoadingSyllabus(true);
      setError("");
      try {
        const data = await getStudentSyllabus(student.id);
        if (cancelled) return;
        const subjectRows = data.syllabus || [];
        setSyllabusSubjects(subjectRows);
        if (!standard) {
          setStandard(String(student.grade || ""));
        }
        if (!subject && subjectRows[0]?.subject) {
          setSubject(subjectRows[0].subject);
          setSyllabus(subjectRows[0].chapters.map((chapter) => ({ chapter })));
        } else if (subject) {
          const matched = subjectRows.find((item) => item.subject === subject);
          setSyllabus((matched?.chapters || []).map((chapter) => ({ chapter })));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingSyllabus(false);
        }
      }
    }

    loadSyllabus();
    return () => {
      cancelled = true;
    };
  }, [setStandard, setSubject, setSyllabus, setSyllabusSubjects, standard, student?.grade, student?.id, subject]);

  useEffect(() => {
    const state = location.state || {};
    if (!state.subject || !state.chapter || !student?.id) return;

    if (state.subject !== subject) {
      setSubject(state.subject);
      const matched = syllabusSubjects.find((item) => item.subject === state.subject);
      if (matched) {
        setSyllabus(matched.chapters.map((chapter) => ({ chapter })));
      }
    }

    loadLearningContent(state.chapter, state.stage || "lesson", {
      subject: state.subject,
      standard: String(student.grade || standard || ""),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, student?.id, syllabusSubjects]);

  const currentTopics = useMemo(() => {
    const row = syllabusSubjects.find((item) => item.subject === subject);
    return row?.topics || [];
  }, [subject, syllabusSubjects]);

  async function loadLearningContent(chapterName, nextStage = "lesson", overrides = {}) {
    const resolvedSubject = overrides.subject || subject;
    const resolvedStandard = overrides.standard || standard;
    if (!student?.id || !resolvedSubject || !resolvedStandard) return;

    setLoadingContent(true);
    setError("");
    setChapter(chapterName);
    setActiveStage(nextStage);
    setAnswers({});
    setQuizResult(null);
    setScore(null);

    try {
      const cachedBundle = getCachedLearningBundle(student.id, resolvedSubject, chapterName);
      let lessonData = cachedBundle.lesson;
      if (!lessonData?.lesson) {
        lessonData = await getLessonContent({
          studentId: student.id,
          standard: resolvedStandard,
          subject: resolvedSubject,
          chapter: chapterName,
        });
      }

      const notesData =
        cachedBundle.notes ||
        (await getNotesContent({
          studentId: student.id,
          standard: resolvedStandard,
          subject: resolvedSubject,
          chapter: chapterName,
          lesson: lessonData.lesson,
        }));

      const quizData =
        cachedBundle.quiz ||
        (await getQuizContent({
          studentId: student.id,
          standard: resolvedStandard,
          subject: resolvedSubject,
          chapter: chapterName,
        }));

      setLesson(lessonData.lesson);
      setNotes(notesData.notes || []);
      setQuiz(quizData.quiz || []);
      if (lessonData.offline || notesData.offline || quizData.offline) {
        setOffline(true);
      }
    } catch (loadError) {
      setError(loadError.message || "Failed to load learning content");
    } finally {
      setLoadingContent(false);
    }
  }

  async function handleSubmitQuiz() {
    const totalScore = quiz.reduce(
      (sum, item, index) => sum + (answers[index] === item.answer ? 1 : 0),
      0
    );
    setScore(totalScore);

    const result = await submitQuiz(
      student.id,
      currentChapter,
      totalScore,
      answers,
      normalizeQuizForSubmit(quiz),
      null
    );
    setQuizResult(result);
    setActiveStage("result");
  }

  function handleSelectSubject(nextSubject) {
    setSubject(nextSubject);
    resetFlow();
    setChapter(null);
    const row = syllabusSubjects.find((item) => item.subject === nextSubject);
    setSyllabus((row?.chapters || []).map((chapter) => ({ chapter })));
  }

  function restartSelection() {
    resetFlow();
    setChapter(null);
    setActiveStage("lesson");
    setAnswers({});
  }

  if (loadingSyllabus) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <h3>Loading your syllabus</h3>
        <p>Preparing the personalized curriculum for {student?.name || "you"}.</p>
      </div>
    );
  }

  if (!syllabusSubjects.length) {
    return (
      <EmptyState
        title="No syllabus available yet"
        copy="Complete onboarding or ask your teacher to assign modules so we can build your learning flow."
      />
    );
  }

  const allAnswered = quiz.length > 0 && quiz.every((_, index) => answers[index]);

  return (
    <section className="pipeline-page">
      <div className="pipeline-hero">
        <div className="pipeline-hero-copy">
          <span className="tag tag-saffron">
            {offline ? "Offline mode active" : "Personalized learning"}
          </span>
          <h1 className="pipeline-title">Learning Hub</h1>
          <p className="pipeline-subtitle">
            Study one chapter end-to-end with AI-generated lessons, revision notes, and quiz feedback.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <span className="tag tag-teal">Class {standard}</span>
            <span className="tag tag-gold">{subject || "Choose a subject"}</span>
            {currentChapter ? <span className="tag tag-green">{currentChapter}</span> : null}
          </div>
        </div>
        <div className="pipeline-summary-card">
          <div className="pipeline-summary-label">Available topics</div>
          <div className="pipeline-summary-value">{currentTopics.length}</div>
          <div className="pipeline-summary-hint">
            Previously loaded lessons, notes, and quizzes stay available even if the network drops.
          </div>
        </div>
      </div>

      {error ? (
        <div className="card" style={{ borderColor: "rgba(220,38,38,0.2)", color: "var(--red)" }}>
          {error}
        </div>
      ) : null}

      <div className="card">
        <div className="pipeline-summary-label">Subjects</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          {syllabusSubjects.map((item) => (
            <button
              key={item.subject}
              className={`quiz-option-pill ${subject === item.subject ? "selected" : ""}`}
              onClick={() => handleSelectSubject(item.subject)}
              type="button"
              style={{ minWidth: 140 }}
            >
              {item.subject}
            </button>
          ))}
        </div>
      </div>

      <div className="pipeline-grid">
        {syllabus.map((item) => (
          <button
            key={item.chapter}
            className="chapter-select-card"
            onClick={() => loadLearningContent(item.chapter)}
            type="button"
          >
            <div className="chapter-select-icon">CH</div>
            <div className="chapter-select-title">{item.chapter}</div>
            <div className="chapter-select-copy">
              {currentTopics.slice(0, 2).join(" • ") || "Open the full chapter learning flow."}
            </div>
            <span className="chapter-select-cta">Open learning flow</span>
          </button>
        ))}
      </div>

      {loadingContent ? (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <h3>Generating content</h3>
          <p>Preparing lesson, notes, and quiz for {currentChapter}.</p>
        </div>
      ) : null}

      {currentChapter && lesson ? (
        <div className="pipeline-content-card">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            {[
              ["lesson", "Lesson"],
              ["notes", "Notes"],
              ["quiz", "Quiz"],
              ["result", "Result"],
            ].map(([id, label]) => (
              <button
                key={id}
                className={`quiz-option-pill ${activeStage === id ? "selected" : ""}`}
                disabled={id === "result" && !quizResult}
                onClick={() => setActiveStage(id)}
                type="button"
                style={{ width: "auto" }}
              >
                {label}
              </button>
            ))}
          </div>

          <h1 className="pipeline-title" style={{ fontSize: 34 }}>
            {currentChapter}
          </h1>
          <p className="pipeline-subtitle">
            {subject} • Class {standard}
          </p>

          {activeStage === "lesson" ? (
            <p className="pipeline-copy" style={{ marginTop: 18, whiteSpace: "pre-line" }}>
              {lesson}
            </p>
          ) : null}

          {activeStage === "notes" ? (
            <ul className="pipeline-notes-list">
              {notes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          {activeStage === "quiz" ? (
            <div className="quiz-question-stack">
              {quiz.map((item, index) => (
                <div className="quiz-question-card" key={`${item.question}-${index}`}>
                  <div className="quiz-question-title">
                    Q{index + 1}. {item.question}
                  </div>
                  <div className="quiz-options-list">
                    {item.options.map((option) => (
                      <button
                        key={option}
                        className={`quiz-option-pill ${answers[index] === option ? "selected" : ""}`}
                        onClick={() =>
                          setAnswers((current) => ({
                            ...current,
                            [index]: option,
                          }))
                        }
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {activeStage === "result" && quizResult ? (
            <div style={{ marginTop: 20 }}>
              <div className="result-score-card">
                <div className="result-score-value">
                  {score} / {quiz.length}
                </div>
                <div className="result-score-label">{quizResult.status} performance</div>
              </div>
              <ul className="pipeline-notes-list">
                <li>{quizResult.feedback?.encouragement || "Great work. Keep the momentum going."}</li>
                <li>{quizResult.feedback?.focus_next || "Review the notes and continue to the next chapter."}</li>
                {quizResult.offline ? (
                  <li>Your result is stored locally and will sync automatically when you reconnect.</li>
                ) : null}
              </ul>
              <div className="quiz-question-stack" style={{ marginTop: 18 }}>
                {quiz.map((item, index) => {
                  const selected = answers[index];
                  const correct = item.answer;
                  const isCorrect = selected === correct;
                  return (
                    <div
                      key={`${item.question}-review-${index}`}
                      className="quiz-question-card"
                      style={{
                        borderColor: isCorrect ? "rgba(5,150,105,0.25)" : "rgba(220,38,38,0.2)",
                      }}
                    >
                      <div className="quiz-question-title">
                        Q{index + 1}. {item.question}
                      </div>
                      <div className="pipeline-notes-list">
                        <li>Your answer: {selected || "Not answered"}</li>
                        <li>Correct answer: {correct}</li>
                        <li>{isCorrect ? "Correct" : "Review this concept again before the next test."}</li>
                      </div>
                    </div>
                  );
                })}
              </div>
              {quizResult.analysis?.recommendations?.length ? (
                <ul className="pipeline-notes-list" style={{ marginTop: 18 }}>
                  {quizResult.analysis.recommendations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="pipeline-actions">
            <button className="btn btn-ghost btn-lg" onClick={restartSelection} type="button">
              Pick another chapter
            </button>
            {activeStage === "lesson" ? (
              <button className="btn btn-primary btn-lg" onClick={() => setActiveStage("notes")} type="button">
                Continue to notes
              </button>
            ) : null}
            {activeStage === "notes" ? (
              <button className="btn btn-primary btn-lg" onClick={() => setActiveStage("quiz")} type="button">
                Start quiz
              </button>
            ) : null}
            {activeStage === "quiz" ? (
              <button
                className="btn btn-primary btn-lg"
                disabled={!allAnswered}
                onClick={handleSubmitQuiz}
                type="button"
              >
                Submit quiz
              </button>
            ) : null}
            {activeStage === "result" ? (
              <button className="btn btn-primary btn-lg" onClick={restartSelection} type="button">
                Back to syllabus
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
