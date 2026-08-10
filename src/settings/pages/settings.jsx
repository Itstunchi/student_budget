import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/settings.css";

import ProfileCard from "../components/ProfileCard";
import SecurityCard from "../components/SecurityCard";
import EditProfileModal from "../components/EditProfileModal";

import { auth } from "../../firebase/firebase";
import { deleteUser } from "firebase/auth";
import { Loader2 } from "lucide-react";

import {
  FaUser,
  FaBell,
  FaLock,
  FaExclamationTriangle,
  FaArrowLeft,
  FaRobot,
  FaDownload,
  FaTrash,
  FaSignOutAlt,
} from "react-icons/fa";

import { MdSavings } from "react-icons/md";

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

// Helper for saving current active user data back to their scoped key before logout/switch
const saveActiveUserData = (email) => {
  if (!email) return;
  ACTIVE_DATA_KEYS.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val !== null) {
      localStorage.setItem(`bb_${email}_${key}`, val);
    }
  });
};

// Helper function to read logged-in user data
const loadLoggedInUser = () => {
  const defaultUserData = {
    fullName: "User Name",
    email: "user@example.com",
    phone: "+234 800 000 0000",
    currency: "NGN (₦)",
    language: "English",
    password: "••••••••",
    joinedAt: "July 2026",
    photo: "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  };

  try {
    const saved = localStorage.getItem("user") || localStorage.getItem("user_profile");
    if (saved) {
      const parsed = typeof saved === "string" && saved.startsWith("{") ? JSON.parse(saved) : { fullName: saved };
      return {
        ...defaultUserData,
        fullName: parsed.fullName || parsed.name || parsed.username || defaultUserData.fullName,
        email: parsed.email || defaultUserData.email,
        phone: parsed.phone || defaultUserData.phone,
        currency: parsed.currency || defaultUserData.currency,
        language: parsed.language || defaultUserData.language,
        joinedAt: parsed.joinedAt || defaultUserData.joinedAt,
        photo: parsed.photo || parsed.avatar || defaultUserData.photo,
      };
    }
  } catch (e) {
    console.error("Failed to parse stored user data:", e);
  }

  return defaultUserData;
};

// Helper for loading saved notification preferences
const loadNotificationSettings = () => {
  try {
    const saved = localStorage.getItem("notification_settings");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to load notification preferences:", e);
  }
  return {
    budgetAlerts: true,
    billReminders: true,
    savingsUpdates: false,
    weeklySummary: true,
    marketingTips: false,
  };
};

const computeCacheSize = (email) => {
  let totalChars = 0;
  ACTIVE_DATA_KEYS.forEach((key) => {
    const activeVal = localStorage.getItem(key);
    if (activeVal) totalChars += activeVal.length;
    if (email) {
      const scopedVal = localStorage.getItem(`bb_${email}_${key}`);
      if (scopedVal) totalChars += scopedVal.length;
    }
  });

  const kb = totalChars / 1024;
  if (kb < 1) return "0.0 KB";
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

function Settings() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(loadLoggedInUser);
  const [notifications, setNotifications] = useState(loadNotificationSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [cacheSize, setCacheSize] = useState(() => computeCacheSize(loadLoggedInUser().email));
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ─── Live sync when profile changes (signup, switch, edit) ───
  useEffect(() => {
    const handleProfileChange = () => {
      const freshUser = loadLoggedInUser();
      setUser(freshUser);
      setCacheSize(computeCacheSize(freshUser.email));
    };
    window.addEventListener("storage", handleProfileChange);
    window.addEventListener("profileUpdate", handleProfileChange);
    return () => {
      window.removeEventListener("storage", handleProfileChange);
      window.removeEventListener("profileUpdate", handleProfileChange);
    };
  }, []);

  // Sync profile update to local storage & trigger live sidebar update
  const handleUpdateUser = (updatedUserData) => {
    setUser(updatedUserData);
    try {
      const existing = JSON.parse(localStorage.getItem("user") || "{}");
      const merged = { ...existing, ...updatedUserData, name: updatedUserData.fullName, photo: updatedUserData.photo };
      localStorage.setItem("user", JSON.stringify(merged));
      localStorage.setItem("user_profile", JSON.stringify(merged));

      const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
      const updatedAccounts = accounts.map((acc) =>
        acc.email === merged.email ? { ...acc, ...merged } : acc
      );
      localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
    } catch (e) {
      localStorage.setItem("user", JSON.stringify(updatedUserData));
    }

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("profileUpdate", { detail: updatedUserData }));
  };

  // Toggle notification switches
  const handleToggleNotification = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem("notification_settings", JSON.stringify(updated));
  };

  // Clear application cache
  const handleClearCache = () => {
    if (window.confirm("This will clear all your budget, savings, and spending data. Your profile will be kept. Continue?")) {
      const email = user?.email;

      ACTIVE_DATA_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        if (email) {
          localStorage.removeItem(`bb_${email}_${key}`);
        }
      });

      localStorage.removeItem("spending_plan");
      setCacheSize(computeCacheSize(email));
      window.dispatchEvent(new Event("storage"));
      alert("All account data has been cleared successfully.");
    }
  };

  // Download user data
  const handleDownloadData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(user, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `student-budget-data.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Reset Application
  const handleResetApp = () => {
    if (window.confirm("Reset all settings to default values?")) {
      localStorage.clear();
      alert("Application settings reset.");
      window.location.reload();
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    setIsLoggingOut(true);

    setTimeout(async () => {
      // 1. Preserve current profile state to user's scoped local keys
      if (user?.email) {
        saveActiveUserData(user.email);
      }

      // 2. Clear current session pointers and active data
      localStorage.removeItem("user");
      localStorage.removeItem("user_profile");
      ACTIVE_DATA_KEYS.forEach((key) => localStorage.removeItem(key));

      // 3. Firebase signout if session exists
      try {
        await auth.signOut();
      } catch (e) {
        console.error("Firebase signout error:", e);
      }

      // 4. Dispatch events to reset app state listeners
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("profileUpdate"));

      setIsLoggingOut(false);
      navigate("/login");
    }, 900);
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    const email = user?.email;

    if (email) {
      const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
      const updatedAccounts = accounts.map((acc) =>
        acc.email === email ? { ...acc, deletedAt: new Date().toISOString() } : acc
      );
      localStorage.setItem("accounts", JSON.stringify(updatedAccounts));

      ACTIVE_DATA_KEYS.forEach((key) => {
        localStorage.removeItem(`bb_${email}_${key}`);
        localStorage.removeItem(key);
      });
    }

    try {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }
    } catch (err) {
      if (err?.code === "auth/requires-recent-login") {
        alert(
          "Your account data has been erased and you're signed out, but Firebase needs a recent sign-in to fully delete the credentials. If you log in again, please delete your account once more to finish removing it."
        );
      } else {
        console.error("Error deleting Firebase account:", err);
      }
    }

    localStorage.removeItem("user");
    localStorage.removeItem("user_profile");

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("profileUpdate"));

    sessionStorage.setItem("bb_show_deleted_msg", "true");

    try {
      await auth.signOut();
    } catch (e) {
      // ignore
    }

    navigate("/login");
  };

  return (
    <div className="settings-page">
      {/* ─── Logout Overlay Loader ─── */}
      {isLoggingOut && (
        <div className="account-switch-loading-overlay">
          <div className="account-switch-loading-card">
            <Loader2 className="account-switch-spinner" size={26} />
            <span>Logging out...</span>
          </div>
        </div>
      )}

      <div className="settings-container">
        
        {/* Header */}
        <header className="settings-header">
          <div className="header-left">
            <button
              onClick={() => navigate(-1)}
              className="back-btn"
              aria-label="Go back"
            >
              <FaArrowLeft />
            </button>

            <div>
              <h1>Settings & Profile</h1>
              <p>Manage your account, preferences, and security rules.</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="advisor-btn"
              onClick={() => navigate("/advisor")}
            >
              <FaRobot style={{ marginRight: "8px" }} />
              Ask Advisor
            </button>
          </div>
        </header>

        {/* Profile Card */}
        <ProfileCard user={user} setIsEditing={setIsEditing} />

        {/* Tabs Navigation */}
        <nav className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <FaUser /> Account
          </button>
          <button
            className={`tab-btn ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <FaBell /> Notifications
          </button>
          <button
            className={`tab-btn ${activeTab === "budget" ? "active" : ""}`}
            onClick={() => setActiveTab("budget")}
          >
            <MdSavings /> Budget Rules
          </button>
          <button
            className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <FaLock /> Privacy & Danger Zone
          </button>
        </nav>

        {/* Tab Content Panes */}
        <div className="settings-tab-pane">
          
          {/* ACCOUNT DETAILS TAB */}
          {activeTab === "profile" && (
            <div className="modern-card">
              <div className="card-title">
                <h3>Account Information</h3>
                <p>Overview of your personal details</p>
              </div>

              <div className="setting-row">
                <span className="setting-label">Full Name</span>
                <span className="setting-value">{user.fullName}</span>
              </div>
              <div className="setting-row">
                <span className="setting-label">Email Address</span>
                <span className="setting-value">{user.email}</span>
              </div>
              <div className="setting-row">
                <span className="setting-label">Phone Number</span>
                <span className="setting-value">{user.phone}</span>
              </div>
              <div className="setting-row">
                <span className="setting-label">Currency</span>
                <span className="setting-value">{user.currency}</span>
              </div>
              <div className="setting-row">
                <span className="setting-label">Language</span>
                <span className="setting-value">{user.language}</span>
              </div>

              <button className="edit-btn" style={{ marginTop: "20px" }} onClick={() => setIsEditing(true)}>
                Edit Profile Details
              </button>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="modern-card">
              <div className="card-title">
                <h3>Notification Rules</h3>
                <p>Choose which alerts you want to receive</p>
              </div>

              <div className="toggle-row">
                <div className="toggle-text">
                  <h4>Budget Alerts</h4>
                  <p>Receive alerts when you exceed target spending</p>
                </div>
                <button
                  className={`toggle-switch ${notifications.budgetAlerts ? "active" : ""}`}
                  onClick={() => handleToggleNotification("budgetAlerts")}
                >
                  <span className="toggle-circle"></span>
                </button>
              </div>

              <div className="toggle-row">
                <div className="toggle-text">
                  <h4>Bill Reminders</h4>
                  <p>Get reminded before recurring bills are due</p>
                </div>
                <button
                  className={`toggle-switch ${notifications.billReminders ? "active" : ""}`}
                  onClick={() => handleToggleNotification("billReminders")}
                >
                  <span className="toggle-circle"></span>
                </button>
              </div>

              <div className="toggle-row">
                <div className="toggle-text">
                  <h4>Savings Updates</h4>
                  <p>Receive updates about your savings milestones</p>
                </div>
                <button
                  className={`toggle-switch ${notifications.savingsUpdates ? "active" : ""}`}
                  onClick={() => handleToggleNotification("savingsUpdates")}
                >
                  <span className="toggle-circle"></span>
                </button>
              </div>

              <div className="toggle-row">
                <div className="toggle-text">
                  <h4>Weekly Summary</h4>
                  <p>Get a weekly spending digest every Sunday</p>
                </div>
                <button
                  className={`toggle-switch ${notifications.weeklySummary ? "active" : ""}`}
                  onClick={() => handleToggleNotification("weeklySummary")}
                >
                  <span className="toggle-circle"></span>
                </button>
              </div>
            </div>
          )}

          {/* BUDGET RULES TAB */}
          {activeTab === "budget" && (
            <div className="modern-card">
              <div className="card-title">
                <h3>Budgeting Preferences</h3>
                <p>Manage rule calculations for safe spending</p>
              </div>

              <div className="budget-row">
                <div className="budget-left">
                  <h4>Spending Limits</h4>
                  <p>Set max spending limits for custom expense categories</p>
                </div>
              </div>

              <div className="budget-row">
                <div className="budget-left">
                  <h4>Auto-Save Rules</h4>
                  <p>Automatically allocate a percentage of income to savings</p>
                </div>
              </div>

              <div className="budget-row">
                <div className="budget-left">
                  <h4>Safe-to-Spend Multiplier</h4>
                  <p>Customize daily budget calculations based on upcoming bills</p>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY & DANGER ZONE TAB */}
          {activeTab === "security" && (
            <div className="security-pane">
              <div className="modern-card">
                <div className="card-title">
                  <h3>Data & Cache</h3>
                  <p>Export your data or clear app storage</p>
                </div>

                <div className="info-row" onClick={handleDownloadData}>
                  <div className="info-left">
                    <h4>Download My Data</h4>
                    <p>Export your profile history and app settings as JSON</p>
                  </div>
                  <FaDownload className="info-arrow" />
                </div>

                <div className="cache-row" onClick={handleClearCache}>
                  <div className="cache-left">
                    <h4>Clear Storage Cache</h4>
                    <p>Free up local storage space</p>
                  </div>
                  <span className="cache-size">{cacheSize}</span>
                </div>
              </div>

              <div className="modern-card danger-card">
                <div className="card-title">
                  <h3 className="danger-heading">
                    <FaExclamationTriangle className="danger-icon" /> Danger Zone
                  </h3>
                  <p>Irreversible profile and account actions</p>
                </div>

                <div className="danger-row">
                  <div className="danger-info">
                    <h4>Log Out</h4>
                    <p>Safely end your active session and return to login.</p>
                  </div>
                  <button className="reset-btn" onClick={handleLogout} disabled={isLoggingOut}>
                    <FaSignOutAlt style={{ marginRight: "6px" }} /> Log Out
                  </button>
                </div>

                <div className="danger-row">
                  <div className="danger-info">
                    <h4>Reset Application</h4>
                    <p>Restore default configuration settings across all tabs.</p>
                  </div>
                  <button className="reset-btn" onClick={handleResetApp}>
                    Reset Settings
                  </button>
                </div>

                <div className="danger-row">
                  <div className="danger-info">
                    <h4>Delete Account</h4>
                    <p>Permanently remove account details and return to login.</p>
                  </div>
                  <button className="delete-btn" onClick={handleDeleteAccount}>
                    <FaTrash style={{ marginRight: "6px" }} /> Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="settings-footer">
          <SecurityCard />
        </div>

        {/* Profile Edit Modal */}
        {isEditing && (
          <EditProfileModal
            user={user}
            setUser={handleUpdateUser}
            setIsEditing={setIsEditing}
          />
        )}
      </div>
    </div>
  );
}

export default Settings;