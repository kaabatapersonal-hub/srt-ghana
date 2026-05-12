// RegisterPage.jsx
// The registration page for new SRT users.
// Collects display name, email, password, and a confirmation password.
// On submit, creates a Firebase Auth account AND a Firestore user document
// (with role: "user") so the auth system can read their role on login.
// On success, the user is automatically logged in and redirected to /dashboard.
// Route: /register (public — no auth required)

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, getFirebaseErrorMessage } from "../services/authService";

function RegisterPage() {
  // --- SECTION: State ---

  const [displayName, setDisplayName]   = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // --- SECTION: Client-Side Validation ---

  // Checks inputs before hitting Firebase, returns an error string or empty string if valid
  function validateInputs() {
    if (!displayName.trim()) {
      return "Please enter your full name.";
    }
    if (!email.trim()) {
      return "Please enter your email address.";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match. Please re-enter them.";
    }
    return ""; // no errors
  }

  // --- SECTION: Handle Form Submit ---

  async function handleRegister(event) {
    event.preventDefault();

    setErrorMessage("");

    // Run client-side validation first to give instant feedback without a network call
    const validationError = validateInputs();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // registerUser creates the Auth account, sets displayName, and writes the Firestore user doc
      await registerUser(email, password, displayName.trim());
      // After registration, Firebase Auth automatically signs the user in.
      // AuthContext will detect the new session and load their role.
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(getFirebaseErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- SECTION: Render ---

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* App branding */}
        <div className="auth-logo">
          <div className="auth-logo-title">SRT</div>
          <div className="auth-logo-subtitle">Sanitation Resilience Tracker</div>
        </div>

        <h2 className="auth-title">Create your account</h2>

        {/* Show error message from validation or Firebase */}
        {errorMessage && (
          <div className="error-message" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegister} noValidate>

          <div className="form-group">
            <label className="form-label" htmlFor="register-name">
              Full name
            </label>
            <input
              id="register-name"
              type="text"
              className="form-input"
              placeholder="e.g. Kwame Mensah"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Email address
            </label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              className="form-input"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm-password">
              Confirm password
            </label>
            <input
              id="register-confirm-password"
              type="password"
              className="form-input"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>

        </form>

        {/* Link back to login for existing users */}
        <p className="auth-switch-text">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>

      </div>
    </div>
  );
}

export default RegisterPage;
