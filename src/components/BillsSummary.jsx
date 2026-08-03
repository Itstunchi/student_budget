import React from 'react';

export default function BillsSummary({ bills = [] }) {
  const totalBillsCount = bills.length;
  const totalAmount = bills.reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalPaid = bills
    .filter((b) => b.status === 'Paid')
    .reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalUnpaid = totalAmount - totalPaid;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="font-bold text-slate-900 text-lg mb-4">Bills Summary</h3>

      <div className="grid grid-cols-3 gap-2 text-center mb-6">
        <div className="bg-slate-50 p-3 rounded-xl">
          <p className="text-xs text-slate-500">Total Bills</p>
          <p className="text-lg font-bold text-slate-800">{totalBillsCount}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl">
          <p className="text-xs text-slate-500">Total Amount</p>
          <p className="text-sm font-bold text-slate-800">₦{totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-emerald-50 p-3 rounded-xl">
          <p className="text-xs text-emerald-600">Paid</p>
          <p className="text-sm font-bold text-emerald-700">₦{totalPaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Unpaid Balance</span>
          <span className="font-bold text-amber-600">₦{totalUnpaid.toLocaleString()}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{ width: totalAmount > 0 ? `${(totalPaid / totalAmount) * 100}%` : '0%' }}
          ></div>
        </div>
      </div>
    </div>
  );
}