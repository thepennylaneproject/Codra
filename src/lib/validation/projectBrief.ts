/**
 * Project Context Validation
 * 
 * Validates required fields in the project context/brief form
 * to ensure users don't skip critical project setup fields.
 */

export interface ProjectContextFormState {
    audience: {
        primary: string;
        context?: {
            segment?: string;
            sophistication?: string;
        };
    };
    brand: {
        voiceGuidelines?: string;
        colors?: {
            primary?: string;
            secondary?: string;
            accent?: string;
        };
    };
    success: {
        definitionOfDone?: string[];
    };
    guardrails: {
        mustAvoid?: string[];
        competitors?: string[];
    };
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

/**
 * Field validation rules for inline validation
 */
export interface FieldRule {
    minChars?: number;
    maxChars?: number;
    minItems?: number;
    required: boolean;
    message: string;
}

export const FIELD_RULES: Record<string, FieldRule> = {
    'audience.primary': { 
        minChars: 3, 
        maxChars: 100,
        required: true, 
        message: 'Primary Segment required (3-100 chars)' 
    },
    'brand.voiceGuidelines': { 
        minChars: 10, 
        required: true, 
        message: 'Voice Guidelines required (10+ chars)' 
    },
    'success.definitionOfDone': { 
        minItems: 1, 
        required: true, 
        message: 'At least 1 success criterion required' 
    },
    'guardrails.mustAvoid': { 
        minItems: 1, 
        required: true, 
        message: 'At least 1 guardrail required' 
    },
};

/**
 * Validates a single field for inline validation
 * Returns null if valid, error message if invalid
 */
export function validateField(fieldName: string, value: string | string[] | undefined): string | null {
    const rules = FIELD_RULES[fieldName];
    if (!rules) return null;

    // Handle array fields (definition of done, guardrails)
    if (rules.minItems !== undefined) {
        const items = Array.isArray(value) ? value.filter(item => item?.trim()) : [];
        if (rules.required && items.length < rules.minItems) {
            return rules.message;
        }
        return null;
    }

    // Handle string fields
    const strValue = typeof value === 'string' ? value.trim() : '';
    
    if (rules.required && !strValue) {
        return rules.message;
    }

    if (strValue && rules.minChars && strValue.length < rules.minChars) {
        return rules.message;
    }

    if (strValue && rules.maxChars && strValue.length > rules.maxChars) {
        return `Maximum ${rules.maxChars} characters allowed`;
    }

    return null;
}

/**
 * Checks if a field value is valid (for showing green checkmark)
 */
export function isFieldValid(fieldName: string, value: string | string[] | undefined): boolean {
    const error = validateField(fieldName, value);
    if (error) return false;

    // Also check that the field has actual content
    if (Array.isArray(value)) {
        return value.filter(item => item?.trim()).length > 0;
    }
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates the project context form data for required fields.
 * 
 * Required fields:
 * - Target Audience (audience.primary)
 * - Brand Constraints (brand.voiceGuidelines)
 * - Success Criteria (success.definitionOfDone with at least one item)
 * - Guardrails (guardrails.mustAvoid with at least one item)
 */
export function validateProjectContext(data: ProjectContextFormState): ValidationResult {
    const errors: Record<string, string> = {};

    // Check Target Audience with minChars
    const audienceError = validateField('audience.primary', data.audience?.primary);
    if (audienceError || !data.audience?.primary?.trim() || 
        data.audience.primary.toLowerCase() === 'self' || 
        data.audience.primary === 'N/A') {
        errors.audience = audienceError || 'Target audience required.';
    }

    // Check Brand Constraints (Voice & Tone) with minChars
    const brandError = validateField('brand.voiceGuidelines', data.brand?.voiceGuidelines);
    if (brandError || !data.brand?.voiceGuidelines?.trim() || 
        data.brand.voiceGuidelines === 'N/A') {
        errors.brand = brandError || 'Brand voice and tone required.';
    }

    // Check Success Criteria (Definition of Done)
    const successError = validateField('success.definitionOfDone', data.success?.definitionOfDone);
    if (successError) {
        errors.success = successError;
    }

    // Check Guardrails (Must Avoid)
    const guardrailsError = validateField('guardrails.mustAvoid', data.guardrails?.mustAvoid);
    if (guardrailsError) {
        errors.guardrails = guardrailsError;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Gets a summary message for validation errors
 */
export function getValidationSummary(errors: Record<string, string>): string {
    const errorCount = Object.keys(errors).length;
    if (errorCount === 0) return '';
    
    const fieldNames = Object.keys(errors).map(key => {
        switch (key) {
            case 'audience': return 'Target Audience';
            case 'brand': return 'Brand Constraints';
            case 'success': return 'Success Criteria';
            case 'guardrails': return 'Guardrails';
            default: return key;
        }
    });

    if (errorCount === 1) {
        return `Complete the ${fieldNames[0]} section before continuing.`;
    }

    return `Complete the following sections: ${fieldNames.join(', ')}.`;
}

