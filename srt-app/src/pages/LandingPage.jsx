// LandingPage.jsx
// The public-facing homepage of the Sanitation Resilience Tracker.
// Visible to everyone — logged-in users see "Go to Dashboard" CTAs,
// logged-out users see "Get Started" and "Sign In" CTAs.
//
// Sections:
//   1. Landing Navbar   — app name + auth/dashboard links
//   2. Hero             — headline, description, CTA buttons
//   3. Live Impact Stats — total reports, facilities monitored, field agents (from Firestore)
//   4. Features         — 3 feature highlight cards
//   5. Footer           — hackathon attribution
//
// Route: / (public — no auth required)

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useReports } from "../hooks/useReports";
import Footer from "../components/Footer";

// --- SECTION: Feature Cards Data ---

// The three key capabilities shown in the features section
const FEATURES = [
  {
    icon: "📡",
    title: "Real-Time Monitoring",
    description:
      "Live updates the moment a field agent submits a report. No delays, no manual syncing — data flows directly from the field to decision-makers.",
  },
  {
    icon: "📍",
    title: "GPS-Enabled Reports",
    description:
      "Every report can capture the exact GPS coordinates of a facility. Plot issues on a live map and respond faster to communities in need.",
  },
  {
    icon: "📊",
    title: "Data-Driven Decisions",
    description:
      "Condition analytics help WASH program managers prioritize repairs, track improvement over time, and report progress to donors.",
  },
];

// --- SECTION: Landing Navbar ---

// Separate from the main app Navbar — shows login/register links for guests,
// and a "Dashboard" link for users who are already logged in.
function LandingNavbar({ currentUser }) {
  return (
    <nav className="landing-navbar">
      <div className="landing-navbar-inner">
        {/* App brand name */}
        <Link to="/" className="landing-brand">SRT</Link>

        {/* Right side — adapts based on login state */}
        <div className="landing-nav-links">
          {currentUser ? (
            // Logged-in users go straight to the dashboard
            <Link to="/dashboard" className="landing-nav-btn primary">Dashboard</Link>
          ) : (
            <>
              <Link to="/login"    className="landing-nav-btn ghost">Sign In</Link>
              <Link to="/register" className="landing-nav-btn primary">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// --- SECTION: Impact Stat Card ---

// Displays a single live metric (number + label) in the hero section
function ImpactStatCard({ value, label, isLoading }) {
  return (
    <div className="impact-stat-card">
      <div className="impact-stat-value">
        {isLoading ? (
          <span className="skeleton skeleton-stat-value" />
        ) : (
          value
        )}
      </div>
      <div className="impact-stat-label">{label}</div>
    </div>
  );
}

// --- SECTION: Main LandingPage Component ---

function LandingPage() {
  const { currentUser } = useAuth();
  const { reports, isLoading } = useReports(100);

  // --- SECTION: Compute Live Impact Metrics ---

  // Total reports ever submitted
  const totalReports = reports.length;

  // Count unique facility names to estimate facilities being monitored
  const uniqueFacilityNames = new Set(reports.map((r) => r.facilityName?.toLowerCase().trim()));
  const facilitiesMonitored = uniqueFacilityNames.size;

  // Count unique field agents (unique submitter UIDs)
  const uniqueAgentUids = new Set(reports.map((r) => r.submittedBy?.uid).filter(Boolean));
  const fieldAgentsActive = uniqueAgentUids.size;

  return (
    <div className="landing-page page-fade-in">

      {/* --- SECTION: Navbar --- */}
      <LandingNavbar currentUser={currentUser} />

      {/* --- SECTION: Hero --- */}
      <section className="landing-hero">
        <div className="hero-inner">

          <div className="hero-badge">UNICEF StartUp Lab Hackathon 2026</div>

          <h1 className="hero-headline">
            Protecting Sanitation<br />
            in <span className="hero-headline-accent">Northern Ghana</span>
          </h1>

          <p className="hero-description">
            SRT is a climate-resilient sanitation monitoring platform that empowers
            field agents to report facility conditions in real time — helping
            governments and WASH programs respond faster to communities in need.
          </p>

          {/* CTA buttons — adapt to login state */}
          <div className="hero-cta-row">
            {currentUser ? (
              <>
                <Link to="/report"    className="cta-btn primary">+ Submit Report</Link>
                <Link to="/dashboard" className="cta-btn outline">View Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="cta-btn primary">Get Started Free</Link>
                <Link to="/map"      className="cta-btn outline">View Live Map</Link>
              </>
            )}
          </div>

          {/* --- SECTION: Live Impact Stats --- */}
          <div className="impact-stats-row">
            <ImpactStatCard
              value={totalReports}
              label="Reports Submitted"
              isLoading={isLoading}
            />
            <ImpactStatCard
              value={facilitiesMonitored}
              label="Facilities Monitored"
              isLoading={isLoading}
            />
            <ImpactStatCard
              value={fieldAgentsActive}
              label="Field Agents Active"
              isLoading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* --- SECTION: Features --- */}
      <section className="landing-features">
        <div className="features-inner">
          <h2 className="features-title">Built for the Field</h2>
          <p className="features-subtitle">
            Designed for low-connectivity areas where field agents need tools
            that work on any device, even offline.
          </p>

          <div className="features-grid">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION: Final CTA Banner --- */}
      <section className="landing-cta-banner">
        <div className="cta-banner-inner">
          <h2 className="cta-banner-title">Ready to track sanitation conditions?</h2>
          <p className="cta-banner-subtitle">
            Join field agents across Northern Ghana who are using SRT to monitor
            and improve sanitation infrastructure.
          </p>
          <div className="hero-cta-row">
            {currentUser ? (
              <Link to="/dashboard" className="cta-btn primary large">Go to Dashboard</Link>
            ) : (
              <Link to="/register" className="cta-btn primary large">Create Free Account</Link>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default LandingPage;
