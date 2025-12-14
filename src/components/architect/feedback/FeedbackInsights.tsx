/**
 * FEEDBACK INSIGHTS
 * Displays AI-generated insights and recommendations based on feedback
 */

import React, { useEffect, useState } from 'react';
import { Lightbulb, TrendingUp, Sparkles } from 'lucide-react';
import { feedbackStore, ProjectFeedbackSummary } from '../../../lib/feedback/feedback-store';

interface FeedbackInsightsProps {
    projectId: string;
}

export const FeedbackInsights: React.FC<FeedbackInsightsProps> = ({ projectId }) => {
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

    if (loading || !summary || summary.recommendations.length === 0) {
        return null;
    }

    return (
        <div className="p-4 bg-background-elevated rounded-lg border border-border-subtle">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-brand-purple" />
                <h3 className="text-label-md font-semibold text-text-primary">
                    Learning Insights
                </h3>
            </div>

            <div className="space-y-3">
                {summary.recommendations.map((rec, index) => (
                    <div
                        key={index}
                        className="flex gap-3 p-3 bg-background-subtle rounded-md border border-border-subtle/50"
                    >
                        <Lightbulb className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                        <p className="text-body-sm text-text-primary">
                            {rec}
                        </p>
                    </div>
                ))}

                {/* Mock "trending" insight based on data */}
                {summary.positiveCount > summary.negativeCount && (
                    <div className="flex gap-3 p-3 bg-state-success/10 rounded-md border border-state-success/20">
                        <TrendingUp className="w-4 h-4 text-state-success shrink-0 mt-0.5" />
                        <p className="text-body-sm text-text-primary">
                            Your feedback trend is positive! The models are aligning well with your preferences.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
