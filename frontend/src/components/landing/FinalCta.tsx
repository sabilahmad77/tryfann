import { motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowRight, Linkedin, Instagram, Youtube, Twitter } from 'lucide-react';

interface FinalCtaProps {
  language: 'en' | 'ar';
  onClaim?: () => void;
}

const content = {
  en: {
    eyebrow: 'Founding cohort · capped',
    title: 'Claim founding access.',
    lead: 'Apply in a few minutes. A person reviews every application — usually within seven working days.',
    primary: 'Claim founding access',
    secondary: 'Talk to the team',
    reassure: 'No payment · Application-based · Capped cohort',
    tagline: 'The early-access gateway to FANN — a verified marketplace for physical art.',
    columns: [
      { head: 'Explore', links: ['Why FANN', 'How it works', 'Roles', 'FAQ'] },
      { head: 'Apply', links: ['Artist', 'Gallery', 'Collector', 'Curator'] },
      { head: 'Company', links: ['About', 'Contact', 'Privacy', 'Terms'] },
    ],
    rights: '© 2026 FANN. All rights reserved.',
  },
  ar: {
    eyebrow: 'مجموعة المؤسسين · محدودة',
    title: 'احصل على وصول المؤسسين.',
    lead: 'قدّم في دقائق. يراجع شخصٌ كل طلب — عادةً خلال سبعة أيام عمل.',
    primary: 'احصل على وصول المؤسسين',
    secondary: 'تحدّث إلى الفريق',
    reassure: 'بلا دفع · بالتقديم · مجموعة محدودة',
    tagline: 'بوابة الوصول المبكر إلى FANN — سوق موثوق للفن المادي.',
    columns: [
      { head: 'استكشف', links: ['لماذا FANN', 'كيف يعمل', 'الأدوار', 'الأسئلة'] },
      { head: 'تقديم', links: ['الفنان', 'المعرض', 'الجامِع', 'المنسّق'] },
      { head: 'الشركة', links: ['عن FANN', 'تواصل', 'الخصوصية', 'الشروط'] },
    ],
    rights: '© ٢٠٢٦ FANN. جميع الحقوق محفوظة.',
  },
};

const socials = [
  { Icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/company/fannarttech' },
  { Icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/fannarttech' },
  { Icon: Twitter, label: 'X', href: 'https://x.com/fannarttech' },
  { Icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/@fannarttech' },
];

export function FinalCta({ language, onClaim }: FinalCtaProps) {
  const t = content[language];
  const isRTL = language === 'ar';
  const reduce = useReducedMotion();

  const rise: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <footer className="fann-landing relative w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Closing CTA — deepest band, the final "viewing room" moment */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'var(--ink-void)', borderTop: '1px solid var(--hairline)' }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(50% 60% at 50% 0%, var(--gold-soft) 0%, transparent 60%)' }}
        />
        <motion.div
          variants={rise}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="relative mx-auto max-w-[760px] px-6 py-24 text-center md:py-32"
        >
          <span className="fann-eyebrow" style={{ color: 'var(--gold)' }}>{t.eyebrow}</span>
          <h2 className="fann-display mx-auto mt-5" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', color: 'var(--bone)' }}>
            {t.title}
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-lg leading-relaxed" style={{ color: 'var(--bone-2)' }}>
            {t.lead}
          </p>
          <div className={`mt-9 flex flex-wrap items-center justify-center gap-3`}>
            <button
              type="button"
              onClick={onClaim}
              className="fann-focus group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-transform active:scale-95"
              style={{ background: 'var(--gold)', color: 'var(--ink-void)', boxShadow: '0 8px 25px rgba(197,155,72,0.3)' }}
            >
              {t.primary}
              <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </button>
            <a
              href="#"
              className="fann-focus inline-flex items-center rounded-full px-6 py-3.5 text-sm font-semibold"
              style={{ border: '1px solid var(--gold-edge)', color: 'var(--bone)' }}
            >
              {t.secondary}
            </a>
          </div>
          <p className="fann-meta mt-7" style={{ color: 'var(--bone-3)' }}>{t.reassure}</p>
        </motion.div>
      </section>

      {/* Footer — real channels only */}
      <div style={{ background: 'var(--ink-panel)', borderTop: '1px solid var(--hairline)' }}>
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-10">
          <div className={`flex flex-col gap-12 md:flex-row md:justify-between ${isRTL ? 'md:flex-row-reverse text-right' : ''}`}>
            {/* brand */}
            <div className="max-w-xs">
              <span className="fann-display" style={{ fontWeight: 700, fontSize: 26, color: 'var(--bone)' }}>
                F<span style={{ color: 'var(--gold)' }}>ANN</span>
              </span>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--bone-3)' }}>{t.tagline}</p>
              <div className={`mt-6 flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {socials.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="fann-focus grid place-items-center transition-colors"
                    style={{ width: 38, height: 38, borderRadius: '9999px', border: '1px solid var(--hairline)', color: 'var(--bone-2)' }}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                  </a>
                ))}
              </div>
            </div>

            {/* link columns */}
            <div className={`grid grid-cols-2 gap-10 sm:grid-cols-3 ${isRTL ? 'text-right' : ''}`}>
              {t.columns.map((col) => (
                <div key={col.head}>
                  <h3 className="fann-eyebrow" style={{ color: 'var(--gold)' }}>{col.head}</h3>
                  <ul className="mt-4 m-0 list-none space-y-2.5 p-0">
                    {col.links.map((l) => (
                      <li key={l}>
                        <a href="#" className="fann-focus text-sm transition-colors" style={{ color: 'var(--bone-2)' }}>{l}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`mt-12 flex flex-col gap-3 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse text-right' : ''}`}
            style={{ borderTop: '1px solid var(--hairline)', color: 'var(--bone-3)' }}
          >
            <span>{t.rights}</span>
            <span className="fann-meta" style={{ color: 'var(--bone-3)' }}>Pre-launch</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
