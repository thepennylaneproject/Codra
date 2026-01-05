/**
 * React Hook: useAIStream
 * Stream AI completions with real-time updates
 */

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../lib/auth/AuthProvider';
import type { AIMessage, AIStreamChunk } from '../lib/ai/types';

interface UseAIStreamState {
    loading: boolean;
    error: string | null;
    content: string;
    usage: { promptTokens: number; completionTokens: number } | null;
    cost: number | null;
}

export function useAIStream() {
    const { user, session } = useAuth();
    const abortControllerRef = useRef<AbortController | null>(null);
    const [state, setState] = useState<UseAIStreamState>({
        loading: false,
        error: null,
        content: '',
        usage: null,
        cost: null,
    });

    const stream = useCallback(
        async (
            messages: AIMessage[],
            options: {
                model: string;
                temperature?: number;
                maxTokens?: number;
                provider?: string;
                onChunk?: (chunk: string) => void;
            }
        ): Promise<void> => {
            if (!user || !session?.access_token) {
                setState({
                    loading: false,
                    error: 'Not authenticated',
                    content: '',
                    usage: null,
                    cost: null,
                });
                return;
            }

            // Cancel previous stream if still running
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();

            setState({
                loading: true,
                error: null,
                content: '',
                usage: null,
                cost: null,
            });

            try {
                const response = await fetch('/.netlify/functions/api/ai/stream', {
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
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                if (!response.body) {
                    throw new Error('No response body');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let accumulatedContent = '';
                let finalUsage = null;
                let finalCost = null;

                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;

                        try {
                            const chunk: AIStreamChunk = JSON.parse(line.slice(6));

                            if (chunk.type === 'content' && chunk.content) {
                                accumulatedContent += chunk.content;
                                options.onChunk?.(chunk.content);
                            } else if (chunk.type === 'end') {
                                finalUsage = chunk.usage || null;
                                finalCost = chunk.cost || null;
                            }
                        } catch {
                            // Skip invalid JSON
                        }
                    }
                }

                setState({
                    loading: false,
                    error: null,
                    content: accumulatedContent,
                    usage: finalUsage,
                    cost: finalCost,
                });
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return; // Stream was cancelled
                }

                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                setState({
                    loading: false,
                    error: errorMsg,
                    content: '',
                    usage: null,
                    cost: null,
                });
            }
        },
        [user, session]
    );

    const cancel = useCallback(() => {
        abortControllerRef.current?.abort();
    }, []);

    return {
        ...state,
        stream,
        cancel,
    };
}