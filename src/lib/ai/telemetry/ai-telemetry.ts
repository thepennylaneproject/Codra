/**
 * AI TELEMETRY CLIENT
 * src/lib/ai/telemetry/ai-telemetry.ts
 * 
 * Client-side wrapper for AI telemetry logging.
 * Calls Netlify functions to log AI runs (when they exist).
 * 
 * NOTE: This is currently a stub/pattern for future integration.
 * There is no centralized AI execution endpoint yet, so this provides
 * the documented pattern for when such endpoints are created.
 */

import type { RoutingTrace } from '../router/smart-router';

// ============================================================
// Types
// ============================================================

export interface AITelemetryInput {
    /** Task type from Smart Router */
    taskType: string;
    /** Quality/mode preference */
    mode?: string;
    /** Whether retrieval sources were used */
    grounded: boolean;
    /** Optional workspace/project ID */
    workspaceId?: string;
    /** Smart Router routing trace for explainability */
    routingTrace?: RoutingTrace;
    /** Number of retrieval sources used (if grounded) */
    sourcesCount?: number;
    /** Provider ID selected by router */
    providerId: string;
    /** Model ID selected by router */
    modelId: string;
    /** Estimated tokens (optional) */
    estTokens?: number;
    /** Estimated cost in USD (optional) */
    estCostUsd?: number;
}

export interface AITelemetryCompleteInput {
    /** Actual prompt tokens from API response */
    promptTokens: number;
    /** Actual completion tokens from API response */
    completionTokens: number;
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
// Client Functions (Future Integration)
// ============================================================

/**
 * Log the start of an AI run with estimates.
 * Returns a run ID for later updating with actuals.
 * 
 * NOTE: This is a stub. When a centralized AI execution endpoint is created
 * (e.g., /.netlify/functions/ai_complete), it should call the server-side
 * logAIRunStart helper directly and return the runId to the client.
 * 
 * @param input - AI run start metadata
 * @returns Promise<string | null> - Run ID or null if failed
 */
export async function logAIRunStart(input: AITelemetryInput): Promise<string | null> {
    try {
        // TODO: When AI execution endpoint exists, this should call:
        // POST /.netlify/functions/ai_complete (or similar)
        // Which internally calls telemetry-helpers.logAIRunStart()

        console.log('[AI Telemetry] Stub: Would log AI run start', input);

        // For now, return a mock run ID
        return crypto.randomUUID();
    } catch (err) {
        console.error('[AI Telemetry] Failed to log AI run start:', err);
        return null;
    }
}

/**
 * Update an AI run with actual completion metrics.
 * 
 * NOTE: This is a stub. The AI execution endpoint should handle this
 * server-side after receiving the API response.
 * 
 * @param runId - The run ID from logAIRunStart
 * @param input - Actual completion metrics
 * @returns Promise<void>
 */
export async function logAIRunComplete(
    runId: string,
    input: AITelemetryCompleteInput
): Promise<void> {
    try {
        // TODO: When AI execution endpoint exists, this should be handled
        // server-side after the AI API call completes

        console.log('[AI Telemetry] Stub: Would log AI run completion', { runId, ...input });
    } catch (err) {
        console.error('[AI Telemetry] Failed to log AI run completion:', err);
    }
}

// ============================================================
// Integration Pattern Documentation
// ============================================================

/**
 * INTEGRATION PATTERN FOR FUTURE AI ENDPOINTS:
 * 
 * When creating a centralized AI execution function (e.g., netlify/functions/ai_complete.ts):
 * 
 * 1. Import server-side helpers:
 *    import { logAIRunStart, logAIRunComplete } from './utils/telemetry-helpers';
 * 
 * 2. Before making the AI API call:
 *    const runId = await logAIRunStart({
 *      userId: extractedUserId,
 *      workspaceId: request.body.workspaceId,
 *      taskType: request.body.taskType,
 *      providerId: selectedProvider,
 *      modelId: selectedModel,
 *      estTokens: estimatedTokens,
 *      estCostUsd: calculateEstimatedCost(modelId, estimatedTokens),
 *      traceJson: routingTrace,
 *      // ... other params
 *    });
 * 
 * 3. After receiving AI API response:
 *    if (runId) {
 *      await logAIRunComplete(runId, {
 *        actualPromptTokens: response.usage.prompt_tokens,
 *        actualCompletionTokens: response.usage.completion_tokens,
 *        actualCostUsd: calculateActualCost(modelId, response.usage.prompt_tokens, response.usage.completion_tokens),
 *        latencyMs: Date.now() - startTime,
 *        success: true,
 *      });
 *    }
 * 
 * 4. On error:
 *    if (runId) {
 *      await logAIRunComplete(runId, {
 *        actualPromptTokens: 0,
 *        actualCompletionTokens: 0,
 *        latencyMs: Date.now() - startTime,
 *        success: false,
 *        errorCode: 'RATE_LIMIT', // or 'TIMEOUT', 'INVALID_KEY', etc.
 *        errorMessageSafe: 'Rate limit exceeded',
 *      });
 *    }
 * 
 * IMPORTANT:
 * - All logging should be server-side to prevent client tampering
 * - Use fire-and-forget pattern (don't block on telemetry)
 * - Safe error messages only (no internal details)
 * - Calculate costs server-side using provider registry
 */
