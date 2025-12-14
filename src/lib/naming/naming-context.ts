/**
 * NAMING CONTEXT
 * Context-specific naming rules and validation helpers
 */

import type { NamingScope, NamingTargetType, CaseStyle } from '../../types/architect';

export interface NamingValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
}

export interface NamingRules {
    caseStyle: CaseStyle;
    maxLength: number;
    minLength: number;
    allowedCharacters: RegExp;
    prefix?: string;
    suffix?: string;
    bannedTokens: string[];
    reservedNames: string[];
}

// Default rules by scope and type
export const DEFAULT_RULES: Record<NamingScope, Record<NamingTargetType, Partial<NamingRules>>> = {
    code: {
        component: { caseStyle: 'pascal', maxLength: 40, minLength: 2 },
        file: { caseStyle: 'kebab', maxLength: 50, minLength: 3 },
        route: { caseStyle: 'kebab', maxLength: 30, minLength: 2 },
        db_table: { caseStyle: 'snake', maxLength: 30, minLength: 3 },
        feature: { caseStyle: 'kebab', maxLength: 40, minLength: 3 },
        tier: { caseStyle: 'snake', maxLength: 20, minLength: 3 },
        flow: { caseStyle: 'kebab', maxLength: 40, minLength: 3 },
        icon: { caseStyle: 'kebab', maxLength: 30, prefix: 'icon-' },
    },
    product: {
        component: { caseStyle: 'pascal', maxLength: 30 },
        file: { caseStyle: 'kebab', maxLength: 40 },
        route: { caseStyle: 'kebab', maxLength: 25 },
        db_table: { caseStyle: 'snake', maxLength: 30 },
        feature: { caseStyle: 'pascal', maxLength: 30 },
        tier: { caseStyle: 'pascal', maxLength: 20 },
        flow: { caseStyle: 'pascal', maxLength: 30 },
        icon: { caseStyle: 'kebab', maxLength: 25 },
    },
    marketing: {
        component: { caseStyle: 'pascal', maxLength: 40 },
        file: { caseStyle: 'kebab', maxLength: 50 },
        route: { caseStyle: 'kebab', maxLength: 30 },
        db_table: { caseStyle: 'snake', maxLength: 30 },
        feature: { caseStyle: 'pascal', maxLength: 40 },
        tier: { caseStyle: 'pascal', maxLength: 25 },
        flow: { caseStyle: 'pascal', maxLength: 30 },
        icon: { caseStyle: 'kebab', maxLength: 30 },
    },
    internal: {
        component: { caseStyle: 'pascal', maxLength: 50 },
        file: { caseStyle: 'kebab', maxLength: 60 },
        route: { caseStyle: 'kebab', maxLength: 40 },
        db_table: { caseStyle: 'snake', maxLength: 40 },
        feature: { caseStyle: 'snake', maxLength: 40 },
        tier: { caseStyle: 'snake', maxLength: 30 },
        flow: { caseStyle: 'snake', maxLength: 40 },
        icon: { caseStyle: 'kebab', maxLength: 40 },
    },
};

export function getDefaultRules(scope: NamingScope, kind: NamingTargetType): NamingRules {
    const scopeRules = DEFAULT_RULES[scope]?.[kind] || {};
    return {
        caseStyle: scopeRules.caseStyle || 'kebab',
        maxLength: scopeRules.maxLength || 50,
        minLength: scopeRules.minLength || 2,
        allowedCharacters: /^[a-zA-Z0-9_-]+$/,
        prefix: scopeRules.prefix,
        suffix: scopeRules.suffix,
        bannedTokens: ['test', 'temp', 'tmp', 'foo', 'bar', 'asdf'],
        reservedNames: ['new', 'delete', 'create', 'update', 'null', 'undefined'],
    };
}

export function matchesCaseStyle(name: string, style: CaseStyle): boolean {
    switch (style) {
        case 'snake':
            return /^[a-z][a-z0-9_]*$/.test(name);
        case 'camel':
            return /^[a-z][a-zA-Z0-9]*$/.test(name);
        case 'pascal':
            return /^[A-Z][a-zA-Z0-9]*$/.test(name);
        case 'kebab':
            return /^[a-z][a-z0-9-]*$/.test(name);
        case 'constant':
            return /^[A-Z][A-Z0-9_]*$/.test(name);
        default:
            return true;
    }
}

export function convertToCase(name: string, style: CaseStyle): string {
    // Split on common delimiters
    const words = name
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[-_]/g, ' ')
        .toLowerCase()
        .split(' ')
        .filter(Boolean);

    switch (style) {
        case 'snake':
            return words.join('_');
        case 'camel':
            return words[0] + words.slice(1).map(w => w[0].toUpperCase() + w.slice(1)).join('');
        case 'pascal':
            return words.map(w => w[0].toUpperCase() + w.slice(1)).join('');
        case 'kebab':
            return words.join('-');
        case 'constant':
            return words.join('_').toUpperCase();
        default:
            return name;
    }
}
