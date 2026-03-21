/**
 * Google Gemini Provider
 * Multimodal capabilities, strong reasoning
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

interface GeminiResponse {
    candidates: Array<{
        content?: { parts: Array<{ text: string }> };
        finishReason: string;
    }>;
    usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}

interface GeminiStreamResponse {
    candidates: Array<{
        content?: { parts: Array<{ text?: string }> };
        finishReason?: string;
    }>;
    usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}

const MODEL_CATALOG: Record<string, ModelInfo> = {
    'gemini-pro': {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'gemini',
        contextWindow: 32000,
        costPer1kPrompt: 0.000125,
        costPer1kCompletion: 0.000375,
        capabilities: ['chat', 'code', 'reasoning'],
        isPowered: true,
    },
    'gemini-1.5-pro': {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'gemini',
        contextWindow: 1000000,
        costPer1kPrompt: 0.0025,
        costPer1kCompletion: 0.01,
        capabilities: ['chat', 'code', 'reasoning'],
        isPowered: true,
    },
    'gemini-1.5-flash': {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'gemini',
        contextWindow: 1000000,
        costPer1kPrompt: 0.000075,
        costPer1kCompletion: 0.0003,
        capabilities: ['chat', 'code'],
        isPowered: true,
    },
};

export class GeminiProvider implements AIProvider {
    id = 'gemini';
    name = 'Google Gemini';
    private apiKey: string;
    private baseUrl = 'https://generativelanguage.googleapis.com/v1/models';

    constructor(apiKey: string) {
        if (!apiKey) throw new Error('Gemini API key required');
        this.apiKey = apiKey;
    }

    async complete(options: AICompletionOptions): Promise<AICompletionResult> {
        const startTime = Date.now();

        try {
            const modelId = options.model.includes(':') ? options.model : `${options.model}:generateContent`;
            const url = `${this.baseUrl}/${modelId}?key=${this.apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: options.messages.map((msg: any) => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }],
                    })),
                    generationConfig: {
                        temperature: options.temperature ?? 0.7,
                        maxOutputTokens: options.maxTokens,
                        topP: options.topP,
                    },
                    safetySettings: [
                        {
                            category: 'HARM_CATEGORY_UNSPECIFIED',
                            threshold: 'BLOCK_NONE',
                        },
                    ],
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Gemini error: ${error.error?.message ?? response.statusText}`);
            }

            const data: GeminiResponse = await response.json();
            const latency = Date.now() - startTime;

            const content = data.candidates[0]?.content?.parts[0]?.text ?? '';

            const usage: TokenUsage = {
                promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
                completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
                totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
            };

            const cost = this.estimateCost(options.model, usage.promptTokens, usage.completionTokens);

            return {
                content,
                model: options.model,
                provider: this.id,
                usage,
                latency,
                cost,
            };
        } catch (error) {
            throw new Error(`Gemini completion failed: ${getErrorMessage(error)}`);
        }
    }

    async *streamComplete(options: AICompletionOptions): AsyncGenerator<AIStreamChunk> {
        // const startTime = Date.now();

        try {
            const modelId = options.model.includes(':') ? options.model : `${options.model}:streamGenerateContent`;
            const url = `${this.baseUrl}/${modelId}?key=${this.apiKey}&alt=sse`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: options.messages.map((msg: any) => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }],
                    })),
                    generationConfig: {
                        temperature: options.temperature ?? 0.7,
                        maxOutputTokens: options.maxTokens,
                        topP: options.topP,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`Gemini stream error: ${response.status} ${response.statusText}`);
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

                    try {
                        const data: GeminiStreamResponse = JSON.parse(line.slice(6));
                        const text = data.candidates[0]?.content?.parts[0]?.text;

                        if (text) {
                            yield { type: 'content', content: text };
                        }

                        if (data.usageMetadata) {
                            totalPromptTokens = data.usageMetadata.promptTokenCount;
                            totalCompletionTokens = data.usageMetadata.candidatesTokenCount;
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
            throw new Error(`Gemini stream failed: ${getErrorMessage(error)}`);
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
            const modelId = 'gemini-pro:generateContent';
            const url = `${this.baseUrl}/${modelId}?key=${this.apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: 'test' }],
                        },
                    ],
                    generationConfig: {
                        maxOutputTokens: 10,
                    },
                }),
            });

            return response.ok;
        } catch {
            return false;
        }
    }
}