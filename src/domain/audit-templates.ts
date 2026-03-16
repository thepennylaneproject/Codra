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

export const CODEBASE_INTELLIGENCE_EXTRACTION_PROMPT = `You are conducting an investor-readiness audit of a software project repository. The founder is actively seeking investment. Your job is to evaluate the current state of this repo and flag anything that would raise concern, signal amateur habits, or undermine credibility with a technical evaluator or VC. Be direct and specific. Do not soften findings.

── REPO HYGIENE ──────────────────────────────────────────

1. Does a README.md exist at the root? If yes, evaluate it:
   - Does it clearly state what this product does in 1–2 sentences?
   - Does it include setup/install instructions?
   - Does it document environment variables required (without exposing values)?
   - Does it include a live demo link or screenshots?
   - Is it current — does it reflect the actual state of the project?

2. Is there a .gitignore present and complete? Flag any of the following if found committed to the repo:
   - .env files or any file containing secrets, API keys, or tokens
   - node_modules/, __pycache__/, .DS_Store, *.log files
   - Build artifacts or dist folders that should not be versioned

3. Is there a LICENSE file? If not, flag it — unlicensed code is a legal ambiguity for investors.

4. Does a package.json (or equivalent) exist with accurate name, version, description, and author fields? Flag placeholder or missing values.

── SECURITY ──────────────────────────────────────────────

5. Scan git history and current files for any hardcoded secrets, API keys, tokens, database URLs, or credentials. Flag every instance, even in commented-out code.

6. Are environment variables referenced via process.env or equivalent — never hardcoded? Confirm a .env.example or equivalent template exists to document required variables without exposing values.

7. Check for exposed Supabase keys, Stripe keys, or other service credentials in client-side code or public config files.

8. Are there any public-facing API routes with no authentication or rate limiting? Flag them.

── DOCUMENTATION ─────────────────────────────────────────

9. Is there any inline code documentation — JSDoc, TypeScript types, or comments explaining non-obvious logic? Flag files that are completely undocumented.

10. Are TypeScript types defined and used consistently, or are there widespread \`any\` types that suggest incomplete implementation?

11. Is there a CHANGELOG.md or any record of version history? Not required, but flag its absence as a recommendation.

12. Do component or function names communicate intent clearly, or is there significant naming ambiguity that would slow a new reader?

── CODE QUALITY ──────────────────────────────────────────

13. Is there an ESLint, Prettier, or equivalent linter config present? If not, flag it — linting discipline signals engineering maturity.

14. Are there any obvious dead code blocks, commented-out code dumps, or TODO/FIXME comments that suggest unfinished work? List them.

15. Is error handling present in async operations and API calls, or are there bare unhandled promises?

16. Are there any console.log statements left in production-facing code? Flag all instances.

17. Is there evidence of copy-paste code that should be abstracted into reusable utilities or components?

── CI/CD & DEPLOYMENT ────────────────────────────────────

18. Is there a CI/CD pipeline configured (GitHub Actions, Netlify CI, etc.)? If not, flag the absence.

19. Is the deployment process documented — where does this deploy, how, and what are the environment requirements?

20. Are there separate environments defined (development, staging, production), or is everything running against a single environment?

21. Does the project build successfully from a clean install? Simulate: \`npm install && npm run build\`. Flag any build errors or missing steps.

── DEPENDENCY MANAGEMENT ────────────────────────────────

22. Review package.json dependencies. Flag:
    - Any packages with known critical vulnerabilities (run npm audit equivalent)
    - Any packages that are severely out of date (major version behind)
    - Any unused dependencies that inflate the bundle
    - Any dev dependencies incorrectly listed as production dependencies

23. Is the lockfile (package-lock.json or yarn.lock) committed? Flag if missing.

── GIT DISCIPLINE ────────────────────────────────────────

24. Review the last 20 commit messages. Evaluate:
    - Are they descriptive and meaningful, or vague ("fix stuff", "wip", "asdf")?
    - Is there a consistent branching strategy (main/dev/feature branches), or is everything committed directly to main?
    - Are there any massive single commits that bundle unrelated changes?

25. Are there any stale branches that appear abandoned or merged but not cleaned up?

26. Is the repo public or private? If public, verify no sensitive information exists in any commit in history — not just the current HEAD.

── PORTFOLIO COHESION ────────────────────────────────────

27. Does the naming, branding, and purpose of this project align clearly with the stated portfolio (The Penny Lane Project)? Would an investor connecting the dots across the portfolio understand where this fits?

28. Is the tech stack consistent with the rest of the portfolio, or does this project use an entirely different toolchain without documented rationale?

29. Does the project have a live URL or demo environment linked anywhere? If not, flag — investors expect to be able to see the product.

── INVESTOR SIGNALS ──────────────────────────────────────

30. Produce a final Risk Summary with three tiers:
    CRITICAL — must fix before investor review (security issues, secrets in repo, broken build)
    RECOMMENDED — should fix to signal engineering maturity (linting, documentation gaps, dead code)
    POLISH — nice-to-have improvements that signal attention to detail

31. Provide an overall Investor Readiness Score from 1–10, with 10 being fully diligence-ready. Justify the score briefly.

32. List the top 3 highest-leverage actions the founder should take immediately to improve this score.

Format output with clear section headers matching the audit categories above. Be specific — cite file names, line numbers, and commit SHAs where relevant. Do not generalize.`;

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
        name: 'View Source Intelligence Audit',
        systemPrompt: `You are Lyra, conducting source-backed codebase diligence.
Read the repository directly, ground every claim in verifiable code or configuration evidence, and explicitly flag anything that cannot be confirmed from the codebase.`,
        userPromptTemplate: CODEBASE_INTELLIGENCE_EXTRACTION_PROMPT,
        outputInstructions: '',
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
