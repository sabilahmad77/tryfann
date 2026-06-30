import { useLanguage } from "@/contexts/useLanguage";
import { useGetQualificationMeQuery } from "@/services/api/qualificationApi";
import { motion } from "motion/react";
import { CheckCircle2, Circle, RefreshCcw, ShieldCheck, Sparkles } from "lucide-react";

const content = {
  en: {
    title: "Founding readiness",
    subtitle: "Your standing in the founding cohort",
    completion: "Profile completion",
    points: "Points earned",
    recentActivity: "Recent activity",
    scoreLabel: "Readiness score",
    earning: "What's earning",
    missing: "What's missing",
    signals: {
      email_verified: "Email verified",
      profile_completed: "Profile completed",
      kyc_approved: "Identity verified",
      role_details: "Role details shared",
    } as Record<string, string>,
    referrals: "Verified referrals",
    missions: "Missions approved",
    each: "each",
    components: {
      profile_completion: "Profile completion",
      answer_quality: "Answer quality",
      strategic_fit: "Strategic fit",
      referral_quality: "Referral quality",
      task_completion: "Task completion",
      admin_override: "Reviewer adjustment",
    } as Record<string, string>,
    reasons: {
      signup: "Joined FANN",
      kyc_verified: "Identity verified",
      referral_credit: "Verified referral",
      profile_completed: "Profile completed",
      task_completed: "Mission completed",
    } as Record<string, string>,
    concierge: "Your application is with our team for concierge review — no points or missions.",
    checks: {
      email_verified: "Email verified",
      profile_completed: "Profile complete",
      kyc_approved: "Identity verified",
    },
    tiers: {
      waitlisted: "Waitlisted",
      verified_member: "Verified Member",
      priority_access: "Priority Access",
      founders_circle: "Founder's Circle",
    } as Record<string, string>,
  },
  ar: {
    title: "جاهزية الانضمام",
    subtitle: "مكانتك ضمن مجموعة المؤسسين",
    completion: "اكتمال الملف",
    points: "النقاط المكتسبة",
    recentActivity: "النشاط الأخير",
    scoreLabel: "درجة الجاهزية",
    earning: "ما يضيف لدرجتك",
    missing: "ما ينقصك",
    signals: {
      email_verified: "تم التحقق من البريد",
      profile_completed: "اكتمل الملف",
      kyc_approved: "تم التحقق من الهوية",
      role_details: "تمت مشاركة تفاصيل الدور",
    } as Record<string, string>,
    referrals: "إحالات موثّقة",
    missions: "مهام معتمدة",
    each: "لكل واحدة",
    components: {
      profile_completion: "اكتمال الملف",
      answer_quality: "جودة الإجابات",
      strategic_fit: "التوافق الاستراتيجي",
      referral_quality: "جودة الإحالات",
      task_completion: "إكمال المهام",
      admin_override: "تعديل المراجِع",
    } as Record<string, string>,
    reasons: {
      signup: "الانضمام إلى فن",
      kyc_verified: "تم التحقق من الهوية",
      referral_credit: "إحالة موثّقة",
      profile_completed: "اكتمل الملف",
      task_completed: "مهمة مكتملة",
    } as Record<string, string>,
    concierge: "طلبك قيد المراجعة المخصّصة من فريقنا — بلا نقاط أو مهام.",
    checks: {
      email_verified: "تم التحقق من البريد",
      profile_completed: "اكتمل الملف",
      kyc_approved: "تم التحقق من الهوية",
    },
    tiers: {
      waitlisted: "قائمة الانتظار",
      verified_member: "عضو موثّق",
      priority_access: "وصول ذو أولوية",
      founders_circle: "دائرة المؤسّسين",
    } as Record<string, string>,
  },
};

export function ReadinessCard({ showLedger = true }: { showLedger?: boolean }) {
  const { language } = useLanguage();
  const t = content[language];
  const { data, isLoading, isError, refetch } = useGetQualificationMeQuery();

  if (isLoading) {
    return (
      <div className="mb-6 h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
    );
  }

  const me = data?.data;
  if (!me) {
    if (isError) {
      return (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/60">
            {language === "ar"
              ? "تعذّر تحميل جاهزيتك. حاول مرة أخرى."
              : "We couldn't load your readiness right now."}
          </p>
          <button
            onClick={() => refetch()}
            className="fann-focus inline-flex items-center gap-2 rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-gold transition hover:bg-amber-500/10"
          >
            <RefreshCcw className="h-4 w-4" />
            {language === "ar" ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      );
    }
    return null;
  }

  const tierIndex = me.tier_order.indexOf(me.tier);
  const tierSteps = me.tier_order.length;
  const isGame = me.track === "game";
  const checks = me.verification;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 rounded-2xl border border-hairline bg-surface-1 p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="text-lg text-white">{t.title}</h3>
          </div>
          <p className="mt-1 text-sm text-white/60">{t.subtitle}</p>
        </div>
        <span className="rounded-full border border-[var(--gold-hairline)] bg-[var(--gold-soft)] px-4 py-1.5 text-sm font-medium text-[#D6B85C]">
          {t.tiers[me.tier] ?? me.tier_label}
        </span>
      </div>

      {/* Tier ladder */}
      <div className="mt-5 flex items-center gap-1.5">
        {me.tier_order.map((step, i) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full ${
              i <= tierIndex ? "bg-gold" : "bg-white/10"
            }`}
            title={step}
          />
        ))}
      </div>
      <p className="mt-1 text-right text-xs text-white/40">
        {tierIndex + 1}/{tierSteps}
      </p>

      {/* Completion */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-white/70">{t.completion}</span>
          <span className="text-white tabular-nums">{me.completion_pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#D6B85C] transition-all"
            style={{ width: `${me.completion_pct}%` }}
          />
        </div>
      </div>

      {/* Verification checks */}
      <div className="mt-4 flex flex-wrap gap-3">
        {(Object.keys(t.checks) as Array<keyof typeof checks>).map((key) => {
          const ok = checks[key];
          return (
            <div
              key={key}
              className={`flex items-center gap-1.5 text-xs ${
                ok ? "text-[#8FB29E]" : "text-white/40"
              }`}
            >
              {ok ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              {t.checks[key]}
            </div>
          );
        })}
      </div>

      {/* Game track: score breakdown + points (+ optional ledger).
          Concierge: review note (never points). */}
      {isGame ? (
        <div className="mt-5 border-t border-white/10 pt-4">
          {/* Six §3.1 components — what's earning / what's missing.
              Server-computed; never a public ranking or arbitrary number. */}
          {me.components && me.components.length > 0 && (
            <div className="mb-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-white/70">{t.scoreLabel}</span>
                <span className="text-sm font-semibold text-gold tabular-nums">
                  {me.readiness_score ?? 0}/100
                </span>
              </div>
              {(() => {
                const earning = me.components.filter((c) => c.earned > 0);
                const missing = me.components.filter((c) => c.earned < c.max);
                const lbl = (k: string) => t.components[k] ?? k;
                return (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-xs uppercase tracking-wide text-[#8FB29E]/80">
                        {t.earning}
                      </p>
                      <ul className="space-y-1">
                        {earning.map((c) => (
                          <li key={c.key} className="flex items-center justify-between gap-2 text-xs">
                            <span className="flex items-center gap-1.5 text-white/70">
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#8FB29E]" />
                              {lbl(c.key)}
                            </span>
                            <span className="tabular-nums text-[#8FB29E]">+{c.earned}</span>
                          </li>
                        ))}
                        {earning.length === 0 && (
                          <li className="text-xs text-white/40">—</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs uppercase tracking-wide text-gold/80">
                        {t.missing}
                      </p>
                      <ul className="space-y-1">
                        {missing.map((c) => (
                          <li key={c.key} className="flex items-center justify-between gap-2 text-xs">
                            <span className="flex items-center gap-1.5 text-white/50">
                              <Circle className="h-3.5 w-3.5 text-gold/70" />
                              {lbl(c.key)}
                            </span>
                            <span className="tabular-nums text-gold/80">
                              +{c.max - c.earned}
                            </span>
                          </li>
                        ))}
                        {missing.length === 0 && (
                          <li className="text-xs text-white/40">—</li>
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-sm text-white/70">{t.points}:</span>
            <span className="text-sm font-semibold text-gold tabular-nums">
              {me.points ?? 0}
            </span>
          </div>
          {showLedger && me.ledger && me.ledger.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-white/40">
                {t.recentActivity}
              </p>
              <ul className="space-y-1.5">
                {me.ledger.slice(0, 6).map((e, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-white/70">
                      {t.reasons[e.reason] ?? e.reason}
                    </span>
                    <span className="tabular-nums text-gold">
                      {e.delta >= 0 ? `+${e.delta}` : e.delta}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-5 border-t border-white/10 pt-4 text-sm text-white/60">
          {t.concierge}
        </p>
      )}
    </motion.div>
  );
}
