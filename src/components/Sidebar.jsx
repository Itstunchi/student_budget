import "./Sidebar.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import robot from "../assets/robot.png";
import userImg from "../assets/user.png";
import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
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
  FiLogOut,
} from "react-icons/fi";

// ─── Data isolation keys ───
const ACTIVE_DATA_KEYS = [
  "user_budget",
  "user_savings_plans",
  "user_spending_plans",
  "notification_settings",
  "spending_plan",
  "bill_reminders",
  "user_bills",
];

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

// ─── Scoped storage helpers ───
const saveActiveUserData = (email) => {
  if (!email) return;
  ACTIVE_DATA_KEYS.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val !== null) {
      localStorage.setItem(`bb_${email}_${key}`, val);
    }
  });
};

const loadUserData = (email) => {
  if (!email) return;
  ACTIVE_DATA_KEYS.forEach((key) => {
    const scoped = localStorage.getItem(`bb_${email}_${key}`);
    if (scoped !== null) {
      localStorage.setItem(key, scoped);
    } else {
      localStorage.removeItem(key);
    }
  });
};

function Sidebar({ isExpanded, onToggleSidebar, onClose }) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentUser, setCurrentUser] = useState(getLoggedInUser);
  const [allAccounts, setAllAccounts] = useState(getAllAccounts);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const dropdownRef = useRef(null);

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

  const showFullContent = isExpanded || isHovered;

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

  const handleNavClick = () => {
    setShowAccountDropdown(false);
    setShowAddOptions(false);
    setIsHovered(false);

    if (onClose) {
      onClose();
    }

    if (isExpanded && onToggleSidebar) {
      onToggleSidebar();
    }
  };

  const handleSwitchAccount = (account) => {
    if (account.email === currentUser.email) {
      setShowAccountDropdown(false);
      return;
    }

    setIsSwitching(true);

    setTimeout(() => {
      if (currentUser?.email) {
        saveActiveUserData(currentUser.email);
      }

      if (account.email) {
        loadUserData(account.email);
      }

      const updatedUser = {
        ...account,
        avatar: resolveAvatar(account),
        name: account.fullName || account.name || "User",
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("user_profile", JSON.stringify(updatedUser));

      setCurrentUser(updatedUser);
      handleNavClick();

      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("profileUpdate"));
      
      setIsSwitching(false);
      navigate("/dashboard");
    }, 750);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setShowAccountDropdown(false);

    setTimeout(() => {
      if (currentUser?.email) {
        saveActiveUserData(currentUser.email);
      }

      // Clear active user keys
      localStorage.removeItem("user");
      localStorage.removeItem("user_profile");
      ACTIVE_DATA_KEYS.forEach((key) => localStorage.removeItem(key));

      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("profileUpdate"));

      setIsLoggingOut(false);
      navigate("/login");
    }, 900);
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
    <>
      {/* ─── Loading Overlay for Account Switch / Logout ─── */}
      {(isSwitching || isLoggingOut) && (
        <div className="account-switch-loading-overlay">
          <div className="account-switch-loading-card">
            <Loader2 className="account-switch-spinner" size={26} />
            <span>{isLoggingOut ? "Logging out..." : "Switching profile..."}</span>
          </div>
        </div>
      )}

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
        {/* Header / Logo Row */}
        <div className="sidebar-header">
          <img 
            src={logo} 
            alt="BudgetBuddy Logo" 
            className="logo-img" 
            style={{ display: showFullContent ? "block" : "none" }} 
          />

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
            to="/advisor"
            onClick={handleNavClick}
            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
          >
            <FiMessageCircle className="nav-icon" />
            {showFullContent && <span>Ask Advisor</span>}
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
            <img src={robot} alt="Robot Assistant" width="120" />
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

        {/* User Footer */}
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
                              onError={(e) => { e.currentTarget.src = userImg; }}
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
                          onError={(e) => { e.currentTarget.src = userImg; }}
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

                  <button
                    className="add-account-btn"
                    onClick={handleLogout}
                    style={{ color: "#ef4444", marginTop: "4px" }}
                  >
                    <FiLogOut size={16} /> Log Out
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

          {/* User Profile Avatar */}
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
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="user-avatar-img"
              onError={(e) => { e.currentTarget.src = userImg; }} 
            />
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
    </>
  );
}

export default Sidebar;