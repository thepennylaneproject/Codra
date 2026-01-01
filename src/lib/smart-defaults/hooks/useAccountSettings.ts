/**
 * USE ACCOUNT SETTINGS HOOK
 * Manages account-level (global) settings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccountSettings } from '../../../domain/smart-defaults-types';
import { SMART_DEFAULTS } from '../../../domain/smart-defaults-types';

interface AccountSettingsState {
    settings: AccountSettings;
    updateAISettings: (updates: Partial<AccountSettings['ai']>) => void;
    updateBudgetSettings: (updates: Partial<AccountSettings['budget']>) => void;
    updateVisualSettings: (updates: Partial<AccountSettings['visual']>) => void;
    updatePreferences: (updates: Partial<AccountSettings['preferences']>) => void;
    resetToDefaults: () => void;
}

export const useAccountSettings = create<AccountSettingsState>()(
    persist(
        (set) => ({
            settings: SMART_DEFAULTS,

            updateAISettings: (updates) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        ai: { ...state.settings.ai, ...updates },
                    },
                })),

            updateBudgetSettings: (updates) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        budget: { ...state.settings.budget, ...updates },
                    },
                })),

            updateVisualSettings: (updates) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        visual: { ...state.settings.visual, ...updates },
                    },
                })),

            updatePreferences: (updates) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        preferences: { ...state.settings.preferences, ...updates },
                    },
                })),

            resetToDefaults: () =>
                set({
                    settings: SMART_DEFAULTS,
                }),
        }),
        {
            name: 'codra-account-settings',
        }
    )
);
