// ConditionBadge.jsx
// A small colored badge that displays a facility's condition status.
// Used in the dashboard report list, admin panel, and map popups.
//
// Props:
//   condition (string) — "good" | "fair" | "poor" | "critical"
//
// Usage:
//   <ConditionBadge condition="poor" />

import React from "react";

// Maps each condition value to its display label and CSS class
const CONDITION_CONFIG = {
  good:     { label: "Good",     cssClass: "badge-good" },
  fair:     { label: "Fair",     cssClass: "badge-fair" },
  poor:     { label: "Poor",     cssClass: "badge-poor" },
  critical: { label: "Critical", cssClass: "badge-critical" },
};

function ConditionBadge({ condition }) {
  // Use the config for the given condition, or fall back to a neutral style for unknown values
  const config = CONDITION_CONFIG[condition] || { label: condition || "Unknown", cssClass: "badge-unknown" };

  return (
    <span className={`condition-badge ${config.cssClass}`}>
      {config.label}
    </span>
  );
}

export default ConditionBadge;
