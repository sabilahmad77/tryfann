import { ROUTES } from "@/routes/paths";
import type { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute component
 * Routes accessible without token (before token is set)
 *
 * Public routes are accessible BEFORE token is set
 * If token is set (user is authenticated), redirects to dashboard regardless of profile completion
 * Uses Redux store to check authentication status (persisted via redux-persist)
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const location = useLocation();
  // Get authentication status from Redux store
  // This will be true if tokens exist (persisted via redux-persist)
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  // Allow access to signup even if the user is already authenticated.
  // This is important so that the signup flow can redirect to the onboarding
  // welcome screen instead of being forced back to the dashboard immediately.
  if (location.pathname === ROUTES.SIGN_UP) {
    return <>{children}</>;
  }

  // If user is authenticated (token is set), redirect to dashboard
  // User must logout/clear token to access public routes again
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // If not authenticated, allow access to public route
  return <>{children}</>;
}
