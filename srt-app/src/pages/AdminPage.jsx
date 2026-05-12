import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useReports } from "../hooks/useReports";
import { updateReportStatus } from "../services/reportService";
import Navbar from "../components/Navbar";
import ConditionBadge from "../components/ConditionBadge";
import Footer from "../components/Footer";

const FILTER_TABS = [
  { key: "pending",  label: "Pending"  },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all",      label: "All"      },
];

// Short labels for chart X-axis — full names get clipped on narrow bars
const FACILITY_TYPE_SHORT = {
  borehole:        "Borehole",
  latrine:         "Latrine",
  handwashing:     "Handwashing",
  sewage:          "Sewage",
  water_treatment: "Water Treat.",
  solid_waste:     "Solid Waste",
};

const FACILITY_TYPE_LABELS = {
  borehole:        "Borehole / Hand Pump",
  latrine:         "Latrine / Toilet Block",
  handwashing:     "Handwashing Station",
  sewage:          "Sewage / Drainage",
  water_treatment: "Water Treatment",
  solid_waste:     "Solid Waste Site",
};

const formatDate = (ts) => {
  if (!ts || !ts.toDate) return "Just now";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(ts.toDate());
};

function FacilityTypeChart({ reports }) {
  const typeCounts = {};
  reports.forEach(r => {
    const name   = FACILITY_TYPE_SHORT[r.facilityType] || r.facilityType || "Other";
    const status = r.status || "pending";
    if (!typeCounts[name]) typeCounts[name] = { name, pending: 0, approved: 0, rejected: 0 };
    typeCounts[name][status] = (typeCounts[name][status] || 0) + 1;
  });

  const data = Object.values(typeCounts);
  if (data.length === 0) {
    return <div className="chart-empty"><p>No reports yet.</p></div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend
          iconType="circle"
          iconSize={10}
          formatter={v => <span style={{ fontSize: "0.8rem", color: "#757575" }}>{v}</span>}
        />
        <Bar dataKey="pending"  name="Pending"  stackId="a" fill="#7b1fa2" />
        <Bar dataKey="approved" name="Approved" stackId="a" fill="#2e7d32" />
        <Bar dataKey="rejected" name="Rejected" stackId="a" fill="#c62828" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    pending:  { label: "Pending",  cssClass: "status-pending"  },
    approved: { label: "Approved", cssClass: "status-approved" },
    rejected: { label: "Rejected", cssClass: "status-rejected" },
  }[status] || { label: status, cssClass: "status-pending" };
  return <span className={`admin-status-badge ${cfg.cssClass}`}>{cfg.label}</span>;
}

function AdminReportCard({ report, isActioning, onApprove, onReject }) {
  const typeLabel  = FACILITY_TYPE_LABELS[report.facilityType] || report.facilityType;
  const isApproved = report.status === "approved";
  const isRejected = report.status === "rejected";

  return (
    <div className={`admin-report-card status-${report.status}`}>
      <div className="admin-report-header">
        <div className="admin-report-title-group">
          <span className="admin-report-name">{report.facilityName}</span>
          <ConditionBadge condition={report.conditionStatus} />
        </div>
        <div className="admin-actions">
          {!isApproved && (
            <button className="btn-approve" onClick={() => onApprove(report.id)} disabled={isActioning}>
              {isActioning ? "..." : "✓ Approve"}
            </button>
          )}
          {!isRejected && (
            <button className="btn-reject" onClick={() => onReject(report.id)} disabled={isActioning}>
              {isActioning ? "..." : "✗ Reject"}
            </button>
          )}
          {isRejected && (
            <button className="btn-approve" onClick={() => onApprove(report.id)} disabled={isActioning}>
              {isActioning ? "..." : "↩ Re-approve"}
            </button>
          )}
        </div>
      </div>

      <div className="admin-report-meta-row">
        <span className="admin-meta">{typeLabel}</span>
        <span className="admin-meta-dot">·</span>
        <span className="admin-meta">
          {report.submittedBy?.displayName || report.submittedBy?.email || "Unknown"}
        </span>
        <span className="admin-meta-dot">·</span>
        <span className="admin-meta">{formatDate(report.createdAt)}</span>
      </div>

      {report.description && (
        <p className="admin-report-description">
          {report.description.length > 160
            ? report.description.slice(0, 160) + "…"
            : report.description}
        </p>
      )}

      <div className="admin-report-footer">
        <StatusBadge status={report.status} />
        {report.location
          ? <span className="admin-footer-tag gps-yes">📍 GPS</span>
          : <span className="admin-footer-tag gps-no">No GPS</span>
        }
        {report.reviewedAt && (
          <span className="admin-meta" style={{ marginLeft: "auto" }}>
            Reviewed {formatDate(report.reviewedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

function AdminPage() {
  const { reports, isLoading, error } = useReports(100);

  const [activeFilter,      setActiveFilter]      = useState("pending");
  const [searchQuery,       setSearchQuery]       = useState("");
  const [actioningReportId, setActioningReportId] = useState(null);
  const [actionError,       setActionError]       = useState("");

  const pendingCount  = reports.filter(r => r.status === "pending").length;
  const approvedCount = reports.filter(r => r.status === "approved").length;
  const rejectedCount = reports.filter(r => r.status === "rejected").length;

  const statusFiltered = activeFilter === "all"
    ? reports
    : reports.filter(r => r.status === activeFilter);

  const filteredReports = searchQuery.trim()
    ? statusFiltered.filter(r =>
        r.facilityName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : statusFiltered;

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

  return (
    <div className="admin-page page-fade-in">
      <Navbar />

      <div className="admin-content">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Admin Panel</h1>
          <p className="admin-page-subtitle">Review and act on submitted facility reports.</p>
        </div>

        {error       && <div className="error-message">{error}</div>}
        {actionError && <div className="error-message" style={{ marginBottom: "1rem" }}>{actionError}</div>}

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

        {!isLoading && reports.length > 0 && (
          <div className="admin-chart-card">
            <p className="form-section-title">Reports by Facility Type</p>
            <FacilityTypeChart reports={reports} />
          </div>
        )}

        <div className="admin-search-bar">
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search by facility name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs" role="tablist">
          {FILTER_TABS.map(tab => {
            const counts = {
              pending: pendingCount, approved: approvedCount,
              rejected: rejectedCount, all: reports.length,
            };
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeFilter === tab.key}
                className={`filter-tab ${activeFilter === tab.key ? "active" : ""}`}
                onClick={() => setActiveFilter(tab.key)}
              >
                {tab.key.charAt(0).toUpperCase() + tab.key.slice(1)}
                <span className="filter-tab-count">{counts[tab.key]}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="admin-loading">Loading reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="admin-empty">
            <p className="admin-empty-icon">
              {searchQuery ? "🔍" : activeFilter === "pending" ? "✅" : "📋"}
            </p>
            <p className="admin-empty-text">
              {searchQuery
                ? `No reports matching "${searchQuery}".`
                : activeFilter === "pending"
                  ? "No pending reports — all caught up!"
                  : `No ${activeFilter} reports found.`}
            </p>
          </div>
        ) : (
          <div className="admin-reports-list">
            {filteredReports.map(report => (
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

      <Footer />
    </div>
  );
}

export default AdminPage;
