import { ReactNode } from 'react';
import { PublicRoute } from '@/routes/PublicRoute';
import { PrivateRoute } from '@/routes/PrivateRoute';
import type { RouteType } from '@/routes/routeConfig';

interface RouteWrapperProps {
  type: RouteType;
  children: ReactNode;
}

/**
 * RouteWrapper Component
 * 
 * Automatically wraps routes with appropriate protection based on route type:
 * - 'public': Accessible without token (before token is set)
 * - 'private': Requires token (accessible after token is set)
 * 
 * Note: By default, all routes are PRIVATE. Only routes explicitly marked as 'public' 
 * are accessible without token.
 */
export function RouteWrapper({ type, children }: RouteWrapperProps) {
  if (type === 'public') {
    return <PublicRoute>{children}</PublicRoute>;
  }
  
  // Default to private (requires token)
  return <PrivateRoute>{children}</PrivateRoute>;
}

