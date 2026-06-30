import { useLanguage } from '@/contexts/useLanguage';
import { SignIn } from '@/components/SignIn';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';

export function SignInPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <SignIn
      language={language}
      onNavigateToSignUp={() => navigate(ROUTES.SIGN_UP)}
      onNavigateToHome={() => navigate(ROUTES.HOME)}
    />
  );
}

