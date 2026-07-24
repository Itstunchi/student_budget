import React from 'react';

export default function BillsSummary() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800 text-lg">Bills Summary</h3>
        <select className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 outline-none">
          <option>This Month</option>
        </select>
      </div>

      {/* Top Stats Cards Grid - Spaced out properly */}
      <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs text-slate-400 font-medium">Total Bills</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">8</p>
          <p className="text-xs text-slate-400 mt-0.5">Bills to pay</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Total Amount</p>
          <p className="text-xl font-bold text-slate-800 mt-1 whitespace-nowrap">₦194,200</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Paid</p>
          <p className="text-xl font-bold text-emerald-600 mt-1 whitespace-nowrap">₦32,000</p>
          <p className="text-xs text-slate-400 mt-0.5">2 bills</p>
        </div>
      </div>

      {/* Donut Chart & Legend Row - Aligned cleanly */}
      <div className="flex items-center justify-between gap-6">
        {/* Placeholder Donut SVG */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
            <circle cx="18" cy="18" r="16" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray="70 100" strokeDashoffset="0" />
            <circle cx="18" cy="18" r="16" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeDasharray="10 100" strokeDashoffset="-70" />
            <circle cx="18" cy="18" r="16" fill="none" stroke="#10b981" strokeWidth="3.5" strokeDasharray="20 100" strokeDashoffset="-80" />
          </svg>
        </div>

        {/* Legend List */}
        <div className="flex-1 flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 block"></span>
              <span className="text-slate-600 font-medium">Unpaid</span>
            </div>
            <span className="text-xs text-slate-400">2 bills</span>
            <span className="font-semibold text-slate-700">₦6,000</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
              <span className="text-slate-600 font-medium">Upcoming</span>
            </div>
            <span className="text-xs text-slate-400">5 bills</span>
            <span className="font-semibold text-slate-700">₦145,200</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
              <span className="text-slate-600 font-medium">Paid</span>
            </div>
            <span className="text-xs text-slate-400">2 bills</span>
            <span className="font-semibold text-slate-700">₦32,000</span>
          </div>
        </div>
      </div>
    </div>
  );
}