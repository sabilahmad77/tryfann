/**
 * Route Paths Configuration
 * 
 * Centralized route path definitions.
 * Change paths here and they will update throughout the entire application.
 * 
 * Usage:
 *   import { ROUTES } from '@/routes/paths';
 *   navigate(ROUTES.SIGN_IN);
 *   <Link to={ROUTES.HOME}>Home</Link>
 */

export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_EMAIL: '/verify-email',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  PROFILE: '/profile',
  PROFILE_COMPLETION: '/complete-profile',
  SETTINGS: '/settings',
  // LEADERBOARD removed — no ranking surface exists (audit SEC-02).
  FEEDBACK: '/feedback',
  REFERRAL: '/ref/:code',
  BUG_REPORT: '/bug-report',
  CONTACT_US: '/contact-us',
  PRIVACY_TERMS: '/privacy-terms',
  REDESIGN: '/redesign',
  DESIGN_PROOF: '/design-proof',
} as const;

/**
 * Type-safe route paths
 */
export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

/**
 * Helper function to get route path by key
 * Useful for dynamic route access
 */
export const getRoutePath = (key: keyof typeof ROUTES): RoutePath => {
  return ROUTES[key];
};

/**
 * Reverse lookup: Get route key by path
 * Useful for checking which route matches a path
 */
export const getRouteKeyByPath = (path: string): keyof typeof ROUTES | undefined => {
  return Object.keys(ROUTES).find(
    (key) => ROUTES[key as keyof typeof ROUTES] === path
  ) as keyof typeof ROUTES | undefined;
};

