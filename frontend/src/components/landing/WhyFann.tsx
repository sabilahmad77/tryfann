import { motion, useReducedMotion, type Variants } from 'motion/react';
import { FileBadge, GitBranch, ClipboardCheck, ShieldCheck, Boxes, ArrowRight, type LucideIcon } from 'lucide-react';

interface WhyFannProps {
  language: 'en' | 'ar';
}

interface Step {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface CardData {
  eyebrow: string;
  status: string;
  work: string;
  artist: string;
  certNo: string;
  provenance: string;
  footer: string;
  labels: { work: string; artist: string; cert: string; prov: string };
}

const content: Record<
  'en' | 'ar',
  { eyebrow: string; title: string; lead: string; cta: string; card: CardData; steps: Step[] }
> = {
  en: {
    eyebrow: 'Why FANN',
    title: 'Trust, made checkable.',
    lead: 'Every work moves along one inspectable record. Each step is something you can verify before money or art changes hands.',
    cta: 'See a sample certificate',
    card: {
      eyebrow: 'Certificate of authenticity',
      status: 'Verified',
      work: 'Flower Still-Life with a Curtain',
      artist: 'Adriaen van der Spelt',
      certNo: 'FANN-AC-0042',
      provenance: '4 records · unbroken',
      footer: 'Anchored with blockchain-backed certification',
      labels: { work: 'Work', artist: 'Artist', cert: 'Certificate no.', prov: 'Provenance' },
    },
    steps: [
      { icon: FileBadge, title: 'Certificate of authenticity', desc: 'Every work carries a verifiable certificate — issuer, date, and signature on record.' },
      { icon: GitBranch, title: 'Chain of custody', desc: 'Each owner, sale, and transfer is logged in an unbroken, inspectable history.' },
      { icon: ClipboardCheck, title: 'Condition report', desc: 'Documented condition at intake and handover, with imaging you can review.' },
      { icon: ShieldCheck, title: 'Escrow', desc: 'Funds are held in escrow and released only when the work is verified and delivered.' },
      { icon: Boxes, title: 'Decentralized provenance', desc: 'Records are anchored with blockchain-backed certification, so they cannot be quietly rewritten.' },
    ],
  },
  ar: {
    eyebrow: 'لماذا FANN',
    title: 'ثقة قابلة للتحقق.',
    lead: 'يتحرك كل عمل على سجل واحد قابل للفحص. كل خطوة شيء يمكنك التحقق منه قبل أن ينتقل المال أو العمل.',
    cta: 'اطّلع على نموذج شهادة',
    card: {
      eyebrow: 'شهادة أصالة',
      status: 'موثّق',
      work: 'طبيعة صامتة بالزهور والستارة',
      artist: 'أدريان فان دير سبيلت',
      certNo: 'FANN-AC-0042',
      provenance: '٤ سجلات · متصلة',
      footer: 'مؤمَّنة بتصديق مدعوم بسلسلة الكتل',
      labels: { work: 'العمل', artist: 'الفنان', cert: 'رقم الشهادة', prov: 'المصدر' },
    },
    steps: [
      { icon: FileBadge, title: 'شهادة الأصالة', desc: 'يحمل كل عمل شهادة قابلة للتحقق — الجهة المُصدِرة والتاريخ والتوقيع في السجل.' },
      { icon: GitBranch, title: 'سلسلة الحيازة', desc: 'يُسجَّل كل مالك وعملية بيع ونقل في تاريخ متصل قابل للفحص.' },
      { icon: ClipboardCheck, title: 'تقرير الحالة', desc: 'حالة موثّقة عند الاستلام والتسليم، مع صور يمكنك مراجعتها.' },
      { icon: ShieldCheck, title: 'الضمان (إسكرو)', desc: 'تُحتجَز الأموال في حساب ضمان ولا تُحرَّر إلا بعد التحقق من العمل وتسليمه.' },
      { icon: Boxes, title: 'مصداقية لامركزية', desc: 'تُؤمَّن السجلات بتصديق مدعوم بسلسلة الكتل، فلا يمكن تغييرها بصمت.' },
    ],
  },
};

/** Compact sample certificate-of-authenticity card (reuses the diptych vocabulary). */
function CertificateCard({ card, isRTL }: { card: CardData; isRTL: boolean }) {
  const rows: Array<[string, string, boolean]> = [
    [card.labels.work, card.work, false],
    [card.labels.artist, card.artist, false],
    [card.labels.cert, card.certNo, true],
    [card.labels.prov, card.provenance, false],
  ];
  return (
    <div
      className="relative mt-10 w-full max-w-[400px]"
      style={{ background: 'var(--ink-card)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-card)', padding: '22px 24px' }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', top: 8, insetInlineStart: 8, width: 14, height: 14, borderTop: '1px solid var(--gold)', borderInlineStart: '1px solid var(--gold)', opacity: 0.7 }} />
      <span aria-hidden="true" style={{ position: 'absolute', bottom: 8, insetInlineEnd: 8, width: 14, height: 14, borderBottom: '1px solid var(--gold)', borderInlineEnd: '1px solid var(--gold)', opacity: 0.7 }} />

      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <p className="fann-eyebrow" style={{ color: 'var(--gold)' }}>{card.eyebrow}</p>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: 'var(--gold-soft)', border: '1px solid var(--gold-edge)' }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '9999px', background: 'var(--gold)' }} />
          <span className="fann-meta" style={{ color: 'var(--gold)', fontSize: 10 }}>{card.status}</span>
        </span>
      </div>

      <dl className="mt-5 space-y-3">
        {rows.map(([label, value, mono]) => (
          <div key={label} className={`flex items-baseline justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ borderBottom: '1px solid var(--hairline)', paddingBottom: 10 }}>
            <dt className="fann-meta shrink-0" style={{ color: 'var(--bone-3)' }}>{label}</dt>
            <dd className={`m-0 text-sm ${mono ? 'fann-tnum' : ''} ${isRTL ? 'text-left' : 'text-right'}`} style={{ color: 'var(--bone)' }}>{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs" style={{ color: 'var(--bone-3)' }}>{card.footer}</p>
    </div>
  );
}

export function WhyFann({ language }: WhyFannProps) {
  const t = content[language];
  const isRTL = language === 'ar';
  const reduce = useReducedMotion();

  const list: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.1 } } };
  const row: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section
      className="fann-landing relative w-full"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'var(--ink-void)', borderTop: '1px solid var(--hairline)' }}
    >
      <div className="mx-auto grid max-w-[1280px] gap-14 px-6 py-20 md:px-10 md:py-28 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        {/* Left — heading + sample certificate */}
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <span className="fann-eyebrow" style={{ color: 'var(--gold)' }}>{t.eyebrow}</span>
          <h2 className="fann-display mt-4" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', color: 'var(--bone)' }}>
            {t.title}
          </h2>
          <p className="mt-5 max-w-[42ch] text-lg leading-relaxed" style={{ color: 'var(--bone-2)', marginInlineStart: isRTL ? 'auto' : 0 }}>
            {t.lead}
          </p>
          <a
            href="#"
            className={`fann-focus mt-6 inline-flex items-center gap-2 text-sm font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ color: 'var(--gold)' }}
          >
            {t.cta}
            <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
          </a>
          <div className={isRTL ? 'flex justify-end' : ''}>
            <CertificateCard card={t.card} isRTL={isRTL} />
          </div>
        </div>

        {/* Right — chain-of-custody thread (echoes the hero signature) */}
        <motion.ol
          variants={list}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="m-0 list-none p-0 lg:pt-2"
        >
          {t.steps.map((step, i) => {
            const Icon = step.icon;
            const last = i === t.steps.length - 1;
            return (
              <motion.li key={step.title} variants={row} className={`flex gap-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex flex-col items-center" style={{ width: 40 }}>
                  <span
                    className="grid place-items-center shrink-0"
                    style={{ width: 40, height: 40, borderRadius: '9999px', background: 'var(--ink-card)', border: '1px solid var(--gold-edge)', color: 'var(--gold)', boxShadow: 'inset 0 0 0 1px rgba(11,11,13,0.5)' }}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  {!last && (
                    <span aria-hidden="true" className="my-1 flex-1" style={{ width: 1.5, minHeight: 40, background: 'linear-gradient(to bottom, var(--gold-edge), var(--hairline))' }} />
                  )}
                </div>
                <div className={`pb-10 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-baseline gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="fann-meta fann-tnum" style={{ color: 'var(--bone-3)' }}>{isRTL ? `٠${i + 1}` : `0${i + 1}`}</span>
                    <h3 className="fann-display" style={{ fontWeight: 700, fontSize: 22, color: 'var(--bone)', lineHeight: 1.2 }}>
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed" style={{ color: 'var(--bone-2)' }}>
                    {step.desc}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </section>
  );
}
