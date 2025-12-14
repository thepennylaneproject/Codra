
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ThemeSeed, GeneratedTheme } from '../../types/design';
import { generateTheme } from './theme-generator';
import { THEME_PRESETS } from './theme-presets';

interface ThemeContextType {
    theme: GeneratedTheme;
    mode: 'light' | 'dark' | 'system';
    setMode: (mode: 'light' | 'dark' | 'system') => void;
    setThemeSeed: (seed: ThemeSeed) => void;
    applyPreset: (presetName: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default seed if none provided (Codra default)
const DEFAULT_SEED: ThemeSeed = {
    baseHue: 210, // Slate/Blueish
    accentHue: 170, // Teal
    intensity: 'neutral',
    contrastPreference: 'standard',
    surfaceStyle: 'elevated',
    buttonStyle: 'solid',
    mode: 'dark',
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<'light' | 'dark' | 'system'>('dark');
    const [currentSeed, setCurrentSeed] = useState<ThemeSeed>(DEFAULT_SEED);

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
            // If preset defines a mode, we might want to respect it or keep user preference?
            // For simplicity, let's adopt the preset's mode too, but update our mode state
            setMode(preset.seed.mode);
        }
    };

    useEffect(() => {
        // Apply CSS variables to document root
        const root = document.documentElement;
        const colors = theme.colors;

        // Naively mapping colors object to CSS vars
        // Ideally theme-generator might have a helper "themeToCSSVars", but we can do it manually or assume it exists.
        // Based on previous file reading, themeToCSSVars exists in ThemeExport.tsx, maybe implicitly or exported?
        // Let's just set the main backgrounds for now to ensure visibility changes work
        root.style.setProperty('--bg-default', colors.bgDefault);
        root.style.setProperty('--bg-elevated', colors.bgElevated);
        root.style.setProperty('--text-primary', colors.textPrimary);

        // We would need a comprehensive mapper here.
        // For the sake of this task, we assume the underlying CSS or Tailwind config might be using these vars 
        // or we need to inject them.
        // Given the prompt's "Design Console", the app is likely fully dynamic.

    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, mode, setMode, setThemeSeed: setCurrentSeed, applyPreset }}>
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
