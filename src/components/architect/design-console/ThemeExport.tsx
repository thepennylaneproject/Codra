/**
 * THEME EXPORT
 * Export controls for CSS/Tailwind
 */

import React, { useState } from 'react';
import type { GeneratedTheme } from '../../../types/design';
import { themeToCSSVars, themeToTailwind } from '../../../lib/design/theme-generator';
import { Copy, Check } from 'lucide-react';

interface ThemeExportProps {
    theme: GeneratedTheme;
}

export const ThemeExport: React.FC<ThemeExportProps> = ({ theme }) => {
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (type: 'css' | 'tailwind') => {
        const content = type === 'css'
            ? themeToCSSVars(theme)
            : JSON.stringify(themeToTailwind(theme), null, 2);

        navigator.clipboard.writeText(content);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">Export Theme</h2>
                <p className="text-text-secondary">
                    Copy your theme configuration to use in your project.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* CSS Variables */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">CSS Variables</h3>
                        <button
                            onClick={() => handleCopy('css')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-background-subtle border border-border-subtle hover:bg-background-elevated transition-colors text-xs font-medium text-text-primary"
                        >
                            {copied === 'css' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            {copied === 'css' ? 'Copied' : 'Copy CSS'}
                        </button>
                    </div>
                    <pre className="p-4 rounded-lg bg-background-elevated border border-border-subtle overflow-auto text-xs font-mono text-text-muted h-96">
                        {themeToCSSVars(theme)}
                    </pre>
                </div>

                {/* Tailwind Config */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">Tailwind Config</h3>
                        <button
                            onClick={() => handleCopy('tailwind')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-background-subtle border border-border-subtle hover:bg-background-elevated transition-colors text-xs font-medium text-text-primary"
                        >
                            {copied === 'tailwind' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            {copied === 'tailwind' ? 'Copied' : 'Copy JSON'}
                        </button>
                    </div>
                    <pre className="p-4 rounded-lg bg-background-elevated border border-border-subtle overflow-auto text-xs font-mono text-text-muted h-96">
                        {JSON.stringify(themeToTailwind(theme), null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};
