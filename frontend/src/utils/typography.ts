/**
 * Typography Utility Functions
 * 
 * Helper functions for working with typography system
 */

import { typographyConfig, getFontFamily } from '@/config/typography';

/**
 * Get font family string for CSS
 */
export const getFontFamilyCSS = (language: 'en' | 'ar', type: 'heading' | 'body' = 'body'): string => {
  return getFontFamily(language, type);
};

/**
 * Get font weight number
 */
export const getFontWeight = (weight: 'normal' | 'medium' | 'semibold' | 'bold'): number => {
  return typographyConfig.fontWeights[weight];
};

/**
 * Get line height number
 */
export const getLineHeight = (height: 'tight' | 'normal' | 'relaxed' | 'loose'): number => {
  return typographyConfig.lineHeights[height];
};

/**
 * Get letter spacing string
 */
export const getLetterSpacing = (spacing: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider'): string => {
  return typographyConfig.letterSpacing[spacing];
};

/**
 * Get font size string
 */
export const getFontSize = (
  size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
): string => {
  return typographyConfig.fontSize[size];
};

/**
 * Generate inline styles for typography
 */
export const getTypographyStyles = (
  language: 'en' | 'ar',
  type: 'heading' | 'body' = 'body',
  size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' = 'base',
  weight: 'normal' | 'medium' | 'semibold' | 'bold' = 'normal'
): React.CSSProperties => {
  return {
    fontFamily: getFontFamily(language, type),
    fontSize: getFontSize(size),
    fontWeight: getFontWeight(weight),
    lineHeight: type === 'heading' ? typographyConfig.lineHeights.tight : typographyConfig.lineHeights.normal,
    letterSpacing: type === 'heading' ? typographyConfig.letterSpacing.tight : typographyConfig.letterSpacing.normal,
  };
};

