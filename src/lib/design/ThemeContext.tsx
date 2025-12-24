
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ThemeSeed, GeneratedTheme } from '../../types/design';
import { generateTheme } from './theme-generator';
import { THEME_PRESETS } from './theme-presets';

interface ThemeContextType {
    theme: GeneratedTheme;
    mode: 'light' | 'dark' | 'system';
    currentPresetName: string | null;
    setMode: (mode: 'light' | 'dark' | 'system') => void;
    setThemeSeed: (seed: ThemeSeed) => void;
    applyPreset: (presetName: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default seed if none provided (Codra default)
const DEFAULT_SEED: ThemeSeed = {
    baseHue: 10, // Ivory/Coral
    accentHue: 10,
    intensity: 'neutral',
    contrastPreference: 'standard',
    surfaceStyle: 'clean',
    buttonStyle: 'solid',
    mode: 'light',
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<'light' | 'dark' | 'system'>('light');
    const [currentSeed, setCurrentSeed] = useState<ThemeSeed>(DEFAULT_SEED);
    const [currentPresetName, setCurrentPresetName] = useState<string | null>('editorial'); // Default preset

    // Logic to resolve system preference would go here
    // For now we just respect the mode state or fallback to dark if system

    // Generate the full theme object based on seed
    // Ensure the generated theme respects the current mode override
    const activeSeed = { ...currentSeed, mode: mode === 'system' ? 'dark' : mode };
    const theme = generateTheme(activeSeed, 'Codra Theme');

    const applyPreset = (presetName: string) => {
        const preset = THEME_PRESETS[presetName];
        if (preset) {
            setCurrentSeed(preset.seed);
            setCurrentPresetName(presetName);
            // If preset defines a mode, we might want to respect it or keep user preference?
            // For simplicity, let's adopt the preset's mode too, but update our mode state
            setMode(preset.seed.mode);
        }
    };

    // Apply CSS variables and data-theme attribute
    useEffect(() => {
        const root = document.documentElement;
        const colors = theme.colors;

        // Set basic CSS variables
        root.style.setProperty('--bg-default', colors.bgDefault);
        root.style.setProperty('--bg-elevated', colors.bgElevated);
        root.style.setProperty('--text-primary', colors.textPrimary);

        // Set the data-theme attribute for CSS preset switching
        if (currentPresetName) {
            const preset = THEME_PRESETS[currentPresetName];
            if (preset?.dataTheme) {
                root.setAttribute('data-theme', preset.dataTheme);
            } else {
                // Fallback: derive data-theme from preset name
                // Convert camelCase to kebab-case
                const kebabName = currentPresetName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
                root.setAttribute('data-theme', kebabName);
            }
        }

    }, [theme, currentPresetName]);

    // Apply default preset on mount
    useEffect(() => {
        applyPreset('editorial');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ThemeContext.Provider value={{
            theme,
            mode,
            currentPresetName,
            setMode,
            setThemeSeed: setCurrentSeed,
            applyPreset
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

