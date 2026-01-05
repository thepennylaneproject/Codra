/**
 * Color Utilities
 * Helper functions for HSL/Hex manipulation and accessibility calculations
 */

/**
 * Convert HSL values to Hex string
 */
export function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;

    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };

    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

/**
 * Convert Hex string to HSL object
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
    let r = 0, g = 0, b = 0;

    // Handle standard hex #RRGGBB
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    if (result) {
        r = parseInt(result[1], 16) / 255;
        g = parseInt(result[2], 16) / 255;
        b = parseInt(result[3], 16) / 255;
    } else {
        // Handle shorthand hex #RGB
        result = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
        if (result) {
            r = parseInt(result[1] + result[1], 16) / 255;
            g = parseInt(result[2] + result[2], 16) / 255;
            b = parseInt(result[3] + result[3], 16) / 255;
        } else {
            return { h: 0, s: 0, l: 0 }; // Fallback
        }
    }

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

/**
 * Calculate luminance of a color
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
 */
export function getLuminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculate contrast ratio between two hex colors
 */
export function getContrastRatio(fgHex: string, bgHex: string): number {
    const fgRgb = hexToRgb(fgHex);
    const bgRgb = hexToRgb(bgHex);

    if (!fgRgb || !bgRgb) return 1;

    const fgL = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
    const bgL = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

    const lighter = Math.max(fgL, bgL);
    const darker = Math.min(fgL, bgL);

    // (L1 + 0.05) / (L2 + 0.05)
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Helper to get RGB from Hex
 */
function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Adjust lightness of a hex color
 */
export function adjustLightness(hex: string, amount: number): string {
    const { h, s, l } = hexToHsl(hex);
    const newL = Math.max(0, Math.min(100, l + amount));
    return hslToHex(h, s, newL);
}
