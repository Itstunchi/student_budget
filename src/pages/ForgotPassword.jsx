import "../styles/Login.css";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import robot from "../assets/robot.png";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { FiMail } from "../components/Icons";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanedEmail = email.trim();

    if (!cleanedEmail) {
      setError("Email address is required.");
      return;
    }

    setLoading(true);

    try {
      // Firebase handles sending the reset link email automatically
      await sendPasswordResetEmail(auth, cleanedEmail);

      setSuccess("Password reset link has been sent to your email.");
      setEmail("");
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/too-many-requests":
          setError("Too many requests. Please try again later.");
          break;

        case "auth/network-request-failed":
          setError("Network error. Please check your connection.");
          break;

        default:
          setError("Unable to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
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

        <img src={robot} alt="Robot" className="robot" width="200" />

        <h2>Reset Your Password 🔒</h2>
        <p>Don't worry, we'll help you get back into your account in no time.</p>
      </div>

      <div
        className="right-side"
        style={{
          maxHeight: "none",
          height: "auto",
        }}
      >
        <h1>Forgot Password</h1>
        <p>Enter your email address and we'll send you a password reset link.</p>

        <form onSubmit={handleReset}>
          <label htmlFor="email">Email Address</label>

          <div className={`input-box ${error ? "input-error" : ""}`}>
            <FiMail className="input-icon" />

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              disabled={loading}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setSuccess("");
              }}
            />
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && (
            <p className="success-message" style={{ color: "#2e7d32", fontSize: "14px", marginTop: "8px" }}>
              {success}
            </p>
          )}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="signup">
          Remember your password? <Link to="/">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;