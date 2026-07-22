import "./Sidebar.css";
import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import robot from "../assets/robot.png";
import user from "../assets/user.png";
import { useState } from "react";
import { FiMenu } from "react-icons/fi";

import {
  FiHome,
  FiCreditCard,
  FiShield,
  FiTrendingUp,
  FiCalendar,
  FiBarChart2,
  FiFileText,
  FiMessageCircle,
  FiSettings,
  FiChevronDown,
} from "react-icons/fi";

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      <div className="sidebar-header">
          <button
              className="toggle-btn"
              onClick={() => setCollapsed(!collapsed)}
          >
              <FiMenu />
          </button>
      </div>

      {/* Logo */}

      <div className="logo">

       <img src={logo} alt="BudgetBuddy Logo" width="250" />

        {!collapsed && (
            <div>
                <h2>BudgetBuddy</h2>
                <p>Smart Student Budget</p>
            </div>
        )}

      </div>

      {/* Navigation */}

      <nav className="menu">

        <NavLink to="/dashboard" className="menu-item">
          <FiHome />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        <NavLink to="/spending-plan" className="menu-item active">
          <FiCreditCard />
          {!collapsed && <span>Spending Plan</span>}
        </NavLink>

        <NavLink to="/savings" className="menu-item">
          <FiShield />
          {!collapsed && <span>Savings Plan</span>}
        </NavLink>

        <NavLink to="/invest" className="menu-item">
          <FiTrendingUp />
          {!collapsed && <span>Invest Plan</span>}
        </NavLink>

        <NavLink to="/bills" className="menu-item">
          <FiFileText />
          {!collapsed && <span>Bills & Reminders</span>}
        </NavLink>

        <NavLink to="/calendar" className="menu-item">
          <FiCalendar />
          {!collapsed && <span>Calendar</span>}
        </NavLink>

        <NavLink to="/reports" className="menu-item">
          <FiFileText />
          {!collapsed && <span>Reports</span>}
        </NavLink>

        <NavLink to="/advisor" className="menu-item">
          <FiMessageCircle />
          {!collapsed && <span>Ask Advisor</span>}
        </NavLink>

        <NavLink to="/settings" className="menu-item">
          <FiSettings />
          {!collapsed && <span>Settings</span>}
        </NavLink>

      </nav>

      {/* AI Card */}

      {!collapsed && (
      <div className="advisor-card">

        <img src={robot} alt="Robot" width="550" />

        <h4>Need help?</h4>

        <p>
          Chat with your AI advisor for personalized guidance.
        </p>

        <button>Chat Now</button>

      </div>
      )}


      {/* User */}

      <div className="user">

        <img src={user} alt="User" width="550" />

        {!collapsed && (
            <>
                <div>

                    <h4>Malvin</h4>

                    <span>Student</span>

                </div>

                <FiChevronDown />

            </>
        )}
    </div>

    </aside>
  );
}

export default Sidebar;