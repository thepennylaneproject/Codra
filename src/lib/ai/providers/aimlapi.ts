/**
 * aimlapi.com Provider
 * Single API for 200+ models including:
 * - OpenAI (GPT-4, GPT-3.5-turbo)
 * - Anthropic (Claude)
 * - Google (Gemini)
 * - Meta (Llama)
 * - And many more
 */

import {
    AIProvider,
    AICompletionOptions,
    AICompletionResult,

    TokenUsage,
    ModelInfo,
    AIStreamChunk,
} from '../types';

interface AimlApiResponse {
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

// Known models and their costs (these update, so consider fetching from API)
const MODEL_CATALOG: Record<string, ModelInfo> = {
    'gpt-4-turbo': {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'aimlapi',
        contextWindow: 128000,
        costPer1kPrompt: 0.01,
        costPer1kCompletion: 0.03,
        capabilities: ['chat', 'code', 'reasoning'],
        isPowered: true,
    },
    'gpt-4o': {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'aimlapi',
        contextWindow: 128000,
        costPer1kPrompt: 0.005,
        costPer1kCompletion: 0.015,
        capabilities: ['chat', 'code', 'reasoning'],
        isPowered: true,
    },
    'gpt-3-turbo': {
        id: 'gpt-3-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'aimlapi',
        contextWindow: 4096,
        costPer1kPrompt: 0.0005,
        costPer1kCompletion: 0.0015,
        capabilities: ['chat', 'code'],
        isPowered: true,
    },
    'claude-3-5-sonnet': {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'aimlapi',
        contextWindow: 200000,
        costPer1kPrompt: 0.003,
        costPer1kCompletion: 0.015,
        capabilities: ['chat', 'code', 'reasoning'],
        isPowered: true,
    },
    'claude-3-opus': {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'aimlapi',
        contextWindow: 200000,
        costPer1kPrompt: 0.015,
        costPer1kCompletion: 0.075,
        capabilities: ['chat', 'code', 'reasoning'],
        isPowered: true,
    },
    'meta-llama2-70b': {
        id: 'meta-llama2-70b',
        name: 'Llama 2 70B',
        provider: 'aimlapi',
        contextWindow: 4096,
        costPer1kPrompt: 0.0007,
        costPer1kCompletion: 0.0009,
        capabilities: ['chat', 'code'],
        isPowered: true,
    },
    'mistral-7b': {
        id: 'mistral-7b',
        name: 'Mistral 7B',
        provider: 'aimlapi',
        contextWindow: 8000,
        costPer1kPrompt: 0.00014,
        costPer1kCompletion: 0.00042,
        capabilities: ['chat', 'code'],
        isPowered: true,
    },
};

export class AimlApiProvider implements AIProvider {
    id = 'aimlapi';
    name = 'aimlapi.com';
    private apiKey: string;
    private baseUrl = 'https://api.aimlapi.com/chat/completions';

    constructor(apiKey: string) {
        if (!apiKey) throw new Error('aimlapi API key required');
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
                throw new Error(`aimlapi error: ${response.status} ${response.statusText}`);
            }

            const data: AimlApiResponse = await response.json();
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
            throw new Error(`aimlapi completion failed: ${error instanceof Error ? error.message : String(error)}`);
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
                throw new Error(`aimlapi stream error: ${response.status} ${response.statusText}`);
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
                        const data: AimlApiResponse = JSON.parse(line.slice(6));
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
            const cost = this.estimateCost(
                options.model,
                totalPromptTokens,
                totalCompletionTokens
            );

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
            throw new Error(`aimlapi stream failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private modelCache: ModelInfo[] | null = null;

    async listModels(): Promise<ModelInfo[]> {
        if (this.modelCache) {
            return this.modelCache;
        }

        try {
            const response = await fetch('https://api.aimlapi.com/v1/models', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });

            if (!response.ok) {
                // Fallback to static catalog if API fails (e.g. key invalid for listing)
                console.warn('Failed to fetch AILMAPI models, falling back to static catalog');
                return Object.values(MODEL_CATALOG);
            }

            const data = await response.json();

            // Map API response to ModelInfo
            // The API returns { data: [ { id: 'gpt-4', ... } ] }
            const apiModels = (data.data || []).map((m: any) => {
                const id = m.id;
                let provider = 'aimlapi'; // default sub-provider
                let name = id;

                // Simple heuristic to guess upstream provider and formatted name
                if (id.startsWith('gpt') || id.startsWith('o1')) provider = 'OpenAI';
                else if (id.startsWith('claude')) provider = 'Anthropic';
                else if (id.startsWith('gemini')) provider = 'Google';
                else if (id.startsWith('meta') || id.startsWith('llama')) provider = 'Meta';
                else if (id.startsWith('mistral')) provider = 'Mistral';
                else if (id.includes('deepseek')) provider = 'DeepSeek';

                // Format name a bit nicely if possible, else use ID
                name = id
                    .split('-')
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                return {
                    id,
                    name,
                    provider, // This will be used for grouping
                    contextWindow: 128000, // conservative default
                    costPer1kPrompt: 0.005, // average default
                    costPer1kCompletion: 0.015,
                    capabilities: ['chat'],
                    isPowered: true
                } as ModelInfo;
            });

            this.modelCache = apiModels.length > 0 ? apiModels : Object.values(MODEL_CATALOG);
            return this.modelCache!;
        } catch (error) {
            console.error('Error listing AILMAPI models:', error);
            return Object.values(MODEL_CATALOG);
        }
    }

    estimateCost(model: string, promptTokens: number, completionTokens: number = 0): number {
        // ... (existing implementation)
        const modelInfo = MODEL_CATALOG[model];
        if (!modelInfo) {
            // Fallback cost estimation for unknown models
            // Average cheap price to avoid scaring users with $0
            return (promptTokens / 1000) * 0.005 + (completionTokens / 1000) * 0.015;
        }

        const promptCost = (promptTokens / 1000) * modelInfo.costPer1kPrompt;
        const completionCost = (completionTokens / 1000) * modelInfo.costPer1kCompletion;
        return promptCost + completionCost;
    }

    async validate(): Promise<boolean> {
        // ... (existing implementation)
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3-turbo',
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