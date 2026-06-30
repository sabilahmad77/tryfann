import { useLanguage } from "@/contexts/useLanguage";
import { ROUTES } from "@/routes/paths";
import { baseApi } from "@/services/api/baseApi";
import { clearAuth } from "@/store/authSlice";
import type { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

export function AmbassadorVerificationModal() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isRTL = language === "ar";

  const content = {
    en: {
      title: "Ambassador verification pending",
      subtitle:
        "Your ambassador application is currently under review by our team.",
      body: "Once your account is verified, you’ll be able to access your dashboard, ambassador tools, and onboarding experience. We’ll notify you by email when your verification is complete.",
      note: "If you believe this is an error, please contact our support team from the email associated with your account.",
      signOut: "Sign out",
      backToHome: "Back to Home",
      pendingLabel: "Status: Pending verification",
    },
    ar: {
      title: "في انتظار التحقق من حساب السفير",
      subtitle: "طلبك كسفير قيد المراجعة حالياً من قبل فريقنا.",
      body: "بمجرد التحقق من حسابك، ستتمكن من الوصول إلى لوحة التحكم وأدوات السفراء وتجربة الإعداد الكاملة. سنقوم بإعلامك عبر البريد الإلكتروني عند اكتمال عملية التحقق.",
      note: "إذا كنت تعتقد أن هناك خطأ، يرجى التواصل مع فريق الدعم من البريد الإلكتروني المرتبط بحسابك.",
      signOut: "تسجيل الخروج",
      backToHome: "العودة إلى الرئيسية",
      pendingLabel: "الحالة: في انتظار التحقق",
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg mx-4"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="glass border border-amber-500/40 rounded-3xl p-8 md:p-10 shadow-2xl bg-[#0B0B0D]/95">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.4)] mb-2">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            </div>

            <h2 className="text-2xl md:text-3xl font-semibold text-white">
              {t.title}
            </h2>
            <p className="text-white/80 text-sm md:text-base">
              {t.subtitle}
            </p>

            <p className="text-[#B9BBC6] text-sm leading-relaxed mt-2 max-w-xl">
              {t.body}
            </p>

            <div className="mt-4 w-full max-w-md px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-medium">{t.pendingLabel}</span>
              </div>
              {user?.email && (
                <p className="mt-1 text-amber-200/80 text-[0.7rem] md:text-xs break-all opacity-90">
                  {user.email}
                </p>
              )}
            </div>

            <p className="text-white/50 text-xs md:text-xs leading-relaxed mt-3">
              {t.note}
            </p>
          </div>

          <div
            className={`mt-8 flex flex-col gap-3 ${
              isRTL ? "items-stretch" : "items-stretch"
            }`}
          >
            <Button
              type="button"
              onClick={handleSignOut}
              className="h-11 md:h-12 w-full flex items-center justify-center gap-2 bg-amber-500 text-[#0B0B0D] hover:bg-amber-400 font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.signOut}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleBackHome}
              className="h-11 md:h-12 w-full flex items-center justify-center gap-2 border-amber-500/30 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>{t.backToHome}</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


