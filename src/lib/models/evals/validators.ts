/**
 * Eval Validators
 * Deterministic validation functions for eval fixtures.
 * These validators check model outputs without requiring "perfect" responses.
 */

import { JSONPath } from 'jsonpath-plus';

// ============================================================================
// VALIDATOR TYPES
// ============================================================================

export type ValidatorType =
    | 'contains'
    | 'not_contains'
    | 'contains_exact'
    | 'contains_any'
    | 'valid_json'
    | 'json_path'
    | 'json_path_any'
    | 'json_path_contains'
    | 'json_path_exists'
    | 'json_has_keys'
    | 'json_type'
    | 'json_is_array'
    | 'json_array_length'
    | 'json_array_items_have_keys';

export interface Validator {
    type: ValidatorType;
    value?: string | boolean | number;
    values?: string[];
    path?: string;
    equals?: unknown;
    contains?: string;
    keys?: string[];
    expected_type?: string;
    min?: number;
    max?: number;
}

export interface ValidationResult {
    passed: boolean;
    validator: Validator;
    message: string;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate output against a list of validators.
 * Returns results for each validator.
 */
export function validateOutput(
    output: string,
    validators: Validator[]
): ValidationResult[] {
    return validators.map(v => runValidator(output, v));
}

/**
 * Run a single validator against output.
 */
function runValidator(output: string, validator: Validator): ValidationResult {
    try {
        switch (validator.type) {
            case 'contains':
                return validateContains(output, validator);
            case 'not_contains':
                return validateNotContains(output, validator);
            case 'contains_exact':
                return validateContainsExact(output, validator);
            case 'contains_any':
                return validateContainsAny(output, validator);
            case 'valid_json':
                return validateValidJson(output, validator);
            case 'json_path':
                return validateJsonPath(output, validator);
            case 'json_path_any':
                return validateJsonPathAny(output, validator);
            case 'json_path_contains':
                return validateJsonPathContains(output, validator);
            case 'json_path_exists':
                return validateJsonPathExists(output, validator);
            case 'json_has_keys':
                return validateJsonHasKeys(output, validator);
            case 'json_type':
                return validateJsonType(output, validator);
            case 'json_is_array':
                return validateJsonIsArray(output, validator);
            case 'json_array_length':
                return validateJsonArrayLength(output, validator);
            case 'json_array_items_have_keys':
                return validateJsonArrayItemsHaveKeys(output, validator);
            default:
                return {
                    passed: false,
                    validator,
                    message: `Unknown validator type: ${(validator as Validator).type}`,
                };
        }
    } catch (error) {
        return {
            passed: false,
            validator,
            message: `Validator error: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

// ============================================================================
// STRING VALIDATORS
// ============================================================================

function validateContains(output: string, v: Validator): ValidationResult {
    const target = String(v.value).toLowerCase();
    const passed = output.toLowerCase().includes(target);
    return {
        passed,
        validator: v,
        message: passed ? 'Contains expected string' : `Missing: ${v.value}`,
    };
}

function validateNotContains(output: string, v: Validator): ValidationResult {
    const target = String(v.value).toLowerCase();
    const passed = !output.toLowerCase().includes(target);
    return {
        passed,
        validator: v,
        message: passed ? 'Does not contain forbidden string' : `Found forbidden: ${v.value}`,
    };
}

function validateContainsExact(output: string, v: Validator): ValidationResult {
    const passed = output.includes(String(v.value));
    return {
        passed,
        validator: v,
        message: passed ? 'Contains exact string' : `Missing exact: ${v.value}`,
    };
}

function validateContainsAny(output: string, v: Validator): ValidationResult {
    const values = v.values || [];
    const lowerOutput = output.toLowerCase();
    const found = values.find(val => lowerOutput.includes(val.toLowerCase()));
    const passed = !!found;
    return {
        passed,
        validator: v,
        message: passed ? `Found: ${found}` : `None found from: ${values.join(', ')}`,
    };
}

// ============================================================================
// JSON VALIDATORS
// ============================================================================

type JsonValue = null | boolean | number | string | object | unknown[];

function extractJson(output: string): JsonValue {
    // Try to parse the output directly
    try {
        return JSON.parse(output) as JsonValue;
    } catch {
        // Try to extract JSON from markdown code block
        const jsonMatch = output.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1].trim()) as JsonValue;
        }
        // Try to find JSON object or array
        const objMatch = output.match(/\{[\s\S]*\}/);
        const arrMatch = output.match(/\[[\s\S]*\]/);
        const match = objMatch || arrMatch;
        if (match) {
            return JSON.parse(match[0]) as JsonValue;
        }
        throw new Error('No valid JSON found in output');
    }
}

function validateValidJson(output: string, v: Validator): ValidationResult {
    try {
        extractJson(output);
        return { passed: true, validator: v, message: 'Valid JSON' };
    } catch (e) {
        return { 
            passed: false, 
            validator: v, 
            message: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}` 
        };
    }
}

function validateJsonPath(output: string, v: Validator): ValidationResult {
    try {
        const json = extractJson(output);
        const result = JSONPath({ path: v.path!, json, wrap: false });
        const passed = result === v.equals;
        return {
            passed,
            validator: v,
            message: passed 
                ? `Path ${v.path} equals expected value`
                : `Path ${v.path} = ${JSON.stringify(result)}, expected ${JSON.stringify(v.equals)}`,
        };
    } catch (e) {
        return { passed: false, validator: v, message: `JSON path error: ${e}` };
    }
}

function validateJsonPathAny(output: string, v: Validator): ValidationResult {
    try {
        const json = extractJson(output);
        const result = JSONPath({ path: v.path!, json, wrap: false });
        const possible = v.equals as unknown[];
        const passed = possible.includes(result);
        return {
            passed,
            validator: v,
            message: passed
                ? `Path ${v.path} matches one of expected values`
                : `Path ${v.path} = ${result}, expected one of ${JSON.stringify(possible)}`,
        };
    } catch (e) {
        return { passed: false, validator: v, message: `JSON path error: ${e}` };
    }
}

function validateJsonPathContains(output: string, v: Validator): ValidationResult {
    try {
        const json = extractJson(output);
        const result = JSONPath({ path: v.path!, json, wrap: false }) as unknown;
        const passed = typeof result === 'string' && 
                       result.toLowerCase().includes(String(v.contains).toLowerCase());
        return {
            passed,
            validator: v,
            message: passed
                ? `Path ${v.path} contains expected string`
                : `Path ${v.path} = ${result}, should contain ${v.contains}`,
        };
    } catch (e) {
        return { passed: false, validator: v, message: `JSON path error: ${e}` };
    }
}

function validateJsonPathExists(output: string, v: Validator): ValidationResult {
    try {
        const json = extractJson(output);
        const result = JSONPath({ path: v.path!, json, wrap: true });
        const passed = Array.isArray(result) && result.length > 0;
        return {
            passed,
            validator: v,
            message: passed ? `Path ${v.path} exists` : `Path ${v.path} not found`,
        };
    } catch (e) {
        return { passed: false, validator: v, message: `JSON path error: ${e}` };
    }
}

function validateJsonHasKeys(output: string, v: Validator): ValidationResult {
    try {
        const json = extractJson(output);
        if (typeof json !== 'object' || json === null) {
            return { passed: false, validator: v, message: 'Not an object' };
        }
        const keys = v.keys || [];
        const missing = keys.filter(k => !(k in (json as Record<string, unknown>)));
        const passed = missing.length === 0;
        return {
            passed,
            validator: v,
            message: passed ? 'All required keys present' : `Missing keys: ${missing.join(', ')}`,
        };
    } catch (e) {
        return { passed: false, validator: v, message: `JSON error: ${e}` };
    }
}

function validateJsonType(output: string, v: Validator): ValidationResult {
    try {
        const json = extractJson(output);
        const result = JSONPath({ path: v.path!, json, wrap: false });
        const actualType = Array.isArray(result) ? 'array' : typeof result;
        const passed = actualType === v.expected_type;
        return {
            passed,
            validator: v,
            message: passed
                ? `Path ${v.path} has correct type ${v.expected_type}`
                : `Path ${v.path} is ${actualType}, expected ${v.expected_type}`,
        };
    } catch (e) {
        return { passed: false, validator: v, message: `JSON type error: ${e}` };
    }
}

function validateJsonIsArray(output: string, v: Validator): ValidationResult {
    try {
        const json = extractJson(output);
        const passed = Array.isArray(json);
        return {
            passed,
            validator: v,
            message: passed ? 'Is an array' : 'Not an array',
        };
    } catch (e) {
        return { passed: false, validator: v, message: `JSON error: ${e}` };
    }
}

function validateJsonArrayLength(output: string, v: Validator): ValidationResult {
    try {
        const json = extractJson(output);
        if (!Array.isArray(json)) {
            return { passed: false, validator: v, message: 'Not an array' };
        }
        const len = json.length;
        const minOk = v.min === undefined || len >= v.min;
        const maxOk = v.max === undefined || len <= v.max;
        const passed = minOk && maxOk;
        return {
            passed,
            validator: v,
            message: passed
                ? `Array length ${len} is within range`
                : `Array length ${len} outside range [${v.min ?? 0}, ${v.max ?? '∞'}]`,
        };
    } catch (e) {
        return { passed: false, validator: v, message: `JSON error: ${e}` };
    }
}

function validateJsonArrayItemsHaveKeys(output: string, v: Validator): ValidationResult {
    try {
        const json = extractJson(output);
        if (!Array.isArray(json)) {
            return { passed: false, validator: v, message: 'Not an array' };
        }
        const keys = v.keys || [];
        for (let i = 0; i < json.length; i++) {
            const item = json[i];
            if (typeof item !== 'object' || item === null) {
                return { passed: false, validator: v, message: `Item ${i} is not an object` };
            }
            const missing = keys.filter(k => !(k in (item as Record<string, unknown>)));
            if (missing.length > 0) {
                return {
                    passed: false,
                    validator: v,
                    message: `Item ${i} missing keys: ${missing.join(', ')}`,
                };
            }
        }
        return { passed: true, validator: v, message: 'All items have required keys' };
    } catch (e) {
        return { passed: false, validator: v, message: `JSON error: ${e}` };
    }
}

// ============================================================================
// SCORE CALCULATION
// ============================================================================

/**
 * Calculate a score (0-1) from validation results.
 */
export function calculateScore(results: ValidationResult[]): number {
    if (results.length === 0) return 0;
    const passed = results.filter(r => r.passed).length;
    return passed / results.length;
}
