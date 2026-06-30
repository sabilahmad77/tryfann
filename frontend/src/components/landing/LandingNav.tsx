import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/useLanguage';
import { ROUTES } from '@/routes/paths';
import '@/styles/landing-tokens.css';

interface LandingNavProps {
  language: 'en' | 'ar';
  onClaim?: () => void;
  onSignIn?: () => void;
}

/**
 * Sticky landing nav — transparent over the hero, glass on scroll.
 * Desktop: anchor links + language toggle + sign-in + claim.
 * Mobile: hamburger drawer with the same actions.
 */
export function LandingNav({ language, onClaim, onSignIn }: LandingNavProps) {
  const isRTL = language === 'ar';
  const navigate = useNavigate();
  const { setLanguage } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const claim = () => { setOpen(false); if (onClaim) onClaim(); else navigate(ROUTES.SIGN_UP); };
  const signIn = () => { setOpen(false); if (onSignIn) onSignIn(); else navigate(ROUTES.SIGN_IN); };
  const toTop = () => { setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const go = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const links: Array<[string, string]> = isRTL
    ? [['#why', 'لماذا'], ['#how', 'الطريقة'], ['#roles', 'الأدوار'], ['#faq', 'الأسئلة']]
    : [['#why', 'Why'], ['#how', 'How'], ['#roles', 'Roles'], ['#faq', 'FAQ']];

  return (
    <header
      className="fann-landing sticky top-0 z-50 w-full transition-colors duration-300"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: scrolled ? 'rgba(11,11,13,0.80)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(180%) blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(16px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--hairline)' : 'transparent'}`,
      }}
    >
      <nav className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 py-4 md:px-10">
        <a
          href="#top"
          onClick={(e) => { e.preventDefault(); toTop(); }}
          className="fann-focus fann-display"
          style={{ fontWeight: 700, fontSize: 24, letterSpacing: '0.02em', color: 'var(--bone)' }}
        >
          F<span style={{ color: 'var(--gold)' }}>ANN</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={(e) => { e.preventDefault(); go(href); }}
              className="fann-focus text-sm transition-colors"
              style={{ color: 'var(--bone-2)' }}
            >
              {label}
            </a>
          ))}
        </div>

        <div className={`hidden items-center gap-3 md:flex ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button onClick={() => setLanguage(isRTL ? 'en' : 'ar')} aria-label={isRTL ? 'Switch to English' : 'التبديل إلى العربية'} className="fann-focus px-2 text-sm" style={{ color: 'var(--bone-2)' }}>
            {isRTL ? 'EN' : 'عربى'}
          </button>
          <button onClick={signIn} className="fann-focus rounded-full px-4 py-2 text-sm font-semibold" style={{ border: '1px solid var(--gold-edge)', color: 'var(--bone)' }}>
            {isRTL ? 'تسجيل الدخول' : 'Sign in'}
          </button>
          <button onClick={claim} className="fann-focus rounded-full px-5 py-2 text-sm font-semibold transition-transform active:scale-95" style={{ background: 'var(--gold)', color: 'var(--ink-void)' }}>
            {isRTL ? 'وصول المؤسسين' : 'Claim access'}
          </button>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="fann-focus md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          style={{ color: 'var(--bone)' }}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden" style={{ background: 'rgba(11,11,13,0.97)', borderTop: '1px solid var(--hairline)' }}>
          <div className="mx-auto flex max-w-[1280px] flex-col px-6 py-3">
            {links.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={(e) => { e.preventDefault(); go(href); }}
                className={`fann-focus py-3.5 text-base ${isRTL ? 'text-right' : 'text-left'}`}
                style={{ color: 'var(--bone)', borderBottom: '1px solid var(--hairline)' }}
              >
                {label}
              </a>
            ))}
            <div className={`mt-4 flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button onClick={() => { setLanguage(isRTL ? 'en' : 'ar'); setOpen(false); }} className="fann-focus rounded-full px-3 py-2.5 text-sm" style={{ color: 'var(--bone-2)', border: '1px solid var(--hairline)' }}>
                {isRTL ? 'EN' : 'عربى'}
              </button>
              <button onClick={signIn} className="fann-focus flex-1 rounded-full px-4 py-2.5 text-sm font-semibold" style={{ border: '1px solid var(--gold-edge)', color: 'var(--bone)' }}>
                {isRTL ? 'تسجيل الدخول' : 'Sign in'}
              </button>
              <button onClick={claim} className="fann-focus flex-1 rounded-full px-4 py-2.5 text-sm font-semibold" style={{ background: 'var(--gold)', color: 'var(--ink-void)' }}>
                {isRTL ? 'وصول المؤسسين' : 'Claim access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
