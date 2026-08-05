import "./Sidebar.css";
import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import robot from "../assets/robot.png";
import user from "../assets/user.png";
import { useState, useEffect } from "react";
import { FiMenu } from "react-icons/fi";
import { Menu, X } from "lucide-react";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sidebarOpen && window.innerWidth <= 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <>
    <button
      className="menu-btn"
      onClick={() => setSidebarOpen(!sidebarOpen)}
    >
      {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
    </button>

    <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
      {sidebarOpen && window.innerWidth <= 768 && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* <div className="sidebar-header">
          <button
              className="toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
          >
              <FiMenu />
          </button>
      </div> */}

      {/* Logo */}

      <div className="logo">

       <img src={logo} alt="BudgetBuddy Logo" width="250" />

        {!sidebarOpen && (
            <div>
                <h2>BudgetBuddy</h2>
                <p>Smart Student Budget</p>
            </div>
        )}

      </div>

      {/* Navigation */}

      <nav className="menu">
        <div className="sidebar-content">
          <NavLink to="/dashboard" className="menu-item">
            <FiHome />
            {!sidebarOpen && <span>Dashboard</span>}
          </NavLink>

          <NavLink to="/spending-plan" className="menu-item">
            <FiCreditCard />
            {!sidebarOpen && <span>Spending Plan</span>}
          </NavLink>

          <NavLink to="/savings" className="menu-item">
            <FiShield />
            {!sidebarOpen && <span>Savings Plan</span>}
          </NavLink>

          <NavLink to="/invest" className="menu-item">
            <FiTrendingUp />
            {!sidebarOpen && <span>Invest Plan</span>}
          </NavLink>

          <NavLink to="/bills" className="menu-item">
            <FiFileText />
            {!sidebarOpen && <span>Bills & Reminders</span>}
          </NavLink>

          <NavLink to="/calendar" className="menu-item">
            <FiCalendar />
            {!sidebarOpen && <span>Calendar</span>}
          </NavLink>

          <NavLink to="/reports" className="menu-item">
            <FiFileText />
            {!sidebarOpen && <span>Reports</span>}
          </NavLink>

          <NavLink to="/advisor" className="menu-item">
            <FiMessageCircle />
            {!sidebarOpen && <span>Ask Advisor</span>}
          </NavLink>

          <NavLink to="/settings" className="menu-item">
            <FiSettings />
            {!sidebarOpen && <span>Settings</span>}
          </NavLink>
        </div>

      </nav>

      {/* AI Card */}

      {!sidebarOpen && (
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

        {!sidebarOpen && (
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
    </>
  );
}

export default Sidebar;
