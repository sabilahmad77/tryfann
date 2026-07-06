import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGoogleLoginMutation } from "@/services/api/authApi";
import { setTokens, setPersona, type UserProfileData } from "@/store/authSlice";
import { persistor } from "@/store/store";
import { clearAllAuthState } from "@/utils/auth";
import { ROUTES } from "@/routes/paths";
import { useLanguage } from "@/contexts/useLanguage";

// Whether Google Sign-In is configured for this build. When the env var is
// absent (e.g. before the Client ID is provisioned) the button renders
// nothing rather than throwing — the password form still works.
export const GOOGLE_CLIENT_ID: string | undefined =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
  "931583651800-6u5490dlihpoc3k44i45tdau2tiooj0a.apps.googleusercontent.com";

interface GoogleAuthButtonProps {
  /** Role selected on the sign-up page; applied to brand-new accounts. */
  role?: string;
}

interface GoogleAuthData {
  access?: string;
  refresh?: string;
  role?: string;
  profile_completed?: boolean;
  new_user?: boolean;
  needs_role?: boolean;
  [key: string]: unknown;
}

export function GoogleAuthButton({ role }: GoogleAuthButtonProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [googleLogin] = useGoogleLoginMutation();

  if (!GOOGLE_CLIENT_ID) return null;

  const onSuccess = async (cred: CredentialResponse) => {
    if (!cred.credential) return;
    try {
      const res = await googleLogin({
        credential: cred.credential,
        role: role || undefined,
      }).unwrap();
      const data = ((res as { data?: GoogleAuthData }).data ||
        res) as GoogleAuthData;

      const accessToken = data.access;
      if (!accessToken) throw new Error("No token from server");

      const persona = data.role ? String(data.role).toLowerCase() : undefined;

      await clearAllAuthState(dispatch, persistor, { clearExpiredPage: true });
      dispatch(
        setTokens({
          accessToken,
          refreshToken: data.refresh || "",
          profileCompleted: Boolean(data.profile_completed),
          persona,
          user: data as unknown as UserProfileData,
        })
      );
      if (persona) dispatch(setPersona(persona));

      toast.success(
        language === "en" ? "Signed in with Google" : "تم تسجيل الدخول عبر Google"
      );

      // A brand-new Google user without a role picks one in onboarding;
      // everyone else goes straight to the dashboard.
      if (data.needs_role) {
        navigate(ROUTES.ONBOARDING, { replace: true });
      } else {
        navigate(ROUTES.DASHBOARD, { replace: true });
      }
    } catch {
      // Shared API interceptor already surfaced the error toast.
    }
  };

  return (
    <div className="flex w-full justify-center">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={() =>
          toast.error(
            language === "en"
              ? "Google sign-in failed. Please try again."
              : "فشل تسجيل الدخول عبر Google. حاول مرة أخرى."
          )
        }
        theme="filled_black"
        shape="pill"
        text="continue_with"
        width="320"
        locale={language}
      />
    </div>
  );
}
