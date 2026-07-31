import "./Sidebar.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import robot from "../assets/robot.png";
import userImg from "../assets/user.png";
import { useState, useRef, useEffect } from "react";
import {
  FiMenu,
  FiPlus,
  FiCheck,
  FiUserCheck,
  FiUserPlus,
  FiArrowLeft,
  FiHome,
  FiCreditCard,
  FiShield,
  FiCalendar,
  FiBarChart2,
  FiFileText,
  FiMessageCircle,
  FiSettings,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

// Helper function to extract any valid profile picture key
const resolveAvatar = (userObj) => {
  if (!userObj) return userImg;
  return (
    userObj.photo ||
    userObj.avatar ||
    userObj.profileImage ||
    userObj.image ||
    userObj.profilePicture ||
    userImg
  );
};

// Helper function to fetch the currently active user profile
const getLoggedInUser = () => {
  try {
    const savedUser = localStorage.getItem("user") || localStorage.getItem("user_profile");
    if (savedUser) {
      const parsed = typeof savedUser === "string" && savedUser.startsWith("{")
        ? JSON.parse(savedUser)
        : { name: savedUser };

      return {
        id: parsed.id || parsed.email || "user_default",
        name: parsed.fullName || parsed.name || parsed.username || "User",
        role: parsed.role || "Account Owner",
        email: parsed.email || "",
        avatar: resolveAvatar(parsed),
        ...parsed,
      };
    }
  } catch (e) {
    console.error("Error loading sidebar user data:", e);
  }
  return { id: "guest", name: "User", role: "Account Owner", email: "", avatar: userImg };
};

// Helper function to fetch list of all registered accounts
const getAllAccounts = () => {
  try {
    const savedAccounts = localStorage.getItem("accounts");
    if (savedAccounts) {
      const parsedList = JSON.parse(savedAccounts);
      return parsedList.map((acc) => ({
        ...acc,
        avatar: resolveAvatar(acc),
      }));
    }
  } catch (e) {
    console.error("Error loading stored accounts:", e);
  }
  return [];
};

function Sidebar({ isExpanded, onToggleSidebar, onClose }) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentUser, setCurrentUser] = useState(getLoggedInUser);
  const [allAccounts, setAllAccounts] = useState(getAllAccounts);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync user profile, avatars, and theme settings globally
  useEffect(() => {
    const syncUserAndAccounts = () => {
      const active = getLoggedInUser();
      const accountsList = getAllAccounts();

      setCurrentUser(active);

      if (active.email) {
        const existingIdx = accountsList.findIndex((acc) => acc.email === active.email);
        let updatedList = [...accountsList];

        if (existingIdx !== -1) {
          updatedList[existingIdx] = { ...updatedList[existingIdx], ...active };
        } else {
          updatedList.push(active);
        }

        localStorage.setItem("accounts", JSON.stringify(updatedList));
        setAllAccounts(updatedList);
      } else {
        setAllAccounts(accountsList);
      }
    };

    const applySavedTheme = () => {
      const savedColor = localStorage.getItem("primary_theme_color");
      if (savedColor) {
        document.documentElement.style.setProperty("--primary-color", savedColor);
        document.body.style.setProperty("--primary-color", savedColor);
      }
    };

    applySavedTheme();
    syncUserAndAccounts();

    window.addEventListener("storage", syncUserAndAccounts);
    window.addEventListener("profileUpdate", syncUserAndAccounts);
    window.addEventListener("themeChange", applySavedTheme);

    return () => {
      window.removeEventListener("storage", syncUserAndAccounts);
      window.removeEventListener("profileUpdate", syncUserAndAccounts);
      window.removeEventListener("themeChange", applySavedTheme);
    };
  }, [location]);

  // Show labels/cards if sidebar is expanded OR hovered while collapsed on desktop
  const showFullContent = isExpanded || isHovered;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowAccountDropdown(false);
        setShowAddOptions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Whenever a user clicks a nav link, reset dropdowns and force sidebar to collapse back
  const handleNavClick = () => {
    setShowAccountDropdown(false);
    setShowAddOptions(false);
    setIsHovered(false); // Remove hover focus state

    // Close mobile overlay drawer
    if (onClose) {
      onClose();
    }

    // Collapse sidebar if it was expanded via hamburger toggle
    if (isExpanded && onToggleSidebar) {
      onToggleSidebar();
    }
  };

  const handleSwitchAccount = (account) => {
    const updatedUser = {
      ...account,
      avatar: resolveAvatar(account),
      name: account.fullName || account.name || "User",
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    handleNavClick();

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("profileUpdate"));
    navigate("/dashboard");
  };

  const handleExistingAccountClick = () => {
    handleNavClick();
    navigate("/login");
  };

  const handleNewAccountClick = () => {
    handleNavClick();
    navigate("/signup");
  };

  if (location.pathname === "/settings") return null;

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${!isExpanded ? "collapsed" : "expanded"} ${
        isHovered && !isExpanded ? "hover-expanded" : ""
      }`}
      onMouseEnter={() => {
        if (!isExpanded) setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      {/* Header / Logo Row with Hamburger */}
      <div className="sidebar-header">
        {showFullContent && (
          <img src={logo} alt="BudgetBuddy Logo" className="logo-img" />
        )}

        <button
          className="toggle-btn"
          onClick={() => {
            if (onToggleSidebar) onToggleSidebar();
            setIsHovered(false);
            setShowAccountDropdown(false);
            setShowAddOptions(false);
          }}
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <FiMenu />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="menu">
        <NavLink
          to="/dashboard"
          onClick={handleNavClick}
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <FiHome className="nav-icon" />
          {showFullContent && <span>Dashboard</span>}
        </NavLink>

        <NavLink
          to="/spending-plan"
          onClick={handleNavClick}
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <FiCreditCard className="nav-icon" />
          {showFullContent && <span>Spending Plan</span>}
        </NavLink>

        <NavLink
          to="/savings-plan"
          onClick={handleNavClick}
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <FiShield className="nav-icon" />
          {showFullContent && <span>Savings Plan</span>}
        </NavLink>

        <NavLink
          to="/bills"
          onClick={handleNavClick}
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <FiFileText className="nav-icon" />
          {showFullContent && <span>Bills & Reminders</span>}
        </NavLink>

        <NavLink
          to="/calendar"
          onClick={handleNavClick}
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <FiCalendar className="nav-icon" />
          {showFullContent && <span>Calendar</span>}
        </NavLink>

        <NavLink
          to="/reports"
          onClick={handleNavClick}
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <FiBarChart2 className="nav-icon" />
          {showFullContent && <span>Reports</span>}
        </NavLink>

        <NavLink
          to="/advisor"
          onClick={handleNavClick}
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <FiMessageCircle className="nav-icon" />
          {showFullContent && <span>Ask Advisor</span>}
        </NavLink>

        <NavLink
          to="/settings"
          onClick={handleNavClick}
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <FiSettings className="nav-icon" />
          {showFullContent && <span>Settings</span>}
        </NavLink>
      </nav>

      {/* AI Card */}
      {showFullContent && (
        <div className="advisor-card">
          <img src={robot} alt="Robot" width="120" />
          <h4>Need help?</h4>
          <p>Chat with your AI advisor for personalized guidance.</p>
          <button
            onClick={() => {
              handleNavClick();
              navigate("/advisor");
            }}
          >
            Chat Now
          </button>
        </div>
      )}

      {/* User Footer with Switch Account Popup */}
      <div className="user-container" ref={dropdownRef} style={{ position: "relative" }}>
        {showAccountDropdown && showFullContent && (
          <div className="account-dropdown">
            {!showAddOptions ? (
              <>
                <div className="dropdown-header">Switch Account</div>
                <div className="account-list">
                  {allAccounts.length > 0 ? (
                    allAccounts.map((acc, index) => {
                      const accName = acc.fullName || acc.name || "User";
                      const accEmail = acc.email || "No email";
                      const isCurrent = acc.email === currentUser.email;
                      const avatarSrc = resolveAvatar(acc);

                      return (
                        <div
                          key={acc.id || index}
                          className={`account-item ${isCurrent ? "active-account" : ""}`}
                          onClick={() => handleSwitchAccount(acc)}
                        >
                          <img
                            src={avatarSrc}
                            alt={accName}
                            className="account-avatar"
                          />
                          <div className="account-details">
                            <span className="account-name">{accName}</span>
                            <span className="account-email">{accEmail}</span>
                          </div>
                          {isCurrent && <FiCheck className="check-icon" />}
                        </div>
                      );
                    })
                  ) : (
                    <div className="account-item active-account">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="account-avatar"
                      />
                      <div className="account-details">
                        <span className="account-name">{currentUser.name}</span>
                        <span className="account-email">{currentUser.email || currentUser.role}</span>
                      </div>
                      <FiCheck className="check-icon" />
                    </div>
                  )}
                </div>

                <div className="dropdown-divider" />

                <button
                  className="add-account-btn"
                  onClick={() => setShowAddOptions(true)}
                >
                  <FiPlus size={16} /> Add another account
                </button>
              </>
            ) : (
              <>
                <div
                  className="dropdown-header"
                  style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                  onClick={() => setShowAddOptions(false)}
                >
                  <FiArrowLeft size={14} /> Back
                </div>
                <div className="account-list" style={{ marginTop: "6px" }}>
                  <div className="account-item" onClick={handleExistingAccountClick}>
                    <FiUserCheck className="check-icon" />
                    <div className="account-details">
                      <span className="account-name">Existing Account</span>
                      <span className="account-email">Log into an existing profile</span>
                    </div>
                  </div>
                  <div className="account-item" onClick={handleNewAccountClick}>
                    <FiUserPlus className="check-icon" />
                    <div className="account-details">
                      <span className="account-name">New Account</span>
                      <span className="account-email">Register a brand new account</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* User Card Trigger */}
        <div
          className="user"
          style={{ cursor: "pointer" }}
          onClick={() => {
            if (showFullContent) {
              setShowAccountDropdown(!showAccountDropdown);
              setShowAddOptions(false);
            } else {
              if (onToggleSidebar) onToggleSidebar();
            }
          }}
        >
          <img src={currentUser.avatar} alt={currentUser.name} />
          {showFullContent && (
            <>
              <div className="user-info">
                <h4>{currentUser.name}</h4>
                <span>{currentUser.role}</span>
              </div>
              {showAccountDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;