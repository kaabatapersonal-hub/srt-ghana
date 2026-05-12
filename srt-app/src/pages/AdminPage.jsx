// AdminPage.jsx
// Admin-only panel for reviewing and acting on submitted sanitation reports.
//
// What admins can do:
//   - See total counts of Pending / Approved / Rejected reports
//   - Filter the report list by status using tab buttons
//   - Approve or Reject any pending report (updates Firestore status field in real time)
//   - Reverse a previous decision (re-approve or re-reject)
//
// All data comes from the useReports hook (same live listener as Dashboard).
// Approving/rejecting calls updateReportStatus → Firestore updateDoc → onSnapshot
// automatically refreshes the list, so no manual re-fetch is needed.
//
// Route: /admin (protected — requires admin role, enforced by ProtectedRoute)

import React, { useState } from "react";
import { useReports } from "../hooks/useReports";
import { updateReportStatus } from "../services/reportService";
import Navbar from "../components/Navbar";
import ConditionBadge from "../components/ConditionBadge";

// --- SECTION: Filter Tab Config ---

// Defines the available filter tabs shown at the top of the report list
const FILTER_TABS = [
  { key: "pending",  label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all",      label: "All" },
];

// Human-readable labels for facility type values stored in Firestore
const FACILITY_TYPE_LABELS = {
  borehole:        "Borehole / Hand Pump",
  latrine:         "Latrine / Toilet Block",
  handwashing:     "Handwashing Station",
  sewage:          "Sewage / Drainage",
  water_treatment: "Water Treatment",
  solid_waste:     "Solid Waste Site",
};

// --- SECTION: Helper — Format Firestore Timestamp ---

function formatDate(firestoreTimestamp) {
  if (!firestoreTimestamp || !firestoreTimestamp.toDate) return "Just now";
  return new Intl.DateTimeFormat("en-GB", {
    day:    "numeric",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(firestoreTimestamp.toDate());
}

// --- SECTION: StatusBadge Sub-Component ---

// Shows the current review status of a report (Pending / Approved / Rejected)
function StatusBadge({ status }) {
  const statusConfig = {
    pending:  { label: "Pending",  cssClass: "status-pending"  },
    approved: { label: "Approved", cssClass: "status-approved" },
    rejected: { label: "Rejected", cssClass: "status-rejected" },
  };
  const config = statusConfig[status] || { label: status, cssClass: "status-pending" };

  return (
    <span className={`admin-status-badge ${config.cssClass}`}>
      {config.label}
    </span>
  );
}

// --- SECTION: AdminReportCard Sub-Component ---

// Renders a single report card in the admin list.
// Shows all details an admin needs to make a review decision,
// plus Approve / Reject action buttons.
function AdminReportCard({ report, isActioning, onApprove, onReject }) {
  const facilityTypeLabel = FACILITY_TYPE_LABELS[report.facilityType] || report.facilityType;
  const isPending  = report.status === "pending";
  const isApproved = report.status === "approved";

  return (
    <div className={`admin-report-card status-${report.status}`}>

      {/* --- Top row: facility name, condition badge, action buttons --- */}
      <div className="admin-report-header">
        <div className="admin-report-title-group">
          <span className="admin-report-name">{report.facilityName}</span>
          <ConditionBadge condition={report.conditionStatus} />
        </div>

        {/* Action buttons — shown based on current status */}
        <div className="admin-actions">
          {/* Show Approve button if report is not already approved */}
          {!isApproved && (
            <button
              className="btn-approve"
              onClick={() => onApprove(report.id)}
              disabled={isActioning}
            >
              {isActioning ? "..." : "✓ Approve"}
            </button>
          )}
          {/* Show Reject button if report is not already rejected */}
          {report.status !== "rejected" && (
            <button
              className="btn-reject"
              onClick={() => onReject(report.id)}
              disabled={isActioning}
            >
              {isActioning ? "..." : "✗ Reject"}
            </button>
          )}
          {/* If already rejected, only show Approve (allow reversing the decision) */}
          {report.status === "rejected" && (
            <button
              className="btn-approve"
              onClick={() => onApprove(report.id)}
              disabled={isActioning}
            >
              {isActioning ? "..." : "↩ Re-approve"}
            </button>
          )}
        </div>
      </div>

      {/* --- Meta row: type, submitter, date --- */}
      <div className="admin-report-meta-row">
        <span className="admin-meta">{facilityTypeLabel}</span>
        <span className="admin-meta-dot">·</span>
        <span className="admin-meta">
          {report.submittedBy?.displayName || report.submittedBy?.email || "Unknown"}
        </span>
        <span className="admin-meta-dot">·</span>
        <span className="admin-meta">{formatDate(report.createdAt)}</span>
      </div>

      {/* --- Description excerpt --- */}
      {report.description && (
        <p className="admin-report-description">
          {report.description.length > 160
            ? report.description.slice(0, 160) + "…"
            : report.description}
        </p>
      )}

      {/* --- Footer: status badge + GPS indicator + review date --- */}
      <div className="admin-report-footer">
        <StatusBadge status={report.status} />

        {/* Show whether this report included GPS coordinates */}
        {report.location ? (
          <span className="admin-footer-tag gps-yes">📍 GPS</span>
        ) : (
          <span className="admin-footer-tag gps-no">No GPS</span>
        )}

        {/* Show when the admin reviewed this report (if it's been reviewed) */}
        {report.reviewedAt && (
          <span className="admin-meta" style={{ marginLeft: "auto" }}>
            Reviewed {formatDate(report.reviewedAt)}
          </span>
        )}
      </div>

    </div>
  );
}

// --- SECTION: Main AdminPage Component ---

function AdminPage() {
  const { reports, isLoading, error } = useReports(100);

  // Which filter tab is currently active — default to "pending" so admins see what needs action first
  const [activeFilter, setActiveFilter] = useState("pending");

  // ID of the report currently being approved/rejected (shows loading state on that card's buttons)
  const [actioningReportId, setActioningReportId] = useState(null);

  // Error message shown if an approve/reject action fails
  const [actionError, setActionError] = useState("");

  // --- SECTION: Compute Stats ---

  const pendingCount  = reports.filter((r) => r.status === "pending").length;
  const approvedCount = reports.filter((r) => r.status === "approved").length;
  const rejectedCount = reports.filter((r) => r.status === "rejected").length;

  // --- SECTION: Filter Reports for Display ---

  // Filter the full report list based on the active tab
  const filteredReports = activeFilter === "all"
    ? reports
    : reports.filter((r) => r.status === activeFilter);

  // --- SECTION: Approve / Reject Handlers ---

  // Marks a report as approved in Firestore.
  // The useReports onSnapshot listener will automatically update the UI.
  async function handleApprove(reportId) {
    setActioningReportId(reportId);
    setActionError("");
    try {
      await updateReportStatus(reportId, "approved");
    } catch (err) {
      console.error("Approve failed:", err);
      setActionError("Failed to approve report. Please try again.");
    } finally {
      setActioningReportId(null);
    }
  }

  // Marks a report as rejected in Firestore.
  async function handleReject(reportId) {
    setActioningReportId(reportId);
    setActionError("");
    try {
      await updateReportStatus(reportId, "rejected");
    } catch (err) {
      console.error("Reject failed:", err);
      setActionError("Failed to reject report. Please try again.");
    } finally {
      setActioningReportId(null);
    }
  }

  // --- SECTION: Render ---

  return (
    <div className="admin-page">
      <Navbar />

      <div className="admin-content">

        {/* --- SECTION: Page Header --- */}
        <div className="admin-page-header">
          <h1 className="admin-page-title">Admin Panel</h1>
          <p className="admin-page-subtitle">
            Review and act on submitted facility reports.
          </p>
        </div>

        {/* Firestore error */}
        {error && (
          <div className="error-message">{error}</div>
        )}

        {/* Action error (approve/reject failed) */}
        {actionError && (
          <div className="error-message" style={{ marginBottom: "1rem" }}>
            {actionError}
          </div>
        )}

        {/* --- SECTION: Summary Stats --- */}
        <div className="admin-stats-row">
          <div className="admin-stat-card pending">
            <div className="admin-stat-value">{pendingCount}</div>
            <div className="admin-stat-label">Pending</div>
          </div>
          <div className="admin-stat-card approved">
            <div className="admin-stat-value">{approvedCount}</div>
            <div className="admin-stat-label">Approved</div>
          </div>
          <div className="admin-stat-card rejected">
            <div className="admin-stat-value">{rejectedCount}</div>
            <div className="admin-stat-label">Rejected</div>
          </div>
          <div className="admin-stat-card total">
            <div className="admin-stat-value">{reports.length}</div>
            <div className="admin-stat-label">Total</div>
          </div>
        </div>

        {/* --- SECTION: Filter Tabs --- */}
        <div className="filter-tabs" role="tablist">
          {FILTER_TABS.map((tab) => {
            // Show counts in the tab labels so admins know at a glance how many are in each group
            const tabCounts = {
              pending:  pendingCount,
              approved: approvedCount,
              rejected: rejectedCount,
              all:      reports.length,
            };

            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeFilter === tab.key}
                className={`filter-tab ${activeFilter === tab.key ? "active" : ""}`}
                onClick={() => setActiveFilter(tab.key)}
              >
                {tab.label}
                <span className="filter-tab-count">{tabCounts[tab.key]}</span>
              </button>
            );
          })}
        </div>

        {/* --- SECTION: Report List --- */}
        {isLoading ? (
          <div className="admin-loading">Loading reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="admin-empty">
            <p className="admin-empty-icon">
              {activeFilter === "pending" ? "✅" : "📋"}
            </p>
            <p className="admin-empty-text">
              {activeFilter === "pending"
                ? "No pending reports — all caught up!"
                : `No ${activeFilter} reports found.`}
            </p>
          </div>
        ) : (
          <div className="admin-reports-list">
            {filteredReports.map((report) => (
              <AdminReportCard
                key={report.id}
                report={report}
                isActioning={actioningReportId === report.id}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminPage;
