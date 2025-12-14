/**
 * REGENERATION CONTROLS
 * The Creative Correction Loop UI
 * 
 * "Don't like it? Regenerate with guidance."
 */

import React, { useState } from 'react';

interface RegenerationControlsProps {
    artifactId: string;
    onRegenerate: (feedback: string, tags: string[]) => void;
    onApprove: () => void;
    isRegenerating: boolean;
}

const FEEDBACK_TAGS = [
    { id: 'too_complex', label: 'Too complex', emoji: '🧩' },
    { id: 'too_simple', label: 'Too simple', emoji: '📦' },
    { id: 'wrong_tone', label: 'Wrong tone', emoji: '🎭' },
    { id: 'off_brand', label: 'Off brand', emoji: '🎨' },
    { id: 'too_long', label: 'Too long', emoji: '📏' },
    { id: 'too_short', label: 'Too short', emoji: '✂️' },
    { id: 'not_technical', label: 'Not technical enough', emoji: '⚙️' },
    { id: 'too_technical', label: 'Too technical', emoji: '🔬' },
];

export const RegenerationControls: React.FC<RegenerationControlsProps> = ({
    onRegenerate,
    onApprove,
    isRegenerating,
}) => {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [feedbackNote, setFeedbackNote] = useState('');
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);

    const toggleTag = (tagId: string) => {
        setSelectedTags((prev) =>
            prev.includes(tagId)
                ? prev.filter((t) => t !== tagId)
                : [...prev, tagId]
        );
    };

    const handleRegenerate = () => {
        onRegenerate(feedbackNote, selectedTags);
        setShowFeedbackForm(false);
        setSelectedTags([]);
        setFeedbackNote('');
    };

    return (
        <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-3">
                <button
                    onClick={onApprove}
                    className="flex-1 py-2.5 bg-state-success/20 text-state-success border border-state-success/30 rounded-lg text-label-md font-medium hover:bg-state-success/30 transition-colors"
                >
                    ✓ Approve
                </button>
                <button
                    onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                    className="flex-1 py-2.5 bg-brand-gold/20 text-brand-gold border border-brand-gold/30 rounded-lg text-label-md font-medium hover:bg-brand-gold/30 transition-colors"
                >
                    ↻ Regenerate
                </button>
            </div>

            {/* Feedback Form */}
            {showFeedbackForm && (
                <div className="p-4 bg-background-subtle rounded-lg border border-border-subtle space-y-4">
                    <div>
                        <label className="text-label-sm text-text-muted mb-3 block">
                            What's not quite right?
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {FEEDBACK_TAGS.map((tag) => (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-3 py-1.5 rounded-full text-label-sm transition-colors ${selectedTags.includes(tag.id)
                                            ? 'bg-brand-teal/20 text-brand-teal border border-brand-teal/30'
                                            : 'bg-background-default text-text-muted border border-border-subtle hover:border-border-strong'
                                        }`}
                                >
                                    {tag.emoji} {tag.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-label-sm text-text-muted mb-2 block">
                            Additional guidance (optional)
                        </label>
                        <textarea
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                            placeholder="e.g., Make it more playful, add more technical details, use shorter sentences..."
                            rows={2}
                            className="w-full px-3 py-2 bg-background-default border border-border-subtle rounded-lg text-text-primary text-body-sm placeholder-text-muted focus:outline-none focus:border-brand-teal resize-none"
                        />
                    </div>

                    <button
                        onClick={handleRegenerate}
                        disabled={isRegenerating || (selectedTags.length === 0 && !feedbackNote.trim())}
                        className="w-full py-2.5 bg-brand-gold text-background-default text-label-md font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isRegenerating ? 'Regenerating...' : 'Regenerate with Feedback'}
                    </button>
                </div>
            )}
        </div>
    );
};
