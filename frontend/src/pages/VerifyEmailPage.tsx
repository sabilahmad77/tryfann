/**
 * Email verification landing page.
 * Opened from the link in the signup email: /verify-email?email=…&token=…
 * Reads the params, calls the backend verify endpoint, and shows the result.
 * Visual layer only; verification logic lives in the backend.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/useLanguage";
import { useVerifyEmailMutation } from "@/services/api/authApi";
import { ROUTES } from "@/routes/paths";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const T = {
  en: {
    verifying: "Verifying your email…",
    successTitle: "Email verified",
    successBody: "Your email address has been confirmed. You can now sign in to your account.",
    errorTitle: "Verification failed",
    errorBody: "This verification link is invalid or has expired. Please request a new one or contact support.",
    missingBody: "This link is missing its verification details. Please use the link from your email.",
    signIn: "Continue to Sign In",
    home: "Back to Home",
    eyebrow: "Account Verification",
  },
  ar: {
    verifying: "جارٍ التحقق من بريدك…",
    successTitle: "تم التحقق من البريد",
    successBody: "تم تأكيد عنوان بريدك الإلكتروني. يمكنك الآن تسجيل الدخول إلى حسابك.",
    errorTitle: "فشل التحقق",
    errorBody: "رابط التحقق غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد أو التواصل مع الدعم.",
    missingBody: "هذا الرابط ينقصه تفاصيل التحقق. يرجى استخدام الرابط من بريدك الإلكتروني.",
    signIn: "المتابعة لتسجيل الدخول",
    home: "العودة للرئيسية",
    eyebrow: "تأكيد الحساب",
  },
} as const;

export function VerifyEmailPage() {
  const { language } = useLanguage();
  const c = T[language as "en" | "ar"];
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  const [verifyEmail] = useVerifyEmailMutation();
  const [state, setState] = useState<"loading" | "success" | "error" | "missing">(
    email && token ? "loading" : "missing"
  );
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !email || !token) return;
    ran.current = true;
    verifyEmail({ email, token })
      .unwrap()
      .then((res) => setState(res?.data?.is_verify ? "success" : "error"))
      .catch(() => setState("error"));
  }, [email, token, verifyEmail]);

  const icon =
    state === "success" ? <CheckCircle2 size={48} color="var(--status-completed-fg)" /> :
    state === "loading" ? <Loader2 size={48} color="var(--gold)" className="tf-spin" /> :
    <XCircle size={48} color="var(--status-rejected-fg)" />;

  const title =
    state === "success" ? c.successTitle :
    state === "loading" ? c.verifying :
    c.errorTitle;

  const body =
    state === "success" ? c.successBody :
    state === "loading" ? "" :
    state === "missing" ? c.missingBody : c.errorBody;

  return (
    <div className="tf-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{
        maxWidth: 460, width: "100%", textAlign: "center",
        background: "var(--surface-1)", border: "1px solid var(--hairline)",
        borderRadius: "var(--r-lg)", padding: "clamp(32px,5vw,52px)",
      }}>
        <div className="tf-eyebrow" style={{ color: "var(--sage)", marginBottom: 24 }}>◆&nbsp; {c.eyebrow}</div>
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>{icon}</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 30, color: "var(--ink-on-dark)", margin: "0 0 12px" }}>{title}</h1>
        {body && <p style={{ color: "var(--ink-on-dark-2)", fontSize: 15, lineHeight: 1.6, margin: "0 0 28px", maxWidth: "42ch", marginInline: "auto" }}>{body}</p>}
        {email && state !== "loading" && (
          <p style={{ color: "var(--ink-on-dark-3)", fontSize: 13, marginBottom: 24 }} className="tf-tnum">{email}</p>
        )}
        {state === "success" && (
          <button onClick={() => navigate(ROUTES.SIGN_IN)} style={{
            background: "var(--gold)", color: "var(--canvas-night)", border: "none",
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "14px 28px", borderRadius: "var(--r-sm)", cursor: "pointer",
          }}>{c.signIn}</button>
        )}
        {(state === "error" || state === "missing") && (
          <button onClick={() => navigate(ROUTES.HOME)} style={{
            background: "transparent", color: "var(--ink-on-dark)", border: "1px solid var(--gold-hairline)",
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "14px 28px", borderRadius: "var(--r-sm)", cursor: "pointer",
          }}>{c.home}</button>
        )}
      </div>
      <style>{`@keyframes tf-spin{to{transform:rotate(360deg)}} .tf-spin{animation:tf-spin 1s linear infinite}`}</style>
    </div>
  );
}
