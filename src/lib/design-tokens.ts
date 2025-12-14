/* ========================================
   CODRA DESIGN TOKENS - TypeScript
   Programmatic access to design system
   ======================================== */

/**
 * Brand color tokens - "Radical Clarity" palette
 * High contrast, bold, intentional design for creative automation
 */
export const BRAND = {
  ink: '#0A0E12',           // Nearly pure black - primary background
  cream: '#FFFDF7',         // Warm white - primary text
  magenta: '#D81159',       // Deep magenta - primary action/statement color
  gold: '#F4D03F',          // Electric gold - secondary highlight
  teal: '#00D9D9',          // Electric teal - tertiary/interactive
  charcoal: '#1A1F26',      // Elevated backgrounds
} as const;

/**
 * Background color tokens
 */
export const BACKGROUND = {
  default: '#0A0E12',       // Ink - primary dark background
  elevated: '#1A1F26',      // Charcoal - elevated surfaces
  subtle: '#0F1319',        // Slightly lighter ink for subtle separation
} as const;

/**
 * Surface/glass color tokens
 */
export const SURFACE = {
  glass: 'rgba(10, 14, 18, 0.94)',        // Ink with high opacity for glass effect
  glassSoft: 'rgba(10, 14, 18, 0.85)',    // Softer glass effect
  chip: 'rgba(26, 31, 38, 0.95)',         // Charcoal chips
} as const;

/**
 * Border color tokens
 */
export const BORDER = {
  subtle: 'rgba(255, 253, 247, 0.08)',    // Cream at 8% opacity - nearly invisible
  strong: 'rgba(255, 253, 247, 0.16)',    // Cream at 16% opacity - visible
  accent: 'rgba(216, 17, 89, 0.3)',       // Magenta accent border
} as const;

/**
 * Text color tokens
 */
export const TEXT = {
  primary: '#FFFDF7',       // Cream - main text
  muted: '#A8B0BB',         // Muted gray-blue
  soft: '#787E88',          // Softer gray
  accent: '#F4D03F',        // Gold accent text
} as const;

/**
 * Accent color tokens - soft variants
 */
export const ACCENT = {
  tealSoft: 'rgba(0, 217, 217, 0.25)',     // Electric teal - subtle
  goldSoft: 'rgba(244, 208, 63, 0.25)',    // Electric gold - subtle
  magentaSoft: 'rgba(216, 17, 89, 0.25)',  // Deep magenta - subtle
} as const;

/**
 * Semantic state colors
 */
export const STATE = {
  success: '#10B981',       // Emerald - slightly muted
  warning: '#F59E0B',       // Amber
  error: '#EF4444',         // Red
  info: '#00D9D9',          // Electric teal (from brand palette)
} as const;

/**
 * Spacing tokens (pixels)
 */
export const SPACE = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
} as const;

/**
 * Typography - Font families
 */
export const FONT_FAMILY = {
  // Display: Bold, intentional headlines (Protest Poster aesthetic)
  display: '"Protest", "Space Grotesk", "Clash Display", sans-serif',
  // Body: Clean, readable text
  base: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  // Mono: Code and monospace
  mono: '"JetBrains Mono", "Fira Code", "Monaco", "Courier New", monospace',
} as const;

/**
 * Typography - Font sizes
 */
export const FONT_SIZE = {
  xs: '10px',
  sm: '11px',
  base: '13px',
  md: '14px',
  lg: '16px',
  xl: '18px',
  '2xl': '20px',
  '3xl': '24px',
  '4xl': '28px',
  '5xl': '32px',
  '6xl': '40px',
  '7xl': '48px',
} as const;

/**
 * Typography - Font weights
 */
export const FONT_WEIGHT = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

/**
 * Typography - Line heights
 */
export const LINE_HEIGHT = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
} as const;

/**
 * Typography presets for common use cases
 */
export const TYPOGRAPHY = {
  // Protest poster style - bold, intentional
  displayXl: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONT_SIZE['7xl'],
    fontWeight: FONT_WEIGHT.black,
    lineHeight: LINE_HEIGHT.tight,
    letterSpacing: '-0.02em',
  },
  displayLg: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONT_SIZE['6xl'],
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: LINE_HEIGHT.tight,
    letterSpacing: '-0.01em',
  },
  displayMd: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONT_SIZE['5xl'],
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: LINE_HEIGHT.tight,
    letterSpacing: '0em',
  },
  // Headline styles
  headingXl: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONT_SIZE['4xl'],
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: LINE_HEIGHT.tight,
  },
  headingLg: {
    fontFamily: FONT_FAMILY.base,
    fontSize: FONT_SIZE['3xl'],
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: LINE_HEIGHT.tight,
  },
  headingMd: {
    fontFamily: FONT_FAMILY.base,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: LINE_HEIGHT.normal,
  },
  headingSm: {
    fontFamily: FONT_FAMILY.base,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: LINE_HEIGHT.normal,
  },
  // Body text
  bodyLg: {
    fontFamily: FONT_FAMILY.base,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: LINE_HEIGHT.relaxed,
  },
  bodyMd: {
    fontFamily: FONT_FAMILY.base,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: LINE_HEIGHT.relaxed,
  },
  bodySm: {
    fontFamily: FONT_FAMILY.base,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: LINE_HEIGHT.normal,
  },
  // Labels and UI text
  labelLg: {
    fontFamily: FONT_FAMILY.base,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: LINE_HEIGHT.normal,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  labelMd: {
    fontFamily: FONT_FAMILY.base,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: LINE_HEIGHT.normal,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  labelSm: {
    fontFamily: FONT_FAMILY.base,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: LINE_HEIGHT.normal,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  // Code text
  code: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: LINE_HEIGHT.normal,
  },
  codeLg: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: LINE_HEIGHT.normal,
  },
} as const;

/**
 * Border radius tokens
 */
export const RADIUS = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  full: '999px',
} as const;

/**
 * Shadow tokens
 */
export const SHADOW = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
  md: '0 8px 24px rgba(0, 0, 0, 0.55)',
  lg: '0 18px 50px rgba(0, 0, 0, 0.65)',
  xl: '0 22px 60px rgba(0, 0, 0, 0.85)',
} as const;

/**
 * Backdrop/filter tokens
 */
export const BACKDROP = {
  blurSm: 'blur(8px)',
  blurMd: 'blur(12px)',
  blurLg: 'blur(18px)',
} as const;

/**
 * Transition/animation tokens
 */
export const TRANSITION = {
  fast: '100ms ease',
  base: '160ms ease',
  slow: '300ms ease',
} as const;

/**
 * Z-index tokens
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
} as const;

/**
 * Gradient tokens - Protest Poster inspired
 */
export const GRADIENT = {
  // Energy flow: Magenta to Teal
  energy: 'linear-gradient(135deg, #D81159 0%, #00D9D9 100%)',
  // Forge: Gold to Magenta (warmth + intensity)
  forge: 'linear-gradient(135deg, #F4D03F 0%, #D81159 100%)',
  // Code: Teal to Cream (digital clarity)
  code: 'linear-gradient(135deg, #00D9D9 0%, #FFFDF7 100%)',
  // Dark overlay for panels
  dark: 'linear-gradient(to bottom, rgba(26, 31, 38, 0.5) 0%, rgba(10, 14, 18, 0.8) 55%)',
  // Subtle radial overlay
  overlay: `radial-gradient(circle at top, rgba(0, 217, 217, 0.12) 0, transparent 58%),
            radial-gradient(circle at bottom right, rgba(244, 208, 63, 0.1) 0, transparent 55%)`,
} as const;

/**
 * Semantic color aliases for component states
 */
export const SEMANTIC = {
  /* Primary action states - Magenta */
  primary: BRAND.magenta,           // #D81159
  primaryHover: '#B30D47',          // Darker magenta on hover
  primaryActive: '#8B0A35',         // Even darker on active
  primaryDisabled: 'rgba(216, 17, 89, 0.4)',

  /* Danger/error states */
  danger: STATE.error,
  dangerBg: 'rgba(239, 68, 68, 0.12)',
  dangerBorder: 'rgba(239, 68, 68, 0.4)',

  /* Success states */
  success: STATE.success,
  successBg: 'rgba(16, 185, 129, 0.12)',
  successBorder: 'rgba(16, 185, 129, 0.4)',

  /* Warning states */
  warning: STATE.warning,
  warningBg: 'rgba(245, 158, 11, 0.12)',
  warningBorder: 'rgba(245, 158, 11, 0.4)',

  /* Info states */
  info: STATE.info,
  infoBg: 'rgba(0, 217, 217, 0.12)',
  infoBorder: 'rgba(0, 217, 217, 0.4)',

  /* Panel styles */
  panelBg: SURFACE.glass,
  panelBgSoft: SURFACE.glassSoft,
  panelBgElevated: BACKGROUND.elevated,
  panelBorder: BORDER.subtle,
  panelShadow: SHADOW.lg,

  /* Input states */
  inputBg: BACKGROUND.elevated,
  inputBorder: BORDER.subtle,
  inputBorderHover: BORDER.strong,
  inputBorderFocus: BORDER.accent,
  inputText: TEXT.primary,

  /* Badge/chip styles */
  badgeBg: SURFACE.chip,
  badgeBorder: BORDER.subtle,
  badgeText: TEXT.muted,

  /* Navigation */
  navBg: 'rgba(10, 14, 18, 0.95)',
  navBorder: BORDER.subtle,

  /* Code */
  codeBg: BACKGROUND.elevated,
  codeText: TEXT.primary,
  codeBorder: BORDER.subtle,
} as const;

/**
 * Breakpoints for responsive design
 */
export const BREAKPOINTS = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
  ultrawide: '1920px',
} as const;

/**
 * Helper type to extract all token keys
 */
export type TokenKey =
  | keyof typeof BRAND
  | keyof typeof BACKGROUND
  | keyof typeof SURFACE
  | keyof typeof BORDER
  | keyof typeof TEXT
  | keyof typeof STATE
  | keyof typeof SEMANTIC;

/**
 * Get CSS variable reference for a token
 * @example getCSSVar('brand', 'teal') => 'var(--brand-teal)'
 * @example getCSSVar('space', 'lg') => 'var(--space-lg)'
 */
export function getCSSVar(
  category: 'brand' | 'space' | 'radius' | 'font-size' | 'shadow' | 'bg' | 'text' | 'border',
  key: string
): string {
  return `var(--${category}-${key})`;
}

/**
 * Build a transition property string
 * @example buildTransition('all') => 'all 160ms ease'
 */
export function buildTransition(property: string = 'all', duration: keyof typeof TRANSITION = 'base'): string {
  return `${property} ${TRANSITION[duration]}`;
}

/**
 * Build a box shadow value
 * @example buildShadow('lg') => '0 18px 50px rgba(0, 0, 0, 0.65)'
 */
export function buildShadow(size: keyof typeof SHADOW = 'md'): string {
  return SHADOW[size];
}

/**
 * Build spacing utility value
 * @example buildSpacing('lg', 'md') => '16px 12px'
 */
export function buildSpacing(...sizes: (keyof typeof SPACE)[]): string {
  return sizes.map((size) => SPACE[size]).join(' ');
}

/**
 * Color palette for component-level styling
 */
export const PALETTE = {
  brand: BRAND,
  background: BACKGROUND,
  surface: SURFACE,
  border: BORDER,
  text: TEXT,
  accent: ACCENT,
  state: STATE,
  semantic: SEMANTIC,
} as const;

/**
 * Common component style presets
 */
export const COMPONENTS = {
  button: {
    primary: {
      bg: SEMANTIC.primary,
      bgHover: SEMANTIC.primaryHover,
      bgActive: SEMANTIC.primaryActive,
      text: BACKGROUND.elevated,
      padding: `${SPACE.sm} ${SPACE.md}`,
      borderRadius: RADIUS.full,
      fontSize: FONT_SIZE.sm,
      fontWeight: FONT_WEIGHT.semibold,
      transition: buildTransition('all'),
    },
    secondary: {
      bg: 'transparent',
      border: BORDER.strong,
      text: TEXT.primary,
      padding: `${SPACE.sm} ${SPACE.md}`,
      borderRadius: RADIUS.full,
      fontSize: FONT_SIZE.sm,
      fontWeight: FONT_WEIGHT.semibold,
      transition: buildTransition('all'),
    },
  },
  input: {
    base: {
      bg: SEMANTIC.inputBg,
      border: SEMANTIC.inputBorder,
      borderHover: SEMANTIC.inputBorderHover,
      borderFocus: SEMANTIC.inputBorderFocus,
      text: SEMANTIC.inputText,
      padding: `${SPACE.sm} ${SPACE.md}`,
      borderRadius: RADIUS.full,
      fontSize: FONT_SIZE.sm,
      transition: buildTransition('all'),
    },
  },
  panel: {
    glass: {
      bg: SEMANTIC.panelBg,
      border: SEMANTIC.panelBorder,
      borderRadius: RADIUS.xl,
      shadow: SEMANTIC.panelShadow,
      backdropFilter: BACKDROP.blurMd,
    },
    glassSoft: {
      bg: SEMANTIC.panelBgSoft,
      border: SEMANTIC.panelBorder,
      borderRadius: RADIUS.lg,
      backdropFilter: BACKDROP.blurSm,
    },
  },
  badge: {
    base: {
      bg: SEMANTIC.badgeBg,
      border: SEMANTIC.badgeBorder,
      text: SEMANTIC.badgeText,
      padding: `${SPACE.xs} ${SPACE.sm}`,
      borderRadius: RADIUS.full,
      fontSize: FONT_SIZE.xs,
      fontWeight: FONT_WEIGHT.semibold,
    },
    success: {
      bg: SEMANTIC.successBg,
      border: SEMANTIC.successBorder,
      text: SEMANTIC.success,
    },
    error: {
      bg: SEMANTIC.dangerBg,
      border: SEMANTIC.dangerBorder,
      text: SEMANTIC.danger,
    },
    warning: {
      bg: SEMANTIC.warningBg,
      border: SEMANTIC.warningBorder,
      text: SEMANTIC.warning,
    },
    info: {
      bg: SEMANTIC.infoBg,
      border: SEMANTIC.infoBorder,
      text: SEMANTIC.info,
    },
  },
} as const;

export default {
  BRAND,
  BACKGROUND,
  SURFACE,
  BORDER,
  TEXT,
  ACCENT,
  STATE,
  SPACE,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  LINE_HEIGHT,
  RADIUS,
  SHADOW,
  BACKDROP,
  TRANSITION,
  Z_INDEX,
  GRADIENT,
  SEMANTIC,
  BREAKPOINTS,
  PALETTE,
  COMPONENTS,
};
