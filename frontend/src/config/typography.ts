/**
 * Typography System Configuration
 * 
 * Defines font families, weights, and typography scale for TryFANN.
 * Supports both English (LTR) and Arabic (RTL) languages.
 */

export interface TypographyConfig {
  fontFamily: {
    heading: string;
    body: string;
    arabic: {
      heading: string;
      body: string;
    };
  };
  fontWeights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
  };
}

/**
 * Typography configuration for TryFANN
 * 
 * Font Selection:
 * - English: Sora (headings) + Inter (body) - Modern Premium
 * - Arabic: IBM Plex Sans Arabic (both headings and body) - Clean, Modern, Premium
 */
export const typographyConfig: TypographyConfig = {
  fontFamily: {
    // English fonts (LTR)
    heading: "'Playfair Display', serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    
    // Arabic fonts (RTL)
    arabic: {
      heading: "'IBM Plex Sans Arabic', 'Playfair Display', serif",
      body: "'IBM Plex Sans Arabic', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
  },
  
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
};

/**
 * Get font family based on language
 */
export const getFontFamily = (language: 'en' | 'ar', type: 'heading' | 'body' = 'body'): string => {
  if (language === 'ar') {
    return type === 'heading' 
      ? typographyConfig.fontFamily.arabic.heading
      : typographyConfig.fontFamily.arabic.body;
  }
  
  return type === 'heading'
    ? typographyConfig.fontFamily.heading
    : typographyConfig.fontFamily.body;
};

/**
 * Typography scale for headings
 */
export const headingStyles = {
  h1: {
    fontSize: typographyConfig.fontSize['5xl'],
    fontWeight: typographyConfig.fontWeights.bold,
    lineHeight: typographyConfig.lineHeights.tight,
    letterSpacing: typographyConfig.letterSpacing.tight,
  },
  h2: {
    fontSize: typographyConfig.fontSize['4xl'],
    fontWeight: typographyConfig.fontWeights.bold,
    lineHeight: typographyConfig.lineHeights.tight,
    letterSpacing: typographyConfig.letterSpacing.tight,
  },
  h3: {
    fontSize: typographyConfig.fontSize['3xl'],
    fontWeight: typographyConfig.fontWeights.semibold,
    lineHeight: typographyConfig.lineHeights.normal,
    letterSpacing: typographyConfig.letterSpacing.normal,
  },
  h4: {
    fontSize: typographyConfig.fontSize['2xl'],
    fontWeight: typographyConfig.fontWeights.semibold,
    lineHeight: typographyConfig.lineHeights.normal,
    letterSpacing: typographyConfig.letterSpacing.normal,
  },
  h5: {
    fontSize: typographyConfig.fontSize.xl,
    fontWeight: typographyConfig.fontWeights.semibold,
    lineHeight: typographyConfig.lineHeights.normal,
    letterSpacing: typographyConfig.letterSpacing.normal,
  },
  h6: {
    fontSize: typographyConfig.fontSize.lg,
    fontWeight: typographyConfig.fontWeights.semibold,
    lineHeight: typographyConfig.lineHeights.normal,
    letterSpacing: typographyConfig.letterSpacing.normal,
  },
};

/**
 * Typography scale for body text
 */
export const bodyStyles = {
  large: {
    fontSize: typographyConfig.fontSize.lg,
    fontWeight: typographyConfig.fontWeights.normal,
    lineHeight: typographyConfig.lineHeights.relaxed,
  },
  base: {
    fontSize: typographyConfig.fontSize.base,
    fontWeight: typographyConfig.fontWeights.normal,
    lineHeight: typographyConfig.lineHeights.normal,
  },
  small: {
    fontSize: typographyConfig.fontSize.sm,
    fontWeight: typographyConfig.fontWeights.normal,
    lineHeight: typographyConfig.lineHeights.normal,
  },
  xs: {
    fontSize: typographyConfig.fontSize.xs,
    fontWeight: typographyConfig.fontWeights.normal,
    lineHeight: typographyConfig.lineHeights.normal,
  },
};

