import { useLanguage } from "@/contexts/useLanguage";
import { ROUTES } from "@/routes/paths";
import { useGetQualificationMeQuery } from "@/services/api/qualificationApi";
import { ArrowRight, Check, FileText, RefreshCcw } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

// Concierge application status + "what happens next" (gallery / investor).
// Deliberately NO points, missions, readiness score, tier ladder, or
// leaderboard — concierge applicants see a clean, human-review narrative.
const content = {
  en: {
    title: "Application status",
    subtitle: "Where you are in the founding review",
    statusActionNeeded: "Action needed",
    statusInProgress: "In progress",
    statusInReview: "Under concierge review",
    next: "What happens next",
    steps: {
      email: "Email verified",
      profile: "Complete your profile",
      identity: "Verify your identity",
      review: "Concierge review & founding access",
    },
    completeProfile: "Complete profile",
    verifyIdentity: "Verify identity",
    reviewNote: "Your application is complete. A dedicated advisor will reach out to arrange your founding access.",
  },
  ar: {
    title: "حالة الطلب",
    subtitle: "أين أنت في مراجعة التأسيس",
    statusActionNeeded: "إجراء مطلوب",
    statusInProgress: "قيد التقدّم",
    statusInReview: "قيد المراجعة المخصّصة",
    next: "ما الخطوة التالية",
    steps: {
      email: "تم التحقق من البريد",
      profile: "أكمل ملفك الشخصي",
      identity: "تحقّق من هويتك",
      review: "المراجعة المخصّصة ووصول المؤسسين",
    },
    completeProfile: "إكمال الملف",
    verifyIdentity: "تحقّق من الهوية",
    reviewNote: "اكتمل طلبك. سيتواصل معك مستشار مخصّص لترتيب وصولك المؤسس.",
  },
};

export function ApplicationStatusCard() {
  const { language } = useLanguage();
  const t = content[language];
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGetQualificationMeQuery();

  if (isLoading) {
    return (
      <div className="mb-6 h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
    );
  }
  const me = data?.data;
  if (!me) {
    if (isError) {
      return (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/60">
            {language === "ar"
              ? "تعذّر تحميل حالة طلبك. حاول مرة أخرى."
              : "We couldn't load your application status right now."}
          </p>
          <button
            onClick={() => refetch()}
            className="fann-focus inline-flex items-center gap-2 rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-500/10"
          >
            <RefreshCcw className="h-4 w-4" />
            {language === "ar" ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      );
    }
    return null;
  }

  const v = me.verification;
  // Derive a calm application status + the single current action.
  let status = t.statusInReview;
  let cta: { label: string; to: string } | null = null;
  if (!v.email_verified) {
    status = t.statusActionNeeded;
  } else if (!v.profile_completed) {
    status = t.statusInProgress;
    cta = { label: t.completeProfile, to: ROUTES.PROFILE_COMPLETION };
  } else if (!v.kyc_approved) {
    status = t.statusInProgress;
    cta = { label: t.verifyIdentity, to: ROUTES.PROFILE_COMPLETION };
  }

  // Step states for the "what happens next" track.
  const steps = [
    { key: "email", done: v.email_verified, current: !v.email_verified },
    { key: "profile", done: v.profile_completed, current: v.email_verified && !v.profile_completed },
    { key: "identity", done: v.kyc_approved, current: v.profile_completed && !v.kyc_approved },
    { key: "review", done: false, current: v.email_verified && v.profile_completed && v.kyc_approved },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-white/5 p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg text-white">{t.title}</h3>
          </div>
          <p className="mt-1 text-sm text-white/60">{t.subtitle}</p>
        </div>
        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-300">
          {status}
        </span>
      </div>

      <p className="mt-5 mb-3 text-xs uppercase tracking-wide text-white/40">{t.next}</p>
      <ol className="space-y-3">
        {steps.map((s) => (
          <li key={s.key} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                s.done
                  ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
                  : s.current
                  ? "border-amber-400/60 bg-amber-500/15 text-amber-300"
                  : "border-white/15 text-white/30"
              }`}
            >
              {s.done ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            <span
              className={`text-sm ${
                s.done ? "text-white/70" : s.current ? "text-white" : "text-white/40"
              }`}
            >
              {t.steps[s.key as keyof typeof t.steps]}
            </span>
          </li>
        ))}
      </ol>

      {cta ? (
        <button
          onClick={() => navigate(cta.to)}
          className="fann-focus mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2.5 text-sm font-medium text-[#0B0B0D] transition hover:opacity-90"
        >
          {cta.label}
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <p className="mt-5 border-t border-white/10 pt-4 text-sm text-white/60">
          {t.reviewNote}
        </p>
      )}
    </motion.div>
  );
}
