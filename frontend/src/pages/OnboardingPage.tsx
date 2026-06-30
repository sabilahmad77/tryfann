import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useLanguage } from "@/contexts/useLanguage";
import { ROUTES } from "@/routes/paths";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function OnboardingPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPersona = searchParams.get("persona") || "";

  // Redirect to signup if no persona is provided
  useEffect(() => {
    if (!selectedPersona) {
      navigate(ROUTES.SIGN_UP, { replace: true });
    }
  }, [selectedPersona, navigate]);

  if (!selectedPersona) {
    return null; // Will redirect
  }

  return (
    <OnboardingFlow
      language={language}
      selectedPersona={selectedPersona}
      onComplete={() => navigate(ROUTES.DASHBOARD)}
    />
  );
}
