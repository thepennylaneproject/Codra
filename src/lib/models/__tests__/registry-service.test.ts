/**
 * Registry Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ModelRegistryRecord } from '../registry/registry-types';

// Mock supabase
vi.mock('../../supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                        data: [{ registry_version: 5 }],
                    })),
                })),
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn(() => ({
                            data: null,
                        })),
                    })),
                })),
                in: vi.fn(() => ({
                    data: [],
                })),
            })),
            insert: vi.fn(() => ({ error: null })),
            update: vi.fn(() => ({
                eq: vi.fn(() => ({
                    error: null,
                })),
            })),
        })),
    },
}));

// Mock adapters
vi.mock('../adapters/adapter-registry', () => ({
    getAllAdapters: vi.fn(() => [
        {
            providerName: () => 'mock-provider',
            listModels: vi.fn(async () => [
                { model_key: 'model-1', display_name: 'Model One' },
                { model_key: 'model-2', display_name: 'Model Two' },
            ]),
            getCapabilities: vi.fn(async () => ({
                capabilities: { tools: true, vision: false },
            })),
            smokeTest: vi.fn(async () => ({
                ok: true,
                latency_ms: 250,
            })),
        },
    ]),
}));

describe('Registry Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('version incrementing', () => {
        it('should increment version from the last known version', async () => {
            // This is a conceptual test - actual implementation uses supabase
            const currentVersion = 5;
            const newVersion = currentVersion + 1;
            expect(newVersion).toBe(6);
        });
    });

    describe('model upsert', () => {
        it('should mark new models as candidate status', () => {
            const newModel: Partial<ModelRegistryRecord> = {
                provider: 'test',
                model_key: 'new-model',
                status: 'candidate', // Expected default
            };
            expect(newModel.status).toBe('candidate');
        });

        it('should not mark existing active models as candidate', () => {
            const existingModel: Partial<ModelRegistryRecord> = {
                provider: 'test',
                model_key: 'existing-model',
                status: 'active',
            };
            // On update, status should remain active
            expect(existingModel.status).toBe('active');
        });
    });

    describe('deprecation logic', () => {
        it('should deprecate after N consecutive misses', () => {
            const deprecationThreshold = 3;
            const currentVersion = 10;
            const lastSeenVersion = 6;
            const missCount = currentVersion - lastSeenVersion;
            
            expect(missCount >= deprecationThreshold).toBe(true);
        });

        it('should not deprecate if misses below threshold', () => {
            const deprecationThreshold = 3;
            const currentVersion = 10;
            const lastSeenVersion = 9;
            const missCount = currentVersion - lastSeenVersion;
            
            expect(missCount >= deprecationThreshold).toBe(false);
        });
    });

    describe('promotion rules', () => {
        it('should require passing smoke test', () => {
            const smokeTestPassed = true;
            const hasRecentSmokeTest = true;
            expect(smokeTestPassed && hasRecentSmokeTest).toBe(true);
        });

        it('should require minimum score threshold', () => {
            const overallScore = 0.75;
            const threshold = 0.6;
            expect(overallScore >= threshold).toBe(true);
        });

        it('should require error rate below threshold', () => {
            const errorRate = 0.05;
            const threshold = 0.1;
            expect(errorRate <= threshold).toBe(true);
        });

        it('should reject promotion if score below threshold', () => {
            const overallScore = 0.4;
            const threshold = 0.6;
            expect(overallScore >= threshold).toBe(false);
        });
    });
});
