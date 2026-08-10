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

// ─── Look up this email's full locally-known profile (name, phone, etc.)
//     from the "accounts" list this browser has previously saved, and
//     report whether it was marked deleted in Settings. ───
const findLocalAccount = (email) => {
  try {
    const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
    return accounts.find((acc) => acc.email === email) || null;
  } catch {
    return null;
  }
};

// ─── Restore the full profile (phone, name, currency, etc.) into the
//     active "user"/"user_profile" keys instead of leaving them stale or
//     empty after a plain email/password sign-in. ───
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
  window.dispatchEvent(new Event("storage"));
  return restored;
};

const saveGoogleUserLocally = (user) => {
  const nameParts = (user.displayName || "").split(" ");
  const fName = nameParts[0] || "User";
  const lName = nameParts.slice(1).join(" ") || "";
  const combinedFullName = user.displayName || fName;

  // Preserve any existing profile data (phone, preferences) already known
  // for this email instead of overwriting it with blanks every Google login.
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

  // Show a one-time banner if the person just deleted their account in Settings.
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

      // Block sign-in for accounts that were deleted from Settings.
      if (localAccount?.deletedAt) {
        await auth.signOut();
        setLoading(false);
        setErrors({
          email: "This account was deleted. Please sign up again to create a new account.",
          password: "",
        });
        return;
      }

      // Restore the full profile (name, phone, preferences) for this login,
      // instead of leaving "user" stale or empty.
      restoreUserSession(userCredential.user, localAccount);

      // Show the loading screen once, right after this successful login.
      sessionStorage.setItem("bb_just_authenticated", "true");

      navigate("/dashboard");
    } catch (error) {
      setLoading(false); // Reset loading state ONLY if an error occurs

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

      // Show the loading screen once, right after this successful login.
      sessionStorage.setItem("bb_just_authenticated", "true");

      navigate("/dashboard");
    } catch (error) {
      setLoading(false); // Reset loading state ONLY if popup fails or is closed

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
