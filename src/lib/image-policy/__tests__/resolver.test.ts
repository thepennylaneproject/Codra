/**
 * src/lib/image-policy/__tests__/resolver.test.ts
 * 
 * Unit tests for the deterministic asset resolver.
 */

import { describe, it, expect } from 'vitest';
import {
    resolveAssets,
    filterAssets,
    rankAssets,
    dedupeAssets,
} from '../resolver';
import { mergeWithDefaults, DEFAULT_SELECTION } from '../defaults';
import type { CanonicalAsset, ImagePolicy, SelectionConstraints, TemplateMetadata } from '../types';

// =============================================================================
// TEST DATA
// =============================================================================

const mockAssets: CanonicalAsset[] = [
    {
        assetId: 'asset-1',
        cloudinaryPublicId: 'test/asset-1',
        cloudinaryUrl: 'https://example.com/asset-1.png',
        tags: ['hero', 'dark'],
        role: 'hero',
        energy: 'high',
        lifecycleStatus: 'approved',
        assetClass: 'raster',
        aspectClass: 'landscape',
        sizeClass: 'hero',
        format: 'png',
        width: 1920,
        height: 1080,
        bytes: 500000,
        productFamily: 'relevnt_core',
        variant: 'dark',
        createdAt: '2026-01-01T00:00:00Z',
    },
    {
        assetId: 'asset-2',
        cloudinaryPublicId: 'test/asset-2',
        cloudinaryUrl: 'https://example.com/asset-2.jpg',
        tags: ['bg_texture', 'light'],
        role: 'background-soft',
        energy: 'low',
        lifecycleStatus: 'approved',
        assetClass: 'raster',
        aspectClass: 'square',
        sizeClass: 'texture',
        format: 'jpg',
        width: 1024,
        height: 1024,
        bytes: 200000,
        productFamily: 'relevnt_core',
        variant: 'light',
        createdAt: '2026-01-02T00:00:00Z',
    },
    {
        assetId: 'asset-3',
        cloudinaryPublicId: 'test/asset-3',
        cloudinaryUrl: 'https://example.com/asset-3.svg',
        tags: ['icon'],
        role: 'icon',
        energy: 'low',
        lifecycleStatus: 'approved',
        assetClass: 'vector',
        aspectClass: 'square',
        sizeClass: 'icon',
        format: 'svg',
        width: 64,
        height: 64,
        bytes: 2000,
        productFamily: 'relevnt_core',
        variant: 'mono',
        createdAt: '2026-01-03T00:00:00Z',
    },
];

const mockMetadata: TemplateMetadata = {
    templateId: 'test-template',
    templateName: 'Test Template',
};

// =============================================================================
// RESOLVER DETERMINISM TESTS
// =============================================================================

describe('Resolver Determinism', () => {
    it('should produce identical output for identical inputs', () => {
        const policy = mergeWithDefaults({ mode: 'canonical-only' });
        
        const result1 = resolveAssets(policy, mockMetadata, mockAssets, 1);
        const result2 = resolveAssets(policy, mockMetadata, mockAssets, 1);
        
        expect(result1).toEqual(result2);
    });
    
    it('should produce different output for different registry versions', () => {
        const policy = mergeWithDefaults({ mode: 'canonical-only' });
        
        const result1 = resolveAssets(policy, mockMetadata, mockAssets, 1);
        const result2 = resolveAssets(policy, mockMetadata, mockAssets, 2);
        
        // Assets should be same, but version should differ
        expect(result1.assets).toEqual(result2.assets);
        expect(result1.registryVersion).not.toEqual(result2.registryVersion);
    });
});

// =============================================================================
// FILTERING TESTS
// =============================================================================

describe('filterAssets', () => {
    const baseConstraints: SelectionConstraints = {
        ...DEFAULT_SELECTION,
        maxAssets: 10,
    };
    
    it('should return all assets when no constraints', () => {
        const { matched } = filterAssets(mockAssets, baseConstraints);
        expect(matched.length).toBe(mockAssets.length);
    });
    
    it('should filter by format', () => {
        const { matched } = filterAssets(mockAssets, {
            ...baseConstraints,
            allowedFormats: ['png'],
        });
        expect(matched.length).toBe(1);
        expect(matched[0].format).toBe('png');
    });
    
    it('should filter by aspect class', () => {
        const { matched } = filterAssets(mockAssets, {
            ...baseConstraints,
            aspect: 'square',
        });
        expect(matched.length).toBe(2);
        expect(matched.every(a => a.aspectClass === 'square')).toBe(true);
    });
    
    it('should filter by role', () => {
        const { matched } = filterAssets(mockAssets, {
            ...baseConstraints,
            role: 'hero',
        });
        expect(matched.length).toBe(1);
        expect(matched[0].role).toBe('hero');
    });
    
    it('should filter by required tags', () => {
        const { matched } = filterAssets(mockAssets, {
            ...baseConstraints,
            requiredTags: ['dark'],
        });
        expect(matched.length).toBe(1);
        expect(matched[0].tags).toContain('dark');
    });
    
    it('should filter by forbidden tags', () => {
        const { matched } = filterAssets(mockAssets, {
            ...baseConstraints,
            forbiddenTags: ['dark'],
        });
        expect(matched.length).toBe(2);
        expect(matched.every(a => !a.tags.includes('dark'))).toBe(true);
    });
    
    it('should filter by minimum dimensions', () => {
        const { matched } = filterAssets(mockAssets, {
            ...baseConstraints,
            minWidth: 1000,
            minHeight: 1000,
        });
        expect(matched.length).toBe(2);
        expect(matched.every(a => a.width >= 1000 && a.height >= 1000)).toBe(true);
    });
    
    it('should return unmet constraints when no matches', () => {
        const { matched, unmetConstraints } = filterAssets(mockAssets, {
            ...baseConstraints,
            // Use 'any' with requiredTags to test no-match scenario
            requiredTags: ['nonexistent-tag'],
        });
        expect(matched.length).toBe(0);
        expect(unmetConstraints.length).toBeGreaterThan(0);
        expect(unmetConstraints[0]).toContain('requiredTags');
    });
});

// =============================================================================
// RANKING TESTS
// =============================================================================

describe('rankAssets', () => {
    it('should rank largest resolution first', () => {
        const ranked = rankAssets(mockAssets);
        expect(ranked[0].assetId).toBe('asset-1'); // 1920x1080 = 2073600
        expect(ranked[1].assetId).toBe('asset-2'); // 1024x1024 = 1048576
    });
    
    it('should be deterministic', () => {
        const ranked1 = rankAssets(mockAssets);
        const ranked2 = rankAssets(mockAssets);
        expect(ranked1.map(a => a.assetId)).toEqual(ranked2.map(a => a.assetId));
    });
});

// =============================================================================
// DEDUPLICATION TESTS
// =============================================================================

describe('dedupeAssets', () => {
    it('should remove duplicates with same dimensions and size class', () => {
        const duplicateAssets: CanonicalAsset[] = [
            ...mockAssets,
            {
                ...mockAssets[1],
                assetId: 'asset-2-dupe',
                bytes: 205000, // Similar size
            },
        ];
        
        const deduped = dedupeAssets(duplicateAssets);
        expect(deduped.length).toBe(3); // Original 3, not 4
    });
    
    it('should keep assets with different dimensions', () => {
        const deduped = dedupeAssets(mockAssets);
        expect(deduped.length).toBe(mockAssets.length);
    });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('resolveAssets', () => {
    it('should respect maxAssets limit', () => {
        const policy: ImagePolicy = mergeWithDefaults({
            mode: 'canonical-only',
            selection: { ...DEFAULT_SELECTION, maxAssets: 1 },
        });
        
        const result = resolveAssets(policy, mockMetadata, mockAssets, 1);
        expect(result.assets.length).toBe(1);
    });
    
    it('should return empty with maxAssets 0', () => {
        const policy: ImagePolicy = mergeWithDefaults({
            mode: 'canonical-only',
            selection: { ...DEFAULT_SELECTION, maxAssets: 0 },
        });
        
        const result = resolveAssets(policy, mockMetadata, mockAssets, 1);
        expect(result.assets.length).toBe(0);
        expect(result.reason).toContain('maxAssets is 0');
    });
    
    it('should include human-readable reason', () => {
        const policy = mergeWithDefaults({ mode: 'canonical-only' });
        const result = resolveAssets(policy, mockMetadata, mockAssets, 1);
        
        expect(result.reason).toBeTruthy();
        expect(typeof result.reason).toBe('string');
        expect(result.reason.length).toBeGreaterThan(10);
    });
    
    it('should include asset-level reasons', () => {
        const policy = mergeWithDefaults({ mode: 'canonical-only' });
        const result = resolveAssets(policy, mockMetadata, mockAssets, 1);
        
        for (const asset of result.assets) {
            expect(asset.reason).toBeTruthy();
            expect(asset.reason).toContain('Rank #');
        }
    });
});
