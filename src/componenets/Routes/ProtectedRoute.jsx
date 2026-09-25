import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth, normalizeRole } from "../context/AuthContext";
import getHomeRouteForRole from "../utils/getHomeRouteForRole";

// Centralized route guard (replaces the old per-component
// "read localStorage.user, redirect if missing/wrong role" pattern
// duplicated across Dashboard.jsx/AdminPanel.jsx/StaffDetails.jsx/etc).
//
// - Not authenticated -> redirect to "/" (role-select; there is no single
//   shared login page across roles) with the attempted path preserved so a
//   login screen could send the user back, same idea as nebula's
//   router.replace flows.
// - Authenticated but role not in `roles` -> redirect to THEIR OWN home
//   route rather than rendering anything of the page they weren't allowed
//   on (an admin route hit by a normal-user URL must not flash admin UI).
// - `roles` omitted -> any authenticated role is allowed.
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, role, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (roles && roles.length > 0) {
    const normalized = normalizeRole(role);
    const allowed = roles.map(normalizeRole);
    if (!allowed.includes(normalized)) {
      const uid = user && (user._id || user.id);
      return <Navigate to={getHomeRouteForRole(role, uid)} replace />;
    }
  }

  return children;
}
