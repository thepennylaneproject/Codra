/**
 * ONBOARDING STORE
 * Tracks user's onboarding progress and preferences
 * Persists to Supabase user profile
 */

import { supabase } from '../supabase';

export type OnboardingStep =
    | 'welcome'
    | 'profile'
    | 'credentials'
    | 'first_project'
    | 'success'
    | 'completed';

export type UserRole =
    | 'developer'
    | 'designer'
    | 'marketer'
    | 'founder'
    | 'student'
    | 'other';

export type PrimaryUseCase =
    | 'content_generation'
    | 'code_assistance'
    | 'design_automation'
    | 'workflow_orchestration'
    | 'exploration';

export interface OnboardingState {
    currentStep: OnboardingStep;
    completedSteps: OnboardingStep[];
    skippedSteps: OnboardingStep[];
    profile: {
        displayName?: string;
        role?: UserRole;
        useCase?: PrimaryUseCase;
        company?: string;
    };
    preferences: {
        useDemoMode: boolean;
        hasOwnCredentials: boolean;
        wantsTour: boolean;
        emailUpdates: boolean;
    };
    firstProjectId?: string;
    startedAt: string;
    completedAt?: string;
}

const DEFAULT_STATE: OnboardingState = {
    currentStep: 'welcome',
    completedSteps: [],
    skippedSteps: [],
    profile: {},
    preferences: {
        useDemoMode: false,
        hasOwnCredentials: false,
        wantsTour: true,
        emailUpdates: true,
    },
    startedAt: new Date().toISOString(),
};

export const onboardingStore = {
    /**
     * Get current onboarding state for user
     */
    async getState(userId: string): Promise<OnboardingState> {
        // NOTE: In the initial schema the table is named 'profiles' not 'user_profiles'
        const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_state')
            .eq('id', userId) // Join column is usually 'id' (primary key) on profiles table, not user_id if it's 1:1 with auth
            .single();

        if (error || !data?.onboarding_state) {
            return DEFAULT_STATE;
        }

        // Merge with default state to handle partial or empty stored state (e.g. from new column default)
        const storedState = data.onboarding_state as Partial<OnboardingState>;
        return {
            ...DEFAULT_STATE,
            ...storedState,
            // deep merge preferences if needed, but shallow for now is safer than undefined
            preferences: {
                ...DEFAULT_STATE.preferences,
                ...(storedState.preferences || {})
            }
        };
    },

    /**
     * Save onboarding state
     */
    async saveState(userId: string, state: Partial<OnboardingState>): Promise<boolean> {
        const current = await this.getState(userId);
        const updated = { ...current, ...state };

        const { error } = await supabase
            .from('profiles')
            .update({ onboarding_state: updated })
            .eq('id', userId);

        return !error;
    },

    /**
     * Mark a step as completed
     */
    async completeStep(userId: string, step: OnboardingStep): Promise<OnboardingState> {
        const current = await this.getState(userId);

        if (!current.completedSteps.includes(step)) {
            current.completedSteps.push(step);
        }

        // Determine next step
        const stepOrder: OnboardingStep[] = ['welcome', 'profile', 'credentials', 'first_project', 'success', 'completed'];
        const currentIndex = stepOrder.indexOf(step);
        const nextStep = stepOrder[currentIndex + 1] || 'completed';

        current.currentStep = nextStep;

        if (nextStep === 'completed') {
            current.completedAt = new Date().toISOString();
        }

        await this.saveState(userId, current);
        return current;
    },

    /**
     * Skip a step (still moves forward)
     */
    async skipStep(userId: string, step: OnboardingStep): Promise<OnboardingState> {
        const current = await this.getState(userId);

        if (!current.skippedSteps.includes(step)) {
            current.skippedSteps.push(step);
        }

        // Move to next step
        const stepOrder: OnboardingStep[] = ['welcome', 'profile', 'credentials', 'first_project', 'success', 'completed'];
        const currentIndex = stepOrder.indexOf(step);
        current.currentStep = stepOrder[currentIndex + 1] || 'completed';

        await this.saveState(userId, current);
        return current;
    },

    /**
     * Check if user has completed onboarding
     */
    async isComplete(userId: string): Promise<boolean> {
        const state = await this.getState(userId);
        return state.currentStep === 'completed' || !!state.completedAt;
    },

    /**
     * Reset onboarding (for testing or re-onboarding)
     */
    async reset(userId: string): Promise<boolean> {
        return this.saveState(userId, DEFAULT_STATE);
    },
};

/**
 * Step configuration for UI
 */
export const STEP_CONFIG: Record<OnboardingStep, {
    title: string;
    description: string;
    emoji: string;
    estimatedTime: string;
    skippable: boolean;
}> = {
    welcome: {
        title: 'Codra system overview',
        description: 'Select configuration path',
        emoji: '👋',
        estimatedTime: '30 sec',
        skippable: false,
    },
    profile: {
        title: 'Profile details',
        description: 'Define operator context',
        emoji: '👤',
        estimatedTime: '1 min',
        skippable: true,
    },
    credentials: {
        title: 'Model credentials',
        description: 'Add API keys or use demo mode',
        emoji: '🔑',
        estimatedTime: '2 min',
        skippable: true,
    },
    first_project: {
        title: 'Create project',
        description: 'Initialize project configuration',
        emoji: '🚀',
        estimatedTime: '2 min',
        skippable: true,
    },
    success: {
        title: 'Configuration complete',
        description: 'System configuration completed',
        emoji: '🎉',
        estimatedTime: '30 sec',
        skippable: false,
    },
    completed: {
        title: 'Completed',
        description: 'Onboarding finished',
        emoji: '✅',
        estimatedTime: '',
        skippable: false,
    },
};
