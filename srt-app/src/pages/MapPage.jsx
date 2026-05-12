import React, { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from "react-leaflet";
import { useReports } from "../hooks/useReports";
import Navbar from "../components/Navbar";
import ConditionBadge from "../components/ConditionBadge";

// Tamale is the capital of Northern Ghana — better default center than a generic midpoint
const NORTHERN_GHANA_CENTER = [9.4034, -0.8424];
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

const FILTER_OPTIONS = [
  { value: "all",      label: "All" },
  { value: "good",     label: "Good" },
  { value: "fair",     label: "Fair" },
  { value: "poor",     label: "Poor" },
  { value: "critical", label: "Critical" },
];

// Static GeoJSON polygons for known flood-prone districts in Northern Ghana.
// Coordinates are approximate district boundaries in [longitude, latitude] GeoJSON order.
// Sources: NADMO flood reports, OCHA Northern Ghana flood assessments.
const FLOOD_ZONES_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Tolon District",
        risk: "High",
        note: "White Volta River floodplain — regularly inundated during peak rains",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-1.28, 9.18], [-0.92, 9.18], [-0.90, 9.35],
          [-0.93, 9.50], [-1.10, 9.54], [-1.28, 9.48],
          [-1.28, 9.18],
        ]],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Kumbungu District",
        risk: "High",
        note: "Low-lying terrain between White Volta tributaries",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-1.18, 9.54], [-0.93, 9.50], [-0.88, 9.62],
          [-0.90, 9.85], [-1.15, 9.85], [-1.22, 9.68],
          [-1.18, 9.54],
        ]],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Savelugu District",
        risk: "Moderate–High",
        note: "North of Tamale — seasonal flooding from overland flow",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-0.93, 9.50], [-0.65, 9.50], [-0.60, 9.63],
          [-0.65, 9.88], [-0.88, 9.90], [-0.93, 9.72],
          [-0.90, 9.62], [-0.93, 9.50],
        ]],
      },
    },
  ],
};

const FLOOD_ZONE_STYLE = {
  fillColor:   "#e53935",
  fillOpacity: 0.22,
  color:       "#b71c1c",
  weight:      2,
  dashArray:   "6 4",
};

const formatDate = (ts) => {
  if (!ts || !ts.toDate) return "Just now";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(ts.toDate());
};

function MarkerPopup({ report }) {
  const typeLabel = FACILITY_TYPE_LABELS[report.facilityType] || report.facilityType;
  return (
    <div className="map-popup">
      <div className="map-popup-name">{report.facilityName}</div>
      <div className="map-popup-badge-row">
        <ConditionBadge condition={report.conditionStatus} />
      </div>
      <div className="map-popup-meta">{typeLabel}</div>
      <div className="map-popup-meta">By {report.submittedBy?.displayName || "Unknown"}</div>
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
          reports.map(report => (
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

function MapPage() {
  const { reports, isLoading, error } = useReports(100);
  const [activeFilter,   setActiveFilter]   = useState("all");
  const [showFloodZones, setShowFloodZones] = useState(false);

  const locatedReports = reports.filter(r => r.location?.latitude && r.location?.longitude);

  const filteredReports = activeFilter === "all"
    ? locatedReports
    : locatedReports.filter(r => r.conditionStatus === activeFilter);

  return (
    <div className="map-page page-fade-in">
      <Navbar />

      {isLoading && <div className="map-status-bar">Loading facility data...</div>}
      {error     && <div className="map-status-bar error">{error}</div>}

      <div className="map-filter-bar">
        {FILTER_OPTIONS.map(opt => {
          const count = opt.value === "all"
            ? locatedReports.length
            : locatedReports.filter(r => r.conditionStatus === opt.value).length;
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

        <div className="map-filter-divider" />

        <button
          className={`map-filter-btn map-flood-toggle ${showFloodZones ? "active" : ""}`}
          onClick={() => setShowFloodZones(prev => !prev)}
          title="Toggle flood-risk zone overlay for Northern Ghana districts"
        >
          🌊 Flood Risk
        </button>
      </div>

      <div className="map-page-body">
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

            {/* flood zones render below markers so orange circles stay on top */}
            {showFloodZones && (
              <GeoJSON
                key="flood-zones"
                data={FLOOD_ZONES_GEOJSON}
                style={FLOOD_ZONE_STYLE}
                onEachFeature={(feature, layer) => {
                  layer.bindTooltip(
                    `<strong>${feature.properties.name}</strong><br/>
                     Risk: ${feature.properties.risk}<br/>
                     <em>${feature.properties.note}</em>`,
                    { sticky: true, className: "flood-zone-tooltip" }
                  );
                }}
              />
            )}

            {filteredReports.map(report => {
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

          <MapLegend visibleCount={filteredReports.length} totalLocated={locatedReports.length} />

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

        <MapSidebar reports={filteredReports} />
      </div>
    </div>
  );
}

export default MapPage;
