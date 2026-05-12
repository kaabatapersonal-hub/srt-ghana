// LoginPage.jsx
// The login page for the Sanitation Resilience Tracker.
// Users enter their email and password to sign in.
// On success, they are redirected to /dashboard.
// On failure, a user-friendly error message is shown below the form.
// Route: /login (public — no auth required)

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, getFirebaseErrorMessage } from "../services/authService";

function LoginPage() {
  // --- SECTION: State ---

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // shown to the user on failure
  const [isSubmitting, setIsSubmitting] = useState(false); // disables button while request is in flight

  const navigate = useNavigate();

  // --- SECTION: Handle Form Submit ---

  async function handleLogin(event) {
    // Prevent the browser from refreshing the page on form submit
    event.preventDefault();

    setErrorMessage(""); // clear any previous error before trying again
    setIsSubmitting(true);

    try {
      await loginUser(email, password);
      // Login succeeded — AuthContext will automatically pick up the new user
      navigate("/dashboard");
    } catch (error) {
      // Convert the Firebase error code to a plain English message
      setErrorMessage(getFirebaseErrorMessage(error));
    } finally {
      // Re-enable the submit button whether the request succeeded or failed
      setIsSubmitting(false);
    }
  }

  // --- SECTION: Render ---

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* App branding at the top of the card */}
        <div className="auth-logo">
          <div className="auth-logo-title">SRT</div>
          <div className="auth-logo-subtitle">Sanitation Resilience Tracker</div>
        </div>

        <h2 className="auth-title">Sign in to your account</h2>

        {/* Show error message if login failed */}
        {errorMessage && (
          <div className="error-message" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} noValidate>

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {/* Show different text while the request is in flight */}
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

        </form>

        {/* Link to registration for users who don't have an account */}
        <p className="auth-switch-text">
          Don't have an account?{" "}
          <Link to="/register">Create one</Link>
        </p>

      </div>
    </div>
  );
}

export default LoginPage;
