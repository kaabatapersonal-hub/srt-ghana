// App.jsx
// The routing root of the Sanitation Resilience Tracker.
// Defines every page route and wraps protected pages with ProtectedRoute.
//
// Route map:
//   /               → LandingPage      (public — shown to everyone)
//   /login          → LoginPage        (public)
//   /register       → RegisterPage     (public)
//   /dashboard      → DashboardPage    (requires login)
//   /report         → ReportPage       (requires login)
//   /map            → MapPage          (requires login)
//   /admin          → AdminPage        (requires admin role)
//
// AuthProvider wraps everything so all routes can access auth state.

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useOfflineSync } from "./hooks/useOfflineSync";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ReportPage from "./pages/ReportPage";
import MapPage from "./pages/MapPage";
import AdminPage from "./pages/AdminPage";
import USSDPage from "./pages/USSDPage";

function AppRoutes() {
  useOfflineSync();
  return (
    <BrowserRouter>
      <Routes>

          {/* --- SECTION: Public Routes --- */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* --- SECTION: Protected Routes (any logged-in user) --- */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/report"    element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
          <Route path="/map"       element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/ussd"      element={<ProtectedRoute><USSDPage /></ProtectedRoute>} />

          {/* --- SECTION: Admin-Only Route --- */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}><AdminPage /></ProtectedRoute>
          } />

        </Routes>
      </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
