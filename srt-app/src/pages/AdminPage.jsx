// AdminPage.jsx
// Admin panel for reviewing and managing submitted reports.
// Admins can approve or reject pending reports and manage facility records.
// Full admin implementation coming in Session 6.
// Route: /admin (protected — requires admin role)

import React from "react";
import Navbar from "../components/Navbar";

function AdminPage() {
  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">
        <div className="placeholder-card">
          <p>🛠️ Admin panel — approve/reject reports and manage facilities — coming in Session 6.</p>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
