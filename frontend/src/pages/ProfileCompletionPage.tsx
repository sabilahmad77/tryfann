import { ProfileCompletion } from "@/components/onboarding/ProfileCompletion";
import { useLanguage } from "@/contexts/useLanguage";
import { ROUTES } from "@/routes/paths";
import { setProfileCompleted, setUser } from "@/store/authSlice";
import type { RootState } from "@/store/store";
import { useGetUserDetailsQuery } from "@/services/api/authApi";
import {
  parseGetUserDetailsResponse,
  mapProfileStepToOnboardingStep,
  mergeUserData,
} from "@/utils/apiResponseHelpers";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Oval } from "react-loader-spinner";
import { updateStepData } from "@/store/onboardingSlice";

// How long the boot fetch may block the form. Past this we render the form
// with defaults and let the data merge in when (if) it arrives — the page
// must never dead-end on a slow/cold API (audit BRK-01 / plan TECH-1).
const LOADING_TIMEOUT_MS = 8000;

export function ProfileCompletionPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const persona = useSelector((state: RootState) => state.auth.persona);
  const storedUser = useSelector((state: RootState) => state.auth.user);
  const [initialStep, setInitialStep] = useState<number | undefined>(undefined);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const hasProcessedRef = useRef(false);

  // Fetch user details from API
  const {
    data: userDetailsData,
    isLoading,
    isError,
    error,
  } = useGetUserDetailsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: !persona, // Skip if no persona
  });

  // Hard timeout: never let the loader block the form indefinitely.
  useEffect(() => {
    if (!isLoading) return;
    const t = window.setTimeout(() => setLoadTimedOut(true), LOADING_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [isLoading]);

  // Process user details data when it's available
  useEffect(() => {
    if (!userDetailsData || hasProcessedRef.current) {
      return;
    }

    try {
      const { user, kyc_verification } = parseGetUserDetailsResponse(
        userDetailsData
      );

      // Update storedUser with complete user data from API
      if (user) {
        const mergedUser = storedUser
          ? mergeUserData(storedUser, user)
          : user;
        dispatch(setUser(mergedUser));

        // Extract profile_step and map to initial step
        const profileStep = user.profile_step;
        const mappedStep = mapProfileStepToOnboardingStep(
          profileStep,
          persona || ""
        );
        setInitialStep(mappedStep);
      }

      // Update KYC data in Redux if available
      if (kyc_verification) {
        dispatch(
          updateStepData({
            stepKey: "kyc",
            data: {
              id_number: kyc_verification.id_number || "",
              dob: kyc_verification.dob || "",
              nationality: kyc_verification.nationality || "",
              city: kyc_verification.city || "",
              postal_code: kyc_verification.postal_code || "",
              street_address: kyc_verification.street_address || "",
              id_type: "", // Not in kyc_verification response, will be empty
              gov_issued_id: kyc_verification.gov_issued_id || null,
              proof_address: kyc_verification.proof_address || null,
            },
          })
        );
      }

      // Mark as processed to avoid re-running even if data reference changes
      hasProcessedRef.current = true;
    } catch (err) {
      console.error("Failed to process user details:", err);
      hasProcessedRef.current = true; // Still allow navigation even if processing fails
    }
  }, [userDetailsData, storedUser, dispatch, persona]);

  // Redirect if no persona
  useEffect(() => {
    if (!persona) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [persona, navigate]);

  // Handle error state
  useEffect(() => {
    if (isError) {
      console.error("Failed to fetch user details:", error);
      // Still allow navigation to profile completion even if fetch fails
      hasProcessedRef.current = true;
    }
  }, [isError, error]);

  if (!persona) {
    return null;
  }

  // Show loading state while fetching user details — but only briefly.
  // After LOADING_TIMEOUT_MS (or on error) we render the form with defaults;
  // the merge effect above still applies data if the response arrives later.
  if (isLoading && !loadTimedOut && !isError && !hasProcessedRef.current) {
    return (
      <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center">
          <Oval
            height={50}
            width={50}
            color="#C59B48"
            ariaLabel="loading"
            visible={true}
          />
          <p className="text-[#B9BBC6] mt-4">
            {language === "en"
              ? "Loading your profile..."
              : "جارٍ تحميل ملفك الشخصي..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProfileCompletion
      language={language}
      selectedPersona={persona}
      initialStep={initialStep}
      onComplete={() => {
        // Update profile completion status
        dispatch(setProfileCompleted(true));
        navigate(ROUTES.DASHBOARD, { replace: true });
      }}
      onCancel={() => navigate(ROUTES.DASHBOARD, { replace: true })}
    />
  );
}

