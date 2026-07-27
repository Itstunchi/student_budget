import React from 'react';
import { Bell, Plus, Search, ChevronDown, ListFilter } from 'lucide-react';

export default function Header() {
  const tabs = ['All Bills', 'Recurring', 'One-time', 'Paid'];

  return (
    <div className="w-full space-y-6">
      {/* Top Section: Title & Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bills & Reminders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage all your bills in one place.</p>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-4">
          {/* Notification Bell with Badge */}
          <button className="relative p-2.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Add New Bill Button */}
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
            <Plus size={18} />
            <span>Add New Bill</span>
          </button>
        </div>
      </div>

      {/* Middle Section: Filter Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              className={`pb-3 text-sm font-medium transition-all ${
                idx === 0
                  ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Section: Search & Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search Input Box */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search bills..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm placeholder-slate-400"
          />
        </div>

        {/* Dropdowns & Grid-toggle options */}
        <div className="flex items-center gap-3">
          {/* Categories Dropdown */}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 shadow-sm">
            <span>All Categories</span>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {/* Sort Menu Dropdown */}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 shadow-sm">
            <span className="text-slate-400 font-normal">Sort by:</span>
            <span className="font-medium">Due Date</span>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {/* View Toggle Icon Button */}
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm">
            <ListFilter size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}