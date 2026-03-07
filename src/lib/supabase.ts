/**
 * Supabase Client Configuration
 * Initializes the Supabase client for authentication and database access
 * This file is used throughout the application for all Supabase operations
 */

import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as unknown as {
  env?: {
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
  };
}).env;

const supabaseUrl = metaEnv?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = metaEnv?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local'
  );
}

/**
 * Supabase client instance
 * Use this singleton for all database and auth operations
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

/**
 * Get the current authenticated user.
 * Returns { user, error } so callers can distinguish "not logged in" from
 * a real auth/network failure. Previously both cases silently returned null.
 */
export async function getCurrentUser(): Promise<{
  user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] | null;
  error: Error | null;
}> {
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return { user: null, error };
    }
    return { user, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Unexpected error getting current user:', err);
    return { user: null, error: err };
  }
}


/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Reset password for email
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(updates: Record<string, any>) {
  try {
    const { user } = await getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Get user profile
 */
export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: any) => void) {
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const user = session?.user || null;
    callback(user);
  });

  return subscription;
}

/**
 * Export the supabase client for direct use if needed
 */
export default supabase;
