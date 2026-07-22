import React from 'react';
import { LayoutDashboard, Wallet, PiggyBank, TrendingUp, Calendar, FileText, Settings, BellRing, HelpCircle } from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { icon: <Wallet size={20} />, label: "Spending Plan" },
    { icon: <PiggyBank size={20} />, label: "Savings Plan" },
    { icon: <TrendingUp size={20} />, label: "Invest Plan" },
    { icon: <BellRing size={20} />, label: "Bills & Reminders", active: true },
    { icon: <Calendar size={20} />, label: "Calendar" },
    { icon: <FileText size={20} />, label: "Insights" },
    { icon: <HelpCircle size={20} />, label: "Ask Advisor" },
    { icon: <Settings size={20} />, label: "Settings" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-6 h-screen sticky top-0">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="bg-purple-600 text-white p-2 rounded-xl">
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 tracking-tight">BudgetBuddy</h1>
            <p className="text-[10px] text-slate-400 font-medium">Smart Money Adviser</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                item.active 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* User Profile Footer snippet */}
      <div className="flex items-center gap-3 p-2 border-t border-slate-100 pt-4">
        <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center font-bold text-purple-700">
          M
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Malvin</h4>
          <p className="text-xs text-slate-400">Student</p>
        </div>
      </div>
    </aside>
  );
}