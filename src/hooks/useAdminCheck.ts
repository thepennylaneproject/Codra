/**
 * useAdminCheck Hook
 * 
 * Checks if the current user is an admin based on backend verification.
 * Used for route protection and conditional UI rendering.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface AdminCheckResponse {
    isAdmin: boolean;
}

async function checkAdminStatus(): Promise<boolean> {
    try {
        // Get current session token
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return false;
        }

        const response = await fetch('/.netlify/functions/api/admin-check', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return false;
        }

        const data: AdminCheckResponse = await response.json();
        return data.isAdmin;
    } catch (error) {
        console.error('Admin check failed:', error);
        return false;
    }
}

export function useAdminCheck() {
    const { data: isAdmin = false, isLoading } = useQuery({
        queryKey: ['admin-check'],
        queryFn: checkAdminStatus,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    });

    return {
        isAdmin,
        isLoading,
    };
}
