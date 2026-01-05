import { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import { FeatureFlag } from '../lib/feature-flags';

/**
 * HOOK: useFeatureFlag
 * Checks if a specific feature flag is enabled in PostHog.
 * 
 * @param flagKey - The key of the feature flag to check.
 * @param defaultValue - Fallback value if flag is not yet loaded or missing (default: false).
 * @returns boolean - Whether the feature is enabled.
 */
export function useFeatureFlag(flagKey: FeatureFlag, defaultValue = false): boolean {
  const [enabled, setEnabled] = useState<boolean>(
    posthog.isFeatureEnabled(flagKey) ?? defaultValue
  );

  useEffect(() => {
    // Listen for feature flags being loaded/updated
    const callback = () => {
      const isEnabled = posthog.isFeatureEnabled(flagKey);
      setEnabled(isEnabled ?? defaultValue);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FeatureFlag] ${flagKey}: ${isEnabled}`);
      }
    };

    posthog.onFeatureFlags(callback);

    // Initial check in case they are already loaded
    callback();

    return () => {
      // posthog-js doesn't provide an 'off' method for onFeatureFlags, 
      // but it's generally safe as it's a simple event listener.
    };
  }, [flagKey, defaultValue]);

  return enabled;
}
