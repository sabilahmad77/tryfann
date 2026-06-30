import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/useLanguage';
import { getSEOConfig, defaultSEO, type SEOConfig } from '@/config/seoConfig';

interface SEOHeadProps {
  customConfig?: Partial<SEOConfig>;
}

/**
 * SEOHead Component
 * 
 * Dynamically manages meta tags, OG tags, and Twitter Cards based on current route.
 * Uses React's useEffect to update document head.
 */
export function SEOHead({ customConfig }: SEOHeadProps) {
  const location = useLocation();
  const { language } = useLanguage();
  
  // Get SEO config for current route and merge with custom config
  // Memoize to prevent unnecessary re-renders
  const seoConfig: SEOConfig = useMemo(() => {
    const routeConfig = getSEOConfig(location.pathname, language);
    return {
      ...routeConfig,
      ...customConfig,
    };
  }, [location.pathname, language, customConfig]);

  useEffect(() => {
    // Update document title
    document.title = seoConfig.title || defaultSEO.title;

    // Helper function to update or create meta tag
    const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
      if (!content) return;
      
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Helper function to update or create link tag
    const updateLinkTag = (rel: string, href: string, attributes?: Record<string, string>) => {
      if (!href) return;
      
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      
      element.setAttribute('href', href);
      
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }
    };

    // Basic meta tags
    updateMetaTag('description', seoConfig.description || defaultSEO.description);
    
    if (seoConfig.keywords && seoConfig.keywords.length > 0) {
      updateMetaTag('keywords', seoConfig.keywords.join(', '));
    }

    // Language
    if (seoConfig.language) {
      updateMetaTag('language', seoConfig.language);
    }

    // Robots
    if (seoConfig.noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }

    // Open Graph tags
    updateMetaTag('og:title', seoConfig.title || defaultSEO.title, 'property');
    updateMetaTag('og:description', seoConfig.description || defaultSEO.description, 'property');
    updateMetaTag('og:type', seoConfig.ogType || 'website', 'property');
    updateMetaTag('og:image', seoConfig.ogImage || defaultSEO.ogImage || '', 'property');
    
    if (seoConfig.canonical) {
      updateMetaTag('og:url', seoConfig.canonical, 'property');
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', seoConfig.title || defaultSEO.title);
    updateMetaTag('twitter:description', seoConfig.description || defaultSEO.description);
    updateMetaTag('twitter:image', seoConfig.ogImage || defaultSEO.ogImage || '');

    // Canonical URL
    if (seoConfig.canonical) {
      updateLinkTag('canonical', seoConfig.canonical);
    }

    // Language alternates (hreflang)
    if (seoConfig.alternateLanguages && seoConfig.alternateLanguages.length > 0) {
      // Remove existing hreflang tags
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
      
      // Add new hreflang tags
      seoConfig.alternateLanguages.forEach(({ lang, url }) => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', lang);
        link.setAttribute('href', url);
        document.head.appendChild(link);
      });
    }

    // Cleanup function (optional, but good practice)
    return () => {
      // Meta tags will be updated on next render, so no cleanup needed
    };
  }, [seoConfig]);

  // This component doesn't render anything
  return null;
}

