import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    AIPreferencesData,
    BudgetPreferencesData,
    PermissionsData,
    DEFAULT_AI_PREFERENCES,
    DEFAULT_BUDGET_PREFERENCES,
    DEFAULT_PERMISSIONS,
} from '../../domain/onboarding-types';

interface SettingsState {
    // Global Defaults
    aiDefaults: AIPreferencesData;
    budgetDefaults: BudgetPreferencesData;
    permissionsDefaults: PermissionsData;

    // Editorial Defaults
    defaultTone: string;
    defaultPacing: string;

    // Actions
    updateAIDefaults: (updates: Partial<AIPreferencesData>) => void;
    updateBudgetDefaults: (updates: Partial<BudgetPreferencesData>) => void;
    updatePermissionsDefaults: (updates: Partial<PermissionsData>) => void;
    updateEditorialDefaults: (updates: { tone?: string; pacing?: string }) => void;

    resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            aiDefaults: DEFAULT_AI_PREFERENCES,
            budgetDefaults: DEFAULT_BUDGET_PREFERENCES,
            permissionsDefaults: DEFAULT_PERMISSIONS,
            defaultTone: 'neutral',
            defaultPacing: 'steady',

            updateAIDefaults: (updates) => set((state) => ({
                aiDefaults: { ...state.aiDefaults, ...updates }
            })),

            updateBudgetDefaults: (updates) => set((state) => ({
                budgetDefaults: { ...state.budgetDefaults, ...updates }
            })),

            updatePermissionsDefaults: (updates) => set((state) => ({
                permissionsDefaults: { ...state.permissionsDefaults, ...updates }
            })),

            updateEditorialDefaults: (updates) => set((state) => ({
                ...state,
                ...updates
            })),

            resetToDefaults: () => set({
                aiDefaults: DEFAULT_AI_PREFERENCES,
                budgetDefaults: DEFAULT_BUDGET_PREFERENCES,
                permissionsDefaults: DEFAULT_PERMISSIONS,
                defaultTone: 'neutral',
                defaultPacing: 'steady',
            }),
        }),
        {
            name: 'codra-global-settings',
        }
    )
);
