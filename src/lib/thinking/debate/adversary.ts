/**
 * Adversary Model
 *
 * Assume this project should not exist.
 * Argue against the project using the user's own fragments.
 *
 * Rules:
 * - Use their words.
 * - No sarcasm.
 * - No dismissal.
 *
 * This is Model C in the multi-model debate.
 * Its job is to stress-test convictions before commitment.
 */

import type { ThoughtFragment, ShadowProject, FragmentType } from '../types';

// ============================================================================
// ADVERSARY SCHEMA
// ============================================================================

export interface Contradiction {
  claim: string;           // What they said
  counterEvidence: string; // What else they said that undermines it
  fragmentIds: string[];   // Sources
  tension: string;         // The underlying conflict
}

export interface PressurePoint {
  point: string;           // The vulnerable spot
  userWords: string;       // Their exact words that reveal it
  fragmentId: string;
  implication: string;     // What this suggests
}

export interface AdversaryOutput {
  contradictions: Contradiction[];
  pressurePoints: PressurePoint[];
  caseAgainst: string;     // The argument against proceeding
}

// ============================================================================
// ADVERSARY PROMPT
// ============================================================================

const ADVERSARY_SYSTEM_PROMPT = `Assume this project should not exist.

TASK:
Argue against the project using the user's own fragments.

RULES:
- Use their words.
- No sarcasm.
- No dismissal.`;

function buildAdversaryUserPrompt(
  shadow: ShadowProject,
  fragments: ThoughtFragment[]
): string {
  const fragmentList = fragments
    .map((f) => `[${f.id}] "${f.content}" (${f.type})`)
    .join('\n');

  return `INPUT:
Shadow Project:
- Type: ${shadow.inferredType}
- Core Beliefs: ${shadow.coreBeliefs.join('; ') || '(none)'}
- Constraints: ${shadow.constraints.join('; ') || '(none)'}
- Anxieties: ${shadow.anxieties.join('; ') || '(none)'}

Fragments:
${fragmentList}

OUTPUT:
Contradictions and pressure points.`;
}

// ============================================================================
// AI ADVERSARY
// ============================================================================

export interface AdversaryProvider {
  challenge(shadow: ShadowProject, fragments: ThoughtFragment[]): Promise<AdversaryOutput>;
}

/**
 * Create an AI-powered adversary.
 */
export function createAIAdversary(
  complete: (systemPrompt: string, userPrompt: string) => Promise<string>
): AdversaryProvider {
  return {
    async challenge(
      shadow: ShadowProject,
      fragments: ThoughtFragment[]
    ): Promise<AdversaryOutput> {
      const userPrompt = buildAdversaryUserPrompt(shadow, fragments);

      try {
        const response = await complete(ADVERSARY_SYSTEM_PROMPT, userPrompt);
        return parseAdversaryResponse(response);
      } catch (error) {
        console.warn('AI adversary failed:', error);
        return challengeLocally(shadow, fragments);
      }
    },
  };
}

/**
 * Parse adversary response.
 */
function parseAdversaryResponse(response: string): AdversaryOutput {
  const contradictions: Contradiction[] = [];
  const pressurePoints: PressurePoint[] = [];
  let caseAgainst = '';

  // Try JSON first
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);

      if (Array.isArray(parsed.contradictions)) {
        for (const c of parsed.contradictions) {
          if (c.claim && c.counterEvidence) {
            contradictions.push({
              claim: String(c.claim),
              counterEvidence: String(c.counterEvidence),
              fragmentIds: Array.isArray(c.fragmentIds) ? c.fragmentIds : [],
              tension: String(c.tension || ''),
            });
          }
        }
      }

      if (Array.isArray(parsed.pressurePoints)) {
        for (const p of parsed.pressurePoints) {
          if (p.point && p.userWords) {
            pressurePoints.push({
              point: String(p.point),
              userWords: String(p.userWords),
              fragmentId: String(p.fragmentId || ''),
              implication: String(p.implication || ''),
            });
          }
        }
      }

      if (parsed.caseAgainst) {
        caseAgainst = String(parsed.caseAgainst);
      }
    } catch {
      // Fall through to text parsing
    }
  }

  // Generate case against if not provided
  if (!caseAgainst && (contradictions.length > 0 || pressurePoints.length > 0)) {
    caseAgainst = generateCaseAgainst(contradictions, pressurePoints);
  }

  return { contradictions, pressurePoints, caseAgainst };
}

function generateCaseAgainst(
  contradictions: Contradiction[],
  pressurePoints: PressurePoint[]
): string {
  const parts: string[] = [];

  if (contradictions.length > 0) {
    parts.push(`${contradictions.length} internal contradiction(s) undermine the stated vision.`);
  }

  if (pressurePoints.length > 0) {
    parts.push(`${pressurePoints.length} pressure point(s) suggest unexamined assumptions.`);
  }

  return parts.join(' ') || 'No strong case against, but absence of contradictions may indicate insufficient exploration.';
}

// ============================================================================
// LOCAL ADVERSARY (Fallback)
// ============================================================================

/**
 * Local adversary when AI is unavailable.
 * Finds contradictions mechanically by comparing fragments.
 */
export function challengeLocally(
  shadow: ShadowProject,
  fragments: ThoughtFragment[]
): AdversaryOutput {
  const contradictions: Contradiction[] = [];
  const pressurePoints: PressurePoint[] = [];

  // Find contradictions: anxiety + core belief tension
  for (const anxiety of shadow.anxieties) {
    for (const belief of shadow.coreBeliefs) {
      if (mightContradict(anxiety, belief)) {
        const anxietyFragment = fragments.find((f) =>
          f.content.toLowerCase().includes(anxiety.toLowerCase().slice(0, 20))
        );
        const beliefFragment = fragments.find((f) =>
          f.content.toLowerCase().includes(belief.toLowerCase().slice(0, 20))
        );

        contradictions.push({
          claim: belief,
          counterEvidence: anxiety,
          fragmentIds: [anxietyFragment?.id, beliefFragment?.id].filter(Boolean) as string[],
          tension: `You believe "${truncate(belief, 40)}" but worry about "${truncate(anxiety, 40)}". These may be at odds.`,
        });
      }
    }
  }

  // Find contradictions: constraint + aesthetic tension
  for (const constraint of shadow.constraints) {
    for (const aesthetic of shadow.aesthetics) {
      if (mightContradict(constraint, aesthetic)) {
        contradictions.push({
          claim: aesthetic,
          counterEvidence: constraint,
          fragmentIds: [],
          tension: `You want it to feel "${truncate(aesthetic, 30)}" but also "${truncate(constraint, 30)}". Can both be true?`,
        });
      }
    }
  }

  // Pressure points from anxieties, anti-patterns, and questions — single pass
  const pressureFragmentsByType: Partial<Record<FragmentType, ThoughtFragment[]>> = {
    'anxiety': [],
    'anti-pattern': [],
    'question': [],
  };
  for (const fragment of fragments) {
    if (fragment.type in pressureFragmentsByType) {
      pressureFragmentsByType[fragment.type]!.push(fragment);
    }
  }

  for (const fragment of pressureFragmentsByType['anxiety'] ?? []) {
    pressurePoints.push({
      point: 'Stated concern may indicate deeper doubt',
      userWords: fragment.content,
      fragmentId: fragment.id,
      implication: 'Anxieties often reveal what we suspect but don\'t want to face.',
    });
  }

  // Pressure points from anti-patterns
  for (const fragment of pressureFragmentsByType['anti-pattern'] ?? []) {
    pressurePoints.push({
      point: 'Strong aversion may indicate past failure',
      userWords: fragment.content,
      fragmentId: fragment.id,
      implication: 'What we hate often reveals what we fear becoming.',
    });
  }

  // Pressure points from questions
  for (const fragment of (pressureFragmentsByType['question'] ?? []).slice(0, 2)) {
    pressurePoints.push({
      point: 'Unresolved question',
      userWords: fragment.content,
      fragmentId: fragment.id,
      implication: 'You asked this for a reason. It may be more important than you think.',
    });
  }

  // Generate the case against
  const caseAgainst = buildCaseAgainst(shadow, contradictions, pressurePoints);

  return { contradictions, pressurePoints, caseAgainst };
}

/**
 * Heuristic to detect if two statements might contradict.
 */
function mightContradict(a: string, b: string): boolean {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  // Opposites
  const opposites = [
    ['simple', 'complex'],
    ['fast', 'slow'],
    ['cheap', 'expensive'],
    ['calm', 'exciting'],
    ['minimal', 'comprehensive'],
    ['small', 'big'],
    ['focused', 'broad'],
    ['private', 'public'],
    ['free', 'paid'],
  ];

  for (const [word1, word2] of opposites) {
    if (
      (aLower.includes(word1) && bLower.includes(word2)) ||
      (aLower.includes(word2) && bLower.includes(word1))
    ) {
      return true;
    }
  }

  // Negation patterns
  const negations = [/don't/, /won't/, /can't/, /never/, /no\s/];
  const aHasNegation = negations.some((n) => n.test(aLower));
  const bHasNegation = negations.some((n) => n.test(bLower));

  // One negative, one positive about similar topic
  if (aHasNegation !== bHasNegation) {
    const aWords = new Set(aLower.split(/\s+/).filter((w) => w.length > 4));
    const bWords = new Set(bLower.split(/\s+/).filter((w) => w.length > 4));
    const overlap = [...aWords].filter((w) => bWords.has(w));
    if (overlap.length >= 1) {
      return true;
    }
  }

  return false;
}

function buildCaseAgainst(
  shadow: ShadowProject,
  contradictions: Contradiction[],
  pressurePoints: PressurePoint[]
): string {
  const parts: string[] = [];

  if (shadow.inferredType === 'unknown') {
    parts.push('The project type is unclear, suggesting the vision itself is unformed.');
  }

  if (contradictions.length > 0) {
    parts.push(`There are ${contradictions.length} internal contradiction(s) in the stated vision.`);
  }

  if (shadow.anxieties.length >= shadow.coreBeliefs.length) {
    parts.push('There are as many concerns as convictions. This may be fear dressed as ambition.');
  }

  if (shadow.openQuestions.length > 3) {
    parts.push('Too many unanswered questions. The project may not be ready.');
  }

  if (pressurePoints.length > 3) {
    parts.push('Multiple pressure points suggest unexamined assumptions.');
  }

  if (parts.length === 0) {
    parts.push('No obvious case against, but the absence of visible contradictions is not the same as coherence.');
  }

  return parts.join(' ');
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 3) + '...';
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ADVERSARY_SYSTEM_PROMPT, buildAdversaryUserPrompt };
