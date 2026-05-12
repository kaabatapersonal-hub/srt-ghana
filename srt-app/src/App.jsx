// App.jsx
// The routing root of the Sanitation Resilience Tracker.
// Defines every page route and wraps protected pages with ProtectedRoute.
//
// Route map:
//   /               → redirects to /dashboard
//   /login          → LoginPage        (public)
//   /register       → RegisterPage     (public)
//   /dashboard      → DashboardPage    (requires login)
//   /report         → ReportPage       (requires login)
//   /map            → MapPage          (requires login)
//   /admin          → AdminPage        (requires admin role)
//
// AuthProvider is placed here so it wraps ALL routes and every component has access to auth state.

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// --- SECTION: Page Imports ---

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ReportPage from "./pages/ReportPage";
import MapPage from "./pages/MapPage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    // AuthProvider wraps BrowserRouter so auth state is available inside all route components
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* --- SECTION: Default Redirect --- */}
          {/* Visiting the root URL sends the user to /dashboard (ProtectedRoute handles auth check) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* --- SECTION: Public Routes --- */}
          {/* These pages do not require login */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* --- SECTION: Protected Routes (any logged-in user) --- */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
            }
          />

          {/* --- SECTION: Admin-Only Route --- */}
          {/* requireAdmin={true} means non-admin users are redirected to /dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
