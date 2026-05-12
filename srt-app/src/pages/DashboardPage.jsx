// DashboardPage.jsx
// The main landing page after login. Shows a welcome message and role badge.
// Stats, charts, and recent reports will be added in a later session.
// Includes the Navbar so the user can navigate to other pages.
// Route: /dashboard (protected — requires login)

import React from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

function DashboardPage() {
  const { currentUser, isAdmin } = useAuth();

  // Use the saved display name if available, otherwise fall back to the email address
  const userGreetingName = currentUser?.displayName || currentUser?.email;

  return (
    <div className="dashboard-page">

      <Navbar />

      <div className="dashboard-content">

        {/* --- SECTION: Welcome Header --- */}
        <div className="dashboard-header">
          <h2 className="dashboard-greeting">
            Welcome back, {userGreetingName}
            {/* Admin badge — only shown to admin users so they know their elevated role */}
            {isAdmin && <span className="role-badge">Admin</span>}
          </h2>
          <p className="dashboard-subtext">
            Sanitation Resilience Tracker — Northern Ghana
          </p>
        </div>

        {/* --- SECTION: Placeholder Content --- */}
        {/* These cards will be replaced with real stats and charts in a later session */}
        <div className="placeholder-card">
          <p>📊 Dashboard stats, facility cards, and recent reports will appear here in Session 4.</p>
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;
