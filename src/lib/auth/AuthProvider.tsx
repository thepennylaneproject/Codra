// ============================================================
// CODRA AUTH PROVIDER & HOOKS
// src/lib/auth/AuthProvider.tsx
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import {
  authAdapter,

} from '../api/auth';
import type {
  UserProfile,
  AuthState,
  AuthStatus,
  SignupData,
  LoginData,
  ProfileUpdateData,
  OAuthProvider,
} from '../api/auth.types';
import { useUserTierStore } from '../stores/user-tier';

// ============================================================
// Context Types
// ============================================================

interface AuthContextValue extends AuthState {
  // Auth actions
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>;

  // Password management
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // Profile management
  updateProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // Session management
  refreshSession: () => Promise<void>;
}

// ============================================================
// Context Creation
// ============================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================
// Provider Component
// ============================================================

interface AuthProviderProps {
  children: ReactNode;
  onAuthStateChange?: (state: AuthState) => void;
}

export function AuthProvider({ children, onAuthStateChange }: AuthProviderProps) {
  // State
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Derived state
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!user;

  // ----------------------------------------------------------
  // Fetch Profile
  // ----------------------------------------------------------
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error: profileError } = await authAdapter.getProfile(userId);
    if (profileError) {
      console.error('Failed to fetch profile:', profileError);
      setProfile(null);
    } else {
      setProfile(data);
    }
  }, []);

  // ----------------------------------------------------------
  // Initialize Auth State
  // ----------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { session: initialSession, user: initialUser } = await authAdapter.getSession();

        if (!mounted) return;

        if (initialSession && initialUser) {
          setSession(initialSession);
          setUser(initialUser);
          await fetchProfile(initialUser.id);
          // Load user tier for feature gating
          if (initialSession.access_token) {
            useUserTierStore.getState().loadUserTier(initialSession.access_token);
          }
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Auth initialization error:', err);
        setError(err instanceof Error ? err : new Error('Auth initialization failed'));
        setStatus('error');
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { unsubscribe } = authAdapter.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      console.log('Auth state change:', event);

      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        setUser(newSession.user);
        await fetchProfile(newSession.user.id);
        // Load user tier for feature gating
        if (newSession.access_token) {
          useUserTierStore.getState().loadUserTier(newSession.access_token);
        }
        setStatus('authenticated');
        setError(null);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        // Reset user tier store on sign out
        useUserTierStore.getState().reset();
        setStatus('unauthenticated');
        setError(null);
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
        setUser(newSession.user);
      } else if (event === 'USER_UPDATED' && newSession) {
        setUser(newSession.user);
        await fetchProfile(newSession.user.id);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [fetchProfile]);

  // ----------------------------------------------------------
  // Notify parent of state changes
  // ----------------------------------------------------------
  useEffect(() => {
    if (onAuthStateChange) {
      onAuthStateChange({
        status,
        user,
        profile,
        session,
        error,
        isLoading,
        isAuthenticated,
      });
    }
  }, [status, user, profile, session, error, isLoading, isAuthenticated, onAuthStateChange]);

  // ----------------------------------------------------------
  // Auth Actions
  // ----------------------------------------------------------
  const signup = useCallback(async (data: SignupData) => {
    setStatus('loading');
    setError(null);

    const { data: userProfile, error: signupError } = await authAdapter.signup(data);

    if (signupError) {
      setError(signupError);
      setStatus('unauthenticated');
      return { success: false, error: signupError.message };
    }

    // User needs to confirm email, so they're not fully authenticated yet
    if (userProfile) {
      setProfile(userProfile);
    }

    return { success: true };
  }, []);

  const login = useCallback(async (data: LoginData) => {
    setStatus('loading');
    setError(null);

    const { data: userProfile, error: loginError } = await authAdapter.login(data);

    if (loginError) {
      setError(loginError);
      setStatus('unauthenticated');
      return { success: false, error: loginError.message };
    }

    if (userProfile) {
      setProfile(userProfile);
      setStatus('authenticated');
    }

    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    setStatus('loading');
    const { error: logoutError } = await authAdapter.logout();

    if (logoutError) {
      console.error('Logout error:', logoutError);
    }

    // Clear state regardless of error
    setSession(null);
    setUser(null);
    setProfile(null);
    setStatus('unauthenticated');
    setError(null);
  }, []);

  const loginWithOAuth = useCallback(async (provider: OAuthProvider) => {
    setStatus('loading');
    setError(null);

    const { error: oauthError } = await authAdapter.loginWithOAuth({ provider });

    if (oauthError) {
      setError(oauthError);
      setStatus('unauthenticated');
    }
    // If successful, user is redirected to OAuth provider
  }, []);

  // ----------------------------------------------------------
  // Password Actions
  // ----------------------------------------------------------
  const resetPassword = useCallback(async (email: string) => {
    const { error: resetError } = await authAdapter.resetPassword(email);

    if (resetError) {
      return { success: false, error: resetError.message };
    }

    return { success: true };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error: updateError } = await authAdapter.updatePassword(newPassword);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  }, []);

  // ----------------------------------------------------------
  // Profile Actions
  // ----------------------------------------------------------
  const updateProfile = useCallback(async (data: ProfileUpdateData) => {
    const { data: updatedProfile, error: updateError } = await authAdapter.updateProfile(data);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    if (updatedProfile) {
      setProfile(updatedProfile);
    }

    return { success: true };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const completeOnboarding = useCallback(async () => {
    const { error: onboardingError } = await authAdapter.completeOnboarding();

    if (!onboardingError && profile) {
      setProfile({ ...profile, onboardingCompleted: true });
    }
  }, [profile]);

  // ----------------------------------------------------------
  // Session Actions
  // ----------------------------------------------------------
  const refreshSession = useCallback(async () => {
    const { session: newSession, user: newUser } = await authAdapter.refreshSession();

    if (newSession && newUser) {
      setSession(newSession);
      setUser(newUser);
    }
  }, []);

  // ----------------------------------------------------------
  // Context Value
  // ----------------------------------------------------------
  const value = useMemo<AuthContextValue>(() => ({
    // State
    status,
    user,
    profile,
    session,
    error,
    isLoading,
    isAuthenticated,

    // Actions
    signup,
    login,
    logout,
    loginWithOAuth,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
    completeOnboarding,
    refreshSession,
  }), [
    status,
    user,
    profile,
    session,
    error,
    isLoading,
    isAuthenticated,
    signup,
    login,
    logout,
    loginWithOAuth,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
    completeOnboarding,
    refreshSession,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// useAuth Hook
// ============================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// ============================================================
// Additional Hooks
// ============================================================

/**
 * Hook for just checking auth status without full context
 */
export function useAuthStatus(): {
  isLoading: boolean;
  isAuthenticated: boolean;
  status: AuthStatus;
} {
  const { isLoading, isAuthenticated, status } = useAuth();
  return { isLoading, isAuthenticated, status };
}

/**
 * Hook for accessing user profile
 */
export function useProfile(): {
  profile: UserProfile | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
} {
  const { profile, isLoading, refreshProfile } = useAuth();
  return { profile, isLoading, refresh: refreshProfile };
}

/**
 * Hook for real-time auth state listening
 */
export function useAuthListener(
  callback: (isAuthenticated: boolean, user: User | null) => void
): void {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    callback(isAuthenticated, user);
  }, [isAuthenticated, user, callback]);
}

// ============================================================
// Exports
// ============================================================

export { AuthContext };
export type { AuthContextValue, AuthProviderProps };
