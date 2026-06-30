import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { TokenExpiredProvider } from '@/contexts/TokenExpiredContext';
import { TokenExpiredDialog } from '@/components/TokenExpiredDialog';
import { AppRoutes } from '@/routes';
import { useTokenExpired } from '@/contexts/useTokenExpired';

// Component to render the dialog inside the providers
function AppContent() {
  const { isDialogOpen, hideDialog } = useTokenExpired();

  return (
    <>
      <AppRoutes />
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 2, 28, 0.9)',
            color: '#F2F2F3',
            border: '1px solid rgba(197, 155, 72, 0.22)',
            backdropFilter: 'blur(10px)'
          }
        }}
      />
      <TokenExpiredDialog open={isDialogOpen} onClose={hideDialog} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <TokenExpiredProvider>
          <AppContent />
        </TokenExpiredProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
