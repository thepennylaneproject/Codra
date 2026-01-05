/**
 * OpenAI Provider
 */

import {
    AIProvider,
    AICompletionOptions,
    AICompletionResult,
    TokenUsage,
    ModelInfo,
    AIStreamChunk,
} from '../types';

interface OpenAIResponse {
    model: string;
    choices: Array<{
        message?: { role: string; content: string };
        delta?: { content?: string };
        finish_reason: string | null;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

const MODEL_CATALOG: Record<string, ModelInfo> = {
    'gpt-4o': {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        contextWindow: 128000,
        costPer1kPrompt: 0.005,
        costPer1kCompletion: 0.015,
        capabilities: ['chat', 'code', 'vision'],
        isPowered: true,
    },
    'gpt-4o-mini': {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        contextWindow: 128000,
        costPer1kPrompt: 0.00015,
        costPer1kCompletion: 0.0006,
        capabilities: ['chat', 'code', 'vision'],
        isPowered: true,
    },
};

export class OpenAIProvider implements AIProvider {
    id = 'openai';
    name = 'OpenAI';
    private apiKey: string;
    private baseUrl = 'https://api.openai.com/v1/chat/completions';

    constructor(apiKey: string) {
        if (!apiKey) throw new Error('OpenAI API key required');
        this.apiKey = apiKey;
    }

    async complete(options: AICompletionOptions): Promise<AICompletionResult> {
        const startTime = Date.now();

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: options.model,
                    messages: options.messages,
                    temperature: options.temperature ?? 0.7,
                    max_tokens: options.maxTokens,
                    stream: false,
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(`OpenAI error: ${error.error?.message ?? response.statusText}`);
            }

            const data: OpenAIResponse = await response.json();
            const latency = Date.now() - startTime;

            const usage: TokenUsage = {
                promptTokens: data.usage?.prompt_tokens ?? 0,
                completionTokens: data.usage?.completion_tokens ?? 0,
                totalTokens: data.usage?.total_tokens ?? 0,
            };

            return {
                content: data.choices[0]?.message?.content ?? '',
                model: options.model,
                provider: this.id,
                usage,
                latency,
                cost: 0, // Calculated by registry/router
            };
        } catch (error) {
            throw new Error(`OpenAI completion failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async *streamComplete(options: AICompletionOptions): AsyncGenerator<AIStreamChunk> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: options.model,
                    messages: options.messages,
                    temperature: options.temperature ?? 0.7,
                    max_tokens: options.maxTokens,
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`OpenAI stream error: ${response.status} ${response.statusText}`);
            }

            yield { type: 'start' };

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    if (line === 'data: [DONE]') break;

                    try {
                        const data: OpenAIResponse = JSON.parse(line.slice(6));
                        const delta = data.choices[0]?.delta?.content;

                        if (delta) {
                            yield { type: 'content', content: delta };
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }

            yield {
                type: 'end',
                usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                cost: 0,
            };
        } catch (error) {
            throw new Error(`OpenAI stream failed: ${error instanceof Error ? error.message : String(error)}`);
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
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3-turbo',
                    messages: [{ role: 'user', content: 'hi' }],
                    max_tokens: 1,
                }),
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}
