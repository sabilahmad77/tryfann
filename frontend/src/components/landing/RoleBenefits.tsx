import { motion, useReducedMotion, type Variants } from 'motion/react';

interface RoleBenefitsProps {
  language: 'en' | 'ar';
}

interface Entry {
  role: string;
  benefit: string;
}

interface Group {
  label: string;
  heading: string;
  entries: Entry[];
}

const content: Record<'en' | 'ar', { eyebrow: string; title: string; lead: string; groups: [Group, Group] }> = {
  en: {
    eyebrow: 'Role benefits',
    title: 'Built for both sides of trust.',
    lead: 'FANN optimizes for qualified supply meeting verified demand — never raw signups. Here is what each side gets.',
    groups: [
      {
        label: 'Supply',
        heading: 'Those who bring the art',
        entries: [
          { role: 'Artist', benefit: 'Sell verified work and earn resale royalties on every future sale.' },
          { role: 'Gallery', benefit: 'List your roster with concierge onboarding and verified-seller status.' },
          { role: 'Curator', benefit: 'Shape collections, vouch for authenticity, and gain recognition.' },
        ],
      },
      {
        label: 'Demand',
        heading: 'Those who collect and champion',
        entries: [
          { role: 'Collector', benefit: 'Buy with a certificate of authenticity and chain of custody on every work.' },
          { role: 'Investor', benefit: 'Back the founding cohort with a direct line to the curatorial team.' },
          { role: 'Ambassador', benefit: 'Introduce people you trust — credited only once they are verified.' },
        ],
      },
    ],
  },
  ar: {
    eyebrow: 'مزايا الأدوار',
    title: 'مبنيّ لطرفَي الثقة.',
    lead: 'تركّز FANN على لقاء العرض المؤهّل بالطلب الموثوق — لا على عدد التسجيلات. إليك ما يحصل عليه كل طرف.',
    groups: [
      {
        label: 'العرض',
        heading: 'من يقدّم الفن',
        entries: [
          { role: 'الفنان', benefit: 'بِع أعمالًا موثقة واكسب إتاوات إعادة البيع على كل بيع مستقبلي.' },
          { role: 'المعرض', benefit: 'اعرض مجموعتك مع إعداد مخصّص وحالة بائع موثّق.' },
          { role: 'المنسّق', benefit: 'شكّل المجموعات، واشهد على الأصالة، واحصل على التقدير.' },
        ],
      },
      {
        label: 'الطلب',
        heading: 'من يجمع ويناصر',
        entries: [
          { role: 'الجامِع', benefit: 'اشترِ بشهادة أصالة وسلسلة حيازة على كل عمل.' },
          { role: 'المستثمر', benefit: 'ادعم مجموعة المؤسسين مع تواصل مباشر مع فريق التنسيق.' },
          { role: 'السفير', benefit: 'قدّم من تثق بهم — ويُحتسب لك فقط عند توثيقهم.' },
        ],
      },
    ],
  },
};

export function RoleBenefits({ language }: RoleBenefitsProps) {
  const t = content[language];
  const isRTL = language === 'ar';
  const reduce = useReducedMotion();

  const wrap: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.08 } } };
  const entry: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section
      className="fann-landing relative w-full"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'var(--ink-void)', borderTop: '1px solid var(--hairline)' }}
    >
      <div className="mx-auto max-w-[1280px] px-6 py-20 md:px-10 md:py-28">
        <div className={`max-w-2xl ${isRTL ? 'ml-auto text-right' : 'text-left'}`}>
          <span className="fann-eyebrow" style={{ color: 'var(--gold)' }}>{t.eyebrow}</span>
          <h2 className="fann-display mt-4" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', color: 'var(--bone)' }}>
            {t.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed" style={{ color: 'var(--bone-2)' }}>{t.lead}</p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden md:grid-cols-2" style={{ background: 'var(--hairline)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)' }}>
          {t.groups.map((group) => (
            <motion.div
              key={group.label}
              variants={wrap}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="p-8 md:p-10"
              style={{ background: 'var(--ink-panel)' }}
            >
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span style={{ width: 24, height: 2, background: 'var(--gold)' }} aria-hidden="true" />
                <span className="fann-eyebrow" style={{ color: 'var(--gold)' }}>{group.label}</span>
              </div>
              <h3 className="fann-display mt-3" style={{ fontWeight: 700, fontSize: 24, color: 'var(--bone)' }}>
                {group.heading}
              </h3>

              <ul className="mt-7 m-0 list-none p-0">
                {group.entries.map((e, i) => (
                  <motion.li
                    key={e.role}
                    variants={entry}
                    className={`group py-5 ${isRTL ? 'text-right' : 'text-left'}`}
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--hairline)' }}
                  >
                    <div
                      className="transition-all duration-200"
                      style={{ paddingInlineStart: 0 }}
                    >
                      <h4 className="fann-display" style={{ fontWeight: 600, fontSize: 19, color: 'var(--bone)' }}>
                        {e.role}
                      </h4>
                      <p className="mt-1.5 max-w-[44ch] text-[15px] leading-relaxed" style={{ color: 'var(--bone-2)', marginInlineStart: isRTL ? 'auto' : 0 }}>
                        {e.benefit}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
