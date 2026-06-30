import { useLanguage } from "@/contexts/useLanguage";
import { useGetQualificationMeQuery } from "@/services/api/qualificationApi";
import { UserCheck, MousePointerClick } from "lucide-react";

// Compact quality strip shown above the referral-link widget. Quality =
// verified referrals (server-credited, anti-fraud-gated) vs raw clicks —
// reinforcing that only verified joins count.
const content = {
  en: {
    verified: "Verified referrals",
    clicks: "Link clicks",
    hint: "Only referrals who verify their email count toward your readiness.",
    empty: "Share your link — verified joins earn credit, clicks alone don't.",
  },
  ar: {
    verified: "إحالات موثّقة",
    clicks: "نقرات الرابط",
    hint: "تُحتسب فقط الإحالات التي تتحقق من بريدها ضمن جاهزيتك.",
    empty: "شارك رابطك — الانضمامات الموثّقة تُحتسب، النقرات وحدها لا.",
  },
};

export function ReferralQuality({ clicks }: { clicks?: number }) {
  const { language } = useLanguage();
  const t = content[language];
  const { data, isLoading } = useGetQualificationMeQuery();

  if (isLoading) {
    return <div className="mb-3 h-10 animate-pulse rounded-xl border border-white/10 bg-white/5" />;
  }

  const me = data?.data;
  if (!me || me.track !== "game") return null;

  const verified = me.verified_referrals ?? 0;
  const totalClicks = clicks ?? 0;
  const nothingYet = verified === 0 && totalClicks === 0;

  return (
    <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="flex items-center gap-1.5 text-emerald-300">
          <UserCheck className="h-4 w-4" />
          {t.verified}: <span className="tabular-nums">{verified}</span>
        </span>
        <span className="flex items-center gap-1.5 text-white/50">
          <MousePointerClick className="h-4 w-4" />
          {t.clicks}: <span className="tabular-nums">{totalClicks}</span>
        </span>
      </div>
      <p className="mt-1.5 text-xs text-white/40">
        {nothingYet ? t.empty : t.hint}
      </p>
    </div>
  );
}
