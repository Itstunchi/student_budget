// src/components/BillsSummary.jsx
import React from 'react';

export default function BillsSummary() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-base">Bills Summary</h3>
        <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 outline-none">
          <option>This Month</option>
        </select>
      </div>

      {/* Top Stats Grid - Roomy columns */}
      <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-5">
        <div>
          <p className="text-[11px] text-slate-400 font-medium">Total Bills</p>
          <p className="text-xl font-extrabold text-indigo-600 mt-1">8</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Bills to pay</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 font-medium">Total Amount</p>
          <p className="text-lg font-bold text-slate-800 mt-1 whitespace-nowrap">₦194,200</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 font-medium">Paid</p>
          <p className="text-lg font-bold text-emerald-600 mt-1 whitespace-nowrap">₦32,000</p>
          <p className="text-[10px] text-slate-400 mt-0.5">2 bills</p>
        </div>
      </div>

      {/* Donut Chart + Legend */}
      <div className="flex items-center gap-4">
        {/* Donut SVG */}
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3.8" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3.8" strokeDasharray="70 100" strokeDashoffset="0" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3.8" strokeDasharray="12 100" strokeDashoffset="-70" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3.8" strokeDasharray="18 100" strokeDashoffset="-82" />
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-slate-600 font-medium">Unpaid</span>
            </div>
            <span className="text-[11px] text-slate-400">2 bills</span>
            <span className="font-bold text-slate-700">₦6,000</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-slate-600 font-medium">Upcoming</span>
            </div>
            <span className="text-[11px] text-slate-400">5 bills</span>
            <span className="font-bold text-slate-700">₦145,200</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 font-medium">Paid</span>
            </div>
            <span className="text-[11px] text-slate-400">2 bills</span>
            <span className="font-bold text-slate-700">₦32,000</span>
          </div>
        </div>
      </div>
    </div>
  );
}