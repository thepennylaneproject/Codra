/**
 * FEEDBACK STORE
 * Aggregates and analyzes feedback patterns across artifacts
 * Used to improve future generations
 */

import { supabase } from '../supabase';

// Standard feedback tags (expandable)
export const FEEDBACK_TAGS = {
    // Complexity
    too_complex: { label: 'Too complex', category: 'complexity', emoji: '🧩' },
    too_simple: { label: 'Too simple', category: 'complexity', emoji: '📦' },
    just_right: { label: 'Just right', category: 'complexity', emoji: '✨' },

    // Tone/Voice
    wrong_tone: { label: 'Wrong tone', category: 'tone', emoji: '🎭' },
    too_formal: { label: 'Too formal', category: 'tone', emoji: '👔' },
    too_casual: { label: 'Too casual', category: 'tone', emoji: '👋' },
    off_brand: { label: 'Off brand', category: 'tone', emoji: '🎨' },

    // Length
    too_long: { label: 'Too long', category: 'length', emoji: '📏' },
    too_short: { label: 'Too short', category: 'length', emoji: '✂️' },

    // Technical
    not_technical: { label: 'Not technical enough', category: 'technical', emoji: '⚙️' },
    too_technical: { label: 'Too technical', category: 'technical', emoji: '🔬' },
    has_errors: { label: 'Has errors', category: 'technical', emoji: '🐛' },

    // Quality
    generic: { label: 'Too generic', category: 'quality', emoji: '📋' },
    not_creative: { label: 'Not creative', category: 'quality', emoji: '💡' },
    love_it: { label: 'Love it!', category: 'quality', emoji: '❤️' },

    // Layout/Design (for visual artifacts)
    wrong_layout: { label: 'Wrong layout', category: 'design', emoji: '📐' },
    wrong_colors: { label: 'Wrong colors', category: 'design', emoji: '🎨' },
    not_accessible: { label: 'Not accessible', category: 'design', emoji: '♿' },
} as const;

export type FeedbackTagId = keyof typeof FEEDBACK_TAGS;

export interface FeedbackPattern {
    tagId: FeedbackTagId;
    count: number;
    percentage: number;
    artifactTypes: string[];
    recentExamples: string[];
}

export interface ProjectFeedbackSummary {
    totalFeedbackCount: number;
    positiveCount: number;
    negativeCount: number;
    topPatterns: FeedbackPattern[];
    byArtifactType: Record<string, FeedbackPattern[]>;
    recommendations: string[];
}

export const feedbackStore = {
    /**
     * Get feedback patterns for a project
     */
    async getProjectFeedback(projectId: string): Promise<ProjectFeedbackSummary> {
        // Fetch all versions with feedback for this project
        const { data: artifacts } = await supabase
            .from('artifacts')
            .select('id, type')
            .eq('project_id', projectId);

        if (!artifacts?.length) {
            return {
                totalFeedbackCount: 0,
                positiveCount: 0,
                negativeCount: 0,
                topPatterns: [],
                byArtifactType: {},
                recommendations: [],
            };
        }

        const artifactIds = artifacts.map(a => a.id);

        const { data: versions } = await supabase
            .from('artifact_versions')
            .select('artifact_id, user_feedback_tags, user_feedback_note')
            .in('artifact_id', artifactIds)
            .not('user_feedback_tags', 'is', null);

        if (!versions?.length) {
            return {
                totalFeedbackCount: 0,
                positiveCount: 0,
                negativeCount: 0,
                topPatterns: [],
                byArtifactType: {},
                recommendations: [],
            };
        }

        // Aggregate feedback tags
        const tagCounts: Record<string, number> = {};
        const tagsByType: Record<string, Record<string, number>> = {};
        let positiveCount = 0;
        let negativeCount = 0;

        versions.forEach((version) => {
            const artifact = artifacts.find(a => a.id === version.artifact_id);
            const artifactType = artifact?.type || 'unknown';

            (version.user_feedback_tags || []).forEach((tag: string) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;

                if (!tagsByType[artifactType]) {
                    tagsByType[artifactType] = {};
                }
                tagsByType[artifactType][tag] = (tagsByType[artifactType][tag] || 0) + 1;

                // Count positive vs negative
                if (tag === 'love_it' || tag === 'just_right') {
                    positiveCount++;
                } else {
                    negativeCount++;
                }
            });
        });

        const totalFeedbackCount = Object.values(tagCounts).reduce((a, b) => a + b, 0);

        // Build top patterns
        const topPatterns: FeedbackPattern[] = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([tagId, count]) => ({
                tagId: tagId as FeedbackTagId,
                count,
                percentage: Math.round((count / totalFeedbackCount) * 100),
                artifactTypes: Object.keys(tagsByType).filter(type => tagsByType[type][tagId]),
                recentExamples: [], // Would need to fetch actual examples
            }));

        // Build per-type patterns
        const byArtifactType: Record<string, FeedbackPattern[]> = {};
        Object.entries(tagsByType).forEach(([type, tags]) => {
            const typeTotal = Object.values(tags).reduce((a, b) => a + b, 0);
            byArtifactType[type] = Object.entries(tags)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([tagId, count]) => ({
                    tagId: tagId as FeedbackTagId,
                    count,
                    percentage: Math.round((count / typeTotal) * 100),
                    artifactTypes: [type],
                    recentExamples: [],
                }));
        });

        // Generate recommendations based on patterns
        const recommendations = generateRecommendations(topPatterns);

        return {
            totalFeedbackCount,
            positiveCount,
            negativeCount,
            topPatterns,
            byArtifactType,
            recommendations,
        };
    },

    /**
     * Get feedback context for regeneration prompt
     */
    async getFeedbackContext(artifactId: string): Promise<string> {
        // Get recent feedback for this artifact
        const { data: versions } = await supabase
            .from('artifact_versions')
            .select('user_feedback_tags, user_feedback_note')
            .eq('artifact_id', artifactId)
            .not('user_feedback_tags', 'is', null)
            .order('created_at', { ascending: false })
            .limit(3);

        if (!versions?.length) return '';

        const feedbackLines: string[] = [];

        versions.forEach((v, i) => {
            const tags = (v.user_feedback_tags || [])
                .map((t: string) => FEEDBACK_TAGS[t as FeedbackTagId]?.label || t)
                .join(', ');

            if (tags) {
                feedbackLines.push(`Version ${i + 1} feedback: ${tags}`);
            }
            if (v.user_feedback_note) {
                feedbackLines.push(`Note: "${v.user_feedback_note}"`);
            }
        });

        if (!feedbackLines.length) return '';

        return `
PREVIOUS FEEDBACK (avoid these issues):
${feedbackLines.join('\n')}
`;
    },
};

function generateRecommendations(patterns: FeedbackPattern[]): string[] {
    const recommendations: string[] = [];

    patterns.forEach(pattern => {
        const tag = FEEDBACK_TAGS[pattern.tagId];
        if (!tag) return;

        switch (pattern.tagId) {
            case 'too_complex':
                recommendations.push('Consider simplifying outputs. Users frequently find content too complex.');
                break;
            case 'too_simple':
                recommendations.push('Add more depth to outputs. Users want more detailed content.');
                break;
            case 'off_brand':
                recommendations.push('Review brand voice settings. Outputs often miss the desired tone.');
                break;
            case 'too_long':
                recommendations.push('Set shorter max_tokens. Users prefer more concise outputs.');
                break;
            case 'has_errors':
                recommendations.push('Enable error checking. Consider using a more capable model.');
                break;
            case 'generic':
                recommendations.push('Increase temperature slightly. Add more specific context to prompts.');
                break;
        }
    });

    return [...new Set(recommendations)].slice(0, 5);
}
