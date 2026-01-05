/**
 * Smart Router v1 with Explainable Trace
 * src/lib/ai/router/smart-router.ts
 * 
 * A deterministic router that selects the optimal provider/model
 * based on task type, quality requirements, and constraints.
 * Uses metadata from Provider Registry (Module C).
 * 
 * @example
 * import { smartRouter } from './smart-router';
 * 
 * const result = smartRouter.route({
 *   taskType: 'code',
 *   quality: 'best',
 *   maxCostUsd: 0.05
 * });
 * 
 * console.log(result.selected); // { providerId: 'aimlapi', modelId: 'gpt-4o' }
 * console.log(result.trace.notes); // Human-readable explanation
 */

import {
    PROVIDER_REGISTRY,
    getProviderById,
    getModelWithProvider,
} from '../registry/provider-registry';
import {
    ProviderRegistryEntry,
    ModelRegistryEntry,
    Modality,
} from '../registry/types';

// ============================================================================
// Types
// ============================================================================

/** Supported task types for routing */
export type SmartRouterTaskType =
    | 'chat'
    | 'code'
    | 'summary'
    | 'reasoning'
    | 'image'
    | 'retrieval';

/** Quality preference levels */
export type SmartRouterQuality = 'fast' | 'balanced' | 'best';

/** Input for the smart router */
export interface SmartRouterInput {
    /** Type of task to perform */
    taskType: SmartRouterTaskType;

    /** Quality/speed tradeoff preference */
    quality: SmartRouterQuality;

    /** Optional maximum cost in USD per request */
    maxCostUsd?: number;

    /** Optional maximum latency in milliseconds */
    maxLatencyMs?: number;

    /** Optional minimum context window required */
    minContextWindow?: number;

    /** Optional list of allowed provider IDs (whitelist) */
    allowedProviders?: string[];

    /** Optional list of allowed model IDs (whitelist) */
    allowedModels?: string[];
}

/** Ranked model result with scoring details */
export interface RankedModel {
    /** Provider identifier */
    providerId: string;

    /** Model identifier */
    modelId: string;

    /** Final composite score (higher is better) */
    score: number;

    /** Human-readable reasons for this ranking */
    reasons: string[];
}

/** Routing trace for explainability */
export interface RoutingTrace {
    /** Weight configuration used for scoring */
    weights: {
        cost: number;
        latency: number;
        quality: number;
        taskMatch: number;
    };

    /** Input constraints processed */
    inputs: {
        taskType: SmartRouterTaskType;
        quality: SmartRouterQuality;
        maxCostUsd?: number;
        maxLatencyMs?: number;
        minContextWindow?: number;
        allowedProviders?: string[];
        allowedModels?: string[];
    };

    /** Human-readable notes explaining the decision */
    notes: string[];
}

/** Final router output */
export interface SmartRouterResult {
    /** The selected model */
    selected: {
        providerId: string;
        modelId: string;
    };

    /** Top 3 ranked models (fallbacks) */
    ranked: RankedModel[];

    /** Explainability trace */
    trace: RoutingTrace;
}

// ============================================================================
// Task Type to Modality Mapping
// ============================================================================

/** Map task types to required modalities */
const TASK_MODALITIES: Record<SmartRouterTaskType, Modality[]> = {
    chat: ['text'],
    code: ['code', 'text'],
    summary: ['text'],
    reasoning: ['text'],
    image: ['image'],
    retrieval: ['text'],
};

// ============================================================================
// Quality Weights Configuration
// ============================================================================

/**
 * Weight configurations based on quality preference.
 * Weights determine how much each factor contributes to the final score.
 * Higher weights = more important.
 */
const QUALITY_WEIGHTS: Record<SmartRouterQuality, {
    cost: number;
    latency: number;
    quality: number;
    taskMatch: number;
}> = {
    fast: {
        cost: 0.3,      // Less concerned about cost
        latency: 0.4,   // Prioritize speed
        quality: 0.15,  // Lower threshold for quality
        taskMatch: 0.15,
    },
    balanced: {
        cost: 0.25,
        latency: 0.25,
        quality: 0.25,
        taskMatch: 0.25,
    },
    best: {
        cost: 0.1,      // Less concerned about cost
        latency: 0.1,   // Less concerned about latency
        quality: 0.5,   // Prioritize quality
        taskMatch: 0.3,
    },
};

// ============================================================================
// Task-Model Affinity Scores
// ============================================================================

/**
 * Heuristic scores for how well certain tags/properties match task types.
 * Returns a score 0-1 indicating affinity.
 */
function getTaskAffinity(taskType: SmartRouterTaskType, model: ModelRegistryEntry): number {
    const tags = model.tags || [];

    switch (taskType) {
        case 'code':
            // Code tasks favor code-specialized models
            if (tags.includes('code')) return 1.0;
            if (model.modalities.includes('code')) return 0.9;
            if (tags.includes('reasoning')) return 0.7;
            return 0.5;

        case 'reasoning':
            // Reasoning tasks favor models with reasoning capabilities
            if (tags.includes('reasoning')) return 1.0;
            if (tags.includes('chain-of-thought')) return 0.95;
            if (tags.includes('powerful')) return 0.8;
            return 0.5;

        case 'summary':
            // Summary tasks favor balanced, fast models with good context
            if (model.contextWindow >= 100000) return 0.9;
            if (tags.includes('fast')) return 0.8;
            if (tags.includes('long-context')) return 0.85;
            return 0.6;

        case 'chat':
            // Chat tasks favor general-purpose, responsive models
            if (tags.includes('recommended')) return 0.9;
            if (tags.includes('fast')) return 0.8;
            if (tags.includes('multimodal')) return 0.75;
            return 0.6;

        case 'image':
            // Image tasks require image generation capability
            if (model.modalities.includes('image') && tags.includes('image-gen')) return 1.0;
            if (model.modalities.includes('image')) return 0.8;
            return 0;

        case 'retrieval':
            // Retrieval tasks favor models with large context windows
            if (model.contextWindow >= 200000) return 1.0;
            if (model.contextWindow >= 100000) return 0.9;
            if (tags.includes('long-context')) return 0.85;
            return 0.5;

        default:
            return 0.5;
    }
}

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculate normalized cost score (0-1, higher is cheaper/better).
 */
function calculateCostScore(model: ModelRegistryEntry, maxCostUsd?: number): number {
    if (!model.priceHint) {
        // Unknown pricing - assume middle tier
        return 0.5;
    }

    // Combined cost per 1k tokens (input + output average)
    const avgCostPer1k = (model.priceHint.inputPer1k + model.priceHint.outputPer1k) / 2;

    // Hard filter: if we have a max cost and model exceeds it significantly
    if (maxCostUsd !== undefined) {
        // Rough estimate: assume 2k tokens per request
        const estimatedCost = avgCostPer1k * 2;
        if (estimatedCost > maxCostUsd) {
            return 0.1; // Severely penalize
        }
    }

    // Normalize: $0.001/1k = score 1.0, $0.1/1k = score 0.1
    // Using logarithmic scale to handle the wide range
    // Score = 1 / (1 + log10(costPer1k * 1000))
    const normalizedCost = Math.max(0.01, Math.min(avgCostPer1k * 1000, 100));
    const score = 1 / (1 + Math.log10(normalizedCost));

    return Math.max(0, Math.min(1, score));
}

/**
 * Calculate normalized latency score (0-1, higher is faster/better).
 */
function calculateLatencyScore(model: ModelRegistryEntry, maxLatencyMs?: number): number {
    const latency = model.latencyHintMs;

    if (latency === undefined || latency === null) {
        return 0.5; // Unknown latency
    }

    // Hard filter: if we have a max latency and model exceeds it
    if (maxLatencyMs !== undefined && latency > maxLatencyMs) {
        return 0.1; // Severely penalize
    }

    // Normalize: 200ms = 1.0, 5000ms = 0.1
    // Using inverse relationship
    const score = 1 / (1 + (latency / 500));

    return Math.max(0, Math.min(1, score));
}

/**
 * Calculate quality score based on model tags and properties.
 */
function calculateQualityScore(model: ModelRegistryEntry): number {
    let score = 0.5; // Base score
    const tags = model.tags || [];

    // Boost for quality indicators
    if (tags.includes('recommended')) score += 0.25;
    if (tags.includes('powerful')) score += 0.2;
    if (tags.includes('reasoning')) score += 0.15;
    if (tags.includes('multimodal')) score += 0.1;

    // Penalty for budget indicators
    if (tags.includes('cheap')) score -= 0.1;
    if (tags.includes('legacy')) score -= 0.2;

    // Context window bonus
    if (model.contextWindow >= 1000000) score += 0.15;
    else if (model.contextWindow >= 100000) score += 0.1;
    else if (model.contextWindow >= 32000) score += 0.05;

    return Math.max(0, Math.min(1, score));
}

// ============================================================================
// Smart Router Class
// ============================================================================

export class SmartRouter {
    /**
     * Route a request to the optimal model based on input constraints.
     * Returns a deterministic result with explainability trace.
     */
    route(input: SmartRouterInput): SmartRouterResult {
        const notes: string[] = [];
        const weights = QUALITY_WEIGHTS[input.quality];

        notes.push(`Task: ${input.taskType}, Quality preference: ${input.quality}`);
        notes.push(`Weights - Cost: ${weights.cost}, Latency: ${weights.latency}, Quality: ${weights.quality}, Task Match: ${weights.taskMatch}`);

        // Get required modalities for task
        const requiredModalities = TASK_MODALITIES[input.taskType];
        notes.push(`Required modalities: ${requiredModalities.join(', ')}`);

        // Step 1: Gather all candidate models
        const candidates: Array<{ provider: ProviderRegistryEntry; model: ModelRegistryEntry }> = [];

        for (const provider of PROVIDER_REGISTRY) {
            // Filter by allowed providers
            if (input.allowedProviders && input.allowedProviders.length > 0) {
                if (!input.allowedProviders.includes(provider.id)) {
                    continue;
                }
            }

            for (const model of provider.models) {
                // Filter by allowed models
                if (input.allowedModels && input.allowedModels.length > 0) {
                    if (!input.allowedModels.includes(model.id)) {
                        continue;
                    }
                }

                // Filter by modality
                const hasRequiredModality = requiredModalities.some(m =>
                    model.modalities.includes(m)
                );
                if (!hasRequiredModality) {
                    continue;
                }

                // Filter by minimum context window
                if (input.minContextWindow && model.contextWindow < input.minContextWindow) {
                    continue;
                }

                candidates.push({ provider, model });
            }
        }

        notes.push(`Found ${candidates.length} candidate model(s) after filtering`);

        // Step 2: Handle edge cases
        if (candidates.length === 0) {
            // Fallback to a safe default
            notes.push('No candidates matched constraints, using fallback');
            const fallback = this.getFallbackModel(input.taskType);

            return {
                selected: fallback,
                ranked: [{
                    ...fallback,
                    score: 0,
                    reasons: ['Fallback selection - no models matched constraints'],
                }],
                trace: {
                    weights,
                    inputs: input,
                    notes,
                },
            };
        }

        // Step 3: Score all candidates
        const scoredCandidates: RankedModel[] = candidates.map(({ provider, model }) => {
            const costScore = calculateCostScore(model, input.maxCostUsd);
            const latencyScore = calculateLatencyScore(model, input.maxLatencyMs);
            const qualityScore = calculateQualityScore(model);
            const taskMatchScore = getTaskAffinity(input.taskType, model);

            // Weighted sum
            const finalScore =
                (costScore * weights.cost) +
                (latencyScore * weights.latency) +
                (qualityScore * weights.quality) +
                (taskMatchScore * weights.taskMatch);

            // Build reasons
            const reasons: string[] = [];

            if (taskMatchScore >= 0.8) {
                reasons.push(`Strong ${input.taskType} task affinity`);
            }
            if (qualityScore >= 0.7) {
                reasons.push('High quality model');
            }
            if (costScore >= 0.7) {
                reasons.push('Cost-effective');
            }
            if (latencyScore >= 0.7) {
                reasons.push('Low latency');
            }
            if (model.contextWindow >= 100000) {
                reasons.push(`Large context: ${(model.contextWindow / 1000).toFixed(0)}K tokens`);
            }
            if (model.tags?.includes('recommended')) {
                reasons.push('Recommended model');
            }
            if (reasons.length === 0) {
                reasons.push('Balanced all-around choice');
            }

            return {
                providerId: provider.id,
                modelId: model.id,
                score: finalScore,
                reasons,
            };
        });

        // Step 4: Sort by score (descending) - deterministic tie-breaker by modelId
        scoredCandidates.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.modelId.localeCompare(b.modelId);
        });

        // Take top 3 for fallbacks
        const ranked = scoredCandidates.slice(0, 3);
        const selected = ranked[0];

        notes.push(`Selected: ${selected.modelId} from ${selected.providerId} (score: ${selected.score.toFixed(3)})`);
        if (ranked.length > 1) {
            notes.push(`Fallback 1: ${ranked[1].modelId} (score: ${ranked[1].score.toFixed(3)})`);
        }
        if (ranked.length > 2) {
            notes.push(`Fallback 2: ${ranked[2].modelId} (score: ${ranked[2].score.toFixed(3)})`);
        }

        return {
            selected: {
                providerId: selected.providerId,
                modelId: selected.modelId,
            },
            ranked,
            trace: {
                weights,
                inputs: input,
                notes,
            },
        };
    }

    /**
     * Get a fallback model for when no candidates match constraints.
     */
    private getFallbackModel(taskType: SmartRouterTaskType): { providerId: string; modelId: string } {
        switch (taskType) {
            case 'image':
                return { providerId: 'aimlapi', modelId: 'flux-pro' };
            case 'code':
                return { providerId: 'deepseek', modelId: 'deepseek-coder' };
            case 'reasoning':
                return { providerId: 'deepseek', modelId: 'deepseek-reasoner' };
            default:
                return { providerId: 'gemini', modelId: 'gemini-2.0-flash' };
        }
    }

    /**
     * Convenience method to get the best model for a task with minimal config.
     */
    routeSimple(taskType: SmartRouterTaskType, quality: SmartRouterQuality = 'balanced'): SmartRouterResult {
        return this.route({ taskType, quality });
    }

    /**
     * Get model display name from registry.
     */
    getModelDisplayName(modelId: string): string {
        const result = getModelWithProvider(modelId);
        return result?.model.displayName || modelId;
    }

    /**
     * Get provider display name from registry.
     */
    getProviderDisplayName(providerId: string): string {
        const provider = getProviderById(providerId);
        return provider?.displayName || providerId;
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const smartRouter = new SmartRouter();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a human-readable summary of why a model was selected.
 */
export function formatRouteExplanation(result: SmartRouterResult): string {
    const { selected, ranked, trace } = result;

    const lines: string[] = [];

    // Header
    const modelName = smartRouter.getModelDisplayName(selected.modelId);
    const providerName = smartRouter.getProviderDisplayName(selected.providerId);
    lines.push(`Selected: **${modelName}** via ${providerName}`);

    // Top reasons
    const topRanked = ranked[0];
    if (topRanked && topRanked.reasons.length > 0) {
        lines.push('');
        lines.push('**Why this model:**');
        topRanked.reasons.forEach(reason => {
            lines.push(`• ${reason}`);
        });
    }

    // Alternatives
    if (ranked.length > 1) {
        lines.push('');
        lines.push('**Alternatives:**');
        ranked.slice(1).forEach((alt, idx) => {
            const altName = smartRouter.getModelDisplayName(alt.modelId);
            lines.push(`${idx + 1}. ${altName} (${(alt.score * 100).toFixed(0)}%)`);
        });
    }

    // Summary
    lines.push('');
    lines.push(`_Task: ${trace.inputs.taskType}, Quality: ${trace.inputs.quality}_`);

    return lines.join('\n');
}

/**
 * Map OutputType from Prompt Architect to SmartRouterTaskType.
 */
export function mapOutputTypeToTaskType(outputType?: string): SmartRouterTaskType {
    switch (outputType) {
        case 'code':
        case 'component':
        case 'api':
            return 'code';
        case 'image':
        case 'icon':
            return 'image';
        case 'documentation':
        case 'copy':
            return 'summary';
        case 'video':
            // No video support, fallback to chat
            return 'chat';
        default:
            return 'chat';
    }
}

/**
 * Map ArchitectMode to SmartRouterQuality.
 */
export function mapModeToQuality(mode?: string): SmartRouterQuality {
    switch (mode) {
        case 'fast':
            return 'fast';
        case 'production':
            return 'best';
        case 'precise':
        default:
            return 'balanced';
    }
}

export default smartRouter;
