/**
 * CROSS DESK SUGGESTION CARD
 * Displays suggestions from other Production Desks
 * 
 * Shows cross-pollination opportunities when one desk's output
 * could benefit work in another desk.
 */

import { useState, useEffect } from 'react';
import { ArrowRight, X, Sparkles, LucideIcon, Palette, Code2, PenTool, Megaphone, BarChart3, Briefcase } from 'lucide-react';
import {
    CrossDeskSuggestion,
    getSuggestionsForDesk,
    dismissSuggestion,
    onSuggestion,
    getDeskName
} from '../../lib/desks/DeskBridge';
import { ProductionDeskId } from '../../domain/types';
import { clsx } from 'clsx';

// ============================================
// Desk Icons
// ============================================

const DESK_ICONS: Record<ProductionDeskId, LucideIcon> = {
    'art-design': Palette,
    'engineering': Code2,
    'writing': PenTool,
    'marketing': Megaphone,
    'workflow': Sparkles,
    'career-assets': Briefcase,
    'data-analysis': BarChart3,
};

// ============================================
// Single Suggestion Card
// ============================================

interface CrossDeskSuggestionCardProps {
    suggestion: CrossDeskSuggestion;
    onAction: (suggestion: CrossDeskSuggestion) => void;
    onDismiss: (suggestionId: string) => void;
}

function CrossDeskSuggestionCard({ suggestion, onAction, onDismiss }: CrossDeskSuggestionCardProps) {
    const SourceIcon = DESK_ICONS[suggestion.sourceDesk] || Sparkles;
    const TargetIcon = DESK_ICONS[suggestion.targetDesk] || Sparkles;

    return (
        <div className={clsx(
            "rounded-xl border p-3",
            "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm",
            "border-zinc-200 dark:border-zinc-700",
            suggestion.priority === 'high' && "border-amber-300 dark:border-amber-700",
        )}>
            {/* Header: Source → Target */}
            <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <SourceIcon size={14} />
                    <span>{getDeskName(suggestion.sourceDesk)}</span>
                </div>
                <ArrowRight size={12} className="text-zinc-400" />
                <div className="flex items-center gap-1.5 text-xs text-[var(--brand-accent)]">
                    <TargetIcon size={14} />
                    <span>{getDeskName(suggestion.targetDesk)}</span>
                </div>

                <div className="flex-1" />

                {/* Dismiss */}
                <button
                    onClick={() => onDismiss(suggestion.id)}
                    className={clsx(
                        "w-5 h-5 rounded flex items-center justify-center",
                        "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
                        "hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    )}
                    aria-label="Dismiss"
                >
                    <X size={12} />
                </button>
            </div>

            {/* Message */}
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
                {suggestion.message}
            </p>

            {/* Action Button */}
            <button
                onClick={() => onAction(suggestion)}
                className={clsx(
                    "w-full py-1.5 px-3 rounded-lg text-xs font-medium",
                    "bg-zinc-100 dark:bg-zinc-800",
                    "text-zinc-700 dark:text-zinc-300",
                    "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                    "transition-colors flex items-center justify-center gap-1.5"
                )}
            >
                {suggestion.action}
                <ArrowRight size={12} />
            </button>
        </div>
    );
}

// ============================================
// Container: Suggestions for Current Desk
// ============================================

interface CrossDeskSuggestionsProps {
    currentDesk: ProductionDeskId;
    onNavigateToDesk?: (deskId: ProductionDeskId, context?: Record<string, unknown>) => void;
    className?: string;
}

export function CrossDeskSuggestions({
    currentDesk,
    onNavigateToDesk,
    className
}: CrossDeskSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<CrossDeskSuggestion[]>([]);

    // Load initial suggestions and subscribe to new ones
    useEffect(() => {
        // Load existing suggestions for this desk
        setSuggestions(getSuggestionsForDesk(currentDesk));

        // Subscribe to new suggestions
        const unsubscribe = onSuggestion((newSuggestion) => {
            if (newSuggestion.targetDesk === currentDesk) {
                setSuggestions(prev => [...prev, newSuggestion]);
            }
        });

        return unsubscribe;
    }, [currentDesk]);

    const handleAction = (suggestion: CrossDeskSuggestion) => {
        // Navigate to the target desk with context
        onNavigateToDesk?.(suggestion.targetDesk, suggestion.metadata);
        dismissSuggestion(suggestion.id);
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    };

    const handleDismiss = (suggestionId: string) => {
        dismissSuggestion(suggestionId);
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    };

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <div className={clsx("space-y-2", className)}>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
                <Sparkles size={12} />
                <span>From other desks</span>
            </div>

            {suggestions.map(suggestion => (
                <CrossDeskSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAction={handleAction}
                    onDismiss={handleDismiss}
                />
            ))}
        </div>
    );
}

// ============================================
// Compact Badge (for desk headers)
// ============================================

interface CrossDeskBadgeProps {
    currentDesk: ProductionDeskId;
    onClick?: () => void;
}

export function CrossDeskBadge({ currentDesk, onClick }: CrossDeskBadgeProps) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        setCount(getSuggestionsForDesk(currentDesk).length);

        const unsubscribe = onSuggestion((newSuggestion) => {
            if (newSuggestion.targetDesk === currentDesk) {
                setCount(prev => prev + 1);
            }
        });

        return unsubscribe;
    }, [currentDesk]);

    if (count === 0) {
        return null;
    }

    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex items-center gap-1 px-2 py-0.5 rounded-full",
                "bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]",
                "text-xs font-medium",
                "hover:bg-[var(--brand-accent)]/20 transition-colors"
            )}
        >
            <Sparkles size={10} />
            <span>{count}</span>
        </button>
    );
}

export default CrossDeskSuggestions;
