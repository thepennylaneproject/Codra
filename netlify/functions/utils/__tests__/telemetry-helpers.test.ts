/**
 * TELEMETRY HELPERS TESTS
 * netlify/functions/utils/__tests__/telemetry-helpers.test.ts
 * 
 * Tests for telemetry helper functions.
 */

import { describe, it, expect } from 'vitest';
import { hashQuery, calculateEstimatedCost } from '../telemetry-helpers';

describe('Telemetry Helpers', () => {
    describe('hashQuery', () => {
        it('should generate consistent SHA-256 hash for same query', () => {
            const query = 'What is TypeScript?';
            const hash1 = hashQuery(query);
            const hash2 = hashQuery(query);

            expect(hash1).toBe(hash2);
            expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
        });

        it('should normalize queries (lowercase, trim)', () => {
            const hash1 = hashQuery('  What is TypeScript?  ');
            const hash2 = hashQuery('what is typescript?');

            expect(hash1).toBe(hash2);
        });

        it('should produce different hashes for different queries', () => {
            const hash1 = hashQuery('What is TypeScript?');
            const hash2 = hashQuery('What is JavaScript?');

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('calculateEstimatedCost', () => {
        it('should calculate cost correctly for known models', () => {
            // Note: This test assumes GPT-4o pricing from provider registry
            // Input: $0.0025/1k, Output: $0.01/1k (example values)
            const cost = calculateEstimatedCost('gpt-4o', 1000, 500);

            expect(cost).toBeGreaterThan(0);
            expect(typeof cost).toBe('number');
        });

        it('should return null for unknown models', () => {
            const cost = calculateEstimatedCost('unknown-model-xyz', 1000, 500);

            expect(cost).toBeNull();
        });

        it('should handle zero tokens', () => {
            const cost = calculateEstimatedCost('gpt-4o', 0, 0);

            // Should return cost (0) not null
            expect(cost).toBe(0);
        });
    });
});
