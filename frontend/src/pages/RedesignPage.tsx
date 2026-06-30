import { useLanguage } from '@/contexts/useLanguage';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroRedesign } from '@/components/landing/HeroRedesign';
import { RoleSelector } from '@/components/landing/RoleSelector';
import { WhyFann } from '@/components/landing/WhyFann';
import { HowTryFann } from '@/components/landing/HowTryFann';
import { RoleBenefits } from '@/components/landing/RoleBenefits';
import { FoundingPortal } from '@/components/landing/FoundingPortal';
import { FaqRedesign } from '@/components/landing/FaqRedesign';
import { FinalCta } from '@/components/landing/FinalCta';

/**
 * RedesignPage — preview alias of the landing redesign (no SEO head).
 * The live landing is HomePage (/); this route is kept for isolated QA.
 */
export function RedesignPage() {
  const { language } = useLanguage();
  const lang = language as 'en' | 'ar';
  const navigate = useNavigate();
  const goSignUp = (persona?: string) =>
    navigate(ROUTES.SIGN_UP, persona ? { state: { persona } } : undefined);

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: '#0B0B0D' }}>
      <LandingNav language={lang} onClaim={() => goSignUp()} onSignIn={() => navigate(ROUTES.SIGN_IN)} />
      <HeroRedesign language={lang} onClaim={() => goSignUp()} />
      <div id="roles"><RoleSelector language={lang} onSelect={(role) => goSignUp(role)} /></div>
      <div id="why"><WhyFann language={lang} /></div>
      <div id="how"><HowTryFann language={lang} /></div>
      <RoleBenefits language={lang} />
      <FoundingPortal language={lang} />
      <div id="faq"><FaqRedesign language={lang} /></div>
      <FinalCta language={lang} onClaim={() => goSignUp()} />
    </div>
  );
}
