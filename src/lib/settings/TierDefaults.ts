/**
 * TIER DEFAULTS
 * Tier-specific default settings based on account plan
 */

import type { AccountTier, TierDefaults, QualityPriority } from '../../domain/smart-defaults-types';

/**
 * Default settings per account tier
 */
export const TIER_DEFAULTS: Record<AccountTier, TierDefaults> = {
    free: {
        dailyBudget: 5,
        maxSteps: 5,
        qualityPriority: 'fast' as QualityPriority,        // Free tier defaults to speed
        availableModels: ['claude-haiku'],
    },
    pro: {
        dailyBudget: 50,
        maxSteps: 10,
        qualityPriority: 'balanced' as QualityPriority,
        availableModels: ['claude-haiku', 'claude-sonnet'],
    },
    team: {
        dailyBudget: 200,
        maxSteps: 20,
        qualityPriority: 'balanced' as QualityPriority,
        availableModels: ['claude-haiku', 'claude-sonnet', 'claude-opus'],
    },
    enterprise: {
        dailyBudget: 1000,
        maxSteps: 50,
        qualityPriority: 'quality' as QualityPriority,     // Enterprise defaults to quality
        availableModels: ['claude-haiku', 'claude-sonnet', 'claude-opus', 'gpt-4'],
    },
};

/**
 * Get default settings for a given account tier
 */
export function getDefaultsForTier(tier: AccountTier): TierDefaults {
    return TIER_DEFAULTS[tier] || TIER_DEFAULTS.free; // Fallback to free tier
}
