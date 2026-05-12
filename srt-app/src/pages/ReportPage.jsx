import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { submitReport } from "../services/reportService";
import { addToOfflineQueue } from "../hooks/useOfflineSync";
import Navbar from "../components/Navbar";
import StepIndicator from "../components/StepIndicator";
import ConditionBadge from "../components/ConditionBadge";
import Footer from "../components/Footer";

const STEPS = [
  { id: 1, label: "Facility Details" },
  { id: 2, label: "Condition" },
  { id: 3, label: "Notes & Location" },
  { id: 4, label: "Review & Submit" },
];

const FACILITY_TYPES = [
  { value: "borehole",        label: "Borehole / Hand Pump" },
  { value: "latrine",         label: "Latrine / Toilet Block" },
  { value: "handwashing",     label: "Handwashing Station" },
  { value: "sewage",          label: "Sewage / Drainage System" },
  { value: "water_treatment", label: "Water Treatment Facility" },
  { value: "solid_waste",     label: "Solid Waste Disposal Site" },
];

const CONDITION_OPTIONS = [
  { value: "good",     label: "Good",     colorClass: "good",     description: "Fully functional, no issues" },
  { value: "fair",     label: "Fair",     colorClass: "fair",     description: "Working but needs minor repair" },
  { value: "poor",     label: "Poor",     colorClass: "poor",     description: "Partially functional, urgent repair needed" },
  { value: "critical", label: "Critical", colorClass: "critical", description: "Non-functional or poses health risk" },
];

const FACILITY_TYPE_LABELS = {
  borehole:        "Borehole / Hand Pump",
  latrine:         "Latrine / Toilet Block",
  handwashing:     "Handwashing Station",
  sewage:          "Sewage / Drainage System",
  water_treatment: "Water Treatment Facility",
  solid_waste:     "Solid Waste Disposal Site",
};

function ReportPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [currentStep,     setCurrentStep]     = useState(1);
  const [facilityName,    setFacilityName]    = useState("");
  const [facilityType,    setFacilityType]    = useState("");
  const [conditionStatus, setConditionStatus] = useState("");
  const [description,     setDescription]     = useState("");
  const [gpsLocation,     setGpsLocation]     = useState(null);
  const [isCapturingGps,  setIsCapturingGps]  = useState(false);
  const [gpsError,        setGpsError]        = useState("");
  const [stepError,       setStepError]       = useState("");
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [submitSuccess,   setSubmitSuccess]   = useState(false);
  const [submittedDocId,  setSubmittedDocId]  = useState("");
  const [savedOffline,    setSavedOffline]    = useState(false);

  function validateStep() {
    switch (currentStep) {
      case 1:
        if (!facilityName.trim()) return "Please enter the facility name.";
        if (!facilityType)        return "Please select a facility type.";
        return "";
      case 2:
        if (!conditionStatus) return "Please select a condition level.";
        return "";
      case 3:
        if (description.trim().length < 20)
          return "Please write a description of at least 20 characters.";
        return "";
      default:
        return "";
    }
  }

  function goToNextStep() {
    const err = validateStep();
    if (err) { setStepError(err); return; }
    setStepError("");
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  }

  function goToPrevStep() {
    setStepError("");
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }

  function handleCaptureGps() {
    if (!navigator.geolocation) {
      setGpsError("Your device does not support GPS location.");
      return;
    }
    setIsCapturingGps(true);
    setGpsError("");
    setGpsLocation(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          latitude:  parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
          accuracy:  Math.round(pos.coords.accuracy),
        });
        setIsCapturingGps(false);
      },
      (err) => {
        // Browser passes a numeric code — map it to something readable
        const msgs = {
          1: "Location access denied. Please allow permission and try again.",
          2: "Unable to determine location. Make sure GPS is enabled.",
          3: "Location request timed out. Please try again.",
        };
        setGpsError(msgs[err.code] || "Could not get location.");
        setIsCapturingGps(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  async function handleSubmit() {
    const reportData = {
      facilityName:    facilityName.trim(),
      facilityType,
      conditionStatus,
      description:     description.trim(),
      location:        gpsLocation,
    };

    if (!navigator.onLine) {
      addToOfflineQueue(reportData, {
        uid:         currentUser.uid,
        displayName: currentUser.displayName || currentUser.email,
        email:       currentUser.email,
      });
      setSavedOffline(true);
      setSubmitSuccess(true);
      return;
    }

    setIsSubmitting(true);
    setStepError("");
    try {
      const newId = await submitReport(reportData, currentUser);
      setSubmittedDocId(newId);
      setSubmitSuccess(true);
    } catch (err) {
      console.error("Submit failed:", err);
      setStepError("Submission failed. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmitAnother() {
    setCurrentStep(1);
    setFacilityName("");
    setFacilityType("");
    setConditionStatus("");
    setDescription("");
    setGpsLocation(null);
    setGpsError("");
    setStepError("");
    setSubmitSuccess(false);
    setSubmittedDocId("");
    setSavedOffline(false);
  }

  if (submitSuccess) {
    return (
      <div className="report-page page-fade-in">
        <Navbar />
        <div className="report-content">
          <div className="report-success-card">
            <div className="success-icon-circle">
              <span className="success-check">{savedOffline ? "📶" : "✓"}</span>
            </div>
            <h2 className="report-success-title">
              {savedOffline ? "Saved Locally" : "Report Submitted!"}
            </h2>
            <p className="report-success-text">
              {savedOffline ? (
                <>
                  No connection — your report for <strong>{facilityName}</strong> will be
                  saved and submitted when you&apos;re back online.
                </>
              ) : (
                <>
                  Your report for <strong>{facilityName}</strong> has been saved
                  and is pending admin review.
                  <br />
                  Reference ID: <strong style={{ fontFamily: "monospace" }}>{submittedDocId}</strong>
                </>
              )}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn-submit-another" onClick={handleSubmitAnother}>
                Submit Another
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="report-page page-fade-in">
      <Navbar />

      <div className="report-content">
        <h1 className="report-page-title">Submit Facility Report</h1>
        <p className="report-page-subtitle">
          Record the current condition of a sanitation facility in Northern Ghana.
        </p>

        <StepIndicator steps={STEPS} currentStep={currentStep} />

        {stepError && (
          <div className="error-message" role="alert" style={{ marginBottom: "1rem" }}>
            {stepError}
          </div>
        )}

        {/* step 1 */}
        {currentStep === 1 && (
          <div className="form-section page-fade-in">
            <p className="form-section-title">Step 1 — Facility Details</p>

            <div className="form-group">
              <label className="form-label" htmlFor="facility-name">Facility Name / ID</label>
              <input
                id="facility-name"
                type="text"
                className="form-input"
                placeholder="e.g. Bolgatanga Borehole 3"
                value={facilityName}
                onChange={e => setFacilityName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="facility-type">Facility Type</label>
              <select
                id="facility-type"
                className="form-input"
                value={facilityType}
                onChange={e => setFacilityType(e.target.value)}
              >
                <option value="">— Select a type —</option>
                {FACILITY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* step 2 */}
        {currentStep === 2 && (
          <div className="form-section page-fade-in">
            <p className="form-section-title">Step 2 — Condition Assessment</p>
            <div className="condition-grid">
              {CONDITION_OPTIONS.map(opt => (
                <div
                  key={opt.value}
                  className={`condition-card ${opt.colorClass} ${conditionStatus === opt.value ? "selected" : ""}`}
                  onClick={() => setConditionStatus(opt.value)}
                  role="radio"
                  aria-checked={conditionStatus === opt.value}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setConditionStatus(opt.value); }}
                >
                  <div className="condition-card-label">{opt.label}</div>
                  <div className="condition-card-desc">{opt.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* step 3 */}
        {currentStep === 3 && (
          <div className="form-section page-fade-in">
            <p className="form-section-title">Step 3 — Notes &amp; Location</p>

            <div className="form-group">
              <label className="form-label" htmlFor="report-description">Observation Notes</label>
              <textarea
                id="report-description"
                className="form-textarea"
                placeholder="Describe what you observed — e.g. pump handle broken, water not flowing, pit nearly full..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <p className={`char-count ${description.trim().length < 20 && description.length > 0 ? "too-short" : ""}`}>
                {description.trim().length} / 20 minimum characters
              </p>
            </div>

            <div style={{ marginTop: "0.5rem" }}>
              <p className="form-label">GPS Location (Optional)</p>
              <button
                type="button"
                className="gps-capture-btn"
                onClick={handleCaptureGps}
                disabled={isCapturingGps}
              >
                {isCapturingGps ? "📡 Locating..." : "📍 Capture My Location"}
              </button>
              <p className="gps-note">Tap to record this facility's GPS coordinates.</p>
              {gpsLocation && (
                <div className="gps-result">
                  <strong>Location captured</strong><br />
                  Lat: {gpsLocation.latitude} · Lng: {gpsLocation.longitude}<br />
                  Accuracy: ±{gpsLocation.accuracy}m
                </div>
              )}
              {gpsError && <div className="gps-error">{gpsError}</div>}
            </div>
          </div>
        )}

        {/* step 4 — review before submitting */}
        {currentStep === 4 && (
          <div className="form-section page-fade-in">
            <p className="form-section-title">Step 4 — Review &amp; Submit</p>
            <p style={{ fontSize: "0.85rem", color: "#757575", marginBottom: "1rem" }}>
              Check your entries before submitting.
            </p>

            <div className="review-grid">
              <div className="review-item">
                <span className="review-label">Facility Name</span>
                <span className="review-value">{facilityName}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Facility Type</span>
                <span className="review-value">{FACILITY_TYPE_LABELS[facilityType]}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Condition</span>
                <ConditionBadge condition={conditionStatus} />
              </div>
              <div className="review-item">
                <span className="review-label">Description</span>
                <span className="review-value">{description}</span>
              </div>
              <div className="review-item">
                <span className="review-label">GPS Location</span>
                <span className="review-value">
                  {gpsLocation
                    ? `${gpsLocation.latitude}, ${gpsLocation.longitude} (±${gpsLocation.accuracy}m)`
                    : "Not captured"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="step-nav-row">
          {currentStep > 1 && (
            <button
              type="button"
              className="step-nav-btn back"
              onClick={goToPrevStep}
              disabled={isSubmitting}
            >
              ← Back
            </button>
          )}

          {currentStep < STEPS.length ? (
            <button type="button" className="step-nav-btn next" onClick={goToNextStep}>
              Next →
            </button>
          ) : (
            <button
              type="button"
              className="btn-submit-report"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ReportPage;
