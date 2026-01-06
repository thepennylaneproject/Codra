/**
 * Lyra Observer Engine
 *
 * You observe. You do not advise.
 *
 * Lyra detects meaningful patterns across fragments.
 * She surfaces what's there, not what should be.
 *
 * Rules:
 * - Only surface patterns supported by evidence
 * - Prefer absence over assumption
 * - Do not ask direct questions
 */

import type { ThoughtFragment, LyraObservation, ObservationType } from './types';

// ============================================================================
// OBSERVATION SCHEMA
// ============================================================================

export interface ObserverResult {
  type: 'pattern' | 'contradiction' | 'recurring-theme' | 'missing-piece';
  statement: string;
  evidenceFragmentIds: string[];
  confidence: number;
  shouldSurface: boolean;
}

// ============================================================================
// OBSERVER PROMPT
// ============================================================================

const OBSERVER_SYSTEM_PROMPT = `You observe. You do not advise.

TASK:
Detect meaningful patterns across fragments.

RULES:
- Only surface patterns supported by evidence.
- Prefer absence over assumption.
- Do not ask direct questions.`;

function buildObserverUserPrompt(fragments: ThoughtFragment[]): string {
  const fragmentList = fragments
    .map((f) => `[${f.id}] "${f.content}" (${f.type}, ${f.strength})`)
    .join('\n');

  return `INPUT:
Fragments:
${fragmentList}

OUTPUT JSON ARRAY:
[
  {
    "type": "pattern | contradiction | recurring-theme | missing-piece",
    "statement": "string",
    "evidenceFragmentIds": [],
    "confidence": 0.0-1.0,
    "shouldSurface": true | false
  }
]`;
}

// ============================================================================
// AI OBSERVER
// ============================================================================

export interface ObserverProvider {
  observe(fragments: ThoughtFragment[]): Promise<ObserverResult[]>;
}

/**
 * Create an AI-powered observer.
 */
export function createAIObserver(
  complete: (systemPrompt: string, userPrompt: string) => Promise<string>
): ObserverProvider {
  return {
    async observe(fragments: ThoughtFragment[]): Promise<ObserverResult[]> {
      if (fragments.length < 3) {
        return []; // Not enough to observe
      }

      const userPrompt = buildObserverUserPrompt(fragments);

      try {
        const response = await complete(OBSERVER_SYSTEM_PROMPT, userPrompt);
        return parseObserverResponse(response, fragments);
      } catch (error) {
        console.warn('AI observation failed:', error);
        return [];
      }
    },
  };
}

/**
 * Parse observer response.
 */
function parseObserverResponse(
  response: string,
  fragments: ThoughtFragment[]
): ObserverResult[] {
  // Extract JSON array
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    const validFragmentIds = new Set(fragments.map((f) => f.id));

    return parsed
      .map((item) => validateObserverResult(item, validFragmentIds))
      .filter((result): result is ObserverResult => result !== null);
  } catch {
    return [];
  }
}

function validateObserverResult(
  item: unknown,
  validFragmentIds: Set<string>
): ObserverResult | null {
  if (typeof item !== 'object' || item === null) return null;

  const obj = item as Record<string, unknown>;

  // Validate type
  const validTypes = ['pattern', 'contradiction', 'recurring-theme', 'missing-piece'];
  if (typeof obj.type !== 'string' || !validTypes.includes(obj.type)) {
    return null;
  }

  // Validate statement
  if (typeof obj.statement !== 'string' || obj.statement.length === 0) {
    return null;
  }

  // Validate and filter evidence IDs
  let evidenceIds: string[] = [];
  if (Array.isArray(obj.evidenceFragmentIds)) {
    evidenceIds = obj.evidenceFragmentIds.filter(
      (id): id is string => typeof id === 'string' && validFragmentIds.has(id)
    );
  }

  // Require evidence for all types except missing-piece
  if (obj.type !== 'missing-piece' && evidenceIds.length === 0) {
    return null; // No evidence, no observation
  }

  // Validate confidence
  let confidence = 0.5;
  if (typeof obj.confidence === 'number' && obj.confidence >= 0 && obj.confidence <= 1) {
    confidence = obj.confidence;
  }

  // Validate shouldSurface
  const shouldSurface = typeof obj.shouldSurface === 'boolean' ? obj.shouldSurface : false;

  return {
    type: obj.type as ObserverResult['type'],
    statement: obj.statement,
    evidenceFragmentIds: evidenceIds,
    confidence,
    shouldSurface,
  };
}

// ============================================================================
// CONVERT TO LYRA OBSERVATIONS
// ============================================================================

/**
 * Convert observer results to Lyra observations.
 */
export function observerResultsToLyraObservations(
  results: ObserverResult[]
): Omit<LyraObservation, 'id'>[] {
  return results.map((result) => ({
    type: mapObserverTypeToLyra(result.type),
    content: result.statement,
    evidence: result.evidenceFragmentIds,
    confidence: result.confidence,
    shouldSurface: result.shouldSurface,
    surfacedAt: null,
    dismissedAt: null,
  }));
}

function mapObserverTypeToLyra(
  type: ObserverResult['type']
): ObservationType {
  const mapping: Record<ObserverResult['type'], ObservationType> = {
    'pattern': 'pattern',
    'contradiction': 'contradiction',
    'recurring-theme': 'recurring-theme',
    'missing-piece': 'missing-piece',
  };
  return mapping[type];
}

// ============================================================================
// REFLECTION GENERATION (Statements, not questions)
// ============================================================================

/**
 * Generate a reflection statement from an observation.
 * Never a direct question. Always an observation that implies inquiry.
 */
export function generateReflectionStatement(observation: ObserverResult): string {
  // The AI already provides a statement, but we can refine it
  // to ensure it doesn't accidentally ask a question
  let statement = observation.statement;

  // Remove any accidental question marks
  if (statement.endsWith('?')) {
    statement = statement.slice(0, -1) + '.';
  }

  // Remove question-like openings
  const questionPatterns = [
    /^(do you|are you|have you|can you|will you|would you|should you)/i,
    /^(what|why|how|when|where|who|which)\s+(do|does|is|are|was|were|will|would|should|can|could)/i,
  ];

  for (const pattern of questionPatterns) {
    if (pattern.test(statement)) {
      // Rephrase as observation
      statement = `I notice: ${observation.statement.replace(/\?$/, '')}`;
      break;
    }
  }

  return statement;
}

// ============================================================================
// HYBRID OBSERVER (Local + AI)
// ============================================================================

import {
  detectAllPatterns,
  selectObservationsToSurface,
} from './lyra-pattern-detector';

export interface HybridObserverConfig {
  /** Use AI when fragment count exceeds this */
  aiThreshold: number;
  /** Whether AI observation is enabled */
  aiEnabled: boolean;
}

const DEFAULT_CONFIG: HybridObserverConfig = {
  aiThreshold: 8, // Use AI for complex fragment sets
  aiEnabled: false,
};

/**
 * Hybrid observer that uses local detection for simple cases,
 * AI for complex pattern detection.
 */
export function createHybridObserver(
  aiComplete: ((systemPrompt: string, userPrompt: string) => Promise<string>) | null,
  config: Partial<HybridObserverConfig> = {}
): ObserverProvider {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const aiObserver = aiComplete ? createAIObserver(aiComplete) : null;

  return {
    async observe(fragments: ThoughtFragment[]): Promise<ObserverResult[]> {
      // Always run local detection first
      const localObservations = detectAllPatterns(fragments, null);

      // Convert to observer results
      const localResults: ObserverResult[] = localObservations.map((obs) => ({
        type: obs.type as ObserverResult['type'],
        statement: obs.content,
        evidenceFragmentIds: obs.evidence,
        confidence: obs.confidence,
        shouldSurface: obs.shouldSurface,
      }));

      // Use AI for additional patterns if enabled and threshold met
      if (
        finalConfig.aiEnabled &&
        aiObserver &&
        fragments.length >= finalConfig.aiThreshold
      ) {
        try {
          const aiResults = await aiObserver.observe(fragments);

          // Merge, preferring AI results for similar patterns
          return mergeObservations(localResults, aiResults);
        } catch {
          return localResults;
        }
      }

      return localResults;
    },
  };
}

/**
 * Merge local and AI observations, deduplicating similar patterns.
 */
function mergeObservations(
  local: ObserverResult[],
  ai: ObserverResult[]
): ObserverResult[] {
  const merged = [...local];

  for (const aiResult of ai) {
    // Check if a similar observation already exists
    const similar = merged.find(
      (m) =>
        m.type === aiResult.type &&
        hasOverlappingEvidence(m.evidenceFragmentIds, aiResult.evidenceFragmentIds)
    );

    if (similar) {
      // Prefer higher confidence
      if (aiResult.confidence > similar.confidence) {
        similar.statement = aiResult.statement;
        similar.confidence = aiResult.confidence;
        similar.shouldSurface = aiResult.shouldSurface;
      }
    } else {
      merged.push(aiResult);
    }
  }

  return merged;
}

function hasOverlappingEvidence(a: string[], b: string[]): boolean {
  const setA = new Set(a);
  return b.some((id) => setA.has(id));
}

// ============================================================================
// EXPORTS
// ============================================================================

export { OBSERVER_SYSTEM_PROMPT, buildObserverUserPrompt };
