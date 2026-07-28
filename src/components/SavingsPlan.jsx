import React, { useState } from 'react';
import './SavingsPlan.css';

// SVG Icon Pack matching BudgetBuddy Design
const Icons = {
  PiggyBank: () => (
    <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="#5334EA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 5c-1.5 0-2.8.6-3.8 1.5C13.8 5.6 12 5 10 5 5 5 2 8.5 2 13c0 2.2.8 4.2 2.2 5.7L3 21h4l1.3-1.3c.5.2 1.1.3 1.7.3h4c2 0 3.8-.6 5.2-1.5 1-.9 1.8-2.2 1.8-3.5 1.5-.5 2.5-1.8 2.5-3.5C21.5 8.5 20 5 19 5z" />
      <circle cx="15" cy="9" r="1" fill="#5334EA" />
      <path d="M11 2v3M7 2.5L9 5" />
    </svg>
  ),
  Target: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  GoalCompletion: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  School: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
    </svg>
  ),
  Trip: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5c.8-.8.8-2 0-2.8s-2-.8-2.8 0L13 8.2 4.8 6.4c-.5-.1-.9.1-1.1.5l-.8 1.4c-.2.4-.1.9.3 1.1l5.4 3.6-3.1 3.1-2.3-.6c-.3-.1-.7 0-.9.3l-.6.9c-.2.3-.1.8.2 1l2.8 2 2 2.8c.2.3.7.4 1 .2l.9-.6c.3-.2.4-.6.3-.9l-.6-2.3 3.1-3.1 3.6 5.4c.2.4.7.5 1.1.3l1.4-.8c.4-.2.6-.6.5-1.1z" />
    </svg>
  ),
  Laptop: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="12" rx="2" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  Emergency: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  AskAdvisor: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  WalletAdd: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M4 6v12a2 2 0 002 2h14v-4" />
      <path d="M18 12a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Robot: () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="#5334EA">
      <path d="M12 2a1 1 0 011 1v1h2a3 3 0 013 3v2h1a2 2 0 012 2v6a2 2 0 01-2 2h-1v1a3 3 0 01-3 3H9a3 3 0 01-3-3v-1H5a2 2 0 01-2-2v-6a2 2 0 012-2h1V7a3 3 0 013-3h2V3a1 1 0 011-1zm0 7a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-4 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm8 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-6 6a1 1 0 000 2h4a1 1 0 100-2H10z" />
    </svg>
  )
};

export default function SavingsPlan({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('My Goals');
  const [goals, setGoals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Goal Form State
  const [newGoal, setNewGoal] = useState({
    title: '',
    target: '',
    dueDate: '',
    category: 'School'
  });

  // Calculate Aggregates
  const totalSaved = goals.reduce((acc, curr) => acc + (curr.saved || 0), 0);
  const totalTarget = goals.reduce((acc, curr) => acc + (curr.target || 0), 0);
  const overallCompletion = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const formatCurrency = (val) => {
    return '₦' + Number(val).toLocaleString();
  };

  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.target) {
      alert('Please fill in goal title and target amount.');
      return;
    }

    const categoryConfig = {
      School: { icon: <Icons.School />, color: '#5334EA', bgColor: '#EEF2FF' },
      Trip: { icon: <Icons.Trip />, color: '#10B981', bgColor: '#D1FAE5' },
      Laptop: { icon: <Icons.Laptop />, color: '#F97316', bgColor: '#FFEDD5' },
      Emergency: { icon: <Icons.Emergency />, color: '#EC4899', bgColor: '#FCE7F3' }
    };

    const config = categoryConfig[newGoal.category] || categoryConfig.School;

    const createdGoal = {
      id: Date.now(),
      title: newGoal.title,
      target: Number(newGoal.target),
      saved: 0,
      dueDate: newGoal.dueDate || 'No due date',
      category: newGoal.category,
      icon: config.icon,
      color: config.color,
      bgColor: config.bgColor
    };

    setGoals([...goals, createdGoal]);
    setNewGoal({ title: '', target: '', dueDate: '', category: 'School' });
    setIsModalOpen(false);
  };

  const handleGoToAdvisor = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('advisor');
    } else {
      window.location.href = '/advisor';
    }
  };

  return (
    <div className="sp-container">
      {/* HEADER SECTION */}
      <header className="sp-header">
        <div className="sp-header-title">
          <h2>Savings Plan</h2>
          <p className="sp-subtitle">Set goals, save consistently and achieve your dreams.</p>
        </div>

        <div className="sp-header-actions">
          <button className="sp-icon-btn" title="Notifications">
            <Icons.Bell />
            <span className="sp-badge-dot"></span>
          </button>

          <button className="sp-btn sp-btn-advisor" onClick={handleGoToAdvisor}>
            <Icons.AskAdvisor />
            <span>Ask Advisor</span>
          </button>

          <button className="sp-btn sp-btn-primary" onClick={() => setIsModalOpen(true)}>
            <Icons.Plus />
            <span>Create New Goal</span>
          </button>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="sp-tabs">
        <button
          className={`sp-tab ${activeTab === 'My Goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('My Goals')}
        >
          My Goals
        </button>
        <button
          className={`sp-tab ${activeTab === 'Savings Activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('Savings Activity')}
        >
          Savings Activity
        </button>
      </div>

      {/* MAIN GRID CONTENT */}
      <div className="sp-grid">
        {/* LEFT COLUMN: STATS & GOALS */}
        <div className="sp-main-col">
          {/* STATS OVERVIEW CARDS */}
          <div className="sp-stats-row">
            <div className="sp-stat-card sp-stat-purple">
              <div>
                <span className="sp-stat-label">Total Saved</span>
                <h3 className="sp-stat-val">{formatCurrency(totalSaved)}</h3>
                <span className="sp-stat-sub">Across all goals</span>
              </div>
              <div className="sp-piggy-wrapper">
                <Icons.PiggyBank />
              </div>
            </div>

            <div className="sp-stat-card">
              <div className="sp-stat-header">
                <div className="sp-mini-icon green"><Icons.Target /></div>
                <div>
                  <span className="sp-stat-label">Active Goals</span>
                  <h3 className="sp-stat-val">{goals.length}</h3>
                </div>
              </div>
              <span className="sp-stat-sub">Keep going!</span>
            </div>

            <div className="sp-stat-card">
              <div className="sp-stat-header">
                <div className="sp-mini-icon blue"><Icons.GoalCompletion /></div>
                <div>
                  <span className="sp-stat-label">Goal Completion</span>
                  <h3 className="sp-stat-val">{overallCompletion}%</h3>
                </div>
              </div>
              <span className="sp-stat-sub">You're doing great!</span>
            </div>
          </div>

          {/* MY SAVINGS GOALS SECTION */}
          <div className="sp-card sp-goals-section">
            <h3>My Savings Goals</h3>

            {goals.length === 0 ? (
              <div className="sp-empty-state">
                <div className="sp-empty-icon"><Icons.Target /></div>
                <h4>No Savings Goals Yet</h4>
                <p>Start your financial journey by setting up your first goal!</p>
                <button className="sp-btn sp-btn-primary" onClick={() => setIsModalOpen(true)}>
                  <Icons.Plus /> Create First Goal
                </button>
              </div>
            ) : (
              <div className="sp-goals-list">
                {goals.map((goal) => {
                  const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));
                  return (
                    <div className="sp-goal-item" key={goal.id}>
                      <div className="sp-goal-main">
                        <div className="sp-goal-icon-box" style={{ backgroundColor: goal.bgColor, color: goal.color }}>
                          {goal.icon}
                        </div>

                        <div className="sp-goal-details">
                          <div className="sp-goal-title-row">
                            <h4>{goal.title}</h4>
                            <div className="sp-goal-amount">
                              <span style={{ color: goal.color, fontWeight: 700 }}>{formatCurrency(goal.saved)}</span>
                              <small>Saved</small>
                            </div>
                          </div>

                          <p className="sp-goal-meta">
                            Target: {formatCurrency(goal.target)} &bull; Due: {goal.dueDate}
                          </p>

                          <div className="sp-progress-container">
                            <div className="sp-progress-bar-bg">
                              <div
                                className="sp-progress-bar-fill"
                                style={{ width: `${percent}%`, backgroundColor: goal.color }}
                              ></div>
                            </div>
                          </div>

                          <div className="sp-goal-footer">
                            <span className="sp-percent-text">{percent}% completed</span>
                          </div>
                        </div>

                        <button className="sp-chevron-btn"><Icons.ChevronRight /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {goals.length > 0 && (
              <div className="sp-view-all-box">
                <button className="sp-btn sp-btn-outline-full">View All Goals</button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR PANELS */}
        <div className="sp-sidebar-col">
          {/* SAVINGS SUMMARY */}
          <div className="sp-card">
            <div className="sp-card-header">
              <h4>Savings Summary</h4>
              <select className="sp-select-sm">
                <option>This Month</option>
                <option>Last Month</option>
              </select>
            </div>

            <div className="sp-summary-rows">
              <div className="sp-summary-row">
                <span>Total Saved This Month</span>
                <strong>{formatCurrency(totalSaved)}</strong>
              </div>
              <div className="sp-summary-row">
                <span>Auto-Saved</span>
                <strong>₦0</strong>
              </div>
              <div className="sp-summary-row">
                <span>Manually Saved</span>
                <strong>{formatCurrency(totalSaved)}</strong>
              </div>
            </div>

            <div className="sp-encouragement-box">
              <div className="sp-encouragement-icon"><Icons.TrendingUp /></div>
              <div>
                <p><strong>You are on track!</strong> Keep up the consistent savings habit!</p>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="sp-card">
            <h4>Quick Actions</h4>
            <div className="sp-quick-actions">
              <button className="sp-action-btn" onClick={() => setIsModalOpen(true)}>
                <div className="sp-action-icon green"><Icons.Target /></div>
                <div className="sp-action-text">
                  <strong>Create New Goal</strong>
                  <small>Start saving for something new</small>
                </div>
                <Icons.ChevronRight />
              </button>

              <button className="sp-action-btn" onClick={() => alert('Select a goal to add money')}>
                <div className="sp-action-icon purple"><Icons.WalletAdd /></div>
                <div className="sp-action-text">
                  <strong>Add Money to Goal</strong>
                  <small>Make a one-time contribution</small>
                </div>
                <Icons.ChevronRight />
              </button>

              <button className="sp-action-btn" onClick={() => alert('Opening Savings Settings...')}>
                <div className="sp-action-icon dark"><Icons.Settings /></div>
                <div className="sp-action-text">
                  <strong>Savings Settings</strong>
                  <small>Manage auto-save and preferences</small>
                </div>
                <Icons.ChevronRight />
              </button>
            </div>
          </div>

          {/* TIPS FROM ADVISOR */}
          <div className="sp-card">
            <div className="sp-card-header">
              <h4>Tips from Advisor</h4>
              <button className="sp-link-btn" onClick={handleGoToAdvisor}>See all</button>
            </div>

            <div className="sp-tip-box">
              <div className="sp-bot-icon"><Icons.Robot /></div>
              <p>
                Try the 50/30/20 rule to balance your needs, wants and savings effectively.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE NEW GOAL MODAL */}
      {isModalOpen && (
        <div className="sp-modal-overlay">
          <div className="sp-modal">
            <div className="sp-modal-header">
              <h3>Create New Savings Goal</h3>
              <button className="sp-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateGoal} className="sp-modal-body">
              <div className="sp-form-group">
                <label>Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. New Laptop, School Fees"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  required
                />
              </div>

              <div className="sp-form-group">
                <label>Target Amount (₦)</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                  required
                />
              </div>

              <div className="sp-form-group">
                <label>Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                >
                  <option value="School">School Fees / Education</option>
                  <option value="Trip">Trip / Travel</option>
                  <option value="Laptop">Gadgets / Laptop</option>
                  <option value="Emergency">Emergency Fund</option>
                </select>
              </div>

              <div className="sp-form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={newGoal.dueDate}
                  onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })}
                />
              </div>

              <div className="sp-modal-actions">
                <button type="button" className="sp-btn sp-btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="sp-btn sp-btn-primary">
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}