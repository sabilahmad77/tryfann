// P1-11 / P1-12 — user-visible founding standing: the caller's tier +
// application status + waitlist position, plus TRUTHFUL per-tier capacity
// (real member counts, never fabricated scarcity). Also the Enh-2 exemplar for
// the 4-state contract: loading (skeleton) / error (ErrorState) / empty
// (EmptyState) / success — in EN + AR.
import { EmptyState, ErrorState } from "@/components/ui/ViewState";
import { useLanguage } from "@/contexts/useLanguage";
import { useGetFoundingStatusQuery } from "@/services/api/qualificationApi";
import { Crown } from "lucide-react";
import { motion } from "motion/react";

const content = {
  en: {
    title: "Founding standing",
    subtitle: "Your place in the founding cohort",
    status: "Status",
    position: "Waitlist position",
    capacity: "Cohort capacity",
    spotsLeft: "spots left",
    full: "Full",
    uncapped: "Open",
    noStanding: "Your founding standing will appear once your application is underway.",
  },
  ar: {
    title: "المكانة التأسيسية",
    subtitle: "مكانك في مجموعة المؤسسين",
    status: "الحالة",
    position: "ترتيب قائمة الانتظار",
    capacity: "سعة المجموعة",
    spotsLeft: "أماكن متبقية",
    full: "مكتمل",
    uncapped: "مفتوح",
    noStanding: "ستظهر مكانتك التأسيسية بمجرد أن يصبح طلبك قيد المعالجة.",
  },
};

export function FoundingStatusCard() {
  const { language } = useLanguage();
  const t = content[language];
  const { data, isLoading, isError, refetch } = useGetFoundingStatusQuery();

  // 1) loading
  if (isLoading) {
    return (
      <div className="mb-6 h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
    );
  }
  // 2) error
  if (isError) {
    return <ErrorState className="mb-6" onRetry={() => refetch()} />;
  }

  const payload = data?.data;
  const me = payload?.me;
  const tiers = payload?.tiers ?? [];

  // 3) empty — no personal standing yet
  if (!me) {
    return (
      <EmptyState
        className="mb-6"
        icon={<Crown className="h-6 w-6" />}
        title={content[language].title}
        body={t.noStanding}
      />
    );
  }

  // 4) success
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
            <Crown className="h-5 w-5" />
            <h3 className="text-lg text-white">{t.title}</h3>
          </div>
          <p className="mt-1 text-sm text-white/60">{t.subtitle}</p>
        </div>
        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-300">
          {me.tier_label}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-white/40">{t.status}</p>
          <p className="mt-1 text-sm text-white">{me.status_label}</p>
        </div>
        {me.position != null && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/40">{t.position}</p>
            <p className="mt-1 text-sm text-white">#{me.position}</p>
          </div>
        )}
      </div>

      {tiers.length > 0 && (
        <>
          <p className="mt-5 mb-3 text-xs uppercase tracking-wide text-white/40">
            {t.capacity}
          </p>
          <ul className="space-y-2">
            {tiers.map((tier) => (
              <li
                key={tier.tier}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-2 text-sm"
              >
                <span className="text-white/70">{tier.label}</span>
                <span className="text-white/50">
                  {tier.cap === 0
                    ? t.uncapped
                    : tier.is_full
                    ? t.full
                    : `${tier.remaining} ${t.spotsLeft}`}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </motion.div>
  );
}
