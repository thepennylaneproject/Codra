import { useEffect, useState } from 'react';
import { authAdapter } from '../lib/api/auth';
import type { User, Session } from '@supabase/supabase-js';

interface UseAuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
}

export function useAuth() {
    const [state, setState] = useState<UseAuthState>({
        user: null,
        session: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        // ARCH-016 FIX: Get current session (single source of truth)
        // Derive user from session to prevent race condition
        const getCurrentSession = async () => {
            try {
                const { session } = await authAdapter.getSession();

                setState({
                    user: session?.user || null, // User derived from session
                    session,
                    loading: false,
                    error: null,
                });
            } catch (error) {
                setState({
                    user: null,
                    session: null,
                    loading: false,
                    error: error instanceof Error ? error.message : 'Auth error',
                });
            }
        };

        getCurrentSession();

        // Subscribe to auth changes
        const { unsubscribe } = authAdapter.onAuthStateChange(
            (_event, session) => {
                setState({
                    user: session?.user || null,
                    session,
                    loading: false,
                    error: null,
                });
            }
        );

        return () => {
            unsubscribe();
        };
    }, []);

    return state;
}