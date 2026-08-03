import React from 'react';

export default function BillList({
  bills,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  onTogglePaid,
  onDeleteBill,
  onOpenAddModal,
}) {
  const tabs = ['All Bills', 'Recurring', 'One-time', 'Paid', 'Unpaid'];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6">
      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === tab
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search bills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white"
        >
          <option value="All Categories">All Categories</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Utilities">Utilities</option>
          <option value="Housing">Housing</option>
          <option value="Education">Education</option>
          <option value="Other">Other</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white"
        >
          <option value="Due Date">Sort by: Due Date</option>
          <option value="Amount">Sort by: Amount</option>
        </select>
      </div>

      {/* Bill Items List */}
      <div className="flex flex-col gap-3">
        {bills.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="font-semibold text-slate-800 text-lg">No Bills Found</h3>
            <p className="text-slate-500 text-sm max-w-sm mt-1">
              You haven't added any bills yet. Click below to add your first bill!
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-xl font-medium"
            >
              + Add Bill
            </button>
          </div>
        ) : (
          bills.map((bill) => (
            <div
              key={bill.id}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl p-3 bg-slate-50 rounded-xl">{bill.icon || '📌'}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-800">{bill.name}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-medium">
                      {bill.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {bill.category} • Due: {bill.dueDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-bold text-slate-900">₦{bill.amount.toLocaleString()}</div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                      bill.status === 'Paid'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {bill.status}
                  </span>
                </div>
                <button
                  onClick={() => onTogglePaid(bill.id)}
                  title="Toggle Status"
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600"
                >
                  {bill.status === 'Paid' ? '↩️' : '✓'}
                </button>
                <button
                  onClick={() => onDeleteBill(bill.id)}
                  title="Delete Bill"
                  className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}