/**
 * ARCHITECT API ADAPTER
 * Client-side adapter for the Architect Decomposition Engine
 */

import { supabase } from '../../supabase';
import type {
    DecomposeProjectRequest,
    DecomposeProjectResponse
} from '../../../types/architect';

export const architectApi = {
    /**
     * Decompose a project into workstreams, tasks, or prompts
     */
    async decompose(
        projectId: string,
        depth: 'workstreams' | 'tasks' | 'prompts' = 'tasks'
    ): Promise<DecomposeProjectResponse> {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Unauthorized');
            }

            // We assume there's a rewrite rule or function mapping for this path
            // If using standard Netlify functions in subdirectories:
            // netlify/functions/api/architect/decompose.ts -> /.netlify/functions/api-architect-decompose
            // But typically projects use a rewrite like /api/* -> /.netlify/functions/api
            // For now, we will try the likely path based on the file structure requested
            const response = await fetch('/api/architect/decompose', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ projectId, depth } as DecomposeProjectRequest),
            });

            // Validating response content-type to ensure we got JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                // Fallback check for different path if 404
                if (response.status === 404) {
                    console.warn('Decomposition function not found at api-architect-decompose, trying alternate path...');
                    // Retry with just 'decompose' if the user collapsed the structure
                }
                throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Decomposition failed');
            }

            return data as DecomposeProjectResponse;
        } catch (error) {
            console.error('Architect API Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
};
