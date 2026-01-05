/**
 * ARTIFACT FEEDBACK BAR
 * Quick feedback collection UI for generated artifacts
 * 
 * Appears after artifact generation to collect thumbs up/down
 * and optional tag-based feedback for improving future generations.
 */

import { useState, useMemo } from 'react';
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { FEEDBACK_TAGS, FeedbackTagId } from '../../lib/feedback/feedback-store';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';

// ============================================
// Types
// ============================================

interface ArtifactFeedbackBarProps {
    artifactId: string;
    artifactType?: 'copy' | 'image' | 'code' | 'design' | 'other';
    onSubmit: (feedback: {
        isPositive: boolean;
        tags: FeedbackTagId[];
        note?: string;
    }) => void;
    onDismiss?: () => void;
    className?: string;
}

// ============================================
// Tag Categories by Artifact Type
// ============================================

const TAG_CATEGORIES_BY_TYPE: Record<string, (keyof typeof FEEDBACK_TAGS)[]> = {
    copy: ['too_long', 'too_short', 'wrong_tone', 'too_formal', 'too_casual', 'off_brand', 'generic', 'not_creative', 'love_it'],
    image: ['wrong_layout', 'wrong_colors', 'off_brand', 'generic', 'not_creative', 'love_it'],
    code: ['too_complex', 'too_simple', 'has_errors', 'generic', 'love_it'],
    design: ['wrong_layout', 'wrong_colors', 'not_accessible', 'too_complex', 'too_simple', 'love_it'],
    other: ['too_complex', 'too_simple', 'wrong_tone', 'off_brand', 'generic', 'love_it'],
};

// ============================================
// Component
// ============================================

export function ArtifactFeedbackBar({
    artifactId: _artifactId, // Reserved for future persistence
    artifactType = 'other',
    onSubmit,
    onDismiss,
    className
}: ArtifactFeedbackBarProps) {
    const [sentiment, setSentiment] = useState<'positive' | 'negative' | null>(null);
    const [selectedTags, setSelectedTags] = useState<Set<FeedbackTagId>>(new Set());
    const [note, setNote] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Get relevant tags for this artifact type
    const relevantTagIds = useMemo(() => {
        return TAG_CATEGORIES_BY_TYPE[artifactType] || TAG_CATEGORIES_BY_TYPE.other;
    }, [artifactType]);

    const handleSentimentClick = (positive: boolean) => {
        if (sentiment === (positive ? 'positive' : 'negative')) {
            // Toggle off
            setSentiment(null);
            setIsExpanded(false);
        } else {
            setSentiment(positive ? 'positive' : 'negative');
            // If negative, expand to show tags
            if (!positive) {
                setIsExpanded(true);
            }
        }
    };

    const handleTagToggle = (tagId: FeedbackTagId) => {
        const newTags = new Set(selectedTags);
        if (newTags.has(tagId)) {
            newTags.delete(tagId);
        } else {
            newTags.add(tagId);
        }
        setSelectedTags(newTags);
    };

    const handleSubmit = () => {
        if (sentiment === null) return;

        onSubmit({
            isPositive: sentiment === 'positive',
            tags: Array.from(selectedTags),
            note: note.trim() || undefined,
        });

        setIsSubmitted(true);
    };

    // Show success state after submission
    if (isSubmitted) {
        return (
            <div className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                "bg-emerald-50 dark:bg-emerald-900/20",
                "text-emerald-700 dark:text-emerald-300 text-sm",
                className
            )}>
                <Check size={16} />
                <span>Thanks for your feedback!</span>
            </div>
        );
    }

    return (
        <div className={clsx(
            "glass-panel bg-white/80 dark:bg-zinc-900/80",
            "border-zinc-200 dark:border-zinc-800",
            className
        )}>
            {/* Main Row */}
            <div className="flex items-center gap-2 px-3 py-2">
                {/* Sentiment Buttons */}
                <div className="flex items-center gap-1">
                    <Button
                        onClick={() => handleSentimentClick(true)}
                        className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            sentiment === 'positive'
                                ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        )}
                        aria-label="Like"
                    >
                        <ThumbsUp size={16} />
                    </Button>
                    <Button
                        onClick={() => handleSentimentClick(false)}
                        className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            sentiment === 'negative'
                                ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        )}
                        aria-label="Dislike"
                    >
                        <ThumbsDown size={16} />
                    </Button>
                </div>

                {/* Divider */}
                <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />

                {/* Label */}
                <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-1">
                    {sentiment === null ? 'How was this?' :
                        sentiment === 'positive' ? 'Great! Add tags?' : 'What went wrong?'}
                </span>

                {/* Expand/Collapse */}
                {sentiment !== null && (
                    <Button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={clsx(
                            "w-6 h-6 rounded flex items-center justify-center",
                            "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
                            "hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        )}
                    >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </Button>
                )}

                {/* Submit (if sentiment selected) */}
                {sentiment !== null && (
                    <Button
                        onClick={handleSubmit}
                        className={clsx(
                            "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                            "bg-[var(--brand-accent)]/10 text-zinc-500",
                            "hover:bg-[var(--brand-accent)]/20"
                        )}
                    >
                        Done
                    </Button>
                )}

                {/* Dismiss */}
                {onDismiss && (
                    <Button
                        onClick={onDismiss}
                        className={clsx(
                            "w-6 h-6 rounded flex items-center justify-center",
                            "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
                            "hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        )}
                        aria-label="Close"
                    >
                        <X size={14} />
                    </Button>
                )}
            </div>

            {/* Expanded Tags Section */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    {/* Tag Pills */}
                    <div className="flex flex-wrap gap-1 mb-3">
                        {relevantTagIds.map(tagId => {
                            const tag = FEEDBACK_TAGS[tagId];
                            if (!tag) return null;

                            const isSelected = selectedTags.has(tagId);

                            return (
                                <Button
                                    key={tagId}
                                    onClick={() => handleTagToggle(tagId)}
                                    className={clsx(
                                        "px-2 py-1 rounded-full text-xs transition-all",
                                        isSelected
                                            ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                    )}
                                >
                                    <span className="mr-1">{tag.emoji}</span>
                                    {tag.label}
                                </Button>
                            );
                        })}
                    </div>

                    {/* Optional Note */}
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a note (optional)"
                        className={clsx(
                            "w-full px-3 py-1 rounded-lg text-xs",
                            "bg-zinc-50 dark:bg-zinc-800/50",
                            "border border-zinc-200 dark:border-zinc-700",
                            "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                            "focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
                        )}
                    />
                </div>
            )}
        </div>
    );
}

export default ArtifactFeedbackBar;
