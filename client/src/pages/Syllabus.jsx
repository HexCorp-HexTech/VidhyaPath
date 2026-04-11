import { useNavigate } from "react-router-dom";
import { syllabusData } from "../data/mockSyllabus";
import { useAppStore } from "../store/useAppStore";

export default function Syllabus() {
  const navigate = useNavigate();
  const standard = useAppStore((state) => state.standard);
  const setStandard = useAppStore((state) => state.setStandard);
  const resetSelection = useAppStore((state) => state.resetSelection);

  const standards = Object.keys(syllabusData);

  const handleClick = (standardName) => {
    resetSelection();
    setStandard(standardName);
    navigate("/subject");
  };

  return (
    <section className="pipeline-page">
      <div className="pipeline-hero">
        <div className="pipeline-hero-copy">
          <span className="tag tag-saffron">Step 1: Select Standard</span>
          <h1 className="pipeline-title">Choose a standard to load the syllabus.</h1>
          <p className="pipeline-subtitle">
            The flow now starts with a standard, then subject, then chapter.
          </p>
        </div>
        <div className="pipeline-summary-card">
          <div className="pipeline-summary-label">Current selection</div>
          <div className="pipeline-summary-value">
            {standard || "No standard selected yet"}
          </div>
          <div className="pipeline-summary-hint">
            Choosing a new standard clears the old subject, chapter, and quiz flow.
          </div>
        </div>
      </div>

      <div className="pipeline-grid">
        {standards.map((standardName) => (
          <button
            key={standardName}
            className="chapter-select-card"
            onClick={() => handleClick(standardName)}
          >
            <div className="chapter-select-icon">ST</div>
            <div className="chapter-select-title">{standardName}</div>
            <div className="chapter-select-copy">
              Load available subjects and chapters for this standard.
            </div>
            <span className="chapter-select-cta">Select subject →</span>
          </button>
        ))}
      </div>
    </section>
  );
}
