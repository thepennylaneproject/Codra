/**
 * Provider Registry
 * 
 * Static registry of AI providers and their models.
 * This file contains no secrets - only public metadata.
 * 
 * Admin dashboard can later edit non-secret metadata like:
 * - priceHint
 * - latencyHintMs
 * - tags
 * 
 * @example
 * import { PROVIDER_REGISTRY, getProviderById, getModelById } from './provider-registry';
 */

import { ProviderRegistryEntry, ModelRegistryEntry, Modality } from './types';

// Re-export types for external use
export type { ProviderRegistryEntry, ModelRegistryEntry, Modality };

// ============================================================================
// MODEL DEFINITIONS
// ============================================================================

const AIMLAPI_MODELS: ModelRegistryEntry[] = [
    {
        id: 'gpt-4o',
        displayName: 'GPT-4o',
        modalities: ['text', 'code', 'vision'],
        contextWindow: 128000,
        priceHint: { inputPer1k: 0.005, outputPer1k: 0.015 },
        latencyHintMs: 800,
        tags: ['fast', 'multimodal', 'recommended']
    },
    {
        id: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        modalities: ['text', 'code', 'vision'],
        contextWindow: 128000,
        priceHint: { inputPer1k: 0.01, outputPer1k: 0.03 },
        latencyHintMs: 1200,
        tags: ['powerful', 'multimodal']
    },
    {
        id: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo',
        modalities: ['text', 'code'],
        contextWindow: 16385,
        priceHint: { inputPer1k: 0.0005, outputPer1k: 0.0015 },
        latencyHintMs: 400,
        tags: ['fast', 'cheap', 'legacy']
    },
    {
        id: 'claude-3-5-sonnet-20241022',
        displayName: 'Claude 3.5 Sonnet',
        modalities: ['text', 'code', 'vision'],
        contextWindow: 200000,
        priceHint: { inputPer1k: 0.003, outputPer1k: 0.015 },
        latencyHintMs: 900,
        tags: ['reasoning', 'long-context', 'recommended']
    },
    {
        id: 'claude-3-opus-20240229',
        displayName: 'Claude 3 Opus',
        modalities: ['text', 'code', 'vision'],
        contextWindow: 200000,
        priceHint: { inputPer1k: 0.015, outputPer1k: 0.075 },
        latencyHintMs: 2000,
        tags: ['powerful', 'reasoning', 'expensive']
    },
    {
        id: 'claude-3-haiku-20240307',
        displayName: 'Claude 3 Haiku',
        modalities: ['text', 'code', 'vision'],
        contextWindow: 200000,
        priceHint: { inputPer1k: 0.00025, outputPer1k: 0.00125 },
        latencyHintMs: 300,
        tags: ['fast', 'cheap']
    },
    {
        id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        displayName: 'Llama 3.3 70B Instruct',
        modalities: ['text', 'code'],
        contextWindow: 8192,
        priceHint: { inputPer1k: 0.0007, outputPer1k: 0.0009 },
        latencyHintMs: 600,
        tags: ['open-source', 'fast']
    },
    {
        id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        displayName: 'Mixtral 8x7B',
        modalities: ['text', 'code'],
        contextWindow: 32768,
        priceHint: { inputPer1k: 0.00027, outputPer1k: 0.00027 },
        latencyHintMs: 500,
        tags: ['open-source', 'cheap', 'moe']
    },
    // Image models
    {
        id: 'flux-pro',
        displayName: 'Flux Pro',
        modalities: ['image'],
        contextWindow: 0,
        priceHint: { inputPer1k: 0, outputPer1k: 0.05 },
        latencyHintMs: 8000,
        tags: ['image-gen', 'high-quality']
    },
    {
        id: 'stable-diffusion-xl',
        displayName: 'Stable Diffusion XL',
        modalities: ['image'],
        contextWindow: 0,
        priceHint: { inputPer1k: 0, outputPer1k: 0.02 },
        latencyHintMs: 5000,
        tags: ['image-gen', 'open-source']
    }
];

const DEEPSEEK_MODELS: ModelRegistryEntry[] = [
    {
        id: 'deepseek-chat',
        displayName: 'DeepSeek Chat',
        modalities: ['text', 'code'],
        contextWindow: 64000,
        priceHint: { inputPer1k: 0.00014, outputPer1k: 0.00028 },
        latencyHintMs: 500,
        tags: ['cheap', 'fast']
    },
    {
        id: 'deepseek-coder',
        displayName: 'DeepSeek Coder',
        modalities: ['text', 'code'],
        contextWindow: 64000,
        priceHint: { inputPer1k: 0.00014, outputPer1k: 0.00028 },
        latencyHintMs: 500,
        tags: ['code', 'cheap']
    },
    {
        id: 'deepseek-reasoner',
        displayName: 'DeepSeek Reasoner (R1)',
        modalities: ['text', 'code'],
        contextWindow: 64000,
        priceHint: { inputPer1k: 0.00055, outputPer1k: 0.00219 },
        latencyHintMs: 3000,
        tags: ['reasoning', 'chain-of-thought']
    }
];

const GEMINI_MODELS: ModelRegistryEntry[] = [
    {
        id: 'gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash',
        modalities: ['text', 'code', 'vision'],
        contextWindow: 1000000,
        priceHint: { inputPer1k: 0.0001, outputPer1k: 0.0004 },
        latencyHintMs: 400,
        tags: ['fast', 'multimodal', 'cheap', 'recommended']
    },
    {
        id: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        modalities: ['text', 'code', 'vision', 'audio'],
        contextWindow: 2000000,
        priceHint: { inputPer1k: 0.00125, outputPer1k: 0.005 },
        latencyHintMs: 1000,
        tags: ['long-context', 'multimodal', 'powerful']
    },
    {
        id: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        modalities: ['text', 'code', 'vision'],
        contextWindow: 1000000,
        priceHint: { inputPer1k: 0.000075, outputPer1k: 0.0003 },
        latencyHintMs: 300,
        tags: ['fast', 'cheap', 'multimodal']
    }
];

const DEEPAI_MODELS: ModelRegistryEntry[] = [
    {
        id: 'text2img',
        displayName: 'Text to Image',
        modalities: ['image'],
        contextWindow: 0,
        priceHint: { inputPer1k: 0, outputPer1k: 0.01 },
        latencyHintMs: 4000,
        tags: ['image-gen']
    },
    {
        id: 'super-resolution',
        displayName: 'Super Resolution',
        modalities: ['image'],
        contextWindow: 0,
        priceHint: { inputPer1k: 0, outputPer1k: 0.01 },
        latencyHintMs: 3000,
        tags: ['image-enhance', 'upscale']
    },
    {
        id: 'colorizer',
        displayName: 'Colorizer',
        modalities: ['image'],
        contextWindow: 0,
        priceHint: { inputPer1k: 0, outputPer1k: 0.01 },
        latencyHintMs: 3000,
        tags: ['image-enhance']
    },
    {
        id: 'toonify',
        displayName: 'Toonify',
        modalities: ['image'],
        contextWindow: 0,
        priceHint: { inputPer1k: 0, outputPer1k: 0.01 },
        latencyHintMs: 3000,
        tags: ['image-transform', 'fun']
    }
];

// ============================================================================
// PROVIDER DEFINITIONS
// ============================================================================

/**
 * Static provider registry.
 * This is the single source of truth for provider/model metadata.
 */
export const PROVIDER_REGISTRY: ProviderRegistryEntry[] = [
    {
        id: 'aimlapi',
        displayName: 'AI/ML API',
        modalities: ['text', 'code', 'image', 'vision'],
        supportsStreaming: true,
        models: AIMLAPI_MODELS
    },
    {
        id: 'deepseek',
        displayName: 'DeepSeek',
        modalities: ['text', 'code'],
        supportsStreaming: true,
        models: DEEPSEEK_MODELS
    },
    {
        id: 'gemini',
        displayName: 'Google Gemini',
        modalities: ['text', 'code', 'vision', 'audio'],
        supportsStreaming: true,
        models: GEMINI_MODELS
    },
    {
        id: 'deepai',
        displayName: 'DeepAI',
        modalities: ['image'],
        supportsStreaming: false,
        models: DEEPAI_MODELS
    }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a provider by its ID
 */
export function getProviderById(providerId: string): ProviderRegistryEntry | undefined {
    return PROVIDER_REGISTRY.find(p => p.id === providerId);
}

/**
 * Get a model by its ID, searching across all providers
 */
export function getModelById(modelId: string): ModelRegistryEntry | undefined {
    for (const provider of PROVIDER_REGISTRY) {
        const model = provider.models.find(m => m.id === modelId);
        if (model) return model;
    }
    return undefined;
}

/**
 * Get a model and its provider by model ID
 */
export function getModelWithProvider(modelId: string): { model: ModelRegistryEntry; provider: ProviderRegistryEntry } | undefined {
    for (const provider of PROVIDER_REGISTRY) {
        const model = provider.models.find(m => m.id === modelId);
        if (model) return { model, provider };
    }
    return undefined;
}

/**
 * Filter providers by modality
 */
export function getProvidersByModality(modality: Modality): ProviderRegistryEntry[] {
    return PROVIDER_REGISTRY.filter(p => p.modalities.includes(modality));
}

/**
 * Get all models across all providers
 */
export function getAllModels(): ModelRegistryEntry[] {
    return PROVIDER_REGISTRY.flatMap(p => p.models);
}

/**
 * Get all models that support a specific modality
 */
export function getModelsByModality(modality: Modality): ModelRegistryEntry[] {
    return getAllModels().filter(m => m.modalities.includes(modality));
}

/**
 * Get all models with a specific tag
 */
export function getModelsByTag(tag: string): ModelRegistryEntry[] {
    return getAllModels().filter(m => m.tags?.includes(tag));
}

/**
 * Get recommended models (those tagged with 'recommended')
 */
export function getRecommendedModels(): ModelRegistryEntry[] {
    return getModelsByTag('recommended');
}

/**
 * Get the cheapest model for a modality
 */
export function getCheapestModel(modality: Modality): ModelRegistryEntry | undefined {
    const models = getModelsByModality(modality)
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
export function getFastestModel(modality: Modality): ModelRegistryEntry | undefined {
    const models = getModelsByModality(modality)
        .filter(m => m.latencyHintMs != null)
        .sort((a, b) => (a.latencyHintMs || Infinity) - (b.latencyHintMs || Infinity));
    return models[0];
}
