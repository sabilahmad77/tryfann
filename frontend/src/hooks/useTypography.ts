import { useMemo } from 'react';
import { useLanguage } from '@/contexts/useLanguage';
import { getFontFamily, typographyConfig } from '@/config/typography';

/**
 * Hook for language-aware typography
 * 
 * Automatically switches between English and Arabic fonts based on language context.
 * Provides utility functions for generating typography classes.
 */
export function useTypography() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  // Get font families based on language
  const fonts = useMemo(() => {
    return {
      heading: getFontFamily(language, 'heading'),
      body: getFontFamily(language, 'body'),
    };
  }, [language]);

  /**
   * Get Tailwind font class based on type
   */
  const getFontClass = (type: 'heading' | 'body' = 'body'): string => {
    if (isRTL) {
      return type === 'heading' ? 'font-arabic-heading' : 'font-arabic-body';
    }
    return type === 'heading' ? 'font-heading' : 'font-body';
  };

  /**
   * Get complete typography class string
   */
  const getTypographyClass = (
    type: 'heading' | 'body' = 'body',
    size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' = 'base',
    weight: 'normal' | 'medium' | 'semibold' | 'bold' = 'normal'
  ): string => {
    const fontClass = getFontClass(type);
    const sizeClass = `text-${size}`;
    const weightClass = `font-${weight}`;
    
    return `${fontClass} ${sizeClass} ${weightClass}`.trim();
  };

  /**
   * Get heading typography class
   */
  const getHeadingClass = (
    level: 1 | 2 | 3 | 4 | 5 | 6 = 1,
    weight: 'medium' | 'semibold' | 'bold' = 'bold'
  ): string => {
    const sizeMap: Record<1 | 2 | 3 | 4 | 5 | 6, 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'> = {
      1: '6xl',
      2: '5xl',
      3: '4xl',
      4: '3xl',
      5: '2xl',
      6: 'xl',
    };
    
    return getTypographyClass('heading', sizeMap[level], weight);
  };

  /**
   * Get body typography class
   */
  const getBodyClass = (
    size: 'xs' | 'sm' | 'base' | 'lg' = 'base',
    weight: 'normal' | 'medium' = 'normal'
  ): string => {
    return getTypographyClass('body', size, weight);
  };

  return {
    language,
    isRTL,
    fonts,
    getFontClass,
    getTypographyClass,
    getHeadingClass,
    getBodyClass,
    config: typographyConfig,
  };
}

