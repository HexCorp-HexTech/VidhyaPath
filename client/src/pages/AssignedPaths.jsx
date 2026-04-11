import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, getAssignedPaths, getAssignedTopicContent, getSavedStudentId } from "../utils/api";

function TopicChat({ topicName, studentId, lang }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi! 😊 I can help you understand "${topicName}". Ask me anything about this topic!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          message: `[Topic: ${topicName}] ${msg}`,
          history: messages.slice(-6)
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, ai: data.ai_powered }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Could not get a response. Please try again.' }]);
    }
    setLoading(false);
  };

  const prompts = [
    `Explain ${topicName} simply`,
    'Give me an example',
    'Why is this important?',
    'Quiz me on this'
  ];

  return (
    <div className="topic-chat-panel">
      <div className="topic-chat-header">
        <div className="topic-chat-avatar">🤖</div>
        <div>
          <div className="topic-chat-title">AI Tutor</div>
          <div className="topic-chat-subtitle">{loading ? 'Thinking...' : `Helping with: ${topicName}`}</div>
        </div>
      </div>

      <div className="topic-chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`topic-chat-bubble-wrap ${m.role}`}>
            <div className="topic-chat-bubble">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="topic-chat-bubble-wrap assistant">
            <div className="chat-typing"><div className="chat-dot" /><div className="chat-dot" /><div className="chat-dot" /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="topic-chat-prompts">
        {prompts.map(p => (
          <button key={p} className="quick-prompt-btn" onClick={() => send(p)}>{p}</button>
        ))}
      </div>

      <div className="topic-chat-input-row">
        <textarea
          className="chatbot-input"
          rows={1}
          placeholder={`Ask about ${topicName}...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button className="chatbot-send" onClick={() => send()} disabled={loading || !input.trim()}>→</button>
      </div>
    </div>
  );
}

export default function AssignedPaths() {
  const navigate = useNavigate();
  const studentId = getSavedStudentId();
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState(null); // { pathId, topicIndex }
  const [topicContent, setTopicContent] = useState({}); // key: `${pathId}_${topicIndex}`
  const [loadingContent, setLoadingContent] = useState(null);
  const [openChats, setOpenChats] = useState({}); // key: topicKey -> boolean

  useEffect(() => {
    if (!studentId) {
      navigate("/login", { replace: true });
      return;
    }
    getAssignedPaths(studentId)
      .then((data) => setPaths(data || []))
      .finally(() => setLoading(false));
  }, [studentId, navigate]);

  const handleTopicClick = async (pathId, topicIndex, topicName) => {
    const key = `${pathId}_${topicIndex}`;

    // Toggle collapse
    if (expandedTopic?.key === key) {
      setExpandedTopic(null);
      return;
    }

    setExpandedTopic({ key, pathId, topicIndex, topicName });

    // Load content if not cached
    if (!topicContent[key]) {
      setLoadingContent(key);
      const result = await getAssignedTopicContent(pathId, topicIndex);
      if (result) {
        setTopicContent((prev) => ({ ...prev, [key]: result }));
      }
      setLoadingContent(null);
    }
  };

  const toggleChat = (key) => {
    setOpenChats(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <h3>Loading assigned paths...</h3>
      </div>
    );
  }

  return (
    <section className="pipeline-page">
      <div className="pipeline-hero">
        <div className="pipeline-hero-copy">
          <span className="tag tag-saffron">📋 Teacher Assigned</span>
          <h1 className="pipeline-title">Your Learning Paths</h1>
          <p className="pipeline-subtitle">
            Topics assigned by your teacher with AI-generated explanations.
            Click any topic to read the lesson.
          </p>
        </div>
        <div className="pipeline-summary-card">
          <div className="pipeline-summary-label">Paths Assigned</div>
          <div className="pipeline-summary-value">{paths.length}</div>
          <div className="pipeline-summary-hint">
            {paths.length === 0
              ? "No paths assigned yet"
              : `${paths.reduce((a, p) => a + p.topics.length, 0)} total topics`}
          </div>
        </div>
      </div>

      {paths.length === 0 ? (
        <div className="assigned-empty-state">
          <div className="assigned-empty-icon">📋</div>
          <h2>No paths assigned yet</h2>
          <p>
            Your teacher hasn't assigned any learning paths to you yet. Check
            back later!
          </p>
          <button
            className="btn btn-ghost btn-lg"
            onClick={() => navigate("/syllabus")}
          >
            ← Back to Syllabus
          </button>
        </div>
      ) : (
        <div className="assigned-paths-list">
          {paths.map((path) => (
            <div key={path.id} className="assigned-path-card">
              <div className="assigned-path-header">
                <div className="assigned-path-header-left">
                  <div className="assigned-path-icon">📚</div>
                  <div>
                    <div className="assigned-path-title">{path.title}</div>
                    <div className="assigned-path-meta">
                      <span>👨‍🏫 {path.teacher_name}</span>
                      <span>•</span>
                      <span>{path.topics.length} topics</span>
                      <span>•</span>
                      <span>
                        {new Date(path.assigned_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`tag ${path.status === "active" ? "tag-green" : "tag-navy"}`}
                >
                  {path.status === "active" ? "Active" : "Completed"}
                </span>
              </div>

              <div className="assigned-topics-list">
                {path.topics.map((topic, idx) => {
                  const key = `${path.id}_${idx}`;
                  const isExpanded = expandedTopic?.key === key;
                  const content = topicContent[key];
                  const isLoading = loadingContent === key;
                  const isChatOpen = openChats[key];

                  return (
                    <div
                      key={idx}
                      className={`assigned-topic-item ${isExpanded ? "expanded" : ""}`}
                    >
                      <button
                        className="assigned-topic-header"
                        onClick={() => handleTopicClick(path.id, idx, topic)}
                      >
                        <div className="assigned-topic-num">{idx + 1}</div>
                        <div className="assigned-topic-name">{topic}</div>
                        <div
                          className={`assigned-topic-chevron ${isExpanded ? "open" : ""}`}
                        >
                          ▸
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="assigned-topic-content">
                          {isLoading ? (
                            <div className="assigned-content-loading">
                              <div className="loading-spinner" style={{ width: 28, height: 28 }} />
                              <span>Generating AI explanation...</span>
                            </div>
                          ) : content ? (
                            <div className="assigned-topic-content-wrapper">
                              <div className="assigned-topic-lesson">
                                {content.source === "ai" && (
                                  <div className="ai-status-banner ai-success" style={{ marginBottom: 12 }}>
                                    <span className="ai-status-icon">🤖</span>
                                    <span>AI-powered explanation</span>
                                  </div>
                                )}
                                {content.source === "fallback" && (
                                  <div className="ai-status-banner ai-fallback" style={{ marginBottom: 12 }}>
                                    <span className="ai-status-icon">⚠️</span>
                                    <span>Using fallback content — AI was unavailable</span>
                                  </div>
                                )}
                                <p
                                  className="assigned-topic-text"
                                  style={{ whiteSpace: "pre-line" }}
                                >
                                  {content.content}
                                </p>

                                {/* Chat toggle button */}
                                <button
                                  className={`topic-chat-toggle ${isChatOpen ? 'active' : ''}`}
                                  onClick={() => toggleChat(key)}
                                >
                                  <span className="topic-chat-toggle-icon">🤖</span>
                                  <span>{isChatOpen ? 'Close AI Tutor' : 'Ask AI about this topic'}</span>
                                  <span className="topic-chat-toggle-badge">AI</span>
                                </button>
                              </div>

                              {/* Inline Topic Chat */}
                              {isChatOpen && (
                                <TopicChat
                                  topicName={topic}
                                  studentId={studentId}
                                />
                              )}
                            </div>
                          ) : (
                            <p className="assigned-topic-error">
                              Could not load content. Please try again later.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
