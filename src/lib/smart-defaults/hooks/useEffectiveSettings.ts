/**
 * USE EFFECTIVE SETTINGS HOOK
 * Merges account settings with project overrides and optional task overrides
 * Priority: task > project > account > tier
 */

import { useMemo } from 'react';
import { useAccountSettings } from './useAccountSettings';
import { useProjectSettings } from './useProjectSettings';
import { useUserTier } from './useUserTier';
import type { EffectiveSettings, TaskOverrideSettings } from '../../../domain/smart-defaults-types';
import { getEffectiveSettings } from '../../settings/EffectiveSettings';

/**
 * Get effective settings for a project with optional task overrides
 * Merges tier defaults → account → project → task in priority order
 * 
 * @param projectId - Optional project ID for project-level overrides
 * @param taskOverrides - Optional task-specific overrides
 */
export function useEffectiveSettings(
    projectId?: string,
    taskOverrides?: TaskOverrideSettings
): EffectiveSettings {
    const { settings: accountSettings } = useAccountSettings();
    const { getProjectSettings } = useProjectSettings();
    const tier = useUserTier(); // Automatically get user's tier from profile

    return useMemo(() => {
        const projectOverrides = projectId ? getProjectSettings(projectId) : undefined;
        
        return getEffectiveSettings(
            tier,
            accountSettings,
            projectOverrides,
            taskOverrides
        );
    }, [tier, accountSettings, projectId, getProjectSettings, taskOverrides]);
}
