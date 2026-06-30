/**
 * SEO Configuration System
 * 
 * Centralized SEO metadata for all routes.
 * Supports multi-language (EN/AR) and dynamic content.
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonical?: string;
  noindex?: boolean;
  language?: 'en' | 'ar';
  alternateLanguages?: Array<{ lang: string; url: string }>;
}

/**
 * Base URL for generating absolute URLs
 */
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for SSR or build time
  return process.env.VITE_APP_URL || 'https://tryfann.com';
};

/**
 * Default OG image
 */
const defaultOGImage = `${getBaseUrl()}/og-image.jpg`;

/**
 * SEO configuration per route
 */
export const seoConfig: Record<string, (lang?: 'en' | 'ar') => SEOConfig> = {
  // Homepage / Landing Page
  '/': (lang = 'en') => ({
    title: lang === 'ar'
      ? 'TryFANN — وصول المؤسسين إلى سوق الفن الموثوق'
      : 'TryFANN — Founding access to the verified art marketplace',
    description: lang === 'ar'
      ? 'وصول المؤسسين إلى FANN — سوق موثوق للفن المادي مع سجلات المصداقية أولًا، وملكية مدعومة بشهادة، وإتاوات إعادة البيع. قدّم لمجموعة المؤسسين.'
      : 'Founding access to FANN — a verified marketplace for physical art with provenance-first records, certificate-backed ownership, and resale royalties. Apply for the founding cohort.',
    keywords: lang === 'ar'
      ? ['FANN', 'فن موثق', 'سوق الفن', 'فن مادي', 'مصداقية', 'إتاوات إعادة البيع', 'مؤسس', 'TryFANN']
      : ['FANN', 'verified art', 'art marketplace', 'physical art', 'provenance', 'resale royalties', 'founder', 'TryFANN', 'art authentication'],
    ogImage: defaultOGImage,
    ogType: 'website',
    canonical: `${getBaseUrl()}/`,
    language: lang,
    alternateLanguages: [
      { lang: 'en', url: `${getBaseUrl()}/` },
      { lang: 'ar', url: `${getBaseUrl()}/?lang=ar` },
    ],
  }),

  // Sign Up Page
  '/signup': (lang = 'en') => ({
    title: lang === 'ar'
      ? 'انضم إلى TryFANN | ابدأ رحلتك كفنان أو جامع أو معرض'
      : 'Join TryFANN | Start Your Journey as Artist, Collector, or Gallery',
    description: lang === 'ar'
      ? 'انضم إلى TryFANN واختر مسارك: فنان، جامع، معرض، أو سفير. ابدأ رحلتك واكتسب مزايا المؤسس.'
      : 'Join TryFANN and choose your path: Artist, Collector, Gallery, or Ambassador. Start your journey and earn founder advantages.',
    keywords: lang === 'ar'
      ? ['انضم', 'تسجيل', 'فنان', 'جامع', 'معرض', 'TryFANN']
      : ['sign up', 'join', 'artist', 'collector', 'gallery', 'TryFANN', 'register'],
    ogImage: defaultOGImage,
    ogType: 'website',
    canonical: `${getBaseUrl()}/signup`,
    language: lang,
    noindex: true, // Don't index signup page
  }),

  // Sign In Page
  '/signin': (lang = 'en') => ({
    title: lang === 'ar'
      ? 'تسجيل الدخول - TryFANN'
      : 'Sign In - TryFANN',
    description: lang === 'ar'
      ? 'سجل الدخول إلى حسابك في TryFANN'
      : 'Sign in to your TryFANN account',
    ogImage: defaultOGImage,
    ogType: 'website',
    canonical: `${getBaseUrl()}/signin`,
    language: lang,
    noindex: true, // Don't index signin page
  }),

  // Dashboard
  '/dashboard': (lang = 'en') => ({
    title: lang === 'ar'
      ? 'لوحة التحكم - TryFANN'
      : 'Dashboard - TryFANN',
    description: lang === 'ar'
      ? 'إدارة حسابك وتتبع تقدمك في TryFANN'
      : 'Manage your account and track your progress on TryFANN',
    ogImage: defaultOGImage,
    ogType: 'website',
    canonical: `${getBaseUrl()}/dashboard`,
    language: lang,
    noindex: true, // Don't index dashboard (private)
  }),

  // Profile
  '/profile': (lang = 'en') => ({
    title: lang === 'ar'
      ? 'الملف الشخصي - TryFANN'
      : 'Profile - TryFANN',
    description: lang === 'ar'
      ? 'عرض وتعديل ملفك الشخصي في TryFANN'
      : 'View and edit your TryFANN profile',
    ogImage: defaultOGImage,
    ogType: 'website',
    canonical: `${getBaseUrl()}/profile`,
    language: lang,
    noindex: true, // Don't index profile (private)
  }),
};

/**
 * Get SEO config for a route
 */
export const getSEOConfig = (path: string, lang: 'en' | 'ar' = 'en'): SEOConfig => {
  // Normalize path (remove query params, hash)
  const normalizedPath = path.split('?')[0].split('#')[0];
  
  // Get config function for this path
  const configFn = seoConfig[normalizedPath] || seoConfig['/'];
  
  // Get config with language
  const config = configFn(lang);
  
  // Ensure canonical URL is absolute
  if (config.canonical && !config.canonical.startsWith('http')) {
    config.canonical = `${getBaseUrl()}${config.canonical}`;
  }
  
  // Ensure OG image is absolute
  if (config.ogImage && !config.ogImage.startsWith('http')) {
    config.ogImage = `${getBaseUrl()}${config.ogImage}`;
  }
  
  return config;
};

/**
 * Default/fallback SEO config
 */
export const defaultSEO: SEOConfig = {
  title: 'TryFANN — Founding access to the verified art marketplace',
  description: 'Founding access to FANN — a verified marketplace for physical art with provenance-first records, certificate-backed ownership, and resale royalties.',
  keywords: ['FANN', 'verified art', 'art marketplace', 'TryFANN'],
  ogImage: defaultOGImage,
  ogType: 'website',
  language: 'en',
};

