/**
 * Model Provider Adapter Interface
 * Unified interface for discovering models from different AI providers
 */

import type { DiscoveredModel, ModelCapabilities, SmokeTestResult } from '../registry/registry-types';

// ============================================================================
// ADAPTER INTERFACE
// ============================================================================

/**
 * Interface that all provider adapters must implement.
 * This abstracts the provider-specific model discovery APIs.
 */
export interface ModelProviderAdapter {
    /**
     * Returns the unique identifier for this provider.
     * Should match the provider name used in the database.
     */
    providerName(): string;

    /**
     * Lists all available models from this provider.
     * Should call the provider's model listing API.
     */
    listModels(): Promise<DiscoveredModel[]>;

    /**
     * Optionally fetches detailed capabilities for a specific model.
     * If the provider doesn't expose this info, return unknowns.
     */
    getCapabilities?(model_key: string): Promise<{ 
        capabilities: Partial<ModelCapabilities>; 
        raw?: Record<string, unknown>;
    }>;

    /**
     * Runs a smoke test on a model to verify it's operational.
     * Should be a minimal request that validates the model responds.
     */
    smokeTest(model_key: string): Promise<SmokeTestResult>;
}

// ============================================================================
// ADAPTER CONFIG
// ============================================================================

export interface AdapterConfig {
    /** API key or access token */
    apiKey: string;
    /** Optional base URL override */
    baseUrl?: string;
    /** Timeout for API requests in milliseconds */
    timeoutMs?: number;
}

// ============================================================================
// ABSTRACT BASE ADAPTER
// ============================================================================

/**
 * Base class with common adapter functionality.
 * Concrete adapters should extend this class.
 */
export abstract class BaseProviderAdapter implements ModelProviderAdapter {
    protected readonly config: AdapterConfig;

    constructor(config: AdapterConfig) {
        if (!config.apiKey) {
            throw new Error(`API key required for ${this.providerName()}`);
        }
        this.config = {
            timeoutMs: 30000,
            ...config,
        };
    }

    abstract providerName(): string;
    abstract listModels(): Promise<DiscoveredModel[]>;
    abstract smokeTest(model_key: string): Promise<SmokeTestResult>;

    /**
     * Default implementation returns empty capabilities.
     * Override in subclasses that support capability discovery.
     */
    async getCapabilities(_model_key: string): Promise<{ 
        capabilities: Partial<ModelCapabilities>; 
        raw?: Record<string, unknown>;
    }> {
        return { capabilities: {} };
    }

    /**
     * Helper to make fetch requests with timeout
     */
    protected async fetchWithTimeout(
        url: string,
        options: RequestInit
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            this.config.timeoutMs
        );

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}
