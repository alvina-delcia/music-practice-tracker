import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

const WELCOME_MESSAGE = {
  role: "assistant",
  text: "Hi, I'm Cadence! 🎵 Ask me about your practice, your goal, or just say hi.",
};

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const newMessages = [...messages, { role: "user", text: trimmed }];
    setMessages(newMessages);
    setInput("");
    setError("");
    setSending(true);

    try {
      const res = await api.post("/chat", {
        message: trimmed,
        history: newMessages.slice(0, -1), // everything before this new message
      });
      setMessages((prev) => [...prev, { role: "assistant", text: res.data.reply }]);
    } catch (err) {
      setError(err.response?.data?.message || "Cadence couldn't respond right now. Try again in a moment.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        className="chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat with Cadence" : "Chat with Cadence"}
      >
        {open ? "✕" : <span className="chat-fab-face">🎵</span>}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <div className="chat-avatar">🎵</div>
            <div>
              <div className="chat-header-name">Cadence</div>
              <div className="chat-header-sub">Your practice buddy</div>
            </div>
          </div>

          <div className="chat-messages" ref={scrollRef}>
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

          {error && <div className="chat-error">{error}</div>}

          <form className="chat-input-row" onSubmit={sendMessage}>
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
      )}
    </>
  );
};

export default ChatWidget;
