import React, { useState } from 'react';
import './SpendingPlanWizard.css';
import { auth } from "../firebase/firebase";
import { saveBudget } from "../services/budgetService";
import { useNavigate } from "react-router-dom";
import useBudget from "../hooks/useBudget";
import Sidebar from "../components/Sidebar";

export default function SpendingPlanWizard() {
const [step, setStep] = useState(1);
const [amount, setAmount] = useState('');
const [duration, setDuration] = useState('Monthly');
const navigate = useNavigate();

// Parse total amount safely
const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;

// Dynamic budget calculations based on percentages shown in the design
const allocations = [
{ name: 'Needs', percent: 40, color: '#4F46E5', desc: 'Essentials like rent, food, transport, etc.' },
{ name: 'Wants', percent: 20, color: '#EC4899', desc: 'Lifestyle, eating out, entertainment, etc.' },
{ name: 'Savings', percent: 20, color: '#F97316', desc: 'Emergency fund and financial security.' },
{ name: 'Investments', percent: 10, color: '#10B981', desc: 'Grow your money for the future.' },
{ name: 'Others', percent: 10, color: '#3B82F6', desc: 'Miscellaneous and unplanned expenses.' },
].map((item) => ({
...item,
val: (numericAmount * (item.percent / 100)),
}));

const formatCurrency = (val) => {
return '₦' + val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const handleNext = () => {
if (step === 1 && numericAmount <= 0) {
alert('Please enter or select a valid amount.');
return;
}
if (step < 4) setStep(step + 1);
};

const handleBack = () => {
if (step > 1) setStep(step - 1);
};

const handleSavePlan = async () => {
  try {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first.");
      return;
    }

    const budgetData = {
      amount: numericAmount,
      duration,
      planType: "AI Balanced Plan",

      allocations: allocations.map((item) => ({
        category: item.name,
        amount: item.val,
        percentage: item.percent,
        color: item.color,
        description: item.desc,
      })),
    };

    const result = await saveBudget(user.uid, budgetData);

    if (result.success) {
      navigate("/dashboard");
    } else {
      alert(result.message);
    }

  } catch (error) {
    console.error(error);
    alert("Something went wrong.");
  }
};

return (
<div className="spw-container">
<div className="spw-main-content">

{/* STEP 1: AMOUNT */}
{step === 1 && (
<div className="spw-grid">
<div className="spw-card spw-primary-panel">
<h2>How much money do you have?</h2>
<p className="spw-subtitle">Enter the total amount you want to plan.</p>

<div className="spw-form-group">
<label>Total Amount</label>
<div className="spw-input-wrapper">
<span className="spw-currency-symbol">₦</span>
<input
type="number"
placeholder="0"
value={amount}
onChange={(e) => setAmount(e.target.value)}
/>
{amount && (
<button className="spw-clear-btn" onClick={() => setAmount('')}>✕</button>
)}
</div>
</div>

<div className="spw-preset-chips">
{[50000, 100000, 200000].map((preset) => (
<button
key={preset}
className={`spw-chip ${numericAmount === preset ? 'active' : ''}`}
onClick={() => setAmount(preset.toString())}
>
{formatCurrency(preset)}
</button>
))}
</div>

<div className="spw-info-banner">
<div className="spw-icon-circle">💡</div>
<p>This amount will help our AI advisor create the best plan for you.</p>
</div>

<div className="spw-actions">
<button className="spw-btn spw-btn-primary" onClick={handleNext}>
Continue →
</button>
</div>
</div>

<div className="spw-card spw-sidebar-panel">
<div className="spw-sidebar-header">
<span className="spw-sidebar-icon">🎯</span>
<h3>Why this matters</h3>
</div>
<p className="spw-sidebar-desc">
Knowing your total amount helps the AI advisor allocate your money across needs, wants, savings, and investments in the best way possible.
</p>
<ul className="spw-check-list">
<li>✓ Get a personalized plan</li>
<li>✓ Track your spending</li>
<li>✓ Reach your financial goals faster</li>
</ul>
<div className="spw-illustration-box">
<div className="spw-bot-avatar">🤖</div>
</div>
</div>
</div>
)}

{/* STEP 2: DURATION */}
{step === 2 && (
<div className="spw-grid">
<div className="spw-card spw-primary-panel">
<h2>Choose a duration</h2>
<p className="spw-subtitle">For how long do you want this spending plan?</p>

<div className="spw-duration-grid">
{[
{ key: 'Daily', icon: '☀️', desc: 'Plan your day to day spending' },
{ key: 'Weekly', icon: '📅', desc: 'Plan your week efficiently' },
{ key: 'Monthly', icon: '🗓️', desc: 'Most popular choice', popular: true },
{ key: 'Yearly', icon: '📆', desc: 'Plan your entire year' }
].map((item) => (
<div
key={item.key}
className={`spw-duration-card ${duration === item.key ? 'selected' : ''}`}
onClick={() => setDuration(item.key)}
>
{duration === item.key && <span className="spw-check-badge">✓</span>}
<div className="spw-duration-icon">{item.icon}</div>
<h4>{item.key}</h4>
<p>{item.desc}</p>
</div>
))}
</div>

<div className="spw-info-banner">
<div className="spw-icon-circle">📅</div>
<p>A {duration.toLowerCase()} plan gives you a balanced view of your income, bills, expenses, and savings.</p>
</div>

<div className="spw-summary-box">
<h4>Summary</h4>
<div className="spw-summary-row">
<span>Total Amount</span>
<strong>{formatCurrency(numericAmount)}</strong>
</div>
<div className="spw-summary-row">
<span>Duration</span>
<strong>{duration}</strong>
</div>
</div>

<div className="spw-actions spw-actions-split">
<button className="spw-btn spw-btn-secondary" onClick={handleBack}>
Back
</button>
<button className="spw-btn spw-btn-primary" onClick={handleNext}>
Continue →
</button>
</div>
</div>

<div className="spw-card spw-sidebar-panel">
<div className="spw-sidebar-header">
<span className="spw-sidebar-icon">⏱️</span>
<h3>Why duration matters</h3>
</div>
<p className="spw-sidebar-desc">
The duration helps our AI advisor break down your money into manageable chunks and set realistic goals.
</p>
<ul className="spw-check-list">
<li>✓ See how much to spend each period</li>
<li>✓ Track your progress easily</li>
<li>✓ Adjust your plan anytime</li>
</ul>
</div>
</div>
)}

{/* STEP 3: GOALS & RECOMMENDATIONS */}
{step === 3 && (
<div className="spw-grid">
<div className="spw-card spw-primary-panel">
<div className="spw-panel-header">
<div>
<h2>✨ AI Recommended Plan</h2>
<p className="spw-subtitle">Your personalized {duration.toLowerCase()} spending breakdown.</p>
</div>
</div>

<div className="spw-table-wrapper">
<table className="spw-table">
<thead>
<tr>
<th>Category</th>
<th>Amount</th>
<th>Percentage</th>
<th>Purpose</th>
</tr>
</thead>
<tbody>
{allocations.map((item) => (
<tr key={item.name}>
<td>
<span className="spw-cat-badge" style={{ backgroundColor: item.color }}></span>
{item.name}
</td>
<td><strong>{formatCurrency(item.val)}</strong></td>
<td>
<div className="spw-percent-bar-wrapper">
<span>{item.percent}%</span>
<div className="spw-bar-bg">
<div
className="spw-bar-fill"
style={{ width: `${item.percent}%`, backgroundColor: item.color }}
></div>
</div>
</div>
</td>
<td className="spw-purpose-text">{item.desc}</td>
</tr>
))}
</tbody>
</table>
</div>

<div className="spw-metrics-grid">
<div className="spw-metric-card">
<span className="spw-metric-label">Total Amount</span>
<span className="spw-metric-val">{formatCurrency(numericAmount)}</span>
</div>
<div className="spw-metric-card">
<span className="spw-metric-label">Duration</span>
<span className="spw-metric-val">{duration}</span>
</div>
<div className="spw-metric-card">
<span className="spw-metric-label">Total Categories</span>
<span className="spw-metric-val">5</span>
</div>
<div className="spw-metric-card">
<span className="spw-metric-label">Goal</span>
<span className="spw-metric-val">Balanced Plan</span>
</div>
</div>

<div className="spw-rule-banner">
<div className="spw-icon-circle">⚡</div>
<p><strong>This plan follows the 50/30/20 rule principles.</strong> Adjusted for optional investments and emergency savings.</p>
</div>

<div className="spw-actions spw-actions-split">
<button className="spw-btn spw-btn-secondary" onClick={handleBack}>
Back
</button>
<button className="spw-btn spw-btn-primary" onClick={handleNext}>
Continue to Your Plan →
</button>
</div>
</div>

<div className="spw-card spw-sidebar-panel">
<div className="spw-advisor-bubble">
<div className="spw-bot-avatar">🤖</div>
<div>
<h4>AI Advisor Says</h4>
<p className="spw-quote">"Great choice! This plan is balanced and sustainable. Stick to it and you'll reach your financial goals faster."</p>
</div>
</div>

<div className="spw-sidebar-summary">
<h4>Plan Summary</h4>
<div className="spw-summary-row"><span>Total Amount</span> <strong>{formatCurrency(numericAmount)}</strong></div>
<div className="spw-summary-row"><span>Plan Duration</span> <strong>{duration}</strong></div>
<div className="spw-summary-row"><span>Plan Type</span> <strong>AI Balanced Plan</strong></div>
</div>

<div className="spw-tips-box">
<h4>Tips to Stay on Track</h4>
<ul className="spw-check-list">
<li>✓ Track your expenses daily</li>
<li>✓ Avoid unnecessary spending</li>
<li>✓ Save before you spend</li>
<li>✓ Review your plan every month</li>
</ul>
</div>
</div>
</div>
)}

{/* STEP 4: FINAL PLAN OVERVIEW */}
{step === 4 && (
<div className="spw-grid">
<div className="spw-card spw-primary-panel">
<div className="spw-panel-header">
<div>
<h2>✨ Your Personalized Spending Plan</h2>
<p className="spw-subtitle">Your AI crafted plan summary and next steps.</p>
</div>
<button className="spw-btn spw-btn-outline" onClick={() => alert('Downloading plan PDF...')}>
📥 Download Plan
</button>
</div>

<div className="spw-preview-grid">
<div className="spw-summary-list">
<h4>Plan Breakdown</h4>
{allocations.map((item) => (
<div className="spw-breakdown-row" key={item.name}>
<span>
<span className="spw-cat-badge" style={{ backgroundColor: item.color }}></span>
{item.name}
</span>
<strong>{formatCurrency(item.val)}</strong>
</div>
))}
<div className="spw-breakdown-total">
<span>Total Amount</span>
<strong>{formatCurrency(numericAmount)}</strong>
</div>
</div>

<div className="spw-chart-box">
<h4>Plan Visual</h4>
<div className="spw-donut-chart">
<div className="spw-donut-hole">
<strong>{formatCurrency(numericAmount)}</strong>
<small>{duration} Plan</small>
</div>
</div>
<div className="spw-chart-legend">
{allocations.map((item) => (
<div key={item.name} className="spw-legend-item">
<span className="spw-legend-color" style={{ backgroundColor: item.color }}></span>
<span>{item.name} ({item.percent}%)</span>
</div>
))}
</div>
</div>
</div>

<div className="spw-next-steps">
<h4>What Happens Next?</h4>
<div className="spw-steps-timeline">
<div className="spw-timeline-item">
<div className="spw-tl-icon">🎯</div>
<h5>1. Follow Your Plan</h5>
<p>Stick to your limits.</p>
</div>
<div className="spw-timeline-item">
<div className="spw-tl-icon">📊</div>
<h5>2. Track Progress</h5>
<p>Monitor spending.</p>
</div>
<div className="spw-timeline-item">
<div className="spw-tl-icon">🤖</div>
<h5>3. Get AI Insights</h5>
<p>Receive tips & alerts.</p>
</div>
<div className="spw-timeline-item">
<div className="spw-tl-icon">🏆</div>
<h5>4. Achieve Goals</h5>
<p>Build better habits.</p>
</div>
</div>
</div>

<div className="spw-actions spw-actions-split">
<button className="spw-btn spw-btn-secondary" onClick={handleBack}>
Back
</button>
<button
  className="spw-btn spw-btn-primary"
  onClick={handleSavePlan}
>
  Start Following Plan →
</button>
</div>
</div>

<div className="spw-card spw-sidebar-panel">
<div className="spw-advisor-bubble">
<div className="spw-bot-avatar">🤖</div>
<div>
<h4>AI Advisor Says</h4>
<p className="spw-quote">"Great work! Consistency is the key to financial freedom. I'll be here to guide you along the way."</p>
</div>
</div>

<div className="spw-sidebar-summary">
<h4>Plan Details</h4>
<div className="spw-summary-row"><span>Total Amount</span> <strong>{formatCurrency(numericAmount)}</strong></div>
<div className="spw-summary-row"><span>Plan Duration</span> <strong>{duration}</strong></div>
<div className="spw-summary-row"><span>Plan Type</span> <strong>AI Balanced Plan</strong></div>
</div>

<div className="spw-tips-box">
<h4>Tips to Stay on Track</h4>
<ul className="spw-check-list">
<li>✓ Track your expenses daily</li>
<li>✓ Avoid unnecessary spending</li>
<li>✓ Save before you spend</li>
<li>✓ Review your plan every month</li>
</ul>
</div>
</div>
</div>
)}

</div>
</div>
);
}