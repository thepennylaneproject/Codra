/**
 * THEME PREVIEW
 * Live preview of the generated theme
 */

import React from 'react';
import type { GeneratedTheme } from '../../../types/design';

interface ThemePreviewProps {
    theme: GeneratedTheme;
    fullPage?: boolean;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({ theme, fullPage = false }) => {
    // Apply theme styles to a wrapper
    const style = {
        '--bg-default': theme.colors.bgDefault,
        '--bg-elevated': theme.colors.bgElevated,
        '--bg-subtle': theme.colors.bgSubtle,
        '--text-primary': theme.colors.textPrimary,
        '--text-secondary': theme.colors.textSecondary,
        '--text-muted': theme.colors.textMuted,
        '--brand-primary': theme.colors.brandPrimary,
        '--brand-accent': theme.colors.brandAccent,
        '--border-subtle': theme.colors.borderSubtle,
        '--border-strong': theme.colors.borderStrong,
        // Add other necessary vars for the preview to work naturally
    } as React.CSSProperties;

    return (
        <div className={`p-8 bg-[var(--bg-default)] min-h-full transition-colors duration-200 ${fullPage ? '' : 'rounded-lg border border-[var(--border-subtle)]'}`} style={style}>
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Typography & Headers */}
                <section className="space-y-4">
                    <h1 className="text-4xl font-bold text-[var(--text-primary)] font-display">
                        The quick brown fox jumps over the lazy dog
                    </h1>
                    <p className="text-xl text-[var(--text-secondary)]">
                        Design tokens allow for scalable, consistent, and maintainable UI systems.
                    </p>
                </section>

                {/* Buttons */}
                <section className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Buttons</h3>
                    <div className="flex gap-4">
                        <button className="px-5 py-2.5 rounded-lg bg-[var(--brand-primary)] text-white font-medium hover:brightness-110 transition-all">
                            Primary Action
                        </button>
                        <button className="px-5 py-2.5 rounded-lg border border-[var(--border-strong)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-subtle)] transition-all">
                            Secondary Action
                        </button>
                        <button className="px-5 py-2.5 rounded-lg text-[var(--brand-primary)] font-medium hover:bg-[var(--brand-primary)]/10 transition-all">
                            Ghost Button
                        </button>
                    </div>
                </section>

                {/* Cards & Surfaces */}
                <section className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Cards</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] flex items-center justify-center mb-4">
                                ★
                            </div>
                            <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Elevated Card</h4>
                            <p className="text-[var(--text-secondary)]">
                                This surface uses the elevated background color and subtle border.
                            </p>
                        </div>
                        <div className="p-6 rounded-xl bg-[var(--bg-subtle)] border border-transparent">
                            <div className="w-10 h-10 rounded-full bg-[var(--brand-accent)]/20 text-[var(--brand-accent)] flex items-center justify-center mb-4">
                                ⚡
                            </div>
                            <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Subtle Card</h4>
                            <p className="text-[var(--text-secondary)]">
                                This surface uses the subtle background color for a softer look.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Inputs */}
                <section className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Form Elements</h3>
                    <div className="max-w-md space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-default)] border border-[var(--border-strong)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="check" className="w-4 h-4 rounded text-[var(--brand-primary)]" checked readOnly />
                            <label htmlFor="check" className="text-[var(--text-primary)]">I agree to the terms and conditions</label>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
