// MapPage.jsx
// Interactive map of sanitation facilities in Northern Ghana.
// Pulls all submitted reports from Firestore (via useReports hook) and places a
// color-coded circular marker on the map for every report that has GPS coordinates.
//
// Marker colors match the condition system used across the app:
//   Green  → Good    | Amber → Fair
//   Orange → Poor    | Red   → Critical
//
// Clicking a marker opens a popup with facility name, condition, type, date, and notes.
// Reports submitted without GPS are listed in a notice below the legend.
//
// Uses react-leaflet + OpenStreetMap tiles (free, no API key required).
// Reuses the useReports hook — no extra Firestore reads beyond what the dashboard already does.
//
// Route: /map (protected — requires login)

import React, { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { useReports } from "../hooks/useReports";
import Navbar from "../components/Navbar";
import ConditionBadge from "../components/ConditionBadge";

// --- SECTION: Map Constants ---

// Center of Northern Ghana (between Tamale and Bolgatanga) at zoom 8
// shows the Northern, Upper East, and Upper West regions on initial load
const NORTHERN_GHANA_CENTER = [10.0, -1.0];
const INITIAL_ZOOM = 8;

// Color for each CircleMarker, matched to the app-wide condition color system
const CONDITION_MARKER_COLORS = {
  good:     "#2e7d32",  // dark green
  fair:     "#f57c00",  // amber
  poor:     "#e64a19",  // deep orange
  critical: "#c62828",  // red
};

// Human-readable labels for facility types (same as ReportPage)
const FACILITY_TYPE_LABELS = {
  borehole:        "Borehole / Hand Pump",
  latrine:         "Latrine / Toilet Block",
  handwashing:     "Handwashing Station",
  sewage:          "Sewage / Drainage",
  water_treatment: "Water Treatment",
  solid_waste:     "Solid Waste Site",
};

// --- SECTION: Helper — Format Firestore Timestamp ---

function formatReportDate(firestoreTimestamp) {
  if (!firestoreTimestamp || !firestoreTimestamp.toDate) return "Just now";
  return new Intl.DateTimeFormat("en-GB", {
    day:    "numeric",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(firestoreTimestamp.toDate());
}

// --- SECTION: MarkerPopup Sub-Component ---

// Content shown inside the Leaflet popup when a marker is clicked.
// Kept as a separate component to keep the main render clean.
function MarkerPopup({ report }) {
  const facilityTypeLabel = FACILITY_TYPE_LABELS[report.facilityType] || report.facilityType;

  return (
    <div className="map-popup">
      <div className="map-popup-name">{report.facilityName}</div>

      {/* Condition badge on its own line for visibility */}
      <div className="map-popup-badge-row">
        <ConditionBadge condition={report.conditionStatus} />
      </div>

      <div className="map-popup-meta">{facilityTypeLabel}</div>
      <div className="map-popup-meta">
        Submitted by {report.submittedBy?.displayName || "Unknown"}
      </div>
      <div className="map-popup-meta">{formatReportDate(report.createdAt)}</div>

      {/* Show the field agent's notes if they wrote any */}
      {report.description && (
        <div className="map-popup-description">
          {/* Truncate very long descriptions in the popup */}
          {report.description.length > 120
            ? report.description.slice(0, 120) + "…"
            : report.description}
        </div>
      )}

      {/* Show GPS accuracy if available */}
      {report.location?.accuracy && (
        <div className="map-popup-accuracy">
          GPS accuracy: ±{report.location.accuracy}m
        </div>
      )}
    </div>
  );
}

// --- SECTION: MapLegend Sub-Component ---

// Overlay panel in the bottom-left corner of the map.
// Shows the condition color key and report count stats.
function MapLegend({ locatedCount, unlocatedCount }) {
  const legendItems = [
    { color: CONDITION_MARKER_COLORS.good,     label: "Good" },
    { color: CONDITION_MARKER_COLORS.fair,     label: "Fair" },
    { color: CONDITION_MARKER_COLORS.poor,     label: "Poor" },
    { color: CONDITION_MARKER_COLORS.critical, label: "Critical" },
  ];

  return (
    <div className="map-legend-overlay">
      <p className="map-legend-title">Condition</p>
      {legendItems.map((item) => (
        <div key={item.label} className="map-legend-row">
          <span
            className="map-legend-dot"
            style={{ background: item.color }}
          />
          <span className="map-legend-label">{item.label}</span>
        </div>
      ))}

      {/* Divider between legend and stats */}
      <div className="map-legend-divider" />

      <div className="map-legend-stat">
        {locatedCount} on map
      </div>
      {unlocatedCount > 0 && (
        <div className="map-legend-stat muted">
          {unlocatedCount} without GPS
        </div>
      )}
    </div>
  );
}

// --- SECTION: Main MapPage Component ---

function MapPage() {
  const { reports, isLoading, error } = useReports(100);

  // Split reports into those with and without GPS coordinates
  const locatedReports   = reports.filter(
    (r) => r.location && r.location.latitude && r.location.longitude
  );
  const unlocatedReports = reports.filter(
    (r) => !r.location || !r.location.latitude
  );

  return (
    <div className="map-page">
      <Navbar />

      {/* --- SECTION: Loading / Error States --- */}

      {isLoading && (
        <div className="map-status-bar">Loading facility data...</div>
      )}

      {error && (
        <div className="map-status-bar error">{error}</div>
      )}

      {/* --- SECTION: Map --- */}

      {/* map-wrapper fills all remaining height below the navbar */}
      <div className="map-wrapper">

        <MapContainer
          center={NORTHERN_GHANA_CENTER}
          zoom={INITIAL_ZOOM}
          style={{ height: "100%", width: "100%" }}
          // scrollWheelZoom is enabled by default — lets users zoom with the mouse wheel
        >
          {/* OpenStreetMap tile layer — free, no API key needed */}
          {/* Attribution is required by OpenStreetMap's terms of service */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* --- SECTION: Report Markers --- */}

          {/* One CircleMarker per report that has GPS coordinates */}
          {locatedReports.map((report) => {
            const markerColor = CONDITION_MARKER_COLORS[report.conditionStatus] || "#9e9e9e";

            return (
              <CircleMarker
                key={report.id}
                center={[report.location.latitude, report.location.longitude]}
                radius={11}            // marker size in pixels
                pathOptions={{
                  fillColor:   markerColor,
                  fillOpacity: 0.9,
                  color:       "white", // white border makes markers visible on any map tile
                  weight:      2,       // border thickness in pixels
                }}
              >
                <Popup maxWidth={260}>
                  <MarkerPopup report={report} />
                </Popup>
              </CircleMarker>
            );
          })}

        </MapContainer>

        {/* Legend overlay — positioned over the map using CSS absolute positioning */}
        <MapLegend
          locatedCount={locatedReports.length}
          unlocatedCount={unlocatedReports.length}
        />

        {/* Show a message when there are no reports with GPS yet */}
        {!isLoading && locatedReports.length === 0 && (
          <div className="map-empty-overlay">
            <div className="map-empty-card">
              <p className="map-empty-icon">📍</p>
              <p className="map-empty-title">No located facilities yet</p>
              <p className="map-empty-text">
                Submit a report with GPS enabled to see facilities appear on the map.
                {unlocatedReports.length > 0 && (
                  <> {unlocatedReports.length} report{unlocatedReports.length !== 1 ? "s" : ""} exist without location data.</>
                )}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default MapPage;
