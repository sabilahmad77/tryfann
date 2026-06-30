import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { routes } from '@/routes/routeConfig';
import { RouteWrapper } from '@/routes/RouteWrapper';
import { ROUTES } from '@/routes/paths';

// Loading component
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-[#C59B48]/30 border-t-[#C59B48] rounded-full animate-spin" />
        <p className="text-white/70">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Application Routes
 * 
 * Dynamically generates routes from route configuration.
 * Routes are automatically wrapped with appropriate protection based on their type.
 * 
 * To add a new route:
 * 1. Create the page component in src/pages/
 * 2. Add route configuration to src/routes/routeConfig.tsx
 * 3. The route will be automatically included here
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {routes.map((route) => {
          const LazyComponent = lazy(route.component);
          
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <RouteWrapper type={route.type}>
                  <LazyComponent />
                </RouteWrapper>
              }
            />
          );
        })}
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </Suspense>
  );
}

