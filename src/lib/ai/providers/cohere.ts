/**
 * Cohere Provider
 */

import {
    AIProvider,
    AICompletionOptions,
    AICompletionResult,
    TokenUsage,
    ModelInfo,
    AIStreamChunk,
} from '../types';

interface CohereChatResponse {
    text: string;
    generation_id: string;
    meta?: {
        tokens?: {
            input_tokens: number;
            output_tokens: number;
        };
    };
}

interface CohereStreamResponse {
    event_type: string;
    text?: string;
    response?: CohereChatResponse;
}

const MODEL_CATALOG: Record<string, ModelInfo> = {
    'command-r-plus': {
        id: 'command-r-plus',
        name: 'Command R+',
        provider: 'cohere',
        contextWindow: 128000,
        costPer1kPrompt: 0.003,
        costPer1kCompletion: 0.015,
        capabilities: ['chat', 'code'],
        isPowered: true,
    },
    'command-r': {
        id: 'command-r',
        name: 'Command R',
        provider: 'cohere',
        contextWindow: 128000,
        costPer1kPrompt: 0.0005,
        costPer1kCompletion: 0.0015,
        capabilities: ['chat', 'code'],
        isPowered: true,
    },
};

export class CohereProvider implements AIProvider {
    id = 'cohere';
    name = 'Cohere';
    private apiKey: string;
    private baseUrl = 'https://api.cohere.ai/v1/chat';

    constructor(apiKey: string) {
        if (!apiKey) throw new Error('Cohere API key required');
        this.apiKey = apiKey;
    }

    async complete(options: AICompletionOptions): Promise<AICompletionResult> {
        const startTime = Date.now();

        try {
            // Map messages to Cohere format
            const lastMessage = options.messages[options.messages.length - 1];
            const chatHistory = options.messages.slice(0, -1).map(m => ({
                role: m.role === 'user' ? 'USER' : 'CHATBOT',
                message: m.content,
            }));

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    message: lastMessage.content,
                    model: options.model,
                    chat_history: chatHistory,
                    temperature: options.temperature ?? 0.7,
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(`Cohere error: ${error.message ?? response.statusText}`);
            }

            const data: CohereChatResponse = await response.json();
            const latency = Date.now() - startTime;

            const usage: TokenUsage = {
                promptTokens: data.meta?.tokens?.input_tokens ?? 0,
                completionTokens: data.meta?.tokens?.output_tokens ?? 0,
                totalTokens: (data.meta?.tokens?.input_tokens ?? 0) + (data.meta?.tokens?.output_tokens ?? 0),
            };

            return {
                content: data.text,
                model: options.model,
                provider: this.id,
                usage,
                latency,
                cost: 0,
            };
        } catch (error) {
            throw new Error(`Cohere completion failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async *streamComplete(options: AICompletionOptions): AsyncGenerator<AIStreamChunk> {
        try {
            const lastMessage = options.messages[options.messages.length - 1];
            const chatHistory = options.messages.slice(0, -1).map(m => ({
                role: m.role === 'user' ? 'USER' : 'CHATBOT',
                message: m.content,
            }));

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    message: lastMessage.content,
                    model: options.model,
                    chat_history: chatHistory,
                    temperature: options.temperature ?? 0.7,
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`Cohere stream error: ${response.status} ${response.statusText}`);
            }

            yield { type: 'start' };

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let buffer = '';
            let finalUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data: CohereStreamResponse = JSON.parse(line);
                        if (data.event_type === 'text-generation' && data.text) {
                            yield { type: 'content', content: data.text };
                        } else if (data.event_type === 'stream-end' && data.response) {
                            finalUsage = {
                                promptTokens: data.response.meta?.tokens?.input_tokens ?? 0,
                                completionTokens: data.response.meta?.tokens?.output_tokens ?? 0,
                                totalTokens: (data.response.meta?.tokens?.input_tokens ?? 0) + (data.response.meta?.tokens?.output_tokens ?? 0),
                            };
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }

            yield {
                type: 'end',
                usage: finalUsage,
                cost: 0,
            };
        } catch (error) {
            throw new Error(`Cohere stream failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async listModels(): Promise<ModelInfo[]> {
        return Object.values(MODEL_CATALOG);
    }

    estimateCost(model: string, promptTokens: number, completionTokens: number = 0): number {
        const modelInfo = MODEL_CATALOG[model];
        if (!modelInfo) return 0;
        return (promptTokens / 1000) * modelInfo.costPer1kPrompt + (completionTokens / 1000) * modelInfo.costPer1kCompletion;
    }

    async validate(): Promise<boolean> {
        return true;
    }
}
