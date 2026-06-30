import { motion, useReducedMotion, type Variants } from 'motion/react';
import { UserPlus, ClipboardList, ShieldCheck, KeyRound, type LucideIcon } from 'lucide-react';

interface HowTryFannProps {
  language: 'en' | 'ar';
}

interface Step {
  num: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}

const content: Record<'en' | 'ar', { eyebrow: string; title: string; lead: string; steps: Step[] }> = {
  en: {
    eyebrow: 'How TryFann works',
    title: 'Four steps to founding access.',
    lead: 'No points to grind. A short, reviewed path that proves you belong in the founding cohort.',
    steps: [
      { num: '01', icon: UserPlus, title: 'Join', desc: 'Create your account and verify your email — the gate before anything counts.' },
      { num: '02', icon: ClipboardList, title: 'Qualify', desc: 'Choose your role and complete a short application, reviewed by a person.' },
      { num: '03', icon: ShieldCheck, title: 'Complete trust missions', desc: 'Learn the provenance basics — quick checks that show you understand verification.' },
      { num: '04', icon: KeyRound, title: 'Founding access', desc: 'Approved members enter FANN’s founding cohort the day it launches.' },
    ],
  },
  ar: {
    eyebrow: 'كيف يعمل TryFann',
    title: 'أربع خطوات لوصول المؤسسين.',
    lead: 'لا نقاط لتجميعها. مسار قصير خاضع للمراجعة يُثبت أنك تنتمي إلى مجموعة المؤسسين.',
    steps: [
      { num: '٠١', icon: UserPlus, title: 'الانضمام', desc: 'أنشئ حسابك وفعّل بريدك الإلكتروني — البوابة قبل أن يُحتسب أي شيء.' },
      { num: '٠٢', icon: ClipboardList, title: 'التأهّل', desc: 'اختر دورك وأكمل طلبًا قصيرًا تتم مراجعته من قبل شخص.' },
      { num: '٠٣', icon: ShieldCheck, title: 'أكمل مهام الثقة', desc: 'تعلّم أساسيات المصداقية — فحوص سريعة تُظهر فهمك للتحقق.' },
      { num: '٠٤', icon: KeyRound, title: 'وصول المؤسسين', desc: 'يدخل الأعضاء المعتمدون مجموعة مؤسسي FANN يوم الإطلاق.' },
    ],
  },
};

export function HowTryFann({ language }: HowTryFannProps) {
  const t = content[language];
  const isRTL = language === 'ar';
  const reduce = useReducedMotion();

  const list: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.1 } } };
  const item: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section
      className="fann-landing relative w-full"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'var(--ink-panel)', borderTop: '1px solid var(--hairline)' }}
    >
      <div className="mx-auto max-w-[1280px] px-6 py-20 md:px-10 md:py-28">
        <div className={`max-w-2xl ${isRTL ? 'ml-auto text-right' : 'text-left'}`}>
          <span className="fann-eyebrow" style={{ color: 'var(--gold)' }}>{t.eyebrow}</span>
          <h2 className="fann-display mt-4" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', color: 'var(--bone)' }}>
            {t.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed" style={{ color: 'var(--bone-2)' }}>{t.lead}</p>
        </div>

        <motion.ol
          variants={list}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-14 grid list-none grid-cols-1 gap-x-8 gap-y-12 p-0 sm:grid-cols-2 lg:grid-cols-4"
        >
          {t.steps.map((step, i) => {
            const Icon = step.icon;
            const last = i === t.steps.length - 1;
            return (
              <motion.li key={step.title} variants={item} className="relative">
                {/* horizontal connector to next step (desktop only) */}
                {!last && (
                  <span
                    aria-hidden="true"
                    className="absolute hidden lg:block"
                    style={{
                      top: 19,
                      insetInlineStart: isRTL ? 'auto' : 56,
                      insetInlineEnd: isRTL ? 56 : 'auto',
                      width: 'calc(100% - 56px + 2rem)',
                      height: 1,
                      background: 'linear-gradient(to right, var(--gold-edge), var(--hairline))',
                    }}
                  />
                )}
                {/* node */}
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span
                    className="relative z-10 grid place-items-center shrink-0"
                    style={{ width: 40, height: 40, borderRadius: '9999px', background: 'var(--ink-void)', border: '1px solid var(--gold-edge)', color: 'var(--gold)' }}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <span className="fann-display fann-tnum" style={{ fontWeight: 700, fontSize: 30, color: 'var(--gold)' }}>
                    {step.num}
                  </span>
                </div>
                <h3 className="fann-display mt-5" style={{ fontWeight: 700, fontSize: 22, color: 'var(--bone)', lineHeight: 1.2 }}>
                  {step.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: 'var(--bone-2)' }}>{step.desc}</p>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </section>
  );
}
