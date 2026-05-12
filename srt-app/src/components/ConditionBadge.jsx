import React from "react";

const CONDITION_CONFIG = {
  good:     { label: "Good",     cssClass: "badge-good"     },
  fair:     { label: "Fair",     cssClass: "badge-fair"     },
  poor:     { label: "Poor",     cssClass: "badge-poor"     },
  critical: { label: "Critical", cssClass: "badge-critical" },
};

function ConditionBadge({ condition }) {
  const config = CONDITION_CONFIG[condition] || { label: condition || "Unknown", cssClass: "badge-unknown" };
  return (
    <span className={`condition-badge ${config.cssClass}`}>
      {config.label}
    </span>
  );
}

export default ConditionBadge;
