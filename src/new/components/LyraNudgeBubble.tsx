/**
 * LYRA NUDGE BUBBLE
 * Conversational text bubble for proactive Lyra observations
 * 
 * Appears as a floating bubble near the Lyra avatar or in a designated
 * nudge zone. Designed to feel like a friendly colleague tapping you on the shoulder.
 */

import { useState, useEffect } from 'react';
import { X, ChevronRight, Sparkles, AlertCircle, TrendingUp, Clock, Lightbulb, LucideIcon } from 'lucide-react';
import { LyraNudge, NudgeCategory, NudgePriority } from '../../lib/lyra/LyraObserver';
import { useLyra } from '../../lib/lyra/LyraContext';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';

// ============================================
// Category Icons
// ============================================

const CATEGORY_ICONS: Record<NudgeCategory, LucideIcon> = {
    budget: AlertCircle,
    progress: TrendingUp,
    quality: Sparkles,
    suggestion: Lightbulb,
    reminder: Clock,
};

// ============================================
// Priority Styles
// ============================================

const PRIORITY_STYLES: Record<NudgePriority, { border: string; glow: string; icon: string }> = {
    high: {
        border: 'border-amber-400/50',
        glow: 'shadow-amber-500/20',
        icon: 'text-amber-500',
    },
    medium: {
        border: 'border-[var(--brand-accent)]/30',
        glow: 'shadow-[var(--brand-accent)]/10',
        icon: 'text-zinc-500',
    },
    low: {
        border: 'border-zinc-300 dark:border-zinc-700',
        glow: '',
        icon: 'text-zinc-500 dark:text-zinc-400',
    },
};

// ============================================
// Component
// ============================================

interface LyraNudgeBubbleProps {
    nudge: LyraNudge;
    onDismiss: (id: string) => void;
    onAction?: () => void;
    className?: string;
}

export function LyraNudgeBubble({ nudge, onDismiss, onAction, className }: LyraNudgeBubbleProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const Icon = CATEGORY_ICONS[nudge.category];
    const styles = PRIORITY_STYLES[nudge.priority];

    // Animate in on mount
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(nudge.id), 200);
    };

    return (
        <div
            className={clsx(
                // Base styles
                "relative max-w-sm glass-panel rounded-2xl",
                "bg-white/90 dark:bg-zinc-900/90",
                "shadow-lg",
                styles.border,
                styles.glow && `shadow-lg ${styles.glow}`,

                // Animation
                "transition-all duration-300 ease-out",
                isVisible && !isExiting ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95",

                className
            )}
        >
            {/* Speech bubble tail */}
            <div
                className={clsx(
                    "absolute -bottom-2 left-6 w-4 h-4 rotate-45",
                    "bg-white/90 dark:bg-zinc-900/90 border-b border-r",
                    styles.border
                )}
            />

            <div className="relative p-4">
                {/* Header Row */}
                <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div className={clsx(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        "bg-zinc-100 dark:bg-zinc-800",
                        styles.icon
                    )}>
                        <Icon size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                            {nudge.message}
                        </p>
                        {nudge.subMessage && (
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {nudge.subMessage}
                            </p>
                        )}
                    </div>

                    {/* Dismiss Button */}
                    {nudge.dismissable && (
                        <Button
                            onClick={handleDismiss}
                            className={clsx(
                                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                                "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
                                "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                "transition-colors"
                            )}
                            aria-label="Close"
                        >
                            <X size={14} />
                        </Button>
                    )}
                </div>

                {/* Action Button (if provided) */}
                {nudge.action && (
                    <Button
                        onClick={() => {
                            nudge.action?.callback();
                            onAction?.();
                            handleDismiss();
                        }}
                        className={clsx(
                            "mt-3 w-full flex items-center justify-center gap-1",
                            "px-3 py-1 rounded-lg text-xs font-medium",
                            "bg-zinc-100 dark:bg-zinc-800",
                            "text-zinc-700 dark:text-zinc-300",
                            "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                            "transition-colors"
                        )}
                    >
                        {nudge.action.label}
                        <ChevronRight size={12} />
                    </Button>
                )}
            </div>
        </div>
    );
}

// ============================================
// Container for Multiple Nudges
// ============================================

interface LyraNudgeContainerProps {
    maxVisible?: number;
    className?: string;
}

export function LyraNudgeContainer({ maxVisible = 2, className }: LyraNudgeContainerProps) {
    const { nudges, dismissNudge } = useLyra();

    // Only show the first N nudges
    const visibleNudges = nudges.slice(0, maxVisible);

    if (visibleNudges.length === 0) {
        return null;
    }

    return (
        <div className={clsx("flex flex-col gap-3", className)}>
            {visibleNudges.map((nudge, index) => (
                <LyraNudgeBubble
                    key={nudge.id}
                    nudge={nudge}
                    onDismiss={dismissNudge}
                    className={index > 0 ? "opacity-80" : ""}
                />
            ))}

            {/* Show count of remaining nudges */}
            {nudges.length > maxVisible && (
                <div className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
                    +{nudges.length - maxVisible} more
                </div>
            )}
        </div>
    );
}

export default LyraNudgeBubble;
