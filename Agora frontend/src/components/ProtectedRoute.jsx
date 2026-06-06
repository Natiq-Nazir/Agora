// src/components/ProtectedRoute.jsx

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 *
 * Props:
 *   allowedRoles — string[]
 *     e.g. ["admin"] or ["user", "admin"]
 *     The route only renders if the authenticated user's role
 *     is included in this array.
 *
 * Behaviour matrix:
 *   ┌─────────────────────────────┬──────────────────────────────────┐
 *   │ State                       │ Action                           │
 *   ├─────────────────────────────┼──────────────────────────────────┤
 *   │ loading === true            │ Render null (prevents flicker)   │
 *   │ Not authenticated           │ Redirect → /login                │
 *   │ Authenticated, wrong role   │ Redirect → role's own home route │
 *   │ Authenticated, correct role │ Render <Outlet /> (child routes) │
 *   └─────────────────────────────┴──────────────────────────────────┘
 */

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // ── Phase 1: Wait for session check to complete ────────────────────────────
  // Returning null here holds the render until AuthContext's useEffect
  // resolves the /api/auth/profile call. Without this, ProtectedRoute would
  // always see user === null on first paint and redirect everyone to /login
  // even if they have a valid session cookie.
  if (loading) {
    return null;
  }

  // ── Phase 2: Not logged in at all ─────────────────────────────────────────
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ── Phase 3: Logged in but wrong role ─────────────────────────────────────
  // A "user" trying to reach /admin/dashboard gets bounced to their own home.
  // An "admin" trying to reach a user-only route gets bounced to their dashboard.
  // `replace` keeps the history stack clean (no back-button loop).
  if (!allowedRoles.includes(user.role)) {
    const fallback = user.role === "admin" ? "/admin/dashboard" : "/home";
    return <Navigate to={fallback} replace />;
  }

  // ── Phase 4: Authenticated + correct role ─────────────────────────────────
  // <Outlet /> renders whatever child route is nested inside this guard
  // in App.jsx's route tree.
  return <Outlet />;
};

export default ProtectedRoute;