import React, { useState, useEffect, useMemo } from 'react';
import './Reports.css';

export default function Reports() {
  // Date Filtering State
  const [filterPreset, setFilterPreset] = useState('month'); // 'week' | 'month' | '30days' | 'year' | 'all' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Raw App Data State
  const [expenses, setExpenses] = useState([]);
  const [savings, setSavings] = useState([]);
  const [spendingPlans, setSpendingPlans] = useState([]);
  const [bills, setBills] = useState([]);

  // Safe date formatting helper
  const formatDate = (dateVal) => {
    if (!dateVal) return 'Today';
    const d = new Date(dateVal);
    return isNaN(d.getTime())
      ? dateVal
      : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Safe date parsing helper (defaults to current date so missing dates don't get filtered out)
  const parseItemDate = (dateVal) => {
    if (!dateVal) return new Date();
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Load Data from LocalStorage
  const loadAppData = () => {
    try {
      const storedExpenses = JSON.parse(localStorage.getItem('user_expenses') || '[]');
      const storedSavings = JSON.parse(
        localStorage.getItem('user_savings_plans') || localStorage.getItem('user_savings') || '[]'
      );
      const storedSpending = JSON.parse(localStorage.getItem('user_spending_plans') || '[]');
      const storedBills = JSON.parse(localStorage.getItem('user_bills') || '[]');

      setExpenses(storedExpenses);
      setSavings(storedSavings);
      setSpendingPlans(storedSpending);
      setBills(storedBills);
    } catch (err) {
      console.error('Failed to parse financial data from localStorage', err);
    }
  };

  useEffect(() => {
    loadAppData();
    window.addEventListener('storage', loadAppData);
    window.addEventListener('appDataChanged', loadAppData);
    window.addEventListener('user_spending_plans_updated', loadAppData);
    return () => {
      window.removeEventListener('storage', loadAppData);
      window.removeEventListener('appDataChanged', loadAppData);
      window.removeEventListener('user_spending_plans_updated', loadAppData);
    };
  }, []);

  // Compute Active Date Range Bounds
  const activeDateRange = useMemo(() => {
    const now = new Date();
    let start = new Date(0);
    let end = new Date();

    if (filterPreset === 'week') {
      const dayOfWeek = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
    } else if (filterPreset === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (filterPreset === '30days') {
      start = new Date(now);
      start.setDate(now.getDate() - 30);
    } else if (filterPreset === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (filterPreset === 'all') {
      start = new Date(0);
      end = new Date(8640000000000000);
    } else if (filterPreset === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }, [filterPreset, startDate, endDate]);

  // Combine Logged Expenses AND Category-Spent values from Spending Plans
  const allSpentRecords = useMemo(() => {
    const records = [];

    // 1. Direct logged expenses
    expenses.forEach((exp) => {
      records.push({
        id: exp.id || Math.random(),
        category: exp.category || exp.title || 'General Expense',
        amount: parseFloat(exp.amount) || 0,
        rawDate: exp.date || exp.createdAt,
        dateObj: parseItemDate(exp.date || exp.createdAt)
      });
    });

    // 2. Spent amounts recorded inside Spending Plans
    spendingPlans.forEach((plan) => {
      const planRawDate = plan.date || plan.createdAt;
      const categories = plan.categories || plan.categoryBreakdown || [];

      categories.forEach((cat) => {
        const spentVal = parseFloat(cat.spent || 0);
        if (spentVal > 0) {
          records.push({
            id: `sp-${plan.id}-${cat.name || cat.category}`,
            category: cat.name || cat.category || plan.name || 'Plan Category',
            amount: spentVal,
            rawDate: cat.date || planRawDate,
            dateObj: parseItemDate(cat.date || planRawDate)
          });
        }
      });

      // Plan-level spent fallback
      if (categories.length === 0 && parseFloat(plan.totalSpent || plan.spent || 0) > 0) {
        records.push({
          id: `sp-total-${plan.id}`,
          category: plan.name || 'Spending Plan Total',
          amount: parseFloat(plan.totalSpent || plan.spent || 0),
          rawDate: planRawDate,
          dateObj: parseItemDate(planRawDate)
        });
      }
    });

    return records;
  }, [expenses, spendingPlans]);

  // Filter Expenses by Active Date Range
  const filteredExpenses = useMemo(() => {
    return allSpentRecords.filter((rec) => {
      return rec.dateObj >= activeDateRange.start && rec.dateObj <= activeDateRange.end;
    });
  }, [allSpentRecords, activeDateRange]);

  // Aggregate App Metrics
  const metrics = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalSavingsTarget = savings.reduce((sum, item) => sum + (parseFloat(item.targetAmount || item.target || item.amount) || 0), 0);
    const totalSavingsSaved = savings.reduce((sum, item) => sum + (parseFloat(item.currentAmount || item.saved || 0)), 0);

    // Checks budget, amount, totalBudget, and limit
    const totalPlannedBudget = spendingPlans.reduce(
      (sum, item) => sum + (parseFloat(item.budget || item.amount || item.totalBudget || item.limit || 0)),
      0
    );

    const totalUnpaidBills = bills
      .filter((b) => b.status === 'Unpaid' || !b.paid)
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const netSavingsProgress = totalSavingsTarget > 0 
      ? Math.min(100, Math.round((totalSavingsSaved / totalSavingsTarget) * 100)) 
      : 0;

    const categoriesMap = {};
    filteredExpenses.forEach((exp) => {
      const cat = exp.category || 'General';
      const amt = parseFloat(exp.amount) || 0;
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { amount: 0, latestDate: exp.rawDate };
      }
      categoriesMap[cat].amount += amt;
    });

    const categoryBreakdown = Object.keys(categoriesMap).map((cat) => ({
      name: cat,
      amount: categoriesMap[cat].amount,
      latestDate: categoriesMap[cat].latestDate,
      percentage: totalExpenses > 0 ? Math.round((categoriesMap[cat].amount / totalExpenses) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    return {
      totalExpenses,
      totalSavingsTarget,
      totalSavingsSaved,
      totalPlannedBudget,
      totalUnpaidBills,
      netSavingsProgress,
      categoryBreakdown
    };
  }, [filteredExpenses, savings, spendingPlans, bills]);

  return (
    <div className="reports-container">
      {/* HEADER SECTION */}
      <div className="reports-header">
        <div>
          <h1 className="reports-title">Financial Analytics & Reports</h1>
          <p className="reports-subtitle">Comprehensive breakdown across all expenses, budgets, savings, and bills.</p>
        </div>
      </div>

      {/* DATE FILTER BAR */}
      <div className="date-filter-bar">
        <div className="preset-buttons-group">
          {[
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'year', label: 'This Year' },
            { id: 'all', label: 'All Time' },
            { id: 'custom', label: 'Custom Range' }
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setFilterPreset(preset.id)}
              className={`filter-tab-btn ${filterPreset === preset.id ? 'active' : ''}`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {filterPreset === 'custom' && (
          <div className="custom-date-inputs">
            <div className="date-field">
              <label>From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="date-field">
              <label>To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* METRIC OVERVIEW CARDS */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Spent</span>
            <span className="metric-icon red-bg">💸</span>
          </div>
          <h2 className="metric-value">₦{metrics.totalExpenses.toLocaleString()}</h2>
          <p className="metric-footer">{filteredExpenses.length} transactions in this period</p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Planned Spending</span>
            <span className="metric-icon purple-bg">📊</span>
          </div>
          <h2 className="metric-value">₦{metrics.totalPlannedBudget.toLocaleString()}</h2>
          <p className="metric-footer">{spendingPlans.length} active spending plans set</p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Savings Target</span>
            <span className="metric-icon green-bg">🎯</span>
          </div>
          <h2 className="metric-value">₦{metrics.totalSavingsTarget.toLocaleString()}</h2>
          <p className="metric-footer">
            ₦{metrics.totalSavingsSaved.toLocaleString()} accumulated ({metrics.netSavingsProgress}%)
          </p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Pending Bills</span>
            <span className="metric-icon orange-bg">🔔</span>
          </div>
          <h2 className="metric-value">₦{metrics.totalUnpaidBills.toLocaleString()}</h2>
          <p className="metric-footer">
            {bills.filter(b => b.status === 'Unpaid' || !b.paid).length} active bill reminders
          </p>
        </div>
      </div>

      {/* DETAILED ANALYSIS SECTION */}
      <div className="analytics-details-grid">
        <div className="report-panel">
          <h3 className="panel-title">Expense Breakdown by Category</h3>
          {metrics.categoryBreakdown.length === 0 ? (
            <p className="empty-panel-text">No recorded expenses found for this time period.</p>
          ) : (
            <div className="category-list">
              {metrics.categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="category-item">
                  <div className="category-header">
                    <div>
                      <span className="category-name">{cat.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '8px', fontWeight: 'normal' }}>
                        📅 {formatDate(cat.latestDate)}
                      </span>
                    </div>
                    <span className="category-val">₦{cat.amount.toLocaleString()} ({cat.percentage}%)</span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="report-panel">
          <h3 className="panel-title">Active Savings Progress</h3>
          {savings.length === 0 ? (
            <p className="empty-panel-text">No active savings plans found in the app.</p>
          ) : (
            <div className="savings-list">
              {savings.map((plan) => {
                const target = parseFloat(plan.targetAmount || plan.target || plan.amount) || 0;
                const saved = parseFloat(plan.currentAmount || plan.saved || 0);
                const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

                return (
                  <div key={plan.id || plan.title} className="savings-item">
                    <div className="savings-info">
                      <div>
                        <span className="savings-name">{plan.title || 'Savings Goal'}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '8px', fontWeight: 'normal' }}>
                          📅 {formatDate(plan.date || plan.createdAt)}
                        </span>
                      </div>
                      <span className="savings-numbers">
                        ₦{saved.toLocaleString()} / ₦{target.toLocaleString()}
                      </span>
                    </div>
                    <div className="progress-track green-track">
                      <div className="progress-fill green-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}