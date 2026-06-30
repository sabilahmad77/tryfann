import { motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import heroArtwork from '@/assets/landing/hero-artwork-cc0.jpg';
import '@/styles/landing-tokens.css';

interface HeroRedesignProps {
  language: 'en' | 'ar';
  onClaim?: () => void;
}

const content = {
  en: {
    eyebrow: 'Founding access · Pre-launch',
    headlineTop: 'Own art you can',
    headlineAccent: 'prove.',
    lead:
      'Founding access to FANN — a verified marketplace for physical art. Provenance-first records, resale royalties, and certificate-backed ownership.',
    ctaPrimary: 'Claim founding access',
    ctaSecondary: 'See how verification works',
    trust: ['Pre-launch', 'Application-based', 'Founding cohort capped'],
    cert: {
      eyebrow: 'Certificate of authenticity',
      title: 'Flower Still-Life with a Curtain',
      meta: 'Adriaen van der Spelt · 1658 · Oil on panel',
      lot: 'Lot 042',
      chain: ['Artist', 'Gallery', 'Auction', 'Verified'],
      seal: 'FANN verified',
    },
    artworkAlt:
      'Flower Still-Life with a Curtain by Adriaen van der Spelt, 1658 — public domain, via Wikimedia Commons.',
  },
  ar: {
    eyebrow: 'وصول المؤسسين · قبل الإطلاق',
    headlineTop: 'امتلك فنًا',
    headlineAccent: 'يمكنك إثباته.',
    lead:
      'وصول المؤسسين إلى FANN — سوق موثوق للفن المادي. سجلات المصداقية أولًا، وإتاوات إعادة البيع، وملكية مدعومة بشهادة.',
    ctaPrimary: 'احصل على وصول المؤسسين',
    ctaSecondary: 'كيف يعمل التحقق',
    trust: ['قبل الإطلاق', 'بالتقديم والمراجعة', 'مقاعد المؤسسين محدودة'],
    cert: {
      eyebrow: 'شهادة أصالة',
      title: 'طبيعة صامتة بالزهور والستارة',
      meta: 'أدريان فان دير سبيلت · ١٦٥٨ · زيت على لوح',
      lot: 'القطعة ٠٤٢',
      chain: ['الفنان', 'المعرض', 'المزاد', 'موثّق'],
      seal: 'موثّق · FANN',
    },
    artworkAlt:
      'طبيعة صامتة بالزهور والستارة لأدريان فان دير سبيلت، ١٦٥٨ — ملكية عامة، عبر ويكيميديا كومنز.',
  },
};

/** Gold intaglio-style authentication seal (CSS + SVG, no emoji). */
function VerificationSeal({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative grid place-items-center shrink-0"
        style={{
          width: 52,
          height: 52,
          borderRadius: '9999px',
          background: 'radial-gradient(circle at 38% 32%, var(--gold-hi), var(--gold-deep))',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.25)',
        }}
        aria-hidden="true"
      >
        <div
          style={{
            position: 'absolute',
            inset: 5,
            borderRadius: '9999px',
            border: '1px solid rgba(11,11,13,0.45)',
          }}
        />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L12 15.77 6.8 18.5l.99-5.78-4.21-4.1 5.82-.85L12 2.5z"
            fill="#0B0B0D"
            fillOpacity="0.82"
          />
        </svg>
      </div>
      <span className="fann-meta" style={{ color: 'var(--gold)' }}>
        {label}
      </span>
    </div>
  );
}

export function HeroRedesign({ language, onClaim }: HeroRedesignProps) {
  const t = content[language];
  const isRTL = language === 'ar';
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  const claim = () => (onClaim ? onClaim() : navigate(ROUTES.SIGN_UP));
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: reduce ? 0 : 0.05 },
    },
  };
  const rise: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };
  const diptych: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section
      className="fann-landing relative w-full overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'var(--ink-void)' }}
    >
      {/* Atmospheric depth: faint gold pin-light + vignette (not a busy photo) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 78% 28%, var(--gold-soft) 0%, transparent 60%), radial-gradient(80% 60% at 50% 120%, rgba(0,0,0,0.6) 0%, transparent 70%)',
        }}
      />

      {/* Hero body — asymmetric editorial split (nav lives in LandingNav) */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto grid max-w-[1280px] items-center gap-12 px-6 pb-24 pt-12 md:px-10 md:pb-32 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16"
      >
        {/* Left — thesis */}
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <motion.span
            variants={rise}
            className="fann-eyebrow inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{ border: '1px solid var(--gold-edge)', background: 'var(--gold-soft)', color: 'var(--gold)' }}
          >
            <span
              style={{ width: 6, height: 6, borderRadius: '9999px', background: 'var(--gold)', boxShadow: '0 0 0 4px var(--gold-soft)' }}
            />
            {t.eyebrow}
          </motion.span>

          <motion.h1
            variants={rise}
            className="fann-display mt-7"
            style={{ fontSize: 'clamp(2.75rem, 6vw, 5rem)', color: 'var(--bone)' }}
          >
            {t.headlineTop}{' '}
            <span className="fann-display-italic" style={{ color: 'var(--gold)' }}>
              {t.headlineAccent}
            </span>
          </motion.h1>

          <motion.p
            variants={rise}
            className="mt-6 max-w-[42ch] text-lg leading-relaxed"
            style={{ color: 'var(--bone-2)', marginInline: isRTL ? '0 0' : undefined }}
          >
            {t.lead}
          </motion.p>

          <motion.div
            variants={rise}
            className={`mt-9 flex flex-wrap items-center gap-3 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}
          >
            <button
              type="button"
              onClick={claim}
              className="fann-focus group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-transform active:scale-95"
              style={{ background: 'var(--gold)', color: 'var(--ink-void)', boxShadow: '0 8px 25px rgba(197,155,72,0.3)' }}
            >
              {t.ctaPrimary}
              <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </button>
            <a
              href="#why"
              onClick={(e) => { e.preventDefault(); scrollTo('#why'); }}
              className="fann-focus inline-flex items-center rounded-full px-6 py-3.5 text-sm font-semibold transition-colors"
              style={{ border: '1px solid var(--gold-edge)', color: 'var(--bone)' }}
            >
              {t.ctaSecondary}
            </a>
          </motion.div>

          <motion.div
            variants={rise}
            className={`mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}
          >
            {t.trust.map((item, i) => (
              <div key={item} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="fann-meta" style={{ color: 'var(--bone-3)' }}>{item}</span>
                {i < t.trust.length - 1 && (
                  <span style={{ width: 4, height: 4, borderRadius: '9999px', background: 'var(--bone-3)' }} aria-hidden="true" />
                )}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — THE SIGNATURE: Provenance Diptych */}
        <motion.div variants={diptych} className="relative mx-auto w-full max-w-[460px]">
          {/* Artwork, gold-edged frame, the one real shadow */}
          <figure
            className="relative m-0 overflow-hidden"
            style={{
              borderRadius: 'var(--r-lg)',
              padding: 14,
              background: 'linear-gradient(160deg, #1c1a16, #0e0d0b)',
              border: '1px solid var(--gold-edge)',
              boxShadow: 'var(--shadow-artwork)',
            }}
          >
            <img
              src={heroArtwork}
              alt={t.artworkAlt}
              width={1280}
              height={923}
              loading="eager"
              className="block h-auto w-full"
              style={{ borderRadius: 6, aspectRatio: '1280 / 923', objectFit: 'cover' }}
            />
          </figure>

          {/* Certificate panel — overlaps the artwork's bottom corner */}
          <div
            className={`relative ${isRTL ? 'mr-auto -mt-10 ml-6 text-right' : 'ml-auto -mt-10 mr-6 text-left'}`}
            style={{
              maxWidth: 320,
              background: 'var(--ink-card)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--shadow-card)',
              padding: '20px 22px',
            }}
          >
            {/* gold corner ticks */}
            <span aria-hidden="true" style={{ position: 'absolute', top: 8, left: 8, width: 14, height: 14, borderTop: '1px solid var(--gold)', borderLeft: '1px solid var(--gold)', opacity: 0.7 }} />
            <span aria-hidden="true" style={{ position: 'absolute', bottom: 8, right: 8, width: 14, height: 14, borderBottom: '1px solid var(--gold)', borderRight: '1px solid var(--gold)', opacity: 0.7 }} />

            <p className="fann-eyebrow" style={{ color: 'var(--gold)' }}>{t.cert.eyebrow}</p>
            <p className="fann-display mt-3" style={{ fontWeight: 700, fontSize: 20, color: 'var(--bone)', lineHeight: 1.2 }}>
              {t.cert.title}
            </p>
            <p className="fann-tnum mt-1 text-xs" style={{ color: 'var(--bone-2)' }}>{t.cert.meta}</p>

            {/* chain of custody */}
            <div className={`mt-5 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              {t.cert.chain.map((node, i) => {
                const verified = i === t.cert.chain.length - 1;
                return (
                  <div key={node} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full items-center">
                      {i !== 0 && <span className="h-px flex-1" style={{ background: 'var(--hairline)' }} />}
                      <span
                        style={{
                          width: verified ? 11 : 8,
                          height: verified ? 11 : 8,
                          borderRadius: '9999px',
                          background: verified ? 'var(--gold)' : 'transparent',
                          border: `1px solid ${verified ? 'var(--gold)' : 'var(--bone-3)'}`,
                          boxShadow: verified ? '0 0 0 3px var(--gold-soft)' : 'none',
                        }}
                      />
                      {i !== t.cert.chain.length - 1 && <span className="h-px flex-1" style={{ background: 'var(--hairline)' }} />}
                    </div>
                    <span style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: verified ? 'var(--gold)' : 'var(--bone-3)' }}>
                      {node}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between" style={{ borderTop: '1px solid var(--hairline)', paddingTop: 16 }}>
              <VerificationSeal label={t.cert.seal} />
              <span className="fann-meta fann-tnum" style={{ color: 'var(--bone-3)' }}>{t.cert.lot}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
