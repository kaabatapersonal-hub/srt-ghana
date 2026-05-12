import React from "react";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useReports } from "../hooks/useReports";
import Navbar from "../components/Navbar";
import ConditionBadge from "../components/ConditionBadge";
import Footer from "../components/Footer";

// same colors used for chart slices and stat card accents
const CONDITION_COLORS = {
  good:     "#2e7d32",
  fair:     "#f57c00",
  poor:     "#e64a19",
  critical: "#c62828",
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
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(ts.toDate());
};

function StatCard({ value, label, colorClass }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="stats-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton skeleton-stat-card" />
        ))}
      </div>
      <div className="skeleton-section">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton skeleton-report-row" />
        ))}
      </div>
    </div>
  );
}

function ReportRow({ report, showSubmitter }) {
  const typeLabel = FACILITY_TYPE_LABELS[report.facilityType] || report.facilityType;
  return (
    <div className="report-row">
      <div className="report-row-top">
        <span className="report-facility-name">{report.facilityName}</span>
        <ConditionBadge condition={report.conditionStatus} />
      </div>
      <div className="report-row-bottom">
        <span className="report-meta">{typeLabel}</span>
        {showSubmitter && report.submittedBy?.displayName && (
          <span className="report-meta">· {report.submittedBy.displayName}</span>
        )}
        <span className="report-meta">· {formatDate(report.createdAt)}</span>
        {report.status === "pending" && (
          <span className="report-status-pending">Pending</span>
        )}
      </div>
    </div>
  );
}

function ConditionDonutChart({ stats }) {
  const chartData = [
    { name: "Good",     value: stats.good,     color: CONDITION_COLORS.good },
    { name: "Fair",     value: stats.fair,     color: CONDITION_COLORS.fair },
    { name: "Poor",     value: stats.poor,     color: CONDITION_COLORS.poor },
    { name: "Critical", value: stats.critical, color: CONDITION_COLORS.critical },
  ].filter(d => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="chart-empty">
        <p>No condition data yet. Submit reports to see the breakdown.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%" cy="50%"
          innerRadius={60} outerRadius={88}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [`${value} reports`, name]} />
        <Legend
          iconType="circle"
          iconSize={10}
          formatter={v => <span style={{ fontSize: "0.8rem", color: "#757575" }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function SystemStatusBanner({ pendingCount }) {
  if (pendingCount === 0) {
    return <div className="status-banner green">✅ All reports reviewed — no pending submissions.</div>;
  }
  const cls = pendingCount > 5 ? "red" : "amber";
  return (
    <div className={`status-banner ${cls}`}>
      ⚠️ {pendingCount} report{pendingCount !== 1 ? "s" : ""} pending admin review.
      {pendingCount > 5 && " Action required."}
    </div>
  );
}

function DashboardPage() {
  const { currentUser, isAdmin } = useAuth();
  const { reports, isLoading, error } = useReports(100);

  const name = currentUser?.displayName || currentUser?.email;

  const systemStats = {
    total:    reports.length,
    good:     reports.filter(r => r.conditionStatus === "good").length,
    fair:     reports.filter(r => r.conditionStatus === "fair").length,
    poor:     reports.filter(r => r.conditionStatus === "poor").length,
    critical: reports.filter(r => r.conditionStatus === "critical").length,
    pending:  reports.filter(r => r.status === "pending").length,
  };

  // console.log('stats:', systemStats);

  const myReports = reports.filter(r => r.submittedBy?.uid === currentUser?.uid);
  const myStats = {
    total:    myReports.length,
    good:     myReports.filter(r => r.conditionStatus === "good").length,
    fair:     myReports.filter(r => r.conditionStatus === "fair").length,
    poor:     myReports.filter(r => r.conditionStatus === "poor").length,
    critical: myReports.filter(r => r.conditionStatus === "critical").length,
    pending:  myReports.filter(r => r.status === "pending").length,
  };

  const displayStats  = isAdmin ? systemStats : myStats;
  const statsLabel    = isAdmin ? "System Overview" : "My Reports";
  const recentReports = isAdmin ? reports.slice(0, 10) : myReports.slice(0, 5);

  return (
    <div className="dashboard-page page-fade-in">
      <Navbar />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2 className="dashboard-greeting">
            Welcome back, {name}
            {isAdmin && <span className="role-badge">Admin</span>}
          </h2>
          <p className="dashboard-subtext">Sanitation Resilience Tracker — Northern Ghana</p>
        </div>

        {error && <div className="error-message" style={{ marginBottom: "1rem" }}>{error}</div>}

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <SystemStatusBanner pendingCount={systemStats.pending} />

            <p className="section-eyebrow" style={{ marginTop: "1.5rem" }}>{statsLabel}</p>
            <div className="stats-grid">
              <StatCard value={displayStats.total}    label="Total Reports"  colorClass="stat-blue"   />
              <StatCard value={displayStats.good}     label="Good"           colorClass="stat-green"  />
              <StatCard value={displayStats.fair}     label="Fair"           colorClass="stat-amber"  />
              <StatCard value={displayStats.poor}     label="Poor"           colorClass="stat-orange" />
              <StatCard value={displayStats.critical} label="Critical"       colorClass="stat-red"    />
              <StatCard value={displayStats.pending}  label="Pending Review" colorClass="stat-purple" />
            </div>

            {!isAdmin && systemStats.total > 0 && (
              <p className="system-total-note">
                {systemStats.total} total report{systemStats.total !== 1 ? "s" : ""} across the system
                · {systemStats.pending} pending review
              </p>
            )}

            <div className="dashboard-columns" style={{ marginTop: "1.5rem" }}>
              <div className="dashboard-column-main">
                <div className="section-header">
                  <h3 className="section-title">
                    {isAdmin ? "All Recent Reports" : "My Recent Reports"}
                  </h3>
                </div>

                {recentReports.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-state-icon">📋</p>
                    <p className="empty-state-text">No reports yet.</p>
                    <Link to="/report" className="empty-state-link">Submit your first report →</Link>
                  </div>
                ) : (
                  <div className="reports-list">
                    {recentReports.map(r => (
                      <ReportRow key={r.id} report={r} showSubmitter={isAdmin} />
                    ))}
                  </div>
                )}
              </div>

              <div className="dashboard-column-side">
                <div className="section-header">
                  <h3 className="section-title">Condition Breakdown</h3>
                </div>
                <div className="chart-card">
                  <ConditionDonutChart stats={isAdmin ? systemStats : myStats} />
                </div>

                <div className="section-header" style={{ marginTop: "1.25rem" }}>
                  <h3 className="section-title">Quick Actions</h3>
                </div>
                <div className="quick-actions">
                  <Link to="/report" className="quick-action-btn primary">+ Submit Report</Link>
                  <Link to="/map"    className="quick-action-btn secondary">🗺️ View Map</Link>
                  {isAdmin && (
                    <Link to="/admin" className="quick-action-btn admin">🛠️ Admin Panel</Link>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default DashboardPage;
