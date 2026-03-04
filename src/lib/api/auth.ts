// ============================================================
// CODRA AUTH ADAPTER
// src/lib/api/auth.ts
// Following the adapter pattern - unified interface for auth operations
// ============================================================

import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import type {
  UserProfile,
  SignupData,
  LoginData,
  ProfileUpdateData,
  AuthResponse,
  SessionResponse,
  AuthStateChangeCallback,
  OAuthOptions,
  AuthenticationError,
} from './auth.types';
import { AUTH_ERROR_CODES } from './auth.types';

// Use the consolidated singleton from src/lib/supabase.ts
export { supabase };

// ============================================================
// Helper Functions
// ============================================================

/**
 * Transform database row to UserProfile
 */
function transformProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    email: row.email as string,
    fullName: row.full_name as string | null,
    displayName: row.display_name as string | null,
    avatarUrl: row.avatar_url as string | null,
    company: row.company as string | null,
    jobTitle: row.job_title as string | null,
    timezone: (row.timezone as string) || 'UTC',
    preferences: row.preferences as UserProfile['preferences'],
    plan: row.plan as UserProfile['plan'],
    planStartedAt: row.plan_started_at ? new Date(row.plan_started_at as string) : null,
    planExpiresAt: row.plan_expires_at ? new Date(row.plan_expires_at as string) : null,
    onboardingCompleted: row.onboarding_completed as boolean,
    lastActiveAt: new Date(row.last_active_at as string),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Transform profile payload from the user-profile Netlify function.
 */
function transformRemoteProfile(payload: Record<string, unknown>): UserProfile {
  return {
    id: payload.id as string,
    email: payload.email as string,
    fullName: (payload.fullName as string) ?? null,
    displayName: (payload.displayName as string) ?? null,
    avatarUrl: (payload.avatarUrl as string) ?? null,
    company: (payload.company as string) ?? null,
    jobTitle: (payload.jobTitle as string) ?? null,
    timezone: (payload.timezone as string) || 'UTC',
    preferences: payload.preferences as UserProfile['preferences'],
    plan: payload.plan as UserProfile['plan'],
    planStartedAt: payload.planStartedAt ? new Date(payload.planStartedAt as string) : null,
    planExpiresAt: payload.planExpiresAt ? new Date(payload.planExpiresAt as string) : null,
    onboardingCompleted: Boolean(payload.onboardingCompleted),
    lastActiveAt: new Date(payload.lastActiveAt as string),
    createdAt: new Date(payload.createdAt as string),
    updatedAt: new Date(payload.updatedAt as string),
  };
}

/**
 * Map Supabase auth errors to our error codes
 */
function mapAuthError(error: unknown): AuthenticationError {
  if (!error) {
    return new (class extends Error {
      code = AUTH_ERROR_CODES.UNKNOWN;
    })('Unknown error occurred') as AuthenticationError;
  }

  const err = error as { message?: string; status?: number; code?: string };
  const message = err.message || 'Authentication failed';
  const status = err.status;

  // Map common error messages to codes
  if (message.includes('Invalid login credentials')) {
    return { name: 'AuthError', message, code: AUTH_ERROR_CODES.INVALID_CREDENTIALS, status } as AuthenticationError;
  }
  if (message.includes('Email not confirmed')) {
    return { name: 'AuthError', message, code: AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED, status } as AuthenticationError;
  }
  if (message.includes('User already registered') || message.includes('already been registered')) {
    return { name: 'AuthError', message, code: AUTH_ERROR_CODES.EMAIL_TAKEN, status } as AuthenticationError;
  }
  if (message.includes('Password should be')) {
    return { name: 'AuthError', message, code: AUTH_ERROR_CODES.PASSWORD_TOO_WEAK, status } as AuthenticationError;
  }
  if (status === 429 || message.includes('rate limit')) {
    return { name: 'AuthError', message, code: AUTH_ERROR_CODES.RATE_LIMITED, status } as AuthenticationError;
  }
  if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
    return { name: 'AuthError', message: 'Network error. Please check your connection.', code: AUTH_ERROR_CODES.NETWORK_ERROR } as AuthenticationError;
  }

  return { name: 'AuthError', message, code: err.code || AUTH_ERROR_CODES.UNKNOWN, status } as AuthenticationError;
}

// ============================================================
// AUTH ADAPTER - Main Export
// ============================================================

export const authAdapter = {
  // ----------------------------------------------------------
  // SIGNUP
  // ----------------------------------------------------------
  async signup(data: SignupData): Promise<AuthResponse<UserProfile>> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.metadata?.fullName,
            company: data.metadata?.company,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        return { data: null, error: mapAuthError(authError) };
      }

      if (!authData.user) {
        return {
          data: null,
          error: { name: 'AuthError', message: 'Signup failed', code: AUTH_ERROR_CODES.UNKNOWN } as AuthenticationError
        };
      }

      // Profile is auto-created via database trigger, fetch it
      const profile = await this.getProfile(authData.user.id);
      return profile;
    } catch (err) {
      return { data: null, error: mapAuthError(err) };
    }
  },

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------
  async login(data: LoginData): Promise<AuthResponse<UserProfile>> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { data: null, error: mapAuthError(authError) };
      }

      if (!authData.user) {
        return {
          data: null,
          error: { name: 'AuthError', message: 'Login failed', code: AUTH_ERROR_CODES.UNKNOWN } as AuthenticationError
        };
      }

      // Update last active
      await supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', authData.user.id);

      const profile = await this.getProfile(authData.user.id);
      return profile;
    } catch (err) {
      return { data: null, error: mapAuthError(err) };
    }
  },

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------
  async logout(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: mapAuthError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  },

  // ----------------------------------------------------------
  // OAUTH LOGIN
  // ----------------------------------------------------------
  async loginWithOAuth(options: OAuthOptions): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: options.provider,
        options: {
          redirectTo: options.redirectTo || `${window.location.origin}/auth/callback`,
          scopes: options.scopes,
        },
      });

      if (error) {
        return { error: mapAuthError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  },

  // ----------------------------------------------------------
  // PASSWORD RESET
  // ----------------------------------------------------------
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error: mapAuthError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  },

  // ----------------------------------------------------------
  // UPDATE PASSWORD
  // ----------------------------------------------------------
  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: mapAuthError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  },

  // ----------------------------------------------------------
  // GET CURRENT USER (Supabase auth user)
  // ----------------------------------------------------------
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch {
      return null;
    }
  },

  // ----------------------------------------------------------
  // GET CURRENT SESSION
  // ----------------------------------------------------------
  async getSession(): Promise<SessionResponse> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        return { session: null, user: null };
      }
      return { session, user: session?.user ?? null };
    } catch {
      return { session: null, user: null };
    }
  },

  // ----------------------------------------------------------
  // GET USER PROFILE
  // ----------------------------------------------------------
  async getProfile(userId?: string): Promise<AuthResponse<UserProfile>> {
    try {
      let targetUserId = userId;

      if (!targetUserId) {
        const user = await this.getCurrentUser();
        if (!user) {
          return {
            data: null,
            error: { name: 'AuthError', message: 'Not authenticated', code: AUTH_ERROR_CODES.SESSION_EXPIRED } as AuthenticationError
          };
        }
        targetUserId = user.id;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (!error) {
        return { data: transformProfile(data), error: null };
      }

      // Fallback to service-role Netlify function when client query fails
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { data: null, error: mapAuthError(error) };
      }

      const response = await fetch('/.netlify/functions/user-profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { data: null, error: mapAuthError(error) };
      }

      const body = await response.json().catch(() => null);
      if (!body?.data) {
        return { data: null, error: mapAuthError(error) };
      }

      return { data: transformRemoteProfile(body.data), error: null };
    } catch (err) {
      return { data: null, error: mapAuthError(err) };
    }
  },

  // ----------------------------------------------------------
  // UPDATE PROFILE
  // ----------------------------------------------------------
  async updateProfile(data: ProfileUpdateData): Promise<AuthResponse<UserProfile>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return {
          data: null,
          error: { name: 'AuthError', message: 'Not authenticated', code: AUTH_ERROR_CODES.SESSION_EXPIRED } as AuthenticationError
        };
      }

      // Transform camelCase to snake_case for database
      const updateData: Record<string, unknown> = {};
      if (data.fullName !== undefined) updateData.full_name = data.fullName;
      if (data.displayName !== undefined) updateData.display_name = data.displayName;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
      if (data.company !== undefined) updateData.company = data.company;
      if (data.jobTitle !== undefined) updateData.job_title = data.jobTitle;
      if (data.timezone !== undefined) updateData.timezone = data.timezone;
      if (data.preferences !== undefined) {
        // Merge with existing preferences
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        updateData.preferences = {
          ...(currentProfile?.preferences || {}),
          ...data.preferences,
        };
      }

      const { data: updated, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { data: null, error: mapAuthError(error) };
      }

      return { data: transformProfile(updated), error: null };
    } catch (err) {
      return { data: null, error: mapAuthError(err) };
    }
  },

  // ----------------------------------------------------------
  // COMPLETE ONBOARDING
  // ----------------------------------------------------------
  async completeOnboarding(): Promise<{ error: Error | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { error: { name: 'AuthError', message: 'Not authenticated', code: AUTH_ERROR_CODES.SESSION_EXPIRED } as AuthenticationError };
      }

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (error) {
        return { error: mapAuthError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  },

  // ----------------------------------------------------------
  // AUTH STATE CHANGE LISTENER
  // ----------------------------------------------------------
  onAuthStateChange(callback: AuthStateChangeCallback): { unsubscribe: () => void } {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        // Map Supabase events to our event types
        const mappedEvent = event as unknown as Parameters<AuthStateChangeCallback>[0];
        callback(mappedEvent, session);
      }
    );

    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  },

  // ----------------------------------------------------------
  // REFRESH SESSION
  // ----------------------------------------------------------
  async refreshSession(): Promise<SessionResponse> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        return { session: null, user: null };
      }
      return { session, user: session?.user ?? null };
    } catch {
      return { session: null, user: null };
    }
  },

  // ----------------------------------------------------------
  // VERIFY EMAIL (for magic link or confirmation)
  // ----------------------------------------------------------
  async verifyOtp(token: string, type: 'signup' | 'recovery' | 'email_change'): Promise<AuthResponse<UserProfile>> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type === 'signup' ? 'signup' : type === 'recovery' ? 'recovery' : 'email_change',
      });

      if (error) {
        return { data: null, error: mapAuthError(error) };
      }

      if (data.user) {
        return await this.getProfile(data.user.id);
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: mapAuthError(err) };
    }
  },

  // ----------------------------------------------------------
  // UPDATE EMAIL
  // ----------------------------------------------------------
  async updateEmail(newEmail: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        return { error: mapAuthError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  },

  // ----------------------------------------------------------
  // DELETE ACCOUNT
  // ----------------------------------------------------------
  async deleteAccount(): Promise<{ error: Error | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { error: { name: 'AuthError', message: 'Not authenticated', code: AUTH_ERROR_CODES.SESSION_EXPIRED } as AuthenticationError };
      }

      // This requires a Netlify function with service role key
      const response = await fetch('/.netlify/functions/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return { error: new Error(data.error || 'Failed to delete account') };
      }

      await this.logout();
      return { error: null };
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  },
};

// Export individual functions for convenience
export const {
  signup,
  login,
  logout,
  loginWithOAuth,
  resetPassword,
  updatePassword,
  getCurrentUser,
  getSession,
  getProfile,
  updateProfile,
  completeOnboarding,
  onAuthStateChange,
  refreshSession,
  verifyOtp,
  updateEmail,
  deleteAccount,
} = authAdapter;

// Default export
export default authAdapter;
