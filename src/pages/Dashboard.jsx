import { useState } from "react";
import {
  Wallet,
  Home,
  ClipboardList,
  PiggyBank,
  TrendingUp,
  Calendar,
  CalendarDays,
  BarChart3,
  FileText,
  MessageCircle,
  Bell,
  Bot,
  Wifi,
  Droplet,
  GraduationCap,
  ArrowUpRight,
  MoreVertical,
  Coffee,
  Car,
  Smartphone,
} from "lucide-react";
import "./Dashboard.css";
import Sidebar from "../components/Sidebar";
import { useEffect } from "react";
import LoadingScreen from "../components/LoadingScreen/LoadingScreen";
import useBudget from "../hooks/useBudget";
import useTransactions from "../hooks/useTransactions";
import useBills from "../hooks/useBills";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import AddBillModal from "../components/AddBillModal";
import AddTransactionModal from "../components/AddTransactionModal";


const navItems = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: ClipboardList, label: "Spending Plan" },
  { icon: PiggyBank, label: "Savings Plan" },
  { icon: TrendingUp, label: "Invest Plan" },
  { icon: Calendar, label: "Bills & Reminders" },
  { icon: CalendarDays, label: "Calendar" },
  { icon: BarChart3, label: "Insights" },
  { icon: FileText, label: "Reports" },
  { icon: MessageCircle, label: "Ask Advisor" },
];

function DonutChart({ data, total }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offsetAccum = 0;

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {data.map((slice, i) => {
        const dash = (slice.percent / 100) * circumference;
        const gap = circumference - dash;
        const rotation = (offsetAccum / 100) * 360 - 90;
        offsetAccum += slice.percent;
        return (
          <circle
            key={i}
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth="22"
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(${rotation} 80 80)`}
          />
        );
      })}
      <text x="80" y="75" textAnchor="middle" className="donut-amount">
        ₦{total.toLocaleString()}
      </text>
      <text x="80" y="95" textAnchor="middle" className="donut-label">
        Spent
      </text>
    </svg>
  );
}

function Dashboard() {
  const [active, setActive] = useState("Dashboard");
  const { budget, loading: budgetLoading } = useBudget();

  const [userName, setUserName] = useState("Student");
  const [greeting, setGreeting] = useState("");
  const navigate = useNavigate();
  const [showBillModal, setShowBillModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

      const {
        bills,
        loading: billsLoading,
        loadBills,
      } = useBills();

      const {
        transactions,
        loading: transactionLoading,
        loadTransactions,
      } = useTransactions();

  const totalBudget = budget?.amount || 0;

const allocations = budget?.allocations || [];

const needs =
  allocations.find(item => item.category === "Needs")?.amount || 0;

const wants =
  allocations.find(item => item.category === "Wants")?.amount || 0;

const savings =
  allocations.find(item => item.category === "Savings")?.amount || 0;

const investments =
  allocations.find(item => item.category === "Investments")?.amount || 0;

const available =
  totalBudget - (needs + wants + savings + investments);

// Total amount the user has actually spent
const spent = transactions.reduce(
  (total, transaction) => total + Number(transaction.amount || 0),
  0
);

// Remaining money after actual spending
const remainingBalance = totalBudget - spent;

// Budget usage percentage
const budgetUsed =
  totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;

  const [loading, setLoading] = useState(true);

    useEffect(() => {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000);

      return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
      const user = auth.currentUser;

      if (user) {
        if (user.displayName) {
          setUserName(user.displayName);
        } else if (user.email) {
          const name = user.email.split("@")[0];
          setUserName(
            name.charAt(0).toUpperCase() + name.slice(1)
          );
        }
      }

      const hour = new Date().getHours();

      if (hour < 12) {
        setGreeting("Good Morning ☀️");
      } else if (hour < 17) {
        setGreeting("Good Afternoon 🌤️");
      } else {
        setGreeting("Good Evening 🌙");
      }
    }, []);

    if (
      loading ||
      budgetLoading ||
      transactionLoading ||
      billsLoading
    ) {
      return <LoadingScreen />;
    }

    const budgetData =
      budget?.allocations?.map((item) => ({
        label: item.category,
        percent: item.percentage,
        amount: item.amount,
        color: item.color,
      })) || [];
      // console.log("Budget from Firestore:", budget);

    return (
      <div className="dashboard">
        <Sidebar />

      {/* Main content */}
      <main className="main">
        <header className="topbar">
          <div>
            <h1>
              {greeting}, {userName} 👋
            </h1>
            <p>
              Welcome back! Here's a summary of your finances today.
            </p>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn">
              <Bell size={18} />
              <span className="notif-dot" />
            </button>
            <button className="ask-advisor-btn">
              <MessageCircle size={16} />
              Ask Advisor
            </button>
          </div>
        </header>

        {/* Stat cards */}
        <section className="stats-row">
          <div className="stat-card">
            <div className="stat-icon purple">
              <Wallet size={18} />
            </div>
            <div className="stat-label">Total Budget</div>
            <div className="stat-value purple-text">₦{totalBudget.toLocaleString()}</div>
            <div className="stat-sub">This Month</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <Calendar size={18} />
            </div>
            <div className="stat-label green-text">Spent</div>
            <div className="stat-value green-text"> ₦{spent.toLocaleString()} </div>
            <div className="stat-sub"> {budgetUsed}% of budget used </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">
              <PiggyBank size={18} />
            </div>
            <div className="stat-label orange-text"> Savings Goal </div>
            <div className="stat-value orange-text"> ₦{(savings + investments).toLocaleString()} </div>
            <div className="stat-sub"> Planned Savings </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">
              <Wallet size={18} />
            </div>
            <div className="stat-label">Available</div>
            <div className="stat-value blue-text"> ₦{remainingBalance.toLocaleString()} </div> 
            <div className="stat-sub"> Available to Spend </div>
          </div>
        </section>

        {/* Content grid */}
        <section className="content-grid">
          <div className="left-col">
            <div className="card">
              <div className="card-header">
                <h3>Budget Overview (This Month)</h3>
                <a href="#" className="link">
                  View full report <ArrowUpRight size={14} />
                </a>
              </div>
              <div className="budget-overview-body">
                {budgetData.length > 0 ? ( <DonutChart data={budgetData}total={totalBudget} /> ) : ( <div className="empty-state"> <h4>No Budget Yet</h4> <p>Create a spending plan to see your budget overview.</p> 
              </div>)}
                <ul className="budget-legend">
                  {budgetData.map((item) => (
                    <li key={item.label}>
                      <span
                        className="dot"
                        style={{ background: item.color }}
                      />
                      <span className="legend-label">{item.label}</span>
                      <span className="legend-percent">{item.percent}%</span>
                      <span className="legend-amount"> ₦{item.amount.toLocaleString()} </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Upcoming Bills & Reminders</h3>
                <a href="#" className="link">
                  View all
                </a>
              </div>
              <ul className="bills-list">
                {bills.length === 0 ? (
                  <p>No upcoming bills 🎉</p>
                ) : (
                  bills.map((bill) => (
                    <div className="bill-item" key={bill.id}>
                      <div className="bill-left">
                        <div className="bill-icon">📄</div>

                        <div>
                          <h4>{bill.title}</h4>
                          <p>{bill.dueDate}</p>
                        </div>
                      </div>

                      <div className="bill-right">
                        <h4>₦{bill.amount.toLocaleString()}</h4>
                      </div>
                    </div>
                  ))
                )}
              </ul>
            </div>

            <div className="advisor-chat-banner">
              <div className="advisor-chat-avatar">
                <Bot size={20} color="#fff" />
              </div>
              <div className="advisor-chat-text">
                <strong>Hi Malvin! I'm here to help you</strong>
                <p>
                  I can help you plan your spending, track bills, and reach your
                  financial goals.
                </p>
              </div>
              <button className="chat-with-advisor-btn">
                Chat with Advisor
              </button>
            </div>
          </div>

          <div className="right-col">
            <div className="card">
              <div className="card-header">
                <h3>⭐ Advisor Tip</h3>
              </div>
              <p className="tip-text">
                Try the 50/30/20 rule: 50% Needs, 30% Wants, 30% Savings or
                Investments.
              </p>
              <div className="tip-highlight">
                <div className="tip-icon">💡</div>
                <div>
                  <strong>You're doing great!</strong>
                  <p>You've saved 20% more than last month.</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="quick-actions-title">Quick Actions</h3>
              <div className="quick-actions-grid">

                <button
                  className="quick-action"
                  onClick={() => navigate("/spending-plan")}
                >
                  <BarChart3 size={18} />
                  <span>Spending Plan</span>
                </button>

                <button
                  className="quick-action"
                  onClick={() => setShowBillModal(true)}
                >
                  <Calendar size={18} />
                  <span>Add Reminder</span>
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate("/savings")}
                >
                  <PiggyBank size={18} />
                  <span>Savings Plan</span>
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate("/invest")}
                  disabled
                  title="Coming Soon"
                >
                  <TrendingUp size={18} />
                  <span>Invest Plan</span>
                </button>

                <button
                  className="quick-action"
                  onClick={() => setShowTransactionModal(true)}
                >
                  <FileText size={18} />
                  Add Transaction
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate("/reports")}
                >
                  <BarChart3 size={18} />
                  <span>View Reports</span>
                </button>

              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Recent Transactions</h3>
                <a href="#" className="link">
                  View all
                </a>
              </div>
              <ul className="transactions-list">
                {transactions.length === 0 ? (
                  <p>No recent transactions.</p>
                ) : (
                  transactions.slice(0, 5).map((transaction) => (
                    <div className="transaction-item" key={transaction.id}>
                      <div className="transaction-icon">
                        💳
                      </div>

                      <div className="transaction-details">
                        <h4>{transaction.title}</h4>
                        <span>{transaction.category}</span>
                      </div>

                      <div className="transaction-right">
                        <strong>-₦{transaction.amount.toLocaleString()}</strong>
                        <small>
                          {new Date(transaction.createdAt?.seconds * 1000).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <AddBillModal
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
        onSaved={loadBills}
      />

      <AddTransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSaved={loadTransactions}
      />
      </div>
    );
}
export default Dashboard;