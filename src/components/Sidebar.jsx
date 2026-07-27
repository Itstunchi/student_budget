// src/components/Sidebar.jsx
import React from 'react';
// import your icons here...

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-100 p-6 flex flex-col justify-between shrink-0">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            B
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base leading-tight">BudgetBuddy</h1>
            <p className="text-[10px] text-slate-400">Smart Money Adviser</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1">
          {[
            { name: 'Dashboard', icon: '📊' },
            { name: 'Spending Plan', icon: '💳' },
            { name: 'Savings Plan', icon: '🐷' },
            { name: 'Invest Plan', icon: '📈' },
            { name: 'Bills & Reminders', icon: '📄', active: true },
            { name: 'Calendar', icon: '📅' },
            { name: 'Insights', icon: '💡' },
            { name: 'Ask Advisor', icon: '🤖' },
            { name: 'Settings', icon: '⚙️' },
          ].map((item) => (
            <a
              key={item.name}
              href="#"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.name}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold text-sm">
          M
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 leading-tight">Malvin</p>
          <p className="text-xs text-slate-400">Student</p>
        </div>
      </div>
    </aside>
  );
}