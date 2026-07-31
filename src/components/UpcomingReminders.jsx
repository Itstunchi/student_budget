import React from 'react';

export default function UpcomingReminders({ bills = [] }) {
  const upcoming = bills
    .filter((b) => b.status === 'Unpaid')
    .slice(0, 4);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="font-bold text-slate-900 text-lg mb-4">Upcoming Reminders</h3>

      {upcoming.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-4">No upcoming bill reminders.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {upcoming.map((bill) => (
            <div key={bill.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="text-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-indigo-600 block uppercase">
                    {new Date(bill.dueDate).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {new Date(bill.dueDate).getDate() || '1'}
                  </span>
                </div>
                <div>
                  <h5 className="font-semibold text-slate-800 text-sm">{bill.name}</h5>
                  <p className="text-xs text-amber-600 font-medium">Due: {bill.dueDate}</p>
                </div>
              </div>
              <span className="font-bold text-sm text-slate-800">₦{bill.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}