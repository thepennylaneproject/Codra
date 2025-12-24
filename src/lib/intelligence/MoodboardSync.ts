/**
 * MOODBOARD SYNC
 * Detects visual drift between the defining moodboard and generated outputs.
 */

import { MoodboardImage } from '../../domain/types';

export interface DriftReport {
    driftScore: number; // 0.0 to 1.0
    isDrifting: boolean;
    suggestions: string[];
}

/**
 * Compare recent outputs against the moodboard definition
 */
export function detectStyleDrift(
    moodboard: MoodboardImage[],
    recentOutputs: { type: string; tags: string[] }[]
): DriftReport {
    if (recentOutputs.length < 3) {
        return { driftScore: 0, isDrifting: false, suggestions: [] };
    }

    // Analyze moodboard tags (derived from captions/roles)
    const moodboardKeywords = moodboard.flatMap(img =>
        (img.caption || '').toLowerCase().split(' ').filter(w => w.length > 3)
    );

    // Analyze output tags
    const outputTags = recentOutputs.flatMap(o => o.tags || []);

    // Count matches (simple heuristic)
    let matches = 0;
    let totalChecks = 0;

    outputTags.forEach(tag => {
        totalChecks++;
        // Very fuzzy matching
        if (moodboardKeywords.some(kw => kw.includes(tag) || tag.includes(kw))) {
            matches++;
        }
    });

    // Calculate score (inverse of match rate)
    // If 100% match, score is 0 (no drift). If 0% match, score is 1 (high drift).
    const matchRate = totalChecks === 0 ? 1 : matches / totalChecks;
    const driftScore = 1 - matchRate;

    const isDrifting = driftScore > 0.6; // Threshold

    const suggestions: string[] = [];
    if (isDrifting) {
        suggestions.push('Recent outputs generated tags widely divergent from moodboard keywords.');
        suggestions.push('Consider updating constraints or refreshing the moodboard.');
    }

    return {
        driftScore,
        isDrifting,
        suggestions
    };
}
