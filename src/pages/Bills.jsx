import React, { useState, useEffect, useRef } from 'react';

// Retrieve API Keys from Vite or CRA environment variables
const GROQ_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_GROQ_API_KEY) ||
  '';

const GEMINI_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_GEMINI_API_KEY) ||
  '';

// Custom Responsive Dropdown Component
function CustomSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || value;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: 0 }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.625rem 0.875rem',
          borderRadius: '0.5rem',
          border: '1px solid #cbd5e1',
          fontSize: '0.875rem',
          background: '#ffffff',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          boxSizing: 'border-box',
          color: '#1e293b',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: '0.5rem' }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.25rem',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            zIndex: 50,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                background: value === opt.value ? '#f5f3ff' : 'transparent',
                color: value === opt.value ? '#7c3aed' : '#1e293b',
                fontWeight: value === opt.value ? '600' : '400',
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Bills() {
  const [bills, setBills] = useState(() => {
    const saved = localStorage.getItem('user_bills');
    return saved ? JSON.parse(saved) : [];
  });

  const [filter, setFilter] = useState('All Bills');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('Due Date');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Floating AI Assistant State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Advisor. Ask me anything about your upcoming bills, payment schedules, or cash flow.',
    },
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isAiOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, aiLoading, isAiOpen]);

  // Form states
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [type, setType] = useState('Recurring');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    const syncBills = () => {
      const saved = localStorage.getItem('user_bills');
      if (saved) setBills(JSON.parse(saved));
    };
    window.addEventListener('billsUpdated', syncBills);
    return () => window.removeEventListener('billsUpdated', syncBills);
  }, []);

  const updateBillsState = (newBills) => {
    setBills(newBills);
    localStorage.setItem('user_bills', JSON.stringify(newBills));

    const calendarEvents = newBills.map((bill) => ({
      id: bill.id,
      title: `${bill.name} (₦${bill.amount.toLocaleString()})`,
      date: bill.dueDate,
      type: 'bill',
      category: bill.category,
      status: bill.status,
    }));
    localStorage.setItem('user_calendar_events', JSON.stringify(calendarEvents));

    window.dispatchEvent(new Event('billsUpdated'));
  };

  const handleAddBillSubmit = (e) => {
    e.preventDefault();
    if (!name || !amount || !dueDate) {
      alert('Please fill out all required fields.');
      return;
    }

    const newBill = {
      id: Date.now().toString(),
      name,
      amount: parseFloat(amount),
      category,
      type,
      dueDate,
      status: 'Unpaid',
      icon: category === 'Entertainment' ? '🍿' : category === 'Utilities' ? '⚡' : '🏠',
    };

    updateBillsState([newBill, ...bills]);
    setName('');
    setAmount('');
    setDueDate('');
    setIsModalOpen(false);
  };

  const handleTogglePaid = (billId) => {
    const updated = bills.map((b) =>
      b.id === billId ? { ...b, status: b.status === 'Paid' ? 'Unpaid' : 'Paid' } : b
    );
    updateBillsState(updated);
  };

  const handleDeleteBill = (billId) => {
    updateBillsState(bills.filter((b) => b.id !== billId));
  };

  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;

    const userText = aiPrompt;
    setAiPrompt('');
    setAiMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setAiLoading(true);

    const unpaidList = bills
      .filter((b) => b.status === 'Unpaid')
      .map((b) => `${b.name}: ₦${b.amount} due on ${b.dueDate}`)
      .join('; ');

    const systemPrompt = `You are BudgetBuddy AI Advisor. Context on current unpaid bills: [${unpaidList || 'None'}]. Be concise, encouraging, and helpful.`;

    let reply = null;

    if (GROQ_API_KEY) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userText },
            ],
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        if (response.ok && data?.choices?.[0]?.message?.content) {
          reply = data.choices[0].message.content;
        }
      } catch (err) {
        console.warn('Groq API error, switching to Gemini fallback:', err);
      }
    }

    if (!reply && GEMINI_API_KEY) {
      try {
        const fullPrompt = `${systemPrompt}\nUser Question: ${userText}`;
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
            }),
          }
        );

        const data = await response.json();
        if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          reply = data.candidates[0].content.parts[0].text;
        }
      } catch (err) {
        console.error('Gemini fallback error:', err);
      }
    }

    if (reply) {
      setAiMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    } else {
      setAiMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: '⚠️ Unable to connect to AI services. Please verify your VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY in your .env file.',
        },
      ]);
    }

    setAiLoading(false);
  };

  const filteredBills = bills
    .filter((bill) => {
      if (filter === 'Recurring') return bill.type === 'Recurring';
      if (filter === 'One-time') return bill.type === 'One-time';
      if (filter === 'Paid') return bill.status === 'Paid';
      if (filter === 'Unpaid') return bill.status === 'Unpaid';
      return true;
    })
    .filter((bill) =>
      selectedCategory === 'All Categories' ? true : bill.category.toLowerCase() === selectedCategory.toLowerCase()
    )
    .filter((bill) => bill.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'Due Date') return new Date(a.dueDate) - new Date(b.dueDate);
      if (sortBy === 'Amount') return b.amount - a.amount;
      return 0;
    });

  const totalAmount = bills.reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalPaid = bills.filter((b) => b.status === 'Paid').reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalUnpaid = totalAmount - totalPaid;
  const paidPercentage = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;
  const strokeDashoffset = 251.2 - (251.2 * paidPercentage) / 100;

  return (
    <div style={styles.container}>
      <style>{`
        *, *:before, *:after {
          box-sizing: border-box !important;
        }

        @keyframes aiBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .animated-ai-btn {
          animation: aiBounce 2.5s infinite ease-in-out;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .animated-ai-btn:hover {
          transform: scale(1.05);
        }

        body, html {
          max-width: 100vw;
          overflow-x: hidden;
        }

        @media (max-width: 768px) {
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
          .responsive-search-row {
            flex-direction: column !important;
            width: 100% !important;
            gap: 0.75rem !important;
          }
          .responsive-header-card {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
          }
          .responsive-bill-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .responsive-bill-right {
            width: 100% !important;
            justify-content: space-between !important;
            border-top: 1px dashed #e2e8f0;
            padding-top: 0.5rem;
          }
          .responsive-tabs {
            overflow-x: auto;
            white-space: nowrap;
            width: 100%;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 0.5rem;
          }
          .ai-drawer-mobile {
            width: calc(100vw - 2rem) !important;
            right: 0 !important;
          }
          .modal-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="responsive-header-card" style={styles.headerCard}>
        <div>
          <h1 style={styles.pageTitle}>Bills & Reminders</h1>
          <p style={styles.pageSubtitle}>Track and manage all your recurring and one-time bills in one place.</p>
        </div>
        <button style={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
          + Add New Bill
        </button>
      </div>

      {/* Main Grid */}
      <div className="responsive-grid" style={styles.gridLayout}>
        {/* Left Col: Filtered Bills */}
        <div style={styles.leftCol}>
          <div style={styles.card}>
            <div className="responsive-tabs" style={styles.filterTabs}>
              {['All Bills', 'Recurring', 'One-time', 'Paid', 'Unpaid'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    ...styles.tabBtn,
                    ...(filter === tab ? styles.activeTabBtn : {}),
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="responsive-search-row" style={styles.searchRow}>
              <input
                type="text"
                placeholder="Search bills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              <CustomSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { value: 'All Categories', label: 'All Categories' },
                  { value: 'Utilities', label: 'Utilities' },
                  { value: 'Entertainment', label: 'Entertainment' },
                  { value: 'Housing', label: 'Housing' },
                  { value: 'Education', label: 'Education' },
                ]}
              />
              <CustomSelect
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: 'Due Date', label: 'Sort: Due Date' },
                  { value: 'Amount', label: 'Sort: Amount' },
                ]}
              />
            </div>

            <div style={styles.billsListContainer}>
              {filteredBills.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📄</div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>No Bills Found</h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '300px' }}>
                    Click below to add your first bill and trigger automated reminders.
                  </p>
                  <button style={{ ...styles.primaryBtn, marginTop: '1rem' }} onClick={() => setIsModalOpen(true)}>
                    + Add Bill
                  </button>
                </div>
              ) : (
                filteredBills.map((bill) => (
                  <div key={bill.id} className="responsive-bill-item" style={styles.billItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', overflow: 'hidden' }}>
                      <div style={styles.billIconBox}>{bill.icon || '📌'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h4 style={styles.billName}>{bill.name}</h4>
                          <span style={styles.badge}>{bill.type}</span>
                        </div>
                        <p style={styles.billSub}>
                          {bill.category} • Due: {bill.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="responsive-bill-right" style={styles.billRightActions}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={styles.billAmount}>₦{bill.amount.toLocaleString()}</div>
                        <span
                          style={{
                            ...styles.statusBadge,
                            ...(bill.status === 'Paid' ? styles.statusPaid : styles.statusUnpaid),
                          }}
                        >
                          {bill.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => handleTogglePaid(bill.id)}
                          style={styles.iconActionBtn}
                          title="Toggle Paid Status"
                        >
                          {bill.status === 'Paid' ? '↩️' : '✓'}
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill.id)}
                          style={{ ...styles.iconActionBtn, color: '#ef4444' }}
                          title="Delete Bill"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Progress Ring Summary & Reminders */}
        <div style={styles.rightCol}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Bills Summary</h3>
            <div style={styles.circleContainer}>
              <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#7c3aed"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray="251.2"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div style={styles.circleTextOverlay}>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>{paidPercentage}%</span>
                <span style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: '600' }}>PAID</span>
              </div>
            </div>

            <div style={styles.summaryGrid}>
              <div style={styles.summaryBox}>
                <span style={styles.summaryLabel}>Total Bills</span>
                <span style={styles.summaryVal}>{bills.length}</span>
              </div>
              <div style={styles.summaryBox}>
                <span style={styles.summaryLabel}>Total Amount</span>
                <span style={styles.summaryVal}>₦{totalAmount.toLocaleString()}</span>
              </div>
              <div style={{ ...styles.summaryBox, background: '#f5f3ff' }}>
                <span style={{ ...styles.summaryLabel, color: '#7c3aed' }}>Paid</span>
                <span style={{ ...styles.summaryVal, color: '#6d28d9' }}>₦{totalPaid.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: '#d97706', fontWeight: '600' }}>
                Unpaid Balance: ₦{totalUnpaid.toLocaleString()}
              </span>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Upcoming Reminders</h3>
            {bills.filter((b) => b.status === 'Unpaid').length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
                No upcoming bill reminders.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bills
                  .filter((b) => b.status === 'Unpaid')
                  .slice(0, 4)
                  .map((bill) => (
                    <div key={bill.id} style={styles.reminderItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={styles.reminderDateBox}>
                          <span style={styles.reminderMonth}>
                            {new Date(bill.dueDate).toLocaleString('default', { month: 'short' })}
                          </span>
                          <span style={styles.reminderDay}>{new Date(bill.dueDate).getDate() || '1'}</span>
                        </div>
                        <div>
                          <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
                            {bill.name}
                          </h5>
                          <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '500' }}>
                            Due: {bill.dueDate}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '0.875rem', color: '#1e293b' }}>
                        ₦{bill.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating AI Widget */}
      <div style={styles.floatingAiWrapper}>
        {isAiOpen && (
          <div className="ai-drawer-mobile" style={styles.aiChatDrawer}>
            <div style={styles.aiChatHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🤖</span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>AI Advisor</span>
              </div>
              <button onClick={() => setIsAiOpen(false)} style={styles.aiCloseBtn}>✕</button>
            </div>

            <div style={styles.aiChatBody}>
              {aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.chatBubble,
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.sender === 'user' ? '#7c3aed' : '#f1f5f9',
                    color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                  }}
                >
                  {msg.text}
                </div>
              ))}
              {aiLoading && (
                <div style={{ ...styles.chatBubble, alignSelf: 'flex-start', background: '#f1f5f9', color: '#64748b' }}>
                  Thinking... ⏳
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendAiMessage} style={styles.aiChatFooter}>
              <input
                type="text"
                placeholder="Ask AI about your bills..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                style={styles.aiChatInput}
              />
              <button type="submit" style={styles.aiChatSendBtn} disabled={aiLoading}>
                Send
              </button>
            </form>
          </div>
        )}

        <button className="animated-ai-btn" onClick={() => setIsAiOpen(!isAiOpen)} style={styles.floatingButton}>
          🤖 AI Advisor
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>Add New Bill</h3>
              <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleAddBillSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={styles.label}>Bill Name</label>
                <input
                  type="text"
                  placeholder="e.g. Electricity Bill"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Amount (₦)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={styles.label}>Category</label>
                  <CustomSelect
                    value={category}
                    onChange={setCategory}
                    options={[
                      { value: 'Utilities', label: 'Utilities' },
                      { value: 'Entertainment', label: 'Entertainment' },
                      { value: 'Housing', label: 'Housing' },
                      { value: 'Education', label: 'Education' },
                    ]}
                  />
                </div>
                <div>
                  <label style={styles.label}>Type</label>
                  <CustomSelect
                    value={type}
                    onChange={setType}
                    options={[
                      { value: 'Recurring', label: 'Recurring' },
                      { value: 'One-time', label: 'One-time' },
                    ]}
                  />
                </div>
              </div>
              <div>
                <label style={styles.label}>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.secondaryBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn}>
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    padding: '1.25rem',
    width: '100%',
    maxWidth: '100vw',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    boxSizing: 'border-box',
    position: 'relative',
    overflowX: 'hidden',
  },
  headerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#ffffff',
    padding: '1.25rem 1.5rem',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    borderLeft: '5px solid #7c3aed',
    width: '100%',
    boxSizing: 'border-box',
  },
  pageTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  pageSubtitle: {
    margin: '0.25rem 0 0 0',
    color: '#64748b',
    fontSize: '0.875rem',
  },
  primaryBtn: {
    background: '#7c3aed',
    color: '#ffffff',
    fontWeight: '600',
    padding: '0.75rem 1.25rem',
    borderRadius: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    width: 'fit-content',
  },
  secondaryBtn: {
    flex: 1,
    background: '#f1f5f9',
    color: '#475569',
    fontWeight: '600',
    padding: '0.75rem 1.25rem',
    borderRadius: '0.75rem',
    border: 'none',
    cursor: 'pointer',
  },
  gridLayout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '1.5rem',
    width: '100%',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    width: '100%',
    minWidth: 0,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    width: '100%',
    minWidth: 0,
  },
  card: {
    background: '#ffffff',
    padding: '1.25rem',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9',
    width: '100%',
    boxSizing: 'border-box',
  },
  cardTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  filterTabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  tabBtn: {
    background: 'transparent',
    border: 'none',
    padding: '0.5rem 0.875rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#64748b',
    cursor: 'pointer',
    flexShrink: 0,
  },
  activeTabBtn: {
    background: '#f5f3ff',
    color: '#7c3aed',
  },
  searchRow: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.25rem',
    width: '100%',
  },
  searchInput: {
    flex: 1,
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    border: '1px solid #cbd5e1',
    fontSize: '0.875rem',
    outline: 'none',
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
  },
  billsListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
    border: '2px dashed #e2e8f0',
    borderRadius: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  billItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid #f1f5f9',
    background: '#ffffff',
    width: '100%',
    boxSizing: 'border-box',
  },
  billIconBox: {
    fontSize: '1.25rem',
    background: '#f8fafc',
    padding: '0.625rem',
    borderRadius: '0.5rem',
    flexShrink: 0,
  },
  billName: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badge: {
    fontSize: '0.6875rem',
    padding: '0.125rem 0.5rem',
    borderRadius: '0.25rem',
    background: '#f5f3ff',
    color: '#7c3aed',
    fontWeight: '600',
    flexShrink: 0,
  },
  billSub: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.75rem',
    color: '#64748b',
  },
  billRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  billAmount: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    fontSize: '0.6875rem',
    padding: '0.125rem 0.5rem',
    borderRadius: '0.25rem',
    fontWeight: '700',
  },
  statusPaid: {
    background: '#d1fae5',
    color: '#047857',
  },
  statusUnpaid: {
    background: '#fef3c7',
    color: '#d97706',
  },
  iconActionBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.25rem',
  },
  circleContainer: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1rem 0 1.5rem 0',
  },
  circleTextOverlay: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
    textAlign: 'center',
  },
  summaryBox: {
    background: '#f8fafc',
    padding: '0.75rem 0.25rem',
    borderRadius: '0.5rem',
  },
  summaryLabel: {
    display: 'block',
    fontSize: '0.7rem',
    color: '#64748b',
    marginBottom: '0.25rem',
  },
  summaryVal: {
    fontSize: '0.8125rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  reminderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    background: '#f8fafc',
  },
  reminderDateBox: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    textAlign: 'center',
  },
  reminderMonth: {
    display: 'block',
    fontSize: '0.625rem',
    fontWeight: '700',
    color: '#7c3aed',
    textTransform: 'uppercase',
  },
  reminderDay: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  floatingAiWrapper: {
    position: 'fixed',
    bottom: '1.5rem',
    right: '1.5rem',
    zIndex: 999,
  },
  floatingButton: {
    background: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    borderRadius: '2rem',
    padding: '0.75rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: '700',
    boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.5)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  aiChatDrawer: {
    position: 'absolute',
    bottom: '60px',
    right: 0,
    width: '320px',
    height: '400px',
    background: '#ffffff',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  aiChatHeader: {
    background: '#7c3aed',
    padding: '0.875rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  aiChatBody: {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  chatBubble: {
    padding: '0.625rem 0.875rem',
    borderRadius: '0.75rem',
    fontSize: '0.8125rem',
    maxWidth: '85%',
    lineHeight: '1.4',
    wordBreak: 'break-word',
  },
  aiChatFooter: {
    display: 'flex',
    padding: '0.75rem',
    borderTop: '1px solid #f1f5f9',
    gap: '0.5rem',
  },
  aiChatInput: {
    flex: 1,
    border: '1px solid #cbd5e1',
    padding: '0.5rem 0.75rem',
    fontSize: '0.8125rem',
    outline: 'none',
    borderRadius: '0.5rem',
    minWidth: 0,
  },
  aiChatSendBtn: {
    background: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    padding: '0.5rem 0.875rem',
    borderRadius: '0.5rem',
    fontSize: '0.8125rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalCard: {
    background: '#ffffff',
    padding: '1.5rem',
    borderRadius: '1rem',
    width: '100%',
    maxWidth: '420px',
    boxSizing: 'border-box',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '0.375rem',
  },
  input: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid #cbd5e1',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    color: '#94a3b8',
  },
};