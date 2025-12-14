/**
 * THEME PRESETS - Filter-Based Worlds
 * Uses CSS hue-rotate on master monochrome assets to create color variations
 * 
 * UPDATED: Guardians x Apple Aesthetic
 * - All themes use the MASTER_MONO background foundation
 * - Accents are applied via subtle hue-rotation or overlay blending
 */

import type { ThemeSeed } from '../../types/design';

import type { AtmosphereSpec } from './AtmosphereContext';

// Import new Master Assets
import masterMonoBg from '../../assets/atmosphere/dashboard_bg__cosmic_wave__v1__MASTER_MONO__16_9.png';
// import accentGoldBg from '../../assets/atmosphere/dashboard_bg__cosmic_wave__v1__accent_gold__16_9.png'; // Reserved for specific states

interface ThemePreset {
    name: string;
    seed: ThemeSeed;
    colors: {
        primary: string;
        accent: string;
    };
    backgroundImage?: string;
    atmosphere?: AtmosphereSpec;
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
    starlord: {
        name: 'Star-Lord',
        seed: {
            baseHue: 45,         // Gold
            accentHue: 330,      // Red-pink
            intensity: 'bold',
            contrastPreference: 'standard',
            surfaceStyle: 'elevated',
            buttonStyle: 'solid',
            mode: 'dark',
        },
        colors: { primary: '#D4AF37', accent: '#FF6B35' },
        backgroundImage: masterMonoBg,
        atmosphere: {
            glassTint: 'rgba(18, 15, 8, 0.6)', // Reduced opacity per Taste Governor
            glowColor: 'rgba(212, 175, 55, 0.4)',
            particleColor: '#D4AF37',
            hueRotate: 0, // Natural warm gold
        }
    },
    gamora: {
        name: 'Gamora',
        seed: {
            baseHue: 180,        // Teal-cyan
            accentHue: 200,
            intensity: 'bold',
            contrastPreference: 'standard',
            surfaceStyle: 'elevated',
            buttonStyle: 'solid',
            mode: 'dark',
        },
        colors: { primary: '#00D9D9', accent: '#14B8A6' },
        backgroundImage: masterMonoBg,
        atmosphere: {
            glassTint: 'rgba(8, 28, 35, 0.6)',
            glowColor: 'rgba(0, 217, 217, 0.35)',
            particleColor: '#00D9D9',
            hueRotate: 160, // Shifts mono structure to deep teal
        }
    },
    nebula: {
        name: 'Nebula',
        seed: {
            baseHue: 320,        // Pink-magenta
            accentHue: 280,
            intensity: 'bold',
            contrastPreference: 'standard',
            surfaceStyle: 'elevated',
            buttonStyle: 'solid',
            mode: 'dark',
        },
        colors: { primary: '#D81159', accent: '#EC4899' },
        backgroundImage: masterMonoBg,
        atmosphere: {
            glassTint: 'rgba(35, 10, 25, 0.6)',
            glowColor: 'rgba(216, 17, 89, 0.35)',
            particleColor: '#D81159',
            hueRotate: 320, // Shifts mono structure to magenta/purple
        }
    },
    rocket: {
        name: 'Rocket',
        seed: {
            baseHue: 30,         // Orange
            accentHue: 15,
            intensity: 'bold',
            contrastPreference: 'high',
            surfaceStyle: 'elevated',
            buttonStyle: 'solid',
            mode: 'dark',
        },
        colors: { primary: '#FF8C00', accent: '#FF6347' },
        backgroundImage: masterMonoBg,
        atmosphere: {
            glassTint: 'rgba(30, 15, 8, 0.65)',
            glowColor: 'rgba(255, 140, 0, 0.35)',
            particleColor: '#FF8C00',
            hueRotate: 30, // Subtle warmth
        }
    },
};
