import { ForgotPassword } from '@/components/ForgotPassword';
import { ROUTES } from '@/routes/paths';
import { useNavigate } from 'react-router-dom';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <ForgotPassword
      onNavigateToSignIn={() => navigate(ROUTES.SIGN_IN)}
      onNavigateToHome={() => navigate(ROUTES.HOME)}
    />
  );
}

