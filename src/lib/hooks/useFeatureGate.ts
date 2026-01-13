/**
 * FEATURE GATE HOOK
 * Hook for gating feature access based on user tier
 * src/lib/hooks/useFeatureGate.ts
 */

import { useState, useCallback, useMemo } from 'react';
import { useUserTierStore, UserTier, TIER_LIMITS } from '../stores/user-tier';
import { analytics } from '../analytics';

// ============================================================
// Types
// ============================================================

export type GatedFeature = 'projects' | 'task_execution' | 'coherence_scan' | 'collaboration';

export interface FeatureGateResult {
    /** Whether the feature is allowed for this user */
    allowed: boolean;
    /** Remaining usage count (for countable features like projects/scans) */
    remaining: number | 'unlimited';
    /** User's current tier */
    tier: UserTier;
    /** Human-readable reason if not allowed */
    reason: string;
    /** Open the upgrade modal */
    showUpgrade: () => void;
    /** Whether upgrade modal is currently open */
    upgradeModalOpen: boolean;
    /** Close the upgrade modal */
    closeUpgradeModal: () => void;
    /** Feature name for display */
    featureName: string;
}

// ============================================================
// Feature Display Names
// ============================================================

const FEATURE_NAMES: Record<GatedFeature, string> = {
    projects: 'Projects',
    task_execution: 'Task Execution',
    coherence_scan: 'Coherence Scan',
    collaboration: 'Team Collaboration',
};

// ============================================================
// Gate Reasons
// ============================================================

const GATE_REASONS: Record<GatedFeature, Record<'limit' | 'disabled', string>> = {
    projects: {
        limit: 'You have reached your project limit. Upgrade to create more.',
        disabled: 'Projects are not available on your plan.',
    },
    task_execution: {
        limit: 'Task execution limit reached.',
        disabled: 'Task execution is a Pro feature. Upgrade to enable.',
    },
    coherence_scan: {
        limit: 'You have used all your scans this month. Upgrade for more.',
        disabled: 'Coherence Scan is a Pro feature. Upgrade to enable.',
    },
    collaboration: {
        limit: 'You have reached your team seat limit.',
        disabled: 'Collaboration is a Team feature. Upgrade to enable.',
    },
};

// Free tier specific messages
const FREE_TIER_MESSAGES: Record<GatedFeature, string> = {
    projects: 'Free users can create 1 project. Upgrade to Pro for 10.',
    task_execution: 'Task execution is a Pro feature. Upgrade to unlock.',
    coherence_scan: 'Coherence Scan is a Pro feature. Upgrade to unlock.',
    collaboration: 'Collaboration is a Team feature. Upgrade to unlock.',
};

// ============================================================
// Hook Implementation
// ============================================================

export function useFeatureGate(feature: GatedFeature): FeatureGateResult {
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    
    const {
        tier,
        projectCount,
        projectLimit,
        coherenceScanUsage,
        coherenceScanLimit,
        taskExecutionEnabled,
    } = useUserTierStore();

    // Calculate if feature is allowed and remaining count
    const { allowed, remaining, reason } = useMemo((): { allowed: boolean; remaining: number | 'unlimited'; reason: string } => {
        const limits = TIER_LIMITS[tier];

        switch (feature) {
            case 'projects': {
                const limit = projectLimit === 'unlimited' ? Infinity : projectLimit;
                const isAllowed = projectCount < limit;
                const rem: number | 'unlimited' = projectLimit === 'unlimited' ? 'unlimited' : Math.max(0, limit - projectCount);
                return {
                    allowed: isAllowed,
                    remaining: rem,
                    reason: isAllowed 
                        ? '' 
                        : tier === 'free' 
                            ? FREE_TIER_MESSAGES.projects 
                            : GATE_REASONS.projects.limit,
                };
            }

            case 'task_execution': {
                const isAllowed = taskExecutionEnabled;
                return {
                    allowed: isAllowed,
                    remaining: isAllowed ? 'unlimited' as const : 0,
                    reason: isAllowed ? '' : FREE_TIER_MESSAGES.task_execution,
                };
            }

            case 'coherence_scan': {
                const limit = coherenceScanLimit === 'unlimited' ? Infinity : coherenceScanLimit;
                const isAllowed = limit > 0 && coherenceScanUsage < limit;
                const rem: number | 'unlimited' = coherenceScanLimit === 'unlimited' ? 'unlimited' : Math.max(0, limit - coherenceScanUsage);
                
                if (!limits.taskExecutionEnabled) {
                    return {
                        allowed: false,
                        remaining: 0,
                        reason: FREE_TIER_MESSAGES.coherence_scan,
                    };
                }
                
                return {
                    allowed: isAllowed,
                    remaining: rem,
                    reason: isAllowed ? '' : GATE_REASONS.coherence_scan.limit,
                };
            }

            case 'collaboration': {
                const isAllowed = limits.collaborationEnabled;
                return {
                    allowed: isAllowed,
                    remaining: isAllowed ? 'unlimited' as const : 0,
                    reason: isAllowed ? '' : FREE_TIER_MESSAGES.collaboration,
                };
            }

            default:
                return { allowed: false, remaining: 0, reason: 'Unknown feature' };
        }
    }, [feature, tier, projectCount, projectLimit, coherenceScanUsage, coherenceScanLimit, taskExecutionEnabled]);

    // Show upgrade modal and track analytics
    const showUpgrade = useCallback(() => {
        setUpgradeModalOpen(true);
        analytics.track('upgrade_modal_shown', { feature, tier });
    }, [feature, tier]);

    // Close upgrade modal with optional tracking
    const closeUpgradeModal = useCallback(() => {
        setUpgradeModalOpen(false);
        analytics.track('feature_gate_shown', { feature, tier, action: 'dismissed' });
    }, [feature, tier]);

    return {
        allowed,
        remaining,
        tier,
        reason,
        showUpgrade,
        upgradeModalOpen,
        closeUpgradeModal,
        featureName: FEATURE_NAMES[feature],
    };
}

// ============================================================
// Tooltip Helper
// ============================================================

export function getFeatureTooltip(feature: GatedFeature, tier: UserTier): string {
    if (tier === 'free') {
        return FREE_TIER_MESSAGES[feature];
    }
    
    return GATE_REASONS[feature].limit;
}
