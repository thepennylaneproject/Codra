/**
 * TELEMETRY HELPERS
 * netlify/functions/utils/telemetry-helpers.ts
 * 
 * Server-side utilities for logging AI runs and retrieval searches to Supabase.
 * Uses service role key to bypass RLS for system-level logging.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { getModelWithProvider } from '../../../src/lib/ai/registry/provider-registry';
import type { RoutingTrace } from '../../../src/lib/ai/router/smart-router';

// ============================================================
// Supabase Service Client (lazy — avoids import-time env in tests / scripts)
// ============================================================

let supabaseService: SupabaseClient | null = null;

function getSupabaseService(): SupabaseClient {
    if (!supabaseService) {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for telemetry');
        }
        supabaseService = createClient(url, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    return supabaseService;
}

// ============================================================
// Types
// ============================================================

export interface RetrievalRunParams {
    userId: string | null;
    workspaceId?: string | null;
    providerUsed: 'brave' | 'tavily';
    query: string;
    resultsCount: number;
    latencyMs: number;
    success: boolean;
    errorMessageSafe?: string;
}

export interface AIRunStartParams {
    userId: string | null;
    workspaceId?: string | null;
    taskType: string;
    mode?: string;
    grounded: boolean;
    providerId: string;
    modelId: string;
    estTokens?: number;
    estCostUsd?: number;
    traceJson?: RoutingTrace;
    sourcesCount?: number;
}

export interface AIRunCompleteParams {
    actualPromptTokens: number;
    actualCompletionTokens: number;
    actualCostUsd?: number;
    latencyMs: number;
    success: boolean;
    errorCode?: string;
    errorMessageSafe?: string;
}

// ============================================================
// Retrieval Telemetry
// ============================================================

/**
 * Log a retrieval search run to Supabase.
 * 
 * @param params - Retrieval run metadata
 * @returns Promise<void>
 */
export async function logRetrievalRun(params: RetrievalRunParams): Promise<void> {
    try {
        const queryHash = hashQuery(params.query);

        const { error } = await getSupabaseService()
            .from('retrieval_runs')
            .insert({
                user_id: params.userId,
                workspace_id: params.workspaceId,
                provider_used: params.providerUsed,
                query_hash: queryHash,
                results_count: params.resultsCount,
                latency_ms: params.latencyMs,
                success: params.success,
                error_message_safe: params.errorMessageSafe,
            });

        if (error) {
            console.error('[Telemetry] Failed to log retrieval run:', error);
        }
    } catch (err) {
        // Don't throw - telemetry failures should not break the main flow
        console.error('[Telemetry] Exception logging retrieval run:', err);
    }
}

/**
 * Hash a query string using SHA-256.
 * Used for deduplication and analytics while preserving privacy.
 * 
 * @param query - The search query
 * @returns Hex-encoded SHA-256 hash
 */
export function hashQuery(query: string): string {
    return createHash('sha256')
        .update(query.toLowerCase().trim())
        .digest('hex');
}

// ============================================================
// AI Telemetry
// ============================================================

/**
 * Log the start of an AI run with estimates.
 * Returns the run ID for later updating with actuals.
 * 
 * @param params - AI run start metadata
 * @returns Promise<string | null> - Run ID or null if failed
 */
export async function logAIRunStart(params: AIRunStartParams): Promise<string | null> {
    try {
        const { data, error } = await getSupabaseService()
            .from('ai_runs')
            .insert({
                user_id: params.userId,
                workspace_id: params.workspaceId,
                task_type: params.taskType,
                mode: params.mode,
                grounded: params.grounded,
                provider_id: params.providerId,
                model_id: params.modelId,
                est_tokens: params.estTokens,
                est_cost_usd: params.estCostUsd,
                trace_json: params.traceJson,
                sources_count: params.sourcesCount,
                success: true, // Optimistic - will be updated on completion
            })
            .select('id')
            .single();

        if (error) {
            console.error('[Telemetry] Failed to log AI run start:', error);
            return null;
        }

        return data?.id || null;
    } catch (err) {
        console.error('[Telemetry] Exception logging AI run start:', err);
        return null;
    }
}

/**
 * Update an AI run with actual completion metrics.
 * 
 * @param runId - The AI run ID from logAIRunStart
 * @param params - Actual completion metrics
 * @returns Promise<void>
 */
export async function logAIRunComplete(
    runId: string,
    params: AIRunCompleteParams
): Promise<void> {
    try {
        const { error } = await getSupabaseService()
            .from('ai_runs')
            .update({
                actual_prompt_tokens: params.actualPromptTokens,
                actual_completion_tokens: params.actualCompletionTokens,
                actual_cost_usd: params.actualCostUsd,
                latency_ms: params.latencyMs,
                success: params.success,
                error_code: params.errorCode,
                error_message_safe: params.errorMessageSafe,
                completed_at: new Date().toISOString(),
            })
            .eq('id', runId);

        if (error) {
            console.error('[Telemetry] Failed to log AI run completion:', error);
        }
    } catch (err) {
        console.error('[Telemetry] Exception logging AI run completion:', err);
    }
}

// ============================================================
// Cost Calculation
// ============================================================

/**
 * Calculate estimated cost based on model pricing from provider registry.
 * 
 * @param modelId - Model identifier
 * @param estimatedPromptTokens - Estimated prompt tokens
 * @param estimatedCompletionTokens - Estimated completion tokens
 * @returns Estimated cost in USD or null if pricing unavailable
 */
export function calculateEstimatedCost(
    modelId: string,
    estimatedPromptTokens: number,
    estimatedCompletionTokens: number = 0
): number | null {
    const result = getModelWithProvider(modelId);

    if (!result?.model.priceHint) {
        return null;
    }

    const { inputPer1k, outputPer1k } = result.model.priceHint;

    const promptCost = (estimatedPromptTokens / 1000) * inputPer1k;
    const completionCost = (estimatedCompletionTokens / 1000) * outputPer1k;

    return promptCost + completionCost;
}

/**
 * Calculate actual cost from token usage and model pricing.
 * 
 * @param modelId - Model identifier
 * @param promptTokens - Actual prompt tokens
 * @param completionTokens - Actual completion tokens
 * @returns Actual cost in USD or null if pricing unavailable
 */
export function calculateActualCost(
    modelId: string,
    promptTokens: number,
    completionTokens: number
): number | null {
    return calculateEstimatedCost(modelId, promptTokens, completionTokens);
}

// ============================================================
// User Extraction
// ============================================================

/**
 * Extract user ID from Netlify event headers (if authenticated).
 * Returns null for anonymous requests.
 * 
 * @param event - Netlify function event
 * @returns User ID or null
 */
export function extractUserId(event: any): string | null {
    // Check for Authorization header with JWT
    const authHeader = event.headers.authorization || event.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    // This is a simplified extraction
    // In production, you'd want to verify the JWT with Supabase
    // For now, telemetry can work with anonymous users (user_id = null)

    // TODO: Implement JWT verification if needed
    // For now, we'll rely on client passing user context or use null

    return null;
}
