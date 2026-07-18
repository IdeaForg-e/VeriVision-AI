// ProtectedRoute.jsx — Redirects unauthenticated users to /login
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import Loader from "../common/Loader.jsx";
import { ROUTES } from "../../utils/constants.js";

/**
 * Wrap any Route element with this to require authentication.
 * While the AuthContext is resolving (e.g. restoring session from localStorage)
 * we show a full-page spinner so unauthenticated users don't see a flash of
 * the protected page before the redirect fires.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullPage label="Verifying session…" />;
  }

  if (!isAuthenticated) {
    // Preserve the intended destination so LoginPage can redirect back after login
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
}