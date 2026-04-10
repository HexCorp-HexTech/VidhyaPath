import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { syllabusData } from "../data/mockSyllabus";
import { useAppStore } from "../store/useAppStore";

export default function Subject() {
  const navigate = useNavigate();
  const standard = useAppStore((state) => state.standard);
  const subject = useAppStore((state) => state.subject);
  const setSubject = useAppStore((state) => state.setSubject);
  const setSyllabus = useAppStore((state) => state.setSyllabus);
  const setChapter = useAppStore((state) => state.setChapter);
  const resetFlow = useAppStore((state) => state.resetFlow);

  useEffect(() => {
    if (!standard) {
      navigate("/syllabus", { replace: true });
    }
  }, [navigate, standard]);

  if (!standard) {
    return null;
  }

  const subjects = Object.keys(syllabusData[standard] || {});

  const handleSelect = (subjectName) => {
    resetFlow();
    setSubject(subjectName);
    setChapter(null);
    setSyllabus(syllabusData[standard]?.[subjectName] || []);
    navigate("/chapter");
  };

  return (
    <section className="pipeline-page">
      <div className="pipeline-hero">
        <div className="pipeline-hero-copy">
          <span className="tag tag-teal">Step 2: Select Subject</span>
          <h1 className="pipeline-title">Choose a subject in {standard}.</h1>
          <p className="pipeline-subtitle">
            After subject selection, the app will show the chapter list for that syllabus.
          </p>
        </div>
        <div className="pipeline-summary-card">
          <div className="pipeline-summary-label">Current selection</div>
          <div className="pipeline-summary-value">
            {subject || "No subject selected yet"}
          </div>
          <div className="pipeline-summary-hint">
            Subject selection controls which chapter list is loaded next.
          </div>
        </div>
      </div>

      <div className="pipeline-grid">
        {subjects.map((subjectName) => (
          <button
            key={subjectName}
            className="chapter-select-card"
            onClick={() => handleSelect(subjectName)}
          >
            <div className="chapter-select-icon">SU</div>
            <div className="chapter-select-title">{subjectName}</div>
            <div className="chapter-select-copy">
              Load chapters for {subjectName} in {standard}.
            </div>
            <span className="chapter-select-cta">Select chapter →</span>
          </button>
        ))}
      </div>
    </section>
  );
}
