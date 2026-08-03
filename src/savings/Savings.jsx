import React, { useState, useEffect } from 'react';
import './SavingsPlan.css';

// Helper to convert hex (#6c3df4) to RGB format (108, 61, 244)
const hexToRgb = (hex) => {
  if (!hex) return "108, 61, 244";
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "108, 61, 244";
};

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
      text: 'Hi! I am your Savings Assistant. Ask me to add money or update goals (e.g., "Add 5000 to New Laptop" or "Run auto save").',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Synchronize Primary Accent Color across theme updates
  useEffect(() => {
    const applySavedTheme = () => {
      const savedColor = localStorage.getItem('primary_theme_color') || '#6c3df4';
      const rgbValue = hexToRgb(savedColor);

      document.documentElement.style.setProperty('--primary-color', savedColor);
      document.documentElement.style.setProperty('--primary-color-rgb', rgbValue);
      document.body.style.setProperty('--primary-color', savedColor);
      document.body.style.setProperty('--primary-color-rgb', rgbValue);
    };

    applySavedTheme();
    window.addEventListener('themeChange', applySavedTheme);
    return () => window.removeEventListener('themeChange', applySavedTheme);
  }, []);

  // Load from localStorage or start empty (no default goal injection)
  useEffect(() => {
    const rawData = localStorage.getItem('user_savings_plans');
    if (rawData !== null) {
      setSavingsPlans(JSON.parse(rawData));
    } else {
      setSavingsPlans([]);
      localStorage.setItem('user_savings_plans', JSON.stringify([]));
    }
  }, []);

  // Sync with LocalStorage and Notify Dashboard Component Immediately
  const syncPlansToStorage = (updatedPlans) => {
    setSavingsPlans(updatedPlans);
    localStorage.setItem('user_savings_plans', JSON.stringify(updatedPlans));
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

  // AI Assistant Command Receiver
  const handleSendAiMessage = () => {
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');
    setIsAiTyping(true);

    const lowerText = userText.toLowerCase();

    if (lowerText.includes('add') || lowerText.includes('save') || lowerText.includes('deposit')) {
      const amountMatch = userText.match(/\d[\d,.]*/);
      if (amountMatch) {
        const val = parseFloat(amountMatch[0].replace(/,/g, ''));
        const foundPlan = savingsPlans.find((p) => lowerText.includes(p.title.toLowerCase()));

        if (foundPlan) {
          const updated = savingsPlans.map((p) => {
            if (p.id === foundPlan.id) {
              return { ...p, currentAmount: p.currentAmount + val };
            }
            return p;
          });
          syncPlansToStorage(updated);
          setIsAiTyping(false);
          setChatMessages((prev) => [
            ...prev,
            { sender: 'bot', text: `Added ${formatCurrency(val)} to your "${foundPlan.title}" savings goal!` },
          ]);
          return;
        }
      }
    }

    setTimeout(() => {
      setIsAiTyping(false);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `I can help you manage your plans. Try telling me "Add 5000 to my goal name" or "Run auto save"!`,
        },
      ]);
    }, 600);
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
          <button 
            className="sp-btn sp-btn-auto" 
            onClick={handleExecuteAutoSave}
            style={{ backgroundColor: "var(--primary-color)", color: "#ffffff" }}
          >
            ⚡ Run Auto-Save
          </button>
        </div>
      </header>

      {/* SMART AUTO-SAVE CONTROL PANEL */}
      <div className="sp-card sp-autosave-card">
        <div className="sp-autosave-header">
          <h3>💡 Smart Auto-Save</h3>
          <span className="sp-tag-badge" style={{ backgroundColor: "rgba(var(--primary-color-rgb), 0.15)", color: "var(--primary-color)" }}>
            Automatic Savings
          </span>
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
                style={{ accentColor: "var(--primary-color)" }}
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

            <button 
              type="submit" 
              className="sp-btn sp-btn-primary"
              style={{ backgroundColor: "var(--primary-color)", color: "#ffffff" }}
            >
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
                          <button 
                            className="sp-btn sp-btn-primary" 
                            onClick={() => handleSaveEdit(plan.id)}
                            style={{ backgroundColor: "var(--primary-color)", color: "#ffffff" }}
                          >
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
                            <span 
                              className="sp-category-pill"
                              style={{ backgroundColor: "rgba(var(--primary-color-rgb), 0.12)", color: "var(--primary-color)" }}
                            >
                              {plan.category}
                            </span>
                          </div>
                          <span className="sp-percent-text" style={{ color: "var(--primary-color)" }}>{percent}%</span>
                        </div>

                        <div className="sp-progress-bar-bg">
                          <div 
                            className="sp-progress-bar-fill" 
                            style={{ width: `${percent}%`, backgroundColor: "var(--primary-color)" }}
                          ></div>
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
                          <button 
                            className="sp-btn sp-btn-secondary" 
                            onClick={() => setDepositModalPlanId(plan.id)}
                            style={{ borderColor: "var(--primary-color)", color: "var(--primary-color)" }}
                          >
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
              <button 
                className="sp-btn sp-btn-primary" 
                onClick={() => handleAddDeposit(depositModalPlanId)}
                style={{ backgroundColor: "var(--primary-color)", color: "#ffffff" }}
              >
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
              <button 
                className="sp-btn sp-btn-primary" 
                onClick={() => setNotificationMsg(null)}
                style={{ backgroundColor: "var(--primary-color)", color: "#ffffff" }}
              >
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
            <div className="sp-ai-modal-header" style={{ backgroundColor: "var(--primary-color)" }}>
              <div className="sp-ai-title">
                <span>🤖 Savings Assistant</span>
              </div>
              <button className="sp-ai-close-btn" onClick={() => setIsAiOpen(false)}>
                ✕
              </button>
            </div>

            <div className="sp-ai-chat-messages">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`sp-ai-msg ${msg.sender}`}
                  style={msg.sender === 'user' ? { backgroundColor: "var(--primary-color)", color: "#ffffff" } : {}}
                >
                  {msg.text}
                </div>
              ))}
              {isAiTyping && <div className="sp-ai-msg bot">Updating your goals...</div>}
            </div>

            <div className="sp-ai-input-box">
              <input
                type="text"
                placeholder='e.g. "Add 5000 to New Laptop"...'
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
              />
              <button onClick={handleSendAiMessage} style={{ backgroundColor: "var(--primary-color)", color: "#ffffff" }}>
                Send
              </button>
            </div>
          </div>
        )}

        <button 
          className="sp-floating-ai-btn" 
          onClick={() => setIsAiOpen(!isAiOpen)}
          style={{ backgroundColor: "var(--primary-color)", color: "#ffffff" }}
        >
          🤖 AI Advisor
        </button>
      </div>
    </div>
  );
}