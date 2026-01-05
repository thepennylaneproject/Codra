/**
 * GLASS UTILITIES
 * 
 * Helpers for maintaining glass card legibility and adaptive opacity.
 * Part of the "Guardians x Apple" design system.
 * 
 * Design philosophy:
 * - Higher density = more opaque for readability
 * - Glass surfaces must maintain WCAG AA contrast
 * - Blur adapts to content complexity
 */

import { TASTE_GOVERNOR } from './taste-governor';
import { GLASS_DENSITY } from '../design-tokens';
import { getContrastRatio } from './color-utils';

export type DensityLevel = 'sparse' | 'balanced' | 'dense';

/**
 * Calculate glass opacity based on content density
 * Higher density = more opaque for readability
 */
export function getGlassOpacity(density: DensityLevel): number {
    return GLASS_DENSITY[density];
}

/**
 * Get blur strength class based on density
 * Dense content gets more blur for visual separation
 */
export function getBlurClass(density: DensityLevel): string {
    const classMap: Record<DensityLevel, string> = {
        sparse: 'glass-panel',
        balanced: 'glass-panel',
        dense: 'glass-panel',
    };
    return classMap[density];
}

/**
 * Get blur amount in pixels based on density
 */
export function getBlurAmount(density: DensityLevel): number {
    const blurMap: Record<DensityLevel, number> = {
        sparse: 16,
        balanced: 16,
        dense: 16,
    };
    return blurMap[density];
}

export interface LegibilityResult {
    isLegible: boolean;
    contrastRatio: number;
    meetsAA: boolean;
    meetsAAA: boolean;
    suggestion?: string;
}

/**
 * Check if text will be legible on a glass surface
 * Returns detailed analysis with improvement suggestions
 * 
 * @param textColor - CSS color value for text
 * @param backgroundColor - CSS color value for base background
 * @param glassOpacity - Opacity of the glass surface (0-1)
 */
export function checkGlassLegibility(
    textColor: string,
    backgroundColor: string,
    glassOpacity: number = TASTE_GOVERNOR.glass.opacity
): LegibilityResult {
    // Calculate effective background considering glass tint
    // For simplicity, we test against the darkest expected case
    const ratio = getContrastRatio(textColor, backgroundColor);

    const meetsAA = ratio >= 4.5;
    const meetsAAA = ratio >= 7.0;

    let suggestion: string | undefined;

    if (!meetsAA) {
        if (glassOpacity < 0.7) {
            suggestion = 'Increase glass opacity to improve text contrast';
        } else {
            suggestion = 'Use a lighter text color or darker glass tint';
        }
    }

    return {
        isLegible: meetsAA,
        contrastRatio: ratio,
        meetsAA,
        meetsAAA,
        suggestion,
    };
}

/**
 * Get CSS custom property for glass opacity based on density
 */
export function getGlassOpacityVar(density: DensityLevel): string {
    return `var(--glass-density-${density})`;
}

/**
 * Calculate border opacity based on glass panel state
 * Active/focused states get stronger borders
 */
export function getBorderOpacity(
    isActive: boolean = false,
    isHovered: boolean = false
): number {
    const base = TASTE_GOVERNOR.glass.borderOpacity;

    if (isActive) {
        return Math.min(base * 2.5, 0.25);
    }
    if (isHovered) {
        return Math.min(base * 1.5, 0.15);
    }
    return base;
}

/**
 * Build inline styles for a glass surface
 */
export function buildGlassStyles(options: {
    density?: DensityLevel;
    isActive?: boolean;
    isHovered?: boolean;
}): React.CSSProperties {
    const { density = 'balanced', isActive = false, isHovered = false } = options;

    return {
        backgroundColor: `rgba(18, 23, 29, ${getGlassOpacity(density)})`,
        borderColor: `rgba(255, 255, 255, ${getBorderOpacity(isActive, isHovered)})`,
    };
}

/**
 * Pre-built glass variants for common use cases
 */
export const GLASS_PRESETS = {
    panel: {
        density: 'balanced' as DensityLevel,
        blur: 16,
        opacity: 0.7,
        borderRadius: '12px',
    },
    card: {
        density: 'balanced' as DensityLevel,
        blur: 16,
        opacity: 0.7,
        borderRadius: '12px',
    },
    modal: {
        density: 'dense' as DensityLevel,
        blur: 16,
        opacity: 0.7,
        borderRadius: '12px',
    },
    tooltip: {
        density: 'dense' as DensityLevel,
        blur: 16,
        opacity: 0.7,
        borderRadius: '12px',
    },
    floating: {
        density: 'sparse' as DensityLevel,
        blur: 16,
        opacity: 0.7,
        borderRadius: '12px',
    },
} as const;
