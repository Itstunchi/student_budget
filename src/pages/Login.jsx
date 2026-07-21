import "../styles/Login.css";
import React from "react";
import logo from "../assets/logo.png";
import robot from "../assets/robot.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiTarget,
    FiCalendar,
    FiShield,
    FiBell,
    FiTrendingUp,
    FiMail,
    FiLock,
    FiEye,
    FiEyeOff,
} from "react-icons/fi";
import { auth } from "../firebase/firebase";

import { signInWithEmailAndPassword } from "firebase/auth";
import { Link } from "react-router-dom";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
      email: "",
      password: "",
  });

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

    const [loading, setLoading] = useState(false);

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

        navigate("/dashboard");

        // TODO: Navigate to dashboard here

      } catch (error) {
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
              password:
                "Too many failed attempts. Please try again later.",
            });
            break;

          default:
            setErrors({
              email: "",
              password: "Something went wrong. Please try again.",
            });
        }
      } finally {
        setLoading(false);
      }
    };

    const [errors, setErrors] = useState({
      email: "",
      password: "",
    });

    const navigate = useNavigate();

  return (
    <div className="login-page">

      <div className="left-side">

        <div className="logo">
            <img src={logo} alt="BudgetBuddy Logo" width="250" />
        </div>

        <img
          src={robot}
          alt="Robot"
          className="robot" width="200"
        />

        <h2>Welcome Back 👋</h2>

        <p>
          Sign in to continue managing your budget,
          expenses and savings.
        </p>

        <div className="features">
          <p> 
            <FiTarget /> Track spending</p>
          <p><FiShield /> Save smarter</p>
          <p><FiTrendingUp /> Reach financial goals</p>
          <p><FiBell /> Bill reminders</p>
        </div>

      </div>

      <div className="right-side">

        <h1>Sign in to your account</h1>

        <p>
          Enter your details to access your account
        </p>

        <form onSubmit={handleLogin}>

            <label>Email address</label>

            <div className="input-box">

                <FiMail className="input-icon" />

                <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                />
            </div>
            {errors.email && (
              <p className="error-message">{errors.email}</p>
            )}

            <div className="password-header">

                <label>Password</label>

                <Link to="/forgot-password">Forgot password?</Link>

            </div>

            <div className="input-box">

                <FiLock className="input-icon" />

                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
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

                    <input type="checkbox" />

                    Remember me

                </label>

            </div>

            <button className="login-btn">
              {loading ? "Signing In..." : "Sign In"}
          </button>
          </form>

        <div className="or">
          <span>OR</span>
        </div>

        <div className="social-buttons">

          <button>Google</button>

          <button>Microsoft</button>

        </div>

        <p className="signup">
          Don't have an account?
          <Link to="/signup">Sign Up</Link>
        </p>

      </div>

    </div>
  );
}

export default Login;