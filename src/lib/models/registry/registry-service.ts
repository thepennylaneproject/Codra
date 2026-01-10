/**
 * Registry Service
 * Core service for managing the model registry.
 * Handles discovery, versioning, status transitions, and event logging.
 */

import { supabase as defaultSupabase } from '../../supabase';
import { supabaseAdmin } from '../../supabase-admin';
import { getAllAdapters } from '../adapters/adapter-registry';
import type {
    ModelRegistryRecord,
    ModelStatus,
    ModelRegistryEventType,
    DiscoveredModel,
    ModelCapabilities,
    SmokeTestResult,
    EnrichedModelRecord,
    ModelScoreSummary,
    ModelHealthSummary,
} from './registry-types';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface RegistryConfig {
    /** Number of consecutive misses before deprecating a model */
    deprecationThreshold: number;
    /** Number of days a smoke test is valid */
    smokeTestValidDays: number;
    /** Minimum overall score required for promotion */
    promotionScoreThreshold: number;
    /** Maximum error rate (0-1) allowed for promotion */
    promotionErrorRateThreshold: number;
}

const DEFAULT_CONFIG: RegistryConfig = {
    deprecationThreshold: 3,
    smokeTestValidDays: 7,
    promotionScoreThreshold: 0.6,
    promotionErrorRateThreshold: 0.1,
};

// ============================================================================
// REGISTRY SERVICE
// ============================================================================

export class RegistryService {
    private supabase: any; // Using any to avoid complex Supabase client types in this edit
    private config: RegistryConfig;

    constructor(supabaseClient?: any, config: Partial<RegistryConfig> = {}) {
        this.supabase = supabaseClient || supabaseAdmin || defaultSupabase;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // ========================================================================
    // REGISTRY REFRESH
    // ========================================================================

    /**
     * Main refresh job - discovers models from all providers and updates registry.
     * Should be run on a schedule (daily recommended).
     */
    async refreshRegistry(): Promise<{
        version: number;
        discovered: number;
        updated: number;
        deprecated: number;
        errors: string[];
    }> {
        const errors: string[] = [];
        let discovered = 0;
        let updated = 0;
        let deprecated = 0;

        // Get current registry version and increment
        const version = await this.incrementVersion();
        console.log(`Starting registry refresh v${version}`);

        // Track which models we see in this refresh
        const seenModels = new Set<string>();

        // Get all available adapters
        const adapters = getAllAdapters();
        
        if (adapters.length === 0) {
            errors.push('No adapters available - check API keys');
            return { version, discovered: 0, updated: 0, deprecated: 0, errors };
        }

        // Process each provider
        for (const adapter of adapters) {
            const providerName = adapter.providerName();
            console.log(`Processing provider: ${providerName}`);

            try {
                // List models from provider
                const models = await adapter.listModels();
                console.log(`Found ${models.length} models from ${providerName}`);

                for (const model of models) {
                    const key = `${providerName}:${model.model_key}`;
                    seenModels.add(key);

                    // Get capabilities if supported
                    let capabilities: Partial<ModelCapabilities> = {};
                    if (adapter.getCapabilities) {
                        try {
                            const capsResult = await adapter.getCapabilities(model.model_key);
                            capabilities = capsResult.capabilities;
                        } catch (e) {
                            // Capabilities fetch failed, continue with empty
                        }
                    }

                    // Upsert model
                    const result = await this.upsertModel(
                        providerName,
                        model,
                        capabilities,
                        version
                    );

                    if (result.isNew) {
                        discovered++;
                    } else {
                        updated++;
                    }

                    // Run smoke test for new models or if requested
                    if (result.isNew) {
                        try {
                            const smokeResult = await adapter.smokeTest(model.model_key);
                            await this.recordSmokeTest(
                                providerName,
                                model.model_key,
                                smokeResult
                            );
                        } catch (e) {
                            errors.push(`Smoke test failed for ${key}: ${e}`);
                        }
                    }
                }
            } catch (error: any) {
                const errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
                errors.push(`Provider ${providerName} failed: ${errorMessage}`);
            }
        }

        // Handle missing models (not seen in this refresh)
        deprecated = await this.handleMissingModels(version, seenModels);

        console.log(`Refresh complete: v${version}, ${discovered} new, ${updated} updated, ${deprecated} deprecated`);
        
        return { version, discovered, updated, deprecated, errors };
    }

    /**
     * Increment registry version and return new version number.
     */
    private async incrementVersion(): Promise<number> {
        // Get current max version
        const { data, error } = await this.supabase
            .from('model_registry')
            .select('registry_version')
            .order('registry_version', { ascending: false })
            .limit(1);

        if (error) {
            throw new Error(`Failed to fetch current version: ${error.message}`);
        }

        const currentVersion = data?.[0]?.registry_version ?? 0;
        return currentVersion + 1;
    }

    /**
     * Upsert a model into the registry.
     */
    private async upsertModel(
        provider: string,
        model: DiscoveredModel,
        capabilities: Partial<ModelCapabilities>,
        version: number
    ): Promise<{ isNew: boolean }> {
        // Check if model exists
        const { data: existing } = await this.supabase
            .from('model_registry')
            .select('id, status, capabilities_json, display_name')
            .eq('provider', provider)
            .eq('model_key', model.model_key)
            .single();

        const now = new Date().toISOString();

        if (!existing) {
            // New model - insert as candidate
            const { error } = await this.supabase
                .from('model_registry')
                .insert({
                    provider,
                    model_key: model.model_key,
                    display_name: model.display_name,
                    status: 'candidate',
                    discovered_at: now,
                    last_seen_at: now,
                    capabilities_json: capabilities,
                    meta_json: model.raw || {},
                    registry_version: version,
                });

            if (error) throw error;

            // Log discovery event
            await this.logEvent(version, 'discovered', provider, model.model_key, {
                display_name: model.display_name,
                capabilities,
            });

            return { isNew: true };
        }

        // Existing model - update
        const updates: Record<string, unknown> = {
            last_seen_at: now,
            registry_version: version,
            meta_json: model.raw || {},
        };

        // Update display name if provided and different
        if (model.display_name && model.display_name !== existing.display_name) {
            updates.display_name = model.display_name;
        }

        // Check for capability changes
        const oldCaps = existing.capabilities_json || {};
        const capsChanged = JSON.stringify(oldCaps) !== JSON.stringify(capabilities);
        if (capsChanged) {
            updates.capabilities_json = capabilities;
            await this.logEvent(version, 'changed_capabilities', provider, model.model_key, {
                old: oldCaps,
                new: capabilities,
            });
        }

        // If was deprecated, restore to candidate
        if (existing.status === 'deprecated') {
            updates.status = 'candidate';
            await this.logEvent(version, 'discovered', provider, model.model_key, {
                reason: 'Model returned after being deprecated',
            });
        }

        const { error } = await this.supabase
            .from('model_registry')
            .update(updates)
            .eq('id', existing.id);

        if (error) throw error;

        return { isNew: false };
    }

    /**
     * Handle models that weren't seen in this refresh.
     */
    private async handleMissingModels(
        version: number,
        seenModels: Set<string>
    ): Promise<number> {
        // Get all active/candidate models
        const { data: allModels } = await this.supabase
            .from('model_registry')
            .select('id, provider, model_key, status, registry_version')
            .in('status', ['active', 'candidate']);

        if (!allModels) return 0;

        let deprecatedCount = 0;

        for (const model of allModels) {
            const key = `${model.provider}:${model.model_key}`;
            
            if (!seenModels.has(key)) {
                // Model was not seen - check if should deprecate
                const missCount = version - model.registry_version;
                
                if (missCount >= this.config.deprecationThreshold) {
                    // Deprecate the model
                    await this.supabase
                        .from('model_registry')
                        .update({ status: 'deprecated' })
                        .eq('id', model.id);

                    await this.logEvent(version, 'missing', model.provider, model.model_key, {
                        reason: `Not seen for ${missCount} consecutive refreshes`,
                        last_version: model.registry_version,
                    });

                    deprecatedCount++;
                } else {
                    // Just log as missing
                    await this.logEvent(version, 'missing', model.provider, model.model_key, {
                        miss_count: missCount,
                        threshold: this.config.deprecationThreshold,
                    });
                }
            }
        }

        return deprecatedCount;
    }

    /**
     * Record smoke test result to model_health.
     */
    private async recordSmokeTest(
        provider: string,
        model_key: string,
        result: SmokeTestResult
    ): Promise<void> {
        const now = new Date();
        const windowStart = new Date(now.getTime() - 60000); // 1 minute window for smoke test

        await this.supabase.from('model_health').insert({
            provider,
            model_key,
            window_start: windowStart.toISOString(),
            window_end: now.toISOString(),
            request_count: 1,
            error_count: result.ok ? 0 : 1,
            median_latency_ms: result.latency_ms,
            p95_latency_ms: result.latency_ms,
            notes: result.ok ? 'Smoke test passed' : `Smoke test failed: ${result.error}`,
        });
    }

    // ========================================================================
    // STATUS MANAGEMENT
    // ========================================================================

    /**
     * Promote a model from candidate to active.
     * Checks health and score thresholds before promotion.
     */
    async promoteModel(
        provider: string,
        model_key: string
    ): Promise<{ success: boolean; reason: string }> {
        // Get model
        const { data: model } = await this.supabase
            .from('model_registry')
            .select('*')
            .eq('provider', provider)
            .eq('model_key', model_key)
            .single();

        if (!model) {
            return { success: false, reason: 'Model not found' };
        }

        if (model.status === 'active') {
            return { success: false, reason: 'Model is already active' };
        }

        if (model.status === 'disabled') {
            return { success: false, reason: 'Model is disabled - enable before promoting' };
        }

        // Check recent smoke test
        const smokeValid = await this.hasSmokeTestWithinDays(
            provider,
            model_key,
            this.config.smokeTestValidDays
        );

        if (!smokeValid) {
            return { 
                success: false, 
                reason: `No passing smoke test within ${this.config.smokeTestValidDays} days` 
            };
        }

        // Check recent eval scores
        const { data: scores } = await this.supabase
            .from('model_scores')
            .select('overall_score')
            .eq('provider', provider)
            .eq('model_key', model_key)
            .order('ran_at', { ascending: false })
            .limit(1);

        if (scores?.[0]) {
            const overallScore = scores[0].overall_score ?? 0;
            if (overallScore < this.config.promotionScoreThreshold) {
                return {
                    success: false,
                    reason: `Overall score ${overallScore.toFixed(2)} below threshold ${this.config.promotionScoreThreshold}`,
                };
            }
        }

        // Check error rate
        const health = await this.getHealthSummary(provider, model_key);
        if (health && health.last_24h.error_rate > this.config.promotionErrorRateThreshold) {
            return {
                success: false,
                reason: `Error rate ${(health.last_24h.error_rate * 100).toFixed(1)}% exceeds threshold`,
            };
        }

        // All checks passed - promote
        const version = await this.incrementVersion();
        
        await this.supabase
            .from('model_registry')
            .update({ status: 'active', registry_version: version })
            .eq('provider', provider)
            .eq('model_key', model_key);

        await this.logEvent(version, 'promoted', provider, model_key, {
            from_status: model.status,
        });

        return { success: true, reason: 'Model promoted to active' };
    }

    /**
     * Demote a model from active to candidate or deprecated.
     */
    async demoteModel(
        provider: string,
        model_key: string,
        reason: string,
        newStatus: 'candidate' | 'deprecated' = 'candidate'
    ): Promise<void> {
        const version = await this.incrementVersion();

        await this.supabase
            .from('model_registry')
            .update({ status: newStatus, registry_version: version })
            .eq('provider', provider)
            .eq('model_key', model_key);

        await this.logEvent(version, 'demoted', provider, model_key, {
            new_status: newStatus,
            reason,
        });
    }

    /**
     * Disable a model entirely.
     */
    async disableModel(
        provider: string,
        model_key: string,
        reason: string
    ): Promise<void> {
        const version = await this.incrementVersion();

        await this.supabase
            .from('model_registry')
            .update({ status: 'disabled', registry_version: version })
            .eq('provider', provider)
            .eq('model_key', model_key);

        await this.logEvent(version, 'disabled', provider, model_key, { reason });
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    /**
     * Get all models with specified statuses.
     */
    async getModels(
        statuses: ModelStatus[] = ['active', 'candidate']
    ): Promise<ModelRegistryRecord[]> {
        const { data, error } = await this.supabase
            .from('model_registry')
            .select('*')
            .in('status', statuses)
            .order('provider')
            .order('model_key');

        if (error) throw error;
        return data || [];
    }

    /**
     * Get active models only.
     */
    async getActiveModels(): Promise<ModelRegistryRecord[]> {
        return this.getModels(['active']);
    }

    /**
     * Get candidate models only.
     */
    async getCandidateModels(): Promise<ModelRegistryRecord[]> {
        return this.getModels(['candidate']);
    }

    /**
     * Get enriched models with health and score summaries.
     */
    async getEnrichedModels(
        statuses: ModelStatus[] = ['active', 'candidate']
    ): Promise<EnrichedModelRecord[]> {
        const models = await this.getModels(statuses);
        
        const enriched: EnrichedModelRecord[] = [];
        
        for (const model of models) {
            const health = await this.getHealthSummary(model.provider, model.model_key);
            const scores = await this.getLatestScores(model.provider, model.model_key);
            
            enriched.push({
                ...model,
                health: health || undefined,
                scores: scores || undefined,
            });
        }

        return enriched;
    }

    /**
     * Get current registry version.
     */
    async getCurrentVersion(): Promise<number> {
        const { data } = await this.supabase
            .from('model_registry')
            .select('registry_version')
            .order('registry_version', { ascending: false })
            .limit(1);

        return data?.[0]?.registry_version ?? 0;
    }

    // ========================================================================
    // HEALTH HELPERS
    // ========================================================================

    private async hasSmokeTestWithinDays(
        provider: string,
        model_key: string,
        days: number
    ): Promise<boolean> {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data } = await this.supabase
            .from('model_health')
            .select('id, error_count')
            .eq('provider', provider)
            .eq('model_key', model_key)
            .eq('error_count', 0)
            .gte('window_end', since.toISOString())
            .limit(1);

        return (data?.length ?? 0) > 0;
    }

    private async getHealthSummary(
        provider: string,
        model_key: string
    ): Promise<ModelHealthSummary | null> {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get 24h data
        const { data: recent } = await this.supabase
            .from('model_health')
            .select('request_count, error_count, median_latency_ms, p95_latency_ms')
            .eq('provider', provider)
            .eq('model_key', model_key)
            .gte('window_start', oneDayAgo.toISOString());

        // Get 7d data
        const { data: week } = await this.supabase
            .from('model_health')
            .select('request_count, error_count, median_latency_ms')
            .eq('provider', provider)
            .eq('model_key', model_key)
            .gte('window_start', sevenDaysAgo.toISOString());

        if (!recent?.length && !week?.length) {
            return null;
        }

        const sum24h = this.aggregateHealth(recent || []);
        const sum7d = this.aggregateHealth(week || []);

        return {
            provider,
            model_key,
            last_24h: sum24h,
            last_7d: sum7d,
        };
    }

    private aggregateHealth(
        records: Array<{
            request_count: number;
            error_count: number;
            median_latency_ms: number | null;
            p95_latency_ms?: number | null;
        }>
    ): {
        request_count: number;
        error_rate: number;
        median_latency_ms: number | null;
        p95_latency_ms: number | null;
    } {
        if (records.length === 0) {
            return {
                request_count: 0,
                error_rate: 0,
                median_latency_ms: null,
                p95_latency_ms: null,
            };
        }

        const totalRequests = records.reduce((sum, r) => sum + r.request_count, 0);
        const totalErrors = records.reduce((sum, r) => sum + r.error_count, 0);
        
        const latencies = records
            .map(r => r.median_latency_ms)
            .filter((l): l is number => l !== null);
        
        const p95Latencies = records
            .map(r => r.p95_latency_ms)
            .filter((l): l is number => l !== null);

        return {
            request_count: totalRequests,
            error_rate: totalRequests > 0 ? totalErrors / totalRequests : 0,
            median_latency_ms: latencies.length > 0 
                ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
                : null,
            p95_latency_ms: p95Latencies.length > 0
                ? Math.max(...p95Latencies)
                : null,
        };
    }

    private async getLatestScores(
        provider: string,
        model_key: string
    ): Promise<ModelScoreSummary | null> {
        const { data } = await this.supabase
            .from('model_scores')
            .select('*')
            .eq('provider', provider)
            .eq('model_key', model_key)
            .order('ran_at', { ascending: false })
            .limit(1);

        if (!data?.[0]) return null;

        const score = data[0];
        return {
            provider,
            model_key,
            latest_run_id: score.run_id,
            latest_ran_at: score.ran_at,
            suite_version: score.suite_version,
            coding_edit_score: score.coding_edit_score,
            tool_use_score: score.tool_use_score,
            retrieval_score: score.retrieval_score,
            json_validity_score: score.json_validity_score,
            overall_score: score.overall_score,
        };
    }

    // ========================================================================
    // EVENT LOGGING
    // ========================================================================

    private async logEvent(
        version: number,
        event_type: ModelRegistryEventType,
        provider: string,
        model_key: string,
        details: Record<string, unknown>
    ): Promise<void> {
        await this.supabase.from('model_registry_events').insert({
            registry_version: version,
            event_type,
            provider,
            model_key,
            at: new Date().toISOString(),
            details_json: details,
        });
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let registryServiceInstance: RegistryService | null = null;

export function getRegistryService(config?: Partial<RegistryConfig>): RegistryService {
    if (!registryServiceInstance) {
        registryServiceInstance = new RegistryService(config);
    }
    return registryServiceInstance;
}
