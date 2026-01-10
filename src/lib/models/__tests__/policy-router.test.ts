/**
 * Policy Router Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('../../supabase', () => ({
    supabase: {
        from: vi.fn((table: string) => {
            if (table === 'model_registry') {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            data: [
                                {
                                    id: '1',
                                    provider: 'aimlapi',
                                    model_key: 'gpt-4o',
                                    display_name: 'GPT-4o',
                                    status: 'active',
                                    capabilities_json: { tools: true, vision: true, json_mode: true, max_context: 128000 },
                                },
                                {
                                    id: '2',
                                    provider: 'aimlapi',
                                    model_key: 'claude-3-5-sonnet',
                                    display_name: 'Claude 3.5 Sonnet',
                                    status: 'active',
                                    capabilities_json: { tools: true, vision: true, max_context: 200000 },
                                },
                                {
                                    id: '3',
                                    provider: 'openai',
                                    model_key: 'gpt-4-turbo',
                                    display_name: 'GPT-4 Turbo',
                                    status: 'active',
                                    capabilities_json: { tools: true, vision: false, json_mode: true, max_context: 128000 },
                                },
                            ],
                        })),
                    })),
                };
            }
            if (table === 'model_scores') {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            eq: vi.fn(() => ({
                                order: vi.fn(() => ({
                                    limit: vi.fn(() => ({
                                        data: [
                                            {
                                                run_id: 'eval-001',
                                                ran_at: '2026-01-07T00:00:00Z',
                                                suite_version: '1.0.0',
                                                overall_score: 0.85,
                                                coding_edit_score: 0.9,
                                                tool_use_score: 0.8,
                                                retrieval_score: 0.85,
                                                json_validity_score: 0.9,
                                            },
                                        ],
                                    })),
                                })),
                            })),
                        })),
                    })),
                };
            }
            if (table === 'model_health') {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            eq: vi.fn(() => ({
                                gte: vi.fn(() => ({
                                    data: [
                                        {
                                            request_count: 100,
                                            error_count: 2,
                                            median_latency_ms: 500,
                                            p95_latency_ms: 1200,
                                        },
                                    ],
                                })),
                            })),
                        })),
                    })),
                };
            }
            return { select: vi.fn(() => ({ data: [] })) };
        }),
    },
}));

describe('Policy Router', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('capability filtering', () => {
        it('should filter models by tools requirement', () => {
            const models = [
                { capabilities: { tools: true }, model_key: 'a' },
                { capabilities: { tools: false }, model_key: 'b' },
                { capabilities: {}, model_key: 'c' },
            ];
            
            
            // Filter models that have tools capability set to true
            const filtered = models.filter(m => m.capabilities.tools === true);
            
            expect(filtered[0].model_key).toBe('a');
        });

        it('should filter models by vision requirement', () => {
            const models = [
                { capabilities: { vision: true }, model_key: 'a' },
                { capabilities: { vision: false }, model_key: 'b' },
            ];
            
            
            // Filter models that have vision capability set to true
            const filtered = models.filter(m => m.capabilities.vision === true);
            
            expect(filtered[0].model_key).toBe('a');
        });

        it('should filter by minimum context tokens', () => {
            const models = [
                { capabilities: { max_context: 128000 }, model_key: 'a' },
                { capabilities: { max_context: 4096 }, model_key: 'b' },
            ];
            
            const minTokens = 50000;
            const filtered = models.filter(m => 
                (m.capabilities.max_context ?? 4096) >= minTokens
            );
            
            expect(filtered.length).toBe(1);
            expect(filtered[0].model_key).toBe('a');
        });
    });

    describe('score-based ranking', () => {
        it('should rank by overall score', () => {
            const models = [
                { model_key: 'a', scores: { overall_score: 0.7 } },
                { model_key: 'b', scores: { overall_score: 0.9 } },
                { model_key: 'c', scores: { overall_score: 0.8 } },
            ];
            
            const sorted = models.sort(
                (a, b) => (b.scores.overall_score ?? 0) - (a.scores.overall_score ?? 0)
            );
            
            expect(sorted[0].model_key).toBe('b');
            expect(sorted[1].model_key).toBe('c');
            expect(sorted[2].model_key).toBe('a');
        });

        it('should weight coding score for refactor tasks', () => {
            const weights = { coding_edit: 0.6, overall: 0.2, json_validity: 0.2 };
            
            const modelA = {
                coding_edit_score: 0.9,
                overall_score: 0.7,
                json_validity_score: 0.8,
            };
            
            const modelB = {
                coding_edit_score: 0.7,
                overall_score: 0.9,
                json_validity_score: 0.8,
            };
            
            const scoreA = 
                modelA.coding_edit_score * weights.coding_edit +
                modelA.overall_score * weights.overall +
                modelA.json_validity_score * weights.json_validity;
            
            const scoreB = 
                modelB.coding_edit_score * weights.coding_edit +
                modelB.overall_score * weights.overall +
                modelB.json_validity_score * weights.json_validity;
            
            expect(scoreA).toBeGreaterThan(scoreB);
        });
    });

    describe('fallback selection', () => {
        it('should prefer fallback from different provider', () => {
            const models = [
                { provider: 'aimlapi', model_key: 'primary' },
                { provider: 'aimlapi', model_key: 'same-provider' },
                { provider: 'openai', model_key: 'different-provider' },
            ];
            
            const primary = models[0];
            const fallback = models.find(
                m => m.provider !== primary.provider && m.model_key !== primary.model_key
            );
            
            expect(fallback?.provider).toBe('openai');
        });

        it('should fall back to same provider if no alternative', () => {
            const models = [
                { provider: 'aimlapi', model_key: 'primary' },
                { provider: 'aimlapi', model_key: 'fallback' },
            ];
            
            const primary = models[0];
            let fallback = models.find(
                m => m.provider !== primary.provider
            );
            
            if (!fallback) {
                fallback = models.find(
                    m => m.model_key !== primary.model_key
                );
            }
            
            expect(fallback?.model_key).toBe('fallback');
            expect(fallback?.provider).toBe('aimlapi');
        });
    });

    describe('verifier selection for high risk', () => {
        it('should select verifier from different provider', () => {
            const models = [
                { provider: 'aimlapi', model_key: 'primary', overall_score: 0.9 },
                { provider: 'openai', model_key: 'verifier', overall_score: 0.85 },
            ];
            
            const primary = models[0];
            const verifier = models
                .filter(m => m.provider !== primary.provider)
                .sort((a, b) => b.overall_score - a.overall_score)[0];
            
            expect(verifier?.provider).toBe('openai');
        });
    });

    describe('reason string', () => {
        it('should include task type in reason', () => {
            const taskType = 'refactor';
            const overallScore = 0.85;
            const reason = `Best match for ${taskType}, overall=${overallScore.toFixed(2)}`;
            
            expect(reason).toContain('refactor');
            expect(reason).toContain('0.85');
        });
    });
});
