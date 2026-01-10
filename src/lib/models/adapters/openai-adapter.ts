/**
 * OpenAI Adapter
 * Direct model discovery from OpenAI's /v1/models endpoint.
 */

import { BaseProviderAdapter, type AdapterConfig } from './adapter';
import type { DiscoveredModel, ModelCapabilities, SmokeTestResult } from '../registry/registry-types';

// ============================================================================
// OPENAI RESPONSE TYPES
// ============================================================================

interface OpenAIModelResponse {
    data?: Array<{
        id: string;
        object: string;
        created: number;
        owned_by: string;
    }>;
}

// ============================================================================
// OPENAI ADAPTER
// ============================================================================

export class OpenAIAdapter extends BaseProviderAdapter {
    private readonly modelsUrl: string;
    private readonly completionsUrl: string;

    constructor(config: AdapterConfig) {
        super(config);
        const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
        this.modelsUrl = `${baseUrl}/models`;
        this.completionsUrl = `${baseUrl}/chat/completions`;
    }

    providerName(): string {
        return 'openai';
    }

    async listModels(): Promise<DiscoveredModel[]> {
        try {
            const response = await this.fetchWithTimeout(this.modelsUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
            });

            if (!response.ok) {
                console.warn(`OpenAI listModels failed: ${response.status}`);
                return [];
            }

            const data: OpenAIModelResponse = await response.json();
            
            if (!data.data || !Array.isArray(data.data)) {
                console.warn('OpenAI returned unexpected format');
                return [];
            }

            // Filter to only include chat models (gpt-*)
            return data.data
                .filter(model => this.isChatModel(model.id))
                .map(model => this.mapToDiscoveredModel(model));
        } catch (error) {
            console.error('OpenAI listModels error:', error);
            return [];
        }
    }

    async getCapabilities(model_key: string): Promise<{
        capabilities: Partial<ModelCapabilities>;
        raw?: Record<string, unknown>;
    }> {
        const capabilities: Partial<ModelCapabilities> = {};
        const lowerKey = model_key.toLowerCase();

        // GPT-4o and GPT-4 Vision models have vision
        if (lowerKey.includes('gpt-4o') || lowerKey.includes('vision')) {
            capabilities.vision = true;
        }

        // Most modern OpenAI models support tools
        if (
            lowerKey.includes('gpt-4') ||
            lowerKey.includes('gpt-3.5-turbo')
        ) {
            capabilities.tools = true;
            capabilities.function_calling = true;
            capabilities.json_mode = true;
        }

        // All chat models support streaming
        capabilities.streaming = true;

        // Context windows
        if (lowerKey.includes('gpt-4o') || lowerKey.includes('gpt-4-turbo')) {
            capabilities.max_context = 128000;
            capabilities.output_max_tokens = 4096;
        } else if (lowerKey.includes('gpt-4-32k')) {
            capabilities.max_context = 32768;
        } else if (lowerKey.includes('gpt-4')) {
            capabilities.max_context = 8192;
        } else if (lowerKey.includes('gpt-3.5-turbo-16k')) {
            capabilities.max_context = 16384;
        } else if (lowerKey.includes('gpt-3.5-turbo')) {
            capabilities.max_context = 4096;
        }

        return { capabilities };
    }

    async smokeTest(model_key: string): Promise<SmokeTestResult> {
        const startTime = Date.now();

        try {
            const response = await this.fetchWithTimeout(this.completionsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
                body: JSON.stringify({
                    model: model_key,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 5,
                }),
            });

            const latency_ms = Date.now() - startTime;

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = (errorData as { error?: { message?: string } })?.error?.message || 
                                 `HTTP ${response.status}`;
                return { ok: false, latency_ms, error: errorMsg };
            }

            return { ok: true, latency_ms };
        } catch (error) {
            return {
                ok: false,
                latency_ms: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Filters to only include usable chat completion models
     */
    private isChatModel(modelId: string): boolean {
        const lower = modelId.toLowerCase();
        
        // Include GPT models
        if (lower.includes('gpt-4') || lower.includes('gpt-3.5')) {
            // Exclude fine-tuned models (ft:) and instruct variants that aren't chat
            if (lower.startsWith('ft:') || lower.includes('instruct')) {
                return false;
            }
            return true;
        }

        // Include o1 models (reasoning)
        if (lower.startsWith('o1')) {
            return true;
        }

        return false;
    }

    private mapToDiscoveredModel(apiModel: { 
        id: string; 
        created: number;
        owned_by: string;
    }): DiscoveredModel {
        const id = apiModel.id;
        
        // Generate display name
        let display_name = id;
        if (id.startsWith('gpt-4o')) {
            display_name = 'GPT-4o' + id.slice(6).replace(/-/g, ' ');
        } else if (id.startsWith('gpt-4')) {
            display_name = 'GPT-4' + id.slice(5).replace(/-/g, ' ');
        } else if (id.startsWith('gpt-3.5')) {
            display_name = 'GPT-3.5' + id.slice(7).replace(/-/g, ' ');
        } else if (id.startsWith('o1')) {
            display_name = 'O1' + id.slice(2).replace(/-/g, ' ');
        }

        return {
            model_key: id,
            display_name: display_name.trim(),
            raw: apiModel as Record<string, unknown>,
        };
    }
}
