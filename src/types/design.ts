/**
 * DESIGN SYSTEM TYPES
 * Types for the theme generator and design tokens
 */

export interface ThemeSeed {
    baseHue: number;          // 0-360
    accentHue: number;        // 0-360
    intensity: 'soft' | 'neutral' | 'bold';
    contrastPreference: 'standard' | 'high';
    surfaceStyle: 'flat' | 'subtle' | 'elevated';
    buttonStyle: 'solid' | 'outline' | 'ghost';
    mode: 'dark' | 'light';
}

export interface GeneratedTheme {
    name: string;
    mode: 'dark' | 'light';
    seed: ThemeSeed;
    colors: {
        // Backgrounds
        bgDefault: string;
        bgElevated: string;
        bgSubtle: string;
        bgOverlay: string;

        // Brand
        brandPrimary: string;
        brandPrimaryHover: string;
        brandPrimaryActive: string;
        brandAccent: string;
        brandAccentHover: string;

        // Text
        textPrimary: string;
        textSecondary: string;
        textMuted: string;
        textOnBrand: string;

        // Borders
        borderSubtle: string;
        borderStrong: string;
        borderAccent: string;

        // States
        stateSuccess: string;
        stateWarning: string;
        stateError: string;
        stateInfo: string;
    };
    typography: {
        fontDisplay: string;
        fontBody: string;
        fontMono: string;
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    radius: {
        sm: string;
        md: string;
        lg: string;
        full: string;
    };
    shadows: {
        sm: string;
        md: string;
        lg: string;
    };
}
