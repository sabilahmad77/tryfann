import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { ROUTES } from "@/routes/paths";
import { useTokenExpired } from "@/contexts/useTokenExpired";
import { AmbassadorVerificationModal } from "@/components/auth/AmbassadorVerificationModal";
import { EmailVerificationModal } from "@/components/auth/EmailVerificationModal";

interface PrivateRouteProps {
  children: React.ReactNode;
}

// Extend Window interface for the token expiration flag
declare global {
  interface Window {
    __tryfann_handling_token_expiration__?: boolean;
  }
}

/**
 * PrivateRoute component
 * Protects routes that require authentication (token must be set)
 * Redirects users without token to sign in page
 *
 * Private routes are accessible AFTER token is set
 * Uses Redux store to check authentication status (persisted via redux-persist)
 *
 * Note: Does not redirect if token expiration dialog is open (to show dialog first)
 */
export function PrivateRoute({ children }: PrivateRouteProps) {
  // Get authentication status from Redux store
  // This will be true if tokens exist (persisted via redux-persist)
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const user = useSelector((state: RootState) => state.auth.user);

  // Check if token expiration is being handled (dialog is open)
  // This prevents immediate redirect so dialog can be shown first
  const { isHandlingTokenExpiration } = useTokenExpired();

  // Also check window flag (set synchronously before auth is cleared)
  // This ensures we catch the flag even if context hasn't updated yet
  const isHandlingExpiration =
    isHandlingTokenExpiration ||
    (typeof window !== "undefined" &&
      window.__tryfann_handling_token_expiration__ === true);

  // If user is not authenticated (no token) AND we're not showing the token expiration dialog,
  // redirect to sign in
  // If token expiration dialog is open, don't redirect yet - let the dialog handle navigation
  if (!isAuthenticated && !isHandlingExpiration) {
    return <Navigate to={ROUTES.SIGN_IN} replace />;
  }

  // Ambassador verification gate:
  // If the user is an ambassador and their account is not verified yet,
  // block access to all private routes (dashboard, onboarding, profile, etc.)
  // and show a consistent, professional modal explaining the pending status.
  const isAmbassador =
    user?.role === "Ambassador" ||
    user?.role?.toLowerCase?.() === "ambassador";
  const isPendingVerification = isAmbassador && user?.is_verify === false;

  // Email verification gate:
  // If the user is an artist, gallery, or collector and their email is not verified,
  // block access to all private routes and show email verification modal.
  const isArtistGalleryCollector =
    user?.role === "Artist" ||
    user?.role === "Gallery" ||
    user?.role === "Collector" ||
    user?.role?.toLowerCase?.() === "artist" ||
    user?.role?.toLowerCase?.() === "gallery" ||
    user?.role?.toLowerCase?.() === "collector";
  const needsEmailVerification =
    isArtistGalleryCollector && user?.is_verify === false;

  if (isPendingVerification) {
    return <AmbassadorVerificationModal />;
  }

  if (needsEmailVerification) {
    return <EmailVerificationModal />;
  }

  return <>{children}</>;
}
