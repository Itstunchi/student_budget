import React, { useState, useRef, useEffect } from 'react';
import './BudgetAdvisor.css';

export default function BudgetAdvisor() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Chat History States
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Toggle states for expandable widgets
  const [showAllRecs, setShowAllRecs] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  // User Name & Insights
  const [userName, setUserName] = useState('User');
  const [insights, setInsights] = useState({
    totalSavings: 0,
    totalExpenses: 0,
    unpaidBillsCount: 0
  });

  // 1. Load Saved Chat History from localStorage
  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('budget_advisor_chat_history') || '[]');
    setChatSessions(savedSessions);

    if (savedSessions.length > 0) {
      // Load the most recent chat session by default
      const latest = savedSessions[0];
      setCurrentSessionId(latest.id);
      setMessages(latest.messages || []);
    } else {
      startNewChat();
    }
  }, []);

  // 2. Save Messages whenever they update
  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return;

    setChatSessions((prevSessions) => {
      const updated = prevSessions.map((session) => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: messages,
            lastUpdated: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            // Set first message text as title
            title: session.title === 'New Conversation' && messages.length > 0 
              ? (messages[0].text.length > 30 ? messages[0].text.substring(0, 30) + '...' : messages[0].text) 
              : session.title
          };
        }
        return session;
      });

      // If current session isn't in state yet, add it
      if (!updated.some((s) => s.id === currentSessionId)) {
        const firstUserMsg = messages.find(m => m.sender === 'user')?.text || 'New Conversation';
        const newSession = {
          id: currentSessionId,
          title: firstUserMsg.length > 30 ? firstUserMsg.substring(0, 30) + '...' : firstUserMsg,
          date: new Date().toLocaleDateString(),
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          messages: messages
        };
        updated.unshift(newSession);
      }

      localStorage.setItem('budget_advisor_chat_history', JSON.stringify(updated));
      return updated;
    });
  }, [messages, currentSessionId]);

  // Handler: Start New Chat
  const startNewChat = () => {
    const newId = Date.now();
    setCurrentSessionId(newId);
    setMessages([]);
    setShowHistoryModal(false);
  };

  // Handler: Select a Previous Chat Session
  const loadChatSession = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setShowHistoryModal(false);
  };

  // Handler: Delete a Saved Chat Session
  const deleteChatSession = (e, sessionId) => {
    e.stopPropagation();
    const updated = chatSessions.filter((s) => s.id !== sessionId);
    setChatSessions(updated);
    localStorage.setItem('budget_advisor_chat_history', JSON.stringify(updated));

    if (sessionId === currentSessionId) {
      if (updated.length > 0) {
        setCurrentSessionId(updated[0].id);
        setMessages(updated[0].messages || []);
      } else {
        startNewChat();
      }
    }
  };

  // Load User Data & Calculate Real App Insights
  const loadUserData = () => {
    const savedUser = localStorage.getItem('user') || localStorage.getItem('user_profile');
    const savedName = localStorage.getItem('user_name');
    
    if (savedUser) {
      try {
        const parsed = typeof savedUser === 'string' && savedUser.startsWith('{')
          ? JSON.parse(savedUser)
          : { fullName: savedUser };
          
        setUserName(parsed.fullName || parsed.name || parsed.username || 'User');
      } catch (e) {
        console.error('Error parsing user profile:', e);
      }
    } else if (savedName) {
      setUserName(savedName);
    }

    const savedBills = JSON.parse(localStorage.getItem('user_bills') || '[]');
    const savedExpenses = JSON.parse(localStorage.getItem('user_expenses') || '[]');
    const savedSavings = JSON.parse(localStorage.getItem('user_savings') || '[]');

    const totalExp = savedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalSav = savedSavings.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const unpaidCount = savedBills.filter(b => b.status === 'Unpaid').length;

    setInsights({
      totalSavings: totalSav,
      totalExpenses: totalExp,
      unpaidBillsCount: unpaidCount
    });
  };

  useEffect(() => {
    loadUserData();
    window.addEventListener('storage', loadUserData);
    return () => window.removeEventListener('storage', loadUserData);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const getSystemPrompt = () => `You are BudgetBuddy Advisor, an expert AI financial bot helping students manage budgets in Nigeria.
Context about current user (${userName}):
- Total Savings: ₦${insights.totalSavings.toLocaleString()}
- Total Expenses: ₦${insights.totalExpenses.toLocaleString()}
- Unpaid Bills: ${insights.unpaidBillsCount}

Keep answers structured and short. Always provide well-structured options to pick from when asking a question. Avoid overusing asterisks and ensure your response is cleanly formatted.`;

  const callGroq = async (query) => {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: getSystemPrompt() },
          { role: "user", content: query }
        ]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Groq returned an empty response.");
    return text;
  };

  const callGemini = async (query) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: getSystemPrompt() }] },
          contents: [{ role: "user", parts: [{ text: query }] }]
        })
      }
    );

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned an empty response.");
    return text;
  };

  const handleSendMessage = async (e, customQuery) => {
    if (e) e.preventDefault();
    const queryToSend = customQuery || inputValue;
    if (!queryToSend.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: queryToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customQuery) setInputValue('');
    setLoading(true);

    let botResponseText;
    let usedFallback = false;

    try {
      botResponseText = await callGroq(queryToSend);
    } catch (groqError) {
      console.warn("Groq call failed, falling back to Gemini:", groqError.message);
      try {
        botResponseText = await callGemini(queryToSend);
        usedFallback = true;
      } catch (geminiError) {
        console.error("Gemini fallback also failed:", geminiError.message);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'bot',
          text: `⚠️ API Error: Groq failed (${groqError.message}) and Gemini fallback failed (${geminiError.message}).`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setLoading(false);
        return;
      }
    }

    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      sender: 'bot',
      text: usedFallback ? `${botResponseText}\n\n_(via Gemini fallback)_` : botResponseText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setLoading(false);
  };

  const recommendationsList = [
    { title: 'Build an Emergency Fund', sub: 'Start with ₦10,000 this month', badge: 'green-bg', d: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 100 12 6 6 0 000-12zm0 4a2 2 0 100 4 2 2 0 000-4z' },
    { title: 'Reduce Food Expenses', sub: 'You can save up to ₦15,000', badge: 'pink-bg', d: 'M12 21s-7.5-4.6-10-9.3C.6 8 2.4 4.5 6 4c2-.3 3.8.7 6 3 2.2-2.3 4-3.3 6-3 3.6.5 5.4 4 4 7.7C19.5 16.4 12 21 12 21z' },
    { title: 'Invest in a Mutual Fund', sub: 'Start investing with as little as ₦1,000', badge: 'purple-bg', d: 'M4 19h16M6 15l4-5 3 3 5-7M14 6h4v4' }
  ];

  const questionsList = [
    'How do I create a budget?',
    'What is the 50/30/20 rule?',
    'How can I improve my credit score?',
    'Best ways to save money as a student'
  ];

  return (
    <div className="budget-container">
      {/* OVERVIEW SECTION & HEADER CARD */}
      <div className="advisor-header-wrapper">
        <span className="overview-label">Overview</span>
        
        <div className="advisor-header-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="advisor-page-title">Ask Advisor</h1>
            <p className="advisor-page-subtitle">Get smart financial advice tailored to your goals.</p>
          </div>

          {/* CHAT HISTORY & NEW CHAT BUTTONS */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setShowHistoryModal(true)} 
              className="tips-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Saved Chats ({chatSessions.length})
            </button>

            <button 
              onClick={startNewChat}
              className="tips-btn"
              style={{ background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              + New Chat
            </button>
          </div>
        </div>
      </div>

      {/* WORKSPACE LAYOUT */}
      <div className="workspace-layout">
        <section className="chat-window">
          <div className="info-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="info-bot-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="9" width="16" height="11" rx="4"/>
                  <circle cx="9.5" cy="14.5" r="1" fill="#7C3AED"/>
                  <circle cx="14.5" cy="14.5" r="1" fill="#7C3AED"/>
                  <path d="M12 9V5M9.5 5h5"/>
                </svg>
              </div>
              <div>
                <h3 className="bot-info-title">
                  Buddy <span className="ai-tag">AI</span>
                  <span className="online-dot">● Online</span>
                </h3>
                <p className="bot-info-subtext">Here to help you make smarter financial decisions.</p>
              </div>
            </div>
          </div>

          <div className="message-logs">
            {messages.length === 0 ? (
              <div className="welcome-placeholder">
                <div className="empty-chat-graphic">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <h4 className="welcome-heading">Welcome back, {userName}</h4>
                <p className="welcome-subtext">Your workspace is ready. Ask any question below to plan or review your budget limits.</p>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center' }}><span className="time-pill">Today</span></div>
                {messages.map((msg) => (
                  <div key={msg.id} className={`msg-row ${msg.sender === 'user' ? 'user-msg' : 'bot-msg'}`}>
                    {msg.sender === 'bot' && (
                      <div className="chat-avatar-frame">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="9" width="16" height="11" rx="4"/>
                          <circle cx="9.5" cy="14.5" r="1" fill="#7C3AED"/>
                          <circle cx="14.5" cy="14.5" r="1" fill="#7C3AED"/>
                          <path d="M12 9V5M9.5 5h5"/>
                        </svg>
                      </div>
                    )}
                    <div>
                      <div className="msg-bubble" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                      <p className="msg-time">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
            {loading && <div className="typing-status">Advisor is writing...</div>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={(e) => handleSendMessage(e)} className="input-panel">
            <div className="input-container">
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your question here..."
                className="chat-input"
              />
              <button type="submit" disabled={!inputValue.trim()} className="send-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
            <p className="disclaimer-note">
              AI responses are for informational purposes only and not financial advice.
            </p>
          </form>
        </section>

        {/* RIGHT PANELS */}
        <aside className="right-panel">
          {/* Insights Widget */}
          <div className="widget-box">
            <div className="widget-header">
              <h4 className="widget-title">Advisor Insights for You</h4>
              <select className="widget-select"><option>This Month</option></select>
            </div>
            
            <div className="insight-row">
              <div className="icon-badge green-bg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              </div>
              <div className="widget-item-content">
                <h5 className="widget-item-title">Total Savings: ₦{insights.totalSavings.toLocaleString()}</h5>
                <p className="widget-item-subtext">Tracked in BudgetBuddy ↗</p>
              </div>
            </div>

            <div className="insight-row">
              <div className="icon-badge purple-bg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
              </div>
              <div className="widget-item-content">
                <h5 className="widget-item-title">Total Expenses: ₦{insights.totalExpenses.toLocaleString()}</h5>
                <p className="widget-item-subtext">Recorded this month ↘</p>
              </div>
            </div>

            <div className="insight-row">
              <div className="icon-badge orange-bg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
              </div>
              <div className="widget-item-content">
                <h5 className="widget-item-title">{insights.unpaidBillsCount} Pending Unpaid Bills</h5>
                <p className="widget-item-subtext">{insights.unpaidBillsCount === 0 ? 'All caught up! 🎉' : 'Keep track of upcoming dues'}</p>
              </div>
            </div>
          </div>

          {/* Top Recommendations */}
          <div className="widget-box">
            <div className="widget-header">
              <h4 className="widget-title">Top Recommendations</h4>
              <span 
                className="see-all-link"
                onClick={() => setShowAllRecs(!showAllRecs)}
              >
                {showAllRecs ? 'Show less ▲' : 'See all ▼'}
              </span>
            </div>
            
            {(showAllRecs ? recommendationsList : recommendationsList.slice(0, 1)).map((rec, i) => (
              <div 
                key={i} 
                className="clickable-list-row"
                style={{ cursor: 'pointer' }}
                onClick={() => handleSendMessage(null, `How can I ${rec.title.toLowerCase()}?`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className={`icon-badge ${rec.badge}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={rec.d} /></svg>
                  </div>
                  <div className="widget-item-content">
                    <h5 className="widget-item-title">{rec.title}</h5>
                    <p className="widget-item-subtext">{rec.sub}</p>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            ))}
          </div>

          {/* Popular Questions */}
          <div className="widget-box">
            <div className="widget-header">
              <h4 className="widget-title">Popular Questions</h4>
              <span 
                className="see-all-link"
                onClick={() => setShowAllQuestions(!showAllQuestions)}
              >
                {showAllQuestions ? 'Show less ▲' : 'See all ▼'}
              </span>
            </div>
            {(showAllQuestions ? questionsList : questionsList.slice(0, 1)).map((q, i) => (
              <button 
                key={i} 
                type="button" 
                onClick={() => handleSendMessage(null, q)} 
                className="suggested-btn"
              >
                <span className="suggested-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </span>
                <span className="popular-question-text">{q}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* SAVED CHAT HISTORY DRAWER MODAL */}
      {showHistoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end'
        }} onClick={() => setShowHistoryModal(false)}>
          <div style={{
            width: '320px',
            height: '100%',
            backgroundColor: '#ffffff',
            boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
            padding: '20px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A' }}>Saved Conversations</h3>
              <button 
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {chatSessions.length === 0 ? (
                <p style={{ color: '#94A3B8', textAlign: 'center', fontSize: '0.875rem' }}>No saved conversations yet.</p>
              ) : (
                chatSessions.map((session) => (
                  <div 
                    key={session.id}
                    onClick={() => loadChatSession(session)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: session.id === currentSessionId ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                      backgroundColor: session.id === currentSessionId ? '#F5F3FF' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.875rem', color: '#1E293B' }}>{session.title || 'Conversation'}</h5>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{session.date || 'Today'}</span>
                    </div>

                    <button 
                      onClick={(e) => deleteChatSession(e, session.id)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                      title="Delete chat"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={startNewChat}
              style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#7C3AED',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              + Start New Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}