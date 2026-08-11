import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Filter, ChevronDown, Download,
  CreditCard, Building2, Smartphone, ArrowUp, ArrowDown, 
  ShieldCheck, CheckCircle2, Clock, Zap, Settings, RefreshCw
} from 'lucide-react';
import { 
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import './Reports.css';

// Helper to load logs saved across the app
const getStoredActivities = () => {
  try {
    const saved = localStorage.getItem('app_activities_log');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const getIcon = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('utility') || cat.includes('electricity') || cat.includes('bills')) {
    return <Zap className="rp-act-icon text-amber-500" />;
  }
  if (cat.includes('card') || cat.includes('wifi')) {
    return <CreditCard className="rp-act-icon text-red-500" />;
  }
  if (cat.includes('income') || cat.includes('bank')) {
    return <Building2 className="rp-act-icon text-emerald-500" />;
  }
  if (cat.includes('saving')) {
    return <RefreshCw className="rp-act-icon text-indigo-500" />;
  }
  if (cat.includes('mobile') || cat.includes('airtime')) {
    return <Smartphone className="rp-act-icon text-purple-500" />;
  }
  return <Settings className="rp-act-icon text-slate-500" />;
};

export default function Report() {
  const [activities, setActivities] = useState(getStoredActivities);

  // Listen live for any new activity triggered anywhere in the app
  useEffect(() => {
    const handleStorageChange = () => {
      setActivities(getStoredActivities());
    };

    window.addEventListener('app_activity_logged', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('app_activity_logged', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle downloading report as PDF
  const handleExportStatement = () => {
    window.print();
  };

  // Calculate totals ONLY from actions actually performed
  const metrics = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    let scheduledCount = 0;

    activities.forEach((act) => {
      const amt = Number(act.rawAmount) || 0;
      if (amt > 0) inflow += amt;
      if (amt < 0) outflow += Math.abs(amt);
      if (act.type?.toLowerCase().includes('scheduled')) scheduledCount += 1;
    });

    return { inflow, outflow, scheduledCount };
  }, [activities]);

  // Breakdown chart dynamically grouped from user actions
  const categoryBreakdown = useMemo(() => {
    const counts = {};
    let totalOut = 0;

    activities.forEach((act) => {
      const amt = Number(act.rawAmount) || 0;
      if (amt < 0) {
        const val = Math.abs(amt);
        const cat = act.category || 'General';
        counts[cat] = (counts[cat] || 0) + val;
        totalOut += val;
      }
    });

    const colors = ['#5334ea', '#ec4899', '#10b981', '#0ea5e9', '#94a3b8'];
    return Object.keys(counts).map((cat, index) => ({
      name: cat,
      value: counts[cat],
      percentage: totalOut > 0 ? `${Math.round((counts[cat] / totalOut) * 100)}%` : '0%',
      color: colors[index % colors.length]
    }));
  }, [activities]);

  return (
    <div className="rp-container" id="report-print-area">
      {/* 1. TOP HEADER BANNER (NO NOTIFICATION BUTTON) */}
      <div className="rp-header">
        <div className="rp-header-title">
          <span className="rp-overview-tag">Overview</span>
          <h2>Financial & Activity Report</h2>
          <p className="rp-subtitle">Live activity statement tracking actions taken on your app account.</p>
        </div>

        <div className="rp-header-actions">
          <button className="rp-btn rp-btn-primary rp-export-btn" onClick={handleExportStatement}>
            <Download className="w-4 h-4" />
            Export Statement
          </button>
        </div>
      </div>

      {/* 2. CONTROLS BAR */}
      <div className="rp-controls-bar">
        <div className="rp-section-title">
          <h3>System Overview</h3>
        </div>

        <div className="rp-filters-group">
          <div className="rp-filter-pill">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Jul 1 – Jul 31, 2026</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <button className="rp-btn rp-btn-outline rp-filter-btn">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filter
          </button>
        </div>
      </div>

      {/* 3. METRICS CARDS */}
      <div className="rp-metrics-grid">
        <div className="rp-card rp-metric-card">
          <span className="rp-metric-label">Total Inflow Recorded</span>
          <h3 className="rp-metric-value">
            {metrics.inflow > 0 ? `₦${metrics.inflow.toLocaleString()}` : '₦0'}
          </h3>
          <div className="rp-metric-change pos">
            <ArrowUp className="w-3 h-3" />
            <span>From performed actions</span>
          </div>
        </div>

        <div className="rp-card rp-metric-card">
          <span className="rp-metric-label">Total Outflow Recorded</span>
          <h3 className="rp-metric-value">
            {metrics.outflow > 0 ? `₦${metrics.outflow.toLocaleString()}` : '₦0'}
          </h3>
          <div className="rp-metric-change neg">
            <ArrowDown className="w-3 h-3" />
            <span>From performed actions</span>
          </div>
        </div>

        <div className="rp-card rp-metric-card">
          <span className="rp-metric-label">App Actions Recorded</span>
          <h3 className="rp-metric-value">{activities.length} Events</h3>
          <div className="rp-metric-change pos">
            <span>Actions in log</span>
          </div>
        </div>

        <div className="rp-card rp-metric-card">
          <span className="rp-metric-label">Scheduled Bills</span>
          <h3 className="rp-metric-value">{metrics.scheduledCount} Active</h3>
          <div className="rp-metric-change pos">
            <span>Set up in app</span>
          </div>
        </div>
      </div>

      {/* 4. CHARTS SECTION */}
      <div className="rp-charts-grid">
        <div className="rp-card rp-donut-card">
          <div className="rp-card-header">
            <h3>Outflow Distribution</h3>
          </div>
          
          {categoryBreakdown.length > 0 ? (
            <>
              <div className="rp-donut-wrapper">
                <div className="rp-donut-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={categoryBreakdown} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="rp-donut-center">
                  <p className="rp-donut-total">₦{metrics.outflow.toLocaleString()}</p>
                  <p className="rp-donut-sub">Total Spent</p>
                </div>
              </div>

              <div className="rp-breakdown-list">
                {categoryBreakdown.map((item) => (
                  <div key={item.name} className="rp-breakdown-item">
                    <div className="rp-breakdown-label">
                      <span className="rp-dot" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <div className="rp-breakdown-values">
                      <span className="rp-pct">{item.percentage}</span>
                      <span className="rp-amt">₦{item.value.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rp-empty-state">No money outgoing actions logged yet.</div>
          )}
        </div>
      </div>

      {/* 5. ACTIVITY TABLE */}
      <div className="rp-bottom-grid">
        <div className="rp-card rp-table-card">
          <div className="rp-card-header">
            <div>
              <h3>Logged App Activity & History</h3>
              <p className="rp-card-sub">Itemized audit of everything performed on the app</p>
            </div>
          </div>

          <div className="rp-table-responsive">
            {activities.length > 0 ? (
              <table className="rp-table">
                <thead>
                  <tr>
                    <th>Event / Action</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Date & Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((act) => (
                    <tr key={act.id}>
                      <td>
                        <div className="rp-act-title-cell">
                          {getIcon(act.category)}
                          <span className="rp-act-title">{act.title}</span>
                        </div>
                      </td>
                      <td>
                        <span className="rp-category-badge">{act.category}</span>
                      </td>
                      <td className="rp-act-type">{act.type}</td>
                      <td className="rp-act-time">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{act.timestamp}</span>
                        </div>
                      </td>
                      <td className="rp-act-amount">{act.amount || '—'}</td>
                      <td>
                        <span className={`rp-status-badge ${act.status ? act.status.toLowerCase() : 'completed'}`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {act.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="rp-empty-state">No app activities logged yet. Perform an action anywhere on the app to record it here.</div>
            )}
          </div>
        </div>

        {/* SIDE TIMESTAMPS */}
        <div className="rp-card rp-summary-card">
          <div className="rp-card-header">
            <h3>Recent Action Timestamps</h3>
          </div>

          <div className="rp-summary-list">
            {activities.slice(0, 6).map((act) => (
              <div key={act.id} className="rp-summary-item">
                <span className="rp-summary-label">{act.title}</span>
                <span className="rp-summary-val">{act.timestamp}</span>
              </div>
            ))}
          </div>

          <div className="rp-report-footer-info">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Live Local Logging Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}