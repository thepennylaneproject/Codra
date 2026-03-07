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

export const CODEBASE_INTELLIGENCE_EXTRACTION_PROMPT = `# View Source: Codebase Intelligence Extraction Prompt

> **Instructions:** Run this prompt through an AI agent with full access to each codebase. Replace [PROJECT_NAME] with the actual project name before running. Output should be returned in the exact section structure below. Do not skip sections — mark any section where information is unavailable as [NOT FOUND IN CODEBASE — REQUIRES MANUAL INPUT].

---

## THE PROMPT

You are conducting a comprehensive intelligence extraction of the **[PROJECT_NAME]** codebase. Your goal is to produce a structured, investor-grade profile of this project by reading the actual code, configuration, documentation, and commit history. Do not hallucinate or infer — only report what you can verify from the codebase itself. Where you identify gaps, flag them explicitly.

Work through every section below. Be thorough. Be precise. Be honest about what's mature and what's early.

---

### SECTION 1: PROJECT IDENTITY

1. **Project name** (as defined in package.json, config files, or README)
2. **Repository URL** (if available in config/remotes)
3. **One-line description** (pull from README, package.json description, or meta tags — quote it exactly, then write a cleaner version if needed)
4. **Project status** — Based on what you see in the code, classify as one of:
   - \`Concept\` (mostly scaffolding/boilerplate)
   - \`Prototype\` (core features partially implemented)
   - \`Alpha\` (core features working, rough edges)
   - \`Beta\` (feature-complete for v1, needs polish)
   - \`Production\` (deployed, handling real users)
5. **First commit date** and **most recent commit date**
6. **Total number of commits**
7. **Deployment status** — Is this deployed? Where? (check for netlify.toml, vercel.json, Dockerfiles, CI/CD configs, environment configs referencing production URLs)
8. **Live URL(s)** if discoverable in config

---

### SECTION 2: TECHNICAL ARCHITECTURE

1. **Primary language(s) and frameworks** (with versions from package.json, requirements.txt, etc.)
2. **Full dependency list** — Group into:
   - Core framework dependencies
   - UI/styling libraries
   - State management
   - API/data layer
   - AI/ML integrations
   - Authentication/authorization
   - Testing
   - Build tooling
   - Other notable dependencies
3. **Project structure** — Provide the top-level directory tree (2 levels deep) with a one-line explanation of each major directory's purpose
4. **Architecture pattern** — What pattern is this? (monolith, microservices, serverless functions, JAMstack, etc.) Describe the data flow from user interaction to database and back.
5. **Database/storage layer** — What databases, ORMs, or storage solutions are in use? List all tables/collections you can identify from schema files, migrations, or model definitions. For each table, note its columns/fields.
6. **API layer** — Document all API endpoints or serverless functions. For each, note:
   - Route/path
   - HTTP method
   - Brief purpose
   - Authentication required (yes/no)
7. **External service integrations** — List every third-party API or service the code connects to (Stripe, OpenAI, SendGrid, etc.) with what it's used for
8. **AI/ML components** — If the project uses AI, detail:
   - Which models/providers
   - What prompts or chains exist (summarize, don't reproduce full prompts)
   - How AI output is processed and presented to users
9. **Authentication and authorization model** — How do users log in? What permission levels exist?
10. **Environment variables** — List all env vars referenced in the code (names only, never values) grouped by purpose

---

### SECTION 3: FEATURE INVENTORY

For each distinct feature or capability in the application:

1. **Feature name**
2. **User-facing description** (what does this let a user do?)
3. **Implementation completeness** — classify as:
   - \`Scaffolded\` (route/component exists but minimal logic)
   - \`Partial\` (core logic works, UI incomplete or vice versa)
   - \`Functional\` (works end-to-end)
   - \`Polished\` (works well, handles edge cases, good UX)
4. **Key files** (list the 2-5 most important files for this feature)
5. **Dependencies on other features**

---

### SECTION 4: DESIGN SYSTEM & BRAND

1. **Color palette** — Extract all defined colors from:
   - Tailwind config
   - CSS custom properties / variables
   - Theme files
   - Any design token files
   List each color with its name, hex value, and where it's defined.
2. **Typography** — What fonts are loaded? What's the type scale?
3. **Component library** — Is there a shared component system? List all reusable UI components with a one-line description of each.
4. **Design language** — Based on the UI code, describe the visual style (minimal, playful, corporate, editorial, etc.)
5. **Responsive strategy** — How does the app handle mobile vs desktop?
6. **Dark mode** — Is it supported? How is it implemented?
7. **Brand assets** — List any logos, illustrations, or custom icons in the repo

---

### SECTION 5: DATA & SCALE SIGNALS

1. **User model** — What data is stored per user? What's the user journey from signup to value?
2. **Content/data volume** — Are there seed files, fixture data, or references to data volume? How many records does the system seem designed to handle?
3. **Performance considerations** — Any caching, pagination, lazy loading, code splitting, rate limiting, or optimization patterns?
4. **Analytics/tracking** — Is there any analytics integration? What events are tracked?
5. **Error handling** — How are errors caught, logged, and reported?
6. **Testing** — What test coverage exists? List test files found and what they cover.

---

### SECTION 6: MONETIZATION & BUSINESS LOGIC

1. **Pricing/tier structure** — Is there any pricing logic, plan definitions, or feature gating in the code?
2. **Payment integration** — Stripe, PayPal, or other payment processing?
3. **Subscription/billing logic** — Recurring payments? Trial periods? Plan limits?
4. **Feature gates** — What features are restricted by plan/tier?
5. **Usage limits** — Any rate limits, quotas, or credit systems?

---

### SECTION 7: CODE QUALITY & MATURITY SIGNALS

1. **Code organization** — Is there a clear separation of concerns? Are there well-defined modules/layers?
2. **Patterns and conventions** — What design patterns are used? (facade, repository, dependency injection, etc.) Are naming conventions consistent?
3. **Documentation** — README quality, inline comments, JSDoc/docstrings, architecture docs?
4. **TypeScript usage** — How strict? Any \`any\` types? Are interfaces well-defined?
5. **Error handling patterns** — Consistent try/catch? Custom error classes? User-facing error messages?
6. **Git hygiene** — Commit message patterns, branching strategy, PR history?
7. **Technical debt flags** — TODOs, FIXMEs, deprecated code, commented-out blocks, obvious workarounds?
8. **Security posture** — Input validation, SQL injection protection, XSS prevention, CORS config, secrets management?

---

### SECTION 8: ECOSYSTEM CONNECTIONS

1. **Shared code or patterns** with other projects in The Penny Lane Project portfolio (Relevnt, Codra, Ready, Mythos, embr, passagr, advocera)
2. **Shared dependencies or infrastructure** (same Supabase instance? Same Netlify account? Shared component libraries?)
3. **Data connections** — Does this project read from or write to any data source shared with other projects?
4. **Cross-references** — Any imports, links, or references to sister projects in the code?

---

### SECTION 9: WHAT'S MISSING (CRITICAL)

Based on your analysis, identify:

1. **Gaps for a production-ready product** — What would need to be built to serve real users at scale?
2. **Gaps for investor readiness** — What metrics, documentation, or infrastructure is missing that an investor would expect?
3. **Gaps in the codebase itself** — Dead code, unused dependencies, incomplete migrations, orphaned files?
4. **Recommended next steps** — If you had to prioritize the top 5 things to work on next, what would they be and why?

---

### SECTION 10: EXECUTIVE SUMMARY

Write a 3-paragraph summary of this project suitable for an investor audience:

- **Paragraph 1:** What this is, what problem it solves, and for whom
- **Paragraph 2:** Technical credibility — what's built, how it's built, and what it signals about the builder's capabilities
- **Paragraph 3:** Honest assessment of current state and what it would take to reach the next milestone

---

## OUTPUT FORMAT

Return the completed audit as a single structured document using the exact section headers above. Use code blocks for file paths and technical details. Use tables where they improve readability (dependency lists, feature inventories, API endpoints). Flag every instance where information was not found in the codebase versus where you inferred it.

**End your output with a metadata block:**

\`\`\`
---
AUDIT METADATA
Project: [PROJECT_NAME]
Date: [TODAY'S DATE]
Agent: [MODEL NAME AND VERSION]
Codebase access: [full repo / partial / read-only]
Confidence level: [high / medium / low] with explanation
Sections with gaps: [list section numbers]
Total files analyzed: [count]
---
\`\`\``;

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
