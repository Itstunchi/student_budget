import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function UpcomingReminders() {
  const reminders = [
    {
      id: 1,
      month: 'MAY',
      day: '17',
      title: 'Netflix Subscription',
      amount: '₦4,500',
      dueIn: 'Due in 2 days',
      status: 'Unpaid',
    },
    {
      id: 2,
      month: 'MAY',
      day: '20',
      title: 'WiFi Subscription',
      amount: '₦7,000',
      dueIn: 'Due in 5 days',
      status: 'Upcoming',
    },
    {
      id: 3,
      month: 'MAY',
      day: '22',
      title: 'Water Bill',
      amount: '₦3,500',
      dueIn: 'Due in 7 days',
      status: 'Upcoming',
    },
    {
      id: 4,
      month: 'MAY',
      day: '28',
      title: 'School Fees (2nd Installment)',
      amount: '₦50,000',
      dueIn: 'Due in 13 days',
      status: 'Upcoming',
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      {/* Header Row */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-900 text-sm">Upcoming Reminders</h3>
        <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          View Calendar
        </button>
      </div>

      {/* Reminders List Stack */}
      <div className="space-y-3.5">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer"
          >
            {/* Left side: Mini Calendar Sheet & Title */}
            <div className="flex items-center gap-3">
              {/* Calendar Block Badge */}
              <div className="w-11 h-12 border border-slate-100 rounded-xl flex flex-col items-center justify-center bg-slate-50/50 shadow-sm overflow-hidden flex-shrink-0">
                <span className="text-[8px] font-bold tracking-wider text-purple-600 pt-0.5 bg-purple-50/50 w-full text-center block">
                  {reminder.month}
                </span>
                <span className="text-base font-extrabold text-slate-800 leading-none pb-1 pt-0.5">
                  {reminder.day}
                </span>
              </div>

              {/* Text Description */}
              <div>
                <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {reminder.title}
                </h4>
                <p
                  className={`text-[10px] font-medium mt-0.5 ${
                    reminder.status === 'Unpaid' ? 'text-red-500' : 'text-amber-500'
                  }`}
                >
                  {reminder.dueIn}
                </p>
              </div>
            </div>

            {/* Right side: Amount & Chevron */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">{reminder.amount}</span>
              <ChevronRight
                size={14}
                className="text-slate-300 group-hover:text-slate-500 transition-colors"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}