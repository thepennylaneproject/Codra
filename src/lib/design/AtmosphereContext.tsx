import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useTheme } from './ThemeContext';
import { THEME_PRESETS } from './theme-presets';

export interface AtmosphereSpec {
    glassTint: string;
    glowColor: string;
    particleColor: string;
    backgroundImage?: string;
    hueRotate: number;  // Kept for interface compatibility, but should be 0 for locked assets
}

interface AtmosphereContextType {
    currentAtmosphere: AtmosphereSpec;
}

const AtmosphereContext = createContext<AtmosphereContextType | undefined>(undefined);

export function AtmosphereProvider({ children }: { children: React.ReactNode }) {
    const { currentPresetName } = useTheme();

    const activePreset = useMemo(() => {
        if (currentPresetName && THEME_PRESETS[currentPresetName]) {
            return THEME_PRESETS[currentPresetName];
        }
        // Fallback to default-v1 if something goes wrong
        return THEME_PRESETS['default-v1'];
    }, [currentPresetName]);

    // Derive atmosphere values directly from the preset
    const atmosphere = useMemo<AtmosphereSpec>(() => {
        return {
            glassTint: activePreset.atmosphere.glassTint,
            glowColor: activePreset.atmosphere.glowColor,
            particleColor: activePreset.atmosphere.particleColor,
            backgroundImage: activePreset.backgroundImage,
            hueRotate: activePreset.atmosphere.hueRotate || 0,
        };
    }, [activePreset]);

    // Inject CSS variables
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--atmosphere-glass-tint', atmosphere.glassTint);
        root.style.setProperty('--atmosphere-glow-color', atmosphere.glowColor);
        root.style.setProperty('--atmosphere-particle-color', atmosphere.particleColor);
        // hue-rotate should generally be 0 now
        root.style.setProperty('--atmosphere-hue-rotate', `${atmosphere.hueRotate}deg`);

        // Inject legacy variables for component compatibility
        root.style.setProperty('--particle-color-start', atmosphere.particleColor);
        root.style.setProperty('--theme-overlay-color', atmosphere.glowColor);

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
