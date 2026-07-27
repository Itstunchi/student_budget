import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Calendar.css";

// ─── Icons (inline SVGs) ───
const Icons = {
bell: (
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
),
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
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
),
sync: (
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
),
robot: (
<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/><path d="M9 11V9a3 3 0 0 1 6 0v2"/></svg>
),
arrowRight: (
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
),
check: (
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
),
x: (
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
),
};

// ─── Color mapping ───
const categoryColors = {
subscription: { dot: "#ff4d6d", bg: "#fff0f3" },
utility: { dot: "#3b82f6", bg: "#eff6ff" },
internet: { dot: "#f59e0b", bg: "#fffbeb" },
education: { dot: "#10b981", bg: "#ecfdf5" },
rent: { dot: "#f97316", bg: "#fff7ed" },
electricity: { dot: "#8b5cf6", bg: "#f5f3ff" },
};

const statusConfig = {
paid: { label: "Paid", color: "#10b981" },
upcoming: { label: "Upcoming", color: "#f59e0b" },
"due-today": { label: "Due Today", color: "#ff4d6d" },
overdue: { label: "Overdue", color: "#8b5cf6" },
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

// ─── Notification Dropdown ───
const NotificationDropdown = ({ onClose }) => (
<div className="notification-dropdown">
<div className="notif-header">
<h4>Notifications</h4>
<button className="text-btn" onClick={onClose}>Mark all read</button>
</div>
<div className="notif-list">
<div className="notif-item unread">
<div className="notif-dot" />
<div className="notif-content">
<p>Your electricity bill is due in 3 days</p>
<span>2 hours ago</span>
</div>
</div>
<div className="notif-item unread">
<div className="notif-dot" />
<div className="notif-content">
<p>BudgetBuddy AI saved you ₦2,400 this month</p>
<span>5 hours ago</span>
</div>
</div>
<div className="notif-item">
<div className="notif-dot read" />
<div className="notif-content">
<p>Welcome to BudgetBuddy, Malvin!</p>
<span>2 days ago</span>
</div>
</div>
</div>
</div>
);

// ─── Filter Dropdown ───
const FilterDropdown = ({ filters, onToggle, onClose }) => {
const categories = [
{ key: "subscription", label: "Subscriptions" },
{ key: "utility", label: "Utilities" },
{ key: "internet", label: "Internet" },
{ key: "education", label: "Education" },
{ key: "rent", label: "Rent" },
{ key: "electricity", label: "Electricity" },
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
<span className="filter-dot" style={{ backgroundColor: categoryColors[cat.key]?.dot }} />
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
const colors = categoryColors[event.category] || categoryColors.subscription;
return (
<div className="cal-event" style={{ backgroundColor: colors.bg }}>
<div className="event-dot" style={{ backgroundColor: colors.dot }} />
<div className="event-info">
<span className="event-title">{event.title}</span>
<span className="event-amount">₦{event.amount.toLocaleString()}</span>
<span className="event-meta">{event.recurrence}</span>
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
const Legend = ({ onSync, isSyncing }) => (
<div className="calendar-legend">
{Object.entries(statusConfig).map(([key, cfg]) => (
<div key={key} className="legend-item">
<span className="legend-dot" style={{ backgroundColor: cfg.color }} />
<span className="legend-label">{cfg.label}</span>
</div>
))}
<button className={`sync-btn ${isSyncing ? "syncing" : ""}`} onClick={onSync} disabled={isSyncing}>
{Icons.sync} {isSyncing ? "Syncing..." : "Sync Calendar"}
</button>
</div>
);

// ─── Right Panel (Pro Tip only) ───
const RightPanel = ({ onChatAdvisor }) => (
<aside className="right-panel">
<div className="panel-section pro-tip">
<div className="pro-tip-header">
<div className="pro-tip-robot">{Icons.robot}</div>
<div>
<h4>Pro Tip from Advisor</h4>
</div>
</div>
<p className="pro-tip-text">
Pay your bills a day early to avoid late fees and keep your finances stress-free.
</p>
<button className="text-btn pro-tip-action" onClick={onChatAdvisor}>
Chat with Advisor {Icons.arrowRight}
</button>
</div>
</aside>
);

/*
─── CalendarPage ──────────────────────────────────────────────
PROPS:
events → Array of bill/reminder objects from your global state.
When you add a bill on /bills-reminders, pass that same
array down here.
ROUTING:
- "+ Add Reminder" → /bills-reminders
- "Chat with Advisor" → /advisor
*/
const CalendarPage = ({ events: propEvents }) => {
const navigate = useNavigate();
const [currentDate, setCurrentDate] = useState(new Date());
const [viewMode, setViewMode] = useState("month");
const [showNotifs, setShowNotifs] = useState(false);
const [showFilters, setShowFilters] = useState(false);
const [showMonthPicker, setShowMonthPicker] = useState(false);
const [isSyncing, setIsSyncing] = useState(false);
const [toast, setToast] = useState(null);
const [filters, setFilters] = useState({
subscription: true, utility: true, internet: true,
education: true, rent: true, electricity: true,
});

const events = propEvents || [];

const handlePrev = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
const handleNext = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
const handleToday = () => setCurrentDate(new Date());

const handleAddReminder = () => navigate("/bills-reminders");
const handleChatAdvisor = () => navigate("/advisor");

const handleSync = () => {
setIsSyncing(true);
setTimeout(() => {
setIsSyncing(false);
setToast({ message: "Calendar synced successfully", type: "success" });
setTimeout(() => setToast(null), 3000);
}, 1500);
};

const toggleFilter = (key) => {
setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
};

const filteredEvents = useMemo(() => {
return events.filter((e) => filters[e.category] !== false);
}, [events, filters]);

return (
<div className="app-container">
<main className="main-content">
{/* Toast */}
<Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

{/* Header */}
<div className="calendar-header">
<div className="header-left">
<h2>Calendar</h2>
<p className="header-subtitle">View all your bills, payments and financial events.</p>
</div>
<div className="header-right">
<div className="notification-wrapper">
<button className="icon-btn notification-btn" onClick={() => setShowNotifs(!showNotifs)}>
{Icons.bell}
<span className="notification-badge">2</span>
</button>
{showNotifs && (
<>
<div className="dropdown-overlay" onClick={() => setShowNotifs(false)} />
<NotificationDropdown onClose={() => setShowNotifs(false)} />
</>
)}
</div>
<button className="btn-primary add-reminder-btn" onClick={handleAddReminder}>
{Icons.plus} Add Reminder
</button>
</div>
</div>

{/* Toolbar */}
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

{/* Calendar Body */}
<div className="calendar-body">
<div className="calendar-main">
{viewMode === "month" && <MonthView currentDate={currentDate} events={filteredEvents} />}
{viewMode === "week" && <WeekView currentDate={currentDate} events={filteredEvents} />}
{viewMode === "list" && <ListView currentDate={currentDate} events={filteredEvents} />}
<Legend onSync={handleSync} isSyncing={isSyncing} />
</div>
<RightPanel onChatAdvisor={handleChatAdvisor} />
</div>
</main>
</div>
);
};

export default CalendarPage;
