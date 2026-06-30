import { motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface FoundingPortalProps {
  language: 'en' | 'ar';
}

const content = {
  en: {
    eyebrow: 'Founding access',
    title: 'A members’ portal, not a points game.',
    lead: 'Inside, you track one thing: how ready you are for the founding cohort. Honest signals, reviewed by people — not a leaderboard of strangers.',
    note: 'Investors and galleries get a concierge view — status and a direct contact, no missions.',
    portal: {
      label: 'Your founding status',
      tierCurrent: 'Verified Member',
      readinessLabel: 'Readiness',
      readinessValue: '64 / 100',
      tiers: ['Waitlisted', 'Verified Member', 'Priority Access', "Founder's Circle"],
      rows: [
        ['Profile', '80% complete'],
        ['Verified referrals', '2'],
        ['Trust missions', '3 of 5'],
      ] as [string, string][],
      nextLabel: 'Next step',
      nextAction: 'Complete the provenance quiz',
      nextCta: 'Continue',
    },
  },
  ar: {
    eyebrow: 'وصول المؤسسين',
    title: 'بوابة أعضاء، لا لعبة نقاط.',
    lead: 'في الداخل، تتابع شيئًا واحدًا: مدى جاهزيتك لمجموعة المؤسسين. إشارات صادقة يراجعها أشخاص — لا لوحة متصدّرين للغرباء.',
    note: 'يحصل المستثمرون والمعارض على عرض مخصّص — الحالة وتواصل مباشر، بلا مهام.',
    portal: {
      label: 'حالتك التأسيسية',
      tierCurrent: 'عضو موثّق',
      readinessLabel: 'الجاهزية',
      readinessValue: '٦٤ / ١٠٠',
      tiers: ['مُدرَج', 'عضو موثّق', 'وصول ذو أولوية', 'دائرة المؤسسين'],
      rows: [
        ['الملف الشخصي', '٨٠٪ مكتمل'],
        ['إحالات موثّقة', '٢'],
        ['مهام الثقة', '٣ من ٥'],
      ] as [string, string][],
      nextLabel: 'الخطوة التالية',
      nextAction: 'أكمل اختبار المصداقية',
      nextCta: 'متابعة',
    },
  },
};

export function FoundingPortal({ language }: FoundingPortalProps) {
  const t = content[language];
  const p = t.portal;
  const isRTL = language === 'ar';
  const reduce = useReducedMotion();
  const currentTier = 1; // Verified Member

  const card: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section
      className="fann-landing relative w-full"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'var(--ink-panel)', borderTop: '1px solid var(--hairline)' }}
    >
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-6 py-20 md:px-10 md:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        {/* Left — copy */}
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <span className="fann-eyebrow" style={{ color: 'var(--gold)' }}>{t.eyebrow}</span>
          <h2 className="fann-display mt-4" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', color: 'var(--bone)' }}>
            {t.title}
          </h2>
          <p className="mt-5 max-w-[44ch] text-lg leading-relaxed" style={{ color: 'var(--bone-2)', marginInlineStart: isRTL ? 'auto' : 0 }}>
            {t.lead}
          </p>
          <p className="mt-4 max-w-[44ch] text-sm leading-relaxed" style={{ color: 'var(--bone-3)', marginInlineStart: isRTL ? 'auto' : 0 }}>
            {t.note}
          </p>
        </div>

        {/* Right — premium portal mock */}
        <motion.div
          variants={card}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="relative w-full"
          style={{ background: 'var(--ink-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-card)', padding: '28px' }}
        >
          {/* gold top edge */}
          <span aria-hidden="true" style={{ position: 'absolute', insetInlineStart: 28, insetInlineEnd: 28, top: 0, height: 2, background: 'linear-gradient(to right, var(--gold), transparent)' }} />

          {/* header */}
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="fann-eyebrow" style={{ color: 'var(--bone-3)' }}>{p.label}</span>
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'var(--gold-soft)', border: '1px solid var(--gold-edge)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '9999px', background: 'var(--gold)' }} />
              <span className="fann-meta" style={{ color: 'var(--gold)', fontSize: 10 }}>{p.tierCurrent}</span>
            </span>
          </div>

          {/* readiness meter */}
          <div className="mt-6">
            <div className={`flex items-baseline justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm font-semibold" style={{ color: 'var(--bone)' }}>{p.readinessLabel}</span>
              <span className="fann-tnum text-sm" style={{ color: 'var(--gold)' }}>{p.readinessValue}</span>
            </div>
            <div className="mt-2 w-full overflow-hidden" style={{ height: 8, borderRadius: '9999px', background: 'var(--ink-void)', border: '1px solid var(--hairline)' }}>
              <motion.div
                initial={reduce ? false : { width: 0 }}
                whileInView={{ width: '64%' }}
                viewport={{ once: true }}
                transition={{ duration: reduce ? 0 : 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                style={{ height: '100%', borderRadius: '9999px', background: 'linear-gradient(to right, var(--gold-deep), var(--gold))', width: '64%' }}
              />
            </div>
          </div>

          {/* tier progression */}
          <div className={`mt-7 flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            {p.tiers.map((tier, i) => {
              const done = i < currentTier;
              const active = i === currentTier;
              const color = done || active ? 'var(--gold)' : 'var(--bone-3)';
              return (
                <div key={tier} className="flex flex-1 flex-col items-center gap-2 text-center">
                  <div className="flex w-full items-center">
                    {i !== 0 && <span className="h-px flex-1" style={{ background: i <= currentTier ? 'var(--gold-edge)' : 'var(--hairline)' }} />}
                    <span
                      style={{
                        width: active ? 12 : 9, height: active ? 12 : 9, borderRadius: '9999px',
                        background: done || active ? 'var(--gold)' : 'transparent',
                        border: `1px solid ${color}`,
                        boxShadow: active ? '0 0 0 3px var(--gold-soft)' : 'none',
                      }}
                    />
                    {i !== p.tiers.length - 1 && <span className="h-px flex-1" style={{ background: i < currentTier ? 'var(--gold-edge)' : 'var(--hairline)' }} />}
                  </div>
                  <span style={{ fontSize: 9.5, letterSpacing: isRTL ? 0 : '0.06em', textTransform: 'uppercase', color, fontWeight: active ? 600 : 400 }}>
                    {tier}
                  </span>
                </div>
              );
            })}
          </div>

          {/* stat rows */}
          <dl className="mt-7 m-0 space-y-0">
            {p.rows.map(([k, v], i) => (
              <div key={k} className={`flex items-center justify-between py-3 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ borderTop: i === 0 ? '1px solid var(--hairline)' : '1px solid var(--hairline)' }}>
                <dt className="text-sm" style={{ color: 'var(--bone-2)' }}>{k}</dt>
                <dd className="fann-tnum m-0 text-sm font-semibold" style={{ color: 'var(--bone)' }}>{v}</dd>
              </div>
            ))}
          </dl>

          {/* next action */}
          <div className={`mt-6 flex items-center justify-between gap-4 rounded-xl p-4 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ background: 'var(--ink-void)', border: '1px solid var(--gold-edge)' }}>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <p className="fann-meta" style={{ color: 'var(--bone-3)' }}>{p.nextLabel}</p>
              <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--bone)' }}>{p.nextAction}</p>
            </div>
            <span className="fann-focus inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: 'var(--gold)', color: 'var(--ink-void)' }}>
              {p.nextCta}
              <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
