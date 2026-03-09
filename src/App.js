import { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversationId, conversations]);

  const getCurrentMessages = () => {
    const conv = conversations.find(c => c.id === currentConversationId);
    return conv ? conv.messages : [];
  };

  const startNewChat = () => {
    const newId = Date.now();
    setConversations(prev => [...prev, {
      id: newId,
      title: "New Chat",
      messages: [],
      timestamp: new Date()
    }]);
    setCurrentConversationId(newId);
  };

  const askQuestion = async () => {
    if (!input.trim()) return;

    // Create new conversation if none exists
    if (!currentConversationId) {
      const newId = Date.now();
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMessage = { id: Date.now(), text: input, sender: "user", time: timestamp };

      setConversations([{
        id: newId,
        title: input.substring(0, 30) + (input.length > 30 ? "..." : ""),
        messages: [userMessage],
        timestamp: new Date()
      }]);
      setCurrentConversationId(newId);
      setInput("");
      setLoading(true);

      try {
        const response = await fetch("https://shobhanaa-ragllm.hf.space/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: input })
        });

        const text = await response.text();
        let answerText = "Error parsing response.";
        try {
          const data = JSON.parse(text);
          answerText = data.answer || "No answer provided.";
        } catch (e) {
          answerText = "Error: Invalid response format.";
        }

        const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const botMessage = { id: Date.now() + 1, text: answerText, sender: "bot", time: botTimestamp };

        setConversations(prev => prev.map(conv =>
          conv.id === newId
            ? { ...conv, messages: [...conv.messages, botMessage] }
            : conv
        ));
      } catch (error) {
        console.error("Error:", error);
      }
      setLoading(false);
      return;
    }

    // Add to existing conversation
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = { id: Date.now(), text: input, sender: "user", time: timestamp };

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        const isFirstMessage = conv.messages.length === 0;
        return {
          ...conv,
          title: isFirstMessage ? input.substring(0, 30) + (input.length > 30 ? "..." : "") : conv.title,
          messages: [...conv.messages, userMessage]
        };
      }
      return conv;
    }));

    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://shobhanaa-ragllm.hf.space/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input })
      });

      const text = await response.text();
      let answerText = "Error parsing response.";
      try {
        const data = JSON.parse(text);
        answerText = data.answer || "No answer provided.";
      } catch (e) {
        answerText = "Error: Invalid response format.";
      }

      const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const botMessage = { id: Date.now() + 1, text: answerText, sender: "bot", time: botTimestamp };

      setConversations(prev => prev.map(conv =>
        conv.id === currentConversationId
          ? { ...conv, messages: [...conv.messages, botMessage] }
          : conv
      ));
    } catch (error) {
      console.error("Error:", error);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  const currentMessages = getCurrentMessages();

  return (
    <div className="App">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={startNewChat}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New chat
          </button>
        </div>

        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-history">No conversations yet</div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
                onClick={() => setCurrentConversationId(conv.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="conv-title">{conv.title}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="App-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1>Placement AI Assistant</h1>
          <div className="header-spacer"></div>
        </header>

        <div className="chat-container">
          {currentMessages.length === 0 ? (
            <div className="empty-state">
              <div className="logo-circle">
                <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </div>
              <h2>How can I help you today?</h2>
              <p>Ask me anything about placements, companies, or interview preparation</p>
            </div>
          ) : (
            <>
              {currentMessages.map((msg) => (
                <div key={msg.id} className={`message ${msg.sender}`}>
                  <div className="message-wrapper">
                    <div className={`avatar ${msg.sender}-avatar`}>
                      {msg.sender === "user" ? "U" : "AI"}
                    </div>
                    <div className="message-bubble">
                      <div className="message-text">{msg.text}</div>
                      <div className="message-time">{msg.time}</div>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message bot">
                  <div className="message-wrapper">
                    <div className="avatar bot-avatar">AI</div>
                    <div className="message-bubble">
                      <div className="typing-indicator">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <input
              type="text"
              className="chat-input"
              placeholder="Message Placement AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="send-button"
              onClick={askQuestion}
              disabled={loading || !input.trim()}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
