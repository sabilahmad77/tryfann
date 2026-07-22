import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { TokenExpiredProvider } from '@/contexts/TokenExpiredContext';
import { TokenExpiredDialog } from '@/components/TokenExpiredDialog';
import { AppRoutes } from '@/routes';
import { useTokenExpired } from '@/contexts/useTokenExpired';
import { ConsentBanner } from '@/components/ConsentBanner';
import { initAnalytics, track, EVENTS } from '@/utils/analytics';

// Component to render the dialog inside the providers
function AppContent() {
  const { isDialogOpen, hideDialog } = useTokenExpired();
  const { pathname } = useLocation();

  // P0-4: wire GA (only if consent already granted) once on mount.
  useEffect(() => {
    initAnalytics();
  }, []);

  // P0-4: fire a page_view on every route change (funnel top-of-loop).
  useEffect(() => {
    track(EVENTS.PAGE_VIEW, { path: pathname });
  }, [pathname]);

  // A5: dismiss any lingering toast (e.g. a failed-quiz "N/M correct" message)
  // when the route changes, so a stale toast can't follow the user to the next
  // page. sonner toasts are global and otherwise persist across navigation.
  useEffect(() => {
    toast.dismiss();
  }, [pathname]);

  return (
    <>
      <AppRoutes />
      <ConsentBanner />
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
