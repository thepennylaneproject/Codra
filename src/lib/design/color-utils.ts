/**
 * Color Utilities
 * Helper functions for HSL/Hex manipulation and accessibility calculations
 */

/**
 * Convert HSL values to Hex string
 */
export function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const chroma = s * Math.min(l, 1 - l) / 100;

    const calculateHslChannel = (channelIndex: number) => {
        const channelOffset = (channelIndex + h / 30) % 12;
        const color = l - chroma * Math.max(Math.min(channelOffset - 3, 9 - channelOffset, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };

    return `#${calculateHslChannel(0)}${calculateHslChannel(8)}${calculateHslChannel(4)}`.toUpperCase();
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
    const lightness = (max + min) / 2;
    let hue = 0;
    let saturation = 0;

    if (max !== min) {
        const delta = max - min;
        saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

        switch (max) {
            case r: hue = (g - b) / delta + (g < b ? 6 : 0); break;
            case g: hue = (b - r) / delta + 2; break;
            case b: hue = (r - g) / delta + 4; break;
        }

        hue /= 6;
    }

    return {
        h: Math.round(hue * 360),
        s: Math.round(saturation * 100),
        l: Math.round(lightness * 100)
    };
}

/**
 * Calculate luminance of a color
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
 */
export function getLuminance(r: number, g: number, b: number): number {
    const linearChannels = [r, g, b].map(channel => {
        channel /= 255;
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return linearChannels[0] * 0.2126 + linearChannels[1] * 0.7152 + linearChannels[2] * 0.0722;
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
