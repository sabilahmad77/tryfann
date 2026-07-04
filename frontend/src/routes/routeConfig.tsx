import { ComponentType } from "react";
import { ROUTES } from "@/routes/paths";

// Route types
// - 'public': Accessible without token (before token is set)
// - 'private': Requires token (accessible after token is set)
export type RouteType = "public" | "private";

// Route configuration interface
export interface RouteConfig {
  path: string;
  component: () => Promise<{ default: ComponentType<Record<string, never>> }>;
  type: RouteType;
  title?: string;
  description?: string;
}

/**
 * Route Configuration
 *
 * Define all application routes here with their properties:
 * - path: URL path for the route (uses ROUTES constants from paths.ts)
 * - component: Lazy-loaded component
 * - type: 'public' (accessible without token), 'private' (requires token)
 * - title: Optional route title for documentation
 * - description: Optional route description
 *
 * Note: By default, all routes are PRIVATE (require token).
 * Only routes explicitly marked as 'public' are accessible without token.
 *
 * To change a route path, update it in src/routes/paths.ts
 */
export const routes: RouteConfig[] = [
  {
    path: ROUTES.HOME,
    component: () =>
      import("@/pages/HomePage").then((module) => ({
        default: module.HomePage,
      })),
    type: "public",
    title: "Home",
    description: "Main landing page - accessible without token",
  },
  {
    path: ROUTES.SIGN_IN,
    component: () =>
      import("@/pages/SignInPage").then((module) => ({
        default: module.SignInPage,
      })),
    type: "public",
    title: "Sign In",
    description: "User authentication page - accessible without token",
  },
  {
    path: ROUTES.SIGN_UP,
    component: () =>
      import("@/pages/SignUpPage").then((module) => ({
        default: module.SignUpPage,
      })),
    type: "public",
    title: "Sign Up",
    description: "User registration page - accessible without token",
  },
  {
    path: ROUTES.REFERRAL,
    component: () =>
      import("@/pages/ReferralLandingPage").then((module) => ({
        default: module.ReferralLandingPage,
      })),
    type: "public",
    title: "Invitation",
    description:
      "Referral landing (/ref/:code) — records the click and forwards to signup with the code prefilled (plan TECH-5)",
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    component: () =>
      import("@/pages/ForgotPasswordPage").then((module) => ({
        default: module.ForgotPasswordPage,
      })),
    type: "public",
    title: "Forgot Password",
    description: "Password reset page - accessible without token",
  },
  {
    path: ROUTES.VERIFY_EMAIL,
    component: () =>
      import("@/pages/VerifyEmailPage").then((module) => ({
        default: module.VerifyEmailPage,
      })),
    type: "public",
    title: "Verify Email",
    description: "Email verification landing page (consumes the token from the signup email link)",
  },
  {
    path: ROUTES.REFERRAL,
    component: () =>
      import("@/pages/ReferralPage").then((module) => ({
        default: module.ReferralPage,
      })),
    type: "public",
    title: "Referral",
    description: "Referral link handler - redirects to signup with referral code",
  },
  {
    path: ROUTES.ONBOARDING,
    component: () =>
      import("@/pages/OnboardingPage").then((module) => ({
        default: module.OnboardingPage,
      })),
    type: "private",
    title: "Onboarding",
    description: "User onboarding flow - requires token (private route)",
  },
  {
    path: ROUTES.DASHBOARD,
    component: () =>
      import("@/pages/DashboardPage").then((module) => ({
        default: module.DashboardPage,
      })),
    type: "private",
    title: "Dashboard",
    description: "Main dashboard page - requires token (private route)",
  },
  {
    path: ROUTES.ADMIN,
    component: () =>
      import("@/pages/AdminPage").then((module) => ({
        default: module.AdminPage,
      })),
    type: "private",
    title: "Admin CRM",
    description: "Staff-only qualification CRM (is_staff guard inside the page)",
  },
  {
    path: ROUTES.PROFILE,
    component: () =>
      import("@/pages/ProfilePage").then((module) => ({
        default: module.ProfilePage,
      })),
    type: "private",
    title: "Profile",
    description: "User profile page - requires token (private route)",
  },
  {
    path: ROUTES.PROFILE_COMPLETION,
    component: () =>
      import("@/pages/ProfileCompletionPage").then((module) => ({
        default: module.ProfileCompletionPage,
      })),
    type: "private",
    title: "Complete Profile",
    description: "Profile completion flow - requires token (private route)",
  },
  {
    path: ROUTES.SETTINGS,
    component: () =>
      import("@/pages/SettingsPage").then((module) => ({
        default: module.SettingsPage,
      })),
    type: "private",
    title: "Settings",
    description: "User settings page - requires token (private route)",
  },
  // Leaderboard route removed entirely (audit SEC-02 / plan SCORE-3): the
  // locked spec forbids any ranking surface; /qualification tiers are private.
  {
    path: ROUTES.FEEDBACK,
    component: () =>
      import("@/pages/FeedbackPage").then((module) => ({
        default: module.FeedbackPage,
      })),
    type: "private",
    title: "Feedback",
    description: "User feedback page - requires token (private route)",
  },
  {
    path: ROUTES.BUG_REPORT,
    component: () =>
      import("@/pages/BugReportPage").then((module) => ({
        default: module.BugReportPage,
      })),
    type: "private",
    title: "Bug Report",
    description: "Bug report page - requires token (private route)",
  },
  {
    path: ROUTES.CONTACT_US,
    component: () =>
      import("@/pages/ContactUsPage").then((module) => ({
        default: module.ContactUsPage,
      })),
    type: "public",
    title: "Contact Us",
    description: "Contact us page with FAQs - accessible without token",
  },
  {
    path: ROUTES.PRIVACY_TERMS,
    component: () =>
      import("@/pages/PrivacyTermsPage").then((module) => ({
        default: module.PrivacyTermsPage,
      })),
    type: "public",
    title: "Privacy & Terms",
    description: "Privacy Policy and Terms of Service combined page - accessible without token",
  },
  {
    path: ROUTES.REDESIGN,
    component: () =>
      import("@/pages/RedesignPage").then((module) => ({
        default: module.RedesignPage,
      })),
    type: "public",
    title: "Landing Redesign (preview)",
    description: "Staging surface for the premium landing redesign - additive preview, not linked from nav",
  },
  {
    path: ROUTES.DESIGN_PROOF,
    component: () =>
      import("@/pages/DesignProofPage").then((module) => ({
        default: module.DesignProofPage,
      })),
    type: "public",
    title: "Design Token Proof",
    description: "Step 1 token foundation proof — swatches + type scale, verifies every token visually",
  },
];

// Helper function to get route by path
export const getRouteByPath = (path: string): RouteConfig | undefined => {
  return routes.find((route) => route.path === path);
};

// Helper function to check if route exists
export const routeExists = (path: string): boolean => {
  return routes.some((route) => route.path === path);
};
