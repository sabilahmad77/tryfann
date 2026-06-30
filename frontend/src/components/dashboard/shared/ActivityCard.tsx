import { useLanguage } from "@/contexts/useLanguage";
import { useGetQualificationMeQuery } from "@/services/api/qualificationApi";
import { History } from "lucide-react";
import { motion } from "motion/react";

// Points ledger / activity (game track). The server ledger is the only
// source of points — this just renders it. Concierge payloads have no
// ledger, so the card renders nothing for them.
const content = {
  en: {
    title: "Readiness Ledger",
    subtitle: "Every entry is a meaningful action, credited by the server",
    empty: "No activity yet — complete a mission or verify your identity to start earning.",
    reasons: {
      signup: "Joined FANN",
      kyc_verified: "Identity verified",
      referral_credit: "Verified referral",
      profile_completed: "Profile completed",
      task_completed: "Mission completed",
    } as Record<string, string>,
  },
  ar: {
    title: "سجل الجاهزية",
    subtitle: "كل قيد هو إجراء هادف، يُعتمد من الخادم",
    empty: "لا نشاط بعد — أكمل مهمة أو تحقق من هويتك لتبدأ بالكسب.",
    reasons: {
      signup: "الانضمام إلى فن",
      kyc_verified: "تم التحقق من الهوية",
      referral_credit: "إحالة موثّقة",
      profile_completed: "اكتمل الملف",
      task_completed: "مهمة مكتملة",
    } as Record<string, string>,
  },
};

export function ActivityCard() {
  const { language } = useLanguage();
  const t = content[language];
  const { data, isLoading } = useGetQualificationMeQuery();

  if (isLoading) {
    return (
      <div className="mb-6 h-28 animate-pulse rounded-2xl border border-hairline bg-surface-1" />
    );
  }

  const me = data?.data;
  // Game track only — concierge payloads carry no ledger.
  if (!me || me.track !== "game") return null;

  const ledger = me.ledger ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 rounded-2xl border border-hairline bg-surface-1 p-6"
    >
      <div className="flex items-center gap-2 text-gold">
        <History className="h-5 w-5" />
        <h3 className="text-lg text-white">{t.title}</h3>
      </div>
      <p className="mt-1 text-sm text-white/60">{t.subtitle}</p>

      {ledger.length === 0 ? (
        <p className="mt-4 text-sm text-white/50">{t.empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-[#262629]">
          {ledger.map((e, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-white/70">{t.reasons[e.reason] ?? e.reason}</span>
              <span className="flex items-center gap-4">
                <span className="hidden text-xs text-white/30 sm:inline">
                  {new Date(e.created_at).toLocaleDateString(
                    language === "ar" ? "ar" : "en-GB",
                    { day: "numeric", month: "short" }
                  )}
                </span>
                <span className="tabular-nums text-gold">
                  {e.delta >= 0 ? `+${e.delta}` : e.delta}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
