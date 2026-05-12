// MapPage.jsx
// Interactive map of sanitation facilities in Northern Ghana.
// Features:
//   - Condition filter bar (All / Good / Fair / Poor / Critical)
//   - Color-coded CircleMarkers for every report with GPS
//   - Click popup with facility details
//   - Sidebar listing recent located reports
//   - Legend overlay with live count
//
// All data from useReports hook — zero extra Firestore reads.
// Route: /map (protected — requires login)

import React, { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { useReports } from "../hooks/useReports";
import Navbar from "../components/Navbar";
import ConditionBadge from "../components/ConditionBadge";

// --- SECTION: Constants ---

const NORTHERN_GHANA_CENTER = [10.0, -1.0];
const INITIAL_ZOOM = 8;

const CONDITION_MARKER_COLORS = {
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

// Filter bar options — "all" shows every marker
const FILTER_OPTIONS = [
  { value: "all",      label: "All" },
  { value: "good",     label: "Good" },
  { value: "fair",     label: "Fair" },
  { value: "poor",     label: "Poor" },
  { value: "critical", label: "Critical" },
];

// --- SECTION: Helpers ---

function formatDate(ts) {
  if (!ts || !ts.toDate) return "Just now";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(ts.toDate());
}

// --- SECTION: MarkerPopup Sub-Component ---

function MarkerPopup({ report }) {
  const typeLabel = FACILITY_TYPE_LABELS[report.facilityType] || report.facilityType;
  return (
    <div className="map-popup">
      <div className="map-popup-name">{report.facilityName}</div>
      <div className="map-popup-badge-row">
        <ConditionBadge condition={report.conditionStatus} />
      </div>
      <div className="map-popup-meta">{typeLabel}</div>
      <div className="map-popup-meta">
        By {report.submittedBy?.displayName || "Unknown"}
      </div>
      <div className="map-popup-meta">{formatDate(report.createdAt)}</div>
      {report.description && (
        <div className="map-popup-description">
          {report.description.length > 120
            ? report.description.slice(0, 120) + "…"
            : report.description}
        </div>
      )}
      {report.location?.accuracy && (
        <div className="map-popup-accuracy">GPS accuracy: ±{report.location.accuracy}m</div>
      )}
    </div>
  );
}

// --- SECTION: MapLegend Sub-Component ---

function MapLegend({ visibleCount, totalLocated }) {
  return (
    <div className="map-legend-overlay">
      <p className="map-legend-title">Condition</p>
      {Object.entries(CONDITION_MARKER_COLORS).map(([condition, color]) => (
        <div key={condition} className="map-legend-row">
          <span className="map-legend-dot" style={{ background: color }} />
          <span className="map-legend-label" style={{ textTransform: "capitalize" }}>
            {condition}
          </span>
        </div>
      ))}
      <div className="map-legend-divider" />
      <div className="map-legend-stat">{visibleCount} shown</div>
      {visibleCount !== totalLocated && (
        <div className="map-legend-stat muted">{totalLocated} total</div>
      )}
    </div>
  );
}

// --- SECTION: MapSidebar Sub-Component ---

// Panel on the right showing a scrollable list of located reports
function MapSidebar({ reports }) {
  return (
    <div className="map-sidebar">
      <div className="map-sidebar-header">
        <h3 className="map-sidebar-title">Located Reports</h3>
        <span className="map-sidebar-count">{reports.length}</span>
      </div>
      <div className="map-sidebar-list">
        {reports.length === 0 ? (
          <p className="map-sidebar-empty">No reports with GPS yet.</p>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="map-sidebar-item">
              <div className="map-sidebar-item-top">
                <span className="map-sidebar-name">{report.facilityName}</span>
                <ConditionBadge condition={report.conditionStatus} />
              </div>
              <div className="map-sidebar-meta">
                {FACILITY_TYPE_LABELS[report.facilityType] || report.facilityType}
                {" · "}{formatDate(report.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- SECTION: Main MapPage Component ---

function MapPage() {
  const { reports, isLoading, error } = useReports(100);
  const [activeFilter, setActiveFilter] = useState("all");

  // All reports that have valid GPS coordinates
  const locatedReports = reports.filter(
    (r) => r.location?.latitude && r.location?.longitude
  );

  // Filtered subset shown as markers (and in sidebar)
  const filteredReports = activeFilter === "all"
    ? locatedReports
    : locatedReports.filter((r) => r.conditionStatus === activeFilter);

  return (
    <div className="map-page page-fade-in">
      <Navbar />

      {isLoading && <div className="map-status-bar">Loading facility data...</div>}
      {error     && <div className="map-status-bar error">{error}</div>}

      {/* --- SECTION: Filter Bar --- */}
      <div className="map-filter-bar">
        {FILTER_OPTIONS.map((opt) => {
          const count = opt.value === "all"
            ? locatedReports.length
            : locatedReports.filter((r) => r.conditionStatus === opt.value).length;

          return (
            <button
              key={opt.value}
              className={`map-filter-btn condition-${opt.value} ${activeFilter === opt.value ? "active" : ""}`}
              onClick={() => setActiveFilter(opt.value)}
            >
              {opt.label}
              <span className="map-filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* --- SECTION: Map + Sidebar layout --- */}
      <div className="map-page-body">

        {/* Map area */}
        <div className="map-wrapper">
          <MapContainer
            center={NORTHERN_GHANA_CENTER}
            zoom={INITIAL_ZOOM}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* One marker per filtered report */}
            {filteredReports.map((report) => {
              const color = CONDITION_MARKER_COLORS[report.conditionStatus] || "#9e9e9e";
              return (
                <CircleMarker
                  key={report.id}
                  center={[report.location.latitude, report.location.longitude]}
                  radius={11}
                  pathOptions={{
                    fillColor:   color,
                    fillOpacity: 0.9,
                    color:       "white",
                    weight:      2,
                  }}
                >
                  <Popup maxWidth={260}>
                    <MarkerPopup report={report} />
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Legend overlay */}
          <MapLegend
            visibleCount={filteredReports.length}
            totalLocated={locatedReports.length}
          />

          {/* Empty overlay when no markers match the current filter */}
          {!isLoading && filteredReports.length === 0 && (
            <div className="map-empty-overlay">
              <div className="map-empty-card">
                <p className="map-empty-icon">📍</p>
                <p className="map-empty-title">No markers for this filter</p>
                <p className="map-empty-text">
                  {locatedReports.length === 0
                    ? "Submit a report with GPS enabled to see facilities on the map."
                    : `No "${activeFilter}" facilities found. Try a different filter.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — hidden on mobile via CSS */}
        <MapSidebar reports={filteredReports} />

      </div>
    </div>
  );
}

export default MapPage;
