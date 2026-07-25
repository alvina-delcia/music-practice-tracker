import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

const WELCOME_MESSAGE = {
  role: "assistant",
  text: "Hi, I'm Cadence! 🎵 Ask me about your practice, your goal, or just say hi.",
};

const SUGGESTIONS = [
  "How's my practice going this week?",
  "Am I close to my goal?",
  "Give me a tip to stay motivated",
  "What should I focus on next?",
];

const Coach = () => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const sendMessage = async (textOverride) => {
    const trimmed = (textOverride ?? input).trim();
    if (!trimmed || sending) return;

    const newMessages = [...messages, { role: "user", text: trimmed }];
    setMessages(newMessages);
    setInput("");
    setError("");
    setSending(true);

    try {
      const res = await api.post("/chat", {
        message: trimmed,
        history: newMessages.slice(0, -1),
      });
      setMessages((prev) => [...prev, { role: "assistant", text: res.data.reply }]);
    } catch (err) {
      setError(err.response?.data?.message || "Cadence couldn't respond right now. Try again in a moment.");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <span className="eyebrow">Your practice buddy</span>
          <h1>Coach</h1>
          <p className="subtitle">Chat with Cadence about your practice, your goal, or just say hi.</p>
        </div>
      </div>

      <div className="coach-page-card">
        <div className="chat-panel-header coach-header">
          <div className="chat-avatar coach-avatar">🎵</div>
          <div>
            <div className="chat-header-name">Cadence</div>
            <div className="chat-header-sub">Always here to help you practice smarter</div>
          </div>
        </div>

        <div className="chat-messages coach-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble-row ${m.role === "user" ? "from-user" : "from-cadence"}`}>
              {m.role === "assistant" && <span className="chat-bubble-avatar">🎵</span>}
              <div className="chat-bubble">{m.text}</div>
            </div>
          ))}
          {sending && (
            <div className="chat-bubble-row from-cadence">
              <span className="chat-bubble-avatar">🎵</span>
              <div className="chat-bubble chat-typing">
                <span /> <span /> <span />
              </div>
            </div>
          )}
        </div>

        {messages.length === 1 && (
          <div className="coach-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="coach-suggestion-chip" onClick={() => sendMessage(s)} disabled={sending}>
                {s}
              </button>
            ))}
          </div>
        )}

        {error && <div className="chat-error">{error}</div>}

        <form className="chat-input-row coach-input-row" onSubmit={handleSubmit}>
          <input
            type="text"
            className="input"
            placeholder="Ask Cadence anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button type="submit" className="btn btn-primary chat-send-btn" disabled={sending || !input.trim()}>
            ➤
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Coach;
