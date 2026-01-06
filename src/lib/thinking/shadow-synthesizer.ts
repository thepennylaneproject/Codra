/**
 * Shadow Project Synthesizer
 *
 * Synthesizes meaning, not plans.
 * Infers the underlying project shape from accumulated fragments.
 *
 * Rules:
 * - Only elevate beliefs mentioned more than once
 * - Treat anxieties as constraints, not goals
 * - Surface uncertainty explicitly
 * - If readiness < 0.6, say so
 */

import type { ThoughtFragment, ShadowProject, InferredProjectType } from './types';

// ============================================================================
// SYNTHESIS SCHEMA
// ============================================================================

export interface SynthesisResult {
  inferredType: InferredProjectType;
  coreBeliefs: string[];
  constraints: string[];
  anxieties: string[];
  openQuestions: string[];
  readinessScore: number;
  confidenceNotes: string[];
}

// ============================================================================
// SYNTHESIS PROMPT
// ============================================================================

const SYNTHESIS_SYSTEM_PROMPT = `You synthesize meaning, not plans.

TASK:
Given the accumulated fragments, infer the underlying project shape.
Do not propose solutions. Do not generate structure beyond inference.

RULES:
- Only elevate beliefs mentioned more than once.
- Treat anxieties as constraints, not goals.
- Surface uncertainty explicitly.
- If readiness < 0.6, say so.`;

function buildSynthesisUserPrompt(fragments: ThoughtFragment[]): string {
  const fragmentList = fragments
    .map((f) => {
      const meta = [];
      if (f.strength !== 'passing') meta.push(f.strength);
      if (f.mentionCount > 1) meta.push(`×${f.mentionCount}`);
      const metaStr = meta.length > 0 ? ` [${meta.join(', ')}]` : '';
      return `- "${f.content}" (${f.type})${metaStr}`;
    })
    .join('\n');

  return `INPUT:
Fragments:
${fragmentList}

OUTPUT JSON:
{
  "inferredType": "website | app | campaign | content | product | brand-identity | unknown",
  "coreBeliefs": [],
  "constraints": [],
  "anxieties": [],
  "openQuestions": [],
  "readinessScore": 0.0-1.0,
  "confidenceNotes": []
}`;
}

// ============================================================================
// AI SYNTHESIZER
// ============================================================================

export interface SynthesizerProvider {
  synthesize(fragments: ThoughtFragment[]): Promise<SynthesisResult>;
}

/**
 * Create an AI-powered shadow synthesizer.
 */
export function createAISynthesizer(
  complete: (systemPrompt: string, userPrompt: string) => Promise<string>
): SynthesizerProvider {
  return {
    async synthesize(fragments: ThoughtFragment[]): Promise<SynthesisResult> {
      if (fragments.length < 3) {
        return createEmptySynthesis('Insufficient fragments for synthesis');
      }

      const userPrompt = buildSynthesisUserPrompt(fragments);

      try {
        const response = await complete(SYNTHESIS_SYSTEM_PROMPT, userPrompt);
        return parseSynthesisResponse(response);
      } catch (error) {
        console.warn('AI synthesis failed, using local fallback:', error);
        return synthesizeLocally(fragments);
      }
    },
  };
}

/**
 * Parse AI synthesis response.
 */
function parseSynthesisResponse(response: string): SynthesisResult {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in synthesis response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    inferredType: validateInferredType(parsed.inferredType),
    coreBeliefs: validateStringArray(parsed.coreBeliefs),
    constraints: validateStringArray(parsed.constraints),
    anxieties: validateStringArray(parsed.anxieties),
    openQuestions: validateStringArray(parsed.openQuestions),
    readinessScore: validateScore(parsed.readinessScore),
    confidenceNotes: validateStringArray(parsed.confidenceNotes),
  };
}

// ============================================================================
// LOCAL SYNTHESIZER (Fallback)
// ============================================================================

/**
 * Local synthesis when AI is unavailable or fails.
 * Less nuanced but functional.
 */
export function synthesizeLocally(fragments: ThoughtFragment[]): SynthesisResult {
  // Extract by type and strength
  const recurring = fragments.filter(
    (f) => f.strength === 'recurring' || f.strength === 'core' || f.mentionCount > 1
  );
  const core = fragments.filter((f) => f.strength === 'core');
  const anxietyFragments = fragments.filter((f) => f.type === 'anxiety');
  const constraintFragments = fragments.filter((f) => f.type === 'constraint');
  const questionFragments = fragments.filter((f) => f.type === 'question');
  const antiPatternFragments = fragments.filter((f) => f.type === 'anti-pattern');

  // Core beliefs: only from recurring/core strength
  const coreBeliefs = recurring
    .filter((f) => f.type === 'statement' || f.type === 'signal')
    .map((f) => f.content);

  // Constraints: explicit constraints + anxieties (anxieties become constraints)
  const constraints = [
    ...constraintFragments.map((f) => f.content),
    ...anxietyFragments.map((f) => `[concern] ${f.content}`),
    ...antiPatternFragments.map((f) => `[avoid] ${f.content}`),
  ];

  // Anxieties: preserved separately for visibility
  const anxieties = anxietyFragments.map((f) => f.content);

  // Open questions
  const openQuestions = questionFragments.map((f) => f.content);

  // Infer type from content
  const inferredType = inferProjectType(fragments);

  // Calculate readiness
  const readinessScore = calculateReadiness(fragments, recurring, openQuestions);

  // Confidence notes
  const confidenceNotes: string[] = [];

  if (fragments.length < 5) {
    confidenceNotes.push('Few fragments collected');
  }
  if (core.length === 0) {
    confidenceNotes.push('No core beliefs established yet');
  }
  if (openQuestions.length > 3) {
    confidenceNotes.push('Many open questions remain');
  }
  if (anxietyFragments.length > constraintFragments.length) {
    confidenceNotes.push('More concerns than explicit constraints');
  }
  if (readinessScore < 0.6) {
    confidenceNotes.push('Not ready for structure yet');
  }

  return {
    inferredType,
    coreBeliefs,
    constraints,
    anxieties,
    openQuestions,
    readinessScore,
    confidenceNotes,
  };
}

/**
 * Infer project type from fragment content.
 */
function inferProjectType(fragments: ThoughtFragment[]): InferredProjectType {
  const allContent = fragments.map((f) => f.content.toLowerCase()).join(' ');

  const typeSignals: Record<InferredProjectType, RegExp[]> = {
    website: [/website/i, /landing page/i, /web page/i, /site/i, /homepage/i],
    app: [/\bapp\b/i, /application/i, /mobile/i, /ios/i, /android/i, /software/i],
    campaign: [/campaign/i, /launch/i, /marketing/i, /promotion/i, /ads?\b/i],
    content: [/content/i, /blog/i, /article/i, /copy/i, /writing/i, /newsletter/i],
    product: [/product/i, /saas/i, /service/i, /platform/i, /tool/i, /solution/i],
    'brand-identity': [/brand/i, /identity/i, /logo/i, /visual/i, /design system/i],
    system: [/system/i, /architecture/i, /infrastructure/i, /backend/i, /api/i],
    unknown: [],
  };

  const scores: Record<InferredProjectType, number> = {
    website: 0,
    app: 0,
    campaign: 0,
    content: 0,
    product: 0,
    'brand-identity': 0,
    system: 0,
    unknown: 0,
  };

  for (const [type, patterns] of Object.entries(typeSignals)) {
    scores[type as InferredProjectType] = patterns.filter((p) =>
      p.test(allContent)
    ).length;
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    return 'unknown';
  }

  const topType = Object.entries(scores).find(
    ([, score]) => score === maxScore
  );
  return (topType?.[0] as InferredProjectType) ?? 'unknown';
}

/**
 * Calculate readiness score.
 */
function calculateReadiness(
  fragments: ThoughtFragment[],
  recurring: ThoughtFragment[],
  openQuestions: string[]
): number {
  let score = 0;

  // Base from fragment count (max 0.25)
  score += Math.min(fragments.length / 20, 0.25);

  // Recurring themes established (max 0.25)
  score += Math.min(recurring.length / 4, 0.25);

  // Some core beliefs (max 0.2)
  const coreCount = fragments.filter((f) => f.strength === 'core').length;
  score += Math.min(coreCount / 2, 0.2);

  // Constraints defined (max 0.15)
  const constraintCount = fragments.filter((f) => f.type === 'constraint').length;
  score += constraintCount > 0 ? 0.15 : 0;

  // Penalty for too many open questions (max -0.15)
  score -= Math.min(openQuestions.length * 0.03, 0.15);

  return Math.max(0, Math.min(1, score));
}

/**
 * Create empty synthesis result.
 */
function createEmptySynthesis(note: string): SynthesisResult {
  return {
    inferredType: 'unknown',
    coreBeliefs: [],
    constraints: [],
    anxieties: [],
    openQuestions: [],
    readinessScore: 0,
    confidenceNotes: [note],
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateInferredType(type: unknown): InferredProjectType {
  const validTypes: InferredProjectType[] = [
    'website', 'app', 'campaign', 'content', 'product', 'brand-identity', 'system', 'unknown'
  ];
  if (typeof type === 'string' && validTypes.includes(type as InferredProjectType)) {
    return type as InferredProjectType;
  }
  return 'unknown';
}

function validateStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item): item is string => typeof item === 'string');
}

function validateScore(score: unknown): number {
  if (typeof score === 'number' && score >= 0 && score <= 1) {
    return score;
  }
  return 0;
}

// ============================================================================
// SHADOW PROJECT CONVERSION
// ============================================================================

/**
 * Convert synthesis result to ShadowProject.
 */
export function synthesisToShadowProject(
  synthesis: SynthesisResult,
  existingId?: string
): ShadowProject {
  return {
    id: existingId ?? crypto.randomUUID(),
    inferredType: synthesis.inferredType,
    coreBeliefs: synthesis.coreBeliefs,
    constraints: synthesis.constraints,
    anxieties: synthesis.anxieties,
    aesthetics: [], // Not synthesized, preserved from fragments
    antiPatterns: [], // Merged into constraints
    openQuestions: synthesis.openQuestions,
    readinessScore: synthesis.readinessScore,
    confidenceMap: new Map(),
    lastUpdated: new Date(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { SYNTHESIS_SYSTEM_PROMPT, buildSynthesisUserPrompt };
