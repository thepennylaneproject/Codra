/**
 * AUDIT TEMPLATES
 * 
 * Optimized, JSON-structured versions of the Lyra audit prompts.
 * These are proprietary templates that power the Coherence Scan.
 */

import type { AuditType, FindingCategory, FindingSeverity, FindingEffort } from './coherence-scan';

// ============================================
// Clarifying Questions
// ============================================

export interface ClarifyingQuestion {
    id: string;
    question: string;
    type: 'text' | 'select' | 'multiselect' | 'scale';
    options?: { value: string; label: string }[];
    placeholder?: string;
    required: boolean;
    /** Only show if another question has a specific value */
    dependsOn?: { questionId: string; value: string };
}

export const CLARIFYING_QUESTIONS: ClarifyingQuestion[] = [
    {
        id: 'project-description',
        question: 'Describe your project in 2-3 sentences.',
        type: 'text',
        placeholder: 'A job search platform that helps candidates track applications...',
        required: true,
    },
    {
        id: 'target-audience',
        question: 'Who is your primary user?',
        type: 'text',
        placeholder: 'Early-career job seekers, 22-35, tech industry...',
        required: true,
    },
    {
        id: 'launch-timeline',
        question: 'When do you need to ship?',
        type: 'select',
        options: [
            { value: 'asap', label: 'ASAP (this week)' },
            { value: 'days', label: 'Within days' },
            { value: 'weeks', label: 'Within weeks' },
            { value: 'months', label: 'Within months' },
            { value: 'exploring', label: 'Just exploring' },
        ],
        required: true,
    },
    {
        id: 'known-constraints',
        question: 'What constraints are you working with?',
        type: 'multiselect',
        options: [
            { value: 'time', label: 'Limited time' },
            { value: 'budget', label: 'Limited budget' },
            { value: 'team', label: 'Small team / solo' },
            { value: 'tech-debt', label: 'Technical debt' },
            { value: 'legacy', label: 'Legacy system integration' },
            { value: 'compliance', label: 'Regulatory compliance' },
        ],
        required: false,
    },
    {
        id: 'focus-areas',
        question: 'Any specific concerns?',
        type: 'multiselect',
        options: [
            { value: 'onboarding', label: 'Onboarding flow' },
            { value: 'ux', label: 'Overall UX/UI' },
            { value: 'features', label: 'Feature completeness' },
            { value: 'performance', label: 'Performance' },
            { value: 'monetization', label: 'Monetization' },
            { value: 'trust', label: 'User trust / safety' },
        ],
        required: false,
    },
];

// ============================================
// Output Schema for AI
// ============================================

export interface AuditOutputSchema {
    findings: {
        category: FindingCategory;
        severity: FindingSeverity;
        title: string;
        observation: string;
        whyItMatters: string;
        userImpact: string;
        recommendation: string;
        estimatedEffort: FindingEffort;
    }[];
    summary?: {
        topBlindSpot?: string;
        topStrength?: string;
        strategicQuestion?: string;
    };
}

// ============================================
// Audit Templates
// ============================================

export interface AuditTemplate {
    id: AuditType;
    name: string;
    systemPrompt: string;
    userPromptTemplate: string;
    outputInstructions: string;
    maxTokens: number;
    temperature: number;
}

const JSON_OUTPUT_INSTRUCTIONS = `
Return your findings as valid JSON matching this schema:
{
  "findings": [
    {
      "category": "<one of the valid categories>",
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "title": "<short descriptive title, max 60 chars>",
      "observation": "<what you observed, max 100 words>",
      "whyItMatters": "<why this matters, max 50 words>",
      "userImpact": "<impact on users, max 50 words>",
      "recommendation": "<actionable fix, max 75 words>",
      "estimatedEffort": "trivial" | "small" | "medium" | "large"
    }
  ],
  "summary": {
    "topBlindSpot": "<most dangerous blind spot, if applicable>",
    "topStrength": "<biggest underutilized strength>",
    "strategicQuestion": "<one question to consider>"
  }
}

Be direct. Be specific. Prioritize:
1. Issues that block understanding
2. Issues that break trust
3. Issues that hide value
4. Issues that increase cognitive load
5. Issues that reduce polish

Return ONLY valid JSON, no markdown formatting.
`;

export const AUDIT_TEMPLATES: Record<AuditType, AuditTemplate> = {
    'ship-ready': {
        id: 'ship-ready',
        name: 'Deployment Readiness Audit',
        systemPrompt: `You are Lyra, a master-level product auditor, UX strategist, and launch editor.
Your role is to evaluate this application as if it were preparing to ship to real users within 14 days.
Your objective is to identify everything that prevents this app from feeling complete, coherent, trustworthy, and obvious to use.

Assume:
- Features may exist but be poorly surfaced
- Workflows may begin but not properly resolve
- Visual systems may be partially implemented
- Copy may be locally correct but globally inconsistent
- The builder is intelligent but time-constrained

Think holistically and critically.`,
        userPromptTemplate: `Evaluate this project for ship-readiness:

PROJECT: {{projectDescription}}
AUDIENCE: {{targetAudience}}
TIMELINE: {{launchTimeline}}
CONSTRAINTS: {{knownConstraints}}
FOCUS AREAS: {{focusAreas}}

Analyze across these dimensions:
1. Workflow Completeness - dead-ends, circular flows, unclear state
2. Feature Visibility - buried features, unclear value
3. UX & Cognitive Load - overwhelm, too many choices
4. Visual Consistency - spacing, typography, color coherence
5. Copy & Voice - tone, terminology, clarity
6. Information Architecture - navigation, grouping, mental models
7. State, Feedback & Trust - loading, errors, confirmations
8. Onboarding & First-Run - guidance, first success
9. Launch Polish - placeholders, debug artifacts, edge cases`,
        outputInstructions: JSON_OUTPUT_INSTRUCTIONS,
        maxTokens: 2000,
        temperature: 0.3,
    },

    'blind-spot': {
        id: 'blind-spot',
        name: 'Coverage Gap Audit',
        systemPrompt: `You are Lyra, a founder-level mirror, assumption interrogator, and strategic truth-teller.
Your role is to surface hidden assumptions, unchallenged beliefs, and perspective gaps held by the builder that may be shaping this product in limiting ways.
You are not adversarial. You are exacting.`,
        userPromptTemplate: `Surface the blind spots in this project:

PROJECT: {{projectDescription}}
AUDIENCE: {{targetAudience}}
TIMELINE: {{launchTimeline}}
CONSTRAINTS: {{knownConstraints}}

Analyze these dimensions:
1. User Assumptions - What knowledge, motivation, emotional state is assumed?
2. Builder Bias - Where does expert thinking leak into beginner UX?
3. Success Definition - What does builder vs user consider success?
4. Risk & Avoidance - What problems is the product carefully not solving?
5. Narrative Blind Spots - What story does the product actually tell vs intended?

Surface where users may be more anxious, tired, or overwhelmed than expected.
Identify where personal workflow masquerades as universal workflow.`,
        outputInstructions: JSON_OUTPUT_INSTRUCTIONS,
        maxTokens: 1500,
        temperature: 0.4,
    },

    'kill-list': {
        id: 'kill-list',
        name: 'Decommissioning Audit',
        systemPrompt: `You are Lyra, a master-level product editor, reductionist strategist, and ruthless clarity engine.
Your role is to identify features, flows, UI elements, settings, and concepts that should be removed, merged, hidden, deferred, or killed outright.

Guiding belief: Every feature has a cost. Anything that does not compound value is debt.
You are not emotionally attached to what exists. You are loyal only to clarity, power, and momentum.`,
        userPromptTemplate: `Identify what should be killed, merged, or deferred:

PROJECT: {{projectDescription}}
AUDIENCE: {{targetAudience}}
TIMELINE: {{launchTimeline}}

Analyze:
1. Feature Value-to-Cost - Low usage, high surface area features
2. Redundancy & Overlap - Parallel features solving same problem
3. UX Drag - Extra steps without payoff
4. "Not Yet" Items - Features that belong in v2/v3
5. Conceptual Integrity - Features that pull the app in two directions

For each item, recommend: Kill Immediately, Merge/Simplify, Hide Behind Progressive Disclosure, or Defer.`,
        outputInstructions: JSON_OUTPUT_INSTRUCTIONS,
        maxTokens: 1200,
        temperature: 0.3,
    },

    'investor-diligence': {
        id: 'investor-diligence',
        name: 'Investor Diligence Audit',
        systemPrompt: `You are Lyra, a venture-grade product evaluator and market analyst.
Your role is to assess this product through the lens of an investor conducting due diligence.
Focus on market fit, defensibility, scalability, and team execution signals.`,
        userPromptTemplate: `Conduct investor-level diligence on this project:

PROJECT: {{projectDescription}}
AUDIENCE: {{targetAudience}}
TIMELINE: {{launchTimeline}}
CONSTRAINTS: {{knownConstraints}}

Evaluate:
1. Product-Market Fit signals
2. Competitive positioning and moats
3. Scalability indicators
4. Execution quality signals
5. Red flags an investor would notice
6. Missing social proof or validation

Be thorough but prioritize issues that would concern a sophisticated investor.`,
        outputInstructions: JSON_OUTPUT_INSTRUCTIONS,
        maxTokens: 2000,
        temperature: 0.3,
    },

    'unclaimed-value': {
        id: 'unclaimed-value',
        name: 'Value Opportunity Audit',
        systemPrompt: `You are Lyra, an opportunity spotter and value extraction strategist.
Your role is to identify missed opportunities, underutilized features, and hidden wins in this product.
Look for value that exists but isn't being captured or communicated.`,
        userPromptTemplate: `Surface unclaimed value in this project:

PROJECT: {{projectDescription}}
AUDIENCE: {{targetAudience}}
TIMELINE: {{launchTimeline}}

Look for:
1. Features that exist but aren't properly showcased
2. Value propositions that aren't being communicated
3. Cross-sell or upsell opportunities
4. Data or capabilities that could enable new features
5. User behaviors that indicate unmet needs
6. Competitive advantages not being leveraged`,
        outputInstructions: JSON_OUTPUT_INSTRUCTIONS,
        maxTokens: 1500,
        temperature: 0.5,
    },

    'coherence-loop': {
        id: 'coherence-loop',
        name: 'Coherence Loop',
        systemPrompt: `You are Lyra, conducting a post-fix verification.
Your role is to compare the current state against previous findings and assess improvement.`,
        userPromptTemplate: `Compare current state to previous findings:

PROJECT: {{projectDescription}}

PREVIOUS FINDINGS:
{{previousFindings}}

FIXES APPLIED:
{{fixesApplied}}

For each previous finding, assess:
1. Was it addressed?
2. Was the fix effective?
3. Did the fix introduce new issues?

Provide an overall coherence assessment and remaining gaps.`,
        outputInstructions: JSON_OUTPUT_INSTRUCTIONS,
        maxTokens: 1200,
        temperature: 0.2,
    },
};

// ============================================
// Template Helpers
// ============================================

/**
 * Interpolate template variables
 */
export function interpolateTemplate(
    template: string,
    context: Record<string, string | string[]>
): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = context[key];
        if (Array.isArray(value)) {
            return value.length > 0 ? value.join(', ') : 'None specified';
        }
        return value ?? 'Not provided';
    });
}

/**
 * Build the full prompt for an audit
 */
export function buildAuditPrompt(
    auditType: AuditType,
    context: Record<string, string | string[]>
): { system: string; user: string } {
    const template = AUDIT_TEMPLATES[auditType];
    return {
        system: template.systemPrompt,
        user: interpolateTemplate(template.userPromptTemplate, context) + '\n\n' + template.outputInstructions,
    };
}

/**
 * Parse JSON response from audit
 */
export function parseAuditResponse(response: string): AuditOutputSchema | null {
    try {
        // Try to extract JSON from response (in case there's extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        
        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed.findings || !Array.isArray(parsed.findings)) return null;
        
        return parsed as AuditOutputSchema;
    } catch {
        return null;
    }
}
