/**
 * React Hook: useAICompletion
 * Call AI completions with proper error handling and loading states
 */

import { useState, useCallback } from 'react';
import { useAuth } from './../lib/auth/AuthProvider';
import type { AIMessage, AICompletionResult } from '../lib/ai/types';

interface UseAICompletionOptions {
    model: string;
    temperature?: number;
    maxTokens?: number;
    provider?: string;
}

interface UseAICompletionState {
    loading: boolean;
    error: string | null;
    result: AICompletionResult | null;
}

export function useAICompletion() {
    const { user, session } = useAuth();
    const [state, setState] = useState<UseAICompletionState>({
        loading: false,
        error: null,
        result: null,
    });

    const complete = useCallback(
        async (
            messages: AIMessage[],
            options: UseAICompletionOptions
        ): Promise<AICompletionResult | null> => {
            if (!user || !session?.access_token) {
                setState({ loading: false, error: 'Not authenticated', result: null });
                return null;
            }

            setState({ loading: true, error: null, result: null });

            try {
                const response = await fetch('/.netlify/functions/api/ai/complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        messages,
                        model: options.model,
                        temperature: options.temperature,
                        maxTokens: options.maxTokens,
                        provider: options.provider,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Completion failed');
                }

                setState({
                    loading: false,
                    error: null,
                    result: data.data,
                });

                return data.data;
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                setState({ loading: false, error: errorMsg, result: null });
                return null;
            }
        },
        [user, session]
    );

    return {
        ...state,
        complete,
    };
}