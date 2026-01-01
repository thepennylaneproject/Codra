/**
 * EFFECTIVE SETTINGS
 * Merges settings from tier → account → project → task hierarchy
 */

import type {
    AccountSettings,
    ProjectSettings,
    EffectiveSettings,
    AccountTier,
    TaskOverrideSettings,
} from '../../domain/smart-defaults-types';
import { getDefaultsForTier } from './TierDefaults';

/**
 * Get effective settings by merging tier defaults → account → project → task
 * Priority: task (highest) → project → account → tier (lowest)
 */
export function getEffectiveSettings(
    tier: AccountTier,
    accountSettings: Partial<AccountSettings>,
    projectSettings?: Partial<ProjectSettings>,
    taskOverrides?: TaskOverrideSettings
): EffectiveSettings {
    const tierDefaults = getDefaultsForTier(tier);

    // Start with tier defaults
    const merged: EffectiveSettings = {
        ai: {
            qualityPriority: tierDefaults.qualityPriority,
            dataSensitivity: accountSettings.ai?.dataSensitivity || 'internal',
            autonomyLevel: accountSettings.ai?.autonomyLevel || 'apply-with-approval',
            maxSteps: tierDefaults.maxSteps,
            riskTolerance: accountSettings.ai?.riskTolerance || 3,
        },
        budget: {
            dailyLimit: tierDefaults.dailyBudget,
            strategy: accountSettings.budget?.strategy || 'smart-balance',
        },
        visual: {
            theme: accountSettings.visual?.theme || 'system',
            defaultDesk: accountSettings.visual?.defaultDesk || 'write',
            visualDirection: accountSettings.visual?.visualDirection || 'modern-professional',
        },
        preferences: {
            showModelPerStep: accountSettings.preferences?.showModelPerStep || false,
            autoSave: accountSettings.preferences?.autoSave ?? true,
        },
        hasOverrides: false,
        overrideCount: 0,
    };

    // Apply account settings (override tier defaults)
    if (accountSettings.ai?.qualityPriority) {
        merged.ai.qualityPriority = accountSettings.ai.qualityPriority;
    }
    if (accountSettings.ai?.maxSteps !== undefined) {
        merged.ai.maxSteps = accountSettings.ai.maxSteps;
    }
    if (accountSettings.budget?.dailyLimit !== undefined) {
        merged.budget.dailyLimit = accountSettings.budget.dailyLimit;
    }

    // Apply project settings (override account settings)
    let projectOverrideCount = 0;
    if (projectSettings) {
        if (projectSettings.qualityPriority) {
            merged.ai.qualityPriority = projectSettings.qualityPriority;
            projectOverrideCount++;
        }
        if (projectSettings.autonomyLevel) {
            merged.ai.autonomyLevel = projectSettings.autonomyLevel;
            projectOverrideCount++;
        }
        if (projectSettings.dataSensitivity) {
            merged.ai.dataSensitivity = projectSettings.dataSensitivity;
            projectOverrideCount++;
        }
        if (projectSettings.maxSteps !== undefined) {
            merged.ai.maxSteps = projectSettings.maxSteps;
            projectOverrideCount++;
        }
        if (projectSettings.riskTolerance !== undefined) {
            merged.ai.riskTolerance = projectSettings.riskTolerance;
            projectOverrideCount++;
        }
        if (projectSettings.dailyBudget !== undefined) {
            merged.budget.dailyLimit = projectSettings.dailyBudget;
            projectOverrideCount++;
        }
    }

    // Apply task overrides (highest priority)
    let taskOverrideCount = 0;
    if (taskOverrides) {
        if (taskOverrides.qualityPriority) {
            merged.ai.qualityPriority = taskOverrides.qualityPriority;
            taskOverrideCount++;
        }
        if (taskOverrides.maxSteps !== undefined) {
            merged.ai.maxSteps = taskOverrides.maxSteps;
            taskOverrideCount++;
        }
        // Note: modelOverride is handled separately in task execution
    }

    merged.hasOverrides = projectOverrideCount > 0 || taskOverrideCount > 0;
    merged.overrideCount = projectOverrideCount + taskOverrideCount;

    return merged;
}
