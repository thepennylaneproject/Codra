/**
 * Eval Runner Tests
 */

import { describe, it, expect } from 'vitest';
import { validateOutput, calculateScore, type Validator } from '../evals/validators';

describe('Eval Validators', () => {
    describe('contains validator', () => {
        it('should pass when string contains value', () => {
            const output = 'let count = 0;';
            const validators: Validator[] = [
                { type: 'contains', value: 'count' },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(true);
        });

        it('should fail when string does not contain value', () => {
            const output = 'let x = 0;';
            const validators: Validator[] = [
                { type: 'contains', value: 'count' },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(false);
        });

        it('should be case insensitive', () => {
            const output = 'let COUNT = 0;';
            const validators: Validator[] = [
                { type: 'contains', value: 'count' },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(true);
        });
    });

    describe('not_contains validator', () => {
        it('should pass when string does not contain value', () => {
            const output = 'const add = (a, b) => a + b;';
            const validators: Validator[] = [
                { type: 'not_contains', value: 'function add' },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(true);
        });

        it('should fail when string contains forbidden value', () => {
            const output = 'function add(a, b) { return a + b; }';
            const validators: Validator[] = [
                { type: 'not_contains', value: 'function add' },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(false);
        });
    });

    describe('contains_any validator', () => {
        it('should pass when any value is found', () => {
            const output = 'str?.length';
            const validators: Validator[] = [
                { type: 'contains_any', values: ['str === null', 'str?.length', '!str'] },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(true);
        });

        it('should fail when no values are found', () => {
            const output = 'return str.length;';
            const validators: Validator[] = [
                { type: 'contains_any', values: ['str === null', 'str?.length'] },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(false);
        });
    });

    describe('valid_json validator', () => {
        it('should pass for valid JSON', () => {
            const output = '{"name": "test", "value": 42}';
            const validators: Validator[] = [
                { type: 'valid_json', value: true },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(true);
        });

        it('should pass for JSON in code block', () => {
            const output = '```json\n{"name": "test"}\n```';
            const validators: Validator[] = [
                { type: 'valid_json', value: true },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(true);
        });

        it('should fail for invalid JSON', () => {
            const output = 'not valid json';
            const validators: Validator[] = [
                { type: 'valid_json', value: true },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(false);
        });
    });

    describe('json_path validator', () => {
        it('should validate JSON path equals value', () => {
            const output = '{"name": "calculator", "parameters": {"a": 42}}';
            const validators: Validator[] = [
                { type: 'json_path', path: '$.name', equals: 'calculator' },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(true);
        });

        it('should fail when JSON path does not match', () => {
            const output = '{"name": "different", "parameters": {"a": 42}}';
            const validators: Validator[] = [
                { type: 'json_path', path: '$.name', equals: 'calculator' },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(false);
        });
    });

    describe('json_has_keys validator', () => {
        it('should pass when all keys present', () => {
            const output = '{"name": "test", "age": 25, "email": "test@test.com"}';
            const validators: Validator[] = [
                { type: 'json_has_keys', keys: ['name', 'age', 'email'] },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(true);
        });

        it('should fail when keys missing', () => {
            const output = '{"name": "test"}';
            const validators: Validator[] = [
                { type: 'json_has_keys', keys: ['name', 'age', 'email'] },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(false);
        });
    });

    describe('json_array_length validator', () => {
        it('should pass when array length in range', () => {
            const output = '[{"id": 1}, {"id": 2}, {"id": 3}]';
            const validators: Validator[] = [
                { type: 'json_array_length', min: 3, max: 3 },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(true);
        });

        it('should fail when array too short', () => {
            const output = '[{"id": 1}]';
            const validators: Validator[] = [
                { type: 'json_array_length', min: 3, max: 5 },
            ];
            
            const results = validateOutput(output, validators);
            expect(results[0].passed).toBe(false);
        });
    });

    describe('score calculation', () => {
        it('should calculate score as ratio of passed validators', () => {
            const results = [
                { passed: true, validator: {} as Validator, message: '' },
                { passed: true, validator: {} as Validator, message: '' },
                { passed: false, validator: {} as Validator, message: '' },
                { passed: true, validator: {} as Validator, message: '' },
            ];
            
            const score = calculateScore(results);
            expect(score).toBe(0.75);
        });

        it('should return 0 for no validators', () => {
            const score = calculateScore([]);
            expect(score).toBe(0);
        });

        it('should return 1 for all passed', () => {
            const results = [
                { passed: true, validator: {} as Validator, message: '' },
                { passed: true, validator: {} as Validator, message: '' },
            ];
            
            const score = calculateScore(results);
            expect(score).toBe(1);
        });
    });
});
