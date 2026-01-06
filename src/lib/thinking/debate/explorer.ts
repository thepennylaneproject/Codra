/**
 * Explorer Model
 *
 * You explore possibilities aggressively.
 * Ignore cost. Ignore execution difficulty. No final recommendations.
 *
 * This is Model A in the multi-model debate.
 * Its job is to expand the possibility space before constraints narrow it.
 */

import type { ShadowProject } from '../types';

// ============================================================================
// EXPLORER SCHEMA
// ============================================================================

export interface ExplorerDirection {
  direction: string;
  rationale: string;
  expandsOn: string[]; // Which core beliefs this builds from
  opens: string[];     // What new possibilities this unlocks
}

export interface ExplorerOutput {
  directions: ExplorerDirection[];
  expansionNotes: string[];
}

// ============================================================================
// EXPLORER PROMPT
// ============================================================================

const EXPLORER_SYSTEM_PROMPT = `You explore possibilities aggressively.

TASK:
Given the shadow project, explore viable directions.

RULES:
- Ignore cost.
- Ignore execution difficulty.
- No final recommendations.`;

function buildExplorerUserPrompt(shadow: ShadowProject): string {
  return `INPUT:
Shadow Project:
- Type: ${shadow.inferredType}
- Core Beliefs: ${shadow.coreBeliefs.join('; ') || '(none yet)'}
- Constraints: ${shadow.constraints.join('; ') || '(none)'}
- Anxieties: ${shadow.anxieties.join('; ') || '(none)'}
- Aesthetics: ${shadow.aesthetics.join('; ') || '(none)'}
- Anti-patterns: ${shadow.antiPatterns.join('; ') || '(none)'}
- Open Questions: ${shadow.openQuestions.join('; ') || '(none)'}
- Readiness: ${(shadow.readinessScore * 100).toFixed(0)}%

OUTPUT:
List of possible directions with brief rationale.`;
}

// ============================================================================
// AI EXPLORER
// ============================================================================

export interface ExplorerProvider {
  explore(shadow: ShadowProject): Promise<ExplorerOutput>;
}

/**
 * Create an AI-powered explorer.
 */
export function createAIExplorer(
  complete: (systemPrompt: string, userPrompt: string) => Promise<string>
): ExplorerProvider {
  return {
    async explore(shadow: ShadowProject): Promise<ExplorerOutput> {
      const userPrompt = buildExplorerUserPrompt(shadow);

      try {
        const response = await complete(EXPLORER_SYSTEM_PROMPT, userPrompt);
        return parseExplorerResponse(response, shadow);
      } catch (error) {
        console.warn('AI exploration failed:', error);
        return exploreLocally(shadow);
      }
    },
  };
}

/**
 * Parse explorer response.
 */
function parseExplorerResponse(
  response: string,
  shadow: ShadowProject
): ExplorerOutput {
  const directions: ExplorerDirection[] = [];
  const expansionNotes: string[] = [];

  // Try to parse as JSON first
  const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item.direction === 'string' && typeof item.rationale === 'string') {
            directions.push({
              direction: item.direction,
              rationale: item.rationale,
              expandsOn: Array.isArray(item.expandsOn) ? item.expandsOn : [],
              opens: Array.isArray(item.opens) ? item.opens : [],
            });
          }
        }
      }
    } catch {
      // Fall through to text parsing
    }
  }

  // If JSON parsing failed or yielded nothing, parse as text
  if (directions.length === 0) {
    const lines = response.split('\n').filter((l) => l.trim());
    let currentDirection: Partial<ExplorerDirection> | null = null;

    for (const line of lines) {
      // Look for numbered or bulleted items
      const directionMatch = line.match(/^[\d\-\*•]\s*[.):]*\s*(.+)/);
      if (directionMatch) {
        if (currentDirection?.direction) {
          directions.push({
            direction: currentDirection.direction,
            rationale: currentDirection.rationale || '',
            expandsOn: [],
            opens: [],
          });
        }
        currentDirection = { direction: directionMatch[1].trim() };
      } else if (currentDirection && !currentDirection.rationale) {
        // Treat as rationale for previous direction
        currentDirection.rationale = line.trim();
      }
    }

    // Don't forget the last one
    if (currentDirection?.direction) {
      directions.push({
        direction: currentDirection.direction,
        rationale: currentDirection.rationale || '',
        expandsOn: [],
        opens: [],
      });
    }
  }

  return { directions, expansionNotes };
}

// ============================================================================
// LOCAL EXPLORER (Fallback)
// ============================================================================

/**
 * Local exploration when AI is unavailable.
 * Uses shadow project signals to generate directions.
 */
export function exploreLocally(shadow: ShadowProject): ExplorerOutput {
  const directions: ExplorerDirection[] = [];

  // Generate directions from core beliefs
  for (const belief of shadow.coreBeliefs.slice(0, 3)) {
    directions.push({
      direction: `Build around "${belief}" as the central organizing principle`,
      rationale: `This belief appears core to the project identity`,
      expandsOn: [belief],
      opens: ['Different execution paths that honor this belief'],
    });
  }

  // Generate directions from aesthetics
  for (const aesthetic of shadow.aesthetics.slice(0, 2)) {
    directions.push({
      direction: `Let the "${aesthetic}" feeling drive all decisions`,
      rationale: `Aesthetic preferences often reveal deeper values`,
      expandsOn: [aesthetic],
      opens: ['Design directions', 'Tone choices', 'Feature prioritization'],
    });
  }

  // Generate directions from anti-patterns (inverse)
  for (const antiPattern of shadow.antiPatterns.slice(0, 2)) {
    directions.push({
      direction: `Define by opposition to "${antiPattern}"`,
      rationale: `Knowing what you hate clarifies what you want`,
      expandsOn: [antiPattern],
      opens: ['Differentiation strategy', 'Positioning'],
    });
  }

  // Generate type-specific directions
  const typeDirections = generateTypeDirections(shadow.inferredType);
  directions.push(...typeDirections);

  // Generate from open questions
  for (const question of shadow.openQuestions.slice(0, 2)) {
    directions.push({
      direction: `Resolve "${question}" before committing to structure`,
      rationale: `Open questions often hide critical decisions`,
      expandsOn: [],
      opens: ['Clarity', 'Reduced scope creep'],
    });
  }

  return {
    directions,
    expansionNotes: [
      'Generated from shadow project signals',
      'AI exploration would provide more nuanced directions',
    ],
  };
}

function generateTypeDirections(type: ShadowProject['inferredType']): ExplorerDirection[] {
  const typeMap: Record<ShadowProject['inferredType'], ExplorerDirection[]> = {
    website: [
      {
        direction: 'Single-page narrative that tells one story',
        rationale: 'Simplest execution, highest focus',
        expandsOn: [],
        opens: ['Clear messaging', 'Fast launch'],
      },
      {
        direction: 'Multi-section experience with progressive disclosure',
        rationale: 'More room for nuance and depth',
        expandsOn: [],
        opens: ['Complex story', 'Multiple audiences'],
      },
    ],
    app: [
      {
        direction: 'Minimal viable interaction — one core loop',
        rationale: 'Validates the idea with least effort',
        expandsOn: [],
        opens: ['User feedback', 'Iteration'],
      },
      {
        direction: 'Full feature set from day one',
        rationale: 'Complete vision, higher risk',
        expandsOn: [],
        opens: ['Comprehensive solution', 'Competitive positioning'],
      },
    ],
    campaign: [
      {
        direction: 'Single channel, maximum depth',
        rationale: 'Better to own one channel than spread thin',
        expandsOn: [],
        opens: ['Expertise', 'Measurable results'],
      },
      {
        direction: 'Multi-channel orchestration',
        rationale: 'Reach more people, coordinate messaging',
        expandsOn: [],
        opens: ['Wider reach', 'Reinforcement'],
      },
    ],
    content: [
      {
        direction: 'One definitive piece that says everything',
        rationale: 'Quality over quantity',
        expandsOn: [],
        opens: ['Reference material', 'Authority'],
      },
      {
        direction: 'Content system that scales',
        rationale: 'Build once, publish many',
        expandsOn: [],
        opens: ['Ongoing presence', 'SEO'],
      },
    ],
    product: [
      {
        direction: 'Solve one problem completely',
        rationale: 'Focus creates value',
        expandsOn: [],
        opens: ['Clear positioning', 'Word of mouth'],
      },
      {
        direction: 'Platform that enables multiple solutions',
        rationale: 'Higher ceiling, harder execution',
        expandsOn: [],
        opens: ['Ecosystem', 'Lock-in'],
      },
    ],
    'brand-identity': [
      {
        direction: 'Visual-first identity system',
        rationale: 'Show, don\'t tell',
        expandsOn: [],
        opens: ['Recognition', 'Consistency'],
      },
      {
        direction: 'Voice-first identity system',
        rationale: 'Words often more memorable than visuals',
        expandsOn: [],
        opens: ['Personality', 'Tone'],
      },
    ],
    system: [
      {
        direction: 'Monolith first, split later',
        rationale: 'Simpler to reason about initially',
        expandsOn: [],
        opens: ['Fast iteration', 'Refactor when needed'],
      },
      {
        direction: 'Service-oriented from the start',
        rationale: 'Easier to scale and modify pieces',
        expandsOn: [],
        opens: ['Independent deployment', 'Team parallelism'],
      },
    ],
    unknown: [
      {
        direction: 'Clarify what this is before building',
        rationale: 'Ambiguity in type suggests ambiguity in vision',
        expandsOn: [],
        opens: ['Focus', 'Appropriate execution strategy'],
      },
    ],
  };

  return typeMap[type] || typeMap.unknown;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { EXPLORER_SYSTEM_PROMPT, buildExplorerUserPrompt };
