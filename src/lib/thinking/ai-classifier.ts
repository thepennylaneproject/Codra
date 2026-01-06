/**
 * AI-Powered Fragment Classifier
 *
 * Uses a language model to classify fragments when local heuristics
 * are insufficient. More accurate but costs tokens.
 *
 * Philosophy: Choose the weakest valid classification if unsure.
 */

import type { ThoughtFragment } from './types';

// ============================================================================
// CLASSIFICATION SCHEMA
// ============================================================================

export type AIFragmentType =
  | 'intent'       // What they want to build/achieve
  | 'constraint'   // Hard limits, what they won't do
  | 'anxiety'      // Worries, fears, concerns
  | 'aesthetic'    // How it should feel/look
  | 'value'        // Core beliefs, recurring themes
  | 'anti-pattern'; // What they hate, want to avoid

export type AIFragmentStrength =
  | 'passing'   // Mentioned once, might change
  | 'recurring' // Mentioned multiple times
  | 'core';     // Central to identity

export type AIFragmentDomain =
  | 'product'   // User-facing, features, audience
  | 'system'    // Technical, architecture, infrastructure
  | 'narrative' // Voice, brand, messaging
  | 'execution'; // Timeline, budget, process

export interface AIClassificationResult {
  type: AIFragmentType;
  strength: AIFragmentStrength;
  domain: AIFragmentDomain;
  confidence: number; // 0.0 - 1.0
}

// ============================================================================
// CLASSIFICATION PROMPT
// ============================================================================

const CLASSIFICATION_SYSTEM_PROMPT = `You are a classification engine. You do not explain yourself.

TASK:
Classify the following thought fragment.

RULES:
- Do not rewrite the text.
- Do not infer intent beyond what is present.
- Choose the weakest valid classification if unsure.
- Return JSON only.`;

function buildClassificationUserPrompt(
  fragmentText: string,
  existingFragments: ThoughtFragment[]
): string {
  const fragmentList = existingFragments.length > 0
    ? existingFragments.map((f) => `- "${f.content}"`).join('\n')
    : '(none)';

  return `INPUT:
Fragment text:
"${fragmentText}"

Existing fragments (for recurrence detection):
${fragmentList}

OUTPUT JSON SCHEMA:
{
  "type": "intent | constraint | anxiety | aesthetic | value | anti-pattern",
  "strength": "passing | recurring | core",
  "domain": "product | system | narrative | execution",
  "confidence": 0.0-1.0
}`;
}

// ============================================================================
// CLASSIFIER INTERFACE
// ============================================================================

export interface ClassifierProvider {
  classify(
    fragmentText: string,
    existingFragments: ThoughtFragment[]
  ): Promise<AIClassificationResult>;
}

/**
 * Create a classifier that uses the provided AI completion function.
 */
export function createAIClassifier(
  complete: (systemPrompt: string, userPrompt: string) => Promise<string>
): ClassifierProvider {
  return {
    async classify(
      fragmentText: string,
      existingFragments: ThoughtFragment[]
    ): Promise<AIClassificationResult> {
      const userPrompt = buildClassificationUserPrompt(fragmentText, existingFragments);

      try {
        const response = await complete(CLASSIFICATION_SYSTEM_PROMPT, userPrompt);
        const result = parseClassificationResponse(response);
        return result;
      } catch (error) {
        // Fall back to safe defaults on error
        console.warn('AI classification failed, using defaults:', error);
        return {
          type: 'intent',
          strength: 'passing',
          domain: 'product',
          confidence: 0.3,
        };
      }
    },
  };
}

/**
 * Parse the AI response into a classification result.
 */
function parseClassificationResponse(response: string): AIClassificationResult {
  // Extract JSON from response (may be wrapped in markdown code blocks)
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate and normalize
  return {
    type: validateType(parsed.type),
    strength: validateStrength(parsed.strength),
    domain: validateDomain(parsed.domain),
    confidence: validateConfidence(parsed.confidence),
  };
}

function validateType(type: unknown): AIFragmentType {
  const validTypes: AIFragmentType[] = [
    'intent', 'constraint', 'anxiety', 'aesthetic', 'value', 'anti-pattern'
  ];
  if (typeof type === 'string' && validTypes.includes(type as AIFragmentType)) {
    return type as AIFragmentType;
  }
  return 'intent'; // Safe default
}

function validateStrength(strength: unknown): AIFragmentStrength {
  const validStrengths: AIFragmentStrength[] = ['passing', 'recurring', 'core'];
  if (typeof strength === 'string' && validStrengths.includes(strength as AIFragmentStrength)) {
    return strength as AIFragmentStrength;
  }
  return 'passing'; // Weakest valid
}

function validateDomain(domain: unknown): AIFragmentDomain {
  const validDomains: AIFragmentDomain[] = ['product', 'system', 'narrative', 'execution'];
  if (typeof domain === 'string' && validDomains.includes(domain as AIFragmentDomain)) {
    return domain as AIFragmentDomain;
  }
  return 'product'; // Safe default
}

function validateConfidence(confidence: unknown): number {
  if (typeof confidence === 'number' && confidence >= 0 && confidence <= 1) {
    return confidence;
  }
  return 0.5; // Neutral confidence
}

// ============================================================================
// HYBRID CLASSIFIER (Local + AI)
// ============================================================================

import {
  classifyFragment as classifyLocal,
  findSimilarFragments,
} from './fragment-normalizer';

export interface HybridClassifierConfig {
  /** Use AI when local confidence is below this threshold */
  aiThreshold: number;
  /** Maximum cost per classification (in tokens) */
  maxTokens: number;
  /** Whether AI classification is enabled */
  aiEnabled: boolean;
}

const DEFAULT_CONFIG: HybridClassifierConfig = {
  aiThreshold: 0.6,
  maxTokens: 200,
  aiEnabled: false, // Disabled by default until configured
};

/**
 * Hybrid classifier that uses local heuristics first,
 * then falls back to AI for ambiguous cases.
 */
export function createHybridClassifier(
  aiComplete: ((systemPrompt: string, userPrompt: string) => Promise<string>) | null,
  config: Partial<HybridClassifierConfig> = {}
): ClassifierProvider {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const aiClassifier = aiComplete ? createAIClassifier(aiComplete) : null;

  return {
    async classify(
      fragmentText: string,
      existingFragments: ThoughtFragment[]
    ): Promise<AIClassificationResult> {
      // First, try local classification
      const localResult = classifyLocal(fragmentText);

      // Check for similar fragments to detect recurrence
      const similar = findSimilarFragments(fragmentText, existingFragments, 0.4);
      const isRecurring = similar.length > 0;
      const isCore = similar.some((f) => f.strength === 'core') || similar.length >= 2;

      // Map local types to AI types
      const mappedType = mapLocalTypeToAI(localResult.type);
      const mappedStrength: AIFragmentStrength = isCore
        ? 'core'
        : isRecurring
        ? 'recurring'
        : 'passing';

      // Calculate local confidence
      const localConfidence = calculateLocalConfidence(localResult, similar);

      // If local confidence is high enough, use local result
      if (localConfidence >= finalConfig.aiThreshold || !finalConfig.aiEnabled || !aiClassifier) {
        return {
          type: mappedType,
          strength: mappedStrength,
          domain: localResult.domain as AIFragmentDomain,
          confidence: localConfidence,
        };
      }

      // Otherwise, use AI classification
      try {
        const aiResult = await aiClassifier.classify(fragmentText, existingFragments);
        return aiResult;
      } catch {
        // Fall back to local on AI failure
        return {
          type: mappedType,
          strength: mappedStrength,
          domain: localResult.domain as AIFragmentDomain,
          confidence: localConfidence,
        };
      }
    },
  };
}

/**
 * Map local fragment types to AI types.
 */
function mapLocalTypeToAI(
  localType: string
): AIFragmentType {
  const mapping: Record<string, AIFragmentType> = {
    statement: 'intent',
    question: 'intent', // Questions imply intent to understand
    constraint: 'constraint',
    anxiety: 'anxiety',
    signal: 'value',
    aesthetic: 'aesthetic',
    'anti-pattern': 'anti-pattern',
  };
  return mapping[localType] ?? 'intent';
}

/**
 * Calculate confidence based on local classification quality.
 */
function calculateLocalConfidence(
  localResult: ReturnType<typeof classifyLocal>,
  similarFragments: ThoughtFragment[]
): number {
  let confidence = 0.5; // Base confidence

  // Boost for clear type classification
  if (['constraint', 'anxiety', 'anti-pattern'].includes(localResult.type)) {
    confidence += 0.2; // These patterns are usually clear
  }

  // Boost for similar fragments found (validates the classification)
  if (similarFragments.length > 0) {
    confidence += 0.15;
  }

  // Boost for strong sentiment (clearer intent)
  if (localResult.sentiment !== 'neutral') {
    confidence += 0.1;
  }

  return Math.min(confidence, 0.95);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  CLASSIFICATION_SYSTEM_PROMPT,
  buildClassificationUserPrompt,
};
