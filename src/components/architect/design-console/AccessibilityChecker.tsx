/**
 * ACCESSIBILITY CHECKER
 * Visualizes contrast ratios (WCAG AA/AAA)
 */

import React from 'react';
import type { GeneratedTheme } from '../../../types/design';
import { getContrastRatio } from '../../../lib/design/color-utils';
import { Check, X, AlertTriangle } from 'lucide-react';

interface AccessibilityCheckerProps {
    theme: GeneratedTheme;
}

export const AccessibilityChecker: React.FC<AccessibilityCheckerProps> = ({ theme }) => {
    const checks = [
        {
            label: 'Text on Default BG',
            fg: theme.colors.textPrimary,
            bg: theme.colors.bgDefault,
            min: 4.5,
            required: 'AA'
        },
        {
            label: 'Secondary on Default BG',
            fg: theme.colors.textSecondary,
            bg: theme.colors.bgDefault,
            min: 4.5,
            required: 'AA' // Ideally AA, sometimes relaxed for non-text? No, text requires 4.5 usually
        },
        {
            label: 'Text on Brand Primary',
            fg: theme.colors.textOnBrand,
            bg: theme.colors.brandPrimary,
            min: 4.5,
            required: 'AA'
        }
    ];

    return (
        <div>
            <h3 className="text-label-sm text-text-muted uppercase tracking-wide mb-4">Accessibility</h3>
            <div className="space-y-4">
                {checks.map((check, i) => {
                    const ratio = getContrastRatio(check.fg, check.bg);
                    const pass = ratio >= check.min;

                    return (
                        <div key={i} className="p-3 rounded-lg border border-border-subtle bg-background-subtle">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-label-sm text-text-secondary">{check.label}</span>
                                <Badge pass={pass} />
                            </div>

                            <div className="flex gap-2 mb-2">
                                <div
                                    className="h-8 w-1/2 rounded border border-border-subtle flex items-center justify-center text-sm font-medium"
                                    style={{ backgroundColor: check.bg, color: check.fg }}
                                >
                                    Aa
                                </div>
                                <div
                                    className="h-8 w-1/2 rounded border border-border-subtle flex items-center justify-center text-sm font-medium"
                                    style={{ backgroundColor: check.bg, color: check.fg, fontWeight: 'bold' }}
                                >
                                    Aa
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <span className="text-body-xs text-text-muted">Ratio</span>
                                <span className="text-label-md font-mono text-text-primary">{ratio.toFixed(2)}:1</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-body-xs text-blue-200">
                        Codra automatically adjusts text lightness to aim for WCAG AA compliance. Manual overrides may be needed for extreme hues.
                    </p>
                </div>
            </div>
        </div>
    );
};

const Badge = ({ pass }: { pass: boolean }) => {
    if (pass) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                <Check className="w-3 h-3" />
                Pass
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20">
            <X className="w-3 h-3" />
            Fail
        </span>
    );
}
