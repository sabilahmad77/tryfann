import { SignUp } from "@/components/SignUp";
import { useLanguage } from "@/contexts/useLanguage";
import { ROUTES } from "@/routes/paths";
import { resetOnboarding } from "@/store/onboardingSlice";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

export function SignUpPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const locationState = location.state as
    | { persona?: string; personaId?: string; referralCode?: string }
    | undefined;
  // Landing role cards pass `persona`; other callers may pass `personaId` —
  // accept either so the role pre-selects on the signup gate.
  const personaId = locationState?.persona ?? locationState?.personaId;
  // Referral attribution: router state (from /ref/:code) with a ?ref= query
  // fallback so the code survives hard refreshes and copied URLs (TECH-5).
  const searchRef = new URLSearchParams(location.search).get("ref") || undefined;
  const referralCode = locationState?.referralCode || searchRef;

  const handleSignUpComplete = (persona: string) => {
    // Reset onboarding state to ensure we always start from step 0 when coming from signup
    dispatch(resetOnboarding());

    // Navigate to onboarding page with persona in URL params
    const onboardingPath = `${ROUTES.ONBOARDING}?persona=${encodeURIComponent(
      persona
    )}`;
    navigate(onboardingPath, { replace: true });
  };

  return (
    <SignUp
      language={language}
      onNavigateToSignIn={() => navigate(ROUTES.SIGN_IN)}
      onNavigateToHome={() => navigate(ROUTES.HOME)}
      onSignUpComplete={handleSignUpComplete}
      initialPersona={personaId}
      initialReferralCode={referralCode}
    />
  );
}
