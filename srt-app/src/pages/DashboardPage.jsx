// DashboardPage.jsx
// The main dashboard for the Sanitation Resilience Tracker.
//
// What it shows:
//   - Welcome header with role badge
//   - Stat cards: total reports + breakdown by condition + pending count
//   - Recent reports list (admins see all reports; regular users see their own)
//   - Quick action buttons (Submit Report, View Map, Admin Panel for admins)
//
// All data is loaded in real time from Firestore using the useReports hook.
// Stats are computed client-side from the fetched reports (no extra queries = Spark plan safe).
//
// Route: /dashboard (protected — requires login)

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useReports } from "../hooks/useReports";
import Navbar from "../components/Navbar";
import ConditionBadge from "../components/ConditionBadge";

// --- SECTION: Helper — Facility Type Labels ---

// Maps the stored facility type value to a readable label for the report list
const FACILITY_TYPE_LABELS = {
  borehole:        "Borehole / Hand Pump",
  latrine:         "Latrine / Toilet Block",
  handwashing:     "Handwashing Station",
  sewage:          "Sewage / Drainage",
  water_treatment: "Water Treatment",
  solid_waste:     "Solid Waste Site",
};

// --- SECTION: Helper — Format Firestore Timestamp ---

// Converts a Firestore server timestamp to a readable date string
// Firestore timestamps have a .toDate() method that returns a JS Date object
function formatReportDate(firestoreTimestamp) {
  if (!firestoreTimestamp || !firestoreTimestamp.toDate) {
    return "Just now"; // report was just submitted and timestamp hasn't synced yet
  }
  return new Intl.DateTimeFormat("en-GB", {
    day:    "numeric",
    month:  "short",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(firestoreTimestamp.toDate());
}

// --- SECTION: StatCard Sub-Component ---

// Renders a single stat card with a number, label, and accent color
// colorClass matches CSS classes: stat-blue, stat-green, stat-amber, stat-orange, stat-red, stat-purple
function StatCard({ value, label, colorClass }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

// --- SECTION: ReportRow Sub-Component ---

// Renders a single row in the recent reports list
function ReportRow({ report, showSubmitter }) {
  const facilityTypeLabel = FACILITY_TYPE_LABELS[report.facilityType] || report.facilityType;

  return (
    <div className="report-row">
      <div className="report-row-top">
        {/* Facility name on the left, condition badge on the right */}
        <span className="report-facility-name">{report.facilityName}</span>
        <ConditionBadge condition={report.conditionStatus} />
      </div>
      <div className="report-row-bottom">
        <span className="report-meta">{facilityTypeLabel}</span>
        {/* Only show the submitter name in admin view */}
        {showSubmitter && report.submittedBy?.displayName && (
          <span className="report-meta">· {report.submittedBy.displayName}</span>
        )}
        <span className="report-meta">· {formatReportDate(report.createdAt)}</span>
        {/* Show pending badge so admins can spot unreviewed reports at a glance */}
        {report.status === "pending" && (
          <span className="report-status-pending">Pending</span>
        )}
      </div>
    </div>
  );
}

// --- SECTION: Main Dashboard Component ---

function DashboardPage() {
  const { currentUser, isAdmin } = useAuth();
  const { reports, isLoading, error } = useReports(100);

  const userGreetingName = currentUser?.displayName || currentUser?.email;

  // --- SECTION: Compute Stats ---

  // System-wide stats — computed from all fetched reports
  const systemStats = {
    total:    reports.length,
    good:     reports.filter((r) => r.conditionStatus === "good").length,
    fair:     reports.filter((r) => r.conditionStatus === "fair").length,
    poor:     reports.filter((r) => r.conditionStatus === "poor").length,
    critical: reports.filter((r) => r.conditionStatus === "critical").length,
    pending:  reports.filter((r) => r.status === "pending").length,
  };

  // Current user's own reports — filtered from the same fetched array (no extra Firestore read)
  const myReports = reports.filter(
    (r) => r.submittedBy?.uid === currentUser?.uid
  );

  // Personal stats derived from the user's own reports
  const myStats = {
    total:    myReports.length,
    good:     myReports.filter((r) => r.conditionStatus === "good").length,
    fair:     myReports.filter((r) => r.conditionStatus === "fair").length,
    poor:     myReports.filter((r) => r.conditionStatus === "poor").length,
    critical: myReports.filter((r) => r.conditionStatus === "critical").length,
    pending:  myReports.filter((r) => r.status === "pending").length,
  };

  // Admins see all recent reports; regular users see only their own
  const recentReports = isAdmin ? reports.slice(0, 10) : myReports.slice(0, 5);

  // The stats to display in the cards depend on role
  const displayStats = isAdmin ? systemStats : myStats;
  const statsLabel   = isAdmin ? "System" : "My";

  // --- SECTION: Render ---

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-content">

        {/* --- SECTION: Welcome Header --- */}
        <div className="dashboard-header">
          <h2 className="dashboard-greeting">
            Welcome back, {userGreetingName}
            {isAdmin && <span className="role-badge">Admin</span>}
          </h2>
          <p className="dashboard-subtext">
            Sanitation Resilience Tracker — Northern Ghana
          </p>
        </div>

        {/* Show Firestore error if the listener failed */}
        {error && (
          <div className="error-message" style={{ marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        {/* --- SECTION: Stat Cards --- */}
        {isLoading ? (
          <div className="stats-loading">Loading stats...</div>
        ) : (
          <>
            {/* Show the label so user understands whose stats they're viewing */}
            <p className="section-eyebrow">{statsLabel} Overview</p>
            <div className="stats-grid">
              <StatCard value={displayStats.total}    label="Total Reports"   colorClass="stat-blue"   />
              <StatCard value={displayStats.good}     label="Good"            colorClass="stat-green"  />
              <StatCard value={displayStats.fair}     label="Fair"            colorClass="stat-amber"  />
              <StatCard value={displayStats.poor}     label="Poor"            colorClass="stat-orange" />
              <StatCard value={displayStats.critical} label="Critical"        colorClass="stat-red"    />
              <StatCard value={displayStats.pending}  label="Pending Review"  colorClass="stat-purple" />
            </div>

            {/* Admin: also show the system total when viewing personal stats */}
            {!isAdmin && systemStats.total > 0 && (
              <p className="system-total-note">
                {systemStats.total} total report{systemStats.total !== 1 ? "s" : ""} across the system
                · {systemStats.pending} pending review
              </p>
            )}
          </>
        )}

        {/* --- SECTION: Main Content Columns --- */}
        <div className="dashboard-columns">

          {/* Left column: Recent Reports list */}
          <div className="dashboard-column-main">
            <div className="section-header">
              <h3 className="section-title">
                {isAdmin ? "All Recent Reports" : "My Recent Reports"}
              </h3>
            </div>

            {isLoading ? (
              <div className="reports-loading">Loading reports...</div>
            ) : recentReports.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-icon">📋</p>
                <p className="empty-state-text">
                  {isAdmin
                    ? "No reports have been submitted yet."
                    : "You haven't submitted any reports yet."}
                </p>
                <Link to="/report" className="empty-state-link">
                  Submit your first report →
                </Link>
              </div>
            ) : (
              <div className="reports-list">
                {recentReports.map((report) => (
                  <ReportRow
                    key={report.id}
                    report={report}
                    showSubmitter={isAdmin} // admins see who submitted each report
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right column: Quick Actions */}
          <div className="dashboard-column-side">
            <div className="section-header">
              <h3 className="section-title">Quick Actions</h3>
            </div>

            <div className="quick-actions">
              <Link to="/report" className="quick-action-btn primary">
                + Submit Report
              </Link>
              <Link to="/map" className="quick-action-btn secondary">
                🗺️ View Map
              </Link>
              {isAdmin && (
                <Link to="/admin" className="quick-action-btn admin">
                  🛠️ Admin Panel
                </Link>
              )}
            </div>

            {/* Condition legend so users understand the color system */}
            <div className="condition-legend">
              <p className="section-eyebrow" style={{ marginBottom: "0.6rem" }}>
                Condition Scale
              </p>
              <div className="legend-item">
                <span className="legend-dot dot-good" /> Good — Fully functional
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-fair" /> Fair — Minor repair needed
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-poor" /> Poor — Urgent repair needed
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-critical" /> Critical — Health risk
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
