import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BillList from '../components/BillList';
import BillsSummary from '../components/BillsSummary';
import UpcomingReminders from '../components/UpcomingReminders';

export default function Bills() {
  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden">
      {/* 1. Fixed Sidebar */}
      <Sidebar />

      {/* 2. Main Page Body */}
      <main className="flex-1 min-w-0 p-8 flex flex-col gap-8">
        <Header />

        {/* 3. Roomy Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Bills List (Takes up 2/3 space) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <BillList />
          </div>

          {/* Right Summary Sidebar (Takes up 1/3 space) */}
          <div className="flex flex-col gap-6">
            <BillsSummary />
            <UpcomingReminders />
          </div>
        </div>
      </main>
    </div>
  );
}