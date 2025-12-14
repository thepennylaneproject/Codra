import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useTheme } from './ThemeContext';
import { THEME_PRESETS } from './theme-presets';

export interface AtmosphereSpec {
    glassTint: string;
    glowColor: string;
    particleColor: string;
    backgroundImage?: string;
    hueRotate: number;  // 0-360 degrees for CSS hue-rotate filter
}

interface AtmosphereContextType {
    currentAtmosphere: AtmosphereSpec;
}

const AtmosphereContext = createContext<AtmosphereContextType | undefined>(undefined);

export function AtmosphereProvider({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();

    // Match preset by baseHue since theme.name might differ from preset.name
    const activePresetKey = useMemo(() => {
        // Try to find by matching baseHue as a more reliable identifier
        const entry = Object.entries(THEME_PRESETS).find(([, preset]) =>
            preset.seed.baseHue === theme.seed.baseHue &&
            preset.seed.accentHue === theme.seed.accentHue
        ) || Object.entries(THEME_PRESETS)[0]; // Fallback to first preset

        return entry ? entry[0] : 'starlord';
    }, [theme.seed.baseHue, theme.seed.accentHue]);

    const activePreset = THEME_PRESETS[activePresetKey as keyof typeof THEME_PRESETS] || THEME_PRESETS.starlord;

    // Derive atmosphere values, falling back to defaults if not present in the preset
    const atmosphere = useMemo<AtmosphereSpec>(() => ({
        glassTint: activePreset.atmosphere?.glassTint || 'rgba(18, 23, 29, 0.85)',
        glowColor: activePreset.atmosphere?.glowColor || 'rgba(0, 217, 217, 0.5)',
        particleColor: activePreset.atmosphere?.particleColor || 'rgba(255, 255, 255, 0.7)',
        backgroundImage: activePreset.backgroundImage, // This can be undefined
        hueRotate: activePreset.atmosphere?.hueRotate || 0,
    }), [activePreset]);

    // Inject CSS variables
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--atmosphere-glass-tint', atmosphere.glassTint);
        root.style.setProperty('--atmosphere-glow-color', atmosphere.glowColor);
        root.style.setProperty('--atmosphere-particle-color', atmosphere.particleColor);
        root.style.setProperty('--atmosphere-hue-rotate', `${atmosphere.hueRotate}deg`);

        // You might want to handle the image url specifically if it's an import
        if (atmosphere.backgroundImage) {
            root.style.setProperty('--atmosphere-bg-image', `url(${atmosphere.backgroundImage})`);
        } else {
            root.style.removeProperty('--atmosphere-bg-image');
        }
    }, [atmosphere]);

    return (
        <AtmosphereContext.Provider value={{ currentAtmosphere: atmosphere }}>
            {children}
        </AtmosphereContext.Provider>
    );
}

export function useAtmosphere() {
    const context = useContext(AtmosphereContext);
    if (context === undefined) {
        throw new Error('useAtmosphere must be used within an AtmosphereProvider');
    }
    return context;
}
