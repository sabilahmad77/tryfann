import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Oval } from "react-loader-spinner";
import { API_BASE_URL } from "@/services/api/baseApi";
import { ROUTES } from "@/routes/paths";
import { useLanguage } from "@/contexts/useLanguage";

/**
 * /ref/:code — referral landing (plan TECH-5, audit BRK-04).
 *
 * Shared referral links land here. We (best-effort) record the click on the
 * backend so the referrer's real click count moves, then forward to the
 * signup page with the code prefilled. The code also survives in the ?ref=
 * query so a hard refresh on signup keeps the attribution.
 */
export function ReferralLandingPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const referralCode = (code || "").trim();

    // Record the click server-side; never block the redirect on it.
    if (referralCode) {
      void fetch(
        `${API_BASE_URL}/market_final/ref/${encodeURIComponent(referralCode)}`
      ).catch(() => {
        /* best-effort */
      });
    }

    navigate(
      { pathname: ROUTES.SIGN_UP, search: referralCode ? `?ref=${encodeURIComponent(referralCode)}` : "" },
      { replace: true, state: { referralCode } }
    );
  }, [code, navigate]);

  return (
    <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center text-center">
        <Oval height={50} width={50} color="#C59B48" ariaLabel="loading" visible />
        <p className="text-[#B9BBC6] mt-4">
          {language === "en"
            ? "Taking you to your invitation..."
            : "جارٍ نقلك إلى دعوتك..."}
        </p>
      </div>
    </div>
  );
}
