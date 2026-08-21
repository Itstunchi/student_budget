import React, { useState, useEffect, useRef } from 'react';
import { notify } from "../utils/notificationService";

// Inside your bill/calendar submit handler:
// notify("Bill Reminder Set", `'${billId}' (₦${amount}) due on ${dueDate}`, "bill");
// Retrieve API Keys from Vite or CRA environment variables
const GROQ_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_GROQ_API_KEY) ||
  '';

const GEMINI_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_GEMINI_API_KEY) ||
  '';

// ─── Generic AI caller: Groq first, Gemini fallback. Both forced into
//     strict JSON mode so replies always parse instead of chatting in
//     plain text and silently skipping the requested action. ───
async function callFinanceAI(systemPrompt, userText) {
  if (GROQ_API_KEY) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });
      const data = await response.json();
      if (response.ok && data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      console.warn('Groq failed, trying Gemini...', data?.error);
    } catch (err) {
      console.warn('Groq error, trying Gemini:', err);
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${userText}` }] }],
            generationConfig: { response_mime_type: 'application/json' },
          }),
        }
      );
      const data = await response.json();
      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
      console.error('Gemini fallback failed:', data?.error);
    } catch (err) {
      console.error('Gemini fallback error:', err);
    }
  }

  return null;
}

// ─── Parse the model's JSON reply, tolerating markdown fences / stray text ───
function parseAiJson(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

const formatTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
      text: 'Hello! I am your AI Advisor with full control of this page. Ask me anything about your bills, or tell me to add, edit, delete, or mark bills paid — e.g. "Add a Netflix bill of 4500 due 2026-08-20" or "Mark electricity as paid".',
      time: formatTime(),
    },
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isAiOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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

  const handleEditBill = (billId, changes) => {
    const updated = bills.map((b) => (b.id === billId ? { ...b, ...changes } : b));
    updateBillsState(updated);
  };

  // ─── AI CONTEXT + ACTION EXECUTION ───

  const findBillByName = (name) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    return (
      bills.find((b) => b.name.toLowerCase().includes(lower)) ||
      (bills.length === 1 ? bills[0] : null)
    );
  };

  const buildAiContext = () => ({
    filter,
    bills: bills.map((b) => ({
      name: b.name,
      amount: b.amount,
      category: b.category,
      type: b.type,
      dueDate: b.dueDate,
      status: b.status,
    })),
  });

  const buildSystemPrompt = (context) => `You are the AI Bills Advisor embedded inside a bills & reminders page. You can answer questions AND control the page for the user.

Current page state (JSON): ${JSON.stringify(context)}

Reply with ONLY raw JSON (no markdown fences, no extra commentary) in exactly this shape:
{"reply": "short personalized conversational answer", "action": null}
or
{"reply": "short personalized confirmation of what you did", "action": {"type": "ADD_BILL", "name": "Netflix", "amount": 4500, "dueDate": "2026-08-20", "category": "Entertainment", "billType": "Recurring"}}

Valid action types: "ADD_BILL", "DELETE_BILL", "EDIT_BILL", "MARK_PAID", "MARK_UNPAID".
- ADD_BILL needs "name", "amount" (number), and "dueDate" (YYYY-MM-DD). Optionally "category" (one of Utilities/Entertainment/Housing/Education) and "billType" (Recurring/One-time). If the user clearly asks to add/create a bill, ALWAYS include this action.
- DELETE_BILL, MARK_PAID, MARK_UNPAID need "name" matched to the closest bill name in the state above.
- EDIT_BILL needs "name" and any of "amount" or "dueDate" to change.
- Only include an action when the user clearly asks for it, otherwise "action" must be null.
- Base your reply strictly on the real bills listed above; never invent figures.`;

  const executeAction = (action) => {
    if (!action || !action.type) return;

    switch (action.type) {
      case 'ADD_BILL': {
        if (!action.name || !action.amount || !action.dueDate) break;
        const cat = action.category || 'Utilities';
        const newBill = {
          id: Date.now().toString(),
          name: action.name,
          amount: Number(action.amount),
          category: cat,
          type: action.billType || 'Recurring',
          dueDate: action.dueDate,
          status: 'Unpaid',
          icon: cat === 'Entertainment' ? '🍿' : cat === 'Utilities' ? '⚡' : '🏠',
        };
        updateBillsState([newBill, ...bills]);
        break;
      }
      case 'DELETE_BILL': {
        const target = findBillByName(action.name);
        if (target) handleDeleteBill(target.id);
        break;
      }
      case 'EDIT_BILL': {
        const target = findBillByName(action.name);
        if (target) {
          handleEditBill(target.id, {
            amount: action.amount !== undefined ? Number(action.amount) : target.amount,
            dueDate: action.dueDate || target.dueDate,
          });
        }
        break;
      }
      case 'MARK_PAID': {
        const target = findBillByName(action.name);
        if (target && target.status !== 'Paid') handleTogglePaid(target.id);
        break;
      }
      case 'MARK_UNPAID': {
        const target = findBillByName(action.name);
        if (target && target.status !== 'Unpaid') handleTogglePaid(target.id);
        break;
      }
      default:
        break;
    }
  };

  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;

    const userText = aiPrompt;
    setAiPrompt('');
    setAiMessages((prev) => [...prev, { sender: 'user', text: userText, time: formatTime() }]);
    setAiLoading(true);

    const context = buildAiContext();
    const systemPrompt = buildSystemPrompt(context);
    const rawReply = await callFinanceAI(systemPrompt, userText);
    const parsed = parseAiJson(rawReply);

    if (parsed && parsed.reply) {
      if (parsed.action) {
        executeAction(parsed.action);
      }
      setAiMessages((prev) => [...prev, { sender: 'ai', text: parsed.reply, time: formatTime() }]);
    } else if (rawReply) {
      setAiMessages((prev) => [...prev, { sender: 'ai', text: rawReply, time: formatTime() }]);
    } else {
      setAiMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: '⚠️ Unable to connect to AI services. Please verify your VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY in your .env file.',
          time: formatTime(),
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
          .modal-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* ══════════════ AI WIDGET — matches Savings Plan design ══════════════ */
        .aiw-floating-wrapper {
          position: fixed !important;
          bottom: 24px !important;
          right: 24px !important;
          z-index: 9999 !important;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }
        .aiw-chat-modal {
          width: 380px;
          max-width: calc(100vw - 48px);
          height: 520px;
          max-height: calc(100vh - 120px);
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: aiw-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: bottom right;
        }
        @keyframes aiw-slide-up {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .aiw-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: linear-gradient(135deg, #5334ea 0%, #7c3aed 100%);
          color: white;
          flex-shrink: 0;
        }
        .aiw-title { display: flex; align-items: center; gap: 12px; }
        .aiw-avatar {
          width: 38px; height: 38px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          backdrop-filter: blur(10px);
        }
        .aiw-title-text { display: flex; flex-direction: column; }
        .aiw-title-main { font-size: 15px; font-weight: 700; letter-spacing: -0.2px; }
        .aiw-title-sub {
          font-size: 11px; opacity: 0.8; font-weight: 500;
          display: flex; align-items: center; gap: 6px;
        }
        .aiw-title-sub::before {
          content: ''; width: 6px; height: 6px; background: #34d399;
          border-radius: 50%; display: inline-block;
          animation: aiw-pulse 2s infinite;
        }
        @keyframes aiw-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        .aiw-close-btn {
          width: 32px; height: 32px; border-radius: 50%; border: none;
          background: rgba(255, 255, 255, 0.15); color: white; font-size: 16px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; backdrop-filter: blur(10px);
        }
        .aiw-close-btn:hover { background: rgba(255, 255, 255, 0.25); transform: rotate(90deg); }
        .aiw-chat-body {
          flex: 1; overflow-y: auto; overflow-x: hidden; padding: 20px;
          background: #f8fafc; display: flex; flex-direction: column; gap: 4px;
          scroll-behavior: smooth;
        }
        .aiw-chat-body::-webkit-scrollbar { width: 6px; }
        .aiw-chat-body::-webkit-scrollbar-track { background: transparent; }
        .aiw-chat-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 100px; }
        .aiw-chat-body::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .aiw-date-divider {
          display: flex; align-items: center; justify-content: center;
          margin: 8px 0 16px 0; position: relative;
        }
        .aiw-date-divider::before {
          content: ''; position: absolute; left: 20px; right: 20px; height: 1px; background: #e2e8f0;
        }
        .aiw-date-divider span {
          font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.5px; background: #f8fafc; padding: 0 12px; position: relative; z-index: 1;
        }
        .aiw-bubble-wrapper { display: flex; margin-bottom: 4px; animation: aiw-bubble-in 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .aiw-bubble-wrapper.bot { justify-content: flex-start; }
        .aiw-bubble-wrapper.user { justify-content: flex-end; }
        @keyframes aiw-bubble-in {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .aiw-bubble { display: flex; gap: 8px; max-width: 85%; align-items: flex-end; }
        .aiw-bubble.bot { flex-direction: row; }
        .aiw-bubble.user { flex-direction: row-reverse; }
        .aiw-bubble-avatar {
          width: 28px; height: 28px;
          background: linear-gradient(135deg, #5334ea 0%, #7c3aed 100%);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0; margin-bottom: 4px;
        }
        .aiw-bubble-content { padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
        .aiw-bubble.bot .aiw-bubble-content {
          background: white; color: #334155; border-bottom-left-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;
        }
        .aiw-bubble.user .aiw-bubble-content {
          background: linear-gradient(135deg, #5334ea 0%, #7c3aed 100%);
          color: white; border-bottom-right-radius: 4px;
        }
        .aiw-timestamp { display: block; font-size: 10px; margin-top: 6px; opacity: 0.6; font-weight: 500; }
        .aiw-typing { display: flex; gap: 4px; padding: 4px 8px; align-items: center; }
        .aiw-typing span {
          width: 6px; height: 6px; background: #94a3b8; border-radius: 50%;
          animation: aiw-typing-bounce 1.4s infinite ease-in-out both;
        }
        .aiw-typing span:nth-child(1) { animation-delay: -0.32s; }
        .aiw-typing span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes aiw-typing-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .aiw-input-row { display: flex; gap: 10px; padding: 14px 16px; background: white; border-top: 1px solid #f1f5f9; flex-shrink: 0; }
        .aiw-input-row input {
          flex: 1; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
          font-size: 14px; font-family: inherit; background: #f8fafc; color: #1e293b;
          transition: all 0.2s; outline: none;
        }
        .aiw-input-row input:focus { border-color: #5334ea; background: white; box-shadow: 0 0 0 3px rgba(83, 52, 234, 0.1); }
        .aiw-input-row input::placeholder { color: #94a3b8; }
        .aiw-input-row button {
          width: 44px; height: 44px; border-radius: 12px; border: none;
          background: #e2e8f0; color: #94a3b8; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .aiw-input-row button.active {
          background: linear-gradient(135deg, #5334ea 0%, #7c3aed 100%); color: white;
          box-shadow: 0 4px 12px rgba(83, 52, 234, 0.3);
        }
        .aiw-input-row button.active:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(83, 52, 234, 0.4); }
        .aiw-floating-btn {
          display: flex; align-items: center; gap: 8px; padding: 14px 24px;
          background: linear-gradient(135deg, #6346f6 0%, #5334ea 100%); color: white; border: none;
          border-radius: 100px; font-size: 15px; font-weight: 600; font-family: inherit; cursor: pointer;
          box-shadow: 0 8px 24px rgba(99, 70, 246, 0.35);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          animation: aiw-float-jump 2.5s infinite ease-in-out;
        }
        .aiw-floating-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(99, 70, 246, 0.45); animation-play-state: paused; }
        .aiw-floating-btn.open { width: 48px; height: 48px; padding: 0; border-radius: 50%; justify-content: center; animation: none; }
        @keyframes aiw-float-jump {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @media (max-width: 480px) {
          .aiw-floating-wrapper { bottom: 16px; right: 16px; left: 16px; align-items: stretch; }
          .aiw-chat-modal {
            width: 100%; max-width: 100%; height: calc(100vh - 100px); max-height: 600px;
            position: fixed; bottom: 80px; right: 16px; left: 16px;
          }
          .aiw-floating-btn { align-self: flex-end; }
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

      {/* Floating AI Widget — restyled to match Savings Plan design */}
      <div className="aiw-floating-wrapper">
        {isAiOpen && (
          <div className="aiw-chat-modal">
            <div className="aiw-modal-header">
              <div className="aiw-title">
                <div className="aiw-avatar">🤖</div>
                <div className="aiw-title-text">
                  <span className="aiw-title-main">AI Advisor</span>
                  <span className="aiw-title-sub">Online</span>
                </div>
              </div>
              <button onClick={() => setIsAiOpen(false)} className="aiw-close-btn">✕</button>
            </div>

            <div className="aiw-chat-body">
              <div className="aiw-date-divider"><span>Today</span></div>

              {aiMessages.map((msg, idx) => (
                <div key={idx} className={`aiw-bubble-wrapper ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                  <div className={`aiw-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                    {msg.sender !== 'user' && <div className="aiw-bubble-avatar">🤖</div>}
                    <div>
                      <div className="aiw-bubble-content">{msg.text}</div>
                      <span className="aiw-timestamp">{msg.time || ''}</span>
                    </div>
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="aiw-bubble-wrapper bot">
                  <div className="aiw-bubble bot">
                    <div className="aiw-bubble-avatar">🤖</div>
                    <div className="aiw-bubble-content">
                      <div className="aiw-typing"><span></span><span></span><span></span></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendAiMessage} className="aiw-input-row">
              <input
                type="text"
                placeholder="Ask AI about your bills..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button type="submit" className={aiPrompt.trim() && !aiLoading ? 'active' : ''} disabled={aiLoading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        )}

        <button className={`aiw-floating-btn ${isAiOpen ? 'open' : ''}`} onClick={() => setIsAiOpen(!isAiOpen)}>
          {isAiOpen ? '✕' : <>🤖 AI Advisor</>}
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
