// MapPage.jsx
// Displays an interactive OpenStreetMap of Northern Ghana with color-coded markers
// for each sanitation facility based on their reported condition status.
// Full map implementation coming in Session 5.
// Route: /map (protected — requires login)

import React from "react";
import Navbar from "../components/Navbar";

function MapPage() {
  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">
        <div className="placeholder-card">
          <p>🗺️ Interactive OpenStreetMap with facility markers coming in Session 5.</p>
        </div>
      </div>
    </div>
  );
}

export default MapPage;
