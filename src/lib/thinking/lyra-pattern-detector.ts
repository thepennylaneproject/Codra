/**
 * Lyra Pattern Detection Engine
 *
 * Lyra doesn't ask onboarding questions.
 * Lyra surfaces patterns you didn't notice.
 *
 * "You're talking about trust more than features. Is that intentional?"
 * "You've mentioned cost control three times. That's not incidental."
 */

import type {
  ThoughtFragment,
  LyraObservation,
  ObservationType,
  ReflectiveIntervention,
  ShadowProject,
} from './types';

import { extractThemes, calculateFragmentSimilarity } from './fragment-normalizer';


// ============================================================================
// PATTERN DETECTION
// ============================================================================

/**
 * Configuration for pattern detection sensitivity.
 */
interface DetectionConfig {
  /** Minimum times a theme must appear to be noted */
  recurringThreshold: number;
  /** Minimum times a theme must appear to surface as observation */
  surfaceThreshold: number;
  /** Minimum confidence to surface an observation */
  confidenceThreshold: number;
  /** How many fragments before we start looking for patterns */
  warmupFragments: number;
}

const DEFAULT_CONFIG: DetectionConfig = {
  recurringThreshold: 2,
  surfaceThreshold: 3,
  confidenceThreshold: 0.6,
  warmupFragments: 3,
};


/**
 * Detect recurring themes across fragments.
 */
export function detectRecurringThemes(
  fragments: ThoughtFragment[],
  config: DetectionConfig = DEFAULT_CONFIG
): LyraObservation[] {
  if (fragments.length < config.warmupFragments) {
    return [];
  }

  const themes = extractThemes(fragments);
  const observations: LyraObservation[] = [];

  for (const theme of themes) {
    if (theme.fragmentIds.length >= config.surfaceThreshold) {
      observations.push({
        id: '', // Will be assigned by store
        type: 'recurring-theme',
        content: theme.theme,
        evidence: theme.fragmentIds,
        confidence: Math.min(theme.strength * 1.5, 1), // Boost confidence for repetition
        shouldSurface: theme.strength >= config.confidenceThreshold,
        surfacedAt: null,
        dismissedAt: null,
      });
    }
  }

  return observations;
}


/**
 * Detect contradictions between fragments.
 * A contradiction is when two fragments make incompatible claims.
 */
export function detectContradictions(
  fragments: ThoughtFragment[]
): LyraObservation[] {
  const observations: LyraObservation[] = [];

  // Contradiction patterns: positive vs negative about same topic
  const positivePatterns = [
    /\b(want|need|should have|must have|love|like|prefer)\b/i,
  ];
  const negativePatterns = [
    /\b(don'?t want|shouldn'?t|hate|avoid|no|never|can'?t)\b/i,
  ];

  for (let i = 0; i < fragments.length; i++) {
    for (let j = i + 1; j < fragments.length; j++) {
      const f1 = fragments[i];
      const f2 = fragments[j];

      // Check if fragments are about similar topics
      const similarity = calculateFragmentSimilarity(f1.content, f2.content);
      if (similarity < 0.2) continue; // Not related enough

      // Check if one is positive and one is negative about similar topic
      const f1Positive = positivePatterns.some((p) => p.test(f1.content));
      const f1Negative = negativePatterns.some((p) => p.test(f1.content));
      const f2Positive = positivePatterns.some((p) => p.test(f2.content));
      const f2Negative = negativePatterns.some((p) => p.test(f2.content));

      if ((f1Positive && f2Negative) || (f1Negative && f2Positive)) {
        observations.push({
          id: '',
          type: 'contradiction',
          content: `Tension between: "${truncate(f1.content, 50)}" and "${truncate(f2.content, 50)}"`,
          evidence: [f1.id, f2.id],
          confidence: similarity * 0.8, // Scale confidence by similarity
          shouldSurface: similarity >= 0.35,
          surfacedAt: null,
          dismissedAt: null,
        });
      }
    }
  }

  return observations;
}


/**
 * Detect emotional weight (anxiety, fear, strong feelings).
 */
export function detectEmotionalWeight(
  fragments: ThoughtFragment[]
): LyraObservation[] {
  const observations: LyraObservation[] = [];

  // Count anxiety/emotional fragments
  const emotionalFragments = fragments.filter(
    (f) => f.type === 'anxiety' || f.type === 'anti-pattern'
  );

  if (emotionalFragments.length >= 2) {
    observations.push({
      id: '',
      type: 'emotional-weight',
      content: 'Multiple concerns or strong feelings expressed',
      evidence: emotionalFragments.map((f) => f.id),
      confidence: Math.min(emotionalFragments.length / fragments.length + 0.3, 1),
      shouldSurface: emotionalFragments.length >= 2,
      surfacedAt: null,
      dismissedAt: null,
    });
  }

  return observations;
}


/**
 * Detect significant gaps — things that should probably be mentioned but haven't been.
 */
export function detectMissingPieces(
  fragments: ThoughtFragment[]
): LyraObservation[] {
  const observations: LyraObservation[] = [];

  if (fragments.length < 5) return observations; // Too early to detect gaps

  const allContent = fragments.map((f) => f.content.toLowerCase()).join(' ');

  // Expected elements for most projects
  const expectedElements = [
    { name: 'audience', patterns: [/\b(user|customer|audience|people|who|for)\b/] },
    { name: 'purpose', patterns: [/\b(why|purpose|goal|solve|problem|help)\b/] },
    { name: 'scope', patterns: [/\b(scope|size|scale|how much|how big|mvp)\b/] },
    { name: 'timeline', patterns: [/\b(when|deadline|timeline|by|launch|ship)\b/] },
    { name: 'constraints', patterns: [/\b(limit|budget|cost|can'?t|won'?t|constraint)\b/] },
  ];

  for (const element of expectedElements) {
    const mentioned = element.patterns.some((p) => p.test(allContent));

    if (!mentioned) {
      observations.push({
        id: '',
        type: 'missing-piece',
        content: `Haven't discussed: ${element.name}`,
        evidence: [],
        confidence: 0.5, // Moderate confidence — absence isn't always significant
        shouldSurface: fragments.length >= 7, // Only surface after enough context
        surfacedAt: null,
        dismissedAt: null,
      });
    }
  }

  return observations;
}


/**
 * Detect when user pivots or changes direction.
 */
export function detectPivotPoints(
  fragments: ThoughtFragment[]
): LyraObservation[] {
  const observations: LyraObservation[] = [];

  if (fragments.length < 4) return observations;

  // Look for "actually" or "wait" or "no, I mean" patterns
  const pivotPatterns = [
    /\b(actually|wait|no,? (i mean|actually)|on second thought|scratch that|forget|instead)\b/i,
    /\b(change|changing|changed) (my mind|direction|course)\b/i,
  ];

  for (const fragment of fragments) {
    if (pivotPatterns.some((p) => p.test(fragment.content))) {
      observations.push({
        id: '',
        type: 'pivot-point',
        content: `Direction change noted: "${truncate(fragment.content, 60)}"`,
        evidence: [fragment.id],
        confidence: 0.7,
        shouldSurface: true,
        surfacedAt: null,
        dismissedAt: null,
      });
    }
  }

  return observations;
}


/**
 * Main pattern detection function — runs all detectors.
 */
export function detectAllPatterns(
  fragments: ThoughtFragment[],
  config: DetectionConfig = DEFAULT_CONFIG
): LyraObservation[] {
  const allObservations: LyraObservation[] = [
    ...detectRecurringThemes(fragments, config),
    ...detectContradictions(fragments),
    ...detectEmotionalWeight(fragments),
    ...detectMissingPieces(fragments),
    ...detectPivotPoints(fragments),
  ];

  // Deduplicate and sort by confidence
  return deduplicateObservations(allObservations).sort(
    (a, b) => b.confidence - a.confidence
  );
}


// ============================================================================
// REFLECTION GENERATION
// ============================================================================

/**
 * Generate a reflective intervention from an observation.
 *
 * Lyra never asks: "What are your goals?"
 * Lyra says: "You've mentioned trust more than features. Is that intentional?"
 */
export function generateReflection(
  observation: LyraObservation
): ReflectiveIntervention {
  const templates = REFLECTION_TEMPLATES[observation.type];
  const template = templates[Math.floor(Math.random() * templates.length)];

  const statement = fillReflectionTemplate(template.statement, observation);
  const implicit = fillReflectionTemplate(template.implicit, observation);

  return {
    id: '',
    observation,
    statement,
    implicitQuestion: implicit,
    requiresResponse: template.requiresResponse,
    deliveredAt: null,
    responseFragment: null,
  };
}


interface ReflectionTemplate {
  statement: string;
  implicit: string;
  requiresResponse: boolean;
}

const REFLECTION_TEMPLATES: Record<ObservationType, ReflectionTemplate[]> = {
  'recurring-theme': [
    {
      statement: `You've mentioned "{theme}" {count} times now. That's not incidental.`,
      implicit: "Is this a core part of what you're building?",
      requiresResponse: false,
    },
    {
      statement: `"{theme}" keeps coming up in different ways. It seems central.`,
      implicit: 'Should we build around this?',
      requiresResponse: false,
    },
    {
      statement: `There's a pattern here around "{theme}". You're returning to it.`,
      implicit: 'What makes this important?',
      requiresResponse: false,
    },
  ],

  contradiction: [
    {
      statement: `There's tension here. You said one thing, then something that pulls against it.`,
      implicit: 'Which direction feels right?',
      requiresResponse: true,
    },
    {
      statement: `These two thoughts don't quite align. That's worth noting.`,
      implicit: 'Is this intentional complexity or something to resolve?',
      requiresResponse: false,
    },
  ],

  'emotional-weight': [
    {
      statement: `You're expressing strong feelings about this. That matters.`,
      implicit: 'These concerns should shape the work.',
      requiresResponse: false,
    },
    {
      statement: `I'm noticing what you're worried about. Those worries are informative.`,
      implicit: 'We should address these explicitly.',
      requiresResponse: false,
    },
  ],

  'missing-piece': [
    {
      statement: `You haven't mentioned {element} yet. That's sometimes intentional.`,
      implicit: 'Should we think about this?',
      requiresResponse: false,
    },
    {
      statement: `Notably absent: any discussion of {element}.`,
      implicit: 'Is this by design?',
      requiresResponse: false,
    },
  ],

  'pivot-point': [
    {
      statement: `You just changed direction. That's useful information.`,
      implicit: 'What prompted the shift?',
      requiresResponse: false,
    },
    {
      statement: `A pivot moment. The earlier thinking might still be valid elsewhere.`,
      implicit: 'Should we preserve any of it?',
      requiresResponse: false,
    },
  ],

  pattern: [
    {
      statement: `There's a pattern emerging in what you're saying.`,
      implicit: 'Do you see it too?',
      requiresResponse: false,
    },
  ],
};


function fillReflectionTemplate(
  template: string,
  observation: LyraObservation
): string {
  let filled = template;

  // Replace {theme} with the observation content
  filled = filled.replace(/{theme}/g, observation.content);

  // Replace {count} with evidence count
  filled = filled.replace(/{count}/g, String(observation.evidence.length));

  // Replace {element} with missing piece name
  if (observation.type === 'missing-piece') {
    const element = observation.content.replace('Haven\'t discussed: ', '');
    filled = filled.replace(/{element}/g, element);
  }

  return filled;
}


// ============================================================================
// OBSERVATION MANAGEMENT
// ============================================================================

/**
 * Determine which observations should be surfaced now.
 */
export function selectObservationsToSurface(
  observations: LyraObservation[],
  maxToSurface: number = 1
): LyraObservation[] {
  // Only surface high-confidence observations that haven't been surfaced
  const candidates = observations.filter(
    (o) => o.shouldSurface && !o.surfacedAt && !o.dismissedAt
  );

  // Prioritize by type (contradictions and emotional weight first)
  const priorityOrder: ObservationType[] = [
    'contradiction',
    'emotional-weight',
    'pivot-point',
    'recurring-theme',
    'missing-piece',
    'pattern',
  ];

  candidates.sort((a, b) => {
    const priorityA = priorityOrder.indexOf(a.type);
    const priorityB = priorityOrder.indexOf(b.type);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return b.confidence - a.confidence;
  });

  return candidates.slice(0, maxToSurface);
}


/**
 * Deduplicate observations that are essentially about the same thing.
 */
function deduplicateObservations(
  observations: LyraObservation[]
): LyraObservation[] {
  const seen = new Set<string>();
  const deduplicated: LyraObservation[] = [];

  for (const obs of observations) {
    // Create a simple key based on type and sorted evidence
    const key = `${obs.type}:${obs.evidence.sort().join(',')}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(obs);
    }
  }

  return deduplicated;
}


// ============================================================================
// SHADOW PROJECT UPDATES
// ============================================================================

/**
 * Update shadow project based on new patterns detected.
 */
export function updateShadowFromPatterns(
  fragments: ThoughtFragment[],
  observations: LyraObservation[]
): Partial<ShadowProject> {
  const updates: Partial<ShadowProject> = {};

  // Extract core beliefs from recurring/core strength fragments
  const coreFragments = fragments.filter((f) => f.strength === 'core');
  if (coreFragments.length > 0) {
    updates.coreBeliefs = coreFragments.map((f) => f.content);
  }

  // Extract constraints
  const constraintFragments = fragments.filter((f) => f.type === 'constraint');
  if (constraintFragments.length > 0) {
    updates.constraints = constraintFragments.map((f) => f.content);
  }

  // Extract anxieties
  const anxietyFragments = fragments.filter((f) => f.type === 'anxiety');
  if (anxietyFragments.length > 0) {
    updates.anxieties = anxietyFragments.map((f) => f.content);
  }

  // Extract aesthetics
  const aestheticFragments = fragments.filter((f) => f.type === 'aesthetic');
  if (aestheticFragments.length > 0) {
    updates.aesthetics = aestheticFragments.map((f) => f.content);
  }

  // Extract anti-patterns
  const antiPatternFragments = fragments.filter((f) => f.type === 'anti-pattern');
  if (antiPatternFragments.length > 0) {
    updates.antiPatterns = antiPatternFragments.map((f) => f.content);
  }

  // Extract open questions
  const questionFragments = fragments.filter((f) => f.type === 'question');
  if (questionFragments.length > 0) {
    updates.openQuestions = questionFragments.map((f) => f.content);
  }

  // Calculate readiness score
  const readinessScore = calculateReadinessScore(fragments, observations);
  updates.readinessScore = readinessScore;

  return updates;
}


/**
 * Calculate how ready the shadow project is for proposal generation.
 */
function calculateReadinessScore(
  fragments: ThoughtFragment[],
  observations: LyraObservation[]
): number {
  let score = 0;

  // Base score from fragment count (max 0.3)
  score += Math.min(fragments.length / 10, 0.3);

  // Bonus for core beliefs (max 0.2)
  const coreCount = fragments.filter((f) => f.strength === 'core').length;
  score += Math.min(coreCount / 3, 0.2);

  // Bonus for constraints defined (max 0.1)
  const constraintCount = fragments.filter((f) => f.type === 'constraint').length;
  score += constraintCount > 0 ? 0.1 : 0;

  // Bonus for aesthetic direction (max 0.1)
  const aestheticCount = fragments.filter((f) => f.type === 'aesthetic').length;
  score += aestheticCount > 0 ? 0.1 : 0;

  // Penalty for unresolved contradictions (max -0.2)
  const contradictionCount = observations.filter(
    (o) => o.type === 'contradiction' && !o.dismissedAt
  ).length;
  score -= Math.min(contradictionCount * 0.1, 0.2);

  // Bonus for few missing pieces (max 0.2)
  const missingCount = observations.filter((o) => o.type === 'missing-piece').length;
  score += Math.max(0.2 - missingCount * 0.05, 0);

  return Math.max(0, Math.min(1, score));
}


// ============================================================================
// UTILITIES
// ============================================================================

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}
