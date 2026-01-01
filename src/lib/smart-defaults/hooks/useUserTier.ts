/**
 * USE USER TIER HOOK
 * Fetches user's account tier from profile
 */

import { useMemo } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import type { AccountTier } from '../../../domain/smart-defaults-types';

/**
 * Hook to get user's account tier from their profile
 * Returns 'free' as default if profile is not loaded or plan is not set
 */
export function useUserTier(): AccountTier {
    const { profile, isLoading } = useAuth();

    return useMemo(() => {
        if (isLoading || !profile || !profile.plan) {
            return 'free'; // Default to free tier
        }

        // Profile.plan is already typed as 'free' | 'pro' | 'team' | 'enterprise'
        return profile.plan as AccountTier;
    }, [profile, isLoading]);
}
