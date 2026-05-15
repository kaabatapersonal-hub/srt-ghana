import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useReports } from "../hooks/useReports";
import Footer from "../components/Footer";

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

function LandingNavbar({ currentUser }) {
  return (
    <nav className="landing-navbar">
      <div className="landing-navbar-inner">
        <Link to="/" className="landing-brand">SRT</Link>
        <div className="landing-nav-links">
          {currentUser ? (
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

function ImpactStatCard({ value, label, isLoading }) {
  return (
    <div className="impact-stat-card">
      <div className="impact-stat-value">
        {isLoading ? <span className="skeleton skeleton-stat-value" /> : value}
      </div>
      <div className="impact-stat-label">{label}</div>
    </div>
  );
}

function LandingPage() {
  const { currentUser } = useAuth();
  const { reports, isLoading } = useReports(100);

  const totalReports = reports.length;
  const facilitiesMonitored = new Set(reports.map(r => r.facilityName?.toLowerCase().trim())).size;
  const fieldAgentsActive = new Set(reports.map(r => r.submittedBy?.uid).filter(Boolean)).size;

  return (
    <div className="landing-page page-fade-in">
      <LandingNavbar currentUser={currentUser} />

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

          <div className="impact-stats-row">
            <ImpactStatCard value={totalReports}        label="Reports Submitted"   isLoading={isLoading} />
            <ImpactStatCard value={facilitiesMonitored} label="Facilities Monitored" isLoading={isLoading} />
            <ImpactStatCard value={fieldAgentsActive}   label="Field Agents Active"  isLoading={isLoading} />
          </div>
        </div>
      </section>

      <section className="landing-features">
        <div className="features-inner">
          <h2 className="features-title">Built for the Field</h2>
          <p className="features-subtitle">
            Designed for low-connectivity areas where field agents need tools
            that work on any device, even offline.
          </p>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-description">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-ussd-section">
        <div className="ussd-section-inner">
          <div className="ussd-section-text">
            <div className="ussd-section-badge">USSD Support</div>
            <h2 className="ussd-section-title">No Smartphone?<br />No Problem.</h2>
            <p className="ussd-section-desc">
              SRT works on <strong>any basic mobile phone</strong> via USSD — no internet,
              no data plan, no app required. Field agents in the most remote areas can
              submit reports directly from the field using just a phone call.
            </p>
            <div className="ussd-code-block">*713#</div>
            <p className="ussd-code-label">Dial from any phone to start reporting</p>
            <Link to="/ussd" className="cta-btn primary" style={{ display: "inline-block", marginTop: "1.25rem" }}>
              Try the Simulator →
            </Link>
          </div>

          <div className="ussd-flow-demo">
            <div className="ussd-demo-phone">
              <div className="ussd-demo-screen">
                <div className="ussd-demo-row">
                  <span className="ussd-demo-tag">CON</span>
                  <span>Welcome to SRT<br />1. Report Facility<br />2. Check Status<br />3. Emergency Alert</span>
                </div>
                <div className="ussd-demo-arrow">↓ &nbsp;Press 1</div>
                <div className="ussd-demo-row">
                  <span className="ussd-demo-tag">CON</span>
                  <span>Enter facility name:</span>
                </div>
                <div className="ussd-demo-arrow">↓ &nbsp;Type name, Send</div>
                <div className="ussd-demo-row">
                  <span className="ussd-demo-tag">CON</span>
                  <span>Select condition:<br />1. Good &nbsp;2. Fair<br />3. Poor &nbsp;4. Critical</span>
                </div>
                <div className="ussd-demo-arrow">↓ &nbsp;Press 3</div>
                <div className="ussd-demo-row end">
                  <span className="ussd-demo-tag end">END</span>
                  <span>Report submitted!<br />Ref: #SRT-A1B2C<br />Thank you.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
