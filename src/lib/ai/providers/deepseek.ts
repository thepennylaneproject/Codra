/**
 * DeepSeek Provider
 * Great for code-heavy tasks, reasoning, and cost-effective completions
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

interface DeepSeekResponse {
    id: string;
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
    'deepseek-chat': {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        provider: 'deepseek',
        contextWindow: 4096,
        costPer1kPrompt: 0.0001,
        costPer1kCompletion: 0.0002,
        capabilities: ['chat', 'code'],
        isPowered: true,
    },
    'deepseek-coder': {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
        provider: 'deepseek',
        contextWindow: 4096,
        costPer1kPrompt: 0.00014,
        costPer1kCompletion: 0.00042,
        capabilities: ['code', 'chat'],
        isPowered: true,
    },
    'deepseek-coder-33b': {
        id: 'deepseek-coder-33b',
        name: 'DeepSeek Coder 33B',
        provider: 'deepseek',
        contextWindow: 4096,
        costPer1kPrompt: 0.0006,
        costPer1kCompletion: 0.0008,
        capabilities: ['code', 'chat', 'reasoning'],
        isPowered: true,
    },
};

export class DeepSeekProvider implements AIProvider {
    id = 'deepseek';
    name = 'DeepSeek';
    private apiKey: string;
    private baseUrl = 'https://api.deepseek.com/chat/completions';

    constructor(apiKey: string) {
        if (!apiKey) throw new Error('DeepSeek API key required');
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
                    top_p: options.topP,
                    frequency_penalty: options.frequencyPenalty ?? 0,
                    presence_penalty: options.presencePenalty ?? 0,
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error(`DeepSeek error: ${response.status} ${response.statusText}`);
            }

            const data: DeepSeekResponse = await response.json();
            const latency = Date.now() - startTime;

            const usage: TokenUsage = {
                promptTokens: data.usage?.prompt_tokens ?? 0,
                completionTokens: data.usage?.completion_tokens ?? 0,
                totalTokens: data.usage?.total_tokens ?? 0,
            };

            const cost = this.estimateCost(options.model, usage.promptTokens, usage.completionTokens);

            return {
                content: data.choices[0]?.message?.content ?? '',
                model: options.model,
                provider: this.id,
                usage,
                latency,
                cost,
            };
        } catch (error) {
            throw new Error(`DeepSeek completion failed: ${getErrorMessage(error)}`);
        }
    }

    async *streamComplete(options: AICompletionOptions): AsyncGenerator<AIStreamChunk> {
        // const startTime = Date.now();

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
                    top_p: options.topP,
                    frequency_penalty: options.frequencyPenalty ?? 0,
                    presence_penalty: options.presencePenalty ?? 0,
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`DeepSeek stream error: ${response.status} ${response.statusText}`);
            }

            yield { type: 'start' };

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let buffer = '';
            let totalPromptTokens = 0;
            let totalCompletionTokens = 0;

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
                        const data: DeepSeekResponse = JSON.parse(line.slice(6));
                        const delta = data.choices[0]?.delta?.content;

                        if (delta) {
                            yield { type: 'content', content: delta };
                        }

                        if (data.usage) {
                            totalPromptTokens = data.usage.prompt_tokens;
                            totalCompletionTokens = data.usage.completion_tokens;
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }

            // const latency = Date.now() - startTime;
            const cost = this.estimateCost(options.model, totalPromptTokens, totalCompletionTokens);

            yield {
                type: 'end',
                usage: {
                    promptTokens: totalPromptTokens,
                    completionTokens: totalCompletionTokens,
                    totalTokens: totalPromptTokens + totalCompletionTokens,
                },
                cost,
            };
        } catch (error) {
            throw new Error(`DeepSeek stream failed: ${getErrorMessage(error)}`);
        }
    }

    async listModels(): Promise<ModelInfo[]> {
        return Object.values(MODEL_CATALOG);
    }

    estimateCost(model: string, promptTokens: number, completionTokens: number = 0): number {
        return estimateCostFromCatalog(MODEL_CATALOG, model, promptTokens, completionTokens);
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
                    model: 'deepseek-chat',
                    messages: [{ role: 'user' as const, content: 'test' }],
                    max_tokens: 10,
                }),
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}