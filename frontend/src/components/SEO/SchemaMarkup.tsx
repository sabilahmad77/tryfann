import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SchemaMarkup Component
 * 
 * Generates JSON-LD structured data for SEO.
 * Includes Organization, WebSite, FAQ, and BreadcrumbList schemas.
 */

interface SchemaMarkupProps {
  faqData?: Array<{ question: string; answer: string | React.ReactNode }>;
}

export function SchemaMarkup({ faqData }: SchemaMarkupProps) {
  const location = useLocation();

  // Get base URL
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.VITE_APP_URL || 'https://tryfann.com';

  // Organization Schema
  const organizationSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TryFANN',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'Early access gateway to FANN — a verified-only marketplace for physical art with provenance-first records and resale royalties.',
    sameAs: [
      // Add social media links when available
      // 'https://twitter.com/tryfann',
      // 'https://facebook.com/tryfann',
      // 'https://instagram.com/tryfann',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      // email: 'support@tryfann.com', // Add when available
    },
  }), [baseUrl]);

  // WebSite Schema with SearchAction
  const websiteSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TryFANN',
    url: baseUrl,
    description: 'Early access gateway to FANN — a verified-only marketplace for physical art.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }), [baseUrl]);

  // FAQ Schema (if FAQ data provided)
  const faqSchema = useMemo(() => {
    if (!faqData || faqData.length === 0) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqData.map((faq) => {
        // Extract text from React nodes if needed
        const extractTextFromReactNode = (node: string | React.ReactNode): string => {
          if (typeof node === 'string') {
            return node;
          }
          
          if (React.isValidElement(node)) {
            const props = node.props as { children?: React.ReactNode };
            if (props?.children) {
              return String(props.children).replace(/<[^>]*>/g, '').trim();
            }
          }
          
          return '';
        };

        const answerText = extractTextFromReactNode(faq.answer);

        return {
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answerText || 'Visit TryFANN to learn more.',
          },
        };
      }),
    };
  }, [faqData]);

  // BreadcrumbList Schema
  const breadcrumbSchema = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    if (pathSegments.length === 0) return null;

    const breadcrumbItems = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      ...pathSegments.map((segment, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        item: `${baseUrl}/${pathSegments.slice(0, index + 1).join('/')}`,
      })),
    ];

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    };
  }, [location.pathname, baseUrl]);

  // Combine all schemas
  const schemas = useMemo(() => {
    const allSchemas = [organizationSchema, websiteSchema];
    
    if (faqSchema) {
      allSchemas.push(faqSchema);
    }
    
    if (breadcrumbSchema) {
      allSchemas.push(breadcrumbSchema);
    }
    
    return allSchemas;
  }, [organizationSchema, websiteSchema, faqSchema, breadcrumbSchema]);

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
        />
      ))}
    </>
  );
}

