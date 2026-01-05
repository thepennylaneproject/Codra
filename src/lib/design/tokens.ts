/**
 * CODRA DESIGN TOKENS
 * Authoritative source of truth for the Codra Design System.
 * These tokens are mirrored as CSS variables in :root.
 */

import { tokens } from '../design-tokens';

// === COLORS ===
export const colors = tokens.colors;

// === TYPOGRAPHY ===
export const typography = {
  fonts: tokens.typography.fontFamily,
  sizes: tokens.typography.fontSize,
  weights: tokens.typography.fontWeight,
  lineHeights: tokens.typography.lineHeight,
} as const;

// === SPACING ===
export const spacing = tokens.spacing.semantic;

// === LAYOUT ===
export const layout = {
  breakpoints: tokens.layout.breakpoints,
  zindex: tokens.zIndex,
  shell: tokens.layout.shell,
} as const;

// === BORDERS & SHADOWS ===
export const borders = {
  radius: tokens.borders.radius,
} as const;

export const radii = {
  sm: 'rounded-sm',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  full: 'rounded-full',
} as const;

export const shadows = tokens.shadows;

// === TRANSITIONS ===
export const transitions = {
  fast: 'transition-all duration-150 ease-out',
  base: 'transition-all duration-200 ease-out',
  slow: 'transition-all duration-300 ease-out',
} as const;
