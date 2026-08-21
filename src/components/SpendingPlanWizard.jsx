import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SpendingPlanWizard.css';
import { notify } from "../utils/notificationService";

// Inside your budget submit handler:
// notify("Spending Plan Updated", `Allocated ₦${amount} across ${categories.length} categories`, "spending");
// ─── AI API Keys (same pattern used on the Calendar page) ───
const GROQ_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_GROQ_API_KEY) ||
  '';

const GEMINI_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_GEMINI_API_KEY) ||
  '';

// ─── Canonical storage keys — MUST match Dashboard.jsx ───
const BUDGET_KEY = 'user_budget';
const SAVED_PLANS_KEY = 'user_spending_plans';

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

export default function SpendingPlanWizard() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('wizard'); // 'wizard' or 'saved'
  const [step, setStep] = useState(1);
  const [planName, setPlanName] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('Monthly');

  // Saved Plans & Active Plan State
  const [savedPlans, setSavedPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);

  // Edit Mode State for Saved Plans
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanAmount, setEditPlanAmount] = useState('');
  const [editPlanDuration, setEditPlanDuration] = useState('Monthly');
  const [editCategories, setEditCategories] = useState([]);

  // Floating AI Chat State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your Spending AI Advisor with full control of this page. You can ask me questions or command me to perform actions (e.g., "Create a plan for 250k", "Delete plan [Name]", "Set budget to 150000", "Change duration to Weekly", or "Switch to saved plans").'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const chatMessagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);

  // Load plans on mount
  useEffect(() => {
    const plansFromStorage = JSON.parse(localStorage.getItem(SAVED_PLANS_KEY) || '[]');
    const currentActive = JSON.parse(localStorage.getItem(BUDGET_KEY) || 'null');

    setSavedPlans(plansFromStorage);
    if (currentActive && currentActive.id) {
      setActivePlanId(currentActive.id);
    }
  }, []);

  // Auto scroll chat to bottom - FIXED
  useEffect(() => {
    if (isAiOpen && chatMessagesEndRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 50);
    }
  }, [chatMessages, isAiTyping, isAiOpen]);

  // Safe numeric calculation
  const numericAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;

  // Dynamic budget calculations based on target percentages
  const allocations = [
    { name: 'Needs', percent: 40, color: '#4F46E5', desc: 'Essentials like rent, food, transport, etc.' },
    { name: 'Wants', percent: 20, color: '#EC4899', desc: 'Lifestyle, eating out, entertainment, etc.' },
    { name: 'Savings', percent: 20, color: '#F97316', desc: 'Emergency fund and financial security.' },
    { name: 'Investments', percent: 10, color: '#10B981', desc: 'Grow your money for the future.' },
    { name: 'Others', percent: 10, color: '#3B82F6', desc: 'Miscellaneous and unplanned expenses.' },
  ].map((item) => ({
    ...item,
    val: numericAmount * (item.percent / 100),
  }));

  const formatCurrency = (val) => {
    return '₦' + (val || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const handleNext = () => {
    if (step === 1 && numericAmount <= 0) {
      alert('Please enter or select a valid amount.');
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const syncPlansToStorage = (updatedPlans) => {
    setSavedPlans(updatedPlans);
    localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(updatedPlans));
    window.dispatchEvent(new Event('storage'));
  };

  // Save new plan and mark as active
  const handleSaveAndActivatePlan = (customPlan = null) => {
    let newPlan = customPlan;

    if (!newPlan) {
      const needsVal = allocations.find((a) => a.name === 'Needs')?.val || 0;
      const wantsVal = allocations.find((a) => a.name === 'Wants')?.val || 0;
      const savingsVal = allocations.find((a) => a.name === 'Savings')?.val || 0;
      const investVal = allocations.find((a) => a.name === 'Investments')?.val || 0;

      newPlan = {
        id: 'plan_' + Date.now(),
        name: planName.trim() || `${duration} Plan (${formatCurrency(numericAmount)})`,
        totalBudget: numericAmount,
        planned: needsVal + wantsVal,
        savings: savingsVal + investVal,
        available: numericAmount,
        spent: 0,
        duration: duration,
        createdAt: new Date().toLocaleDateString(),
        categories: allocations.map((a) => ({
          name: a.name,
          amount: a.val,
          spent: 0,
          color: a.color,
        })),
      };
    }

    const updatedPlans = [...savedPlans, newPlan];
    setSavedPlans(updatedPlans);
    localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(updatedPlans));

    localStorage.setItem(BUDGET_KEY, JSON.stringify(newPlan));
    setActivePlanId(newPlan.id);
    window.dispatchEvent(new Event('storage'));

    return newPlan;
  };

  // --- SAVED PLAN EDITING HANDLERS ---
  const handleStartEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setEditPlanName(plan.name);
    setEditPlanAmount(plan.totalBudget);
    setEditPlanDuration(plan.duration || 'Monthly');
    
    const categoriesWithSpent = (plan.categories || allocations.map(a => ({
      name: a.name,
      amount: plan.totalBudget * (a.percent / 100),
      color: a.color
    }))).map(cat => ({
      ...cat,
      spent: cat.spent || 0
    }));

    setEditCategories(categoriesWithSpent);
  };

  const handleCategorySpentChange = (catName, newSpentVal) => {
    const parsedVal = parseFloat(newSpentVal) || 0;
    setEditCategories(prev =>
      prev.map(cat => (cat.name === catName ? { ...cat, spent: parsedVal } : cat))
    );
  };

  const handleSaveEditedPlan = (planId) => {
    const newTotal = parseFloat(editPlanAmount) || 0;
    
    const updatedCategories = editCategories.map((cat) => {
      const allocationConfig = allocations.find(a => a.name === cat.name);
      const percent = allocationConfig ? allocationConfig.percent : 20;
      return {
        ...cat,
        amount: newTotal * (percent / 100),
        spent: parseFloat(cat.spent) || 0
      };
    });

    const totalSpent = updatedCategories.reduce((sum, cat) => sum + cat.spent, 0);

    const needsVal = updatedCategories.find((c) => c.name === 'Needs')?.amount || 0;
    const wantsVal = updatedCategories.find((c) => c.name === 'Wants')?.amount || 0;
    const savingsVal = updatedCategories.find((c) => c.name === 'Savings')?.amount || 0;
    const investVal = updatedCategories.find((c) => c.name === 'Investments')?.amount || 0;

    const updatedPlans = savedPlans.map((plan) => {
      if (plan.id === planId) {
        const updated = {
          ...plan,
          name: editPlanName.trim() || plan.name,
          totalBudget: newTotal,
          duration: editPlanDuration,
          planned: needsVal + wantsVal,
          savings: savingsVal + investVal,
          spent: totalSpent,
          available: newTotal - totalSpent,
          categories: updatedCategories,
        };

        if (activePlanId === planId) {
          localStorage.setItem(BUDGET_KEY, JSON.stringify(updated));
        }

        return updated;
      }
      return plan;
    });

    syncPlansToStorage(updatedPlans);
    setEditingPlanId(null);
  };

  const handleSetActivePlan = (plan) => {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(plan));
    setActivePlanId(plan.id);
    window.dispatchEvent(new Event('storage'));
  };

  const handleDeletePlan = (planId) => {
    const updated = savedPlans.filter((p) => p.id !== planId);
    syncPlansToStorage(updated);
    if (activePlanId === planId) {
      localStorage.removeItem(BUDGET_KEY);
      setActivePlanId(null);
    }
    window.dispatchEvent(new Event('storage'));
  };

  // ─── AI CONTEXT + ACTION EXECUTION ───

  const buildAiContext = () => ({
    step,
    viewMode,
    draftAmount: numericAmount,
    draftDuration: duration,
    savedPlans: savedPlans.map((p) => ({
      name: p.name,
      totalBudget: p.totalBudget,
      duration: p.duration,
      spent: p.spent || 0,
      available: p.available ?? p.totalBudget,
      isActive: p.id === activePlanId,
    })),
  });

  const buildSystemPrompt = (context) => `You are the AI Spending Plan Assistant embedded inside a budgeting app page. You can answer questions AND control the page for the user.

Current page state (JSON): ${JSON.stringify(context)}

You must reply with ONLY raw JSON (no markdown fences, no extra commentary) in exactly this shape:
{"reply": "short, personalized, conversational answer", "action": null}
or
{"reply": "short, personalized confirmation of what you did", "action": {"type": "CREATE_PLAN", "amount": 250000, "name": "My Plan", "duration": "Monthly"}}

Valid action types: "CREATE_PLAN", "DELETE_PLAN", "SET_ACTIVE_PLAN", "SET_AMOUNT", "SET_DURATION", "SWITCH_VIEW".
- CREATE_PLAN needs "amount" (number), optionally "name" and "duration".
- DELETE_PLAN and SET_ACTIVE_PLAN need "name" matched to the closest saved plan name in the state above.
- SET_AMOUNT needs "amount" (number).
- SET_DURATION needs "duration", one of Daily/Weekly/Monthly/Yearly.
- SWITCH_VIEW needs "view", one of "wizard" or "saved".
- Only include an action when the user is clearly asking you to perform it. Otherwise "action" must be null.
- Base your reply strictly on the real numbers in the state above. Never invent figures.`;

  const findPlanByName = (name) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    return (
      savedPlans.find((p) => p.name.toLowerCase().includes(lower)) ||
      (savedPlans.length === 1 ? savedPlans[0] : null)
    );
  };

  const executeAction = (action) => {
    if (!action || !action.type) return;

    switch (action.type) {
      case 'CREATE_PLAN': {
        const amt = Number(action.amount) || numericAmount;
        if (amt > 0) {
          handleSaveAndActivatePlan({
            id: 'plan_' + Date.now(),
            name: action.name || `${action.duration || duration} Plan (${formatCurrency(amt)})`,
            totalBudget: amt,
            planned: amt * 0.6,
            savings: amt * 0.3,
            available: amt,
            spent: 0,
            duration: action.duration || duration || 'Monthly',
            createdAt: new Date().toLocaleDateString(),
            categories: allocations.map((a) => ({
              name: a.name,
              amount: amt * (a.percent / 100),
              spent: 0,
              color: a.color,
            })),
          });
          setViewMode('saved');
        }
        break;
      }
      case 'DELETE_PLAN': {
        const target = findPlanByName(action.name);
        if (target) handleDeletePlan(target.id);
        break;
      }
      case 'SET_ACTIVE_PLAN': {
        const target = findPlanByName(action.name);
        if (target) handleSetActivePlan(target);
        break;
      }
      case 'SET_AMOUNT': {
        if (action.amount) setAmount(String(action.amount));
        break;
      }
      case 'SET_DURATION': {
        if (action.duration) setDuration(action.duration);
        break;
      }
      case 'SWITCH_VIEW': {
        if (action.view) setViewMode(action.view);
        break;
      }
      default:
        break;
    }
  };

  // --- FULL INTERACTIVE AI COMMAND HANDLER ---
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
          text: "I couldn't reach the AI service right now. Please check your Groq or Gemini API key, or try again in a moment.",
        },
      ]);
    }

    setIsAiTyping(false);
  };

  return (
    <div className="spw-container">
      {/* HEADER BANNER */}
      <div className="advisor-header-wrapper">
        <span className="overview-label">SPENDING PLAN</span>
        <div className="advisor-header-card">
          <div>
            <h1 className="advisor-page-title">Custom Spending Plans</h1>
            <p className="advisor-page-subtitle">
              Create, customize, edit, and track multiple spending strategies with AI assistance.
            </p>
          </div>
          <div className="spw-view-toggle">
            <button 
              className={`spw-toggle-btn ${viewMode === 'wizard' ? 'active' : ''}`}
              onClick={() => setViewMode('wizard')}
            >
              + Create Plan
            </button>
            <button 
              className={`spw-toggle-btn ${viewMode === 'saved' ? 'active' : ''}`}
              onClick={() => setViewMode('saved')}
            >
              My Saved Plans ({savedPlans.length})
            </button>
          </div>
        </div>
      </div>

      {/* SAVED PLANS VIEW */}
      {viewMode === 'saved' ? (
        <div className="spw-saved-container">
          {savedPlans.length === 0 ? (
            <div className="spw-empty-state">
              <span className="spw-empty-icon">📂</span>
              <h3>No Spending Plans Saved Yet</h3>
              <p>Create your first plan to start tracking custom allocations on your dashboard.</p>
              <button className="spw-btn spw-btn-primary" onClick={() => setViewMode('wizard')}>
                Create New Plan →
              </button>
            </div>
          ) : (
            <div className="spw-saved-grid">
              {savedPlans.map((plan) => {
                const isActive = activePlanId === plan.id;
                const isEditing = editingPlanId === plan.id;

                return (
                  <div key={plan.id} className={`spw-saved-card ${isActive ? 'active-plan' : ''}`}>
                    {isActive && <span className="spw-active-tag">Active Dashboard Plan</span>}

                    {isEditing ? (
                      <div className="spw-edit-plan-form">
                        <label>Plan Title</label>
                        <input
                          type="text"
                          className="spw-text-input"
                          value={editPlanName}
                          onChange={(e) => setEditPlanName(e.target.value)}
                        />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <label>Total Budget (₦)</label>
                            <input
                              type="number"
                              className="spw-text-input"
                              value={editPlanAmount}
                              onChange={(e) => setEditPlanAmount(e.target.value)}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label>Duration</label>
                            <select
                              className="spw-text-input"
                              value={editPlanDuration}
                              onChange={(e) => setEditPlanDuration(e.target.value)}
                            >
                              <option value="Daily">Daily</option>
                              <option value="Weekly">Weekly</option>
                              <option value="Monthly">Monthly</option>
                              <option value="Yearly">Yearly</option>
                            </select>
                          </div>
                        </div>

                        {/* SECTION SPENT TRACKER EDITING */}
                        <div className="spw-edit-spent-section" style={{ marginTop: '16px' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Edit Spent Amount per Section:</h4>
                          {editCategories.map((cat) => (
                            <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '500' }}>{cat.name}:</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '12px' }}>₦</span>
                                <input
                                  type="number"
                                  className="spw-text-input"
                                  style={{ width: '90px', padding: '4px 8px' }}
                                  value={cat.spent}
                                  onChange={(e) => handleCategorySpentChange(cat.name, e.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="spw-saved-actions" style={{ marginTop: '16px' }}>
                          <button className="spw-btn spw-btn-primary" onClick={() => handleSaveEditedPlan(plan.id)}>
                            Save Changes
                          </button>
                          <button className="spw-btn spw-btn-outline" onClick={() => setEditingPlanId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3>{plan.name}</h3>
                        <p className="spw-saved-amount">{formatCurrency(plan.totalBudget)} <span>/ {plan.duration}</span></p>
                        
                        <div className="spw-saved-details">
                          <div><span>Total Spent:</span> <strong style={{ color: '#EF4444' }}>{formatCurrency(plan.spent || 0)}</strong></div>
                          <div><span>Remaining:</span> <strong style={{ color: '#10B981' }}>{formatCurrency(plan.available ?? plan.totalBudget)}</strong></div>
                        </div>

                        {/* Category Spent Breakdown */}
                        {plan.categories && plan.categories.length > 0 && (
                          <div style={{ margin: '12px 0', borderTop: '1px solid #E5E7EB', paddingTop: '8px' }}>
                            {plan.categories.map((c) => (
                              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', margin: '2px 0' }}>
                                <span>{c.name}</span>
                                <span>Spent: {formatCurrency(c.spent || 0)} / {formatCurrency(c.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="spw-saved-actions">
                          <button className="spw-btn spw-btn-outline" onClick={() => handleStartEditPlan(plan)}>
                            Edit Spent / Plan
                          </button>
                          {!isActive && (
                            <button className="spw-btn spw-btn-outline" onClick={() => handleSetActivePlan(plan)}>
                              Set Active
                            </button>
                          )}
                          <button className="spw-btn-danger" onClick={() => handleDeletePlan(plan.id)}>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* WIZARD BUILDER VIEW */
        <div className="spw-main-content">
          
          {/* STEP 1: AMOUNT & NAME */}
          {step === 1 && (
            <div className="spw-grid">
              <div className="spw-card spw-primary-panel">
                <h2>How much money do you have?</h2>
                <p className="spw-subtitle">Enter the total amount you want to plan.</p>

                <div className="spw-form-group">
                  <label>Plan Name (Optional)</label>
                  <input
                    type="text"
                    className="spw-text-input"
                    placeholder="e.g. Monthly Income, Side Hustle Budget"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                  />
                </div>

                <div className="spw-form-group">
                  <label>Total Amount</label>
                  <div className="spw-input-wrapper">
                    <span className="spw-currency-symbol">₦</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    {amount && (
                      <button className="spw-clear-btn" onClick={() => setAmount('')}>✕</button>
                    )}
                  </div>
                </div>

                <div className="spw-preset-chips">
                  {[50000, 100000, 200000].map((preset) => (
                    <button
                      key={preset}
                      className={`spw-chip ${numericAmount === preset ? 'active' : ''}`}
                      onClick={() => setAmount(preset.toString())}
                    >
                      {formatCurrency(preset)}
                    </button>
                  ))}
                </div>

                <div className="spw-info-banner">
                  <div className="spw-icon-circle">💡</div>
                  <p>This amount will help our AI advisor create the best plan for you.</p>
                </div>

                <div className="spw-actions">
                  <button className="spw-btn spw-btn-primary" onClick={handleNext}>
                    Continue →
                  </button>
                </div>
              </div>

              <div className="spw-card spw-sidebar-panel">
                <div className="spw-sidebar-header">
                  <span className="spw-sidebar-icon">🎯</span>
                  <h3>Why this matters</h3>
                </div>
                <p className="spw-sidebar-desc">
                  Knowing your total amount helps the AI advisor allocate your money across needs, wants, savings, and investments in the best way possible.
                </p>
                <ul className="spw-check-list">
                  <li>✓ Get a personalized plan</li>
                  <li>✓ Track your spending</li>
                  <li>✓ Reach your financial goals faster</li>
                </ul>
                <div className="spw-illustration-box">
                  <div className="spw-bot-avatar">🤖</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DURATION */}
          {step === 2 && (
            <div className="spw-grid">
              <div className="spw-card spw-primary-panel">
                <h2>Choose a duration</h2>
                <p className="spw-subtitle">For how long do you want this spending plan?</p>

                <div className="spw-duration-grid">
                  {[
                    { key: 'Daily', icon: '☀️', desc: 'Plan your day to day spending' },
                    { key: 'Weekly', icon: '📅', desc: 'Plan your week efficiently' },
                    { key: 'Monthly', icon: '🗓️', desc: 'Most popular choice', popular: true },
                    { key: 'Yearly', icon: '📆', desc: 'Plan your entire year' }
                  ].map((item) => (
                    <div
                      key={item.key}
                      className={`spw-duration-card ${duration === item.key ? 'selected' : ''}`}
                      onClick={() => setDuration(item.key)}
                    >
                      {duration === item.key && <span className="spw-check-badge">✓</span>}
                      <div className="spw-duration-icon">{item.icon}</div>
                      <h4>{item.key}</h4>
                      <p>{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="spw-info-banner">
                  <div className="spw-icon-circle">📅</div>
                  <p>A {duration.toLowerCase()} plan gives you a balanced view of your income, bills, expenses, and savings.</p>
                </div>

                <div className="spw-summary-box">
                  <h4>Summary</h4>
                  <div className="spw-summary-row">
                    <span>Total Amount</span>
                    <strong>{formatCurrency(numericAmount)}</strong>
                  </div>
                  <div className="spw-summary-row">
                    <span>Duration</span>
                    <strong>{duration}</strong>
                  </div>
                </div>

                <div className="spw-actions spw-actions-split">
                  <button className="spw-btn spw-btn-secondary" onClick={handleBack}>
                    Back
                  </button>
                  <button className="spw-btn spw-btn-primary" onClick={handleNext}>
                    Continue →
                  </button>
                </div>
              </div>

              <div className="spw-card spw-sidebar-panel">
                <div className="spw-sidebar-header">
                  <span className="spw-sidebar-icon">⏱️</span>
                  <h3>Why duration matters</h3>
                </div>
                <p className="spw-sidebar-desc">
                  The duration helps our AI advisor break down your money into manageable chunks and set realistic goals.
                </p>
                <ul className="spw-check-list">
                  <li>✓ See how much to spend each period</li>
                  <li>✓ Track your progress easily</li>
                  <li>✓ Adjust your plan anytime</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 3: GOALS & RECOMMENDATIONS */}
          {step === 3 && (
            <div className="spw-grid">
              <div className="spw-card spw-primary-panel">
                <div className="spw-panel-header">
                  <div>
                    <h2>✨ AI Recommended Plan</h2>
                    <p className="spw-subtitle">Your personalized {duration.toLowerCase()} spending breakdown.</p>
                  </div>
                </div>

                <div className="spw-table-wrapper">
                  <table className="spw-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Percentage</th>
                        <th>Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map((item) => (
                        <tr key={item.name}>
                          <td>
                            <span className="spw-cat-badge" style={{ backgroundColor: item.color }}></span>
                            {item.name}
                          </td>
                          <td><strong>{formatCurrency(item.val)}</strong></td>
                          <td>
                            <div className="spw-percent-bar-wrapper">
                              <span>{item.percent}%</span>
                              <div className="spw-bar-bg">
                                <div
                                  className="spw-bar-fill"
                                  style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="spw-purpose-text">{item.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="spw-metrics-grid">
                  <div className="spw-metric-card">
                    <span className="spw-metric-label">Total Amount</span>
                    <span className="spw-metric-val">{formatCurrency(numericAmount)}</span>
                  </div>
                  <div className="spw-metric-card">
                    <span className="spw-metric-label">Duration</span>
                    <span className="spw-metric-val">{duration}</span>
                  </div>
                  <div className="spw-metric-card">
                    <span className="spw-metric-label">Total Categories</span>
                    <span className="spw-metric-val">{allocations.length}</span>
                  </div>
                  <div className="spw-metric-card">
                    <span className="spw-metric-label">Goal</span>
                    <span className="spw-metric-val">Balanced Plan</span>
                  </div>
                </div>

                <div className="spw-rule-banner">
                  <div className="spw-icon-circle">⚡</div>
                  <p><strong>This plan follows custom allocation principles.</strong> Balanced across needs, wants, savings, investments, and miscellany.</p>
                </div>

                <div className="spw-actions spw-actions-split">
                  <button className="spw-btn spw-btn-secondary" onClick={handleBack}>
                    Back
                  </button>
                  <button className="spw-btn spw-btn-primary" onClick={handleNext}>
                    Continue to Your Plan →
                  </button>
                </div>
              </div>

              <div className="spw-card spw-sidebar-panel">
                <div className="spw-advisor-bubble">
                  <div className="spw-bot-avatar">🤖</div>
                  <div>
                    <h4>AI Advisor Says</h4>
                    <p className="spw-quote">"Great choice! This plan is balanced and sustainable. Stick to it and you'll reach your financial goals faster."</p>
                  </div>
                </div>

                <div className="spw-sidebar-summary">
                  <h4>Plan Summary</h4>
                  <div className="spw-summary-row"><span>Total Amount</span> <strong>{formatCurrency(numericAmount)}</strong></div>
                  <div className="spw-summary-row"><span>Plan Duration</span> <strong>{duration}</strong></div>
                  <div className="spw-summary-row"><span>Plan Type</span> <strong>AI Balanced Plan</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: FINAL OVERVIEW */}
          {step === 4 && (
            <div className="spw-grid">
              <div className="spw-card spw-primary-panel">
                <div className="spw-panel-header">
                  <div>
                    <h2>✨ Your Personalized Spending Plan</h2>
                    <p className="spw-subtitle">Your AI crafted plan summary and next steps.</p>
                  </div>
                </div>

                <div className="spw-preview-grid">
                  <div className="spw-summary-list">
                    <h4>Plan Breakdown</h4>
                    {allocations.map((item) => (
                      <div className="spw-breakdown-row" key={item.name}>
                        <span>
                          <span className="spw-cat-badge" style={{ backgroundColor: item.color }}></span>
                          {item.name}
                        </span>
                        <strong>{formatCurrency(item.val)}</strong>
                      </div>
                    ))}
                    <div className="spw-breakdown-total">
                      <span>Total Amount</span>
                      <strong>{formatCurrency(numericAmount)}</strong>
                    </div>
                  </div>
                </div>

                <div className="spw-actions spw-actions-split">
                  <button className="spw-btn spw-btn-secondary" onClick={handleBack}>
                    Back
                  </button>
                  <button className="spw-btn spw-btn-primary" onClick={() => handleSaveAndActivatePlan()}>
                    Save & Activate Plan →
                  </button>
                </div>
              </div>

              <div className="spw-card spw-sidebar-panel">
                <div className="spw-advisor-bubble">
                  <div className="spw-bot-avatar">🤖</div>
                  <div>
                    <h4>AI Advisor Says</h4>
                    <p className="spw-quote">"Save this plan to make it active on your dashboard!"</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FLOATING AI CHATBOT BUTTON & MODAL */}
      <div className="spw-floating-ai-wrapper">
        {isAiOpen && (
          <div className="spw-ai-chat-modal">
            <div className="spw-ai-modal-header">
              <div className="spw-ai-title">
                <span className="spw-ai-avatar">🤖</span>
                <div className="spw-ai-title-text">
                  <span className="spw-ai-title-main">AI Spending Advisor</span>
                  <span className="spw-ai-title-sub">Online</span>
                </div>
              </div>
              <button className="spw-ai-close-btn" onClick={() => setIsAiOpen(false)}>✕</button>
            </div>

            <div className="spw-ai-chat-body" ref={chatBodyRef}>
              <div className="spw-chat-date-divider">
                <span>Today</span>
              </div>
              {chatMessages.map((msg, index) => (
                <div key={index} className={`spw-chat-bubble-wrapper ${msg.sender}`}>
                  <div className={`spw-chat-bubble ${msg.sender}`}>
                    {msg.sender === 'bot' && <span className="spw-chat-avatar">🤖</span>}
                    <div className="spw-chat-bubble-content">
                      <p>{msg.text}</p>
                      <span className="spw-chat-timestamp">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="spw-chat-bubble-wrapper bot">
                  <div className="spw-chat-bubble bot typing">
                    <span className="spw-chat-avatar">🤖</span>
                    <div className="spw-typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatMessagesEndRef} style={{ height: '1px', minHeight: '1px' }} />
            </div>

            <div className="spw-ai-chat-input-row">
              <input
                type="text"
                placeholder="Ask or command the AI..."
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
          className={`spw-floating-ai-btn ${isAiOpen ? 'open' : ''}`} 
          onClick={() => setIsAiOpen(!isAiOpen)}
        >
          {isAiOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <>
              <span className="spw-floating-ai-icon">🤖</span>
              <span className="spw-floating-ai-label">AI Advisor</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}