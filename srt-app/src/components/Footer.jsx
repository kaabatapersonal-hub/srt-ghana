// Footer.jsx
// Global footer rendered at the bottom of the Landing page and all main app pages.
// Shows the project name, hackathon attribution, and current year.

import React from "react";

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <span className="footer-brand">SRT</span>
        <span className="footer-separator">·</span>
        <span className="footer-text">
          Built for the UNICEF StartUp Lab Hackathon 2026
        </span>
        <span className="footer-separator">·</span>
        <span className="footer-text">Northern Ghana</span>
      </div>
    </footer>
  );
}

export default Footer;
