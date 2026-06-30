import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { ROUTES } from "@/routes/paths";

/**
 * ReferralPage Component
 * 
 * Handles referral links in the format: /ref/:code
 * 
 * Behavior:
 * - If user is not authenticated: Redirects to signup page with referral code
 * - If user is authenticated: Redirects to dashboard (referral code not applicable)
 */
export function ReferralPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  useEffect(() => {
    // If no code in URL, redirect to home
    if (!code) {
      navigate(ROUTES.HOME, { replace: true });
      return;
    }

    // If user is authenticated, redirect to dashboard
    // (referral code is only applicable during signup)
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
      return;
    }

    // If user is not authenticated, redirect to signup with referral code
    // Store the referral code in location state so SignUpPage can access it
    navigate(ROUTES.SIGN_UP, {
      replace: true,
      state: { referralCode: code },
    });
  }, [code, isAuthenticated, navigate]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-white/70">Redirecting...</p>
      </div>
    </div>
  );
}

