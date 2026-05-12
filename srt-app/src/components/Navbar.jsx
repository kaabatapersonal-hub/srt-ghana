// Navbar.jsx
// Top navigation bar shown on all protected pages (Dashboard, Map, Report, Admin).
// Displays the app name, navigation links, the logged-in user's email, and a logout button.
// Admin users see an extra "Admin" link that regular users cannot see.
// Uses NavLink from React Router so the current page's link is automatically highlighted.

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/authService";

function Navbar() {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  // --- SECTION: Logout Handler ---

  // Signs out the user and redirects to the login page
  async function handleLogout() {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      // Logout rarely fails, but log it if it does
      console.error("Logout failed:", error);
    }
  }

  // --- SECTION: NavLink Active Class Helper ---

  // React Router's NavLink passes { isActive } to this function.
  // We return the right className so the active link gets highlighted.
  function getNavLinkClass({ isActive }) {
    return isActive ? "navbar-link active" : "navbar-link";
  }

  return (
    <nav className="navbar">

      {/* App name — links back to dashboard */}
      <NavLink to="/dashboard" className="navbar-brand">
        SRT
      </NavLink>

      {/* Right side: nav links + user info + logout */}
      <div className="navbar-right">

        {/* --- SECTION: Navigation Links --- */}
        <NavLink to="/dashboard" className={getNavLinkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/map" className={getNavLinkClass}>
          Map
        </NavLink>
        <NavLink to="/report" className={getNavLinkClass}>
          Report
        </NavLink>

        {/* Admin link — only rendered for users with the "admin" role */}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive ? "navbar-link admin-link active" : "navbar-link admin-link"
            }
          >
            Admin
          </NavLink>
        )}

        {/* Visual separator between nav links and user section */}
        <div className="navbar-divider" />

        {/* Show the logged-in user's email (or display name if available) */}
        <span className="navbar-user-email">
          {currentUser?.displayName || currentUser?.email}
        </span>

        {/* Logout button — calls handleLogout above */}
        <button className="navbar-logout-btn" onClick={handleLogout}>
          Logout
        </button>

      </div>
    </nav>
  );
}

export default Navbar;
