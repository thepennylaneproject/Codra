/**
 * USE PROJECT SETTINGS HOOK
 * Manages project-level setting overrides
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectSettings } from '../../../domain/smart-defaults-types';

interface ProjectSettingsState {
    // Map of projectId -> ProjectSettings
    projectSettings: Record<string, ProjectSettings>;

    getProjectSettings: (projectId: string) => ProjectSettings | undefined;
    updateProjectSettings: (projectId: string, updates: Partial<ProjectSettings>) => void;
    clearProjectSettings: (projectId: string) => void;
    hasOverrides: (projectId: string) => boolean;
    getOverrideCount: (projectId: string) => number;
}

export const useProjectSettings = create<ProjectSettingsState>()(
    persist(
        (set, get) => ({
            projectSettings: {},

            getProjectSettings: (projectId) => {
                return get().projectSettings[projectId];
            },

            updateProjectSettings: (projectId, updates) => {
                set((state) => ({
                    projectSettings: {
                        ...state.projectSettings,
                        [projectId]: {
                            ...state.projectSettings[projectId],
                            ...updates,
                        },
                    },
                }));
            },

            clearProjectSettings: (projectId) => {
                set((state) => {
                    const { [projectId]: _, ...rest } = state.projectSettings;
                    return { projectSettings: rest };
                });
            },

            hasOverrides: (projectId) => {
                const settings = get().projectSettings[projectId];
                return settings !== undefined && Object.keys(settings).length > 0;
            },

            getOverrideCount: (projectId) => {
                const settings = get().projectSettings[projectId];
                if (!settings) return 0;
                return Object.keys(settings).filter((key) => settings[key as keyof ProjectSettings] !== undefined).length;
            },
        }),
        {
            name: 'codra-project-settings',
        }
    )
);
