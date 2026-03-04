/**
 * USER TIER STORE
 * Zustand store for managing user tier state and feature limits
 * src/lib/stores/user-tier.ts
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================
// Types
// ============================================================

export type UserTier = 'free' | 'pro' | 'team';

export interface TierLimits {
    projects: number;
    coherenceScanPerMonth: number;
    taskExecutionEnabled: boolean;
    collaborationEnabled: boolean;
}

export interface UserTierState {
    // State
    tier: UserTier;
    projectCount: number;
    projectLimit: number | 'unlimited';
    coherenceScanUsage: number;
    coherenceScanLimit: number | 'unlimited';
    taskExecutionEnabled: boolean;
    isLoaded: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    loadUserTier: (accessToken: string) => Promise<void>;
    incrementProjectCount: () => void;
    incrementScanUsage: () => void;
    reset: () => void;
}

// ============================================================
// Feature Limits by Tier
// ============================================================

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
    free: {
        projects: 1,
        coherenceScanPerMonth: 0,
        taskExecutionEnabled: false,
        collaborationEnabled: false,
    },
    pro: {
        projects: 10,
        coherenceScanPerMonth: 5,
        taskExecutionEnabled: true,
        collaborationEnabled: false,
    },
    team: {
        projects: Infinity,
        coherenceScanPerMonth: Infinity,
        taskExecutionEnabled: true,
        collaborationEnabled: true,
    },
};

// ============================================================
// Store Implementation
// ============================================================

const initialState = {
    tier: 'free' as UserTier,
    projectCount: 0,
    projectLimit: 1 as number | 'unlimited',
    coherenceScanUsage: 0,
    coherenceScanLimit: 0 as number | 'unlimited',
    taskExecutionEnabled: false,
    isLoaded: false,
    isLoading: false,
    error: null as string | null,
};

export const useUserTierStore = create<UserTierState>()(
    persist(
        (set, get) => ({
            ...initialState,

            loadUserTier: async (accessToken: string) => {
                // Prevent duplicate loading
                if (get().isLoading) return;
                
                set({ isLoading: true, error: null });

                try {
                    const response = await fetch('/.netlify/functions/user-tier', {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    const contentType = response.headers.get('content-type') || '';
                    const isJson = contentType.includes('application/json');

                    if (!response.ok) {
                        if (isJson) {
                            const errorData = await response.json().catch(() => null);
                            throw new Error(errorData?.error || 'Failed to fetch user tier');
                        }

                        const errorText = await response.text().catch(() => '');
                        throw new Error(errorText || 'Failed to fetch user tier');
                    }

                    if (!isJson) {
                        throw new Error('Invalid user tier response');
                    }

                    const data = await response.json();

                    set({
                        tier: data.tier || 'free',
                        projectCount: data.projectCount || 0,
                        projectLimit: data.projectLimit || 1,
                        coherenceScanUsage: data.coherenceScanUsage || 0,
                        coherenceScanLimit: data.coherenceScanLimit || 0,
                        taskExecutionEnabled: data.taskExecutionEnabled || false,
                        isLoaded: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (err) {
                    console.error('Error loading user tier:', err);
                    set({
                        isLoading: false,
                        isLoaded: true, // Mark as loaded to prevent infinite retries
                        error: err instanceof Error ? err.message : 'Unknown error',
                    });
                }
            },

            incrementProjectCount: () => {
                set((state) => ({
                    projectCount: state.projectCount + 1,
                }));
            },

            incrementScanUsage: () => {
                set((state) => ({
                    coherenceScanUsage: state.coherenceScanUsage + 1,
                }));
            },

            reset: () => {
                set(initialState);
            },
        }),
        {
            name: 'codra-user-tier',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                tier: state.tier,
                projectCount: state.projectCount,
                projectLimit: state.projectLimit,
                coherenceScanUsage: state.coherenceScanUsage,
                coherenceScanLimit: state.coherenceScanLimit,
                taskExecutionEnabled: state.taskExecutionEnabled,
                isLoaded: state.isLoaded,
            }),
        }
    )
);

// ============================================================
// Selectors
// ============================================================

export const selectCanCreateProject = (state: UserTierState): boolean => {
    if (state.projectLimit === 'unlimited') return true;
    return state.projectCount < state.projectLimit;
};

export const selectCanRunCoherenceScan = (state: UserTierState): boolean => {
    if (state.coherenceScanLimit === 'unlimited') return true;
    return state.coherenceScanUsage < state.coherenceScanLimit;
};

export const selectCanExecuteTasks = (state: UserTierState): boolean => {
    return state.taskExecutionEnabled;
};

export const selectProjectsRemaining = (state: UserTierState): number | 'unlimited' => {
    if (state.projectLimit === 'unlimited') return 'unlimited';
    return Math.max(0, state.projectLimit - state.projectCount);
};

export const selectScansRemaining = (state: UserTierState): number | 'unlimited' => {
    if (state.coherenceScanLimit === 'unlimited') return 'unlimited';
    return Math.max(0, state.coherenceScanLimit - state.coherenceScanUsage);
};
