// ProtectedRoute.jsx
// A wrapper component that guards pages from unauthorized access.
//
// How it works:
//   1. If the user is not logged in → redirect to /login
//   2. If the page requires admin and the user is not admin → redirect to /dashboard
//   3. Otherwise → render the page normally
//
// Usage in App.jsx:
//   <ProtectedRoute><DashboardPage /></ProtectedRoute>
//   <ProtectedRoute requireAdmin={true}><AdminPage /></ProtectedRoute>

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// children     → the page component to render if the user passes the checks
// requireAdmin → set to true for pages that only admins should access
function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, isAdmin } = useAuth();

  // --- SECTION: Authorization Checks ---

  // Check 1: No logged-in user → send to login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check 2: Page requires admin role but current user is not an admin
  // replace={true} means the redirect replaces history so the user can't press Back to re-enter
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // All checks passed → render the actual protected page
  return children;
}

export default ProtectedRoute;
