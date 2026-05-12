import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, getFirebaseErrorMessage } from "../services/authService";

function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginUser(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
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

        <h2 className="auth-title">Sign in to your account</h2>

        {error && <div className="error-message" role="alert">{error}</div>}

        <form onSubmit={handleLogin} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-switch-text">
          Don't have an account?{" "}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
