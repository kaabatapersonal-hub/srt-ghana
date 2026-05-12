// ReportPage.jsx
// The report submission page for field agents.
// Agents fill in the facility name, type, condition, a description, and optionally
// capture their GPS location. The report is saved to Firestore /reports collection.
//
// Condition is selected via large color-coded tap cards (mobile-friendly).
// GPS is captured on demand using the browser's Geolocation API.
//
// Route: /report (protected — requires login)

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { submitReport } from "../services/reportService";
import Navbar from "../components/Navbar";

// --- SECTION: Form Option Constants ---

// The types of sanitation facilities field agents may inspect
const FACILITY_TYPES = [
  { value: "borehole",       label: "Borehole / Hand Pump" },
  { value: "latrine",        label: "Latrine / Toilet Block" },
  { value: "handwashing",    label: "Handwashing Station" },
  { value: "sewage",         label: "Sewage / Drainage System" },
  { value: "water_treatment",label: "Water Treatment Facility" },
  { value: "solid_waste",    label: "Solid Waste Disposal Site" },
];

// The four condition levels, each with a color class and description for the tap cards
const CONDITION_OPTIONS = [
  {
    value: "good",
    label: "Good",
    colorClass: "good",
    description: "Fully functional, no issues",
  },
  {
    value: "fair",
    label: "Fair",
    colorClass: "fair",
    description: "Working but needs minor repair",
  },
  {
    value: "poor",
    label: "Poor",
    colorClass: "poor",
    description: "Partially functional, urgent repair needed",
  },
  {
    value: "critical",
    label: "Critical",
    colorClass: "critical",
    description: "Non-functional or poses health risk",
  },
];

// --- SECTION: Component ---

function ReportPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // --- SECTION: Form State ---

  const [facilityName,    setFacilityName]    = useState("");
  const [facilityType,    setFacilityType]    = useState("");
  const [conditionStatus, setConditionStatus] = useState(""); // "good"|"fair"|"poor"|"critical"
  const [description,     setDescription]     = useState("");

  // GPS state
  const [gpsLocation,     setGpsLocation]     = useState(null);  // { latitude, longitude, accuracy }
  const [isCapturingGps,  setIsCapturingGps]  = useState(false); // true while browser is locating
  const [gpsError,        setGpsError]        = useState("");

  // Submission state
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [submitError,     setSubmitError]     = useState("");
  const [submitSuccess,   setSubmitSuccess]   = useState(false); // true shows the success screen
  const [submittedDocId,  setSubmittedDocId]  = useState("");    // Firestore doc ID after submit

  // --- SECTION: GPS Capture ---

  // Asks the browser for the device's current GPS coordinates.
  // On mobile, this triggers the "Allow location access" permission prompt.
  function handleCaptureGps() {
    if (!navigator.geolocation) {
      setGpsError("Your device does not support GPS location.");
      return;
    }

    setIsCapturingGps(true);
    setGpsError("");
    setGpsLocation(null);

    navigator.geolocation.getCurrentPosition(
      // Success callback — browser found the location
      (position) => {
        setGpsLocation({
          latitude:  parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6)),
          accuracy:  Math.round(position.coords.accuracy), // accuracy in metres
        });
        setIsCapturingGps(false);
      },
      // Error callback — user denied permission or timeout
      (error) => {
        const gpsErrorMessages = {
          1: "Location access denied. Please allow location permission and try again.",
          2: "Unable to determine location. Make sure GPS is enabled on your device.",
          3: "Location request timed out. Please try again.",
        };
        setGpsError(gpsErrorMessages[error.code] || "Could not get location. Please try again.");
        setIsCapturingGps(false);
      },
      {
        enableHighAccuracy: true, // uses GPS hardware rather than wifi/cell tower estimate
        timeout: 15000,           // 15 seconds before giving up
        maximumAge: 0,            // always get a fresh reading, never use a cached position
      }
    );
  }

  // --- SECTION: Form Validation ---

  // Returns an error string if something is missing, or empty string if valid
  function validateForm() {
    if (!facilityName.trim())    return "Please enter the facility name.";
    if (!facilityType)           return "Please select a facility type.";
    if (!conditionStatus)        return "Please select the facility condition.";
    if (description.trim().length < 20)
      return "Please write a description of at least 20 characters.";
    return "";
  }

  // --- SECTION: Handle Form Submit ---

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData = {
        facilityName:    facilityName.trim(),
        facilityType,
        conditionStatus,
        description:     description.trim(),
        location:        gpsLocation, // null if the agent skipped GPS
      };

      const newReportId = await submitReport(reportData, currentUser);
      setSubmittedDocId(newReportId);
      setSubmitSuccess(true); // show the success screen
    } catch (error) {
      console.error("Report submission failed:", error);
      setSubmitError("Failed to submit report. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- SECTION: Reset for Another Report ---

  // Clears all fields so the agent can immediately submit another report
  function handleSubmitAnother() {
    setFacilityName("");
    setFacilityType("");
    setConditionStatus("");
    setDescription("");
    setGpsLocation(null);
    setGpsError("");
    setSubmitError("");
    setSubmitSuccess(false);
    setSubmittedDocId("");
  }

  // --- SECTION: Success Screen ---

  if (submitSuccess) {
    return (
      <div className="report-page">
        <Navbar />
        <div className="report-content">
          <div className="report-success-card">
            <div className="report-success-icon">✅</div>
            <h2 className="report-success-title">Report Submitted</h2>
            <p className="report-success-text">
              Your report for <strong>{facilityName}</strong> has been saved and is pending
              admin review. Reference ID: <strong>{submittedDocId}</strong>
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button className="btn-submit-another" onClick={handleSubmitAnother}>
                Submit Another Report
              </button>
              <button
                className="btn-submit-another"
                style={{ background: "#1565c0" }}
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- SECTION: Report Form ---

  return (
    <div className="report-page">
      <Navbar />

      <div className="report-content">
        <h1 className="report-page-title">Submit Facility Report</h1>
        <p className="report-page-subtitle">
          Record the current condition of a sanitation facility in Northern Ghana.
        </p>

        {/* Show submission error above the form */}
        {submitError && (
          <div className="error-message" role="alert">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* --- Facility Details Section --- */}
          <div className="form-section">
            <p className="form-section-title">Facility Details</p>

            <div className="form-group">
              <label className="form-label" htmlFor="facility-name">
                Facility Name / ID
              </label>
              <input
                id="facility-name"
                type="text"
                className="form-input"
                placeholder="e.g. Bolgatanga Borehole 3, Tamale School Latrine Block A"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="facility-type">
                Facility Type
              </label>
              <select
                id="facility-type"
                className="form-input"
                value={facilityType}
                onChange={(e) => setFacilityType(e.target.value)}
                required
              >
                <option value="">— Select a type —</option>
                {FACILITY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* --- Condition Section --- */}
          <div className="form-section">
            <p className="form-section-title">Condition Assessment</p>

            {/* Large tap-friendly cards — easier than small radio buttons on mobile */}
            <div className="condition-grid">
              {CONDITION_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`condition-card ${option.colorClass} ${
                    conditionStatus === option.value ? "selected" : ""
                  }`}
                  onClick={() => setConditionStatus(option.value)}
                  role="radio"
                  aria-checked={conditionStatus === option.value}
                  tabIndex={0}
                  // Allow keyboard selection with Enter or Space
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setConditionStatus(option.value);
                  }}
                >
                  <div className="condition-card-label">{option.label}</div>
                  <div className="condition-card-desc">{option.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* --- Observation Notes Section --- */}
          <div className="form-section">
            <p className="form-section-title">Observation Notes</p>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="report-description">
                Describe what you observed
              </label>
              <textarea
                id="report-description"
                className="form-textarea"
                placeholder="Describe the condition in detail — e.g. pump handle broken, water not flowing, latrine pit nearly full, hygiene materials missing..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              {/* Live character count to guide agents toward enough detail */}
              <p className={`char-count ${description.trim().length < 20 && description.length > 0 ? "too-short" : ""}`}>
                {description.trim().length} / 20 minimum characters
              </p>
            </div>
          </div>

          {/* --- GPS Location Section --- */}
          <div className="form-section">
            <p className="form-section-title">GPS Location (Optional)</p>

            <button
              type="button"
              className="gps-capture-btn"
              onClick={handleCaptureGps}
              disabled={isCapturingGps}
            >
              {isCapturingGps ? "📡 Locating..." : "📍 Capture My Location"}
            </button>

            <p className="gps-note">
              Tap the button to record the facility's GPS coordinates from your device.
            </p>

            {/* Show coordinates once captured */}
            {gpsLocation && (
              <div className="gps-result">
                <strong>Location captured</strong><br />
                Latitude: {gpsLocation.latitude}<br />
                Longitude: {gpsLocation.longitude}<br />
                Accuracy: ±{gpsLocation.accuracy} metres
              </div>
            )}

            {/* Show error if GPS failed or permission was denied */}
            {gpsError && (
              <div className="gps-error">{gpsError}</div>
            )}
          </div>

          {/* --- Submit --- */}
          <div className="form-submit-row">
            <button
              type="submit"
              className="btn-submit-report"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting Report..." : "Submit Report"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default ReportPage;
