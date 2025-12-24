/**
 * THEME PRESETS - Locked Visual Worlds
 * Strict deterministic theme system using specific assets.
 * 
 * PRESETS:
 * Locked:
 * - cyber-cyan: /assets/backgrounds/texture_cyan_circuit.jpg
 * - deep-space: /assets/backgrounds/texture_deep_space.jpg
 * - midas-touch: /assets/backgrounds/texture_midas_touch.jpg
 * - stealth-noir: /assets/backgrounds/texture_stealth_noir.jpg
 * 
 * Default Options:
 * - default-v1: /assets/backgrounds/texture_default_v1.jpg
 * - default-v2: /assets/backgrounds/texture_default_v2.jpg
 */

import type { ThemeSeed } from '../../types/design';
import type { AtmosphereSpec } from './AtmosphereContext';

interface ThemePreset {
    name: string;
    seed: ThemeSeed;
    colors: {
        primary: string;
        accent: string;
    };
    backgroundImage: string;
    atmosphere: AtmosphereSpec;
    /** CSS data-theme attribute value for this preset */
    dataTheme: string;
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
    // ========================================
    // EDITORIAL PRESETS
    // ========================================
    'editorial': {
        name: 'Editorial',
        seed: {
            baseHue: 10, // Warm/Coral
            accentHue: 10,
            intensity: 'neutral',
            contrastPreference: 'standard',
            surfaceStyle: 'clean',
            buttonStyle: 'solid',
            mode: 'light',
        },
        colors: { primary: '#1A1A1A', accent: '#FF4D4D' },
        backgroundImage: '', // Solid Ivory background preferred
        atmosphere: {
            glassTint: 'rgba(255, 250, 240, 0.85)',
            glowColor: 'rgba(255, 77, 77, 0.15)',
            particleColor: '#FF4D4D',
            hueRotate: 0,
        },
        dataTheme: 'editorial',
    },

    // ========================================
    // LOCKED PRESETS
    // ========================================
    'cyber-cyan': {
        name: 'Cyber Cyan',
        seed: {
            baseHue: 185,
            accentHue: 195,
            intensity: 'bold',
            contrastPreference: 'standard',
            surfaceStyle: 'elevated',
            buttonStyle: 'solid',
            mode: 'dark',
        },
        colors: { primary: '#00ffff', accent: '#22D3EE' },
        backgroundImage: '/assets/backgrounds/texture_cyan_circuit.jpg',
        atmosphere: {
            glassTint: 'rgba(8, 28, 35, 0.6)',
            glowColor: 'rgba(0, 255, 255, 0.25)', // Tone: Cyan/teal, low opacity
            particleColor: '#00ffff',
            hueRotate: 0, // Disabled: Asset is pre-colored
        },
        dataTheme: 'cyber-cyan',
    },

    'deep-space': {
        name: 'Deep Space',
        seed: {
            baseHue: 250, // Indigo/Violet
            accentHue: 270,
            intensity: 'bold',
            contrastPreference: 'standard',
            surfaceStyle: 'elevated',
            buttonStyle: 'solid',
            mode: 'dark',
        },
        colors: { primary: '#a855f7', accent: '#8B5CF6' },
        backgroundImage: '/assets/backgrounds/texture_deep_space.jpg',
        atmosphere: {
            glassTint: 'rgba(15, 10, 30, 0.6)',
            glowColor: 'rgba(88, 80, 200, 0.25)', // Tone: Indigo/violet, low opacity
            particleColor: '#a855f7',
            hueRotate: 0,
        },
        dataTheme: 'deep-space',
    },

    'midas-touch': {
        name: 'Midas Touch',
        seed: {
            baseHue: 45, // Gold
            accentHue: 38,
            intensity: 'neutral',
            contrastPreference: 'standard',
            surfaceStyle: 'elevated',
            buttonStyle: 'solid',
            mode: 'dark',
        },
        colors: { primary: '#D4AF37', accent: '#fbbf24' },
        backgroundImage: '/assets/backgrounds/texture_midas_touch.jpg',
        atmosphere: {
            glassTint: 'rgba(30, 22, 12, 0.6)',
            glowColor: 'rgba(120, 90, 40, 0.18)', // Tone: Warm neutral/sepia
            particleColor: '#fbbf24',
            hueRotate: 0,
        },
        dataTheme: 'midas-touch',
    },

    'stealth-noir': {
        name: 'Stealth Noir',
        seed: {
            baseHue: 220,
            accentHue: 0, // Monochrome
            intensity: 'neutral',
            contrastPreference: 'standard',
            surfaceStyle: 'elevated',
            buttonStyle: 'solid',
            mode: 'dark',
        },
        colors: { primary: '#71717a', accent: '#52525b' },
        backgroundImage: '/assets/backgrounds/texture_stealth_noir.jpg',
        atmosphere: {
            glassTint: 'rgba(10, 10, 10, 0.8)',
            glowColor: 'rgba(0, 0, 0, 0.35)', // Tone: Dark gray/black
            particleColor: '#ffffff',
            hueRotate: 0,
        },
        dataTheme: 'stealth-noir',
    },

    // ========================================
    // DEFAULT OPTIONS
    // ========================================
    'default-v1': {
        name: 'Default (V1)',
        seed: {
            baseHue: 210,
            accentHue: 200,
            intensity: 'neutral',
            contrastPreference: 'standard',
            surfaceStyle: 'elevated',
            buttonStyle: 'solid',
            mode: 'dark',
        },
        colors: { primary: '#D4AF37', accent: '#FFD700' }, // Gold anchor
        backgroundImage: '/assets/backgrounds/texture_default_v1.jpg',
        atmosphere: {
            glassTint: 'rgba(15, 23, 42, 0.6)',
            glowColor: 'rgba(56, 189, 248, 0.1)',
            particleColor: '#D4AF37',
            hueRotate: 0,
        },
        dataTheme: 'default-v1',
    },

    'default-v2': {
        name: 'Default (V2)',
        seed: {
            baseHue: 210,
            accentHue: 200,
            intensity: 'neutral',
            contrastPreference: 'standard',
            surfaceStyle: 'elevated',
            buttonStyle: 'solid',
            mode: 'dark',
        },
        colors: { primary: '#D4AF37', accent: '#FFD700' }, // Gold anchor
        backgroundImage: '/assets/backgrounds/texture_default_v2.jpg',
        atmosphere: {
            glassTint: 'rgba(15, 23, 42, 0.6)',
            glowColor: 'rgba(56, 189, 248, 0.1)',
            particleColor: '#D4AF37',
            hueRotate: 0,
        },
        dataTheme: 'default-v2',
    }
};


