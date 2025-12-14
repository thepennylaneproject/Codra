/**
 * Provider Registry Module
 * 
 * Provides a type-safe provider+model registry for the frontend
 * without exposing API secrets.
 * 
 * @example
 * // Import registry & helpers (server-side or static)
 * import { PROVIDER_REGISTRY, getProviderById, getModelById } from '@/lib/ai/registry';
 * 
 * // Import client helpers (frontend fetch)
 * import { fetchProviderRegistry, useProviderRegistry } from '@/lib/ai/registry/client';
 * 
 * // Import types
 * import type { ProviderRegistryEntry, ModelRegistryEntry } from '@/lib/ai/registry';
 */

// Types
export type {
    Modality,
    PriceHint,
    ModelRegistryEntry,
    ProviderRegistryEntry,
    ProviderRegistryResponse,
    ProviderRegistryErrorResponse
} from './types';

// Static registry & helpers
export {
    PROVIDER_REGISTRY,
    getProviderById,
    getModelById,
    getModelWithProvider,
    getProvidersByModality,
    getAllModels,
    getModelsByModality,
    getModelsByTag,
    getRecommendedModels,
    getCheapestModel,
    getFastestModel
} from './provider-registry';
