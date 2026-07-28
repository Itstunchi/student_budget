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
import Sidebar from "./components/Sidebar";
import { useEffect } from "react";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";

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

const budgetData = [
  { label: "Needs", percent: 40, amount: "₦48,000", color: "#6C4CE0" },
  { label: "Wants", percent: 20, amount: "₦24,000", color: "#F04D6A" },
  { label: "Savings", percent: 20, amount: "₦24,000", color: "#F5A623" },
  { label: "Investments", percent: 10, amount: "₦12,000", color: "#2ECC71" },
  { label: "Others", percent: 10, amount: "₦12,000", color: "#4A9DE0" },
];

const bills = [
  {
    icon: <div className="bill-icon netflix">N</div>,
    name: "Netflix",
    date: "May 25, 2024",
    amount: "₦3,500",
    due: "Due in 2 days",
    dueClass: "due-soon",
  },
  {
    icon: (
      <div className="bill-icon wifi">
        <Wifi size={16} color="#fff" />
      </div>
    ),
    name: "WiFi Subscription",
    date: "May 28, 2024",
    amount: "₦7,000",
    due: "Due in 5 days",
    dueClass: "due-mid",
  },
  {
    icon: (
      <div className="bill-icon water">
        <Droplet size={16} color="#fff" />
      </div>
    ),
    name: "Water Bill",
    date: "May 30, 2024",
    amount: "₦4,500",
    due: "Due in 7 days",
    dueClass: "due-mid",
  },
  {
    icon: (
      <div className="bill-icon school">
        <GraduationCap size={16} color="#fff" />
      </div>
    ),
    name: "School Fees (2nd Installment)",
    date: "June 5, 2024",
    amount: "₦50,000",
    due: "Due in 13 days",
    dueClass: "due-far",
  },
];

const transactions = [
  {
    icon: <Coffee size={16} />,
    name: "Food & Drinks",
    date: "Today, 10:30 AM",
    amount: "-₦2,500",
  },
  {
    icon: <Car size={16} />,
    name: "Transport",
    date: "Yesterday, 8:45 AM",
    amount: "-₦500",
  },
  {
    icon: <Smartphone size={16} />,
    name: "Airtime",
    date: "Yesterday, 6:20 PM",
    amount: "-₦200",
  },
];

function DonutChart({ data }) {
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
        ₦120,000
      </text>
      <text x="80" y="95" textAnchor="middle" className="donut-label">
        Spent
      </text>
    </svg>
  );
}

function Dashboard() {
  const [active, setActive] = useState("Dashboard");

  const [loading, setLoading] = useState(true);

    useEffect(() => {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000);

      return () => clearTimeout(timer);
    }, []);

    if (loading) {
      return <LoadingScreen />;
    }

    return (
      <div className="dashboard">
        <Sidebar />

      {/* Main content */}
      <main className="main">
        <header className="topbar">
          <div>
            <h1>Good morning, Malvin 👋</h1>
            <p>Here's what's happening with your money today.</p>
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
            <div className="stat-value purple-text">₦150,000</div>
            <div className="stat-sub">This Month</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <Calendar size={18} />
            </div>
            <div className="stat-label green-text">Planned</div>
            <div className="stat-value green-text">₦120,000</div>
            <div className="stat-sub">80% of budget</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">
              <PiggyBank size={18} />
            </div>
            <div className="stat-label orange-text">To Save / Invest</div>
            <div className="stat-value orange-text">₦20,000</div>
            <div className="stat-sub">13% of budget</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">
              <Wallet size={18} />
            </div>
            <div className="stat-label">Available</div>
            <div className="stat-value blue-text">₦10,000</div>
            <div className="stat-sub">7% of budget</div>
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
                <DonutChart data={budgetData} />
                <ul className="budget-legend">
                  {budgetData.map((item) => (
                    <li key={item.label}>
                      <span
                        className="dot"
                        style={{ background: item.color }}
                      />
                      <span className="legend-label">{item.label}</span>
                      <span className="legend-percent">{item.percent}%</span>
                      <span className="legend-amount">{item.amount}</span>
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
                {bills.map((bill) => (
                  <li key={bill.name} className="bill-row">
                    {bill.icon}
                    <div className="bill-info">
                      <div className="bill-name">{bill.name}</div>
                      <div className="bill-date">{bill.date}</div>
                    </div>
                    <div className="bill-amount">{bill.amount}</div>
                    <div className={`bill-due ${bill.dueClass}`}>
                      {bill.due}
                    </div>
                    <MoreVertical size={16} className="more-icon" />
                  </li>
                ))}
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
                <button className="quick-action">
                  <BarChart3 size={18} />
                  Spending Plan
                </button>
                <button className="quick-action">
                  <Calendar size={18} />
                  Add Reminder
                </button>
                <button className="quick-action">
                  <PiggyBank size={18} />
                  Savings Plan
                </button>
                <button className="quick-action">
                  <TrendingUp size={18} />
                  Invest Plan
                </button>
                <button className="quick-action">
                  <FileText size={18} />
                  Track Bills
                </button>
                <button className="quick-action">
                  <BarChart3 size={18} />
                  View Reports
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
                {transactions.map((tx) => (
                  <li key={tx.name} className="transaction-row">
                    <div className="tx-icon">{tx.icon}</div>
                    <div className="tx-info">
                      <div className="tx-name">{tx.name}</div>
                      <div className="tx-date">{tx.date}</div>
                    </div>
                    <div className="tx-amount">{tx.amount}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      </div>
    );
}
export default Dashboard;