/**
 * useOnboardingState Hook
 * React hook to access and manage onboarding state
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import {
    onboardingStore,
    OnboardingState,
    OnboardingStep
} from '../../../lib/onboarding/onboarding-store';

export function useOnboardingState() {
    const { user } = useAuth();
    const [state, setState] = useState<OnboardingState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refreshState = useCallback(async () => {
        if (!user?.id) {
            if (!user) setIsLoading(false); // Only stop loading if checked
            return;
        }

        try {
            const currentState = await onboardingStore.getState(user.id);
            setState(currentState);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load onboarding state'));
            console.error('Error loading onboarding state:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshState();
    }, [refreshState]);

    const completeStep = async (step: OnboardingStep, data?: Partial<OnboardingState>) => {
        if (!user?.id) return;

        try {
            if (data) {
                await onboardingStore.saveState(user.id, data);
            }
            const newState = await onboardingStore.completeStep(user.id, step);
            setState(newState);
            return newState;
        } catch (err) {
            console.error('Error completing step:', err);
            throw err;
        }
    };

    const skipStep = async (step: OnboardingStep) => {
        if (!user?.id) return;

        try {
            const newState = await onboardingStore.skipStep(user.id, step);
            setState(newState);
            return newState;
        } catch (err) {
            console.error('Error skipping step:', err);
            throw err;
        }
    };

    const resetOnboarding = async () => {
        if (!user?.id) return;
        try {
            await onboardingStore.reset(user.id);
            await refreshState();
        } catch (err) {
            console.error('Error resetting onboarding:', err);
            throw err;
        }
    };

    return {
        state,
        isLoading,
        error,
        completeStep,
        skipStep,
        resetOnboarding,
        refreshState
    };
}
