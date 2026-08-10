import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Calendar.css";

// Retrieve API Keys
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
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userText },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });
      const data = await response.json();
      if (response.ok && data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      console.warn("Groq failed, trying Gemini...", data?.error);
    } catch (err) {
      console.warn("Groq error, trying Gemini:", err);
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${userText}` }] }],
            generationConfig: { response_mime_type: "application/json" },
          }),
        }
      );
      const data = await response.json();
      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
      console.error("Gemini fallback failed:", data?.error);
    } catch (err) {
      console.error("Gemini fallback error:", err);
    }
  }

  return null;
}

// ─── Parse the model's JSON reply, tolerating markdown fences / stray text ───
function parseAiJson(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
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
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ─── Icons (inline SVGs) ───
const Icons = {
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  ),
  chevronDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
  ),
  filter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
  ),
  sync: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  x: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
};

// ─── Color mapping ───
const categoryColors = {
  subscription: { dot: "#ff4d6d", bg: "#fff0f3" },
  utility: { dot: "#3b82f6", bg: "#eff6ff" },
  utilities: { dot: "#3b82f6", bg: "#eff6ff" },
  internet: { dot: "#f59e0b", bg: "#fffbeb" },
  education: { dot: "#10b981", bg: "#ecfdf5" },
  rent: { dot: "#f97316", bg: "#fff7ed" },
  housing: { dot: "#f97316", bg: "#fff7ed" },
  entertainment: { dot: "#ff4d6d", bg: "#fff0f3" },
  electricity: { dot: "#8b5cf6", bg: "#f5f3ff" },
};

const statusConfig = {
  paid: { label: "Paid", color: "#10b981" },
  upcoming: { label: "Upcoming", color: "#f59e0b" },
  "due-today": { label: "Due Today", color: "#ff4d6d" },
  overdue: { label: "Overdue", color: "#7c3aed" },
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ─── Date Helpers ───
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const formatMonthYear = (date) => date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

// ─── Toast ───
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  return (
    <div className={`toast toast-${type}`}>
      <span>{type === "success" ? Icons.check : null} {message}</span>
      <button onClick={onClose} className="toast-close">{Icons.x}</button>
    </div>
  );
};

// ─── Filter Dropdown ───
const FilterDropdown = ({ filters, onToggle, onClose }) => {
  const categories = [
    { key: "utilities", label: "Utilities" },
    { key: "entertainment", label: "Entertainment" },
    { key: "housing", label: "Housing" },
    { key: "education", label: "Education" },
  ];
  return (
    <div className="filter-dropdown">
      <div className="filter-header">
        <h4>Filter by Category</h4>
        <button className="text-btn" onClick={onClose}>Done</button>
      </div>
      {categories.map((cat) => (
        <label key={cat.key} className="filter-option">
          <input
            type="checkbox"
            checked={filters[cat.key] !== false}
            onChange={() => onToggle(cat.key)}
          />
          <span className="filter-dot" style={{ backgroundColor: categoryColors[cat.key]?.dot || '#3b82f6' }} />
          <span>{cat.label}</span>
        </label>
      ))}
    </div>
  );
};

// ─── Month Picker Dropdown ───
const MonthPicker = ({ currentDate, onSelect, onClose }) => {
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());
  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();

  return (
    <div className="month-picker-dropdown">
      <div className="month-picker-header">
        <button className="picker-nav-btn" onClick={() => setPickerYear((y) => y - 1)}>
          {Icons.chevronLeft}
        </button>
        <span className="picker-year">{pickerYear}</span>
        <button className="picker-nav-btn" onClick={() => setPickerYear((y) => y + 1)}>
          {Icons.chevronRight}
        </button>
      </div>
      <div className="month-picker-grid">
        {MONTH_NAMES.map((name, idx) => {
          const isSelected = idx === selectedMonth && pickerYear === selectedYear;
          return (
            <button
              key={name}
              className={`month-picker-cell ${isSelected ? "selected" : ""}`}
              onClick={() => {
                onSelect(new Date(pickerYear, idx, 1));
                onClose();
              }}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Calendar Event Card ───
const CalendarEvent = ({ event }) => {
  const catKey = (event.category || '').toLowerCase();
  const colors = categoryColors[catKey] || categoryColors.utility;
  return (
    <div className="cal-event" style={{ backgroundColor: colors.bg }}>
      <div className="event-dot" style={{ backgroundColor: colors.dot }} />
      <div className="event-info">
        <span className="event-title">{event.title}</span>
        <span className="event-amount">₦{Number(event.amount || 0).toLocaleString()}</span>
        <span className="event-meta">{event.type || event.status}</span>
      </div>
    </div>
  );
};

// ─── Month View ───
const MonthView = ({ currentDate, events }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const days = [];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isPadding: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isPadding: false });
  }
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isPadding: true });
  }

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  return (
    <div className="calendar-grid-container">
      <div className="weekdays-row">
        {weekDays.map((d) => (
          <div key={d} className="weekday-label">{d}</div>
        ))}
      </div>
      <div className="days-grid">
        {days.map((cell, idx) => {
          const dayEvents = !cell.isPadding ? getEventsForDay(cell.day) : [];
          const isToday = !cell.isPadding && isCurrentMonth && cell.day === todayDate;
          return (
            <div key={idx} className={`day-cell ${cell.isPadding ? "padding-day" : ""} ${isToday ? "today" : ""}`}>
              <span className="day-number">{cell.day}</span>
              <div className="day-events">
                {dayEvents.map((evt) => (
                  <CalendarEvent key={evt.id} event={evt} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Week View ───
const WeekView = ({ currentDate, events }) => {
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();

  const getEventsForDate = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  return (
    <div className="week-view">
      <div className="week-grid">
        {Array.from({ length: 7 }).map((_, i) => {
          const date = new Date(startOfWeek);
          date.setDate(date.getDate() + i);
          const isToday = date.toDateString() === today.toDateString();
          const dayEvents = getEventsForDate(date);
          return (
            <div key={i} className={`week-day ${isToday ? "today" : ""}`}>
              <div className="week-day-header">
                <span className="week-day-name">{weekDays[i]}</span>
                <span className="week-day-number">{date.getDate()}</span>
              </div>
              <div className="week-day-events">
                {dayEvents.length === 0 && <span className="empty-day">No events</span>}
                {dayEvents.map((evt) => (
                  <CalendarEvent key={evt.id} event={evt} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── List View ───
const ListView = ({ currentDate, events }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const today = new Date();

  const daysWithEvents = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayEvents = events.filter((e) => e.date === dateStr);
    if (dayEvents.length > 0) {
      daysWithEvents.push({ day: d, dateStr, events: dayEvents });
    }
  }

  if (daysWithEvents.length === 0) {
    return (
      <div className="list-view empty">
        <div className="empty-illustration">📅</div>
        <h3>No events this month</h3>
        <p>Your calendar is clear. Add a reminder to get started.</p>
      </div>
    );
  }

  return (
    <div className="list-view">
      {daysWithEvents.map(({ day, dateStr, events: dayEvents }) => {
        const dateObj = new Date(dateStr);
        const isToday = dateObj.toDateString() === today.toDateString();
        return (
          <div key={day} className={`list-day ${isToday ? "today" : ""}`}>
            <div className="list-day-header">
              <span className="list-day-number">{day}</span>
              <span className="list-day-name">
                {dateObj.toLocaleDateString("en-US", { weekday: "long" })}
              </span>
              {isToday && <span className="today-badge">Today</span>}
            </div>
            <div className="list-day-events">
              {dayEvents.map((evt) => (
                <CalendarEvent key={evt.id} event={evt} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Legend ───
const Legend = () => (
  <div className="calendar-legend">
    {Object.entries(statusConfig).map(([key, cfg]) => (
      <div key={key} className="legend-item">
        <span className="legend-dot" style={{ backgroundColor: cfg.color }} />
        <span className="legend-label">{cfg.label}</span>
      </div>
    ))}
  </div>
);

/* ─── CalendarPage ─── */
const CalendarPage = ({ events: propEvents }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  
  const [showFilters, setShowFilters] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  // Floating AI State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your AI Advisor with full control of this page. Ask me about your schedule, or tell me to add, edit, or remove an event — e.g. \"Add a Rent event for 150000 on 2026-09-01\".",
      time: formatTime(),
    },
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isAiOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [aiMessages, aiLoading, isAiOpen]);

  const [localEvents, setLocalEvents] = useState([]);
  const [filters, setFilters] = useState({
    utilities: true,
    entertainment: true,
    housing: true,
    education: true,
  });

  const loadEvents = () => {
    const savedBills = localStorage.getItem("user_bills");
    if (savedBills) {
      const parsed = JSON.parse(savedBills);
      const mapped = parsed.map((bill) => ({
        id: bill.id,
        title: bill.name,
        amount: bill.amount,
        date: bill.dueDate,
        category: (bill.category || 'utility').toLowerCase(),
        type: bill.type,
        status: bill.status,
      }));
      setLocalEvents(mapped);
    } else {
      setLocalEvents([]);
    }
  };

  useEffect(() => {
    loadEvents();
    window.addEventListener("billsUpdated", loadEvents);
    window.addEventListener("storage", loadEvents);
    return () => {
      window.removeEventListener("billsUpdated", loadEvents);
      window.removeEventListener("storage", loadEvents);
    };
  }, []);

  const events = propEvents && propEvents.length > 0 ? propEvents : localEvents;

  const handlePrev = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNext = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleAddReminder = () => navigate("/bills");

  const handleSync = () => {
    setIsSyncing(true);
    loadEvents();
    setTimeout(() => {
      setIsSyncing(false);
      setToast({ message: "Calendar synced successfully", type: "success" });
      setTimeout(() => setToast(null), 3000);
    }, 1000);
  };

  const toggleFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const cat = (e.category || '').toLowerCase();
      return filters[cat] !== false;
    });
  }, [events, filters]);

  // ─── AI CONTEXT + ACTION EXECUTION ───
  // The calendar is a read-through view of "user_bills" — creating, editing,
  // or deleting an "event" here means writing to that same bill store (and
  // keeping "user_calendar_events" + the billsUpdated event in sync), so
  // Bills.jsx and the Dashboard immediately reflect the change too.

  const findEventByTitle = (title) => {
    if (!title) return null;
    const lower = title.toLowerCase();
    return (
      events.find((e) => (e.title || '').toLowerCase().includes(lower)) ||
      (events.length === 1 ? events[0] : null)
    );
  };

  const persistBillsChange = (updatedBillsRaw) => {
    localStorage.setItem("user_bills", JSON.stringify(updatedBillsRaw));
    const calendarEvents = updatedBillsRaw.map((bill) => ({
      id: bill.id,
      title: `${bill.name} (₦${Number(bill.amount || 0).toLocaleString()})`,
      date: bill.dueDate,
      type: "bill",
      category: bill.category,
      status: bill.status,
    }));
    localStorage.setItem("user_calendar_events", JSON.stringify(calendarEvents));
    window.dispatchEvent(new Event("billsUpdated"));
    loadEvents();
  };

  const buildAiContext = () => ({
    viewMode,
    currentMonth: formatMonthYear(currentDate),
    events: events.map((e) => ({
      title: e.title,
      amount: e.amount,
      date: e.date,
      category: e.category,
      status: e.status,
    })),
  });

  const buildSystemPrompt = (context) => `You are the AI Calendar Advisor embedded inside a schedule/bills calendar page. You can answer questions AND control the page for the user.

Current page state (JSON): ${JSON.stringify(context)}

Reply with ONLY raw JSON (no markdown fences, no extra commentary) in exactly this shape:
{"reply": "short personalized conversational answer", "action": null}
or
{"reply": "short personalized confirmation of what you did", "action": {"type": "CREATE_EVENT", "title": "Rent", "amount": 150000, "date": "2026-09-01", "category": "Housing"}}

Valid action types: "CREATE_EVENT", "DELETE_EVENT", "EDIT_EVENT", "SWITCH_VIEW", "GO_TO_MONTH".
- CREATE_EVENT needs "title", "date" (YYYY-MM-DD), optionally "amount" (number) and "category" (Utilities/Entertainment/Housing/Education). If the user clearly asks to add/create an event, ALWAYS include this action.
- DELETE_EVENT needs "title" matched to the closest event title in the state above.
- EDIT_EVENT needs "title" and any of "date" or "amount" to change.
- SWITCH_VIEW needs "view", one of "month"/"week"/"list".
- GO_TO_MONTH needs "year" (number) and "month" (1-12).
- Only include an action when the user clearly asks for it, otherwise "action" must be null.
- Base your reply strictly on the real events listed above; never invent figures.`;

  const executeAction = (action) => {
    if (!action || !action.type) return;
    const rawBills = JSON.parse(localStorage.getItem("user_bills") || "[]");

    switch (action.type) {
      case "CREATE_EVENT": {
        if (!action.title || !action.date) break;
        const cat = action.category || "Utilities";
        const newBill = {
          id: Date.now().toString(),
          name: action.title,
          amount: Number(action.amount) || 0,
          category: cat,
          type: "One-time",
          dueDate: action.date,
          status: "Unpaid",
          icon: cat === "Entertainment" ? "🍿" : cat === "Utilities" ? "⚡" : "🏠",
        };
        persistBillsChange([newBill, ...rawBills]);
        break;
      }
      case "DELETE_EVENT": {
        const target = findEventByTitle(action.title);
        if (target) {
          persistBillsChange(rawBills.filter((b) => b.id !== target.id));
        }
        break;
      }
      case "EDIT_EVENT": {
        const target = findEventByTitle(action.title);
        if (target) {
          const updated = rawBills.map((b) =>
            b.id === target.id
              ? {
                  ...b,
                  dueDate: action.date || b.dueDate,
                  amount: action.amount !== undefined ? Number(action.amount) : b.amount,
                }
              : b
          );
          persistBillsChange(updated);
        }
        break;
      }
      case "SWITCH_VIEW": {
        if (action.view) setViewMode(action.view);
        break;
      }
      case "GO_TO_MONTH": {
        if (action.year && action.month) {
          setCurrentDate(new Date(Number(action.year), Number(action.month) - 1, 1));
        }
        break;
      }
      default:
        break;
    }
  };

  // Floating AI Send Handler (Groq First -> Gemini Fallback)
  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;

    const userText = aiPrompt;
    setAiPrompt("");
    setAiMessages((prev) => [...prev, { sender: "user", text: userText, time: formatTime() }]);
    setAiLoading(true);

    const context = buildAiContext();
    const systemPrompt = buildSystemPrompt(context);
    const rawReply = await callFinanceAI(systemPrompt, userText);
    const parsed = parseAiJson(rawReply);

    if (parsed && parsed.reply) {
      if (parsed.action) {
        executeAction(parsed.action);
      }
      setAiMessages((prev) => [...prev, { sender: "ai", text: parsed.reply, time: formatTime() }]);
    } else if (rawReply) {
      setAiMessages((prev) => [...prev, { sender: "ai", text: rawReply, time: formatTime() }]);
    } else {
      setAiMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ Unable to reach AI services right now. Please check your Groq or Gemini keys.",
          time: formatTime(),
        },
      ]);
    }

    setAiLoading(false);
  };

  return (
    <div className="app-container">
      <style>{`
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .header-top h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        .page-banner-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-left: 4px solid #7c3aed;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          margin-bottom: 1.5rem;
        }
        .banner-text h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
        }
        .banner-text p {
          color: #64748b;
          font-size: 0.875rem;
          margin: 0;
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

      <main className="main-content" style={{ position: 'relative', width: '100%' }}>
        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

        {/* ─── Top Level Navigation Bar ─── */}
        <div className="header-top">
          <h3>Overview</h3>
        </div>

        {/* ─── Banner Card ─── */}
        <div className="page-banner-card">
          <div className="banner-text">
            <h2>Calendar</h2>
            <p>Track and manage your upcoming bills, payments, and events in one place.</p>
          </div>
          <button className="btn-primary add-reminder-btn" onClick={handleAddReminder}>
            {Icons.plus} Add New Bill
          </button>
        </div>

        {/* ─── Calendar Control Toolbar ─── */}
        <div className="calendar-toolbar">
          <div className="toolbar-left">
            <button className="toolbar-nav-btn" onClick={handlePrev}>{Icons.chevronLeft}</button>
            <button className="toolbar-nav-btn" onClick={handleNext}>{Icons.chevronRight}</button>
            <button className="toolbar-today" onClick={handleToday}>Today</button>
            <div className="month-picker-wrapper">
              <button
                className="toolbar-month"
                onClick={() => setShowMonthPicker(!showMonthPicker)}
              >
                {formatMonthYear(currentDate)}
                <span className={`month-chevron ${showMonthPicker ? "open" : ""}`}>{Icons.chevronDown}</span>
              </button>
              {showMonthPicker && (
                <>
                  <div className="dropdown-overlay" onClick={() => setShowMonthPicker(false)} />
                  <MonthPicker
                    currentDate={currentDate}
                    onSelect={setCurrentDate}
                    onClose={() => setShowMonthPicker(false)}
                  />
                </>
              )}
            </div>
          </div>

          <div className="toolbar-right">
            <button 
              className={`sync-btn ${isSyncing ? "syncing" : ""}`} 
              onClick={handleSync} 
              disabled={isSyncing}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
            >
              {Icons.sync} {isSyncing ? "Syncing..." : "Sync Calendar"}
            </button>

            <div className="view-switcher">
              {["Month", "Week", "List"].map((v) => (
                <button
                  key={v}
                  className={`view-btn ${viewMode === v.toLowerCase() ? "active" : ""}`}
                  onClick={() => setViewMode(v.toLowerCase())}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="filter-wrapper">
              <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
                {Icons.filter} All
              </button>
              {showFilters && (
                <>
                  <div className="dropdown-overlay" onClick={() => setShowFilters(false)} />
                  <FilterDropdown filters={filters} onToggle={toggleFilter} onClose={() => setShowFilters(false)} />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="calendar-body">
          <div className="calendar-main" style={{ width: '100%' }}>
            {viewMode === "month" && <MonthView currentDate={currentDate} events={filteredEvents} />}
            {viewMode === "week" && <WeekView currentDate={currentDate} events={filteredEvents} />}
            {viewMode === "list" && <ListView currentDate={currentDate} events={filteredEvents} />}
            <Legend />
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
                  <div key={idx} className={`aiw-bubble-wrapper ${msg.sender === "user" ? "user" : "bot"}`}>
                    <div className={`aiw-bubble ${msg.sender === "user" ? "user" : "bot"}`}>
                      {msg.sender !== "user" && <div className="aiw-bubble-avatar">🤖</div>}
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
                  placeholder="Ask AI about your schedule..."
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

          <button className={`aiw-floating-btn ${isAiOpen ? "open" : ""}`} onClick={() => setIsAiOpen(!isAiOpen)}>
            {isAiOpen ? '✕' : <>🤖 AI Advisor</>}
          </button>
        </div>
      </main>
    </div>
  );
};

export default CalendarPage;
