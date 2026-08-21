import "../styles/Login.css";
import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import robot from "../assets/robot.png";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
} from "react-icons/fi";
import { auth, googleProvider } from "../firebase/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

// ─── Scoped Data Keys managed by Settings.jsx ───
const ACTIVE_DATA_KEYS = [
  "user_budget",
  "user_savings_plans",
  "user_spending_plans",
  "notification_settings",
  "spending_plan",
  "bill_reminders",
  "user_bills",
];

// ─── Restores scoped data (`bb_email_key`) back to active `localStorage` keys upon login ───
const restoreUserData = (email) => {
  if (!email) return;
  ACTIVE_DATA_KEYS.forEach((key) => {
    const scopedVal = localStorage.getItem(`bb_${email}_${key}`);
    if (scopedVal !== null) {
      localStorage.setItem(key, scopedVal);
    }
  });
};

// ─── Look up this email's full locally-known profile from "accounts" ───
const findLocalAccount = (email) => {
  try {
    const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
    return accounts.find((acc) => acc.email === email) || null;
  } catch {
    return null;
  }
};

// ─── Restore the full profile & scoped budget data into active storage ───
const restoreUserSession = (firebaseUser, localAccount) => {
  const restored = localAccount || {
    id: firebaseUser.uid || firebaseUser.email || "user_default",
    fullName: firebaseUser.displayName || "User",
    name: firebaseUser.displayName || "User",
    email: firebaseUser.email,
    phone: "",
    currency: "NGN (₦)",
    language: "English",
    photo: firebaseUser.photoURL || "",
  };

  localStorage.setItem("user", JSON.stringify(restored));
  localStorage.setItem("user_profile", JSON.stringify(restored));

  // Restore budget, savings, and settings data scoped to this email
  restoreUserData(restored.email);

  window.dispatchEvent(new Event("storage"));
  return restored;
};

const saveGoogleUserLocally = (user) => {
  const nameParts = (user.displayName || "").split(" ");
  const fName = nameParts[0] || "User";
  const lName = nameParts.slice(1).join(" ") || "";
  const combinedFullName = user.displayName || fName;

  const existingAccount = findLocalAccount(user.email);

  const userData = {
    ...existingAccount,
    id: existingAccount?.id || user.uid || user.email,
    firstName: existingAccount?.firstName || fName,
    lastName: existingAccount?.lastName || lName,
    fullName: combinedFullName,
    name: combinedFullName,
    preferredName: existingAccount?.preferredName || "first",
    displayName: fName,
    email: user.email,
    phone: existingAccount?.phone || "",
    currency: existingAccount?.currency || "NGN (₦)",
    language: existingAccount?.language || "English",
    photo: user.photoURL || existingAccount?.photo || "",
    deletedAt: undefined,
  };

  localStorage.setItem("user", JSON.stringify(userData));
  localStorage.setItem("user_profile", JSON.stringify(userData));

  // Restore budget, savings, and settings data scoped to this Google email
  restoreUserData(userData.email);

  try {
    const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
    const updatedAccounts = existingAccount
      ? accounts.map((acc) => (acc.email === user.email ? { ...acc, ...userData } : acc))
      : [...accounts, userData];
    localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
  } catch (e) {
    console.error("Error updating local accounts list:", e);
  }

  window.dispatchEvent(new Event("storage"));
};

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeletedBanner, setShowDeletedBanner] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (sessionStorage.getItem("bb_show_deleted_msg") === "true") {
      setShowDeletedBanner(true);
      sessionStorage.removeItem("bb_show_deleted_msg");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const newErrors = {
      email: "",
      password: "",
    };

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    if (newErrors.email || newErrors.password) return;

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const localAccount = findLocalAccount(userCredential.user.email);

      if (localAccount?.deletedAt) {
        await auth.signOut();
        setLoading(false);
        setErrors({
          email: "This account was deleted. Please sign up again to create a new account.",
          password: "",
        });
        return;
      }

      restoreUserSession(userCredential.user, localAccount);

      sessionStorage.setItem("bb_just_authenticated", "true");

      navigate("/dashboard");
    } catch (error) {
      setLoading(false);

      console.log(error);

      switch (error.code) {
        case "auth/invalid-email":
          setErrors((prev) => ({
            ...prev,
            email: "Please enter a valid email address.",
          }));
          break;

        case "auth/user-not-found":
          setErrors((prev) => ({
            ...prev,
            email: "No account exists with this email.",
          }));
          break;

        case "auth/wrong-password":
          setErrors((prev) => ({
            ...prev,
            password: "Incorrect password.",
          }));
          break;

        case "auth/invalid-credential":
          setErrors({
            email: "",
            password: "Incorrect email or password.",
          });
          break;

        case "auth/too-many-requests":
          setErrors({
            email: "",
            password: "Too many failed attempts. Please try again later.",
          });
          break;

        default:
          setErrors({
            email: "",
            password: "Something went wrong. Please try again.",
          });
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);

      const localAccount = findLocalAccount(result.user.email);

      if (localAccount?.deletedAt) {
        await auth.signOut();
        setLoading(false);
        setErrors((prev) => ({
          ...prev,
          email: "This account was deleted. Please sign up again to create a new account.",
        }));
        return;
      }

      saveGoogleUserLocally(result.user);

      sessionStorage.setItem("bb_just_authenticated", "true");

      navigate("/dashboard");
    } catch (error) {
      setLoading(false);

      switch (error.code) {
        case "auth/popup-closed-by-user":
          console.log("Google sign-in was cancelled.");
          return;

        case "auth/popup-blocked":
          setErrors((prev) => ({
            ...prev,
            email: "Your browser blocked the sign-in popup. Please allow popups and try again.",
          }));
          return;

        default:
          console.error(error);
          setErrors((prev) => ({
            ...prev,
            email: "Google sign-in failed. Please try again.",
          }));
      }
    }
  };

  return (
    <div
      className="login-page"
      style={{
        maxHeight: "100vh",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        display: "flex",
        alignItems: "flex-start",
        paddingTop: "40px",
        paddingBottom: "60px",
      }}
    >
      <div className="left-side">
        <div className="logo">
          <img src={logo} alt="BudgetBuddy Logo" width="250" />
        </div>

        <img
          src={robot}
          alt="Robot"
          className="robot"
          width="200"
        />

        <h2>Welcome Back 👋</h2>

        <p>
          Sign in to continue managing your budget, expenses and savings.
        </p>
      </div>

      <div
        className="right-side"
        style={{
          maxHeight: "none",
          height: "auto",
        }}
      >
        <h1>Sign in to your account</h1>

        <p>Enter your details to access your account</p>

        {showDeletedBanner && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#ecfdf5",
              border: "1px solid #10b981",
              color: "#065f46",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "18px",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <FiCheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>Your account was successfully deleted.</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label>Email address</label>

          <div className={`input-box ${errors.email ? "input-error" : ""}`}>
            <FiMail className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          {errors.email && (
            <p className="error-message">{errors.email}</p>
          )}

          <div className="password-header">
            <label>Password</label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <div className={`input-box ${errors.password ? "input-error" : ""}`}>
            <FiLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.password && (
            <p className="error-message">{errors.password}</p>
          )}

          <div className="remember">
            <label>
              <input type="checkbox" disabled={loading} />
              Remember me
            </label>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="or">
          <span>OR</span>
        </div>

        <div className="social-buttons">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            Google
          </button>
        </div>

        <p className="signup">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;