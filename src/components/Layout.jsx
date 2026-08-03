import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
// REMOVED: import Header from "../components/Header";
import "./Layout.css";

export default function Layout() {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsExpanded(false);
    }
  }, [location.pathname]);

  const toggleSidebar = () => setIsExpanded((prev) => !prev);
  const closeSidebar = () => setIsExpanded(false);

  return (
    <div className="app-layout">
      {isExpanded && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      <div className={`sidebar-wrapper ${isExpanded ? "expanded" : "collapsed"}`}>
        <Sidebar
          isExpanded={isExpanded}
          onToggleSidebar={toggleSidebar}
          onClose={closeSidebar}
        />
      </div>

      <div className="main-layout-container">
        <div className="page-content">
          {/* ❌ REMOVED <Header /> FROM HERE ❌ */}
          <Outlet />
        </div>
      </div>
    </div>
  );
}