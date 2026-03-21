/**
 * Mistral AI Provider
 */

import {
    AIProvider,
    AICompletionOptions,
    AICompletionResult,
    TokenUsage,
    ModelInfo,
    AIStreamChunk,
} from '../types';
import { estimateCostFromCatalog } from '../provider-utils';
import { getErrorMessage } from '../../../utils/errors';

interface MistralResponse {
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
    'mistral-large-latest': {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        provider: 'mistral',
        contextWindow: 128000,
        costPer1kPrompt: 0.004,
        costPer1kCompletion: 0.012,
        capabilities: ['chat', 'code'],
        isPowered: true,
    },
    'mistral-medium': {
        id: 'mistral-medium',
        name: 'Mistral Medium',
        provider: 'mistral',
        contextWindow: 32000,
        costPer1kPrompt: 0.0027,
        costPer1kCompletion: 0.0081,
        capabilities: ['chat', 'code'],
        isPowered: true,
    },
};

export class MistralProvider implements AIProvider {
    id = 'mistral';
    name = 'Mistral AI';
    private apiKey: string;
    private baseUrl = 'https://api.mistral.ai/v1/chat/completions';

    constructor(apiKey: string) {
        if (!apiKey) throw new Error('Mistral API key required');
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
                throw new Error(`Mistral error: ${error.error?.message ?? response.statusText}`);
            }

            const data: MistralResponse = await response.json();
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
                cost: 0,
            };
        } catch (error) {
            throw new Error(`Mistral completion failed: ${getErrorMessage(error)}`);
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
                throw new Error(`Mistral stream error: ${response.status} ${response.statusText}`);
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
                        const data: MistralResponse = JSON.parse(line.slice(6));
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
            throw new Error(`Mistral stream failed: ${getErrorMessage(error)}`);
        }
    }

    async listModels(): Promise<ModelInfo[]> {
        return Object.values(MODEL_CATALOG);
    }

    estimateCost(model: string, promptTokens: number, completionTokens: number = 0): number {
        return estimateCostFromCatalog(MODEL_CATALOG, model, promptTokens, completionTokens);
    }

    async validate(): Promise<boolean> {
        return true;
    }
}
