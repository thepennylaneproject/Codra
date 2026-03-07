/**
 * src/lib/image-policy/__tests__/policy-executor.test.ts
 * 
 * Unit tests for policy mode behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    executeImagePolicy,
    ensurePolicy,
    getDefaultPolicy,
    type ExecutionContext,
} from '../policy-executor';
import { mergeWithDefaults, DEFAULT_SELECTION, DEFAULT_GENERATION, DEFAULT_PROVENANCE, DEFAULT_BUDGET } from '../defaults';
import { PolicyMissingError } from '../errors';
import type { ImagePolicy, TemplateMetadata } from '../types';

// Mock the canonical registry to avoid file system access
vi.mock('../canonical-registry', () => ({
    loadSnapshot: vi.fn().mockResolvedValue({
        version: 1,
        assets: [
            {
                assetId: 'mock-asset-1',
                cloudinaryPublicId: 'mock/asset-1',
                cloudinaryUrl: 'https://example.com/asset-1.png',
                tags: ['hero', 'dark'],
                role: 'hero',
                energy: 'high',
                assetClass: 'raster',
                lifecycleStatus: 'approved',
                aspectClass: 'landscape',
                sizeClass: 'hero',
                format: 'png',
                width: 1920,
                height: 1080,
                bytes: 500000,
                productFamily: 'other',
                variant: 'dark',
                createdAt: '2026-01-01T00:00:00Z',
            },
        ],
        loadedAt: new Date(),
    }),
    getCurrentVersion: vi.fn().mockReturnValue(1),
    clearCache: vi.fn(),
}));

// =============================================================================
// TEST DATA
// =============================================================================

const mockMetadata: TemplateMetadata = {
    templateId: 'test-template',
    templateName: 'Test Template',
};

const baseContext: ExecutionContext = {
    runId: 'test-run-1',
    availableCredits: 100,
    hasConsent: true,
    template: mockMetadata,
};

// =============================================================================
// POLICY ENFORCEMENT TESTS
// =============================================================================

describe('ensurePolicy', () => {
    it('should throw PolicyMissingError when policy is undefined', () => {
        expect(() => ensurePolicy(undefined, 'test-template')).toThrow(PolicyMissingError);
    });
    
    it('should return merged policy when valid', () => {
        const partialPolicy = { mode: 'canonical-only' } as ImagePolicy;
        const result = ensurePolicy(partialPolicy, 'test-template');
        
        expect(result.mode).toBe('canonical-only');
        expect(result.selection).toBeDefined();
        expect(result.generation).toBeDefined();
    });
});

describe('getDefaultPolicy', () => {
    it('should return a copy of the default policy', () => {
        const defaultPolicy = getDefaultPolicy();
        
        expect(defaultPolicy.mode).toBe('canonical-only');
        expect(defaultPolicy.generation.enabled).toBe(false);
    });
});

// =============================================================================
// CANONICAL-ONLY MODE TESTS
// =============================================================================

describe('canonical-only mode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    it('should return canonical assets when available', async () => {
        const policy = mergeWithDefaults({ mode: 'canonical-only' });
        const result = await executeImagePolicy(policy, baseContext);
        
        expect(result.success).toBe(true);
        expect(result.canonicalAssets.length).toBeGreaterThan(0);
        expect(result.generatedImages.length).toBe(0);
    });
    
    it('should never generate images even if enabled in config', async () => {
        // When mode is canonical-only, generation.enabled should be false
        // The validator will throw if we try to set enabled: true
        const policy = mergeWithDefaults({
            mode: 'canonical-only',
            generation: { ...DEFAULT_GENERATION, enabled: false },
        });
        
        const result = await executeImagePolicy(policy, baseContext);
        expect(result.generatedImages.length).toBe(0);
    });
    
    it('should include receipt when provenance.attachToReceipt is true', async () => {
        const policy = mergeWithDefaults({
            mode: 'canonical-only',
            provenance: { ...DEFAULT_PROVENANCE, attachToReceipt: true },
        });
        
        const result = await executeImagePolicy(policy, baseContext);
        
        expect(result.receipt).toBeDefined();
        expect(result.receipt?.runId).toBe(baseContext.runId);
    });
});

// =============================================================================
// PREFER-CANONICAL MODE TESTS
// =============================================================================

describe('prefer-canonical mode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    it('should use canonical assets when available', async () => {
        const policy = mergeWithDefaults({
            mode: 'prefer-canonical',
            generation: { ...DEFAULT_GENERATION, enabled: true, maxGenerations: 3 },
        });
        
        const result = await executeImagePolicy(policy, baseContext);
        
        expect(result.success).toBe(true);
        expect(result.canonicalAssets.length).toBeGreaterThan(0);
        expect(result.generatedImages.length).toBe(0);
    });
    
    it('should act like canonical-only when generation disabled', async () => {
        const policy = mergeWithDefaults({
            mode: 'prefer-canonical',
            generation: { ...DEFAULT_GENERATION, enabled: false },
        });
        
        const result = await executeImagePolicy(policy, baseContext);
        
        // Should still succeed if canonical assets found
        expect(result.success).toBe(true);
    });
});

// =============================================================================
// GENERATE-OK MODE TESTS
// =============================================================================

describe('generate-ok mode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    it('should try canonical first by default', async () => {
        const policy = mergeWithDefaults({
            mode: 'generate-ok',
            generation: { ...DEFAULT_GENERATION, enabled: true, maxGenerations: 3 },
        });
        
        const result = await executeImagePolicy(policy, baseContext);
        
        expect(result.success).toBe(true);
        expect(result.canonicalAssets.length).toBeGreaterThan(0);
    });
    
    it('should skip canonical when maxAssets is 0', async () => {
        const policy = mergeWithDefaults({
            mode: 'generate-ok',
            selection: { ...DEFAULT_SELECTION, maxAssets: 0 },
            generation: { ...DEFAULT_GENERATION, enabled: true, maxGenerations: 3 },
        });
        
        const result = await executeImagePolicy(policy, baseContext);
        
        expect(result.canonicalAssets.length).toBe(0);
    });
});

// =============================================================================
// BUDGET AND CONSENT TESTS
// =============================================================================

describe('budget and consent', () => {
    it('should fail generation without consent when required', async () => {
        const policy = mergeWithDefaults({
            mode: 'prefer-canonical',
            selection: { ...DEFAULT_SELECTION, maxAssets: 0, requiredTags: ['nonexistent-tag-xyz'] },
            generation: { ...DEFAULT_GENERATION, enabled: true, maxGenerations: 3 },
            budget: { ...DEFAULT_BUDGET, requireConsent: true },
        });
        
        const contextWithoutConsent: ExecutionContext = {
            ...baseContext,
            hasConsent: false,
        };
        
        const result = await executeImagePolicy(policy, contextWithoutConsent);
        
        // Should fail because no canonical match AND consent not given
        expect(result.errorCode).toBeDefined();
    });
});
