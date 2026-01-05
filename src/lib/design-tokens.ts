/* ========================================
   CODRA DESIGN TOKENS - TypeScript
   Programmatic access to design system
   ======================================== */

/**
 * Brand color tokens - "Radical Clarity" palette
 * High contrast, bold, intentional design for creative automation
 */
export const BRAND = {
  ink: '#1A1A1A',           // Deep Ink - primary dark / text
  ivory: '#FFFAF0',         // Warm Ivory - primary background
  coral: '#FF6B6B',         // Vibrant Coral - Codra accent (GOVERNED - see ACCENT_CORAL)
  gold: '#C7A76A',          // Muted Gold Foil
  charcoal: '#2D2D2D',      // Sub-ink for depth
} as const;

/**
 * Background color tokens
 */
export const BACKGROUND = {
  default: '#FFFAF0',       // Ivory
  elevated: '#F5F0E6',      // Slightly darker ivory
  subtle: '#FAF5ED',        // Very subtle ivory
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
  primary: '#1A1A1A',       // Ink
  muted: '#5A5A5A',         // Muted ink
  soft: '#8A8A8A',          // Lighter gray
  accent: '#FF6B6B',        // Coral accent (GOVERNED - use semantic tokens instead)
} as const;

/**
 * Accent color tokens - soft variants
 */
export const ACCENT_SUBTLE = {
  tealSoft: 'rgba(0, 217, 217, 0.25)',     // Electric teal - subtle
  goldSoft: 'rgba(244, 208, 63, 0.25)',    // Electric gold - subtle
  magentaSoft: 'rgba(216, 17, 89, 0.25)',  // Deep magenta - subtle
} as const;

/** @deprecated Use ACCENT_SUBTLE instead */
export const ACCENT_SOFT = ACCENT_SUBTLE;

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
 * Spacing tokens (8px rhythm)
 */
export const SPACE = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
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
 * Typography - Font sizes (LOCKED: 4 only)
 */
export const FONT_SIZE = {
  sm: '12px',    // Label/Meta
  base: '14px',  // Body
  lg: '16px',    // Section Heading
  xl: '24px',    // Page Title
} as const;

/**
 * Typography - Font weights (LOCKED: 3 only)
 */
export const FONT_WEIGHT = {
  regular: 400,
  medium: 500,
  semibold: 600,
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
 * Typography presets - LOCKED to 4 roles
 */
export const TYPOGRAPHY = {
  // Page Title: 24px / semibold / 1.2
  pageTitle: {
    fontFamily: FONT_FAMILY.base,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: LINE_HEIGHT.tight,
  },
  // Section Heading: 16px / semibold / 1.4
  sectionHeading: {
    fontFamily: FONT_FAMILY.base,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 1.4,
  },
  // Body: 14px / regular / 1.5
  body: {
    fontFamily: FONT_FAMILY.base,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: LINE_HEIGHT.normal,
  },
  // Label: 12px / medium / 1.4
  label: {
    fontFamily: FONT_FAMILY.base,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: 1.4,
  },
  // Mono: 12px / regular / 1.5
  mono: {
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
 * Motion tokens - Atmospheric effects
 * "Guardians of the Galaxy meets Apple" - slow, subtle, optional
 */
export const MOTION = {
  parallax: {
    duration: '20s',
    distance: '50px',
    easing: 'linear',
  },
  shimmer: {
    duration: '8s',
    opacity: 0.04,
  },
  transition: {
    instant: '100ms ease',
    expressive: '400ms ease-out',
    atmospheric: '800ms ease-in-out',
  },
  // User preference support
  preference: {
    key: 'codra-motion-preference',
    options: ['auto', 'on', 'off'] as const,
  },
} as const;

/**
 * Accent tokens - Restrained usage only
 * ALLOWED: Primary CTA (one per screen), Critical Focus (rare)
 */
export const ACCENT = {
  permitted: ['primary-cta', 'critical-focus'] as const,
  primary: '#C7A76A',
  soft: 'rgba(199, 167, 106, 0.25)',
  border: 'rgba(199, 167, 106, 0.35)',
} as const;

/** @deprecated Use ACCENT instead */
export const GOLD_ACCENT = ACCENT;

/**
 * CORAL ACCENT GOVERNANCE
 * ===================================================
 * Strict governance for coral (#FF6B6B) accent color.
 *
 * PHILOSOPHY: Accent means "do this next" or "success achieved"
 * - If something is always accented, nothing is primary
 * - Chrome (navigation, tabs, headers) should NEVER use accent
 * - Accent moves with the user through a flow
 *
 * PERMITTED USES ONLY:
 * 1. Primary CTA - Button background fill
 * 2. Active Progress - Dot/spinner fill color
 * 3. Success State - Checkmark, toast fill or border
 * 4. Active Tab Indicator - 2px bottom border underline
 * 5. Selected Output - Inspector item left border (2px)
 *
 * PROHIBITED USES (use neutral alternatives):
 * - Brand dot in header (decorative)
 * - Tab underline on hover (chrome state)
 * - Settings selection (configuration is neutral)
 * - Avatar ring (feature removed)
 * - Upgrade badge (monetization shouldn't scream)
 * - Model Selector badge (feature hidden)
 * - Sparkle particles (feature removed)
 */
export const ACCENT_CORAL = {
  /** Base coral color - DO NOT USE DIRECTLY */
  base: BRAND.coral,                    // #FF6B6B

  /** Hover state for interactive coral elements */
  hover: '#FF5252',                     // Darker coral on hover

  /** Active/pressed state */
  active: '#E64848',                    // Even darker when active

  /** Muted background variant */
  muted: 'rgba(255, 107, 107, 0.1)',   // 10% opacity for subtle backgrounds

  /** Border variant for selected states */
  border: 'rgba(255, 107, 107, 0.3)',  // 30% opacity for borders

  /**
   * PERMITTED USE TOKENS
   * Use these semantic tokens instead of the base color
   */
  permitted: {
    /** PRIMARY CTA - Button background fill */
    primaryCta: {
      bg: BRAND.coral,                  // #FF6B6B
      bgHover: '#FF5252',
      bgActive: '#E64848',
      text: BRAND.ivory,                // High contrast text
      border: 'transparent',
    },

    /** ACTIVE PROGRESS - Dot/spinner fill */
    activeProgress: {
      fill: BRAND.coral,                // #FF6B6B
      bg: 'rgba(255, 107, 107, 0.1)',  // Subtle background
    },

    /** SUCCESS STATE - Checkmark, toast */
    success: {
      fill: BRAND.coral,                // #FF6B6B for icons
      border: 'rgba(255, 107, 107, 0.3)', // For bordered toasts
      bg: 'rgba(255, 107, 107, 0.1)',   // For background fills
    },

    /** ACTIVE TAB INDICATOR - 2px bottom border */
    activeTab: {
      borderBottom: `2px solid ${BRAND.coral}`,
      borderColor: BRAND.coral,
    },

    /** SELECTED OUTPUT - Inspector item left border */
    selectedOutput: {
      borderLeft: `2px solid ${BRAND.coral}`,
      borderColor: BRAND.coral,
    },
  },

  /**
   * PROHIBITED REPLACEMENTS
   * Use these neutral alternatives instead of coral
   */
  prohibited: {
    /** Instead of coral brand dot - use white or remove */
    brandDot: TEXT.soft,                // #8A8A8A or 'transparent'

    /** Instead of coral tab hover - use opacity */
    tabHover: 'rgba(255, 255, 255, 0.05)',

    /** Instead of coral settings selection - use border */
    settingsSelection: BORDER.strong,   // Neutral border

    /** Instead of coral upgrade badge - use subtle variant */
    upgradeBadge: TEXT.muted,           // #5A5A5A
  },
} as const;

/**
 * Permitted accent usage types for type safety
 */
export type AccentCoralUsage =
  | 'primary-cta'
  | 'active-progress'
  | 'success-state'
  | 'active-tab'
  | 'selected-output';

/**
 * Accessibility tokens - WCAG compliance
 */
export const A11Y = {
  contrast: {
    normal: 4.5,    // WCAG AA for normal text
    large: 3.0,     // WCAG AA for large text (18px+ or 14px bold)
    enhanced: 7.0,  // WCAG AAA
  },
  focusRing: {
    width: '3px',
    offset: '2px',
    color: 'var(--energy-teal)',
  },
  // Motion preference detection
  reducedMotionQuery: '(prefers-reduced-motion: reduce)',
} as const;

/**
 * Glass density tokens - Adaptive opacity
 */
export const GLASS_DENSITY = {
  sparse: 0.45,
  balanced: 0.6,
  dense: 0.8,
} as const;

/**
 * Semantic color aliases for component states
 */
export const SEMANTIC = {
  /* Primary action states - Coral (GOVERNED - use ACCENT_CORAL.permitted.primaryCta) */
  primary: ACCENT_CORAL.base,           // #FF6B6B
  primaryHover: ACCENT_CORAL.hover,     // #FF5252
  primaryActive: ACCENT_CORAL.active,   // #E64848
  primaryDisabled: 'rgba(255, 107, 107, 0.4)',

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
  accentCoral: ACCENT_CORAL,
  state: STATE,
  semantic: SEMANTIC,
} as const;

/**
 * Common component style presets
 */
export const COMPONENTS = {
  button: {
    primary: {
      bg: ACCENT_CORAL.permitted.primaryCta.bg,
      bgHover: ACCENT_CORAL.permitted.primaryCta.bgHover,
      bgActive: ACCENT_CORAL.permitted.primaryCta.bgActive,
      text: ACCENT_CORAL.permitted.primaryCta.text,
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
      fontSize: FONT_SIZE.sm,
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

/**
 * Token file version (increment on breaking visual changes).
 */
export const TOKENS_VERSION = '2025-03-01';

/**
 * UI palette tokens (Ivory & Ink system).
 */
export const UI = {
  bg: BRAND.ivory,
  bgSecondary: BACKGROUND.subtle,
  text: BRAND.ink,
  textMuted: TEXT.muted,
  textDisabled: TEXT.soft,
  border: 'rgba(26, 26, 26, 0.1)',
  borderSoft: 'rgba(26, 26, 26, 0.05)',
  borderStrong: 'rgba(26, 26, 26, 0.2)',
} as const;

/**
 * Cosmic palette tokens (dark system).
 */
export const COSMIC = {
  void: '#050608',
  voidSoft: '#0A0E12',
  voidElevated: '#12171D',
  stardust: '#F8F9FA',
  stardustWarm: '#FFFDF7',
  stardustMuted: '#9CA3AF',
  stardustDim: '#6B7280',
} as const;

/**
 * Shell palette tokens (panel system).
 */
export const SHELL = {
  surface0: '#0A0A0F',
  surface1: '#12121A',
  surface2: '#1A1A24',
  border: '#2A2A36',
  textPrimary: '#F5F5F7',
  textSecondary: '#8A8A9A',
} as const;

/**
 * Energy spectrum tokens (accent spectrum).
 */
export const ENERGY = {
  teal: '#00D9D9',
  cyan: '#22D3EE',
  magenta: '#D81159',
  rose: '#F43F5E',
  gold: '#F4D03F',
  amber: '#F59E0B',
} as const;

/**
 * Glow tokens (luminous effects).
 */
export const GLOW = {
  teal: 'rgba(0, 217, 217, 0.5)',
  tealSoft: 'rgba(0, 217, 217, 0.2)',
  tealSubtle: 'rgba(0, 217, 217, 0.08)',
  magenta: 'rgba(216, 17, 89, 0.5)',
  magentaSoft: 'rgba(216, 17, 89, 0.2)',
  gold: 'rgba(244, 208, 63, 0.5)',
  goldSoft: 'rgba(244, 208, 63, 0.15)',
} as const;

/**
 * Glass surface tokens.
 */
export const GLASS = {
  bg: 'rgba(18, 23, 29, 0.85)',
  frosted: 'rgba(18, 23, 29, 0.92)',
  clear: 'rgba(18, 23, 29, 0.6)',
  edge: 'rgba(255, 255, 255, 0.08)',
  edgeBright: 'rgba(255, 255, 255, 0.15)',
  highlight: 'rgba(255, 255, 255, 0.05)',
} as const;

/**
 * Layout and sizing tokens.
 */
export const LAYOUT = {
  breakpoints: BREAKPOINTS,
  shell: {
    headerHeight: '56px',
    sidebarLeft: '240px',
    sidebarRight: '320px',
    gutter: '24px',
  },
  stripHeight: '40px',
} as const;

/**
 * Desk surface tokens.
 */
export const DESK = {
  bg: BRAND.ivory,
  surface: BACKGROUND.subtle,
  border: UI.borderSoft,
  textPrimary: BRAND.ink,
  textMuted: TEXT.muted,
  tints: {
    write: ENERGY.magenta,
    design: ENERGY.teal,
    code: ENERGY.gold,
    analyze: ENERGY.cyan,
  },
} as const;

/**
 * Extended font sizes for UI utilities.
 */
export const FONT_SIZE_EXTENDED = {
  '2xs': FONT_SIZE.sm,
  xs: FONT_SIZE.sm,
  sm: FONT_SIZE.base,
  base: FONT_SIZE.lg,
  md: FONT_SIZE.lg,
  lg: FONT_SIZE.lg,
  xl: FONT_SIZE.xl,
  '2xl': FONT_SIZE.xl,
  '3xl': FONT_SIZE.xl,
  '4xl': FONT_SIZE.xl,
} as const;

/**
 * Extended font weights for UI utilities.
 */
export const FONT_WEIGHT_EXTENDED = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 600,
} as const;

/**
 * Extended spacing scale (semantic + extended).
 */
export const SPACING_EXTENDED = {
  xs: SPACE.xs,
  sm: SPACE.sm,
  md: SPACE.md,
  lg: SPACE.lg,
  xl: SPACE.xl,
  '2xl': SPACE['2xl'],
  '3xl': '64px',
} as const;

/**
 * Single source of truth for all design tokens.
 */
export const tokens = {
  /** Colors */
  colors: {
    brand: {
      ...BRAND,
      teal: ENERGY.teal,
      violet: '#7A77FF',
      magenta: ENERGY.magenta,
      cream: COSMIC.stardustWarm,
    },
    ui: UI,
    cosmic: COSMIC,
    shell: SHELL,
    energy: ENERGY,
    glow: GLOW,
    glass: GLASS,
    background: BACKGROUND,
    surface: SURFACE,
    border: BORDER,
    text: TEXT,
    state: STATE,
    accent: ACCENT,
    accentCoral: ACCENT_CORAL,
    semantic: SEMANTIC,
  },
  /** Typography */
  typography: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE_EXTENDED,
    fontWeight: FONT_WEIGHT_EXTENDED,
    lineHeight: LINE_HEIGHT,
  },
  /** Spacing */
  spacing: {
    scale: {
      0: '0',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
      12: '48px',
    },
    semantic: SPACING_EXTENDED,
  },
  /** Shadows */
  shadows: SHADOW,
  /** Borders */
  borders: {
    radius: RADIUS,
  },
  /** Z-index */
  zIndex: Z_INDEX,
  /** Motion */
  motion: MOTION,
  /** Transitions */
  transitions: TRANSITION,
  /** Backdrop */
  backdrop: BACKDROP,
  /** Gradients */
  /** Layout */
  layout: LAYOUT,
  /** Desk surfaces */
  desk: DESK,
  /** CSS variable map (generated output source) */
  cssVars: {
    colors: {
      'brand-ink': BRAND.ink,
      'brand-ivory': BRAND.ivory,
      'brand-coral': BRAND.coral,
      'brand-gold': BRAND.gold,
      'brand-teal': ENERGY.teal,
      'brand-violet': '#7A77FF',
      'brand-magenta': ENERGY.magenta,
      'brand-cream': COSMIC.stardustWarm,
      'brand-accent': BRAND.coral,
      'color-brand-coral': BRAND.coral,
      'color-ink': BRAND.ink,
      'color-ink-light': TEXT.muted,
      'color-ink-muted': TEXT.soft,
      'color-ivory': BRAND.ivory,
      'ui-bg': UI.bg,
      'ui-border': UI.border,
      'ui-border-soft': UI.borderSoft,
      'ui-text': UI.text,
      'void': COSMIC.void,
      'void-soft': COSMIC.voidSoft,
      'void-elevated': COSMIC.voidElevated,
      'stardust': COSMIC.stardust,
      'stardust-warm': COSMIC.stardustWarm,
      'stardust-muted': COSMIC.stardustMuted,
      'stardust-dim': COSMIC.stardustDim,
      'energy-teal': ENERGY.teal,
      'energy-cyan': ENERGY.cyan,
      'energy-magenta': ENERGY.magenta,
      'energy-rose': ENERGY.rose,
      'energy-gold': ENERGY.gold,
      'energy-amber': ENERGY.amber,
      'glass-bg': GLASS.bg,
      'glass-frosted': GLASS.frosted,
      'glass-clear': GLASS.clear,
      'glass-edge': GLASS.edge,
      'glass-border': GLASS.edge,
      'glass-blur': BACKDROP.blurMd,
      'surface-glass': SURFACE.glass,
      'shell-surface-0': SHELL.surface0,
      'shell-surface-1': SHELL.surface1,
      'shell-surface-2': SHELL.surface2,
      'shell-border': SHELL.border,
      'shell-text-primary': SHELL.textPrimary,
      'shell-text-secondary': SHELL.textSecondary,
      'bg-default': BACKGROUND.default,
      'bg-elevated': BACKGROUND.elevated,
      'bg-subtle': BACKGROUND.subtle,
      'nav-bg': SEMANTIC.navBg,
      'panel-bg': SEMANTIC.panelBg,
      'border-subtle': BORDER.subtle,
      'border-strong': BORDER.strong,
      'border-accent': BORDER.accent,
      'text-primary': TEXT.primary,
      'text-muted': TEXT.muted,
      'text-soft': TEXT.soft,
      'text-accent': ACCENT.primary,
      'state-success': STATE.success,
      'state-warning': STATE.warning,
      'state-error': STATE.error,
      'state-info': STATE.info,
      'color-bg': BACKGROUND.default,
      'color-bg-primary': BACKGROUND.default,
      'color-bg-secondary': BACKGROUND.elevated,
      'color-border': BORDER.subtle,
      'color-border-soft': BORDER.subtle,
      'color-border-strong': BORDER.strong,
      'color-border-subtle': BORDER.subtle,
      'color-text-primary': TEXT.primary,
      'color-text-secondary': TEXT.muted,
      'color-text-muted': TEXT.soft,
      'color-surface': BACKGROUND.elevated,
      'color-surface-dark': SURFACE.glass,
      'color-primary': ACCENT_CORAL.base,
      'color-primary-hover': ACCENT_CORAL.hover,
      'color-primary-active': ACCENT_CORAL.active,
      'color-accent': ACCENT_CORAL.base,
      'color-accent-hover': ACCENT_CORAL.hover,
      'accent': ACCENT.primary,
      'accent-border': ACCENT.border,
      'progress-active': ACCENT_CORAL.permitted.activeProgress.fill,
      'progress-active-bg': ACCENT_CORAL.permitted.activeProgress.bg,
      'tab-active-border': BRAND.coral,
      'tab-active-border-width': '2px',
      'tab-hover-bg': UI.borderSoft,
      'button-primary-bg': ACCENT_CORAL.permitted.primaryCta.bg,
      'button-primary-bg-hover': ACCENT_CORAL.permitted.primaryCta.bgHover,
      'button-primary-bg-active': ACCENT_CORAL.permitted.primaryCta.bgActive,
      'button-primary-text': ACCENT_CORAL.permitted.primaryCta.text,
      'shell-resize-handle-active': BRAND.coral,
      'shell-resize-handle-hover': UI.borderStrong,
      'desk-bg': DESK.bg,
      'desk-surface': DESK.surface,
      'desk-border': DESK.border,
      'desk-text-primary': DESK.textPrimary,
      'desk-text-muted': DESK.textMuted,
      'desk-write-tint': DESK.tints.write,
      'desk-design-tint': DESK.tints.design,
      'desk-code-tint': DESK.tints.code,
      'desk-analyze-tint': DESK.tints.analyze,
    },
    glassDensity: {
      'glass-density-sparse': GLASS_DENSITY.sparse,
      'glass-density-balanced': GLASS_DENSITY.balanced,
      'glass-density-dense': GLASS_DENSITY.dense,
    },
    typography: {
      'font-family-base': FONT_FAMILY.base,
      'font-size-2xs': FONT_SIZE_EXTENDED['2xs'],
      'font-size-xs': FONT_SIZE_EXTENDED.xs,
      'font-size-sm': FONT_SIZE_EXTENDED.sm,
      'font-size-base': FONT_SIZE_EXTENDED.base,
      'font-size-md': FONT_SIZE_EXTENDED.md,
      'font-size-lg': FONT_SIZE_EXTENDED.lg,
      'font-size-xl': FONT_SIZE_EXTENDED.xl,
      'font-size-2xl': FONT_SIZE_EXTENDED['2xl'],
      'font-size-3xl': FONT_SIZE_EXTENDED['3xl'],
      'font-size-4xl': FONT_SIZE_EXTENDED['4xl'],
      'font-weight-regular': FONT_WEIGHT_EXTENDED.regular,
      'font-weight-medium': FONT_WEIGHT_EXTENDED.medium,
      'font-weight-semibold': FONT_WEIGHT_EXTENDED.semibold,
      'font-weight-bold': FONT_WEIGHT_EXTENDED.bold,
      'line-height-tight': LINE_HEIGHT.tight,
      'line-height-normal': LINE_HEIGHT.normal,
      'line-height-relaxed': LINE_HEIGHT.relaxed,
    },
    spacing: {
      'space-xs': SPACING_EXTENDED.xs,
      'space-sm': SPACING_EXTENDED.sm,
      'space-md': SPACING_EXTENDED.md,
      'space-lg': SPACING_EXTENDED.lg,
      'space-xl': SPACING_EXTENDED.xl,
      'space-2xl': SPACING_EXTENDED['2xl'],
      'space-3xl': SPACING_EXTENDED['3xl'],
    },
    radius: {
      'radius-md': RADIUS.md,
      'radius-lg': RADIUS.lg,
      'radius-xl': RADIUS.xl,
      'radius-full': RADIUS.full,
    },
    shadows: {
      'shadow-md': SHADOW.md,
      'shadow-xl': SHADOW.xl,
    },
    transitions: {
      'transition-base': TRANSITION.base,
      'motion-transition-instant': MOTION.transition.instant,
      'motion-transition-expressive': MOTION.transition.expressive,
    },
    zIndex: {
      'z-base': Z_INDEX.base,
      'z-sticky': Z_INDEX.sticky,
      'z-overlay': Z_INDEX.modalBackdrop,
      'z-modal': Z_INDEX.modal,
    },
    layout: {
      'shell-header-height': LAYOUT.shell.headerHeight,
      'shell-sidebar-left': LAYOUT.shell.sidebarLeft,
      'shell-sidebar-right': LAYOUT.shell.sidebarRight,
      'shell-gutter': LAYOUT.shell.gutter,
      'strip-height': LAYOUT.stripHeight,
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
  ACCENT_CORAL,
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
  SEMANTIC,
  BREAKPOINTS,
  PALETTE,
  COMPONENTS,
  MOTION,
  GOLD_ACCENT,
  A11Y,
  GLASS_DENSITY,
  TOKENS_VERSION,
  UI,
  COSMIC,
  SHELL,
  ENERGY,
  GLOW,
  GLASS,
  LAYOUT,
  DESK,
  FONT_SIZE_EXTENDED,
  FONT_WEIGHT_EXTENDED,
  SPACING_EXTENDED,
  tokens,
};
