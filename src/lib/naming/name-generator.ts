/**
 * NAME GENERATOR
 * Generates name suggestions using AI
 */

import { supabase } from '../supabase';
import type { NamingScope, NamingTargetType } from '../../types/architect';

export interface NameSuggestion {
    name: string;
    reasoning: string;
}

export const nameGenerator = {
    /**
     * Generate name suggestions based on context
     */
    async generate(
        projectId: string,
        kind: NamingTargetType,
        scope: NamingScope,
        description: string,
        existingNames: string[] = [],
        count: number = 3
    ): Promise<NameSuggestion[]> {
        try {
            // Get current user token for auth
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/.netlify/functions/api/architect/suggest-names', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    projectId,
                    kind,
                    scope,
                    description,
                    existingNames,
                    count,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate names');
            }

            const data = await response.json();
            return data.suggestions || [];
        } catch (error) {
            console.error('Error generating names:', error);
            return [];
        }
    },
};
