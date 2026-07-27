import React from 'react';
import { MoreVertical, ChevronDown } from 'lucide-react';

export default function BillList() {
  // Mock data representing the items shown in the user layout mockup
  const bills = [
    {
      id: 1,
      title: 'Netflix Subscription',
      category: 'Entertainment',
      period: 'Monthly',
      type: 'Recurring',
      amount: '₦4,500',
      dueIn: 'Due in 2 days',
      status: 'Unpaid',
      logo: '🍿',
      bgColor: 'bg-red-50 text-red-600',
    },
    {
      id: 2,
      title: 'WiFi Subscription',
      category: 'Internet',
      period: 'Monthly',
      type: 'Recurring',
      amount: '₦7,000',
      dueIn: 'Due in 5 days',
      status: 'Upcoming',
      logo: '🌐',
      bgColor: 'bg-amber-50 text-amber-600',
    },
    {
      id: 3,
      title: 'Water Bill',
      category: 'Utilities',
      period: 'Monthly',
      type: null,
      amount: '₦3,500',
      dueIn: 'Due in 7 days',
      status: 'Upcoming',
      logo: '💧',
      bgColor: 'bg-amber-50 text-amber-600',
    },
    {
      id: 4,
      title: 'School Fees (2nd Installment)',
      category: 'Education',
      period: null,
      type: 'One-time',
      amount: '₦50,000',
      dueIn: 'Due in 13 days',
      status: 'Upcoming',
      logo: '🎓',
      bgColor: 'bg-amber-50 text-amber-600',
    },
    {
      id: 5,
      title: 'Electricity Bill',
      category: 'Utilities',
      period: 'Monthly',
      type: null,
      amount: '₦8,200',
      dueIn: 'Due in 18 days',
      status: 'Upcoming',
      logo: '⚡',
      bgColor: 'bg-amber-50 text-amber-600',
    },
    {
      id: 6,
      title: 'House Rent',
      category: 'Housing',
      period: 'Monthly',
      type: 'Recurring',
      amount: '₦120,000',
      dueIn: 'Due in 25 days',
      status: 'Upcoming',
      logo: '🏠',
      bgColor: 'bg-green-50 text-green-600',
    },
    {
      id: 7,
      title: 'Mobile Airtime',
      category: 'Communication',
      period: 'Weekly',
      type: null,
      amount: '₦1,500',
      dueIn: 'Due in 2 days',
      status: 'Unpaid',
      logo: '📱',
      bgColor: 'bg-red-50 text-red-600',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-slate-900 px-1">All Bills</h3>

      {/* Container for rows */}
      <div className="space-y-3">
        {bills.map((bill) => (
          <div
            key={bill.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow gap-4"
          >
            {/* Left: Icon & Meta Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 flex items-center justify-center rounded-xl text-xl">
                {bill.logo}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-slate-800">{bill.title}</h4>
                  {bill.type && (
                    <span className="text-[10px] font-medium bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                      {bill.type}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {bill.category} {bill.period && `• ${bill.period}`}
                </p>
              </div>
            </div>

            {/* Right: Pricing, Status, Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
              {/* Financial value data */}
              <div className="text-left sm:text-right">
                <p className="font-bold text-sm text-slate-900">{bill.amount}</p>
                <p
                  className={`text-xs mt-0.5 font-medium ${
                    bill.status === 'Unpaid' ? 'text-red-500' : 'text-amber-500'
                  }`}
                >
                  {bill.dueIn}
                </p>
              </div>

              {/* Dynamic Action tags */}
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold tracking-wide px-3 py-1 rounded-xl uppercase text-[10px] ${
                    bill.status === 'Unpaid'
                      ? 'bg-red-50 text-red-500 border border-red-100'
                      : bill.status === 'Paid'
                      ? 'bg-green-50 text-green-500 border border-green-100'
                      : 'bg-amber-50 text-amber-500 border border-amber-100'
                  }`}
                >
                  {bill.status}
                </span>

                <button className="text-slate-400 hover:text-slate-600 p-1">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Load Action Element */}
      <button className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 transition-colors rounded-xl font-medium text-sm text-indigo-600 flex items-center justify-center gap-2 shadow-sm">
        <span>Load More Bills</span>
        <ChevronDown size={16} />
      </button>
    </div>
  );
}