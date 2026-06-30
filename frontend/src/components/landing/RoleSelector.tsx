import { motion, useReducedMotion, type Variants } from 'motion/react';
import { Paintbrush, Landmark, Frame, Eye, Gem, Share2, ArrowRight, type LucideIcon } from 'lucide-react';

interface RoleSelectorProps {
  language: 'en' | 'ar';
  onSelect?: (role: string) => void;
}

interface Role {
  key: string;
  num: string;
  icon: LucideIcon;
  name: string;
  desc: string;
}

const content: Record<'en' | 'ar', { eyebrow: string; title: string; lead: string; apply: string; roles: Role[] }> = {
  en: {
    eyebrow: 'Enter by who you are',
    title: 'Six ways in.',
    lead: 'TryFann is application-based. Choose your path — each role is reviewed on its own terms.',
    apply: 'Apply',
    roles: [
      { key: 'artist', num: '01', icon: Paintbrush, name: 'Artist', desc: 'List verified work and earn resale royalties on every future sale.' },
      { key: 'gallery', num: '02', icon: Landmark, name: 'Gallery', desc: 'Bring your roster to a provenance-first market, with concierge onboarding.' },
      { key: 'collector', num: '03', icon: Frame, name: 'Collector', desc: 'Buy with certificates of authenticity and a clear chain of custody.' },
      { key: 'curator', num: '04', icon: Eye, name: 'Curator', desc: 'Shape collections and vouch for authenticity across the platform.' },
      { key: 'investor', num: '05', icon: Gem, name: 'Investor', desc: 'Back the founding cohort of a verified market for physical art.' },
      { key: 'ambassador', num: '06', icon: Share2, name: 'Ambassador', desc: 'Introduce the artists and collectors you already trust.' },
    ],
  },
  ar: {
    eyebrow: 'ادخل حسب هويتك',
    title: 'ست طرق للدخول.',
    lead: 'TryFann قائم على التقديم. اختر مسارك — تُراجَع كل فئة وفق معاييرها.',
    apply: 'ابدأ',
    roles: [
      { key: 'artist', num: '٠١', icon: Paintbrush, name: 'الفنان', desc: 'اعرض أعمالًا موثّقة واكسب إتاوات إعادة البيع على كل بيع مستقبلي.' },
      { key: 'gallery', num: '٠٢', icon: Landmark, name: 'المعرض', desc: 'قدّم مجموعتك إلى سوق يضع المصداقية أولًا، مع إعداد مخصّص.' },
      { key: 'collector', num: '٠٣', icon: Frame, name: 'الجامِع', desc: 'اشترِ بشهادات أصالة وسلسلة حيازة واضحة.' },
      { key: 'curator', num: '٠٤', icon: Eye, name: 'المنسّق', desc: 'شكّل المجموعات واشهد على الأصالة عبر المنصة.' },
      { key: 'investor', num: '٠٥', icon: Gem, name: 'المستثمر', desc: 'ادعم مجموعة المؤسسين لسوق موثوق للفن المادي.' },
      { key: 'ambassador', num: '٠٦', icon: Share2, name: 'السفير', desc: 'قدّم الفنانين والجامعين الذين تثق بهم.' },
    ],
  },
};

export function RoleSelector({ language, onSelect }: RoleSelectorProps) {
  const t = content[language];
  const isRTL = language === 'ar';
  const reduce = useReducedMotion();

  const grid: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.06 } },
  };
  const cell: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section
      className="fann-landing relative w-full"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'var(--ink-panel)', borderTop: '1px solid var(--hairline)' }}
    >
      <div className="mx-auto max-w-[1280px] px-6 py-20 md:px-10 md:py-28">
        {/* Header */}
        <div className={`max-w-2xl ${isRTL ? 'ml-auto text-right' : 'text-left'}`}>
          <span className="fann-eyebrow" style={{ color: 'var(--gold)' }}>{t.eyebrow}</span>
          <h2 className="fann-display mt-4" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', color: 'var(--bone)' }}>
            {t.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed" style={{ color: 'var(--bone-2)' }}>{t.lead}</p>
        </div>

        {/* Catalogue grid — connected cells divided by hairlines */}
        <motion.ul
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 grid list-none grid-cols-1 gap-px p-0 sm:grid-cols-2 lg:grid-cols-3"
          style={{ background: 'var(--hairline)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}
        >
          {t.roles.map((role) => {
            const Icon = role.icon;
            return (
              <motion.li key={role.key} variants={cell}>
                <button
                  type="button"
                  onClick={() => onSelect?.(role.key)}
                  className="fann-focus group relative flex h-full w-full flex-col p-7 text-start transition-colors"
                  style={{ background: 'var(--ink-panel)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ink-card)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ink-panel)')}
                >
                  {/* gold reveal edge on hover (top) */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    style={{ height: 2, background: 'var(--gold)' }}
                  />
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="fann-meta fann-tnum" style={{ color: 'var(--gold)' }}>{role.num}</span>
                    <Icon className="h-5 w-5" style={{ color: 'var(--bone-3)' }} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h3 className="fann-display mt-6" style={{ fontWeight: 700, fontSize: 26, color: 'var(--bone)' }}>
                    {role.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--bone-2)' }}>{role.desc}</p>
                  <span
                    className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}
                    style={{ color: 'var(--gold)' }}
                  >
                    {t.apply}
                    <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                  </span>
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
