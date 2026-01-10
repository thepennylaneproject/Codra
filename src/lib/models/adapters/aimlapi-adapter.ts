/**
 * AIMLAPI Adapter
 * Wraps aimlapi.com for dynamic model discovery.
 * AIMLAPI aggregates 200+ models from multiple upstream providers.
 */

import { BaseProviderAdapter, type AdapterConfig } from './adapter';
import type { DiscoveredModel, ModelCapabilities, SmokeTestResult } from '../registry/registry-types';

// ============================================================================
// AIMLAPI RESPONSE TYPES
// ============================================================================

interface AimlapiModelResponse {
    data?: Array<{
        id: string;
        object?: string;
        owned_by?: string;
        permission?: unknown[];
        created?: number;
    }>;
}

// ============================================================================
// AIMLAPI ADAPTER
// ============================================================================

export class AimlapiAdapter extends BaseProviderAdapter {
    private readonly modelsUrl: string;
    private readonly completionsUrl: string;

    constructor(config: AdapterConfig) {
        super(config);
        this.modelsUrl = config.baseUrl || 'https://api.aimlapi.com/v1/models';
        this.completionsUrl = 'https://api.aimlapi.com/chat/completions';
    }

    providerName(): string {
        return 'aimlapi';
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
                console.warn(`AIMLAPI listModels failed: ${response.status}`);
                return [];
            }

            const data: AimlapiModelResponse = await response.json();
            
            if (!data.data || !Array.isArray(data.data)) {
                console.warn('AIMLAPI returned unexpected format');
                return [];
            }

            return data.data.map((model) => this.mapToDiscoveredModel(model));
        } catch (error) {
            console.error('AIMLAPI listModels error:', error);
            return [];
        }
    }

    async getCapabilities(model_key: string): Promise<{
        capabilities: Partial<ModelCapabilities>;
        raw?: Record<string, unknown>;
    }> {
        // AIMLAPI doesn't expose a capabilities endpoint,
        // so we infer based on model naming patterns
        const capabilities: Partial<ModelCapabilities> = {};

        const lowerKey = model_key.toLowerCase();

        // Vision capable models
        if (
            lowerKey.includes('gpt-4o') ||
            lowerKey.includes('gpt-4-vision') ||
            lowerKey.includes('claude-3') ||
            lowerKey.includes('gemini')
        ) {
            capabilities.vision = true;
        }

        // Tool/function calling capable
        if (
            lowerKey.includes('gpt-4') ||
            lowerKey.includes('gpt-3.5') ||
            lowerKey.includes('claude-3') ||
            lowerKey.includes('claude-2')
        ) {
            capabilities.tools = true;
            capabilities.function_calling = true;
        }

        // JSON mode
        if (
            lowerKey.includes('gpt-4') ||
            lowerKey.includes('gpt-3.5-turbo')
        ) {
            capabilities.json_mode = true;
        }

        // All text models support streaming through AIMLAPI
        capabilities.streaming = true;

        // Context windows (conservative estimates)
        if (lowerKey.includes('claude-3')) {
            capabilities.max_context = 200000;
        } else if (lowerKey.includes('gpt-4-turbo') || lowerKey.includes('gpt-4o')) {
            capabilities.max_context = 128000;
        } else if (lowerKey.includes('gpt-4')) {
            capabilities.max_context = 8192;
        } else if (lowerKey.includes('gpt-3.5')) {
            capabilities.max_context = 16384;
        } else {
            capabilities.max_context = 4096; // Safe default
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
                const errorText = await response.text().catch(() => 'Unknown error');
                return {
                    ok: false,
                    latency_ms,
                    error: `HTTP ${response.status}: ${errorText.slice(0, 200)}`,
                };
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

    private mapToDiscoveredModel(apiModel: { 
        id: string; 
        owned_by?: string;
    }): DiscoveredModel {
        const id = apiModel.id;
        
        // Generate display name from model ID
        const display_name = id
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return {
            model_key: id,
            display_name,
            raw: apiModel as Record<string, unknown>,
        };
    }
}
