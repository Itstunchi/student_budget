import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Calendar.css";
import { useEffect, } from "react";
import { auth } from "../firebase/firebase";

import {
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
} from "../services/calendarService";
import Sidebar from "../components/Sidebar";

// Retrieve API Keys
const GROQ_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_GROQ_API_KEY) ||
  '';

const GEMINI_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_GEMINI_API_KEY) ||
  '';

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
      text: "Hello! I am your AI Advisor. Ask me anything about your upcoming schedule, bill due dates, or payment timing.",
    },
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isAiOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  // Floating AI Send Handler (Groq First -> Gemini Fallback)
  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;

    const userText = aiPrompt;
    setAiPrompt("");
    setAiMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setAiLoading(true);

    const scheduleList = events
      .map((ev) => `${ev.title} (₦${ev.amount}) on ${ev.date} [Status: ${ev.status || 'Scheduled'}]`)
      .join("; ");

    const systemPrompt = `You are BudgetBuddy AI Advisor. Context on current user calendar events: [${scheduleList || "None"}]. Be concise, encouraging, and helpful with their scheduling and bill due dates.`;

    let reply = null;

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
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        if (response.ok && data?.choices?.[0]?.message?.content) {
          reply = data.choices[0].message.content;
        } else {
          console.warn("Groq failed, switching to Gemini...", data?.error);
        }
      } catch (err) {
        console.warn("Groq error, switching to Gemini:", err);
      }
    }

    if (!reply && GEMINI_API_KEY) {
      try {
        const fullPrompt = `${systemPrompt}\nUser Question: ${userText}`;
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
            }),
          }
        );

        const data = await response.json();
        if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          reply = data.candidates[0].content.parts[0].text;
        } else {
          console.error("Gemini fallback failed:", data?.error);
        }
      } catch (err) {
        console.error("Gemini fallback error:", err);
      }
    }

    if (reply) {
      setAiMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    } else {
      setAiMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ Unable to reach AI services right now. Please check your Groq or Gemini keys.",
        },
      ]);
    }

    setAiLoading(false);
  };

  return (
    <div className="app-container">
      <style>{`
        @keyframes aiBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animated-ai-btn {
          animation: aiBounce 2.5s infinite ease-in-out;
          transition: transform 0.2s ease;
        }
        .animated-ai-btn:hover {
          transform: scale(1.05);
        }
        
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

        {/* Floating Animated AI Advisor Widget */}
        <div style={aiStyles.floatingWrapper}>
          {isAiOpen && (
            <div style={aiStyles.chatDrawer}>
              <div style={aiStyles.chatHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.25rem" }}>🤖</span>
                  <span style={{ fontWeight: "700", color: "#ffffff" }}>AI Advisor</span>
                </div>
                <button onClick={() => setIsAiOpen(false)} style={aiStyles.closeBtn}>✕</button>
              </div>

              <div style={aiStyles.chatBody}>
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...aiStyles.chatBubble,
                      alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                      background: msg.sender === "user" ? "#7c3aed" : "#f1f5f9",
                      color: msg.sender === "user" ? "#ffffff" : "#1e293b",
                    }}
                  >
                    {msg.text}
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ ...aiStyles.chatBubble, alignSelf: "flex-start", background: "#f1f5f9", color: "#64748b" }}>
                    Analyzing schedule... ⏳
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendAiMessage} style={aiStyles.chatFooter}>
                <input
                  type="text"
                  placeholder="Ask AI about your schedule..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  style={aiStyles.chatInput}
                />
                <button type="submit" style={aiStyles.sendBtn} disabled={aiLoading}>
                  Send
                </button>
              </form>
            </div>
          )}

          <button className="animated-ai-btn" onClick={() => setIsAiOpen(!isAiOpen)} style={aiStyles.floatingButton}>
            🤖 AI Advisor
          </button>
        </div>
      </main>
    </div>
  );
};

// Inline Styles for Floating AI Widget
const aiStyles = {
  floatingWrapper: {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    zIndex: 999,
  },
  floatingButton: {
    background: "#7c3aed",
    color: "#ffffff",
    border: "none",
    borderRadius: "2rem",
    padding: "0.875rem 1.5rem",
    fontSize: "0.95rem",
    fontWeight: "700",
    boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  chatDrawer: {
    position: "absolute",
    bottom: "70px",
    right: 0,
    width: "320px",
    height: "420px",
    background: "#ffffff",
    borderRadius: "1rem",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  chatHeader: {
    background: "#7c3aed",
    padding: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "1rem",
  },
  chatBody: {
    flex: 1,
    padding: "1rem",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  chatBubble: {
    padding: "0.625rem 0.875rem",
    borderRadius: "0.75rem",
    fontSize: "0.8125rem",
    maxWidth: "85%",
    lineHeight: "1.4",
    wordBreak: "break-word",
  },
  chatFooter: {
    display: "flex",
    padding: "0.75rem",
    borderTop: "1px solid #f1f5f9",
    gap: "0.5rem",
  },
  chatInput: {
    flex: 1,
    border: "1px solid #cbd5e1",
    padding: "0.5rem 0.75rem",
    fontSize: "0.8125rem",
    outline: "none",
    borderRadius: "0.5rem",
  },
  sendBtn: {
    background: "#7c3aed",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem 0.875rem",
    borderRadius: "0.5rem",
    fontSize: "0.8125rem",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default CalendarPage;
