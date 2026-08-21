import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen/LoadingScreen";
import { getNotifications } from '../utils/notificationService';
import {
  Wallet,
  PiggyBank,
  Calendar,
  BarChart3,
  FileText,
  Bell,
  Bot,
  ArrowUpRight,
  Sparkles,
  Edit2,
  X
} from "lucide-react";
import "./Dashboard.css";

// ANIMATED DONUT CHART COMPONENT
function DonutChart({ spent, total }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth="18"
      />
      {total > 0 && (
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#6C4CE0"
          strokeWidth="18"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
          style={{
            transition: "stroke-dashoffset 1.2s ease-in-out, stroke 0.5s ease",
          }}
        />
      )}
      <text x="80" y="75" textAnchor="middle" className="donut-amount" style={{ fontWeight: "bold", fontSize: "18px" }}>
        ₦{(spent || 0).toLocaleString()}
      </text>
      <text x="80" y="95" textAnchor="middle" className="donut-label" style={{ fill: "#6B7280", fontSize: "12px" }}>
        Spent
      </text>
    </svg>
  );
}

// ─── Canonical storage keys ───
// These MUST match exactly what SpendingPlanWizard.jsx and SavingsPlan.jsx write to.
const BUDGET_KEY = "user_budget";
const SAVINGS_KEY = "user_savings_plans";

// ─── Loading screen gate ───
// Login.jsx / Signup.jsx set this flag right before navigating here, ONLY
// on a fresh login/signup. Dashboard consumes (clears) it immediately, so
// simply revisiting /dashboard later in the same session never re-shows
// the loading screen — only the moment right after authenticating does.
const JUST_AUTHENTICATED_FLAG = "bb_just_authenticated";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(
    () => sessionStorage.getItem(JUST_AUTHENTICATED_FLAG) === "true"
  );
  const [showAiInput, setShowAiInput] = useState(false);
  const [query, setQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // LOGGED IN USER STATE
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : { fullName: "User" };
    } catch {
      return { fullName: "User" };
    }
  });


// CHANGE TO THIS:
const [notifications, setNotifications] = useState(() => getNotifications());
const [showNotifModal, setShowNotifModal] = useState(false);
  const [budgetData, setBudgetData] = useState({
    totalBudget: 0,
    planned: 0,
    savings: 0,
    available: 0,
    spent: 0,
    categories: []
  });

  const [savingsGoals, setSavingsGoals] = useState([]);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editGoalTitle, setEditGoalTitle] = useState("");
  const [editGoalSaved, setEditGoalSaved] = useState("");
  const [editGoalTarget, setEditGoalTarget] = useState("");

  const calculateTotalSpent = (categories = []) => {
    return categories.reduce((sum, cat) => sum + (Number(cat.spent) || 0), 0);
  };

  const loadDashboardData = () => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Error loading user profile", e);
    }

    // 1. Load the active spending plan.
    // SpendingPlanWizard.jsx always writes the active plan to BUDGET_KEY ("user_budget"),
    // so that's the source of truth. "spending_plan" is kept as a legacy fallback only.
    const savedBudgetRaw =
      localStorage.getItem(BUDGET_KEY) || localStorage.getItem("spending_plan");

    if (savedBudgetRaw) {
      try {
        const parsed = JSON.parse(savedBudgetRaw);

        // Normalize schema names
        const rawCategories = parsed.categories || parsed.items || [];
        const normalizedCategories = rawCategories.map(cat => ({
          name: cat.name || cat.title || "Uncategorized",
          amount: Number(cat.amount || cat.allocated || cat.budget || 0),
          spent: Number(cat.spent || 0)
        }));

        const totalBudgetVal = Number(parsed.totalBudget || parsed.income || parsed.totalIncome || 0);
        const plannedVal = Number(parsed.planned || parsed.totalAllocated || parsed.allocated || 0);
        const computedSpent = calculateTotalSpent(normalizedCategories);

        setBudgetData({
          totalBudget: totalBudgetVal,
          planned: plannedVal,
          savings: Number(parsed.savings || 0),
          available: Number(parsed.available ?? (totalBudgetVal - plannedVal) ?? 0),
          spent: computedSpent,
          categories: normalizedCategories
        });
      } catch (e) {
        console.error("Error reading saved budget", e);
      }
    } else {
      setBudgetData({
        totalBudget: 0,
        planned: 0,
        savings: 0,
        available: 0,
        spent: 0,
        categories: []
      });
    }

    // 2. Load Savings Goals.
    // SavingsPlan.jsx always writes the full goals list to SAVINGS_KEY ("user_savings_plans").
    const savedGoals = localStorage.getItem(SAVINGS_KEY);
    if (savedGoals) {
      try {
        const parsed = JSON.parse(savedGoals);
        const normalized = parsed.map(g => ({
          ...g,
          currentAmount: g.currentAmount !== undefined ? g.currentAmount : (g.saved || 0),
          targetAmount: g.targetAmount !== undefined ? g.targetAmount : (g.target || 0),
        }));
        setSavingsGoals(normalized);
      } catch (e) {
        console.error("Error loading savings goals:", e);
      }
    } else {
      setSavingsGoals([]);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleStorageChange = () => {
      loadDashboardData();
    };
    window.addEventListener("storage", handleStorageChange);

    // Only show the loading screen if we just came from a fresh login/signup.
    // Consuming (removing) the flag here means navigating back to /dashboard
    // later in the same session — e.g. clicking it in the sidebar — never
    // triggers the loading screen again.
    if (sessionStorage.getItem(JUST_AUTHENTICATED_FLAG) === "true") {
      sessionStorage.removeItem(JUST_AUTHENTICATED_FLAG);
      const timer = setTimeout(() => setLoading(false), 2500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("storage", handleStorageChange);
      };
    }

    setLoading(false);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const saveGoalsToStorage = (updatedGoals) => {
    setSavingsGoals(updatedGoals);
    localStorage.setItem(SAVINGS_KEY, JSON.stringify(updatedGoals));
    window.dispatchEvent(new Event("storage"));
  };

  const handleStartEditGoal = (goal) => {
    setEditingGoalId(goal.id);
    setEditGoalTitle(goal.title);
    setEditGoalSaved(goal.currentAmount);
    setEditGoalTarget(goal.targetAmount);
  };

  const handleSaveGoal = (id) => {
    const updated = savingsGoals.map((g) =>
      g.id === id
        ? {
            ...g,
            title: editGoalTitle,
            currentAmount: Number(editGoalSaved) || 0,
            targetAmount: Number(editGoalTarget) || 0,
          }
        : g
    );
    saveGoalsToStorage(updated);
    setEditingGoalId(null);
  };

  const handleQuickAddSavings = (id, amount) => {
    const updated = savingsGoals.map((g) =>
      g.id === id ? { ...g, currentAmount: (g.currentAmount || 0) + amount } : g
    );
    saveGoalsToStorage(updated);
  };

  const handleDismissNotif = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const totalSaved = savingsGoals.reduce((acc, curr) => acc + (curr.currentAmount || 0), 0);
  const totalTarget = savingsGoals.reduce((acc, curr) => acc + (curr.targetAmount || 0), 0);
  const overallCompletion = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const firstName = user?.fullName ? user.fullName.trim().split(" ")[0] : "User";

  const handleAskAdvisor = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsThinking(true);
    setTimeout(() => {
      setQuery("");
      setIsThinking(false);
    }, 800);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="dashboard">
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <h1>Good day, {firstName} 👋</h1>
            <p>Today is {todayDate}. Manage your budget and savings below.</p>
          </div>
          <div className="topbar-actions">
            <button 
              className="icon-btn" 
              onClick={() => setShowNotifModal(true)} 
              title="Notifications & Reminders"
              style={{ position: "relative" }}
            >
              <Bell size={18} />
              {notifications.length > 0 && <span className="notif-dot" />}
            </button>
            {/* <button className="ask-advisor-btn" onClick={() => setShowAiInput(!showAiInput)}>
              <Sparkles size={16} />
              {showAiInput ? "Hide AI" : "Ask AI Advisor"}
            </button> */}
          </div>
        </header>

        {/* AI Drawer */}
        {showAiInput && (
          <section className="advisor-chat-banner" style={{ marginBottom: "20px", border: "1px solid #6C4CE0" }}>
            <div className="advisor-chat-avatar"><Bot size={20} color="#fff" /></div>
            <div className="advisor-chat-text" style={{ width: "100%" }}>
              <strong>AI Financial Assistant</strong>
              <form onSubmit={handleAskAdvisor} style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <input
                  type="text"
                  placeholder="Ask a question about your plans..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #edeff3" }}
                />
                <button className="chat-with-advisor-btn" type="submit" disabled={isThinking}>
                  {isThinking ? "Analyzing..." : "Ask AI"}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Dynamic Stat Cards */}
        <section className="stats-row">
          <div className="stat-card" onClick={() => navigate("/spending-plan")}>
            <div className="stat-icon purple"><Wallet size={18} /></div>
            <div className="stat-label">Total Budget</div>
            <div className="stat-value purple-text">₦{(budgetData.totalBudget || 0).toLocaleString()}</div>
            <div className="stat-sub">This Month</div>
          </div>

          <div className="stat-card" onClick={() => navigate("/spending-plan")}>
            <div className="stat-icon green"><Calendar size={18} /></div>
            <div className="stat-label green-text">Planned Spending</div>
            <div className="stat-value green-text">₦{(budgetData.planned || 0).toLocaleString()}</div>
            <div className="stat-sub">
              {budgetData.totalBudget > 0 ? `${Math.round((budgetData.planned / budgetData.totalBudget) * 100)}% allocated` : "0% allocated"}
            </div>
          </div>

          <div className="stat-card" onClick={() => navigate("/savings-plan")}>
            <div className="stat-icon orange"><PiggyBank size={18} /></div>
            <div className="stat-label orange-text">Total Saved</div>
            <div className="stat-value orange-text">₦{totalSaved.toLocaleString()}</div>
            <div className="stat-sub">
              {savingsGoals.length > 0 ? `${overallCompletion}% of total goals` : "No active goals"}
            </div>
          </div>

          <div className="stat-card" onClick={() => navigate("")}>
            <div className="stat-icon blue"><Wallet size={18} /></div>
            <div className="stat-label">Available Funds</div>
            <div className="stat-value blue-text">₦{(budgetData.available || 0).toLocaleString()}</div>
            <div className="stat-sub">Unallocated balance</div>
          </div>
        </section>

        {/* Content Grid */}
        <section className="content-grid">
          <div className="left-col">
            {/* SPENDING OVERVIEW CARD */}
            <div className="card">
              <div className="card-header">
                <h3>Spending Overview</h3>
                <button className="link" onClick={() => navigate("/spending-plan")} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  Edit Spending Plan <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="budget-overview-body">
                <DonutChart spent={budgetData.spent} total={budgetData.totalBudget} />
                <div style={{ flex: 1 }}>
                  {budgetData.categories && budgetData.categories.length > 0 ? (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {budgetData.categories.map((cat, i) => (
                        <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0", fontSize: "13px" }}>
                          <span>{cat.name}</span>
                          <span style={{ color: "#6B7280" }}>
                            ₦{(cat.spent || 0).toLocaleString()} / <strong>₦{(cat.amount || 0).toLocaleString()}</strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ textAlign: "center", color: "#8a8da0", fontSize: "13px" }}>
                      No budget categories set up yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* INTERACTIVE SAVINGS GOALS CARD */}
            <div className="card">
              <div className="card-header">
                <h3>Savings Plan Actions</h3>
                <button className="link" onClick={() => navigate("/savings-plan")} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  {savingsGoals.length > 0 ? "View All Goals" : "Add Goal"} <ArrowUpRight size={14} />
                </button>
              </div>

              {savingsGoals.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#8a8da0", fontSize: "13px" }}>
                  No active savings goals. Create your first goal to interact with it here!
                </div>
              ) : (
                <div style={{ padding: "6px 0" }}>
                  {savingsGoals.map((goal) => {
                    const savedVal = goal.currentAmount || 0;
                    const targetVal = goal.targetAmount || 1;
                    const percent = targetVal > 0 ? Math.min(100, Math.round((savedVal / targetVal) * 100)) : 0;
                    const isEditing = editingGoalId === goal.id;

                    return (
                      <div key={goal.id} className="interactive-goal-card">
                        {isEditing ? (
                          <div className="goal-edit-form">
                            <input
                              type="text"
                              value={editGoalTitle}
                              onChange={(e) => setEditGoalTitle(e.target.value)}
                              placeholder="Goal Title"
                            />
                            <div className="goal-edit-inputs">
                              <input
                                type="number"
                                value={editGoalSaved}
                                onChange={(e) => setEditGoalSaved(e.target.value)}
                                placeholder="Saved"
                              />
                              <input
                                type="number"
                                value={editGoalTarget}
                                onChange={(e) => setEditGoalTarget(e.target.value)}
                                placeholder="Target"
                              />
                            </div>
                            <div className="goal-edit-actions">
                              <button className="btn-small save" onClick={() => handleSaveGoal(goal.id)}>Save</button>
                              <button className="btn-small cancel" onClick={() => setEditingGoalId(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {goal.title}
                                <button className="icon-action-btn" onClick={() => handleStartEditGoal(goal)}>
                                  <Edit2 size={12} />
                                </button>
                              </span>
                              <span>₦{savedVal.toLocaleString()} / ₦{targetVal.toLocaleString()}</span>
                            </div>

                            <div style={{ height: "8px", background: "#E5E7EB", borderRadius: "4px", overflow: "hidden", marginBottom: "8px" }}>
                              <div style={{ width: `${percent}%`, height: "100%", background: "#6C4CE0", transition: "width 0.4s ease" }} />
                            </div>

                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <button className="quick-deposit-btn" onClick={() => handleQuickAddSavings(goal.id, 1000)}>
                                +₦1,000
                              </button>
                              <button className="quick-deposit-btn" onClick={() => handleQuickAddSavings(goal.id, 5000)}>
                                +₦5,000
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
          </div>

          <div className="right-col">
            <div className="card">
              <div className="card-header">
                <h3><Sparkles size={16} color="#6C4CE0" style={{ display: "inline", marginRight: "6px" }} /> AI Smart Advisor</h3>
              </div>
              <p className="tip-text">
                Update spent amounts on your Spending Plan page to watch your dashboard progress chart animate automatically.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="quick-actions-title">Quick Actions</h3>
              <div className="quick-actions-grid">
                <button className="quick-action" onClick={() => navigate("/spending-plan")}>
                  <BarChart3 size={18} /> Spending Plan
                </button>
                <button className="quick-action" onClick={() => navigate("/savings-plan")}>
                  <PiggyBank size={18} /> Savings Plan
                </button>
                <button className="quick-action" onClick={() => navigate("/bills")}>
                  <Calendar size={18} /> Add Reminder
                </button>
                <button className="quick-action" onClick={() => navigate("/bills")}>
                  <FileText size={18} /> Track Bills
                </button>

              </div>
            </div>
          </div>
        </section>
      </main>

      {/* NOTIFICATIONS MODAL POPUP */}
      {showNotifModal && (
        <div className="sp-modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.45)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div className="sp-modal" style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "20px",
            width: "90%",
            maxWidth: "450px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>🔔 Reminders & Notifications</h3>
              <button 
                onClick={() => setShowNotifModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            {notifications.length === 0 ? (
              <p style={{ color: "#6B7280", fontSize: "14px", textAlign: "center", margin: "20px 0" }}>
                You have no unread notifications or upcoming bill reminders!
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                {notifications.map((notif) => (
                  <div key={notif.id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "12px",
                    borderRadius: "8px",
                    background: "#F9FAFB",
                    borderLeft: "4px solid #6C4CE0"
                  }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>{notif.title}</div>
                      <div style={{ fontSize: "12px", color: "#4B5563", marginTop: "2px" }}>{notif.desc}</div>
                      <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>{notif.date}</div>
                    </div>
                    <button 
                      onClick={() => handleDismissNotif(notif.id)}
                      style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setShowNotifModal(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6C4CE0",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
