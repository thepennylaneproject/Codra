/**
 * DIFF RENDERER
 * Renders content with diff highlighting
 * Supports code syntax highlighting via simple pre-wrap for now, assumes extensions will handle heavy lifting or simple text diff
 */

import React from 'react';

// Using the types defined in the plan/request
export interface DiffLine {
    type: 'added' | 'removed' | 'unchanged';
    value: string;
}

interface DiffRendererProps {
    content: string;
    diff: DiffLine[];
    side: 'left' | 'right' | 'unified';
    contentType: 'text' | 'code' | 'json' | 'image' | 'svg';
}

export const DiffRenderer: React.FC<DiffRendererProps> = ({
    content,
    diff,
    side,
    contentType,
}) => {
    // Filter diff lines based on side logic
    // Left side: Show REMOVED and UNCHANGED (This was how it was before)
    // Right side: Show ADDED and UNCHANGED (This is how it is now)
    // Unified: Show ALL

    const visibleLines = side === 'unified'
        ? diff
        : side === 'left'
            ? diff.filter(d => d.type !== 'added')
            : diff.filter(d => d.type !== 'removed');

    if (contentType === 'image' || contentType === 'svg') {
        return (
            <div className="flex items-center justify-center h-full p-8 bg-background-subtle">
                <img
                    src={content}
                    alt={`Version preview`}
                    className="max-w-full max-h-full object-contain rounded-lg border border-border-subtle shadow-sm"
                />
            </div>
        );
    }

    // Create a safe display for empty content
    if (!visibleLines || visibleLines.length === 0) {
        return (
            <div className="p-8 text-center text-text-muted italic">
                No content to display for this version.
            </div>
        );
    }

    return (
        <div className="font-mono text-xs md:text-sm overflow-x-auto bg-background-default h-full">
            {visibleLines.map((line, index) => (
                <div
                    key={index}
                    className={`flex group hover:bg-background-subtle/50 transition-colors ${getLineStyle(line.type)}`}
                >
                    {/* Line Number - purely index based for now, ideally would map to real line nums */}
                    <div className="w-12 px-2 py-0.5 text-right text-text-muted select-none border-r border-border-subtle bg-background-subtle/30 shrink-0 text-xs opacity-60">
                        {index + 1}
                    </div>

                    {/* Change Indicator */}
                    <div className={`w-8 px-1 py-0.5 text-center select-none shrink-0 text-xs font-bold ${getIndicatorStyle(line.type)}`}>
                        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ''}
                    </div>

                    {/* Content */}
                    <pre className={`flex-1 px-4 py-0.5 whitespace-pre-wrap break-all ${getContentStyle(line.type)}`}>
                        {line.value || ' '}
                    </pre>
                </div>
            ))}
        </div>
    );
};

function getLineStyle(type: DiffLine['type']): string {
    if (type === 'unchanged') return 'bg-transparent';
    if (type === 'added') return 'bg-state-success/10 dark:bg-state-success/20';
    if (type === 'removed') return 'bg-state-error/10 dark:bg-state-error/20';
    return '';
}

function getIndicatorStyle(type: DiffLine['type']): string {
    if (type === 'added') return 'text-state-success';
    if (type === 'removed') return 'text-state-error';
    return 'text-transparent';
}

function getContentStyle(type: DiffLine['type']): string {
    if (type === 'added') return 'text-text-primary bg-state-success/5';
    if (type === 'removed') return 'text-text-muted line-through opacity-70 bg-state-error/5';
    return 'text-text-primary';
}
