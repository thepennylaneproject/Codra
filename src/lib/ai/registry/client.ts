/**
 * Provider Registry Client
 * 
 * Frontend helper for fetching and caching the provider registry.
 * Provides typed access to providers and models without exposing secrets.
 * 
 * @example
 * // Fetch and cache registry
 * const registry = await fetchProviderRegistry();
 * 
 * // Use React hook (with auto-refresh)
 * const { providers, isLoading, error, refetch } = useProviderRegistry();
 * 
 * // Get specific provider or model
 * const provider = findProviderById(providers, 'aimlapi');
 * const model = findModelById(providers, 'gpt-4o');
 */

import {
    Modality,
    ProviderRegistryEntry,
    ModelRegistryEntry,
    ProviderRegistryResponse,
} from './types';
import { PROVIDER_REGISTRY } from './provider-registry';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Base URL for the registry endpoint */
const REGISTRY_ENDPOINT = '/.netlify/functions/providers';

/** Cache duration in milliseconds (5 minutes) */
const CACHE_DURATION_MS = 5 * 60 * 1000;

/** In-memory cache */
let registryCache: {
    data: ProviderRegistryResponse | null;
    timestamp: number;
} = {
    data: null,
    timestamp: 0
};

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Fetch the provider registry from the backend.
 * Results are cached in memory for 5 minutes.
 * 
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @throws Error if the fetch fails
 */
export async function fetchProviderRegistry(
    forceRefresh = false
): Promise<ProviderRegistryResponse> {
    const now = Date.now();

    // Return cached data if valid
    if (
        !forceRefresh &&
        registryCache.data &&
        now - registryCache.timestamp < CACHE_DURATION_MS
    ) {
        return registryCache.data;
    }

    try {
        const response = await fetch(REGISTRY_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const contentType = response.headers.get('content-type') || '';
        if (!response.ok) {
            return { providers: PROVIDER_REGISTRY };
        }

        const rawBody = await response.text();
        if (!contentType.includes('application/json')) {
            return { providers: PROVIDER_REGISTRY };
        }

        let data: ProviderRegistryResponse;
        try {
            data = JSON.parse(rawBody) as ProviderRegistryResponse;
        } catch {
            return { providers: PROVIDER_REGISTRY };
        }

        // Update cache
        registryCache = {
            data,
            timestamp: now
        };

        return data;
    } catch {
        return { providers: PROVIDER_REGISTRY };
    }
}

/**
 * Get cached registry if available (synchronous)
 * Returns null if no cached data exists
 */
export function getCachedRegistry(): ProviderRegistryResponse | null {
    return registryCache.data;
}

/**
 * Clear the registry cache
 */
export function clearRegistryCache(): void {
    registryCache = { data: null, timestamp: 0 };
}

// ============================================================================
// QUERY HELPERS (work with fetched data)
// ============================================================================

/**
 * Find a provider by ID
 */
export function findProviderById(
    providers: ProviderRegistryEntry[],
    providerId: string
): ProviderRegistryEntry | undefined {
    return providers.find(p => p.id === providerId);
}

/**
 * Find a model by ID across all providers
 */
export function findModelById(
    providers: ProviderRegistryEntry[],
    modelId: string
): ModelRegistryEntry | undefined {
    for (const provider of providers) {
        const model = provider.models.find(m => m.id === modelId);
        if (model) return model;
    }
    return undefined;
}

/**
 * Find a model and its provider by model ID
 */
export function findModelWithProvider(
    providers: ProviderRegistryEntry[],
    modelId: string
): { model: ModelRegistryEntry; provider: ProviderRegistryEntry } | undefined {
    for (const provider of providers) {
        const model = provider.models.find(m => m.id === modelId);
        if (model) return { model, provider };
    }
    return undefined;
}

/**
 * Filter providers by modality
 */
export function filterProvidersByModality(
    providers: ProviderRegistryEntry[],
    modality: Modality
): ProviderRegistryEntry[] {
    return providers.filter(p => p.modalities.includes(modality));
}

/**
 * Get all models across all providers
 */
export function getAllModels(
    providers: ProviderRegistryEntry[]
): ModelRegistryEntry[] {
    return providers.flatMap(p => p.models);
}

/**
 * Get all models that support a specific modality
 */
export function filterModelsByModality(
    providers: ProviderRegistryEntry[],
    modality: Modality
): ModelRegistryEntry[] {
    return getAllModels(providers).filter(m => m.modalities.includes(modality));
}

/**
 * Get all models with a specific tag
 */
export function filterModelsByTag(
    providers: ProviderRegistryEntry[],
    tag: string
): ModelRegistryEntry[] {
    return getAllModels(providers).filter(m => m.tags?.includes(tag));
}

/**
 * Get recommended models (those tagged with 'recommended')
 */
export function getRecommendedModels(
    providers: ProviderRegistryEntry[]
): ModelRegistryEntry[] {
    return filterModelsByTag(providers, 'recommended');
}

/**
 * Get text models only
 */
export function getTextModels(
    providers: ProviderRegistryEntry[]
): ModelRegistryEntry[] {
    return filterModelsByModality(providers, 'text');
}

/**
 * Get image generation models only
 */
export function getImageModels(
    providers: ProviderRegistryEntry[]
): ModelRegistryEntry[] {
    return filterModelsByModality(providers, 'image');
}

/**
 * Get the cheapest model for a modality
 */
export function getCheapestModel(
    providers: ProviderRegistryEntry[],
    modality: Modality
): ModelRegistryEntry | undefined {
    const models = filterModelsByModality(providers, modality)
        .filter(m => m.priceHint)
        .sort((a, b) => {
            const costA = (a.priceHint?.inputPer1k || 0) + (a.priceHint?.outputPer1k || 0);
            const costB = (b.priceHint?.inputPer1k || 0) + (b.priceHint?.outputPer1k || 0);
            return costA - costB;
        });
    return models[0];
}

/**
 * Get the fastest model for a modality
 */
export function getFastestModel(
    providers: ProviderRegistryEntry[],
    modality: Modality
): ModelRegistryEntry | undefined {
    const models = filterModelsByModality(providers, modality)
        .filter(m => m.latencyHintMs != null)
        .sort((a, b) => (a.latencyHintMs || Infinity) - (b.latencyHintMs || Infinity));
    return models[0];
}

/**
 * Estimate cost for a given token count
 */
export function estimateCost(
    model: ModelRegistryEntry,
    inputTokens: number,
    outputTokens: number
): number | null {
    if (!model.priceHint) return null;
    return (
        (inputTokens / 1000) * model.priceHint.inputPer1k +
        (outputTokens / 1000) * model.priceHint.outputPer1k
    );
}

/**
 * Format cost as a display string
 */
export function formatCost(cost: number | null): string {
    if (cost === null) return 'Unknown';
    if (cost < 0.001) return '<$0.001';
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(3)}`;
}

/**
 * Format latency as a display string
 */
export function formatLatency(latencyMs: number | null | undefined): string {
    if (latencyMs == null) return 'Unknown';
    if (latencyMs < 1000) return `${latencyMs}ms`;
    return `${(latencyMs / 1000).toFixed(1)}s`;
}

// ============================================================================
// REACT HOOK (optional - works if React is available)
// ============================================================================

/**
 * React hook state type
 */
export interface UseProviderRegistryState {
    providers: ProviderRegistryEntry[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Create a React hook for provider registry
 * This is a factory that accepts React to avoid hard dependency
 * 
 * @example
 * const useProviderRegistry = createUseProviderRegistry(useState, useEffect, useCallback);
 */
export function createUseProviderRegistry(
    useState: <T>(initial: T) => [T, (value: T | ((prev: T) => T)) => void],
    useEffect: (effect: () => void | (() => void), deps?: any[]) => void,
    useCallback: <T extends (...args: any[]) => any>(callback: T, deps: any[]) => T
): () => UseProviderRegistryState {
    return function useProviderRegistry(): UseProviderRegistryState {
        const [providers, setProviders] = useState<ProviderRegistryEntry[]>([]);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<Error | null>(null);

        const refetch = useCallback(async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchProviderRegistry(true);
                setProviders(data.providers);
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
            } finally {
                setIsLoading(false);
            }
        }, []);

        useEffect(() => {
            // Initial fetch
            fetchProviderRegistry()
                .then(data => {
                    setProviders(data.providers);
                    setIsLoading(false);
                })
                .catch(err => {
                    setError(err instanceof Error ? err : new Error(String(err)));
                    setIsLoading(false);
                });
        }, []);

        return { providers, isLoading, error, refetch };
    };
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export type {
    ProviderRegistryResponse,
    ProviderRegistryEntry,
    ModelRegistryEntry,
    Modality,
    PriceHint
} from './types';
