/**
 * Provider Registry Types
 * 
 * Types for the provider+model registry that exposes
 * provider/model metadata without secrets.
 */

/**
 * Modalities supported by providers/models
 */
export type Modality = 'text' | 'image' | 'video' | 'audio' | 'code' | 'vision';

/**
 * Optional price hint for cost estimation
 */
export interface PriceHint {
    /** Cost per 1k input tokens (USD) */
    inputPer1k: number;
    /** Cost per 1k output tokens (USD) */
    outputPer1k: number;
}

/**
 * Model metadata exposed to frontend
 */
export interface ModelRegistryEntry {
    /** Unique model identifier (e.g., 'gpt-4o', 'claude-3.5-sonnet') */
    id: string;
    /** Human-readable display name */
    displayName: string;
    /** Modalities this model supports */
    modalities: Modality[];
    /** Maximum context window in tokens */
    contextWindow: number;
    /** Optional pricing hint for UI cost estimations */
    priceHint?: PriceHint | null;
    /** Optional typical latency in ms for UI estimations */
    latencyHintMs?: number | null;
    /** Optional tags for filtering/categorization (e.g., 'fast', 'reasoning', 'cheap') */
    tags?: string[];
    /** The creator of the model (e.g., 'OpenAI', 'Google', 'Mistral') */
    creator: string;
}

/**
 * Provider metadata exposed to frontend
 */
export interface ProviderRegistryEntry {
    /** Unique provider identifier (e.g., 'aimlapi', 'deepseek') */
    id: string;
    /** Human-readable display name */
    displayName: string;
    /** Modalities this provider supports overall */
    modalities: Modality[];
    /** Whether this provider supports streaming responses */
    supportsStreaming: boolean;
    /** List of models available through this provider */
    models: ModelRegistryEntry[];
}

/**
 * Full registry response returned by the endpoint
 */
export interface ProviderRegistryResponse {
    providers: ProviderRegistryEntry[];
}

/**
 * Error response for registry endpoint
 */
export interface ProviderRegistryErrorResponse {
    error: string;
    code?: string;
}
