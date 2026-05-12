import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, getFirebaseErrorMessage } from "../services/authService";

function RegisterPage() {
  const [displayName,    setDisplayName]    = useState("");
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg,       setErrorMsg]       = useState("");
  const [loading,        setLoading]        = useState(false);

  const navigate = useNavigate();

  // TODO: add email verification before granting field agent access
  function validate() {
    if (!displayName.trim())       return "Please enter your full name.";
    if (!email.trim())             return "Please enter your email address.";
    if (password.length < 6)       return "Password must be at least 6 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return "";
  }

  async function handleRegister(e) {
    e.preventDefault();
    setErrorMsg("");
    const err = validate();
    if (err) { setErrorMsg(err); return; }

    setLoading(true);
    try {
      await registerUser(email, password, displayName.trim());
      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-title">SRT</div>
          <div className="auth-logo-subtitle">Sanitation Resilience Tracker</div>
        </div>

        <h2 className="auth-title">Create your account</h2>

        {errorMsg && <div className="error-message" role="alert">{errorMsg}</div>}

        <form onSubmit={handleRegister} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              type="text"
              className="form-input"
              placeholder="e.g. Kwame Mensah"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              className="form-input"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm">Confirm password</label>
            <input
              id="register-confirm"
              type="password"
              className="form-input"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch-text">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
