/**
 * TELEMETRY TYPES
 * src/lib/ai/types-telemetry.ts
 * 
 * TypeScript types for telemetry data structures.
 * Matches Supabase table schemas for ai_runs and retrieval_runs.
 */

import type { RoutingTrace } from './router/smart-router';

// ============================================================
// Table Records (Database Schema)
// ============================================================

export interface AIRunRecord {
    id: string;
    user_id: string | null;
    workspace_id: string | null;

    // Request context
    task_type: string;
    mode: string | null;
    grounded: boolean;

    // Execution details
    provider_id: string;
    model_id: string;

    // Cost estimates
    est_tokens: number | null;
    est_cost_usd: number | null;

    // Actual usage
    actual_prompt_tokens: number | null;
    actual_completion_tokens: number | null;
    actual_cost_usd: number | null;

    // Performance
    latency_ms: number | null;
    success: boolean;

    // Errors
    error_code: string | null;
    error_message_safe: string | null;

    // Routing trace
    trace_json: RoutingTrace | null;

    // Grounding
    sources_count: number | null;

    // Timestamps
    created_at: string;
    completed_at: string | null;
}

export interface RetrievalRunRecord {
    id: string;
    user_id: string | null;
    workspace_id: string | null;
    provider_used: 'brave' | 'tavily';
    query_hash: string;
    results_count: number;
    latency_ms: number | null;
    success: boolean;
    error_message_safe: string | null;
    created_at: string;
}

// ============================================================
// Logging Parameters (For Application Code)
// ============================================================

export interface LogAIRunStartParams {
    /** User ID (null for anonymous) */
    userId: string | null;
    /** Optional workspace/project context */
    workspaceId?: string | null;
    /** Task type from Smart Router */
    taskType: string;
    /** Quality/mode preference */
    mode?: string;
    /** Whether retrieval sources were used */
    grounded: boolean;
    /** Provider ID (e.g., 'aimlapi', 'deepseek') */
    providerId: string;
    /** Model ID (e.g., 'gpt-4o', 'claude-3-5-sonnet') */
    modelId: string;
    /** Estimated total tokens (optional) */
    estTokens?: number;
    /** Estimated cost in USD (optional) */
    estCostUsd?: number;
    /** Smart Router routing trace */
    traceJson?: RoutingTrace;
    /** Number of retrieval sources used */
    sourcesCount?: number;
}

export interface LogAIRunCompleteParams {
    /** Actual prompt tokens from API response */
    actualPromptTokens: number;
    /** Actual completion tokens from API response */
    actualCompletionTokens: number;
    /** Actual cost calculated from tokens */
    actualCostUsd?: number;
    /** Request latency in milliseconds */
    latencyMs: number;
    /** Whether the request succeeded */
    success: boolean;
    /** Error code if failed */
    errorCode?: string;
    /** Safe error message for display */
    errorMessageSafe?: string;
}

// ============================================================
// Analytics Query Results (For Admin Dashboard)
// ============================================================

export interface CostAnalytics {
    totalCost: number;
    estimatedVsActualDelta: number;
    costByProvider: Record<string, number>;
    costByModel: Record<string, number>;
    costByWorkspace: Record<string, number>;
}

export interface PerformanceAnalytics {
    avgLatencyMs: number;
    p95LatencyMs: number;
    successRate: number;
    errorsByCode: Record<string, number>;
}

export interface UsageAnalytics {
    totalRuns: number;
    totalTokens: number;
    runsByTaskType: Record<string, number>;
    runsByProvider: Record<string, number>;
}
