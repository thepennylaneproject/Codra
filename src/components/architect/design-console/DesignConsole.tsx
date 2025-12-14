/**
 * DESIGN CONSOLE
 * User-facing theme editor with seed token controls
 */

import React, { useState, useMemo } from 'react';
import { Palette, Sun, Moon, RefreshCw } from 'lucide-react';
import type { ThemeSeed, GeneratedTheme } from '../../../types/design';
import { generateTheme } from '../../../lib/design/theme-generator';
import { SeedTokenControls } from './SeedTokenControls';
import { ThemePreview } from './ThemePreview';
import { AccessibilityChecker } from './AccessibilityChecker';
import { ThemeExport } from './ThemeExport';
import { THEME_PRESETS } from '../../../lib/design/theme-presets';

interface DesignConsoleProps {
    initialTheme?: GeneratedTheme;
    onSave?: (theme: GeneratedTheme) => void;
}

const DEFAULT_SEED: ThemeSeed = {
    baseHue: 210,        // Blue
    accentHue: 175,      // Teal
    intensity: 'neutral',
    contrastPreference: 'standard',
    surfaceStyle: 'elevated',
    buttonStyle: 'solid',
    mode: 'dark',
};

export const DesignConsole: React.FC<DesignConsoleProps> = ({ initialTheme, onSave }) => {
    const [seed, setSeed] = useState<ThemeSeed>(initialTheme?.seed || DEFAULT_SEED);
    const [themeName, setThemeName] = useState(initialTheme?.name || 'Custom Theme');
    const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'export'>('editor');

    // Generate theme whenever seed changes
    const theme = useMemo(() => generateTheme(seed, themeName), [seed, themeName]);

    const updateSeed = (updates: Partial<ThemeSeed>) => {
        setSeed(prev => ({ ...prev, ...updates }));
    };

    const applyPreset = (presetName: string) => {
        const preset = THEME_PRESETS[presetName];
        if (preset) {
            setSeed(preset.seed);
            setThemeName(preset.name);
        }
    };

    const resetToDefault = () => {
        setSeed(DEFAULT_SEED);
        setThemeName('Custom Theme');
    };

    return (
        <div className="h-full flex flex-col bg-background-default">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-subtle bg-background-elevated">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Palette className="w-5 h-5 text-brand-teal" />
                        <div>
                            <h2 className="text-label-lg text-text-primary font-semibold">Design Console</h2>
                            <p className="text-body-sm text-text-muted">Customize your project's visual theme</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Mode Toggle */}
                        <button
                            onClick={() => updateSeed({ mode: seed.mode === 'dark' ? 'light' : 'dark' })}
                            className="flex items-center gap-2 px-3 py-1.5 bg-background-subtle rounded-lg border border-border-subtle hover:border-border-strong transition-colors"
                        >
                            {seed.mode === 'dark' ? (
                                <Moon className="w-4 h-4 text-text-muted" />
                            ) : (
                                <Sun className="w-4 h-4 text-brand-gold" />
                            )}
                            <span className="text-label-sm text-text-secondary">
                                {seed.mode === 'dark' ? 'Dark' : 'Light'}
                            </span>
                        </button>

                        {/* Reset */}
                        <button
                            onClick={resetToDefault}
                            className="p-2 hover:bg-background-subtle rounded-lg transition-colors"
                            title="Reset to defaults"
                        >
                            <RefreshCw className="w-4 h-4 text-text-muted" />
                        </button>

                        {/* Save */}
                        <button
                            onClick={() => onSave?.(theme)}
                            className="px-4 py-2 bg-brand-teal text-background-default text-label-md font-semibold rounded-lg hover:brightness-110 transition-all"
                        >
                            Save Theme
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mt-4">
                    {(['editor', 'preview', 'export'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-label-sm transition-colors ${activeTab === tab
                                ? 'bg-brand-teal/20 text-brand-teal'
                                : 'text-text-muted hover:text-text-primary hover:bg-background-subtle'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'editor' && (
                    <div className="h-full flex">
                        {/* Controls */}
                        <div className="w-80 border-r border-border-subtle overflow-y-auto p-6">
                            {/* Presets */}
                            <div className="mb-6">
                                <label className="text-label-sm text-text-muted uppercase tracking-wide mb-3 block">
                                    Presets
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                                        <button
                                            key={key}
                                            onClick={() => applyPreset(key)}
                                            className="p-3 text-left rounded-lg border border-border-subtle hover:border-border-strong transition-colors"
                                        >
                                            <div
                                                className="w-full h-4 rounded mb-2"
                                                style={{
                                                    background: `linear-gradient(90deg, ${preset.colors.primary} 0%, ${preset.colors.accent} 100%)`,
                                                }}
                                            />
                                            <span className="text-label-sm text-text-secondary">{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Seed Token Controls */}
                            <SeedTokenControls seed={seed} onChange={updateSeed} />
                        </div>

                        {/* Live Preview */}
                        <div className="flex-1 overflow-y-auto">
                            <ThemePreview theme={theme} />
                        </div>

                        {/* Accessibility Panel */}
                        <div className="w-72 border-l border-border-subtle overflow-y-auto p-4">
                            <AccessibilityChecker theme={theme} />
                        </div>
                    </div>
                )}

                {activeTab === 'preview' && (
                    <div className="h-full overflow-y-auto p-6">
                        <ThemePreview theme={theme} fullPage />
                    </div>
                )}

                {activeTab === 'export' && (
                    <div className="h-full overflow-y-auto p-6">
                        <ThemeExport theme={theme} />
                    </div>
                )}
            </div>
        </div>
    );
};
