import { useLanguage } from "@/contexts/useLanguage";
import { ROUTES } from "@/routes/paths";
import { useGetQualificationMeQuery } from "@/services/api/qualificationApi";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck, UserCog } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

const content = {
  en: {
    label: "Your next step",
    emailTitle: "Verify your email",
    emailDesc: "Check your inbox to confirm your address and activate your account.",
    profileTitle: "Complete your profile",
    profileDesc: "Add your details so our team can review your founding application.",
    profileCta: "Complete profile",
    kycTitle: "Verify your identity",
    kycDesc: "Submit identity verification to unlock priority access.",
    kycCta: "Start verification",
    doneTitle: "You're all set",
    doneDesc: "Your application is complete. Our team will be in touch shortly.",
  },
  ar: {
    label: "خطوتك التالية",
    emailTitle: "تحقّق من بريدك الإلكتروني",
    emailDesc: "راجع بريدك لتأكيد عنوانك وتفعيل حسابك.",
    profileTitle: "أكمل ملفك الشخصي",
    profileDesc: "أضف بياناتك ليتمكن فريقنا من مراجعة طلب الانضمام المؤسس.",
    profileCta: "إكمال الملف",
    kycTitle: "تحقّق من هويتك",
    kycDesc: "أرسل التحقق من الهوية لفتح الوصول ذي الأولوية.",
    kycCta: "بدء التحقق",
    doneTitle: "كل شيء جاهز",
    doneDesc: "اكتمل طلبك. سيتواصل معك فريقنا قريبًا.",
  },
};

export function NextActionCard() {
  const { language } = useLanguage();
  const t = content[language];
  const navigate = useNavigate();
  const { data, isLoading } = useGetQualificationMeQuery();

  if (isLoading) {
    return (
      <div className="mb-6 h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
    );
  }
  const me = data?.data;
  if (!me) return null;

  const v = me.verification;
  let icon = CheckCircle2;
  let title = t.doneTitle;
  let desc = t.doneDesc;
  let cta: { label: string; to: string } | null = null;
  let done = true;

  if (!v.email_verified) {
    icon = Mail; title = t.emailTitle; desc = t.emailDesc; done = false;
  } else if (!v.profile_completed) {
    icon = UserCog; title = t.profileTitle; desc = t.profileDesc;
    cta = { label: t.profileCta, to: ROUTES.PROFILE_COMPLETION }; done = false;
  } else if (!v.kyc_approved) {
    icon = ShieldCheck; title = t.kycTitle; desc = t.kycDesc;
    cta = { label: t.kycCta, to: ROUTES.PROFILE_COMPLETION }; done = false;
  }

  const Icon = icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-6 ${
        done
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            done ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">{t.label}</p>
          <h3 className="text-lg text-white">{title}</h3>
          <p className="mt-0.5 max-w-xl text-sm text-white/60">{desc}</p>
        </div>
      </div>
      {cta && (
        <button
          onClick={() => navigate(cta.to)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2.5 text-sm font-medium text-[#0B0B0D] transition hover:opacity-90"
        >
          {cta.label}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}
