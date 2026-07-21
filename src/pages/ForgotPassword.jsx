import "../styles/Login.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebase";

function ForgotPassword() {

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleReset = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (!email.trim()) {
            setError("Email address is required.");
            return;
        }

        setLoading(true);

        try {

            await sendPasswordResetEmail(auth, email);

            setSuccess(
                "Password reset link has been sent to your email."
            );

            setEmail("");

        } catch (error) {

            switch (error.code) {

                case "auth/user-not-found":
                    setError("No account found with this email.");
                    break;

                case "auth/invalid-email":
                    setError("Please enter a valid email address.");
                    break;

                default:
                    setError("Unable to send reset email.");
            }

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="login-page">

            <div className="right-side">

                <h1>Forgot Password</h1>

                <p>
                    Enter your email address and we'll send you a password reset link.
                </p>

                <form onSubmit={handleReset}>

                    <label>Email Address</label>

                    <div className={`input-box ${error ? "input-error" : ""}`}>

                        <FiMail className="input-icon" />

                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError("");
                                setSuccess("");
                            }}
                        />

                    </div>

                    {error && (
                        <p className="error-message">{error}</p>
                    )}

                    {success && (
                        <p className="success-message">
                            {success}
                        </p>
                    )}

                    <button
                        className="login-btn"
                        type="submit"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>

                </form>

                <p className="signup">

                    Remember your password?

                    <Link to="/"> Sign In</Link>

                </p>

            </div>

        </div>

    );

}

export default ForgotPassword;