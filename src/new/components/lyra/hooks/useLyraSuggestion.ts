/**
 * USE LYRA SUGGESTION
 * Hook for fetching and managing the next suggestion from Lyra AI
 */

import { useState, useEffect, useCallback } from 'react';
import { useLyraOptional } from '../../../lib/lyra';

export interface LyraSuggestionResponse {
    type: 'suggestion' | 'clarification' | 'idle' | 'thinking';
    text: string;
    action?: {
        label: string;
        taskId: string;
    };
    options?: Array<{
        label: string;
        value: string;
    }>;
}

export function useLyraSuggestion(spreadId?: string, deskId?: string) {
    const lyra = useLyraOptional();
    const [suggestion, setSuggestion] = useState<LyraSuggestionResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch next suggestion
    const fetchSuggestion = useCallback(async () => {
        if (!spreadId) {
            setSuggestion({ type: 'idle', text: '' });
            return;
        }

        setIsLoading(true);

        try {
            // TODO: Replace with actual API call when backend is ready
            // const response = await fetch(`/api/lyra/suggest?spreadId=${spreadId}&deskId=${deskId || ''}`);
            // const data = await response.json();
            // setSuggestion(data);

            // For now, use the existing context data
            if (lyra) {
                const { suggestions, questions } = lyra;

                // Priority: clarifying question > suggestion > idle
                if (questions.length > 0) {
                    const q = questions[0];
                    setSuggestion({
                        type: 'clarification',
                        text: q.question,
                        options: [
                            { label: 'Option 1', value: 'opt1' },
                            { label: 'Option 2', value: 'opt2' },
                        ],
                    });
                } else if (suggestions.length > 0) {
                    const s = suggestions[0];
                    setSuggestion({
                        type: 'suggestion',
                        text: `Based on your campaign brief, I recommend starting with ${s.title.toLowerCase()}.`,
                        action: {
                            label: s.title,
                            taskId: s.id,
                        },
                    });
                } else {
                    setSuggestion({ type: 'idle', text: '' });
                }
            } else {
                setSuggestion({ type: 'idle', text: '' });
            }
        } catch (error) {
            console.error('Failed to fetch suggestion:', error);
            setSuggestion({ type: 'idle', text: '' });
        } finally {
            setIsLoading(false);
        }
    }, [spreadId, deskId, lyra]);

    // Fetch on mount and when dependencies change
    useEffect(() => {
        fetchSuggestion();
    }, [fetchSuggestion]);

    return {
        suggestion,
        isLoading,
        refresh: fetchSuggestion,
    };
}
