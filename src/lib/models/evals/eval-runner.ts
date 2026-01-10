/**
 * Eval Runner
 * Executes evaluation fixtures against models and persists scores.
 */

import { supabase as defaultSupabase } from '../../supabase';
import { supabaseAdmin } from '../../supabase-admin';
import { validateOutput, calculateScore, type Validator } from './validators';
import { getRegistryService } from '../registry/registry-service';
import type { ModelRegistryRecord } from '../registry/registry-types';

// Import fixtures
import codingEditFixtures from './fixtures/coding_edit.json';
import toolUseFixtures from './fixtures/tool_use.json';
import retrievalFixtures from './fixtures/retrieval.json';
import jsonValidityFixtures from './fixtures/json_validity.json';

// ============================================================================
// TYPES
// ============================================================================

export interface EvalFixture {
    id: string;
    name: string;
    prompt: string;
    context?: string;
    expected?: string;
    validators: Validator[];
}

export interface EvalResult {
    fixture_id: string;
    passed: boolean;
    score: number;
    latency_ms: number;
    output?: string;
    error?: string;
    validation_details: Array<{
        validator_type: string;
        passed: boolean;
        message: string;
    }>;
}

export interface SuiteResult {
    suite_name: string;
    score: number;
    results: EvalResult[];
}

export interface ModelEvalResult {
    provider: string;
    model_key: string;
    run_id: string;
    ran_at: string;
    suite_version: string;
    coding_edit_score: number | null;
    tool_use_score: number | null;
    retrieval_score: number | null;
    json_validity_score: number | null;
    overall_score: number;
    details: Record<string, SuiteResult>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface EvalConfig {
    /** Maximum time to wait for a model response (ms) */
    timeoutMs: number;
    /** Current suite version for tracking */
    suiteVersion: string;
    /** AI completion endpoint */
    completionEndpoint: string;
}

const DEFAULT_CONFIG: EvalConfig = {
    timeoutMs: 60000,
    suiteVersion: '1.0.0',
    completionEndpoint: '/.netlify/functions/api/ai/complete',
};

// ============================================================================
// EVAL RUNNER
// ============================================================================

export class EvalRunner {
    private supabase: any;
    private config: EvalConfig;

    constructor(supabaseClient?: any, config: Partial<EvalConfig> = {}) {
        this.supabase = supabaseClient || supabaseAdmin || defaultSupabase;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Run all evaluations for all active/candidate models.
     */
    async runAllModels(): Promise<ModelEvalResult[]> {
        const registryService = getRegistryService();
        const models = await registryService.getModels(['active', 'candidate']);
        
        const results: ModelEvalResult[] = [];
        
        for (const model of models) {
            try {
                const result = await this.runModel(model);
                results.push(result);
            } catch (error) {
                console.error(`Failed to eval ${model.provider}:${model.model_key}:`, error);
            }
        }

        return results;
    }

    /**
     * Run all evaluations for a specific model.
     */
    async runModel(model: ModelRegistryRecord): Promise<ModelEvalResult> {
        const run_id = `eval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const ran_at = new Date().toISOString();

        console.log(`Running evals for ${model.provider}:${model.model_key}`);

        // Run each suite
        const codingResult = await this.runSuite(
            'coding_edit',
            codingEditFixtures as EvalFixture[],
            model
        );

        const toolUseResult = await this.runSuite(
            'tool_use',
            toolUseFixtures as EvalFixture[],
            model
        );

        const retrievalResult = await this.runSuite(
            'retrieval',
            retrievalFixtures as EvalFixture[],
            model
        );

        const jsonValidityResult = await this.runSuite(
            'json_validity',
            jsonValidityFixtures as EvalFixture[],
            model
        );

        // Calculate overall score (weighted average)
        const scores = [
            codingResult.score,
            toolUseResult.score,
            retrievalResult.score,
            jsonValidityResult.score,
        ].filter(s => !isNaN(s));
        
        const overall_score = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;

        const result: ModelEvalResult = {
            provider: model.provider,
            model_key: model.model_key,
            run_id,
            ran_at,
            suite_version: this.config.suiteVersion,
            coding_edit_score: codingResult.score,
            tool_use_score: toolUseResult.score,
            retrieval_score: retrievalResult.score,
            json_validity_score: jsonValidityResult.score,
            overall_score,
            details: {
                coding_edit: codingResult,
                tool_use: toolUseResult,
                retrieval: retrievalResult,
                json_validity: jsonValidityResult,
            },
        };

        // Persist to database
        await this.persistResult(result);

        return result;
    }

    /**
     * Run a specific eval suite against a model.
     */
    private async runSuite(
        suite_name: string,
        fixtures: EvalFixture[],
        model: ModelRegistryRecord
    ): Promise<SuiteResult> {
        const results: EvalResult[] = [];

        for (const fixture of fixtures) {
            const result = await this.runFixture(fixture, model);
            results.push(result);
        }

        // Calculate suite score
        const passed = results.filter(r => r.passed).length;
        const score = fixtures.length > 0 ? passed / fixtures.length : 0;

        return { suite_name, score, results };
    }

    /**
     * Run a single fixture against a model.
     */
    private async runFixture(
        fixture: EvalFixture,
        model: ModelRegistryRecord
    ): Promise<EvalResult> {
        const startTime = Date.now();

        try {
            // Build prompt with context if present
            let fullPrompt = fixture.prompt;
            if (fixture.context) {
                fullPrompt = `Context:\n${fixture.context}\n\nQuestion: ${fixture.prompt}`;
            }

            // Call model
            const output = await this.callModel(
                model.provider,
                model.model_key,
                fullPrompt
            );

            const latency_ms = Date.now() - startTime;

            // Validate output
            const validationResults = validateOutput(output, fixture.validators);
            const score = calculateScore(validationResults);
            const passed = score >= 0.8; // 80% threshold for passing

            return {
                fixture_id: fixture.id,
                passed,
                score,
                latency_ms,
                output: output.slice(0, 1000), // Truncate for storage
                validation_details: validationResults.map(r => ({
                    validator_type: r.validator.type,
                    passed: r.passed,
                    message: r.message,
                })),
            };
        } catch (error) {
            return {
                fixture_id: fixture.id,
                passed: false,
                score: 0,
                latency_ms: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
                validation_details: [],
            };
        }
    }

    /**
     * Call a model with a prompt.
     */
    private async callModel(
        provider: string,
        model_key: string,
        prompt: string
    ): Promise<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            this.config.timeoutMs
        );

        try {
            const response = await fetch(this.config.completionEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider,
                    model: model_key,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0, // Deterministic
                    max_tokens: 2048,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Model call failed: ${response.status}`);
            }

            const data = await response.json();
            return data.data?.content || '';
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Persist eval result to database.
     */
    private async persistResult(result: ModelEvalResult): Promise<void> {
        const { error } = await this.supabase.from('model_scores').insert({
            provider: result.provider,
            model_key: result.model_key,
            run_id: result.run_id,
            ran_at: result.ran_at,
            suite_version: result.suite_version,
            coding_edit_score: result.coding_edit_score,
            tool_use_score: result.tool_use_score,
            retrieval_score: result.retrieval_score,
            json_validity_score: result.json_validity_score,
            overall_score: result.overall_score,
            details_json: result.details,
        });

        if (error) {
            console.error('Failed to persist eval result:', error);
            throw error;
        }
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let evalRunnerInstance: EvalRunner | null = null;

export function getEvalRunner(config?: Partial<EvalConfig>): EvalRunner {
    if (!evalRunnerInstance) {
        evalRunnerInstance = new EvalRunner(config);
    }
    return evalRunnerInstance;
}
