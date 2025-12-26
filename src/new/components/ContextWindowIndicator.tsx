/**
 * CONTEXT WINDOW INDICATOR
 * src/new/components/ContextWindowIndicator.tsx
 * 
 * Visual indicator showing context memory usage.
 * Shows: Green (plenty of space) → Yellow (compressing) → Red (critical only)
 */

import React from 'react';
import { Brain, AlertTriangle, AlertCircle } from 'lucide-react';

interface ContextWindowIndicatorProps {
    current: number;
    max: number;
    percentage: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    className?: string;
    showLabel?: boolean;
}

export const ContextWindowIndicator: React.FC<ContextWindowIndicatorProps> = ({
    current: _current,
    max: _max,
    percentage,
    level,
    className = '',
    showLabel = true,
}) => {
    // _current and _max available for tooltip if needed
    void _current; void _max;
    const colors = {
        low: {
            bg: 'bg-emerald-500',
            text: 'text-emerald-600',
            label: 'Good',
            icon: Brain,
        },
        medium: {
            bg: 'bg-amber-500',
            text: 'text-amber-600',
            label: 'Moderate',
            icon: Brain,
        },
        high: {
            bg: 'bg-orange-500',
            text: 'text-orange-600',
            label: 'Compressing',
            icon: AlertTriangle,
        },
        critical: {
            bg: 'bg-red-500',
            text: 'text-red-600',
            label: 'Critical Only',
            icon: AlertCircle,
        },
    };

    const config = colors[level];
    const Icon = config.icon;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Icon size={14} className={config.text} />
            
            <div className="flex-1 min-w-[60px]">
                {/* Progress Bar */}
                <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${config.bg} transition-all duration-300`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            </div>

            {showLabel && (
                <span className={`text-[9px] font-bold uppercase tracking-wider ${config.text}`}>
                    {config.label}
                </span>
            )}
        </div>
    );
};

/**
 * Compact version for header/toolbar
 */
export const ContextWindowBadge: React.FC<{
    level: 'low' | 'medium' | 'high' | 'critical';
    percentage: number;
}> = ({ level, percentage }) => {
    const colors = {
        low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        medium: 'bg-amber-100 text-amber-700 border-amber-200',
        high: 'bg-orange-100 text-orange-700 border-orange-200',
        critical: 'bg-red-100 text-red-700 border-red-200',
    };

    const icons = {
        low: '🧠',
        medium: '⚠️',
        high: '🔶',
        critical: '🔴',
    };

    return (
        <div 
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold ${colors[level]}`}
            title={`Context memory: ${percentage}% used`}
        >
            <span>{icons[level]}</span>
            <span>{percentage}%</span>
        </div>
    );
};
