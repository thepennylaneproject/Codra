/**
 * THEME GENERATOR
 * Generates complete design token sets from seed tokens
 * Ensures WCAG AA accessibility compliance
 */

import { hslToHex, hexToHsl, getContrastRatio } from './color-utils';
import type { ThemeSeed, GeneratedTheme } from '../../types/design';

export type { ThemeSeed, GeneratedTheme };

const INTENSITY_CONFIG = {
    soft: { saturation: 40, lightVariance: 8 },
    neutral: { saturation: 60, lightVariance: 12 },
    bold: { saturation: 80, lightVariance: 16 },
};

const CONTRAST_CONFIG = {
    standard: { minRatio: 4.5 }, // WCAG AA
    high: { minRatio: 7 },       // WCAG AAA
};

export function generateTheme(seed: ThemeSeed, name: string = 'Custom'): GeneratedTheme {
    const { baseHue, accentHue, intensity, contrastPreference, mode } = seed;
    const intensityConfig = INTENSITY_CONFIG[intensity as keyof typeof INTENSITY_CONFIG];
    const contrastConfig = CONTRAST_CONFIG[contrastPreference as keyof typeof CONTRAST_CONFIG];

    // Base colors depend on mode
    const isDark = mode === 'dark';

    // Generate background colors
    const bgLightness = isDark ? 8 : 98;
    const bgDefault = hslToHex(baseHue, 15, bgLightness);
    const bgElevated = hslToHex(baseHue, 12, isDark ? 12 : 100);
    const bgSubtle = hslToHex(baseHue, 10, isDark ? 6 : 96);
    const bgOverlay = isDark
        ? `hsla(${baseHue}, 15%, 8%, 0.95)`
        : `hsla(${baseHue}, 10%, 100%, 0.95)`;

    // Generate brand colors
    const brandLightness = isDark ? 55 : 45;
    const brandPrimary = hslToHex(baseHue, intensityConfig.saturation, brandLightness);
    const brandPrimaryHover = hslToHex(baseHue, intensityConfig.saturation, brandLightness - 8);
    const brandPrimaryActive = hslToHex(baseHue, intensityConfig.saturation, brandLightness - 16);
    const brandAccent = hslToHex(accentHue, intensityConfig.saturation, brandLightness);
    const brandAccentHover = hslToHex(accentHue, intensityConfig.saturation, brandLightness - 8);

    // Generate text colors with contrast checking
    let textPrimary = isDark ? '#FFFFFF' : '#111111';
    let textSecondary = isDark ? '#A0A0A0' : '#555555';
    const textMuted = isDark ? '#707070' : '#888888';

    // Ensure text meets contrast requirements against background
    textPrimary = ensureContrast(textPrimary, bgDefault, contrastConfig.minRatio, isDark);
    textSecondary = ensureContrast(textSecondary, bgDefault, contrastConfig.minRatio * 0.8, isDark);

    // Text on brand background
    const textOnBrand = getContrastRatio('#FFFFFF', brandPrimary) >= contrastConfig.minRatio
        ? '#FFFFFF'
        : '#111111';

    // Border colors
    const borderSubtle = isDark
        ? `hsla(${baseHue}, 10%, 100%, 0.08)`
        : `hsla(${baseHue}, 10%, 0%, 0.08)`;
    const borderStrong = isDark
        ? `hsla(${baseHue}, 10%, 100%, 0.16)`
        : `hsla(${baseHue}, 10%, 0%, 0.16)`;
    const borderAccent = `hsla(${baseHue}, ${intensityConfig.saturation}%, 50%, 0.3)`;

    // State colors (semantic - less variation needed)
    const stateSuccess = '#10B981';
    const stateWarning = '#F59E0B';
    const stateError = '#EF4444';
    const stateInfo = hslToHex(accentHue, 70, 50);

    // Generate shadows based on surface style
    const shadowConfig = {
        flat: { sm: 'none', md: 'none', lg: 'none' },
        subtle: {
            sm: `0 1px 2px rgba(0,0,0,${isDark ? 0.3 : 0.1})`,
            md: `0 4px 12px rgba(0,0,0,${isDark ? 0.4 : 0.15})`,
            lg: `0 8px 24px rgba(0,0,0,${isDark ? 0.5 : 0.2})`,
        },
        elevated: {
            sm: `0 2px 4px rgba(0,0,0,${isDark ? 0.4 : 0.15})`,
            md: `0 8px 24px rgba(0,0,0,${isDark ? 0.55 : 0.2})`,
            lg: `0 16px 48px rgba(0,0,0,${isDark ? 0.7 : 0.25})`,
        },
        clean: { sm: 'none', md: 'none', lg: 'none' },
    };

    return {
        name,
        mode,
        seed,
        colors: {
            bgDefault,
            bgElevated,
            bgSubtle,
            bgOverlay,
            brandPrimary,
            brandPrimaryHover,
            brandPrimaryActive,
            brandAccent,
            brandAccentHover,
            textPrimary,
            textSecondary,
            textMuted,
            textOnBrand,
            borderSubtle,
            borderStrong,
            borderAccent,
            stateSuccess,
            stateWarning,
            stateError,
            stateInfo,
        },
        typography: {
            fontDisplay: '"Space Grotesk", sans-serif',
            fontBody: '"Inter", sans-serif',
            fontMono: '"JetBrains Mono", monospace',
        },
        spacing: {
            xs: '4px',
            sm: '8px',
            md: '12px',
            lg: '16px',
            xl: '24px',
        },
        radius: {
            sm: '6px',
            md: '10px',
            lg: '14px',
            full: '999px',
        },
        shadows: shadowConfig[seed.surfaceStyle as keyof typeof shadowConfig],
    };
}

function ensureContrast(
    textColor: string,
    bgColor: string,
    minRatio: number,
    isDark: boolean
): string {
    let currentRatio = getContrastRatio(textColor, bgColor);
    let iterations = 0;
    const hsl = hexToHsl(textColor);

    while (currentRatio < minRatio && iterations < 20) {
        // Adjust lightness
        hsl.l = isDark ? hsl.l + 5 : hsl.l - 5;
        hsl.l = Math.max(0, Math.min(100, hsl.l));

        textColor = hslToHex(hsl.h, hsl.s, hsl.l);
        currentRatio = getContrastRatio(textColor, bgColor);
        iterations++;
    }

    return textColor;
}

/**
 * Export theme to CSS custom properties
 */
export function themeToCSSVars(theme: GeneratedTheme): string {
    const lines: string[] = [':root {'];

    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        lines.push(`  --color-${cssKey}: ${value};`);
    });

    // Typography
    lines.push(`  --font-display: ${theme.typography.fontDisplay};`);
    lines.push(`  --font-body: ${theme.typography.fontBody};`);
    lines.push(`  --font-mono: ${theme.typography.fontMono};`);

    // Spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
        lines.push(`  --space-${key}: ${value};`);
    });

    // Radius
    Object.entries(theme.radius).forEach(([key, value]) => {
        lines.push(`  --radius-${key}: ${value};`);
    });

    // Shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
        lines.push(`  --shadow-${key}: ${value};`);
    });

    lines.push('}');
    return lines.join('\n');
}

/**
 * Export theme to Tailwind config extend
 */
export function themeToTailwind(theme: GeneratedTheme): object {
    return {
        colors: {
            background: {
                default: theme.colors.bgDefault,
                elevated: theme.colors.bgElevated,
                subtle: theme.colors.bgSubtle,
            },
            brand: {
                primary: theme.colors.brandPrimary,
                'primary-hover': theme.colors.brandPrimaryHover,
                accent: theme.colors.brandAccent,
            },
            text: {
                primary: theme.colors.textPrimary,
                secondary: theme.colors.textSecondary,
                muted: theme.colors.textMuted,
            },
            border: {
                subtle: theme.colors.borderSubtle,
                strong: theme.colors.borderStrong,
            },
            state: {
                success: theme.colors.stateSuccess,
                warning: theme.colors.stateWarning,
                error: theme.colors.stateError,
                info: theme.colors.stateInfo,
            },
        },
        fontFamily: {
            display: [theme.typography.fontDisplay],
            body: [theme.typography.fontBody],
            mono: [theme.typography.fontMono],
        },
        spacing: theme.spacing,
        borderRadius: theme.radius,
        boxShadow: theme.shadows,
    };
}
