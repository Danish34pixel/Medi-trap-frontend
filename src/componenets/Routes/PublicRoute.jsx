import React from "react";
import { Navigate } from "react-router-dom";
import { getCookie } from "../utils/cookies";

// Redirects an already-authenticated user away from public-only pages
// (Login/Signup) instead of forcing them to re-authenticate.
export default function PublicRoute({ children }) {
  const isAuthenticated = Boolean(
    getCookie("token") || localStorage.getItem("token")
  );
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}
