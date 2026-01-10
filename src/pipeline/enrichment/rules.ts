/**
 * Deterministic Mapping Rules
 *
 * Rules for deriving energy, palette_mode, and other metadata
 * from image properties and AI analysis.
 *
 * These rules are deterministic and must never be recomputed at runtime.
 */

import type { Energy, PaletteMode } from '../types/metadata';

// ============================================================================
// Energy Mapping
// ============================================================================

/**
 * Derive energy level from visual characteristics
 */
export function deriveEnergy(analysis: {
  tags: string[];
  tone?: string;
  has_gradient?: boolean;
  has_3d?: boolean;
  has_glow?: boolean;
  is_minimal?: boolean;
  is_abstract?: boolean;
}): Energy {
  const tags = analysis.tags.map((t) => t.toLowerCase());
  const tone = analysis.tone?.toLowerCase() || '';

  // High energy indicators
  const highEnergyTags = [
    'gradient-heavy',
    '3d',
    'glow',
    'vibrant',
    'bold',
    'energetic',
    'flowing',
    'layered',
  ];
  const highEnergyCount = highEnergyTags.filter((t) => tags.includes(t)).length;

  // Low energy indicators
  const lowEnergyTags = [
    'minimal',
    'line-art',
    'spacious',
    'calm',
    'monochrome',
    'flat',
  ];
  const lowEnergyCount = lowEnergyTags.filter((t) => tags.includes(t)).length;

  // Medium energy indicators
  const mediumEnergyTags = [
    'modern',
    'geometric',
    'abstract',
    'professional',
    'structured',
  ];
  const mediumEnergyCount = mediumEnergyTags.filter((t) =>
    tags.includes(t),
  ).length;

  // Scoring system
  let score = 0;

  // Tag weights
  score += highEnergyCount * 2;
  score -= lowEnergyCount * 2;
  score += mediumEnergyCount * 0.5;

  // Tone weights
  if (['energetic', 'bold', 'playful'].includes(tone)) score += 2;
  if (['calm', 'sophisticated', 'professional'].includes(tone)) score -= 1;

  // Specific feature checks
  if (analysis.has_gradient) score += 1.5;
  if (analysis.has_3d) score += 2;
  if (analysis.has_glow) score += 1.5;
  if (analysis.is_minimal) score -= 2;
  if (analysis.is_abstract && !analysis.has_gradient) score -= 0.5;

  // Classify based on score
  if (score >= 3) return 'high';
  if (score <= -2) return 'low';
  return 'medium';
}

// ============================================================================
// Palette Mode Mapping
// ============================================================================

/**
 * RGB to brightness (perceived luminance)
 */
function rgbToBrightness(r: number, g: number, b: number): number {
  // Weighted luminance formula
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Derive palette mode from visual characteristics
 */
export function derivePaletteMode(analysis: {
  tags: string[];
  palette_primary?: string;
  brightness?: number; // 0-255 if available from image analysis
  contrast?: number; // 0-1 if available
}): PaletteMode {
  const tags = analysis.tags.map((t) => t.toLowerCase());

  // Explicit tag indicators
  if (tags.includes('dark-palette') || tags.includes('dark')) return 'dark';
  if (tags.includes('light-palette') || tags.includes('light')) return 'light';
  if (
    tags.includes('neutral-palette') ||
    tags.includes('monochrome') ||
    tags.includes('grayscale')
  )
    return 'neutral';

  // Analyze primary color brightness
  if (analysis.palette_primary) {
    const rgb = hexToRgb(analysis.palette_primary);
    if (rgb) {
      const brightness = rgbToBrightness(rgb.r, rgb.g, rgb.b);
      if (brightness > 180) return 'light';
      if (brightness < 80) return 'dark';
    }
  }

  // Use image brightness if available
  if (typeof analysis.brightness === 'number') {
    if (analysis.brightness > 180) return 'light';
    if (analysis.brightness < 80) return 'dark';
  }

  // Color theme tags
  if (tags.includes('warm-palette')) return 'light';
  if (tags.includes('cool-palette')) return 'dark';

  // Default to neutral if uncertain
  return 'neutral';
}

// ============================================================================
// Complexity Mapping (for vectors)
// ============================================================================

/**
 * Estimate vector complexity from tags and file size
 */
export function deriveComplexity(analysis: {
  tags: string[];
  bytes?: number;
  format?: string;
  is_icon?: boolean;
}): 'low' | 'medium' | 'high' {
  const tags = analysis.tags.map((t) => t.toLowerCase());

  // Icons are typically low complexity
  if (analysis.is_icon) return 'low';

  // Tag-based indicators
  if (tags.includes('minimal') || tags.includes('line-art')) return 'low';
  if (tags.includes('illustrated') || tags.includes('layered')) return 'medium';
  if (tags.includes('3d') || tags.includes('gradient-heavy')) return 'high';

  // File size heuristic for SVGs
  if (analysis.format === 'svg' && analysis.bytes) {
    if (analysis.bytes < 5000) return 'low'; // < 5KB
    if (analysis.bytes < 20000) return 'medium'; // < 20KB
    return 'high'; // > 20KB
  }

  // Default
  return 'medium';
}

// ============================================================================
// Themability and Invertibility (for vectors)
// ============================================================================

/**
 * Determine if vector is themable (single color or minimal palette)
 */
export function isThemable(analysis: {
  tags: string[];
  vector_type?: string;
}): boolean {
  const tags = analysis.tags.map((t) => t.toLowerCase());

  // Line art and stroke vectors are typically themable
  if (analysis.vector_type === 'stroke') return true;
  if (tags.includes('line-art')) return true;
  if (tags.includes('monochrome')) return true;

  // Multi-color or gradient vectors are not themable
  if (tags.includes('gradient-heavy')) return false;
  if (tags.includes('vibrant')) return false;

  // Default based on minimal/geometric
  if (tags.includes('minimal') || tags.includes('geometric')) return true;

  return false;
}

/**
 * Determine if vector is invertible (works in dark mode)
 */
export function isInvertible(analysis: {
  tags: string[];
  is_themable?: boolean;
}): boolean {
  const tags = analysis.tags.map((t) => t.toLowerCase());

  // Themable vectors are typically invertible
  if (analysis.is_themable) return true;

  // Monochrome vectors are invertible
  if (tags.includes('monochrome')) return true;

  // Gradient-heavy and multi-color vectors are not invertible
  if (tags.includes('gradient-heavy')) return false;
  if (tags.includes('vibrant')) return false;

  // Default based on minimal
  if (tags.includes('minimal')) return true;

  return false;
}

// ============================================================================
// Transparency Detection
// ============================================================================

/**
 * Analyze transparency characteristics
 */
export function analyzeTransparency(metadata: {
  has_alpha?: boolean;
  format?: string;
}): {
  supports_transparency: boolean;
  likely_transparent: boolean;
} {
  const format = metadata.format?.toLowerCase() || '';

  // Formats that support transparency
  const transparentFormats = ['png', 'webp', 'svg', 'gif'];
  const supports_transparency = transparentFormats.includes(format);

  // If format doesn't support transparency, it's definitely opaque
  if (!supports_transparency) {
    return {
      supports_transparency: false,
      likely_transparent: false,
    };
  }

  // If has_alpha is explicitly set, use it
  const likely_transparent = metadata.has_alpha ?? false;

  return {
    supports_transparency,
    likely_transparent,
  };
}

// ============================================================================
// Aspect Ratio Classification
// ============================================================================

export type AspectClass =
  | 'square'
  | 'portrait'
  | 'landscape'
  | 'panorama'
  | 'unknown';

/**
 * Classify aspect ratio into category
 */
export function classifyAspectRatio(
  width?: number,
  height?: number,
): AspectClass {
  if (!width || !height) return 'unknown';

  const ratio = width / height;

  if (ratio > 2.2) return 'panorama';
  if (ratio > 1.15) return 'landscape';
  if (ratio < 0.87) return 'portrait';
  return 'square';
}

// ============================================================================
// Size Classification
// ============================================================================

export type SizeClass =
  | 'icon'
  | 'small'
  | 'card'
  | 'hero'
  | 'texture'
  | 'unknown';

/**
 * Classify size based on dimensions and role
 */
export function classifySizeClass(
  width?: number,
  height?: number,
  role?: string,
): SizeClass {
  const maxDim = Math.max(width ?? 0, height ?? 0);

  if (role === 'icon') return 'icon';
  if (role === 'texture') return 'texture';

  if (maxDim >= 2000) return 'hero';
  if (maxDim >= 900) return 'card';
  if (maxDim > 0) return 'small';

  return 'unknown';
}
