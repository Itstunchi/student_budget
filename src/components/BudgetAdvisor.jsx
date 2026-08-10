import React, { useState, useRef, useEffect } from 'react';
import './BudgetAdvisor.css';
import { notify } from '../utils/notificationService';

export default function BudgetAdvisor() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Chat History States
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // User Identity & Deep App Insights
  const [userName, setUserName] = useState('User');
  const [userKey, setUserKey] = useState('default');
  const [appData, setAppData] = useState({
    totalSavings: 0,
    totalExpenses: 0,
    unpaidBillsCount: 0,
    savingsPlans: [],
    bills: [],
    spendingPlans: []
  });

  // Helper to safely parse amounts containing currency symbols (₦, $), commas, or extra text
  const parseAmount = (val) => {
    if (!val) return 0;
    const cleanStr = String(val).replace(/[^0-9.]/g, '');
    return parseFloat(cleanStr) || 0;
  };

  // Helper to notify ALL components & active tabs in real-time
  const notifyAppUpdate = () => {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("user_spending_plans_updated"));
    window.dispatchEvent(new Event("appDataChanged"));
    window.dispatchEvent(new Event("billsUpdated"));
  };

  // Dynamic storage key generation for per-account isolation
  const getChatHistoryKey = (identifier) => {
    const safeId = (identifier || 'default').toLowerCase().replace(/\s+/g, '_');
    return `budget_advisor_chat_history_${safeId}`;
  };

  // Load App Data & Account-Isolated Chats
  const loadWorkspaceData = () => {
    const savedUser = localStorage.getItem('user') || localStorage.getItem('user_profile');
    const savedName = localStorage.getItem('user_name');
    
    let currentName = 'User';
    let currentId = 'default';

    if (savedUser) {
      try {
        const parsed = typeof savedUser === 'string' && savedUser.startsWith('{')
          ? JSON.parse(savedUser)
          : { fullName: savedUser };
        currentName = parsed.fullName || parsed.name || parsed.username || 'User';
        currentId = parsed.id || parsed.email || parsed.username || currentName;
      } catch (e) {
        currentName = 'User';
        currentId = 'default';
      }
    } else if (savedName) {
      currentName = savedName;
      currentId = savedName;
    }

    setUserName(currentName);
    setUserKey(currentId);

    const savedBills = JSON.parse(localStorage.getItem('user_bills') || '[]');
    const savedExpenses = JSON.parse(localStorage.getItem('user_expenses') || '[]');
    const savedSavings = JSON.parse(localStorage.getItem('user_savings_plans') || localStorage.getItem('user_savings') || '[]');
    const savedSpending = JSON.parse(localStorage.getItem('user_spending_plans') || '[]');

    const totalExp = savedExpenses.reduce((sum, item) => sum + parseAmount(item.amount), 0);
    const totalSav = savedSavings.reduce((sum, item) => sum + parseAmount(item.targetAmount || item.target || item.amount), 0);
    const unpaidCount = savedBills.filter(b => b.status === 'Unpaid' || !b.paid).length;

    setAppData({
      totalSavings: totalSav,
      totalExpenses: totalExp,
      unpaidBillsCount: unpaidCount,
      savingsPlans: savedSavings,
      bills: savedBills,
      spendingPlans: savedSpending
    });

    const storageKey = getChatHistoryKey(currentId);
    const savedSessions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setChatSessions(savedSessions);

    if (savedSessions.length > 0) {
      const latest = savedSessions[0];
      setCurrentSessionId(latest.id);
      setMessages(latest.messages || []);
    } else {
      const newId = Date.now();
      setCurrentSessionId(newId);
      setMessages([]);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
    window.addEventListener('storage', loadWorkspaceData);
    window.addEventListener('appDataChanged', loadWorkspaceData);
    window.addEventListener('user_spending_plans_updated', loadWorkspaceData);
    return () => {
      window.removeEventListener('storage', loadWorkspaceData);
      window.removeEventListener('appDataChanged', loadWorkspaceData);
      window.removeEventListener('user_spending_plans_updated', loadWorkspaceData);
    };
  }, []);

  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return;

    const storageKey = getChatHistoryKey(userKey);

    setChatSessions((prevSessions) => {
      const updated = prevSessions.map((session) => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: messages,
            lastUpdated: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            title: session.title === 'New Conversation' && messages.length > 0 
              ? (messages[0].text.length > 30 ? messages[0].text.substring(0, 30) + '...' : messages[0].text) 
              : session.title
          };
        }
        return session;
      });

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

      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [messages, currentSessionId, userKey]);

  const startNewChat = () => {
    const newId = Date.now();
    setCurrentSessionId(newId);
    setMessages([]);
    setShowHistoryModal(false);
  };

  const loadChatSession = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setShowHistoryModal(false);
  };

  const deleteChatSession = (e, sessionId) => {
    e.stopPropagation();
    const storageKey = getChatHistoryKey(userKey);
    const updated = chatSessions.filter((s) => s.id !== sessionId);
    setChatSessions(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    if (sessionId === currentSessionId) {
      if (updated.length > 0) {
        setCurrentSessionId(updated[0].id);
        setMessages(updated[0].messages || []);
      } else {
        startNewChat();
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const getSystemPrompt = () => `You are Buddy AI, an autonomous financial engine and controller for Nigerian students.
Current User: ${userName}
Live Context:
- Total Savings Portfolio: ₦${appData.totalSavings.toLocaleString()}
- Total Recorded Expenses: ₦${appData.totalExpenses.toLocaleString()}
- Unpaid Bills: ${appData.unpaidBillsCount} active
- Active Savings Goals: ${appData.savingsPlans.length}
- Active Spending Plans: ${appData.spendingPlans.length}

ALL-ROUND TASK EXECUTION COMMANDS:
When creating or deleting data, ALWAYS output the structured tag at the end of your response:
1. [ACTION:ADD_SPENDING|PlanName|Amount]
2. [ACTION:DELETE_SPENDING]
3. [ACTION:ADD_SAVINGS|GoalName|Amount]
4. [ACTION:DELETE_SAVINGS]
5. [ACTION:ADD_BILL|BillName|Amount|DueDate]
6. [ACTION:DELETE_BILLS]`;

  // Local Storage Action Dispatcher
  const executeAiTask = (botResponseText, userQueryText = "") => {
    try {
      const textToAnalyze = `${botResponseText} ${userQueryText}`.toLowerCase();
      const isAddSpending = textToAnalyze.includes('add_spending') || (textToAnalyze.includes('spending plan') && (textToAnalyze.includes('add') || textToAnalyze.includes('create')));

      // 1. ADD SPENDING PLAN
      if (isAddSpending) {
        let planName = 'Books';
        let parsedBudget = parseAmount(userQueryText) || parseAmount(botResponseText);

        // Extract clean name, removing labels like "PlanName=" or "name="
        const tagMatch = botResponseText.match(/\[ACTION:ADD_SPENDING\s*\|\s*(.*?)\s*\|\s*(.*?)\]/i);
        if (tagMatch) {
          if (tagMatch[1]) {
            planName = tagMatch[1]
              .replace(/planname\s*=\s*/gi, '')
              .replace(/name\s*=\s*/gi, '')
              .replace(/[^a-zA-Z0-9\s]/g, '')
              .trim();
          }
          if (tagMatch[2]) parsedBudget = parseAmount(tagMatch[2]) || parsedBudget;
        } else {
          const nameMatch = userQueryText.match(/for\s+([a-zA-Z0-9\s]+)/i);
          if (nameMatch) {
            planName = nameMatch[1]
              .replace(/planname\s*=\s*/gi, '')
              .replace(/name\s*=\s*/gi, '')
              .trim();
          }
        }

        if (!planName || planName === '') planName = 'Custom Plan';

        // Complete 5-category breakdown matching SpendingPlan page
        const needsBudget = Math.round(parsedBudget * 0.30);
        const wantsBudget = Math.round(parsedBudget * 0.20);
        const savingsBudget = Math.round(parsedBudget * 0.20);
        const investmentsBudget = Math.round(parsedBudget * 0.15);
        const othersBudget = Math.round(parsedBudget * 0.15);

        const current = JSON.parse(localStorage.getItem('user_spending_plans') || '[]');

        const newPlan = {
          id: Date.now(),
          name: planName,
          title: planName,
          category: planName,
          planName: planName,
          budget: parsedBudget,
          amount: parsedBudget,
          totalAmount: parsedBudget,
          totalBudget: parsedBudget,
          monthlyBudget: parsedBudget,
          limit: parsedBudget,
          period: 'Monthly',
          frequency: 'Monthly',
          type: 'Custom',
          totalSpent: 0,
          spent: 0,
          isActive: false,
          categoryBreakdown: [
            { category: 'Needs', spent: 0, budget: needsBudget },
            { category: 'Wants', spent: 0, budget: wantsBudget },
            { category: 'Savings', spent: 0, budget: savingsBudget },
            { category: 'Investments', spent: 0, budget: investmentsBudget },
            { category: 'Others', spent: 0, budget: othersBudget }
          ],
          categories: {
            Needs: { budget: needsBudget, spent: 0 },
            Wants: { budget: wantsBudget, spent: 0 },
            Savings: { budget: savingsBudget, spent: 0 },
            Investments: { budget: investmentsBudget, spent: 0 },
            Others: { budget: othersBudget, spent: 0 }
          }
        };

        current.push(newPlan);
        localStorage.setItem('user_spending_plans', JSON.stringify(current));

        notify("Spending Plan Added", `Created '${planName}' plan with ₦${parsedBudget.toLocaleString()}`, "success");
        notifyAppUpdate();
        loadWorkspaceData();
        return;
      }

      // 2. DELETE SPENDING PLANS
      if (textToAnalyze.includes('delete_spending') || (textToAnalyze.includes('clear') && textToAnalyze.includes('spending'))) {
        localStorage.setItem('user_spending_plans', JSON.stringify([]));
        localStorage.removeItem('active_spending_plan');
        localStorage.removeItem('active_plan_id');
        notify("Spending Plans Cleared", "Removed all active spending plans", "info");
        notifyAppUpdate();
        loadWorkspaceData();
      }

      // 3. ADD SAVINGS GOAL
      if (textToAnalyze.includes('add_savings') || textToAnalyze.includes('savings goal')) {
        let name = 'Savings Goal';
        let target = parseAmount(userQueryText) || parseAmount(botResponseText);

        const match = botResponseText.match(/\[ACTION:ADD_SAVINGS\s*\|\s*(.*?)\s*\|\s*(.*?)\]/i);
        if (match) {
          if (match[1]) name = match[1].replace(/goalname\s*=\s*/gi, '').replace(/name\s*=\s*/gi, '').trim();
          if (match[2]) target = parseAmount(match[2]) || target;
        }

        const savings = JSON.parse(localStorage.getItem('user_savings_plans') || '[]');
        savings.push({ 
          id: Date.now(), 
          title: name, 
          name: name, 
          targetAmount: target, 
          target: target,
          amount: 0 
        });
        localStorage.setItem('user_savings_plans', JSON.stringify(savings));
        notify("Savings Goal Created", `Targeting ₦${target.toLocaleString()} for '${name}'`, "savings");
        notifyAppUpdate();
        loadWorkspaceData();
      }

      // 4. DELETE SAVINGS GOALS
      if (textToAnalyze.includes('delete_savings')) {
        localStorage.setItem('user_savings_plans', JSON.stringify([]));
        notify("Savings Cleared", "Cleared all active savings goals", "info");
        notifyAppUpdate();
        loadWorkspaceData();
      }

      // 5. ADD BILL / REMINDER
      if (textToAnalyze.includes('add_bill') || textToAnalyze.includes('bill')) {
        let name = 'Bill';
        let amount = parseAmount(userQueryText) || parseAmount(botResponseText);
        let date = 'Upcoming';

        const match = botResponseText.match(/\[ACTION:ADD_BILL\s*\|\s*(.*?)\s*\|\s*(.*?)(?:\s*\|\s*(.*?))?\]/i);
        if (match) {
          if (match[1]) name = match[1].replace(/billname\s*=\s*/gi, '').replace(/name\s*=\s*/gi, '').trim();
          if (match[2]) amount = parseAmount(match[2]) || amount;
          if (match[3]) date = match[3].trim();
        }

        const bills = JSON.parse(localStorage.getItem('user_bills') || '[]');
        bills.push({ 
          id: Date.now(), 
          title: name, 
          name: name, 
          amount: amount, 
          dueDate: date, 
          status: 'Unpaid' 
        });
        localStorage.setItem('user_bills', JSON.stringify(bills));
        notify("Bill Reminder Scheduled", `Set '${name}' for ₦${amount.toLocaleString()}`, "bill");
        notifyAppUpdate();
        loadWorkspaceData();
      }

      // 6. DELETE BILLS
      if (textToAnalyze.includes('delete_bills')) {
        localStorage.setItem('user_bills', JSON.stringify([]));
        notify("Bills Cleared", "Cleared all bill reminders", "info");
        notifyAppUpdate();
        loadWorkspaceData();
      }
    } catch (e) {
      console.error("Error executing AI action:", e);
    }
  };

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
    return data.choices?.[0]?.message?.content || "";
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
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
    try {
      botResponseText = await callGroq(queryToSend);
    } catch (groqError) {
      try {
        botResponseText = await callGemini(queryToSend);
      } catch (geminiError) {
        botResponseText = "⚠️ AI services unreachable. Check your network or API keys.";
      }
    }

    executeAiTask(botResponseText, queryToSend);

    const cleanedText = botResponseText.replace(/\[ACTION:.*?\]/gi, '').trim();

    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      sender: 'bot',
      text: cleanedText || "Task processed successfully!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setLoading(false);
  };

  const questionsList = [
    'Add spending plan ₦15,000 for Food',
    'Set a savings goal of ₦50,000 for Laptop',
    'Add a bill for Data subscription ₦5,000 due Friday',
    'Clear all my spending plans'
  ];

  return (
    <div className="budget-container">
      {/* HEADER SECTION */}
      <div className="advisor-header-wrapper">
        <span className="overview-label">Overview</span>
        
        <div className="advisor-header-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="advisor-page-title">Buddy AI Controller</h1>
            <p className="advisor-page-subtitle">Your central autonomous assistant for all financial tasks.</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setShowHistoryModal(true)} 
              className="tips-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 16 14"></polyline>
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
                  Buddy <span className="ai-tag">AI Engine</span>
                  <span className="online-dot">● Active</span>
                </h3>
                <p className="bot-info-subtext">Manage plans, goals, and bills across your entire application.</p>
              </div>
            </div>
          </div>

          <div className="message-logs">
            {messages.length === 0 ? (
              <div className="welcome-placeholder">
                <div className="empty-chat-graphic">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <h4 className="welcome-heading">Welcome, {userName}!</h4>
                <p className="welcome-subtext">Ask me to add spending plans, create savings goals, or set bill reminders.</p>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center' }}><span className="time-pill">Today</span></div>
                {messages.map((msg) => (
                  <div key={msg.id} className={`msg-row ${msg.sender === 'user' ? 'user-msg' : 'bot-msg'}`}>
                    {msg.sender === 'bot' && (
                      <div className="chat-avatar-frame">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2">
                          <rect x="4" y="9" width="16" height="11" rx="4"/>
                          <circle cx="9.5" cy="14.5" r="1" fill="#7C3AED"/>
                          <circle cx="14.5" cy="14.5" r="1" fill="#7C3AED"/>
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
            {loading && <div className="typing-status">Buddy AI is working...</div>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={(e) => handleSendMessage(e)} className="input-panel">
            <div className="input-container">
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Command Buddy AI (e.g. Add spending plan ₦15000 for Books)..."
                className="chat-input"
              />
              <button type="submit" disabled={!inputValue.trim()} className="send-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT PANELS */}
        <aside className="right-panel">
          <div className="widget-box">
            <div className="widget-header">
              <h4 className="widget-title">Live Account Overview</h4>
            </div>
            
            <div className="insight-row">
              <div className="icon-badge green-bg">₦</div>
              <div className="widget-item-content">
                <h5 className="widget-item-title">Savings Target: ₦{appData.totalSavings.toLocaleString()}</h5>
                <p className="widget-item-subtext">{appData.savingsPlans.length} active goal(s)</p>
              </div>
            </div>

            <div className="insight-row">
              <div className="icon-badge purple-bg">📉</div>
              <div className="widget-item-content">
                <h5 className="widget-item-title">Total Expenses: ₦{appData.totalExpenses.toLocaleString()}</h5>
                <p className="widget-item-subtext">Recorded expenses</p>
              </div>
            </div>

            <div className="insight-row">
              <div className="icon-badge orange-bg">🔔</div>
              <div className="widget-item-content">
                <h5 className="widget-item-title">{appData.unpaidBillsCount} Pending Bills</h5>
                <p className="widget-item-subtext">{appData.unpaidBillsCount === 0 ? 'All clear! 🎉' : 'Needs attention'}</p>
              </div>
            </div>
          </div>

          {/* Quick Action Commands */}
          <div className="widget-box">
            <div className="widget-header">
              <h4 className="widget-title">Quick Commands</h4>
            </div>
            {questionsList.map((q, i) => (
              <button 
                key={i} 
                type="button" 
                onClick={() => handleSendMessage(null, q)} 
                className="suggested-btn"
              >
                <span className="suggested-icon">⚡</span>
                <span className="popular-question-text">{q}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* SAVED CHAT HISTORY DRAWER MODAL */}
      {showHistoryModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1000,
          display: 'flex', justifyContent: 'flex-end'
        }} onClick={() => setShowHistoryModal(false)}>
          <div style={{
            width: '320px', height: '100%', backgroundColor: '#ffffff',
            boxShadow: '-4px 0 12px rgba(0,0,0,0.1)', padding: '20px',
            display: 'flex', flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A' }}>Saved Conversations</h3>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
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
                      padding: '12px', borderRadius: '8px',
                      border: session.id === currentSessionId ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                      backgroundColor: session.id === currentSessionId ? '#F5F3FF' : '#FFFFFF',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.875rem', color: '#1E293B' }}>{session.title || 'Conversation'}</h5>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{session.date || 'Today'}</span>
                    </div>
                    <button onClick={(e) => deleteChatSession(e, session.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>🗑️</button>
                  </div>
                ))
              )}
            </div>

            <button onClick={startNewChat} style={{
              marginTop: '15px', padding: '10px', backgroundColor: '#7C3AED',
              color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', width: '100%'
            }}>
              + New Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}