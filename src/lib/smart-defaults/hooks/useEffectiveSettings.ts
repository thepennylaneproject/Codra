/**
 * USE EFFECTIVE SETTINGS HOOK
 * Merges account settings with project overrides
 */

import { useMemo } from 'react';
import { useAccountSettings } from './useAccountSettings';
import { useProjectSettings } from './useProjectSettings';
import type { EffectiveSettings } from '../../../domain/smart-defaults-types';

/**
 * Get effective settings for a project
 * Merges account defaults with project-specific overrides
 */
export function useEffectiveSettings(projectId?: string): EffectiveSettings {
    const { settings: accountSettings } = useAccountSettings();
    const { getProjectSettings, hasOverrides, getOverrideCount } = useProjectSettings();

    return useMemo(() => {
        if (!projectId) {
            return {
                ...accountSettings,
                hasOverrides: false,
                overrideCount: 0,
            };
        }

        const projectOverrides = getProjectSettings(projectId);

        if (!projectOverrides) {
            return {
                ...accountSettings,
                hasOverrides: false,
                overrideCount: 0,
            };
        }

        // Merge account settings with project overrides
        return {
            ai: {
                ...accountSettings.ai,
                ...(projectOverrides.qualityPriority && { qualityPriority: projectOverrides.qualityPriority }),
                ...(projectOverrides.autonomyLevel && { autonomyLevel: projectOverrides.autonomyLevel }),
                ...(projectOverrides.dataSensitivity && { dataSensitivity: projectOverrides.dataSensitivity }),
                ...(projectOverrides.maxSteps !== undefined && { maxSteps: projectOverrides.maxSteps }),
                ...(projectOverrides.riskTolerance !== undefined && { riskTolerance: projectOverrides.riskTolerance }),
            },
            budget: {
                ...accountSettings.budget,
                ...(projectOverrides.dailyBudget !== undefined && { dailyLimit: projectOverrides.dailyBudget }),
            },
            visual: accountSettings.visual,
            preferences: accountSettings.preferences,
            hasOverrides: hasOverrides(projectId),
            overrideCount: getOverrideCount(projectId),
        };
    }, [accountSettings, projectId, getProjectSettings, hasOverrides, getOverrideCount]);
}
