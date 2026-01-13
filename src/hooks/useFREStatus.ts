/**
 * useFREStatus Hook
 * Determines whether to show First-Run Experience based on user profile
 */

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';

export interface FREStatus {
  /** Whether FRE should be shown to the user */
  shouldShowFRE: boolean;
  /** Whether the auth state is still loading */
  isLoading: boolean;
  /** Whether the user has completed onboarding */
  hasCompletedOnboarding: boolean;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
}

/**
 * Hook to check if First-Run Experience should be shown
 * 
 * @returns FREStatus object with loading state and FRE visibility
 * 
 * @example
 * ```tsx
 * const { shouldShowFRE, isLoading } = useFREStatus();
 * 
 * if (isLoading) return <Spinner />;
 * if (shouldShowFRE) return <FirstRunExperience onComplete={handleComplete} />;
 * ```
 */
export function useFREStatus(): FREStatus {
  const { profile, isLoading, isAuthenticated } = useAuth();

  return useMemo(() => {
    // Still loading auth state
    if (isLoading) {
      return {
        shouldShowFRE: false,
        isLoading: true,
        hasCompletedOnboarding: false,
        isAuthenticated: false,
      };
    }

    // Not authenticated - no FRE
    if (!isAuthenticated || !profile) {
      return {
        shouldShowFRE: false,
        isLoading: false,
        hasCompletedOnboarding: false,
        isAuthenticated: false,
      };
    }

    // Check if onboarding is completed
    const hasCompletedOnboarding = profile.onboardingCompleted === true;

    return {
      shouldShowFRE: !hasCompletedOnboarding,
      isLoading: false,
      hasCompletedOnboarding,
      isAuthenticated: true,
    };
  }, [profile, isLoading, isAuthenticated]);
}

export default useFREStatus;
