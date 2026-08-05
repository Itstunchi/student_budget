import React from 'react';
import Sidebar from "../components/Sidebar";
import { 
  LayoutDashboard, PieChart, Wallet, TrendingUp, CalendarCheck, 
  Calendar, Lightbulb, BarChart2, Bot, Settings, Bell, Download, 
  Filter, ArrowUpRight, ArrowDownRight, ChevronDown, CreditCard, 
  Building2, Smartphone, ArrowUp, ArrowDown
} from 'lucide-react';
import { 
  AreaChart, Area, PieChart as RePieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import "./Reports.css";
import useTransactions from "../hooks/useTransactions";


// --- DATA DEFINITIONS ---

const areaChartData = [
  { month: 'Dec', Income: 150000, Expenses: 70000 },
  { month: 'Jan', Income: 190000, Expenses: 95000 },
  { month: 'Feb', Income: 160000, Expenses: 60000 },
  { month: 'Mar', Income: 230000, Expenses: 110000 },
  { month: 'Apr', Income: 210000, Expenses: 115000 },
  { month: 'May', Income: 250000, Expenses: 142600 },
];

const pieData = [
  { name: 'Needs', value: 54190, percentage: '38%', color: '#4F46E5' },
  { name: 'Wants', value: 34220, percentage: '24%', color: '#EC4899' },
  { name: 'Savings', value: 28520, percentage: '20%', color: '#10B981' },
  { name: 'Bills', value: 17110, percentage: '12%', color: '#0EA5E9' },
  { name: 'Others', value: 8560, percentage: '6%', color: '#94A3B8' },
];

// const transactions = [
//   { id: 1, date: 'May 17, 2024', desc: 'Netflix Subscription', category: 'Entertainment', type: 'Expense', amount: '- ₦4,500', isExpense: true, method: 'Card', icon: <CreditCard className="w-4 h-4 text-red-500" /> },
//   { id: 2, date: 'May 16, 2024', desc: 'Salary', category: 'Income', type: 'Income', amount: '+ ₦200,000', isExpense: false, method: 'Bank Transfer', icon: <Building2 className="w-4 h-4 text-blue-500" /> },
//   { id: 3, date: 'May 15, 2024', desc: 'WiFi Subscription', category: 'Bills & Utilities', type: 'Expense', amount: '- ₦7,000', isExpense: true, method: 'Card', icon: <CreditCard className="w-4 h-4 text-red-500" /> },
//   { id: 4, date: 'May 14, 2024', desc: 'Grocery Shopping', category: 'Food & Dining', type: 'Expense', amount: '- ₦15,200', isExpense: true, method: 'Card', icon: <CreditCard className="w-4 h-4 text-red-500" /> },
//   { id: 5, date: 'May 13, 2024', desc: 'Airtime Top Up', category: 'Communication', type: 'Expense', amount: '- ₦1,500', isExpense: true, method: 'Mobile Money', icon: <Smartphone className="w-4 h-4 text-purple-500" /> },
// ];

export default function App() {
  const {
    transactions,
    loading: transactionLoading,
  } = useTransactions();

  if (transactionLoading) {
    return (
      <div className="reports-loading">
        Loading Reports...
      </div>
    );
  }

  return (
    <div className="flex  bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <Sidebar />
      {/* 2. MAIN CONTENT AREA */}
      <main className="reports-page">

    <header className="reports-header">

        <div>

            <h1>Reports</h1>

            <p>
                View detailed reports and trends of your financial activities.
            </p>

        </div>

        <div className="reports-header-actions">

            <button className="notification-btn">

                <Bell size={20} />

                <span className="notification-dot"></span>

            </button>

            <button className="export-btn">

                <Download size={18} />

                Export Report

            </button>

        </div>

    </header>

    <div className="reports-toolbar">

        <div className="reports-tabs">

            {[
                "Overview",
                "Income",
                "Expenses",
                "Savings",
                "Investments",
                "Net Worth",
            ].map((tab, idx) => (

                <button
                    key={tab}
                    className={
                        idx === 0
                            ? "report-tab active"
                            : "report-tab"
                    }
                >
                    {tab}
                </button>

            ))}

        </div>

        <div className="toolbar-actions">

            <button className="date-btn">

                <Calendar size={18} />

                May 1 – May 31, 2024

                <ChevronDown size={16} />

            </button>

            <button className="filter-btn">

                <Filter size={18} />

                Filters

            </button>

        </div>

    </div>

    <section className="metrics-grid">

        {[
            {
                label: "Total Income",
                value: "₦250,000",
                change: "12% from Apr",
                positive: true,
            },
            {
                label: "Total Expenses",
                value: "₦142,600",
                change: "8% from Apr",
                positive: false,
            },
            {
                label: "Net Savings",
                value: "₦107,400",
                change: "20% from Apr",
                positive: true,
            },
            {
                label: "Transactions",
                value: "68",
                change: "10% from Apr",
                positive: true,
            },
        ].map((item) => (

            <div
                key={item.label}
                className="metric-card"
            >

                <div className="metric-content">

                    <p>{item.label}</p>

                    <h2>{item.value}</h2>

                    <span
                        className={
                            item.positive
                                ? "positive"
                                : "negative"
                        }
                    >

                        {item.positive ? (
                            <ArrowUp size={14} />
                        ) : (
                            <ArrowDown size={14} />
                        )}

                        {item.change}

                    </span>

                </div>

            </div>

        ))}

    </section>

        {/* Charts Section */}
        <section className="charts-grid">

  {/* Income vs Expenses */}

  <div className="income-chart-card">

    <div className="card-header">

      <h3>Income vs Expenses</h3>

      <button className="chart-filter">
        Monthly
        <ChevronDown size={16}/>
      </button>

    </div>

    <div className="chart-legends">

      <div className="legend">

        <span className="legend-dot income"></span>

        Income

      </div>

      <div className="legend">

        <span className="legend-dot expense"></span>

        Expenses

      </div>

    </div>

    <div className="chart-box">

      <ResponsiveContainer
        width="100%"
        height={300}
      >

        <AreaChart data={areaChartData}>

          <defs>

            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>

            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6C3CF0" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#6C3CF0" stopOpacity={0}/>
            </linearGradient>

          </defs>

          <XAxis dataKey="month"/>

          <YAxis/>

          <Tooltip/>

          <Area
            dataKey="Income"
            stroke="#10B981"
            fill="url(#incomeGrad)"
          />

          <Area
            dataKey="Expenses"
            stroke="#6C3CF0"
            fill="url(#expenseGrad)"
          />

        </AreaChart>

      </ResponsiveContainer>

    </div>

  </div>

  {/* Spending Breakdown */}

  <div className="pie-chart-card">

    <h3>Spending Breakdown</h3>

    <div className="pie-wrapper">

      <ResponsiveContainer
        width="100%"
        height={250}
      >

        <RePieChart>

          <Pie
            data={pieData}
            innerRadius={65}
            outerRadius={90}
            dataKey="value"
            paddingAngle={3}
          >

            {

            pieData.map((item,index)=>(

              <Cell
                key={index}
                fill={item.color}
              />

            ))

            }

          </Pie>

        </RePieChart>

      </ResponsiveContainer>

    </div>

    <div className="pie-total">

      <h2>₦142,600</h2>

      <span>Total</span>

    </div>

    <div className="pie-list">

      {

      pieData.map((item)=>(

      <div
      key={item.name}
      className="pie-item"
      >

        <div>

          <span
          className="pie-color"
          style={{
          background:item.color
          }}
          />

          {item.name}

        </div>

        <strong>

          ₦{item.value.toLocaleString()}

        </strong>

      </div>

      ))

      }

    </div>

  </div>

</section>

        {/* Bottom Section */}
        <section className="transactions-card">

  <div className="transactions-header">

    <h3>Recent Transactions</h3>

    <button className="view-all-btn">
      View All
    </button>

  </div>

  <div className="transactions-table">

    <table>

      <thead>

        <tr>

          <th>Description</th>

          <th>Category</th>

          <th>Date</th>

          <th>Status</th>

          <th>Amount</th>

        </tr>

      </thead>

      <tbody>

        {transactions.map((item) => (

          <tr key={item.id}>

            <td>

              <div className="transaction-user">

                <div className="transaction-avatar">

                  {item.title.charAt(0)}

                </div>

                <div>

                    <h4>{item.title}</h4>

                    <span>{item.category}</span>

                </div>

              </div>

            </td>

            <td>

              {item.category}

            </td>

            <td>

              {item.createdAt?.toDate
              ? item.createdAt.toDate().toLocaleDateString()
              : "N/A"}

            </td>

            <td>

              <span className="status completed">
                Completed
              </span>

            </td>

            <td
              className={
                item.type === "income"
                  ? "income-text"
                  : "expense-text"
              }
            >

              {item.type === "income"
                ? "+"
                : "-"}

              ₦{item.amount.toLocaleString()}

            </td>

          </tr>

        ))}

      </tbody>

    </table>

  </div>

</section>

      </main>
    </div>
  );
}