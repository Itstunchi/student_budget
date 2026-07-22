// src/BudgetAdvisor.jsx
import React, { useState, useRef, useEffect } from 'react';
import './BudgetAdvisor.css'; 

export default function BudgetAdvisor() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the latest message whenever messages update or the bot starts/stops typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 1. Paste your Groq API key here (starts with 'gsk_')
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY; // Use Vite's environment variable for Groq
  // 2. Paste your Gemini API key here (used only if Groq fails)
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Use Vite's environment variable for Gemini

  const SYSTEM_PROMPT = "You are BudgetBuddy Advisor, an expert AI financial bot helping students manage budgets in Nigeria. Keep answers structured and short and always give well structured options to pick from when you ask a question when necessary.";

  // Primary provider: Groq (fast Llama model)
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
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: query }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("Groq returned an empty response.");
    }
    return text;
  };

  // Fallback provider: Gemini 2.5 Flash — only called if Groq fails
  const callGemini = async (query) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: query }] }]
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }
    return text;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = inputValue;
    setInputValue('');
    setLoading(true);

    let botResponseText;
    let usedFallback = false;

    try {
      // Try Groq first
      botResponseText = await callGroq(currentQuery);
    } catch (groqError) {
      console.warn("Groq call failed, falling back to Gemini 2.5 Flash:", groqError.message);
      try {
        // Fall back to Gemini if Groq fails for any reason
        botResponseText = await callGemini(currentQuery);
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

  return (
    <div className="budget-container">
      
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div>
          <div className="logo-section">
            <div className="logo-square">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="6" width="18" height="14" rx="3"></rect>
                <path d="M3 10h18"></path>
                <path d="M7 15h4"></path>
              </svg>
            </div>
            <div>
              <h1 className="logo-title">BudgetBuddy</h1>
              <span className="logo-sub">Smart Money Advisor</span>
            </div>
          </div>

          <nav className="nav-links">
            {[
              { label: 'Dashboard', d: 'M3 11.5L12 4l9 7.5M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9' },
              { label: 'Spending Plan', d: 'M3 7h18M3 7v12a1 1 0 001 1h16a1 1 0 001-1V7M3 7l2-4h14l2 4M9 12h6' },
              { label: 'Savings Plan', d: 'M12 21s7-3.7 7-10V5.5L12 3 5 5.5V11c0 6.3 7 10 7 10z M9.5 11.5l1.7 1.7 3.3-3.4' },
              { label: 'Invest Plan', d: 'M4 19h16M6 15l4-5 3 3 5-7M14 6h4v4' },
              { label: 'Bills & Reminders', d: 'M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM9.5 15l1.7 1.7L15 13' },
              { label: 'Calendar', d: 'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18' },
              { label: 'Insights', d: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8' },
              { label: 'Reports', d: 'M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v5h5M9 13h6M9 17h6' },
              { label: 'Ask Advisor', d: 'M21 12a8 8 0 01-11.6 7.1L4 20l1.2-4.3A8 8 0 1121 12z', active: true },
              { label: 'Settings', d: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' }
            ].map((item, idx) => (
              <button key={idx} className={`nav-btn ${item.active ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.d} />
                </svg>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="upgrade-card">
            <div className="robot-container">
              <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
                <circle cx="14" cy="12" r="1.6" fill="#C4B5FD"/>
                <circle cx="54" cy="16" r="1.2" fill="#C4B5FD"/>
                <circle cx="50" cy="8" r="1" fill="#A78BFA"/>
                <path d="M32 6v6" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="32" cy="4" r="2" fill="#7C3AED"/>
                <rect x="16" y="14" width="32" height="26" rx="9" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="2"/>
                <circle cx="25" cy="27" r="3" fill="#7C3AED"/>
                <circle cx="39" cy="27" r="3" fill="#7C3AED"/>
                <path d="M25 34c2.5 2 9.5 2 12 0" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
                <rect x="10" y="24" width="5" height="9" rx="2.5" fill="#7C3AED"/>
                <rect x="49" y="24" width="5" height="9" rx="2.5" fill="#7C3AED"/>
                <path d="M22 46c3 3 17 3 20 0" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h4>Your AI financial buddy</h4>
            <p>Get personalized advice and answers to your money questions.</p>
            <button className="upgrade-btn">Upgrade to Premium</button>
          </div>

          <div className="profile-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="profile-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <h4 className="profile-name">Malvin</h4>
                <p className="profile-role">Student</p>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <main className="main-content">
        <header className="chat-header">
          <div>
            <h2>Ask Advisor</h2>
            <p>Get smart financial advice tailored to your goals.</p>
          </div>
          <div className="header-actions">
            <button className="bell-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span className="bell-badge">3</span>
            </button>
            <button className="action-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>
              Ask New Question
            </button>
          </div>
        </header>

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
                    BudgetBuddy Advisor <span className="ai-tag">AI</span>
                    <span className="online-dot">● Online</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>Here to help you make smarter financial decisions.</p>
                </div>
              </div>
              <button className="tips-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                View Tips Library
              </button>
            </div>

            <div className="message-logs">
              {messages.length === 0 ? (
                <div className="welcome-placeholder">
                  <div className="empty-chat-graphic">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  <h4>Welcome back, Malvin</h4>
                  <p>Your workspace is ready. Ask any question below to plan or review your budget limits.</p>
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
                        <div className="msg-bubble">{msg.text}</div>
                        <p className="msg-time">{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {loading && <div className="typing-status">Advisor is writing...</div>}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="input-panel">
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
            <div className="widget-box">
              <div className="widget-header">
                <h4 className="widget-title">Advisor Insights for You</h4>
                <select className="widget-select"><option>This Month</option></select>
              </div>
              
              <div className="insight-row">
                <div className="icon-badge green-bg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                </div>
                <div>
                  <h5 className="row-title">You saved ₦30,000</h5>
                  <p className="row-sub">20% more than last month ↗</p>
                </div>
              </div>

              <div className="insight-row">
                <div className="icon-badge purple-bg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
                </div>
                <div>
                  <h5 className="row-title">Your expenses decreased</h5>
                  <p className="row-sub">8% compared to last month ↘</p>
                </div>
              </div>

              <div className="insight-row">
                <div className="icon-badge orange-bg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                </div>
                <div>
                  <h5 className="row-title">On track with 2 goals</h5>
                  <p className="row-sub">Keep up the great work! 🎉</p>
                </div>
              </div>
            </div>

            <div className="widget-box">
              <div className="widget-header">
                <h4 className="widget-title">Top Recommendations</h4>
                <span className="see-all-link">See all</span>
              </div>
              
              {[
                { title: 'Build an Emergency Fund', sub: 'Start with ₦10,000 this month', badge: 'green-bg', d: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 100 12 6 6 0 000-12zm0 4a2 2 0 100 4 2 2 0 000-4z' },
                { title: 'Reduce Food Expenses', sub: 'You can save up to ₦15,000', badge: 'pink-bg', d: 'M12 21s-7.5-4.6-10-9.3C.6 8 2.4 4.5 6 4c2-.3 3.8.7 6 3 2.2-2.3 4-3.3 6-3 3.6.5 5.4 4 4 7.7C19.5 16.4 12 21 12 21z' },
                { title: 'Invest in a Mutual Fund', sub: 'Start investing with as little as ₦1,000', badge: 'purple-bg', d: 'M4 19h16M6 15l4-5 3 3 5-7M14 6h4v4' }
              ].map((rec, i) => (
                <div key={i} className="clickable-list-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className={`icon-badge ${rec.badge}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={rec.d} /></svg>
                    </div>
                    <div>
                      <h5 className="row-title">{rec.title}</h5>
                      <p className="row-sub">{rec.sub}</p>
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              ))}
            </div>

            <div className="widget-box">
              <div className="widget-header">
                <h4 className="widget-title">Popular Questions</h4>
                <span className="see-all-link">See all</span>
              </div>
              {[
                'How do I create a budget?',
                'What is the 50/30/20 rule?',
                'How can I improve my credit score?',
                'Best ways to save money as a student'
              ].map((q, i) => (
                <button key={i} type="button" onClick={() => setInputValue(q)} className="suggested-btn">
                  <span className="suggested-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>
                  </span>
                  {q}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
