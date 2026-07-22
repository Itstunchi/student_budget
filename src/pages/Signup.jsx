import "../styles/Login.css";
import React from "react";
import logo from "../assets/logo.png";
import robot from "../assets/robot.png";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiTarget, FiCalendar, FiShield, FiBell, FiTrendingUp, FiMail, FiLock, FiEye, FiEyeOff } from "../components/Icons";
import { auth } from "../firebase/firebase";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { FiUser } from "react-icons/fi";


function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    const handleSignup = async (e) => {
      e.preventDefault();

      const newErrors = {
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      };

      if (!formData.fullName.trim()) {
        newErrors.fullName = "Full name is required.";
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email address is required.";
      }

      if (!formData.password) {
        newErrors.password = "Password is required.";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password.";
      }

      if (
        formData.password &&
        formData.confirmPassword &&
        formData.password !== formData.confirmPassword
      ) {
        newErrors.confirmPassword = "Passwords do not match.";
      }

      setErrors(newErrors);

      if (Object.values(newErrors).some((error) => error)) {
        return;
      }

      setLoading(true);

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // Save the user's display name in Firebase
        await updateProfile(userCredential.user, {
          displayName: formData.fullName,
        });

        navigate("/dashboard");
      } catch (error) {
        switch (error.code) {
          case "auth/email-already-in-use":
            setErrors((prev) => ({
              ...prev,
              email: "An account with this email already exists.",
            }));
            break;

          case "auth/invalid-email":
            setErrors((prev) => ({
              ...prev,
              email: "Please enter a valid email address.",
            }));
            break;

          case "auth/weak-password":
            setErrors((prev) => ({
              ...prev,
              password: "Password must be at least 6 characters.",
            }));
            break;

          default:
            setErrors((prev) => ({
              ...prev,
              email: "Unable to create your account. Please try again.",
            }));
        }
      } finally {
        setLoading(false);
      }
    };

    const [errors, setErrors] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
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

        <h2>Welcome To Student Budget</h2>

        <p>
          Create An Account To Access Student Budget.
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

        <h1>Create an Account</h1>

        <p>
          Fill In Your Details To Create An Account
        </p>

        <form onSubmit={handleSignup}>

            <label>Full Name</label>

                <div className={`input-box ${errors.fullName ? "input-error" : ""}`}>

                    <FiUser className="input-icon" />

                    <input
                        type="text"
                        name="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleChange}
                    />

                </div>

                {errors.fullName && (
                    <p className="error-message">{errors.fullName}</p>
                )}

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

            <label>Confirm Password</label>

              <div className={`input-box ${errors.confirmPassword ? "input-error" : ""}`}>

                  <FiLock className="input-icon" />

                  <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                  />

              </div>

              {errors.confirmPassword && (
                  <p className="error-message">
                      {errors.confirmPassword}
                  </p>
              )}

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
              {loading ? "Signing Up..." : "Sign Up"}
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
          Already have an account?
          <Link to="/"> Sign In</Link>
        </p>
      </div>

    </div>
  );
}

export default Login;