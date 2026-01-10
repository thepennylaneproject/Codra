/**
 * Policy Router
 * Selects the best model for a request based on task constraints,
 * capabilities, scores, and health metrics.
 */

import { supabase } from '../../supabase';
import type {
    ModelRegistryRecord,
    ModelCapabilities,
    ModelScoreSummary,
    ModelHealthSummary,
} from '../registry/registry-types';

// ============================================================================
// TYPES
// ============================================================================

export type TaskType =
    | 'debate'
    | 'refactor'
    | 'summarize'
    | 'extract'
    | 'classify'
    | 'generate_assets'
    | 'code_completion'
    | 'code_review'
    | 'chat'
    | 'general';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RoutingRequest {
    taskType: TaskType;
    needsTools?: boolean;
    needsVision?: boolean;
    needsJson?: boolean;
    minContextTokens?: number;
    maxCredits?: number;
    latencyBudgetMs?: number;
    riskLevel?: RiskLevel;
}

export interface RoutingDecision {
    provider: string;
    model_key: string;
    reason: string;
    scores_used: Record<string, number | null>;
    fallback?: {
        provider: string;
        model_key: string;
    };
    verifier?: {
        provider: string;
        model_key: string;
    };
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

interface ScoredModel {
    model: ModelRegistryRecord;
    capabilities: ModelCapabilities;
    scores: ModelScoreSummary | null;
    health: ModelHealthSummary | null;
    routingScore: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface RoutingConfig {
    /** Penalty for unknown capabilities (0-1) */
    unknownCapabilityPenalty: number;
    /** Weight for eval scores vs health */
    scoreWeight: number;
    /** Maximum acceptable error rate */
    maxErrorRate: number;
    /** Maximum acceptable P95 latency */
    maxP95LatencyMs: number;
}

const DEFAULT_CONFIG: RoutingConfig = {
    unknownCapabilityPenalty: 0.1,
    scoreWeight: 0.7,
    maxErrorRate: 0.15,
    maxP95LatencyMs: 30000,
};

// ============================================================================
// TASK TO SCORE MAPPING
// ============================================================================

const TASK_SCORE_WEIGHTS: Record<TaskType, Record<string, number>> = {
    debate: { overall: 0.4, tool_use: 0.3, coding_edit: 0.3 },
    refactor: { coding_edit: 0.6, overall: 0.2, json_validity: 0.2 },
    summarize: { overall: 0.5, retrieval: 0.5 },
    extract: { retrieval: 0.6, json_validity: 0.2, overall: 0.2 },
    classify: { overall: 0.5, json_validity: 0.5 },
    generate_assets: { overall: 0.7, json_validity: 0.3 },
    code_completion: { coding_edit: 0.7, overall: 0.3 },
    code_review: { coding_edit: 0.5, overall: 0.3, tool_use: 0.2 },
    chat: { overall: 0.8, tool_use: 0.2 },
    general: { overall: 1.0 },
};

// ============================================================================
// POLICY ROUTER
// ============================================================================

/**
 * Select the best model for a request.
 */
export async function selectModel(
    request: RoutingRequest,
    config: Partial<RoutingConfig> = {}
): Promise<RoutingDecision> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    // Get all active models with scores and health
    const candidates = await getCandidateModels(cfg);

    if (candidates.length === 0) {
        throw new Error('No active models available');
    }

    // Filter by capability requirements
    let filtered = filterByCapabilities(candidates, request, cfg);

    // If no models match strict requirements, try allowing unknowns
    if (filtered.length === 0) {
        filtered = filterByCapabilities(candidates, request, cfg, true);
    }

    if (filtered.length === 0) {
        throw new Error('No models match the required capabilities');
    }

    // Score models based on task type
    const scored = scoreModels(filtered, request);

    // Sort by routing score (descending)
    scored.sort((a, b) => b.routingScore - a.routingScore);

    // Select primary model
    const primary = scored[0];

    // Build reason string
    const reason = buildReason(primary, request);

    // Select fallback (different provider if possible)
    const fallback = selectFallback(scored, primary);

    // For high-risk, select verifier
    let verifier: { provider: string; model_key: string } | undefined;
    if (request.riskLevel === 'high') {
        verifier = selectVerifier(scored, primary);
    }

    return {
        provider: primary.model.provider,
        model_key: primary.model.model_key,
        reason,
        scores_used: {
            overall: primary.scores?.overall_score ?? null,
            coding_edit: primary.scores?.coding_edit_score ?? null,
            tool_use: primary.scores?.tool_use_score ?? null,
            retrieval: primary.scores?.retrieval_score ?? null,
            json_validity: primary.scores?.json_validity_score ?? null,
            routing_score: primary.routingScore,
        },
        fallback,
        verifier,
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getCandidateModels(cfg: RoutingConfig): Promise<ScoredModel[]> {
    // Get active models
    const { data: models } = await supabase
        .from('model_registry')
        .select('*')
        .eq('status', 'active');

    if (!models || models.length === 0) {
        // Fall back to candidates if no active models
        const { data: candidates } = await supabase
            .from('model_registry')
            .select('*')
            .eq('status', 'candidate');
        
        if (!candidates || candidates.length === 0) {
            return [];
        }

        return enrichModels(candidates, cfg);
    }

    return enrichModels(models, cfg);
}

async function enrichModels(
    models: ModelRegistryRecord[],
    cfg: RoutingConfig
): Promise<ScoredModel[]> {
    const result: ScoredModel[] = [];

    for (const model of models) {
        // Get latest scores
        const { data: scoresData } = await supabase
            .from('model_scores')
            .select('*')
            .eq('provider', model.provider)
            .eq('model_key', model.model_key)
            .order('ran_at', { ascending: false })
            .limit(1);

        const scores: ModelScoreSummary | null = scoresData?.[0] ? {
            provider: model.provider,
            model_key: model.model_key,
            latest_run_id: scoresData[0].run_id,
            latest_ran_at: scoresData[0].ran_at,
            suite_version: scoresData[0].suite_version,
            coding_edit_score: scoresData[0].coding_edit_score,
            tool_use_score: scoresData[0].tool_use_score,
            retrieval_score: scoresData[0].retrieval_score,
            json_validity_score: scoresData[0].json_validity_score,
            overall_score: scoresData[0].overall_score,
        } : null;

        // Get recent health
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: healthData } = await supabase
            .from('model_health')
            .select('request_count, error_count, median_latency_ms, p95_latency_ms')
            .eq('provider', model.provider)
            .eq('model_key', model.model_key)
            .gte('window_start', oneDayAgo);

        let health: ModelHealthSummary | null = null;
        if (healthData && healthData.length > 0) {
            const totalRequests = healthData.reduce((sum, r) => sum + r.request_count, 0);
            const totalErrors = healthData.reduce((sum, r) => sum + r.error_count, 0);
            const latencies = healthData.map(r => r.median_latency_ms).filter(l => l !== null) as number[];
            const p95Latencies = healthData.map(r => r.p95_latency_ms).filter(l => l !== null) as number[];

            health = {
                provider: model.provider,
                model_key: model.model_key,
                last_24h: {
                    request_count: totalRequests,
                    error_rate: totalRequests > 0 ? totalErrors / totalRequests : 0,
                    median_latency_ms: latencies.length > 0
                        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
                        : null,
                    p95_latency_ms: p95Latencies.length > 0
                        ? Math.max(...p95Latencies)
                        : null,
                },
                last_7d: {
                    request_count: 0, // Not fetching 7d for routing
                    error_rate: 0,
                    median_latency_ms: null,
                },
            };
        }

        // Check health thresholds
        if (health && health.last_24h.error_rate > cfg.maxErrorRate) {
            continue; // Skip unhealthy models
        }

        if (health && health.last_24h.p95_latency_ms && 
            health.last_24h.p95_latency_ms > cfg.maxP95LatencyMs) {
            continue; // Skip slow models
        }

        result.push({
            model,
            capabilities: (model.capabilities_json || {}) as ModelCapabilities,
            scores,
            health,
            routingScore: 0, // Will be calculated later
        });
    }

    return result;
}

function filterByCapabilities(
    models: ScoredModel[],
    request: RoutingRequest,
    _cfg: RoutingConfig,
    allowUnknown = false
): ScoredModel[] {
    return models.filter(m => {
        const caps = m.capabilities;

        // Check tools requirement
        if (request.needsTools) {
            if (caps.tools !== true && !allowUnknown) return false;
        }

        // Check vision requirement
        if (request.needsVision) {
            if (caps.vision !== true && !allowUnknown) return false;
        }

        // Check JSON mode requirement
        if (request.needsJson) {
            if (caps.json_mode !== true && !allowUnknown) return false;
        }

        // Check context window
        if (request.minContextTokens) {
            const maxContext = caps.max_context ?? 4096;
            if (maxContext < request.minContextTokens) return false;
        }

        // Check latency budget
        if (request.latencyBudgetMs && m.health?.last_24h.median_latency_ms) {
            if (m.health.last_24h.median_latency_ms > request.latencyBudgetMs) {
                return false;
            }
        }

        return true;
    });
}

function scoreModels(
    models: ScoredModel[],
    request: RoutingRequest
): ScoredModel[] {
    const weights = TASK_SCORE_WEIGHTS[request.taskType] || TASK_SCORE_WEIGHTS.general;

    return models.map(m => {
        let routingScore = 0;

        if (m.scores) {
            // Calculate weighted score based on task type
            for (const [scoreType, weight] of Object.entries(weights)) {
                let score = 0;
                switch (scoreType) {
                    case 'overall':
                        score = m.scores.overall_score ?? 0.5;
                        break;
                    case 'coding_edit':
                        score = m.scores.coding_edit_score ?? 0.5;
                        break;
                    case 'tool_use':
                        score = m.scores.tool_use_score ?? 0.5;
                        break;
                    case 'retrieval':
                        score = m.scores.retrieval_score ?? 0.5;
                        break;
                    case 'json_validity':
                        score = m.scores.json_validity_score ?? 0.5;
                        break;
                }
                routingScore += score * weight;
            }
        } else {
            // No scores - use default
            routingScore = 0.5;
        }

        // Add health bonus (lower error rate = better)
        if (m.health) {
            const healthBonus = (1 - m.health.last_24h.error_rate) * 0.1;
            routingScore += healthBonus;
        }

        // Penalize for unknown capabilities if required
        if (request.needsTools && m.capabilities.tools === undefined) {
            routingScore -= 0.1;
        }
        if (request.needsVision && m.capabilities.vision === undefined) {
            routingScore -= 0.1;
        }

        return { ...m, routingScore };
    });
}

function buildReason(model: ScoredModel, request: RoutingRequest): string {
    const parts: string[] = [];

    parts.push(`Best match for ${request.taskType}`);

    if (model.scores?.overall_score) {
        parts.push(`overall=${model.scores.overall_score.toFixed(2)}`);
    }

    if (request.taskType === 'refactor' && model.scores?.coding_edit_score) {
        parts.push(`coding=${model.scores.coding_edit_score.toFixed(2)}`);
    }

    if (request.needsTools && model.scores?.tool_use_score) {
        parts.push(`tools=${model.scores.tool_use_score.toFixed(2)}`);
    }

    if (model.health?.last_24h) {
        const h = model.health.last_24h;
        if (h.median_latency_ms) {
            parts.push(`latency=${h.median_latency_ms.toFixed(0)}ms`);
        }
        parts.push(`errors=${(h.error_rate * 100).toFixed(1)}%`);
    }

    return parts.join(', ');
}

function selectFallback(
    models: ScoredModel[],
    primary: ScoredModel
): { provider: string; model_key: string } | undefined {
    // Try to find a model from a different provider
    const differentProvider = models.find(
        m => m.model.provider !== primary.model.provider && 
             m.model.model_key !== primary.model.model_key
    );

    if (differentProvider) {
        return {
            provider: differentProvider.model.provider,
            model_key: differentProvider.model.model_key,
        };
    }

    // Fall back to second best from same provider
    const secondBest = models.find(
        m => m.model.model_key !== primary.model.model_key
    );

    if (secondBest) {
        return {
            provider: secondBest.model.provider,
            model_key: secondBest.model.model_key,
        };
    }

    return undefined;
}

function selectVerifier(
    models: ScoredModel[],
    primary: ScoredModel
): { provider: string; model_key: string } | undefined {
    // For high-risk tasks, prefer a model from a different provider
    // with high overall score
    const candidates = models
        .filter(m => m.model.provider !== primary.model.provider)
        .sort((a, b) => (b.scores?.overall_score ?? 0) - (a.scores?.overall_score ?? 0));

    if (candidates.length > 0) {
        return {
            provider: candidates[0].model.provider,
            model_key: candidates[0].model.model_key,
        };
    }

    // Fall back to a different model from same provider
    const fallback = models.find(
        m => m.model.model_key !== primary.model.model_key
    );

    if (fallback) {
        return {
            provider: fallback.model.provider,
            model_key: fallback.model.model_key,
        };
    }

    return undefined;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { selectModel as routeRequest };
