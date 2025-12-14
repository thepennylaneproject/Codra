/**
 * FEEDBACK SUMMARY
 * Displays project-level feedback statistics and patterns
 */

import React, { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, BarChart2, Loader2 } from 'lucide-react';
import { feedbackStore, ProjectFeedbackSummary, FEEDBACK_TAGS } from '../../../lib/feedback/feedback-store';

interface FeedbackSummaryProps {
    projectId: string;
}

export const FeedbackSummary: React.FC<FeedbackSummaryProps> = ({ projectId }) => {
    const [summary, setSummary] = useState<ProjectFeedbackSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSummary() {
            try {
                const data = await feedbackStore.getProjectFeedback(projectId);
                setSummary(data);
            } catch (error) {
                console.error('Failed to load feedback summary:', error);
            } finally {
                setLoading(false);
            }
        }

        loadSummary();
    }, [projectId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 bg-background-elevated rounded-lg border border-border-subtle h-48">
                <Loader2 className="w-6 h-6 text-brand-teal animate-spin" />
            </div>
        );
    }

    if (!summary || summary.totalFeedbackCount === 0) {
        return (
            <div className="p-8 bg-background-elevated rounded-lg border border-border-subtle text-center">
                <BarChart2 className="w-8 h-8 text-text-muted mx-auto mb-3" />
                <h3 className="text-label-lg font-semibold text-text-primary">No Feedback Yet</h3>
                <p className="text-body-sm text-text-secondary mt-1">
                    Give feedback on artifacts to start seeing patterns.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-background-elevated rounded-lg border border-border-subtle">
                    <div className="text-label-sm text-text-muted mb-1">Total Feedback</div>
                    <div className="text-title-lg font-bold text-text-primary">
                        {summary.totalFeedbackCount}
                    </div>
                </div>
                <div className="p-4 bg-background-elevated rounded-lg border border-border-subtle">
                    <div className="flex items-center gap-2 text-label-sm text-text-muted mb-1">
                        <ThumbsUp className="w-3 h-3 text-state-success" /> Positive
                    </div>
                    <div className="text-title-lg font-bold text-state-success">
                        {summary.positiveCount}
                    </div>
                </div>
                <div className="p-4 bg-background-elevated rounded-lg border border-border-subtle">
                    <div className="flex items-center gap-2 text-label-sm text-text-muted mb-1">
                        <ThumbsDown className="w-3 h-3 text-state-error" /> Negative
                    </div>
                    <div className="text-title-lg font-bold text-state-error">
                        {summary.negativeCount}
                    </div>
                </div>
            </div>

            {/* Top Patterns */}
            <div className="p-4 bg-background-elevated rounded-lg border border-border-subtle">
                <h3 className="text-label-md font-semibold text-text-primary mb-4">
                    Top Feedback Patterns
                </h3>
                <div className="space-y-3">
                    {summary.topPatterns.map((pattern) => {
                        const tag = FEEDBACK_TAGS[pattern.tagId];
                        if (!tag) return null;

                        return (
                            <div key={pattern.tagId} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl" role="img" aria-label={tag.label}>
                                        {tag.emoji}
                                    </span>
                                    <div>
                                        <div className="text-label-sm font-medium text-text-primary">
                                            {tag.label}
                                        </div>
                                        <div className="text-body-xs text-text-muted">
                                            {pattern.count} occurrences
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-1.5 bg-background-subtle rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${pattern.tagId === 'love_it' || pattern.tagId === 'just_right'
                                                    ? 'bg-state-success'
                                                    : 'bg-brand-gold'
                                                }`}
                                            style={{ width: `${pattern.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-label-sm text-text-secondary w-8 text-right">
                                        {pattern.percentage}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
