/**
 * SEED TOKEN CONTROLS
 * UI controls for theme seed tokens
 */

import React from 'react';
import type { ThemeSeed } from '../../../types/design';

interface SeedTokenControlsProps {
    seed: ThemeSeed;
    onChange: (updates: Partial<ThemeSeed>) => void;
}

export const SeedTokenControls: React.FC<SeedTokenControlsProps> = ({ seed, onChange }) => {
    return (
        <div className="space-y-6">
            {/* Base Hue */}
            <div>
                <label className="text-label-sm text-text-muted uppercase tracking-wide mb-2 block">
                    Base Color
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min="0"
                        max="360"
                        value={seed.baseHue}
                        onChange={(e) => onChange({ baseHue: parseInt(e.target.value) })}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, 
                hsl(0, 70%, 50%), 
                hsl(60, 70%, 50%), 
                hsl(120, 70%, 50%), 
                hsl(180, 70%, 50%), 
                hsl(240, 70%, 50%), 
                hsl(300, 70%, 50%), 
                hsl(360, 70%, 50%)
              )`,
                        }}
                    />
                    <div
                        className="w-8 h-8 rounded-lg border border-border-subtle"
                        style={{ backgroundColor: `hsl(${seed.baseHue}, 60%, 50%)` }}
                    />
                </div>
            </div>

            {/* Accent Hue */}
            <div>
                <label className="text-label-sm text-text-muted uppercase tracking-wide mb-2 block">
                    Accent Color
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min="0"
                        max="360"
                        value={seed.accentHue}
                        onChange={(e) => onChange({ accentHue: parseInt(e.target.value) })}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, 
                hsl(0, 70%, 50%), 
                hsl(60, 70%, 50%), 
                hsl(120, 70%, 50%), 
                hsl(180, 70%, 50%), 
                hsl(240, 70%, 50%), 
                hsl(300, 70%, 50%), 
                hsl(360, 70%, 50%)
              )`,
                        }}
                    />
                    <div
                        className="w-8 h-8 rounded-lg border border-border-subtle"
                        style={{ backgroundColor: `hsl(${seed.accentHue}, 60%, 50%)` }}
                    />
                </div>
            </div>

            {/* Intensity */}
            <div>
                <label className="text-label-sm text-text-muted uppercase tracking-wide mb-3 block">
                    Intensity
                </label>
                <div className="flex gap-2">
                    {(['soft', 'neutral', 'bold'] as const).map((option) => (
                        <button
                            key={option}
                            onClick={() => onChange({ intensity: option })}
                            className={`flex-1 py-2 rounded-lg text-label-sm transition-colors ${seed.intensity === option
                                ? 'bg-brand-teal/20 text-brand-teal border border-brand-teal/30'
                                : 'bg-background-subtle text-text-muted border border-border-subtle hover:border-border-strong'
                                }`}
                        >
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contrast Preference */}
            <div>
                <label className="text-label-sm text-text-muted uppercase tracking-wide mb-3 block">
                    Contrast
                </label>
                <div className="flex gap-2">
                    {(['standard', 'high'] as const).map((option) => (
                        <button
                            key={option}
                            onClick={() => onChange({ contrastPreference: option })}
                            className={`flex-1 py-2 rounded-lg text-label-sm transition-colors ${seed.contrastPreference === option
                                ? 'bg-brand-teal/20 text-brand-teal border border-brand-teal/30'
                                : 'bg-background-subtle text-text-muted border border-border-subtle hover:border-border-strong'
                                }`}
                        >
                            {option === 'standard' ? 'Standard (AA)' : 'High (AAA)'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Surface Style */}
            <div>
                <label className="text-label-sm text-text-muted uppercase tracking-wide mb-3 block">
                    Surface Style
                </label>
                <div className="flex gap-2">
                    {(['flat', 'subtle', 'elevated'] as const).map((option) => (
                        <button
                            key={option}
                            onClick={() => onChange({ surfaceStyle: option })}
                            className={`flex-1 py-2 rounded-lg text-label-sm transition-colors ${seed.surfaceStyle === option
                                ? 'bg-brand-teal/20 text-brand-teal border border-brand-teal/30'
                                : 'bg-background-subtle text-text-muted border border-border-subtle hover:border-border-strong'
                                }`}
                        >
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Button Style */}
            <div>
                <label className="text-label-sm text-text-muted uppercase tracking-wide mb-3 block">
                    Button Style
                </label>
                <div className="flex gap-2">
                    {(['solid', 'outline', 'ghost'] as const).map((option) => (
                        <button
                            key={option}
                            onClick={() => onChange({ buttonStyle: option })}
                            className={`flex-1 py-2 rounded-lg text-label-sm transition-colors ${seed.buttonStyle === option
                                ? 'bg-brand-teal/20 text-brand-teal border border-brand-teal/30'
                                : 'bg-background-subtle text-text-muted border border-border-subtle hover:border-border-strong'
                                }`}
                        >
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
