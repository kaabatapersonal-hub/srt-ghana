import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/authService";

function Navbar() {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navClass = ({ isActive }) => isActive ? "navbar-link active" : "navbar-link";

  return (
    <nav className="navbar">
      <NavLink to="/dashboard" className="navbar-brand">SRT</NavLink>

      <div className="navbar-right">
        <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
        <NavLink to="/map" className={navClass}>Map</NavLink>
        <NavLink to="/report" className={navClass}>Report</NavLink>

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

        <div className="navbar-divider" />
        <span className="navbar-user-email">
          {currentUser?.displayName || currentUser?.email}
        </span>
        <button className="navbar-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
