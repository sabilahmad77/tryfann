import { useLanguage } from "@/contexts/useLanguage";
import { useGetQualificationMeQuery } from "@/services/api/qualificationApi";
import { Crown, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

// Surfaces a concierge / representation path for TOP-TIER game applicants
// (artist + curator who have reached Priority Access or Founder's Circle).
// Additive invitation only — no points/missions; it links to a human advisor.
const CONCIERGE_EMAIL = "concierge@trifan.com";
const ELIGIBLE_ROLES = ["artist", "curator"];
const TOP_TIERS = ["priority_access", "founders_circle"];

const content = {
  en: {
    eyebrow: "Invitation",
    title: "A concierge path is open to you",
    body: "Your standing puts you among the strongest founding applicants. A dedicated advisor can fast-track gallery representation and priority access — handled personally, not through the queue.",
    cta: "Talk to an advisor",
  },
  ar: {
    eyebrow: "دعوة",
    title: "مسار مخصّص أصبح متاحًا لك",
    body: "مكانتك تضعك بين أقوى المتقدّمين المؤسسين. يمكن لمستشار مخصّص تسريع التمثيل في المعارض والوصول ذي الأولوية — بشكل شخصي، لا عبر الطابور.",
    cta: "تحدّث إلى مستشار",
  },
};

export function ConciergePathCard() {
  const { language } = useLanguage();
  const t = content[language];
  const { data } = useGetQualificationMeQuery();

  const me = data?.data;
  if (
    !me ||
    me.track !== "game" ||
    !ELIGIBLE_ROLES.includes((me.role || "").toLowerCase()) ||
    !TOP_TIERS.includes(me.tier)
  ) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-white/5 p-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
          <Crown className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="fann-eyebrow" style={{ color: "var(--gold)" }}>{t.eyebrow}</p>
          <h3 className="mt-1 text-lg text-white">{t.title}</h3>
          <p className="mt-1 max-w-2xl text-sm text-white/60">{t.body}</p>
          <a
            href={`mailto:${CONCIERGE_EMAIL}?subject=Concierge%20path%20—%20${encodeURIComponent(me.role)}`}
            className="fann-focus mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2.5 text-sm font-medium text-[#0B0B0D] transition hover:opacity-90"
          >
            {t.cta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
