/**
 * USE USER PREFERENCES HOOK
 * src/hooks/useUserPreferences.ts
 *
 * Hook for reading and updating user preferences from the profile API.
 * Provides taskTimeoutMinutes and other preference settings.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserPreferences } from '@/lib/api/auth.types';

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  defaultEnvironment: 'development',
  notifications: {
    email: true,
    quotaAlerts: true,
    weeklyDigest: false,
  },
  editor: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
  },
  taskTimeoutMinutes: 30, // Default 30 minutes
};

interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useUserPreferences(): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences from profile
  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPreferences(DEFAULT_PREFERENCES);
        return;
      }

      const response = await fetch('/.netlify/functions/user-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const { data } = await response.json();
      
      // Merge with defaults to ensure all fields exist
      const mergedPreferences: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        ...(data?.preferences || {}),
        notifications: {
          ...DEFAULT_PREFERENCES.notifications,
          ...(data?.preferences?.notifications || {}),
        },
        editor: {
          ...DEFAULT_PREFERENCES.editor,
          ...(data?.preferences?.editor || {}),
        },
      };

      setPreferences(mergedPreferences);
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a single preference
  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Optimistic update
      setPreferences(prev => ({ ...prev, [key]: value }));

      const response = await fetch('/.netlify/functions/user-profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: { [key]: value },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preference');
      }
    } catch (err) {
      console.error('Failed to update preference:', err);
      // Revert optimistic update on error
      await fetchPreferences();
      throw err;
    }
  }, [fetchPreferences]);

  // Initial fetch
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreference,
    refetch: fetchPreferences,
  };
}
