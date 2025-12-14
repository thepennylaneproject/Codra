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
        // Get current user on mount
        const getCurrentUser = async () => {
            try {
                const user = await authAdapter.getCurrentUser();
                // Get session from localStorage or Supabase
                const { session } = await authAdapter.getSession();

                setState({
                    user,
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

        getCurrentUser();

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