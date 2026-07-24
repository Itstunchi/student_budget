<<<<<<< HEAD
import React from 'react';
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
=======
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";



>>>>>>> 5245cda1c00ba6c305421184e2af1e852fb1b497

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

const transactions = [
  { id: 1, date: 'May 17, 2024', desc: 'Netflix Subscription', category: 'Entertainment', type: 'Expense', amount: '- ₦4,500', isExpense: true, method: 'Card', icon: <CreditCard className="w-4 h-4 text-red-500" /> },
  { id: 2, date: 'May 16, 2024', desc: 'Salary', category: 'Income', type: 'Income', amount: '+ ₦200,000', isExpense: false, method: 'Bank Transfer', icon: <Building2 className="w-4 h-4 text-blue-500" /> },
  { id: 3, date: 'May 15, 2024', desc: 'WiFi Subscription', category: 'Bills & Utilities', type: 'Expense', amount: '- ₦7,000', isExpense: true, method: 'Card', icon: <CreditCard className="w-4 h-4 text-red-500" /> },
  { id: 4, date: 'May 14, 2024', desc: 'Grocery Shopping', category: 'Food & Dining', type: 'Expense', amount: '- ₦15,200', isExpense: true, method: 'Card', icon: <CreditCard className="w-4 h-4 text-red-500" /> },
  { id: 5, date: 'May 13, 2024', desc: 'Airtime Top Up', category: 'Communication', type: 'Expense', amount: '- ₦1,500', isExpense: true, method: 'Mobile Money', icon: <Smartphone className="w-4 h-4 text-purple-500" /> },
];

export default function App() {
  return (
<<<<<<< HEAD
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 overflow-y-auto">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="bg-indigo-600 text-white p-2 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">BudgetBuddy</h1>
              <span className="text-xs text-slate-400">Smart Money Advisor</span>
            </div>
          </div>
=======
    <Routes>
      <Route path="/" element={<Sidebar/>} />
    </Routes>
  );
}
>>>>>>> 5245cda1c00ba6c305421184e2af1e852fb1b497

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { name: 'Dashboard', icon: LayoutDashboard },
              { name: 'Spending Plan', icon: PieChart },
              { name: 'Savings Plan', icon: Wallet },
              { name: 'Invest Plan', icon: TrendingUp },
              { name: 'Bills & Reminders', icon: CalendarCheck },
              { name: 'Calendar', icon: Calendar },
              { name: 'Insights', icon: Lightbulb },
              { name: 'Reports', icon: BarChart2, active: true },
              { name: 'Ask Advisor', icon: Bot },
              { name: 'Settings', icon: Settings },
            ].map((item) => (
              <button
                key={item.name}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  item.active 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Cards & Profile */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          {/* Upgrade Banner */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl text-center relative overflow-hidden">
            <div className="text-3xl mb-2">🤖</div>
            <h4 className="font-semibold text-sm mb-1">Get deeper insights about your finances</h4>
            <p className="text-xs text-slate-500 mb-3">Upgrade to Premium to unlock advanced reports and trends.</p>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors">
              Upgrade Now
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold leading-tight">Malvin</p>
                <p className="text-xs text-slate-400">Student</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 cursor-pointer" />
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-8">
        
        {/* Top Bar Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
            <p className="text-sm text-slate-500">View detailed reports and trends of your financial activities.</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </header>

        {/* Filters and Sub-nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-center gap-6 text-sm font-medium text-slate-500 overflow-x-auto">
            {['Overview', 'Income', 'Expenses', 'Savings', 'Investments', 'Net Worth'].map((tab, idx) => (
              <button key={tab} className={`pb-2 border-b-2 whitespace-nowrap ${idx === 0 ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-800'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>May 1 – May 31, 2024</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <button className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Filters
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Income', value: '₦250,000', change: '12% from Apr', isPos: true, icon: '💵', iconBg: 'bg-emerald-50' },
            { label: 'Total Expenses', value: '₦142,600', change: '8% from Apr', isPos: false, icon: '💸', iconBg: 'bg-rose-50' },
            { label: 'Net Savings', value: '₦107,400', change: '20% from Apr', isPos: true, icon: '👛', iconBg: 'bg-purple-50' },
            { label: 'Transaction Count', value: '68', change: '10% from Apr', isPos: true, icon: '📑', iconBg: 'bg-sky-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-start gap-4">
              <div className={`p-3 rounded-xl text-xl ${stat.iconBg}`}>{stat.icon}</div>
              <div>
                <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${stat.isPos ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {stat.isPos ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Income vs Expenses Area Chart */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Income vs Expenses</h3>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Income (₦)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span>Expenses (₦)</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-slate-600">
                  <span>Monthly</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} tickFormatter={(val) => `${val / 1000}K`} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="Expenses" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Spending Breakdown Donut Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <h3 className="font-semibold text-slate-900 mb-2">Spending Breakdown</h3>
            
            <div className="flex items-center justify-center my-2 relative">
              <div className="w-44 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={pieData} innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute text-center">
                <p className="text-sm font-bold text-slate-900">₦142,600</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2 text-xs">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{item.percentage}</span>
                    <span className="font-semibold text-slate-800">₦{item.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="text-xs font-semibold text-indigo-600 flex items-center justify-center gap-1 mt-4 hover:underline">
              View full breakdown <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Transactions List */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
              <button className="text-xs font-semibold text-indigo-600 hover:underline">View All Transactions</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 pb-2">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Payment Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="py-3 text-slate-500 whitespace-nowrap">{tx.date}</td>
                      <td className="py-3 font-medium text-slate-800 whitespace-nowrap">{tx.desc}</td>
                      <td className="py-3 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <span className={`flex items-center gap-1 font-medium ${tx.isExpense ? 'text-slate-500' : 'text-emerald-600'}`}>
                          {tx.type}
                          {tx.isExpense ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        </span>
                      </td>
                      <td className={`py-3 font-semibold whitespace-nowrap ${tx.isExpense ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {tx.amount}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          {tx.icon}
                          <span>{tx.method}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-center mt-4">
              <button className="text-xs font-medium text-indigo-600 hover:underline flex items-center justify-center gap-1 mx-auto">
                View More Transactions <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right Column: Summary & Pro Tip */}
          <div className="space-y-6">
            {/* Reports Summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Reports Summary</h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                  <span>This Month</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { label: 'Average Monthly Income', val: '₦250,000', icon: '📊' },
                  { label: 'Average Monthly Expenses', val: '₦142,600', icon: '🚨' },
                  { label: 'Highest Expense', sub: 'Grocery Shopping', val: '₦15,200', icon: '🛒' },
                  { label: 'Lowest Expense', sub: 'Transport', val: '₦1,200', icon: '🚗' },
                  { label: 'Total Transactions', sub: '10 more than Apr', val: '68', icon: '📋' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-none">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.icon}</span>
                      <div>
                        <p className="font-medium text-slate-700">{item.label}</p>
                        {item.sub && <p className="text-[10px] text-slate-400">{item.sub}</p>}
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tip Box */}
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 flex items-center gap-3">
              <div className="text-2xl">🤖</div>
              <div>
                <h5 className="text-xs font-bold text-indigo-900">Pro Tip</h5>
                <p className="text-xs text-indigo-700">Review your reports regularly to stay on track with your financial goals.</p>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}