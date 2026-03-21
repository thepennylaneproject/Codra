/**
 * Hugging Face Provider
 * Uses the Inference API (OpenAI-compatible)
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

interface HFResponse {
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
    'meta-llama/Meta-Llama-3-70B-Instruct': {
        id: 'meta-llama/Meta-Llama-3-70B-Instruct',
        name: 'Llama 3 70B',
        provider: 'huggingface',
        contextWindow: 8192,
        costPer1kPrompt: 0.0007,
        costPer1kCompletion: 0.0009,
        capabilities: ['chat', 'code'],
        isPowered: true,
    },
    'mistralai/Mistral-7B-Instruct-v0.3': {
        id: 'mistralai/Mistral-7B-Instruct-v0.3',
        name: 'Mistral 7B v0.3',
        provider: 'huggingface',
        contextWindow: 32768,
        costPer1kPrompt: 0.0002,
        costPer1kCompletion: 0.0002,
        capabilities: ['chat', 'code'],
        isPowered: true,
    },
};

export class HuggingFaceProvider implements AIProvider {
    id = 'huggingface';
    name = 'Hugging Face';
    private apiKey: string;
    private baseUrl = 'https://api-inference.huggingface.co/models';

    constructor(apiKey: string) {
        if (!apiKey) throw new Error('Hugging Face API key required');
        this.apiKey = apiKey;
    }

    private getUrl(model: string) {
        return `${this.baseUrl}/${model}/v1/chat/completions`;
    }

    async complete(options: AICompletionOptions): Promise<AICompletionResult> {
        const startTime = Date.now();

        try {
            const response = await fetch(this.getUrl(options.model), {
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
                throw new Error(`HuggingFace error: ${error.error ?? response.statusText}`);
            }

            const data: HFResponse = await response.json();
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
            throw new Error(`HuggingFace completion failed: ${getErrorMessage(error)}`);
        }
    }

    async *streamComplete(options: AICompletionOptions): AsyncGenerator<AIStreamChunk> {
        try {
            const response = await fetch(this.getUrl(options.model), {
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
                throw new Error(`HuggingFace stream error: ${response.status} ${response.statusText}`);
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
                        const data: HFResponse = JSON.parse(line.slice(6));
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
            throw new Error(`HuggingFace stream failed: ${getErrorMessage(error)}`);
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
