import "../styles/Login.css";
import React, { useState } from "react";
import logo from "../assets/logo.png";
import robot from "../assets/robot.png";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff } from "../components/Icons";
import { auth, googleProvider } from "../firebase/firebase";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { FiUser, FiPhone } from "react-icons/fi";

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    preferredName: "first", // 'first' or 'last'
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const saveUserLocally = (user, fallbackFirstName = "", fallbackLastName = "") => {
    const fName = formData.firstName.trim() || fallbackFirstName || "User";
    const lName = formData.lastName.trim() || fallbackLastName || "";
    const combinedFullName = `${fName} ${lName}`.trim();

    // Determine chosen display name based on preference
    const displayName =
      formData.preferredName === "last" && lName ? lName : fName;

    const userData = {
      id: user.uid || user.email || "user_default",
      firstName: fName,
      lastName: lName,
      fullName: combinedFullName,
      name: combinedFullName,
      preferredName: formData.preferredName,
      displayName: displayName,
      phone: formData.phone.trim(),
      email: user.email || formData.email,
      currency: "NGN (₦)",
      language: "English",
      photo: user.photoURL || "",
      avatar: user.photoURL || "",
      role: user.email || formData.email || "Account Owner",
    };

    // Store active user details
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("user_profile", JSON.stringify(userData));

    // Register into existing accounts array for account-switching capability
    try {
      const existingAccounts = JSON.parse(localStorage.getItem("accounts") || "[]");
      const accountExists = existingAccounts.some((acc) => acc.email === userData.email);

      if (!accountExists) {
        const updatedAccounts = [...existingAccounts, userData];
        localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
      } else {
        const updatedAccounts = existingAccounts.map((acc) =>
          acc.email === userData.email ? { ...acc, ...userData } : acc
        );
        localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
      }
    } catch (err) {
      console.error("Error updating local accounts list:", err);
    }

    // Dispatch global events to sync components instantly
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("profileUpdate"));
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    const newErrors = {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!formData.email.trim()) newErrors.email = "Email address is required.";
    if (!formData.password) newErrors.password = "Password is required.";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password.";
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    if (Object.values(newErrors).some((error) => error)) return;

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const combinedFullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      // Set full name in Firebase auth profile
      await updateProfile(userCredential.user, {
        displayName: combinedFullName,
      });

      // Save user details with preferences to localStorage & sync sidebar
      saveUserLocally(userCredential.user);

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      setLoading(false);

      switch (error.code) {
        case "auth/email-already-in-use":
          setErrors((prev) => ({ ...prev, email: "An account with this email already exists." }));
          break;
        case "auth/invalid-email":
          setErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
          break;
        case "auth/weak-password":
          setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters." }));
          break;
        default:
          setErrors((prev) => ({ ...prev, email: "Unable to create your account. Please try again." }));
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);

      const nameParts = (result.user.displayName || "").split(" ");
      const googleFirstName = nameParts[0] || "User";
      const googleLastName = nameParts.slice(1).join(" ") || "";

      saveUserLocally(result.user, googleFirstName, googleLastName);

      navigate("/dashboard");
    } catch (error) {
      setLoading(false);

      if (error.code !== "auth/popup-closed-by-user") {
        console.error(error);
        setErrors((prev) => ({ ...prev, email: "Google sign-in failed. Please try again." }));
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
        paddingTop: "30px",
        paddingBottom: "60px",
      }}
    >
      <div className="left-side">
        <div className="logo">
          <img src={logo} alt="BudgetBuddy Logo" width="250" />
        </div>

        <img src={robot} alt="Robot" className="robot" width="200" />

        <h2>Welcome To Budget Buddy</h2>
        <p>Create An Account To Access Student Budget.</p>
      </div>

      <div
        className="right-side"
        style={{
          maxHeight: "none",
          height: "auto",
        }}
      >
        <h1>Create an Account</h1>
        <p>Fill In Your Details To Create An Account</p>

        <form onSubmit={handleSignup}>
          {/* First Name & Last Name */}
          <div style={{ display: "flex", gap: "15px" }}>
            <div style={{ flex: 1 }}>
              <label>First Name</label>
              <div className={`input-box ${errors.firstName ? "input-error" : ""}`}>
                <FiUser className="input-icon" />
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.firstName && <p className="error-message">{errors.firstName}</p>}
            </div>

            <div style={{ flex: 1 }}>
              <label>Last Name</label>
              <div className={`input-box ${errors.lastName ? "input-error" : ""}`}>
                <FiUser className="input-icon" />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.lastName && <p className="error-message">{errors.lastName}</p>}
            </div>
          </div>

          {/* Preferred Name Selection */}
          <label>How would you like to be addressed?</label>
          <div className="input-box" style={{ marginBottom: "18px" }}>
            <select
              name="preferredName"
              value={formData.preferredName}
              onChange={handleChange}
              disabled={loading}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "15px",
                color: "#333",
                cursor: "pointer",
              }}
            >
              <option value="first">
                Address me by First Name ({formData.firstName.trim() || "First Name"})
              </option>
              <option value="last">
                Address me by Last Name ({formData.lastName.trim() || "Last Name"})
              </option>
            </select>
          </div>

          {/* Phone Number */}
          <label>Phone Number</label>
          <div className={`input-box ${errors.phone ? "input-error" : ""}`}>
            <FiPhone className="input-icon" />
            <input
              type="tel"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          {errors.phone && <p className="error-message">{errors.phone}</p>}

          {/* Email Address */}
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
          {errors.email && <p className="error-message">{errors.email}</p>}

          {/* Password */}
          <label>Password</label>
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
          {errors.password && <p className="error-message">{errors.password}</p>}

          {/* Confirm Password */}
          <label>Confirm Password</label>
          <div className={`input-box ${errors.confirmPassword ? "input-error" : ""}`}>
            <FiLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          {errors.confirmPassword && (
            <p className="error-message">{errors.confirmPassword}</p>
          )}

          <div className="remember">
            <label>
              <input type="checkbox" disabled={loading} /> Remember me
            </label>
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <div className="or">
          <span>OR</span>
        </div>

        <div className="social-buttons">
          <button type="button" onClick={handleGoogleLogin} disabled={loading}>
            Google
          </button>
        </div>

        <p className="signup">
          Already have an account? <Link to="/">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;