/**
 * FEEDBACK COLLECTOR
 * UI for collecting structured feedback on artifacts
 * Tags + free-form note
 */

import React, { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { FEEDBACK_TAGS, FeedbackTagId } from '../../../lib/feedback/feedback-store';

interface FeedbackCollectorProps {
    onSubmit: (tags: FeedbackTagId[], note: string) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    artifactType?: string;
}

export const FeedbackCollector: React.FC<FeedbackCollectorProps> = ({
    onSubmit,
    onCancel,
    isSubmitting = false,
    artifactType,
}) => {
    const [selectedTags, setSelectedTags] = useState<FeedbackTagId[]>([]);
    const [note, setNote] = useState('');
    const [showAllTags, setShowAllTags] = useState(false);

    const toggleTag = (tagId: FeedbackTagId) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(t => t !== tagId)
                : [...prev, tagId]
        );
    };

    const handleSubmit = () => {
        if (selectedTags.length === 0 && !note.trim()) return;
        onSubmit(selectedTags, note.trim());
    };

    // Group tags by category
    const tagsByCategory = Object.entries(FEEDBACK_TAGS).reduce((acc, [id, tag]) => {
        if (!acc[tag.category]) acc[tag.category] = [];
        acc[tag.category].push({ id: id as FeedbackTagId, ...tag });
        return acc;
    }, {} as Record<string, Array<{ id: FeedbackTagId; label: string; category: string; emoji: string }>>);

    // Filter relevant tags based on artifact type
    const relevantCategories = artifactType && ['icon', 'illustration', 'component'].includes(artifactType)
        ? ['complexity', 'quality', 'design']
        : ['complexity', 'tone', 'length', 'technical', 'quality'];

    const displayCategories = showAllTags
        ? Object.keys(tagsByCategory)
        : relevantCategories;

    const canSubmit = selectedTags.length > 0 || note.trim().length > 0;

    return (
        <div className="p-4 bg-background-elevated rounded-lg border border-border-subtle">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-brand-gold" />
                    <h3 className="text-label-md text-text-primary font-semibold">
                        What needs improvement?
                    </h3>
                </div>
                <button
                    onClick={onCancel}
                    className="p-1.5 hover:bg-background-subtle rounded-lg transition-colors"
                >
                    <X className="w-4 h-4 text-text-muted" />
                </button>
            </div>

            {/* Tag Categories */}
            <div className="space-y-4 mb-4">
                {displayCategories.map(category => (
                    <div key={category}>
                        <label className="text-label-sm text-text-muted uppercase tracking-wide mb-2 block">
                            {category}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {tagsByCategory[category]?.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-3 py-1.5 rounded-full text-label-sm transition-all ${selectedTags.includes(tag.id)
                                            ? tag.id === 'love_it' || tag.id === 'just_right'
                                                ? 'bg-state-success/20 text-state-success border border-state-success/30'
                                                : 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30'
                                            : 'bg-background-subtle text-text-muted border border-border-subtle hover:border-border-strong'
                                        }`}
                                >
                                    {tag.emoji} {tag.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Show More/Less */}
            {!showAllTags && (
                <button
                    onClick={() => setShowAllTags(true)}
                    className="text-body-sm text-brand-teal hover:text-brand-teal/80 mb-4"
                >
                    Show more options →
                </button>
            )}

            {/* Note Input */}
            <div className="mb-4">
                <label className="text-label-sm text-text-muted mb-2 block">
                    Additional guidance (optional)
                </label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Be specific: 'Make it more conversational', 'Add error handling', 'Use warmer colors'..."
                    rows={3}
                    className="w-full px-3 py-2 bg-background-default border border-border-subtle rounded-lg text-text-primary text-body-sm placeholder-text-muted focus:outline-none focus:border-brand-teal resize-none"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-gold text-background-default text-label-md font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isSubmitting ? (
                        'Submitting...'
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Submit & Regenerate
                        </>
                    )}
                </button>
                <button
                    onClick={onCancel}
                    className="px-4 py-2.5 text-text-muted hover:text-text-primary text-label-md transition-colors"
                >
                    Cancel
                </button>
            </div>

            {/* Help Text */}
            <p className="mt-3 text-body-sm text-text-soft text-center">
                Your feedback helps Codra learn your preferences
            </p>
        </div>
    );
};
