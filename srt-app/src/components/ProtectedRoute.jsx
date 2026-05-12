import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}

export default ProtectedRoute;
