/**
 * Model Registry Types
 * TypeScript types matching the database schema
 */

// ============================================================================
// ENUM TYPES
// ============================================================================

export type ModelStatus = 'active' | 'candidate' | 'deprecated' | 'disabled';

export type ModelRegistryEventType = 
    | 'discovered'
    | 'missing'
    | 'promoted'
    | 'demoted'
    | 'disabled'
    | 'changed_capabilities';

// ============================================================================
// CAPABILITY TYPES
// ============================================================================

export interface ModelCapabilities {
    tools?: boolean;
    vision?: boolean;
    json_mode?: boolean;
    streaming?: boolean;
    function_calling?: boolean;
    max_context?: number;
    output_max_tokens?: number;
}

// ============================================================================
// DATABASE RECORD TYPES
// ============================================================================

export interface ModelRegistryRecord {
    id: string;
    provider: string;
    model_key: string;
    display_name: string | null;
    status: ModelStatus;
    discovered_at: string;
    last_seen_at: string;
    capabilities_json: ModelCapabilities;
    meta_json: Record<string, unknown>;
    registry_version: number;
    created_at: string;
    updated_at: string;
}

export interface ModelHealthRecord {
    id: string;
    provider: string;
    model_key: string;
    window_start: string;
    window_end: string;
    request_count: number;
    error_count: number;
    median_latency_ms: number | null;
    p95_latency_ms: number | null;
    notes: string | null;
    created_at: string;
}

export interface ModelScoresRecord {
    id: string;
    provider: string;
    model_key: string;
    run_id: string;
    ran_at: string;
    suite_version: string;
    coding_edit_score: number | null;
    tool_use_score: number | null;
    retrieval_score: number | null;
    json_validity_score: number | null;
    overall_score: number | null;
    details_json: Record<string, unknown>;
    created_at: string;
}

export interface ModelRegistryEventRecord {
    id: string;
    registry_version: number;
    event_type: ModelRegistryEventType;
    provider: string;
    model_key: string;
    at: string;
    details_json: Record<string, unknown>;
    created_at: string;
}

// ============================================================================
// INSERT TYPES (omit auto-generated fields)
// ============================================================================

export type ModelRegistryInsert = Omit<ModelRegistryRecord, 
    'id' | 'created_at' | 'updated_at' | 'discovered_at'
> & {
    discovered_at?: string;
};

export type ModelHealthInsert = Omit<ModelHealthRecord, 'id' | 'created_at'>;

export type ModelScoresInsert = Omit<ModelScoresRecord, 'id' | 'created_at' | 'ran_at'> & {
    ran_at?: string;
};

export type ModelRegistryEventInsert = Omit<ModelRegistryEventRecord, 'id' | 'created_at' | 'at'> & {
    at?: string;
};

// ============================================================================
// DISCOVERED MODEL (from provider adapter)
// ============================================================================

export interface DiscoveredModel {
    model_key: string;
    display_name?: string;
    capabilities?: Partial<ModelCapabilities>;
    raw?: Record<string, unknown>;
}

// ============================================================================
// SMOKE TEST RESULT
// ============================================================================

export interface SmokeTestResult {
    ok: boolean;
    latency_ms?: number;
    error?: string;
}

// ============================================================================
// HEALTH SUMMARY
// ============================================================================

export interface ModelHealthSummary {
    provider: string;
    model_key: string;
    last_24h: {
        request_count: number;
        error_rate: number;
        median_latency_ms: number | null;
        p95_latency_ms: number | null;
    };
    last_7d: {
        request_count: number;
        error_rate: number;
        median_latency_ms: number | null;
    };
}

// ============================================================================
// SCORE SUMMARY
// ============================================================================

export interface ModelScoreSummary {
    provider: string;
    model_key: string;
    latest_run_id: string;
    latest_ran_at: string;
    suite_version: string;
    coding_edit_score: number | null;
    tool_use_score: number | null;
    retrieval_score: number | null;
    json_validity_score: number | null;
    overall_score: number | null;
}

// ============================================================================
// ENRICHED MODEL (registry + health + scores)
// ============================================================================

export interface EnrichedModelRecord extends ModelRegistryRecord {
    health?: ModelHealthSummary;
    scores?: ModelScoreSummary;
}
