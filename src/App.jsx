import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BillList from './components/BillList';
import BillsSummary from './components/BillsSummary';
import UpcomingReminders from './components/UpcomingReminders';

export default function App() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
        {/* Top Header Row */}
        <Header />

        {/* Dashboard Content Grid - Roomy layout columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Left Column (Takes up 2/3 of space) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <BillList />
          </div>

          {/* Right Sidebar Column (Takes up 1/3 of space with guaranteed minimum width) */}
          <div className="flex flex-col gap-6 min-w-[340px]">
            <BillsSummary />
            <UpcomingReminders />
          </div>
        </div>
      </div>
    </div>
  );
}