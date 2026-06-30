import type { Config } from 'tailwindcss';
import { typographyConfig } from './src/config/typography';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // English fonts
        heading: typographyConfig.fontFamily.heading.split(',').map(f => f.trim()),
        body: typographyConfig.fontFamily.body.split(',').map(f => f.trim()),
        sans: typographyConfig.fontFamily.body.split(',').map(f => f.trim()),
        
        // Arabic fonts
        'arabic-heading': typographyConfig.fontFamily.arabic.heading.split(',').map(f => f.trim()),
        'arabic-body': typographyConfig.fontFamily.arabic.body.split(',').map(f => f.trim()),
      },
      fontWeight: {
        normal: typographyConfig.fontWeights.normal,
        medium: typographyConfig.fontWeights.medium,
        semibold: typographyConfig.fontWeights.semibold,
        bold: typographyConfig.fontWeights.bold,
      },
      lineHeight: {
        tight: typographyConfig.lineHeights.tight.toString(),
        normal: typographyConfig.lineHeights.normal.toString(),
        relaxed: typographyConfig.lineHeights.relaxed.toString(),
        loose: typographyConfig.lineHeights.loose.toString(),
      },
      letterSpacing: {
        tighter: typographyConfig.letterSpacing.tighter,
        tight: typographyConfig.letterSpacing.tight,
        normal: typographyConfig.letterSpacing.normal,
        wide: typographyConfig.letterSpacing.wide,
        wider: typographyConfig.letterSpacing.wider,
      },
      fontSize: {
        xs: [typographyConfig.fontSize.xs, { lineHeight: typographyConfig.lineHeights.normal }],
        sm: [typographyConfig.fontSize.sm, { lineHeight: typographyConfig.lineHeights.normal }],
        base: [typographyConfig.fontSize.base, { lineHeight: typographyConfig.lineHeights.normal }],
        lg: [typographyConfig.fontSize.lg, { lineHeight: typographyConfig.lineHeights.relaxed }],
        xl: [typographyConfig.fontSize.xl, { lineHeight: typographyConfig.lineHeights.normal }],
        '2xl': [typographyConfig.fontSize['2xl'], { lineHeight: typographyConfig.lineHeights.normal }],
        '3xl': [typographyConfig.fontSize['3xl'], { lineHeight: typographyConfig.lineHeights.tight }],
        '4xl': [typographyConfig.fontSize['4xl'], { lineHeight: typographyConfig.lineHeights.tight }],
        '5xl': [typographyConfig.fontSize['5xl'], { lineHeight: typographyConfig.lineHeights.tight }],
        '6xl': [typographyConfig.fontSize['6xl'], { lineHeight: typographyConfig.lineHeights.tight }],
      },
    },
  },
  plugins: [],
};

export default config;

