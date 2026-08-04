import React, { useState, useEffect, useRef } from 'react';
import './SavingsPlan.css';

// ─── AI API Keys (same pattern used on the Calendar / Spending Plan pages) ───
const GROQ_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_GROQ_API_KEY) ||
  '';

const GEMINI_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_GEMINI_API_KEY) ||
  '';

// ─── Canonical storage key — MUST match Dashboard.jsx ───
const SAVINGS_KEY = 'user_savings_plans';

// ─── Generic AI caller: Groq first, Gemini fallback ───
async function callFinanceAI(systemPrompt, userText) {
  if (GROQ_API_KEY) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText },
          ],
          temperature: 0.4,
        }),
      });
      const data = await response.json();
      if (response.ok && data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      console.warn('Groq failed, trying Gemini...', data?.error);
    } catch (err) {
      console.warn('Groq error, trying Gemini:', err);
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${userText}` }] }],
          }),
        }
      );
      const data = await response.json();
      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
      console.error('Gemini fallback failed:', data?.error);
    } catch (err) {
      console.error('Gemini fallback error:', err);
    }
  }

  return null;
}

// ─── Parse the model's JSON reply, tolerating markdown fences / stray text ───
function parseAiJson(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export default function SavingsPlan() {
  // Main State for Plans
  const [savingsPlans, setSavingsPlans] = useState([]);

  // New Plan Form State
  const [planTitle, setPlanTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('General');

  // Plan Editing State
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editDate, setEditDate] = useState('');

  // Deposit Modal State
  const [depositModalPlanId, setDepositModalPlanId] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Custom Confirmation / Alert Modal States
  const [deleteModalPlanId, setDeleteModalPlanId] = useState(null);
  const [notificationMsg, setNotificationMsg] = useState(null);

  // AI Auto-Save Settings
  const [autoSaveMode, setAutoSaveMode] = useState('surplus'); // 'surplus', 'daily', 'proportional'
  const [surplusRate, setSurplusRate] = useState(30);

  // Floating AI Chat State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: 'Hi! I am your Savings Assistant with full control of this page. Ask me questions or command me (e.g., "Add 5000 to New Laptop", "Create a goal for a bike, target 100000", "Delete goal [Name]", "Run auto save").',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // ─── Auto-scroll ref & effect ───
  const chatMessagesEndRef = useRef(null);

  useEffect(() => {
    if (isAiOpen && chatMessagesEndRef.current) {
      setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 50);
    }
  }, [chatMessages, isAiTyping, isAiOpen]);

  // Load from localStorage or start empty (no default goal injection)
  useEffect(() => {
    const rawData = localStorage.getItem(SAVINGS_KEY);
    if (rawData !== null) {
      setSavingsPlans(JSON.parse(rawData));
    } else {
      setSavingsPlans([]);
      localStorage.setItem(SAVINGS_KEY, JSON.stringify([]));
    }
  }, []);

  // Sync with LocalStorage and Notify Dashboard Component Immediately
  const syncPlansToStorage = (updatedPlans) => {
    setSavingsPlans(updatedPlans);
    localStorage.setItem(SAVINGS_KEY, JSON.stringify(updatedPlans));
    window.dispatchEvent(new Event('storage'));
  };

  const formatCurrency = (val) => {
    return '₦' + (parseFloat(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Create Plan
  const handleCreatePlan = (e) => {
    e.preventDefault();
    const target = parseFloat(targetAmount) || 0;
    if (!planTitle.trim() || target <= 0) {
      setNotificationMsg('Please enter a valid title and target amount.');
      return;
    }

    const newPlan = {
      id: 'sp_' + Date.now(),
      title: planTitle.trim(),
      targetAmount: target,
      currentAmount: 0,
      targetDate: targetDate || '2026-12-31',
      category: category,
    };

    const updated = [...savingsPlans, newPlan];
    syncPlansToStorage(updated);

    setPlanTitle('');
    setTargetAmount('');
    setTargetDate('');
    setNotificationMsg(`"${newPlan.title}" has been successfully created!`);
  };

  // Start Editing
  const handleStartEdit = (plan) => {
    setEditingPlanId(plan.id);
    setEditTitle(plan.title);
    setEditTarget(plan.targetAmount);
    setEditDate(plan.targetDate);
  };

  // Save Edit
  const handleSaveEdit = (planId) => {
    const updated = savingsPlans.map((plan) => {
      if (plan.id === planId) {
        return {
          ...plan,
          title: editTitle.trim() || plan.title,
          targetAmount: parseFloat(editTarget) || plan.targetAmount,
          targetDate: editDate || plan.targetDate,
        };
      }
      return plan;
    });

    syncPlansToStorage(updated);
    setEditingPlanId(null);
  };

  // Add Deposit
  const handleAddDeposit = (planId) => {
    const val = parseFloat(depositAmount);
    if (!val || val <= 0) {
      setNotificationMsg('Please enter a valid deposit amount.');
      return;
    }

    const updated = savingsPlans.map((plan) => {
      if (plan.id === planId) {
        return { ...plan, currentAmount: plan.currentAmount + val };
      }
      return plan;
    });

    syncPlansToStorage(updated);
    setDepositModalPlanId(null);
    setDepositAmount('');
    setNotificationMsg(`Added ${formatCurrency(val)} to your savings!`);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = () => {
    if (deleteModalPlanId) {
      const updated = savingsPlans.filter((p) => p.id !== deleteModalPlanId);
      syncPlansToStorage(updated);
      setDeleteModalPlanId(null);
    }
  };

  const handleDeleteGoalById = (planId) => {
    const updated = savingsPlans.filter((p) => p.id !== planId);
    syncPlansToStorage(updated);
    if (deleteModalPlanId === planId) setDeleteModalPlanId(null);
  };

  // Smart Auto-Save Handler
  const handleExecuteAutoSave = () => {
    if (savingsPlans.length === 0) {
      setNotificationMsg('Create a goal first before running Auto-Save!');
      return;
    }

    const userBudget = JSON.parse(localStorage.getItem('user_budget') || '{}');
    const availableCash = userBudget.available || 50000;

    let updatedPlans = [...savingsPlans];
    let totalAllocated = 0;

    if (autoSaveMode === 'surplus') {
      const allocableCash = availableCash * (surplusRate / 100);
      const activeGoals = updatedPlans.filter((p) => p.currentAmount < p.targetAmount);

      if (activeGoals.length > 0 && allocableCash > 0) {
        const perGoalShare = allocableCash / activeGoals.length;
        updatedPlans = updatedPlans.map((plan) => {
          if (plan.currentAmount < plan.targetAmount) {
            const added = Math.min(perGoalShare, plan.targetAmount - plan.currentAmount);
            totalAllocated += added;
            return { ...plan, currentAmount: plan.currentAmount + added };
          }
          return plan;
        });
      }
    } else if (autoSaveMode === 'daily') {
      updatedPlans = updatedPlans.map((plan) => {
        const remainingGoal = plan.targetAmount - plan.currentAmount;
        if (remainingGoal > 0) {
          const targetD = new Date(plan.targetDate);
          const now = new Date();
          const diffDays = Math.max(1, Math.ceil((targetD - now) / (1000 * 60 * 60 * 24)));
          const dailyRequired = Math.min(remainingGoal, Math.ceil(remainingGoal / diffDays));

          totalAllocated += dailyRequired;
          return { ...plan, currentAmount: plan.currentAmount + dailyRequired };
        }
        return plan;
      });
    } else if (autoSaveMode === 'proportional') {
      const totalGap = updatedPlans.reduce((sum, p) => sum + Math.max(0, p.targetAmount - p.currentAmount), 0);

      if (totalGap > 0 && availableCash > 0) {
        const pool = availableCash * 0.2;
        updatedPlans = updatedPlans.map((plan) => {
          const gap = Math.max(0, plan.targetAmount - plan.currentAmount);
          if (gap > 0) {
            const added = Math.min(gap, (gap / totalGap) * pool);
            totalAllocated += added;
            return { ...plan, currentAmount: plan.currentAmount + added };
          }
          return plan;
        });
      }
    }

    syncPlansToStorage(updatedPlans);
    setNotificationMsg(`Auto-Save Done! Added ${formatCurrency(totalAllocated)} across your savings goals.`);
  };

  // ─── AI CONTEXT + ACTION EXECUTION ───

  const buildAiContext = () => ({
    autoSaveMode,
    surplusRate,
    goals: savingsPlans.map((p) => ({
      name: p.title,
      targetAmount: p.targetAmount,
      currentAmount: p.currentAmount,
      targetDate: p.targetDate,
      category: p.category,
    })),
  });

  const buildSystemPrompt = (context) => `You are the AI Savings Plan Assistant embedded inside a personal finance app page. You can answer questions AND control the page for the user.

Current page state (JSON): ${JSON.stringify(context)}

Reply with ONLY raw JSON (no markdown fences, no extra commentary) in exactly this shape:
{"reply": "short personalized conversational answer", "action": null}
or
{"reply": "short personalized confirmation of what you did", "action": {"type": "ADD_DEPOSIT", "name": "New Laptop", "amount": 5000}}

Valid action types: "ADD_DEPOSIT", "CREATE_GOAL", "DELETE_GOAL", "EDIT_GOAL", "RUN_AUTOSAVE", "SET_AUTOSAVE_MODE".
- ADD_DEPOSIT needs "name" (closest matching goal title from the state above) and "amount" (number).
- CREATE_GOAL needs "name" and "amount" (target amount), optionally "targetDate" (YYYY-MM-DD) and "category".
- DELETE_GOAL needs "name".
- EDIT_GOAL needs "name" and any of "amount" (new target) or "targetDate".
- RUN_AUTOSAVE takes no extra params.
- SET_AUTOSAVE_MODE needs "mode", one of "surplus"/"daily"/"proportional", and optionally "rate" (5-50).
- Only include an action when the user clearly asks for it, otherwise "action" must be null.
- Base your reply strictly on the real numbers in the state above; never invent figures.`;

  const findGoalByName = (name) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    return (
      savingsPlans.find((p) => p.title.toLowerCase().includes(lower)) ||
      (savingsPlans.length === 1 ? savingsPlans[0] : null)
    );
  };

  const executeAction = (action) => {
    if (!action || !action.type) return;

    switch (action.type) {
      case 'ADD_DEPOSIT': {
        const target = findGoalByName(action.name);
        const amt = Number(action.amount);
        if (target && amt > 0) {
          const updated = savingsPlans.map((p) =>
            p.id === target.id ? { ...p, currentAmount: p.currentAmount + amt } : p
          );
          syncPlansToStorage(updated);
        }
        break;
      }
      case 'CREATE_GOAL': {
        const amt = Number(action.amount);
        if (action.name && amt > 0) {
          const newPlan = {
            id: 'sp_' + Date.now(),
            title: action.name,
            targetAmount: amt,
            currentAmount: 0,
            targetDate: action.targetDate || '2026-12-31',
            category: action.category || 'General',
          };
          syncPlansToStorage([...savingsPlans, newPlan]);
        }
        break;
      }
      case 'DELETE_GOAL': {
        const target = findGoalByName(action.name);
        if (target) handleDeleteGoalById(target.id);
        break;
      }
      case 'EDIT_GOAL': {
        const target = findGoalByName(action.name);
        if (target) {
          const updated = savingsPlans.map((p) =>
            p.id === target.id
              ? {
                  ...p,
                  targetAmount: action.amount ? Number(action.amount) : p.targetAmount,
                  targetDate: action.targetDate || p.targetDate,
                }
              : p
          );
          syncPlansToStorage(updated);
        }
        break;
      }
      case 'RUN_AUTOSAVE': {
        handleExecuteAutoSave();
        break;
      }
      case 'SET_AUTOSAVE_MODE': {
        if (action.mode) setAutoSaveMode(action.mode);
        if (action.rate) setSurplusRate(Number(action.rate));
        break;
      }
      default:
        break;
    }
  };

  // AI Assistant Command Receiver
  const handleSendAiMessage = async () => {
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');
    setIsAiTyping(true);

    const context = buildAiContext();
    const systemPrompt = buildSystemPrompt(context);
    const rawReply = await callFinanceAI(systemPrompt, userText);
    const parsed = parseAiJson(rawReply);

    if (parsed && parsed.reply) {
      if (parsed.action) {
        executeAction(parsed.action);
      }
      setChatMessages((prev) => [...prev, { sender: 'bot', text: parsed.reply }]);
    } else if (rawReply) {
      // Model replied with plain text instead of the JSON contract — show it as-is.
      setChatMessages((prev) => [...prev, { sender: 'bot', text: rawReply }]);
    } else {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: "I couldn't reach the AI service right now. Please check your Groq or Gemini API key, or try again shortly.",
        },
      ]);
    }

    setIsAiTyping(false);
  };

  return (
    <div className="sp-container">
      {/* BREADCRUMB */}
      <div className="sp-overview-tag">Overview</div>

      {/* CALENDAR-STYLE HEADER */}
      <header className="sp-header">
        <div className="sp-header-title">
          <h2>Savings Plan</h2>
          <p className="sp-subtitle">Track, edit, and automatically grow your savings goals in one place.</p>
        </div>
        <div className="sp-header-actions">
          <button className="sp-btn sp-btn-auto" onClick={handleExecuteAutoSave}>
            ⚡ Run Auto-Save
          </button>
        </div>
      </header>

      {/* SMART AUTO-SAVE CONTROL PANEL */}
      <div className="sp-card sp-autosave-card">
        <div className="sp-autosave-header">
          <h3>💡 Smart Auto-Save</h3>
          <span className="sp-tag-badge">Automatic Savings</span>
        </div>
        <div className="sp-autosave-grid">
          <div className="sp-form-group">
            <label>Choose How You Want to Auto-Save</label>
            <select className="sp-select" value={autoSaveMode} onChange={(e) => setAutoSaveMode(e.target.value)}>
              <option value="surplus">Save Extra Cash (% of Leftover Money)</option>
              <option value="daily">Daily Goal Saver (Divide Goal by Remaining Days)</option>
              <option value="proportional">Smart Priority Split (Give More Money to Bigger Goals)</option>
            </select>
          </div>

          {autoSaveMode === 'surplus' && (
            <div className="sp-form-group">
              <label>Percentage of Leftover Cash to Save: {surplusRate}%</label>
              <input
                type="range"
                min="5"
                max="50"
                value={surplusRate}
                onChange={(e) => setSurplusRate(e.target.value)}
                className="sp-range-slider"
              />
            </div>
          )}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="sp-main-grid">
        {/* CREATE GOAL FORM */}
        <div className="sp-card">
          <h3>+ Create New Goal</h3>
          <form onSubmit={handleCreatePlan} className="sp-form">
            <div className="sp-form-group">
              <label>Goal Title</label>
              <input
                type="text"
                className="sp-input"
                placeholder="e.g. New Laptop, Vacation"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
              />
            </div>

            <div className="sp-form-group">
              <label>Target Amount (₦)</label>
              <input
                type="number"
                className="sp-input"
                placeholder="e.g. 250000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </div>

            <div className="sp-form-group">
              <label>Target Date</label>
              <input
                type="date"
                className="sp-input"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="sp-form-group">
              <label>Category</label>
              <select className="sp-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="General">General</option>
                <option value="Investment">Investment</option>
                <option value="Gadgets / Purchase">Gadgets / Purchase</option>
                <option value="Vacation / Travel">Vacation / Travel</option>
                <option value="Emergency Fund">Emergency Fund</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button type="submit" className="sp-btn sp-btn-primary">
              Create Goal
            </button>
          </form>
        </div>

        {/* GOALS LIST */}
        <div className="sp-card">
          <h3>Your Savings Goals ({savingsPlans.length})</h3>
          <div className="sp-plans-list">
            {savingsPlans.length === 0 ? (
              <p className="sp-empty-text">No active goals yet. Create one to start saving!</p>
            ) : (
              savingsPlans.map((plan) => {
                const percent = Math.min(100, Math.round((plan.currentAmount / (plan.targetAmount || 1)) * 100));
                const isEditing = editingPlanId === plan.id;

                return (
                  <div key={plan.id} className="sp-plan-card">
                    {isEditing ? (
                      /* INLINE EDIT FORM */
                      <div className="sp-edit-form">
                        <label>Title</label>
                        <input
                          type="text"
                          className="sp-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />

                        <label style={{ marginTop: '8px' }}>Target Amount (₦)</label>
                        <input
                          type="number"
                          className="sp-input"
                          value={editTarget}
                          onChange={(e) => setEditTarget(e.target.value)}
                        />

                        <label style={{ marginTop: '8px' }}>Target Date</label>
                        <input
                          type="date"
                          className="sp-input"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                        />

                        <div className="sp-card-actions" style={{ marginTop: '12px' }}>
                          <button className="sp-btn sp-btn-primary" onClick={() => handleSaveEdit(plan.id)}>
                            Save Changes
                          </button>
                          <button className="sp-btn sp-btn-secondary" onClick={() => setEditingPlanId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* GOAL CARD DETAILS */
                      <>
                        <div className="sp-plan-header">
                          <div>
                            <h4>{plan.title}</h4>
                            <span className="sp-category-pill">{plan.category}</span>
                          </div>
                          <span className="sp-percent-text">{percent}%</span>
                        </div>

                        <div className="sp-progress-bar-bg">
                          <div className="sp-progress-bar-fill" style={{ width: `${percent}%` }}></div>
                        </div>

                        <div className="sp-plan-details">
                          <div>
                            <span>Saved: </span>
                            <strong>{formatCurrency(plan.currentAmount)}</strong>
                          </div>
                          <div>
                            <span>Target: </span>
                            <strong>{formatCurrency(plan.targetAmount)}</strong>
                          </div>
                        </div>

                        <div className="sp-card-actions">
                          <button className="sp-btn sp-btn-secondary" onClick={() => setDepositModalPlanId(plan.id)}>
                            + Add Money
                          </button>
                          <button className="sp-btn sp-btn-outline" onClick={() => handleStartEdit(plan)}>
                            Edit
                          </button>
                          <button className="sp-btn-danger" onClick={() => setDeleteModalPlanId(plan.id)}>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* DEPOSIT MODAL */}
      {depositModalPlanId && (
        <div className="sp-modal-overlay">
          <div className="sp-modal">
            <h3>Add Saved Money</h3>
            <p>Enter the amount you want to add to this goal.</p>
            <input
              type="number"
              className="sp-input"
              placeholder="Enter amount (₦)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <div className="sp-modal-actions">
              <button className="sp-btn sp-btn-primary" onClick={() => handleAddDeposit(depositModalPlanId)}>
                Confirm Deposit
              </button>
              <button className="sp-btn sp-btn-secondary" onClick={() => setDepositModalPlanId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE POPUP MODAL */}
      {deleteModalPlanId && (
        <div className="sp-modal-overlay">
          <div className="sp-modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this savings goal? This action cannot be undone.</p>
            <div className="sp-modal-actions">
              <button className="sp-btn sp-btn-danger" onClick={handleConfirmDelete}>
                Delete Goal
              </button>
              <button className="sp-btn sp-btn-secondary" onClick={() => setDeleteModalPlanId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM NOTIFICATION POPUP MODAL */}
      {notificationMsg && (
        <div className="sp-modal-overlay">
          <div className="sp-modal">
            <h3>Notice</h3>
            <p>{notificationMsg}</p>
            <div className="sp-modal-actions">
              <button className="sp-btn sp-btn-primary" onClick={() => setNotificationMsg(null)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING AI ADVISOR */}
      <div className="sp-floating-ai-wrapper">
        {isAiOpen && (
          <div className="sp-ai-chat-modal">
            <div className="sp-ai-modal-header">
              <div className="sp-ai-title">
                <span className="sp-ai-avatar">🤖</span>
                <div className="sp-ai-title-text">
                  <span className="sp-ai-title-main">Savings Assistant</span>
                  <span className="sp-ai-title-sub">Online</span>
                </div>
              </div>
              <button className="sp-ai-close-btn" onClick={() => setIsAiOpen(false)}>✕</button>
            </div>

            <div className="sp-ai-chat-body">
              <div className="sp-chat-date-divider"><span>Today</span></div>
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`sp-chat-bubble-wrapper ${msg.sender}`}>
                  <div className={`sp-chat-bubble ${msg.sender}`}>
                    {msg.sender === 'bot' && <span className="sp-chat-avatar">🤖</span>}
                    <div className="sp-chat-bubble-content">
                      <p>{msg.text}</p>
                      <span className="sp-chat-timestamp">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="sp-chat-bubble-wrapper bot">
                  <div className="sp-chat-bubble bot typing">
                    <span className="sp-chat-avatar">🤖</span>
                    <div className="sp-typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatMessagesEndRef} style={{ height: '1px', minHeight: '1px' }} />
            </div>

            <div className="sp-ai-chat-input-row">
              <input
                type="text"
                placeholder='e.g. "Add 5000 to New Laptop"...'
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
              />
              <button
                onClick={handleSendAiMessage}
                disabled={!inputMsg.trim()}
                className={inputMsg.trim() ? 'active' : ''}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        )}

        <button
          className={`sp-floating-ai-btn ${isAiOpen ? 'open' : ''}`}
          onClick={() => setIsAiOpen(!isAiOpen)}
        >
          {isAiOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <>
              <span className="sp-floating-ai-icon">🤖</span>
              <span className="sp-floating-ai-label">AI Advisor</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}