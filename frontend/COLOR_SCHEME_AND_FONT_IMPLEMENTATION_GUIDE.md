# Color Scheme and Font Family Implementation Guide

## Overview
This document provides detailed instructions for implementing the new color scheme and font family changes as specified in "Final Fixes TryFann v2.pdf". This guide covers ONLY color scheme and font family related changes.

---

## Part 1: Font Family Implementation

### 1.1 Update `index.html` - Add Playfair Display Font

**File**: `index.html`

**Current State**: Line 29 loads Sora, Inter, and IBM Plex Sans Arabic fonts.

**Action Required**: Replace the Google Fonts link to include Playfair Display instead of Sora.

**Change**:
```html
<!-- BEFORE (Line 29) -->
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- AFTER -->
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Note**: 
- Remove `Sora` font
- Add `Playfair+Display` with weights 400, 500, 600, 700
- Keep Inter with weights 400, 500, 600, 700 (add 700 for headings)
- Keep IBM Plex Sans Arabic as is (for Arabic support)

---

### 1.2 Update `src/config/typography.ts` - Change Heading Font

**File**: `src/config/typography.ts`

**Current State**: 
- Line 60: `heading: "'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"`
- Line 65: Arabic heading also references Sora

**Action Required**: Replace Sora with Playfair Display for English headings only.

**Change 1 - English Heading Font (Line 60)**:
```typescript
// BEFORE
heading: "'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

// AFTER
heading: "'Playfair Display', serif",
```

**Change 2 - Arabic Heading Font (Line 65)**:
```typescript
// BEFORE
heading: "'IBM Plex Sans Arabic', 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

// AFTER
heading: "'IBM Plex Sans Arabic', 'Playfair Display', serif",
```

**Change 3 - Update Font Weight System (Lines 70-75)**:
```typescript
// BEFORE
fontWeights: {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
},

// AFTER (No change needed - weights are already correct)
// But ensure usage:
// Headings: 600-700 (semibold to bold)
// Body: 400-500 (normal to medium)
// Labels: 500-600 (medium to semibold)
```

**Change 4 - Update Heading Styles Font Weights (Lines 124-160)**:
```typescript
// Update h1, h2 to use bold (700) and h3, h4 to use semibold (600)
// Current implementation already uses:
// h1, h2: fontWeight: typographyConfig.fontWeights.bold (700) ✓
// h3, h4: fontWeight: typographyConfig.fontWeights.semibold (600) ✓
// h5, h6: fontWeight: typographyConfig.fontWeights.medium (500) - Should be 600 for headings

// Change h5 and h6 to semibold (600):
h5: {
  fontSize: typographyConfig.fontSize.xl,
  fontWeight: typographyConfig.fontWeights.semibold, // Changed from medium
  lineHeight: typographyConfig.lineHeights.normal,
  letterSpacing: typographyConfig.letterSpacing.normal,
},
h6: {
  fontSize: typographyConfig.fontSize.lg,
  fontWeight: typographyConfig.fontWeights.semibold, // Changed from medium
  lineHeight: typographyConfig.lineHeights.normal,
  letterSpacing: typographyConfig.letterSpacing.normal,
},
```

---

### 1.3 Update `src/styles/globals.css` - Font Variables and Base Styles

**File**: `src/styles/globals.css`

**Change 1 - Update Font Family Variables (Lines 18-24)**:
```css
/* BEFORE */
:root {
  /* Font Families */
  --font-heading: 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-arabic-heading: 'IBM Plex Sans Arabic', 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-arabic-body: 'IBM Plex Sans Arabic', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* AFTER */
:root {
  /* Font Families */
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-arabic-heading: 'IBM Plex Sans Arabic', 'Playfair Display', serif;
  --font-arabic-body: 'IBM Plex Sans Arabic', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

**Change 2 - Update Heading Font Weights in Base Layer (Lines 389-425)**:
```css
/* BEFORE (Lines 390-399) */
h1:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
h2:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
h3:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
h4:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
h5:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
h6:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body) {
  font-family: var(--font-heading);
  font-weight: 600;
  letter-spacing: -0.025em;
}

/* AFTER - Update font-weight to range 600-700 */
h1:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
h2:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body) {
  font-family: var(--font-heading);
  font-weight: 700; /* Bold for h1, h2 */
  letter-spacing: -0.025em;
}

h3:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
h4:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
h5:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
h6:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body) {
  font-family: var(--font-heading);
  font-weight: 600; /* Semibold for h3-h6 */
  letter-spacing: -0.025em;
}
```

**Change 3 - Update Body Text Font Weights (Lines 402-410)**:
```css
/* BEFORE - Body text uses default weight */
p:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
span:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
/* ... */

/* AFTER - Add explicit font-weight for body text (400-500) */
p:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
span:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
div:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
a:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
li:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
td:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body),
th:not(.font-heading):not(.font-body):not(.font-arabic-heading):not(.font-arabic-body) {
  font-family: var(--font-body);
  font-weight: 400; /* Normal weight for body text */
}
```

**Change 4 - Update Label Font Weights (Lines 463-467)**:
```css
/* BEFORE */
label {
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

/* AFTER - Labels should be 500-600 */
label {
  font-size: var(--text-base);
  font-weight: 500; /* Medium weight for labels (500-600 range) */
  line-height: 1.5;
}
```

**Change 5 - Update Button Font Weights (Lines 469-473)**:
```css
/* BEFORE */
button {
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
}

/* AFTER - Buttons can use medium (500) or semibold (600) depending on importance */
button {
  font-size: var(--text-base);
  font-weight: 500; /* Medium weight for buttons */
  line-height: 1.5;
}
```

---

## Part 2: Color Scheme Implementation

### 2.1 Update Core Background Colors

**File**: `src/styles/globals.css`

**Change 1 - Replace Background Color Variables (Lines 67-75)**:
```css
/* BEFORE */
/* BACKGROUND COLORS - FANN Dark Purple System */
--background: #0F021C;
/* Main background */
--background-dark: #020e27;
/* Primary dark background */
--background-secondary: #160328;
/* Secondary dark background */
--background-darker: #080808;
/* Very dark background */

/* AFTER */
/* BACKGROUND COLORS - New Charcoal System */
--background: #0B0B0D;
/* True Black (Base) - Main page background */
--background-dark: #121217;
/* Charcoal (Section panels) - Large section blocks, hero overlay, sticky nav background */
--background-secondary: #191922;
/* Soft Charcoal (Cards) - Cards, modals, feature boxes */
--background-darker: #222231;
/* Elevated Charcoal (Hover/Active surfaces) - Hover state for cards, dropdowns, active tiles */
```

**Important**: Also update the `.dark` class section (Lines 209-213) with the same values.

---

### 2.2 Update Card Colors

**File**: `src/styles/globals.css`

**Change 2 - Replace Card Color Variables (Lines 77-85)**:
```css
/* BEFORE */
/* CARD COLORS */
--card: #1D112A;
/* Card background */
--card-foreground: #ffffff;
/* White text on cards */
--card-transparent: rgba(255, 255, 255, 0.06);
/* #ffffff0f */
--card-hover: rgba(255, 255, 255, 0.1);
/* #ffffff1a */

/* AFTER */
/* CARD COLORS */
--card: #191922;
/* Soft Charcoal (Cards) - Cards, modals, feature boxes */
--card-foreground: #F2F2F3;
/* Primary Text (High) - Main headings, key labels on cards */
--card-transparent: rgba(255, 255, 255, 0.06);
/* Keep as is for transparency effects */
--card-hover: #222231;
/* Elevated Charcoal (Hover/Active surfaces) - Hover state for cards */
```

**Important**: Also update the `.dark` class section (Lines 215-219) with the same values.

---

### 2.3 Update Text Colors

**File**: `src/styles/globals.css`

**Change 3 - Replace Text Color Variables (Lines 87-97)**:
```css
/* BEFORE */
/* TEXT COLORS */
--foreground: #ffffff;
/* Primary white text */
--foreground-secondary: rgba(255, 255, 255, 0.9);
/* #ffffffe6 */
--muted-foreground: #808c99;
/* Muted gray text */
--muted-foreground-light: #BEC0C9;
/* Light gray text */
--muted-foreground-medium: #7D8096;
/* Medium gray text */

/* AFTER */
/* TEXT COLORS */
--foreground: #F2F2F3;
/* Primary Text (High) - Main headings, key labels */
--foreground-secondary: #B9BBC6;
/* Body Text (Medium) - Paragraphs, descriptions, reminder text */
--muted-foreground: #8A8EA0;
/* Muted Text - Helper text, captions, placeholders */
--muted-foreground-light: #B9BBC6;
/* Body Text (Medium) - Same as foreground-secondary */
--muted-foreground-medium: #8A8EA0;
/* Muted Text - Same as muted-foreground */
```

**Add New Variable for Disabled Text**:
```css
/* Add after --muted-foreground-medium */
--disabled-foreground: #5F6375;
/* Disabled Text - Disabled buttons, inactive states */
```

**Important**: Also update the `.dark` class section (Lines 221-226) with the same values, and add `--disabled-foreground: #5F6375;` there as well.

---

### 2.4 Update Border Colors

**File**: `src/styles/globals.css`

**Change 4 - Replace Border Color Variables (Lines 121-132)**:
```css
/* BEFORE */
/* BORDER COLORS */
--border: rgba(255, 204, 51, 0.3);
/* #ffcc334c - Gold border ~30% */
--border-gold: rgba(255, 204, 51, 0.3);
/* #FFCC334D */
--border-gold-light: rgba(255, 201, 54, 0.2);
/* #FFC93633 */
--border-secondary: rgba(78, 78, 78, 0.47);
/* #4e4e4e78 */
--border-light: rgba(255, 255, 255, 0.3);
/* #ffffff4c */
--border-orange: #FEB848;

/* AFTER */
/* BORDER COLORS */
--border: #2A2A3A;
/* Hairline Border - Card borders, table lines, subtle separators */
--border-gold: rgba(197, 155, 72, 0.22);
/* Glow Border (Gold-tinted subtle) - Only for "special" components (primary CTA, highlighted tier, selected card) */
--border-gold-light: rgba(197, 155, 72, 0.15);
/* Lighter version of glow border for subtle effects */
--border-secondary: #2A2A3A;
/* Hairline Border - Same as --border for consistency */
--border-light: #2A2A3A;
/* Hairline Border - Same as --border */
--border-orange: #C59B48;
/* Primary Gold (Warm) - Keep for accent borders if needed */
```

**Important**: Also update the `.dark` class section (Lines 245-251) with the same values.

---

### 2.5 Update Brand/Accent Colors (Gold System)

**File**: `src/styles/globals.css`

**Change 5 - Replace Primary Gold Colors (Lines 38-46)**:
```css
/* BEFORE */
/* PRIMARY COLORS - FANN Gold System */
--primary: #ffcc33;
/* Main gold */
--primary-light: #ffb54d;
/* Lighter gold */
--primary-dark: #e6b800;
/* Darker gold */
--primary-foreground: #020e27;
/* Dark background for gold text */

/* AFTER */
/* PRIMARY COLORS - New Gold System */
--primary: #C59B48;
/* Primary Gold (Warm) - Primary CTA fill, key highlights, icons, emphasis words */
--primary-light: #D6AE5A;
/* Gold Hover - CTA hover, active chips */
--primary-dark: #A98237;
/* Gold Pressed - CTA pressed/down state */
--primary-foreground: #0B0B0D;
/* True Black (Base) - Dark background for gold text */
```

**Important**: Also update the `.dark` class section (Lines 191-195) with the same values.

---

### 2.6 Update Input Colors

**File**: `src/styles/globals.css`

**Change 6 - Update Input Background (Lines 134-138)**:
```css
/* BEFORE */
/* INPUT COLORS */
--input: transparent;
--input-background: #0f021c;
--ring: #ffcc33;
/* Focus ring gold */

/* AFTER */
/* INPUT COLORS */
--input: transparent;
--input-background: #191922;
/* Soft Charcoal (Cards) - Input background should match card background */
--ring: #C59B48;
/* Primary Gold (Warm) - Focus ring gold */
```

**Important**: Also update the `.dark` class section (Lines 253-256) with the same values.

---

### 2.7 Update Sidebar Colors

**File**: `src/styles/globals.css`

**Change 7 - Update Sidebar Colors (Lines 152-160)**:
```css
/* BEFORE */
/* SIDEBAR COLORS */
--sidebar: #1D112A;
--sidebar-foreground: #ffffff;
--sidebar-primary: #ffcc33;
--sidebar-primary-foreground: #020e27;
--sidebar-accent: #4e4e4e;
--sidebar-accent-foreground: #ffffff;
--sidebar-border: rgba(255, 204, 51, 0.3);
--sidebar-ring: #ffcc33;

/* AFTER */
/* SIDEBAR COLORS */
--sidebar: #121217;
/* Charcoal (Section panels) - Sidebar background */
--sidebar-foreground: #F2F2F3;
/* Primary Text (High) - Sidebar text */
--sidebar-primary: #C59B48;
/* Primary Gold (Warm) - Sidebar primary accent */
--sidebar-primary-foreground: #0B0B0D;
/* True Black (Base) - Text on gold background */
--sidebar-accent: #191922;
/* Soft Charcoal (Cards) - Sidebar accent background */
--sidebar-accent-foreground: #F2F2F3;
/* Primary Text (High) - Sidebar accent text */
--sidebar-border: #2A2A3A;
/* Hairline Border - Sidebar border */
--sidebar-ring: #C59B48;
/* Primary Gold (Warm) - Sidebar focus ring */
```

**Important**: Also update the `.dark` class section (Lines 265-273) with the same values.

---

### 2.8 Update Popover Colors

**File**: `src/styles/globals.css`

**Change 8 - Update Popover Colors (Lines 103-105)**:
```css
/* BEFORE */
/* POPOVER */
--popover: #1D112A;
--popover-foreground: #ffffff;

/* AFTER */
/* POPOVER */
--popover: #191922;
/* Soft Charcoal (Cards) - Popover background */
--popover-foreground: #F2F2F3;
/* Primary Text (High) - Popover text */
```

**Important**: Also update the `.dark` class section (Lines 231-233) with the same values.

---

### 2.9 Update Chart Colors (Optional - Keep for consistency)

**File**: `src/styles/globals.css`

**Note**: Chart colors can remain as is, but if you want to update gold-related charts:

**Change 9 - Update Chart Gold Colors (Lines 140-150)**:
```css
/* BEFORE */
/* CHART COLORS */
--chart-1: #ffcc33;
/* Gold */

/* AFTER */
/* CHART COLORS */
--chart-1: #C59B48;
/* Primary Gold (Warm) */
```

**Important**: Also update the `.dark` class section (Lines 258-263) with the same values.

---

### 2.10 Update Gradients (Optional - Update gold gradients)

**File**: `src/styles/globals.css`

**Change 10 - Update Gold Gradients (Lines 162-167)**:
```css
/* BEFORE */
/* GRADIENTS */
--gradient-primary: linear-gradient(174deg, rgba(255,204,51,1) 0%, rgba(255,181,77,1) 100%);
--gradient-secondary: linear-gradient(171deg, rgba(255,204,51,1) 0%, rgba(255,181,77,1) 100%);
--gradient-card: linear-gradient(90deg, rgba(255,204,51,0.1) 0%, rgba(69,227,211,0.1) 100%);
--gradient-gold: linear-gradient(to right, #FFCC33, #FFB54D);
--gradient-amber: linear-gradient(to right, #FFCB35, #FFD700);

/* AFTER */
/* GRADIENTS */
--gradient-primary: linear-gradient(174deg, rgba(197,155,72,1) 0%, rgba(214,174,90,1) 100%);
/* Primary Gold to Gold Hover */
--gradient-secondary: linear-gradient(171deg, rgba(197,155,72,1) 0%, rgba(214,174,90,1) 100%);
/* Primary Gold to Gold Hover */
--gradient-card: linear-gradient(90deg, rgba(197,155,72,0.1) 0%, rgba(69,227,211,0.1) 100%);
/* Keep teal accent if needed, otherwise use gold only */
--gradient-gold: linear-gradient(to right, #C59B48, #D6AE5A);
/* Primary Gold to Gold Hover */
--gradient-amber: linear-gradient(to right, #C59B48, #D6AE5A);
/* Primary Gold to Gold Hover */
```

**Important**: Also update the `.dark` class section (Lines 275-280) with the same values.

---

### 2.11 Update Shadows (Optional - Update gold shadows)

**File**: `src/styles/globals.css`

**Change 11 - Update Gold Shadows (Lines 169-179)**:
```css
/* BEFORE */
/* SHADOWS */
--shadow-primary: inset 0px -1px 0px 1px rgba(230, 134, 0, 0.6), 
                  inset 0px 1px 0px 1px rgba(255, 204, 51, 0.4), 
                  0px 4px 12px rgba(255, 204, 51, 0.35), 
                  0px 10px 30px -10px rgba(255, 204, 51, 0.4);
--shadow-secondary: 0px 30.51px 30.51px rgba(0, 0, 0, 0.4), 
                    inset 0px 0px 5.08px #fface3, 
                    inset 0px -1.02px 8.14px #9375b5;
--shadow-card: 0px 0px 136.8px 15px #070721;
--shadow-hover: 0 0 20px 4px rgba(255, 204, 51, 0.7);
--shadow-button: 0 8px 25px rgba(255, 204, 51, 0.3);

/* AFTER */
/* SHADOWS */
--shadow-primary: inset 0px -1px 0px 1px rgba(169, 130, 55, 0.6), 
                  inset 0px 1px 0px 1px rgba(197, 155, 72, 0.4), 
                  0px 4px 12px rgba(197, 155, 72, 0.35), 
                  0px 10px 30px -10px rgba(197, 155, 72, 0.4);
/* Updated with new gold colors */
--shadow-secondary: 0px 30.51px 30.51px rgba(0, 0, 0, 0.4), 
                    inset 0px 0px 5.08px #fface3, 
                    inset 0px -1.02px 8.14px #9375b5;
/* Keep as is if using pink/purple accents */
--shadow-card: 0px 0px 136.8px 15px rgba(11, 11, 13, 0.8);
/* Updated with True Black */
--shadow-hover: 0 0 20px 4px rgba(197, 155, 72, 0.7);
/* Updated with Primary Gold */
--shadow-button: 0 8px 25px rgba(197, 155, 72, 0.3);
/* Updated with Primary Gold */
```

**Important**: Also update the `.dark` class section (Lines 282-292) with the same values.

---

### 2.12 Update Tailwind Theme Color Mappings

**File**: `src/styles/globals.css`

**Change 12 - Update Gold Color Mappings in @theme inline (Lines 346-355)**:
```css
/* BEFORE */
/* FANN Gold Color Mappings (amber/orange/yellow → gold) */
--color-amber-400: #ffcc33;
--color-amber-500: #ffcc33;
--color-amber-600: #e6b800;
--color-orange-400: #ffb54d;
--color-orange-500: #ffb54d;
--color-orange-600: #e6b800;
--color-yellow-400: #ffcc33;
--color-yellow-500: #ffcc33;
--color-yellow-600: #ffb54d;

/* AFTER */
/* New Gold Color Mappings (amber/orange/yellow → gold) */
--color-amber-400: #C59B48;
/* Primary Gold (Warm) */
--color-amber-500: #C59B48;
/* Primary Gold (Warm) */
--color-amber-600: #A98237;
/* Gold Pressed */
--color-orange-400: #D6AE5A;
/* Gold Hover */
--color-orange-500: #D6AE5A;
/* Gold Hover */
--color-orange-600: #C59B48;
/* Primary Gold (Warm) */
--color-yellow-400: #C59B48;
/* Primary Gold (Warm) */
--color-yellow-500: #C59B48;
/* Primary Gold (Warm) */
--color-yellow-600: #D6AE5A;
/* Gold Hover */
```

---

### 2.13 Update Glow Effects

**File**: `src/styles/globals.css`

**Change 13 - Update Glow Gold Effect (Lines 560-563)**:
```css
/* BEFORE */
.glow-gold {
  box-shadow: 0 0 20px rgba(255, 204, 51, 0.5);
}

/* AFTER */
.glow-gold {
  box-shadow: 0 0 20px rgba(197, 155, 72, 0.5);
}
```

---

### 2.14 Update Sky Gradient (Optional - if using gold)

**File**: `src/styles/globals.css`

**Change 14 - Update Sky Gradient (Lines 577-580)**:
```css
/* BEFORE */
.sky-gradient {
  background: linear-gradient(135deg, #4de3ed 0%, #45e3d3 50%, #ffcc33 100%);
}

/* AFTER */
.sky-gradient {
  background: linear-gradient(135deg, #4de3ed 0%, #45e3d3 50%, #C59B48 100%);
}
```

---

### 2.15 Update Button Glow Animation

**File**: `src/styles/globals.css`

**Change 15 - Update Button Glow Background (Lines 592-608)**:
```css
/* BEFORE */
.btn-glow::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 204, 51, 0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

/* AFTER */
.btn-glow::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(197, 155, 72, 0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}
```

---

### 2.16 Update Scrollbar Colors

**File**: `src/styles/globals.css`

**Change 16 - Update Scrollbar Colors (Lines 620-633)**:
```css
/* BEFORE */
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 2, 28, 0.5);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 204, 51, 0.4);
  border-radius: 4px;
  border: 1px solid rgba(255, 204, 51, 0.2);
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 204, 51, 0.6);
}

/* Firefox scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 204, 51, 0.4) rgba(15, 2, 28, 0.5);
  overflow-x: hidden;
}

/* AFTER */
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(11, 11, 13, 0.5);
  /* True Black (Base) with opacity */
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(197, 155, 72, 0.4);
  /* Primary Gold (Warm) with opacity */
  border-radius: 4px;
  border: 1px solid rgba(197, 155, 72, 0.2);
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(197, 155, 72, 0.6);
}

/* Firefox scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(197, 155, 72, 0.4) rgba(11, 11, 13, 0.5);
  overflow-x: hidden;
}
```

---

### 2.17 Update Pulse Glow Animation

**File**: `src/styles/globals.css`

**Change 17 - Update Pulse Glow Keyframes (Lines 499-507)**:
```css
/* BEFORE */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 204, 51, 0.4);
  }

  50% {
    box-shadow: 0 0 40px rgba(255, 204, 51, 0.8);
  }
}

/* AFTER */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(197, 155, 72, 0.4);
  }

  50% {
    box-shadow: 0 0 40px rgba(197, 155, 72, 0.8);
  }
}
```

---

## Part 3: Tier Accent Colors (Special Requirements)

### 3.1 Explorer Tier
- **Icon**: Neutral gold outline only
- **Body Text**: White/gray only (use `#F2F2F3` for primary text, `#B9BBC6` for body text)
- **No teal or violet accents**

### 3.2 Curator Tier
- **Icon**: Gold + subtle teal only in icon
- **Body Text**: White/gray only (use `#F2F2F3` for primary text, `#B9BBC6` for body text)
- **Teal should only appear in the icon, not in text or borders**

### 3.3 Patron Tier
- **Icon**: Gold + subtle violet only in icon
- **Body Text**: White/gray only (use `#F2F2F3` for primary text, `#B9BBC6` for body text)
- **Violet should only appear in the icon, not in text or borders**

**Note**: These tier-specific colors should be applied in the component files that render the tier cards. The base color system in `globals.css` provides the foundation, but tier-specific styling should be handled in the component level.

---

## Part 4: Summary Checklist

### Font Family Changes
- [ ] Update `index.html` - Replace Sora with Playfair Display
- [ ] Update `src/config/typography.ts` - Change heading font to Playfair Display
- [ ] Update `src/styles/globals.css` - Update font variables and base styles
- [ ] Verify font weights: Headings 600-700, Body 400-500, Labels 500-600

### Color Scheme Changes
- [ ] Update Core Backgrounds (True Black, Charcoal variants)
- [ ] Update Card Colors (Soft Charcoal)
- [ ] Update Text Colors (Primary Text, Body Text, Muted, Disabled)
- [ ] Update Border Colors (Hairline Border, Glow Border)
- [ ] Update Brand/Accent Colors (Primary Gold, Gold Hover, Gold Pressed)
- [ ] Update Input Colors
- [ ] Update Sidebar Colors
- [ ] Update Popover Colors
- [ ] Update Chart Colors (optional)
- [ ] Update Gradients (optional)
- [ ] Update Shadows (optional)
- [ ] Update Tailwind Theme Mappings
- [ ] Update Glow Effects
- [ ] Update Scrollbar Colors
- [ ] Update Animations

### Testing Checklist
- [ ] Verify all headings use Playfair Display
- [ ] Verify all body text uses Inter
- [ ] Verify font weights are correct (headings 600-700, body 400-500, labels 500-600)
- [ ] Verify background colors match new scheme
- [ ] Verify text colors are readable on new backgrounds
- [ ] Verify gold accents use new color values
- [ ] Verify borders use new hairline border color
- [ ] Verify hover states use Elevated Charcoal
- [ ] Test in both light and dark modes (if applicable)
- [ ] Test Arabic font support (should remain IBM Plex Sans Arabic)

---

## Part 5: Important Notes

1. **Arabic Font Support**: Arabic fonts (IBM Plex Sans Arabic) should remain unchanged. Only English fonts are being updated.

2. **Both `:root` and `.dark`**: Make sure to update colors in BOTH the `:root` selector (Lines 34-185) AND the `.dark` class selector (Lines 187-298) to maintain consistency.

3. **Component-Level Updates**: Some components may have hardcoded color values. After updating the CSS variables, search the codebase for old color values (like `#ffcc33`, `#0F021C`, `#1D112A`, etc.) and update them to use CSS variables or new values.

4. **Tier-Specific Colors**: The tier accent colors (Explorer, Curator, Patron) should be applied at the component level, not in the global CSS. The global CSS provides the base color system.

5. **Testing**: After implementation, thoroughly test all pages and components to ensure colors and fonts are applied correctly.

---

## Part 6: Color Reference Quick Lookup

### Background Colors
- True Black (Base): `#0B0B0D`
- Charcoal (Section panels): `#121217`
- Soft Charcoal (Cards): `#191922`
- Elevated Charcoal (Hover/Active): `#222231`

### Border Colors
- Hairline Border: `#2A2A3A`
- Glow Border (Gold-tinted): `rgba(197, 155, 72, 0.22)`

### Text Colors
- Primary Text (High): `#F2F2F3`
- Body Text (Medium): `#B9BBC6`
- Muted Text: `#8A8EA0`
- Disabled Text: `#5F6375`

### Brand/Accent Colors
- Primary Gold (Warm): `#C59B48`
- Gold Hover: `#D6AE5A`
- Gold Pressed: `#A98237`

---

## Part 7: Component-Level Color Updates

**CRITICAL**: After updating CSS variables in `globals.css`, you MUST update all hardcoded color values in component files. The CSS variables will only work if components use them or if you replace hardcoded values.

### 7.1 Color Replacement Strategy

**Step 1**: Use Find & Replace (with regex support) to replace colors systematically:

#### Old Gold Colors → New Gold Colors
- `#ffcc33` → `#C59B48` (Primary Gold)
- `#FFCC33` → `#C59B48` (Primary Gold)
- `#ffb54d` → `#D6AE5A` (Gold Hover)
- `#FFB54D` → `#D6AE5A` (Gold Hover)
- `#e6b800` → `#A98237` (Gold Pressed)
- `#E6B800` → `#A98237` (Gold Pressed)

#### Old Background Colors → New Background Colors
- `#0F021C` → `#0B0B0D` (True Black Base)
- `#0f021c` → `#0B0B0D` (True Black Base)
- `#020e27` → `#121217` (Charcoal - Section panels)
- `#1D112A` → `#191922` (Soft Charcoal - Cards)
- `#1d112a` → `#191922` (Soft Charcoal - Cards)

#### Old Border Colors → New Border Colors
- `rgba(255, 204, 51, 0.3)` → `rgba(197, 155, 72, 0.22)` (Glow Border)
- `rgba(255, 204, 51, 0.2)` → `rgba(197, 155, 72, 0.15)` (Lighter Glow Border)
- `rgba(255, 204, 51, 0.4)` → `rgba(197, 155, 72, 0.3)` (Medium Glow Border)
- `rgba(255, 204, 51, 0.5)` → `rgba(197, 155, 72, 0.4)` (Stronger Glow Border)
- `rgba(255, 204, 51, 0.6)` → `rgba(197, 155, 72, 0.5)` (Very Strong Glow Border)
- `rgba(255, 204, 51, 0.7)` → `rgba(197, 155, 72, 0.6)` (Maximum Glow Border)
- `rgba(255, 204, 51, 0.8)` → `rgba(197, 155, 72, 0.7)` (Very Maximum Glow Border)

#### Old Text Colors → New Text Colors
- `#ffffff` → `#F2F2F3` (Primary Text High) - for main headings/labels
- `rgba(255, 255, 255, 0.9)` → `#B9BBC6` (Body Text Medium)
- `#808c99` → `#8A8EA0` (Muted Text)
- `#BEC0C9` → `#B9BBC6` (Body Text Medium)

### 7.2 Files Requiring Component-Level Updates

Based on codebase analysis, the following files contain hardcoded color values that need to be updated:

#### High Priority Files (Many Hardcoded Colors)

1. **`src/pages/ProfilePage.tsx`**
   - **Lines to check**: 746, 751, 775, 800, 848, 865, 896, 897, 955, 956, 1081, 1082, 1236, 1237, 1400, 1407, 1441, 1451, 1571
   - **Colors found**: `#ffcc33`, `#FFCC33`, `#ffb54d`, `#0F021C`, `#0f021c`, `#1D112A`, `rgba(255, 204, 51, ...)`
   - **Action**: Replace all gold colors and background colors with new values

2. **`src/components/ui/custom-form-elements.tsx`**
   - **Lines to check**: 339, 340, 396, 586, 587, 800, 803, 1042, 1043, 1636
   - **Colors found**: `#ffcc33`, `#ffffff`, `#0f021c`
   - **Action**: Replace gold border/ring colors and text colors

3. **`src/components/Hero.tsx`**
   - **Lines to check**: 35, 61, 89, 152, 165, 167, 168, 179, 261, 263
   - **Colors found**: `#ffcc33`, `#0F021C`, `rgba(255, 204, 51, ...)`
   - **Action**: Replace gold colors and background colors

4. **`src/components/HowItWorks.tsx`**
   - **Lines to check**: 132, 146, 175, 177, 186, 209, 219, 235, 251, 285, 288, 289, 294, 319
   - **Colors found**: `#ffcc33`, `#ffb54d`, `#e6b800`, `#0F021C`, `#1D112A`, `rgba(255, 204, 51, ...)`
   - **Action**: Replace all gold gradient colors, background colors, and border colors

5. **`src/components/Leaderboard.tsx`**
   - **Lines to check**: 334, 348, 396, 399, 445, 450, 493
   - **Colors found**: `#ffcc33`, `#0F021C`, `#1D112A`, `rgba(255, 204, 51, ...)`
   - **Action**: Replace gold colors, background colors, and shadow colors

6. **`src/components/Footer.tsx`**
   - **Lines to check**: 70, 84, 111, 132, 134, 151, 163
   - **Colors found**: `#0F021C`, `#ffcc33`, `#ffffff`, `rgba(255, 204, 51, ...)`
   - **Action**: Replace background colors, gold colors, and text colors

7. **`src/components/ReferralModule.tsx`**
   - **Lines to check**: 147, 156, 184, 196, 198, 201, 207, 239, 264, 289, 307, 331, 395
   - **Colors found**: `#0F021C`, `#1D112A`, `#ffcc33`, `rgba(255, 204, 51, ...)`
   - **Action**: Replace all background colors, gold colors, and border colors

#### Medium Priority Files

8. **`src/pages/HomePage.tsx`**
   - **Line 57**: `bg-[#0F021C]` → `bg-[#0B0B0D]`

9. **`src/components/SignUp.tsx`**
   - **Line 709**: `rgba(255,204,51,0.05)` → `rgba(197, 155, 72, 0.05)`

10. **`src/components/SignIn.tsx`**
    - **Line 379**: `rgba(255,204,51,0.05)` → `rgba(197, 155, 72, 0.05)`

11. **`src/components/ForgotPassword.tsx`**
    - **Line 99**: `rgba(255,204,51,0.05)` → `rgba(197, 155, 72, 0.05)`

12. **`src/pages/LeaderboardPage.tsx`**
    - **Line 1121**: `rgba(255, 204, 51, 0.05)` → `rgba(197, 155, 72, 0.05)`

13. **`src/App.tsx`**
    - **Line 22**: `rgba(255, 204, 51, 0.3)` → `rgba(197, 155, 72, 0.22)`

14. **`src/components/onboarding/KYCStep.tsx`**
    - **Line 1628**: `color="#0F021C"` → `color="#0B0B0D"` (if used for background) or keep if it's for text on gold

15. **`src/components/profile/EditKYC.tsx`**
    - **Line 1182**: `color="#0F021C"` → `color="#0B0B0D"` (if used for background) or keep if it's for text on gold

### 7.3 Systematic Find & Replace Instructions

**Using VS Code (Recommended)**:

1. **Open Find & Replace** (Ctrl+H or Cmd+H)
2. **Enable Regex** (click `.*` icon)
3. **Search in**: `src` folder only (exclude `node_modules`)

**Replacements to perform**:

```
Find: #ffcc33|#FFCC33
Replace: #C59B48
(Enable Match Case: OFF, Regex: ON)

Find: #ffb54d|#FFB54D
Replace: #D6AE5A
(Enable Match Case: OFF, Regex: ON)

Find: #e6b800|#E6B800
Replace: #A98237
(Enable Match Case: OFF, Regex: ON)

Find: #0F021C|#0f021c
Replace: #0B0B0D
(Enable Match Case: OFF, Regex: ON)

Find: #020e27
Replace: #121217
(Enable Match Case: OFF, Regex: ON)

Find: #1D112A|#1d112a
Replace: #191922
(Enable Match Case: OFF, Regex: ON)

Find: rgba\(255,\s*204,\s*51,\s*0\.3\)
Replace: rgba(197, 155, 72, 0.22)
(Enable Match Case: OFF, Regex: ON)

Find: rgba\(255,\s*204,\s*51,\s*0\.2\)
Replace: rgba(197, 155, 72, 0.15)
(Enable Match Case: OFF, Regex: ON)

Find: rgba\(255,\s*204,\s*51,\s*0\.4\)
Replace: rgba(197, 155, 72, 0.3)
(Enable Match Case: OFF, Regex: ON)

Find: rgba\(255,\s*204,\s*51,\s*0\.5\)
Replace: rgba(197, 155, 72, 0.4)
(Enable Match Case: OFF, Regex: ON)

Find: rgba\(255,\s*204,\s*51,\s*0\.6\)
Replace: rgba(197, 155, 72, 0.5)
(Enable Match Case: OFF, Regex: ON)

Find: rgba\(255,\s*204,\s*51,\s*0\.7\)
Replace: rgba(197, 155, 72, 0.6)
(Enable Match Case: OFF, Regex: ON)

Find: rgba\(255,\s*204,\s*51,\s*0\.8\)
Replace: rgba(197, 155, 72, 0.7)
(Enable Match Case: OFF, Regex: ON)

Find: rgba\(255,\s*204,\s*51,\s*0\.1\)
Replace: rgba(197, 155, 72, 0.08)
(Enable Match Case: OFF, Regex: ON)

Find: rgba\(255,\s*204,\s*51,\s*0\.15\)
Replace: rgba(197, 155, 72, 0.12)
(Enable Match Case: OFF, Regex: ON)
```

**For text colors** (be more careful - review each replacement):

```
Find: text-\[#ffffff\]|text-white
Review: Should these become text-[#F2F2F3] for primary text or text-[#B9BBC6] for body text?
(Manual review required - don't auto-replace)

Find: text-\[#808c99\]
Replace: text-[#8A8EA0]
(Enable Match Case: OFF, Regex: ON)
```

### 7.4 Using CSS Variables Instead of Hardcoded Colors

**Best Practice**: After replacing hardcoded colors, consider using CSS variables where possible:

**Instead of**:
```tsx
className="bg-[#0B0B0D] text-[#F2F2F3] border-[#C59B48]"
```

**Use**:
```tsx
className="bg-background text-foreground border-primary"
```

**Or with Tailwind arbitrary values using CSS variables**:
```tsx
className="bg-[var(--background)] text-[var(--foreground)] border-[var(--primary)]"
```

### 7.5 Component-Specific Color Mapping

For components that use Tailwind classes with hardcoded colors, here's the mapping:

| Old Tailwind Class | New Tailwind Class | CSS Variable Alternative |
|-------------------|-------------------|--------------------------|
| `bg-[#0F021C]` | `bg-[#0B0B0D]` | `bg-background` |
| `bg-[#1D112A]` | `bg-[#191922]` | `bg-card` |
| `bg-[#020e27]` | `bg-[#121217]` | `bg-background-dark` |
| `text-[#ffcc33]` | `text-[#C59B48]` | `text-primary` |
| `border-[#ffcc33]/30` | `border-[#C59B48]/22` | `border-primary/22` |
| `border-[#ffcc33]/20` | `border-[#C59B48]/15` | `border-primary/15` |
| `text-[#ffffff]` | `text-[#F2F2F3]` | `text-foreground` |
| `text-white/60` | `text-[#B9BBC6]` | `text-foreground-secondary` |

### 7.6 Verification Steps

After component-level updates:

1. **Search for remaining old colors**:
   ```bash
   # In terminal, run:
   grep -r "#ffcc33" src/
   grep -r "#0F021C" src/
   grep -r "#1D112A" src/
   grep -r "rgba(255, 204, 51" src/
   ```

2. **Check each file manually** for any missed instances

3. **Test visual appearance** of all pages:
   - HomePage
   - ProfilePage
   - LeaderboardPage
   - All component sections

4. **Verify color contrast** - ensure text is readable on new backgrounds

---

## Part 8: Complete Implementation Checklist

### Phase 1: CSS Variables (globals.css)
- [ ] Update Core Background Colors
- [ ] Update Card Colors
- [ ] Update Text Colors
- [ ] Update Border Colors
- [ ] Update Brand/Accent Colors
- [ ] Update Input Colors
- [ ] Update Sidebar Colors
- [ ] Update Popover Colors
- [ ] Update Chart Colors
- [ ] Update Gradients
- [ ] Update Shadows
- [ ] Update Tailwind Theme Mappings
- [ ] Update Glow Effects
- [ ] Update Scrollbar Colors
- [ ] Update Animations

### Phase 2: Font Family
- [ ] Update `index.html` - Add Playfair Display
- [ ] Update `src/config/typography.ts`
- [ ] Update `src/styles/globals.css` font variables
- [ ] Verify font weights

### Phase 3: Component-Level Color Updates
- [ ] Replace `#ffcc33` → `#C59B48` in all component files
- [ ] Replace `#ffb54d` → `#D6AE5A` in all component files
- [ ] Replace `#e6b800` → `#A98237` in all component files
- [ ] Replace `#0F021C` → `#0B0B0D` in all component files
- [ ] Replace `#020e27` → `#121217` in all component files
- [ ] Replace `#1D112A` → `#191922` in all component files
- [ ] Replace `rgba(255, 204, 51, ...)` → `rgba(197, 155, 72, ...)` in all component files
- [ ] Update text colors (`#ffffff` → `#F2F2F3` or `#B9BBC6` as appropriate)
- [ ] Review and update ProfilePage.tsx
- [ ] Review and update custom-form-elements.tsx
- [ ] Review and update Hero.tsx
- [ ] Review and update HowItWorks.tsx
- [ ] Review and update Leaderboard.tsx
- [ ] Review and update Footer.tsx
- [ ] Review and update ReferralModule.tsx
- [ ] Review and update all other component files

### Phase 4: Testing
- [ ] Visual inspection of all pages
- [ ] Verify color contrast and readability
- [ ] Test hover states and interactions
- [ ] Verify font rendering (Playfair Display for headings, Inter for body)
- [ ] Test Arabic font support
- [ ] Cross-browser testing
- [ ] Mobile responsiveness check

---

## End of Implementation Guide

This guide covers ALL color scheme and font family changes specified in the PDF, including:
- ✅ CSS variable updates in `globals.css`
- ✅ Font family changes (Playfair Display + Inter)
- ✅ Component-level hardcoded color replacements
- ✅ Systematic find & replace instructions
- ✅ Complete implementation checklist

Follow each section sequentially and test after each major change to ensure proper implementation.

