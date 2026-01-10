/**
 * src/lib/image-policy/__tests__/errors.test.ts
 * 
 * Unit tests for error shapes.
 */

import { describe, it, expect } from 'vitest';
import {
    PolicyMissingError,
    NoCanonicalMatchError,
    GenerationDisabledError,
    GenerationConsentRequiredError,
    GenerationBudgetExceededError,
    PromotionNotAllowedError,
    PromotionMissingFieldsError,
    isImagePolicyError,
    getErrorCode,
} from '../errors';

// =============================================================================
// ERROR SHAPE TESTS
// =============================================================================

describe('Error Shapes', () => {
    describe('PolicyMissingError', () => {
        it('should have correct code', () => {
            const error = new PolicyMissingError('test-template');
            expect(error.code).toBe('policy_missing');
        });
        
        it('should include template ID in message', () => {
            const error = new PolicyMissingError('test-template');
            expect(error.message).toContain('test-template');
        });
        
        it('should include nextAction in details', () => {
            const error = new PolicyMissingError();
            expect(error.details.nextAction).toBeDefined();
        });
        
        it('should serialize to JSON correctly', () => {
            const error = new PolicyMissingError('test');
            const json = error.toJSON();
            
            expect(json.code).toBe('policy_missing');
            expect(json.message).toBeTruthy();
            expect(json.details).toBeDefined();
        });
    });
    
    describe('NoCanonicalMatchError', () => {
        it('should include unmet constraints', () => {
            const constraints = ['purpose: no match', 'aspect: no match'];
            const error = new NoCanonicalMatchError(constraints, 'No assets found');
            
            expect(error.code).toBe('no_canonical_match');
            expect(error.details.unmetConstraints).toEqual(constraints);
        });
    });
    
    describe('GenerationBudgetExceededError', () => {
        it('should include budget details', () => {
            const error = new GenerationBudgetExceededError(10, 5, 8);
            
            expect(error.code).toBe('generation_budget_exceeded');
            expect(error.details.requested).toBe(10);
            expect(error.details.available).toBe(5);
            expect(error.details.maxCredits).toBe(8);
        });
    });
    
    describe('PromotionMissingFieldsError', () => {
        it('should list missing fields', () => {
            const error = new PromotionMissingFieldsError(['purpose', 'tags']);
            
            expect(error.code).toBe('promotion_missing_fields');
            expect(error.details.unmetConstraints).toContain('purpose');
            expect(error.details.unmetConstraints).toContain('tags');
        });
    });
});

// =============================================================================
// TYPE GUARD TESTS
// =============================================================================

describe('isImagePolicyError', () => {
    it('should return true for ImagePolicyErrors', () => {
        expect(isImagePolicyError(new PolicyMissingError())).toBe(true);
        expect(isImagePolicyError(new NoCanonicalMatchError([], ''))).toBe(true);
        expect(isImagePolicyError(new GenerationDisabledError('test'))).toBe(true);
    });
    
    it('should return false for regular errors', () => {
        expect(isImagePolicyError(new Error('test'))).toBe(false);
        expect(isImagePolicyError(null)).toBe(false);
        expect(isImagePolicyError(undefined)).toBe(false);
    });
});

describe('getErrorCode', () => {
    it('should return error code for ImagePolicyErrors', () => {
        expect(getErrorCode(new PolicyMissingError())).toBe('policy_missing');
        expect(getErrorCode(new NoCanonicalMatchError([], ''))).toBe('no_canonical_match');
    });
    
    it('should return "unknown" for regular errors', () => {
        expect(getErrorCode(new Error('test'))).toBe('unknown');
        expect(getErrorCode(null)).toBe('unknown');
    });
});

// =============================================================================
// ALL ERROR TYPES TEST
// =============================================================================

describe('All Error Types', () => {
    const errorInstances = [
        new PolicyMissingError('template'),
        new NoCanonicalMatchError(['constraint'], 'reason'),
        new GenerationDisabledError('canonical-only'),
        new GenerationConsentRequiredError(),
        new GenerationBudgetExceededError(10, 5, 8),
        new PromotionNotAllowedError(),
        new PromotionMissingFieldsError(['purpose']),
    ];
    
    it('all errors should have message and details', () => {
        for (const error of errorInstances) {
            expect(error.message).toBeTruthy();
            expect(error.details).toBeDefined();
            expect(error.code).toBeTruthy();
        }
    });
    
    it('all errors should have nextAction suggestion', () => {
        for (const error of errorInstances) {
            expect(error.details.nextAction).toBeDefined();
            expect(typeof error.details.nextAction).toBe('string');
        }
    });
});
