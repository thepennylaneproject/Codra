/**
 * Adapter Registry
 * Factory for getting provider adapters by name.
 * Allows dynamic registration and lookup of adapters.
 */

import type { ModelProviderAdapter, AdapterConfig } from './adapter';
import { AimlapiAdapter } from './aimlapi-adapter';
import { OpenAIAdapter } from './openai-adapter';

// ============================================================================
// ADAPTER FACTORY TYPES
// ============================================================================

type AdapterConstructor = new (config: AdapterConfig) => ModelProviderAdapter;

interface AdapterRegistration {
    constructor: AdapterConstructor;
    envKey: string; // Environment variable for API key
}

// ============================================================================
// REGISTERED ADAPTERS
// ============================================================================

const ADAPTER_REGISTRY: Record<string, AdapterRegistration> = {
    'aimlapi': {
        constructor: AimlapiAdapter,
        envKey: 'AIMLAPI_API_KEY',
    },
    'openai': {
        constructor: OpenAIAdapter,
        envKey: 'OPENAI_API_KEY',
    },
};

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Get a single adapter by provider name.
 * Returns null if the provider is not registered or API key is missing.
 */
export function getAdapter(providerName: string): ModelProviderAdapter | null {
    const registration = ADAPTER_REGISTRY[providerName];
    if (!registration) {
        console.warn(`Unknown provider: ${providerName}`);
        return null;
    }

    // Get API key from environment
    const apiKey = getEnvVar(registration.envKey);
    if (!apiKey) {
        console.warn(`Missing API key for ${providerName} (${registration.envKey})`);
        return null;
    }

    return new registration.constructor({ apiKey });
}

/**
 * Get all available adapters (those with valid API keys).
 */
export function getAllAdapters(): ModelProviderAdapter[] {
    const adapters: ModelProviderAdapter[] = [];

    for (const providerName of Object.keys(ADAPTER_REGISTRY)) {
        const adapter = getAdapter(providerName);
        if (adapter) {
            adapters.push(adapter);
        }
    }

    return adapters;
}

/**
 * Get list of all registered provider names.
 */
export function getRegisteredProviders(): string[] {
    return Object.keys(ADAPTER_REGISTRY);
}

/**
 * Register a new adapter at runtime.
 */
export function registerAdapter(
    providerName: string,
    constructor: AdapterConstructor,
    envKey: string
): void {
    ADAPTER_REGISTRY[providerName] = { constructor, envKey };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get environment variable (works in both browser and Node.js contexts)
 */
function getEnvVar(key: string): string | undefined {
    // Vite environment (browser)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key];
    }
    
    // Node.js environment
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
    }

    return undefined;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { ModelProviderAdapter, AdapterConfig } from './adapter';
export { AimlapiAdapter } from './aimlapi-adapter';
export { OpenAIAdapter } from './openai-adapter';
