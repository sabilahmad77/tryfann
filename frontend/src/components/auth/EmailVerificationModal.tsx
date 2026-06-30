import { useLanguage } from "@/contexts/useLanguage";
import { ROUTES } from "@/routes/paths";
import { baseApi } from "@/services/api/baseApi";
import { clearAuth } from "@/store/authSlice";
import type { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Mail, LogOut, Home } from "lucide-react";
import { motion } from "motion/react";

export function EmailVerificationModal() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isRTL = language === "ar";

  const content = {
    en: {
      title: "Email Verification Required",
      subtitle: "Please verify your email address to continue",
      body: "We've sent a verification email to your inbox. Please check your email and click the verification link to activate your account. Once verified, please sign in again to access your dashboard.",
      note: "If you didn't receive the email, please check your spam folder or contact our support team.",
      signOut: "Sign out",
      backToHome: "Back to Home",
      pendingLabel: "Status: Email verification pending",
    },
    ar: {
      title: "التحقق من البريد الإلكتروني مطلوب",
      subtitle: "يرجى التحقق من عنوان بريدك الإلكتروني للمتابعة",
      body: "لقد أرسلنا بريداً إلكترونياً للتحقق إلى صندوق الوارد الخاص بك. يرجى التحقق من بريدك الإلكتروني والنقر على رابط التحقق لتفعيل حسابك. بعد التحقق، يرجى تسجيل الدخول مرة أخرى للوصول إلى لوحة التحكم.",
      note: "إذا لم تستلم البريد الإلكتروني، يرجى التحقق من مجلد الرسائل غير المرغوب فيها أو التواصل مع فريق الدعم.",
      signOut: "تسجيل الخروج",
      backToHome: "العودة إلى الرئيسية",
      pendingLabel: "الحالة: في انتظار التحقق من البريد الإلكتروني",
    },
  } as const;

  const t = content[language];

  const handleSignOut = () => {
    // Clear RTK Query cache to remove all cached API data
    dispatch(baseApi.util.resetApiState());
    dispatch(clearAuth());
    navigate(ROUTES.SIGN_IN, { replace: true });
  };

  const handleBackHome = () => {
    // Clear RTK Query cache to remove all cached API data
    dispatch(baseApi.util.resetApiState());
    dispatch(clearAuth());
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <div className="fann-landing fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg mx-4"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div
          className="p-8 md:p-10"
          style={{
            background: "var(--ink-card)",
            border: "1px solid var(--gold-edge)",
            borderRadius: "var(--r-xl)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div
              className="mb-2 flex h-16 w-16 items-center justify-center"
              style={{
                background: "var(--gold-soft)",
                border: "1px solid var(--gold-edge)",
                borderRadius: "var(--r-lg)",
              }}
            >
              <Mail className="h-8 w-8" style={{ color: "var(--gold)" }} />
            </div>

            <h2
              className="fann-display"
              style={{ fontSize: "clamp(1.5rem, 3vw, 1.875rem)", color: "var(--bone)" }}
            >
              {t.title}
            </h2>
            <p className="text-sm md:text-base" style={{ color: "var(--bone-2)" }}>
              {t.subtitle}
            </p>

            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: "var(--bone-2)" }}>
              {t.body}
            </p>

            <div
              className="mt-4 w-full max-w-md px-4 py-3 text-xs md:text-sm"
              style={{
                background: "var(--gold-soft)",
                border: "1px solid var(--gold-edge)",
                borderRadius: "var(--r-md)",
                color: "var(--gold)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-2 w-2 animate-pulse rounded-full"
                  style={{ background: "var(--gold)" }}
                />
                <span className="font-medium">{t.pendingLabel}</span>
              </div>
              {user?.email && (
                <p className="mt-1 break-all text-[0.7rem] md:text-xs" style={{ color: "var(--bone-2)" }}>
                  {user.email}
                </p>
              )}
            </div>

            <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--bone-3)" }}>
              {t.note}
            </p>
          </div>

          <div className="mt-8 flex flex-col items-stretch gap-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="fann-focus flex h-11 w-full cursor-pointer items-center justify-center gap-2 font-semibold transition-all md:h-12"
              style={{
                background: "var(--gold)",
                color: "var(--ink-void)",
                borderRadius: "var(--r-md)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gold-hi)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gold)")}
            >
              <LogOut className="h-4 w-4" />
              <span>{t.signOut}</span>
            </button>

            <button
              type="button"
              onClick={handleBackHome}
              className="fann-focus flex h-11 w-full cursor-pointer items-center justify-center gap-2 transition-colors md:h-12"
              style={{
                background: "transparent",
                border: "1px solid var(--gold-edge)",
                borderRadius: "var(--r-md)",
                color: "var(--gold)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gold-soft)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Home className="h-4 w-4" />
              <span>{t.backToHome}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

