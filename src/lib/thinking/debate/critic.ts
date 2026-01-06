/**
 * Critic Model
 *
 * You are skeptical by default.
 * Identify structural risks, blind spots, and failure modes.
 * Assume the idea may be wrong. No solutions yet.
 *
 * This is Model B in the multi-model debate.
 * Its job is to find what could go wrong before you commit.
 */

import type { ShadowProject } from '../types';

// ============================================================================
// CRITIC SCHEMA
// ============================================================================

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Risk {
  description: string;
  severity: RiskSeverity;
  category: 'structural' | 'blind-spot' | 'failure-mode' | 'assumption';
  affectedBeliefs: string[]; // Which core beliefs this threatens
}

export interface CriticOutput {
  risks: Risk[];
  overallAssessment: string;
}

// ============================================================================
// CRITIC PROMPT
// ============================================================================

const CRITIC_SYSTEM_PROMPT = `You are skeptical by default.

TASK:
Identify structural risks, blind spots, and failure modes.

RULES:
- Assume the idea may be wrong.
- No solutions yet.`;

function buildCriticUserPrompt(shadow: ShadowProject): string {
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
Risk list with severity.`;
}

// ============================================================================
// AI CRITIC
// ============================================================================

export interface CriticProvider {
  critique(shadow: ShadowProject): Promise<CriticOutput>;
}

/**
 * Create an AI-powered critic.
 */
export function createAICritic(
  complete: (systemPrompt: string, userPrompt: string) => Promise<string>
): CriticProvider {
  return {
    async critique(shadow: ShadowProject): Promise<CriticOutput> {
      const userPrompt = buildCriticUserPrompt(shadow);

      try {
        const response = await complete(CRITIC_SYSTEM_PROMPT, userPrompt);
        return parseCriticResponse(response);
      } catch (error) {
        console.warn('AI critique failed:', error);
        return critiqueLocally(shadow);
      }
    },
  };
}

/**
 * Parse critic response.
 */
function parseCriticResponse(response: string): CriticOutput {
  const risks: Risk[] = [];

  // Try JSON first
  const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const items = Array.isArray(parsed) ? parsed : parsed.risks || [];
      for (const item of items) {
        if (typeof item.description === 'string') {
          risks.push({
            description: item.description,
            severity: validateSeverity(item.severity),
            category: validateCategory(item.category),
            affectedBeliefs: Array.isArray(item.affectedBeliefs) ? item.affectedBeliefs : [],
          });
        }
      }
    } catch {
      // Fall through to text parsing
    }
  }

  // Text parsing fallback
  if (risks.length === 0) {
    const lines = response.split('\n').filter((l) => l.trim());
    for (const line of lines) {
      const riskMatch = line.match(/^[\d\-\*•]\s*[.):]*\s*(.+)/);
      if (riskMatch) {
        const description = riskMatch[1].trim();
        risks.push({
          description,
          severity: inferSeverity(description),
          category: inferCategory(description),
          affectedBeliefs: [],
        });
      }
    }
  }

  return {
    risks,
    overallAssessment: risks.length === 0
      ? 'No obvious risks identified'
      : `${risks.filter((r) => r.severity === 'critical' || r.severity === 'high').length} high-severity risks`,
  };
}

function validateSeverity(severity: unknown): RiskSeverity {
  const valid: RiskSeverity[] = ['low', 'medium', 'high', 'critical'];
  if (typeof severity === 'string' && valid.includes(severity as RiskSeverity)) {
    return severity as RiskSeverity;
  }
  return 'medium';
}

function validateCategory(category: unknown): Risk['category'] {
  const valid: Risk['category'][] = ['structural', 'blind-spot', 'failure-mode', 'assumption'];
  if (typeof category === 'string' && valid.includes(category as Risk['category'])) {
    return category as Risk['category'];
  }
  return 'structural';
}

function inferSeverity(description: string): RiskSeverity {
  const lower = description.toLowerCase();
  if (/critical|fatal|will fail|impossible|catastrophic/.test(lower)) return 'critical';
  if (/high|major|significant|serious|dangerous/.test(lower)) return 'high';
  if (/low|minor|small|slight/.test(lower)) return 'low';
  return 'medium';
}

function inferCategory(description: string): Risk['category'] {
  const lower = description.toLowerCase();
  if (/assum|believ|think|expect/.test(lower)) return 'assumption';
  if (/miss|overlook|forget|ignore|blind/.test(lower)) return 'blind-spot';
  if (/fail|break|crash|error|bug/.test(lower)) return 'failure-mode';
  return 'structural';
}

// ============================================================================
// LOCAL CRITIC (Fallback)
// ============================================================================

/**
 * Local critique when AI is unavailable.
 */
export function critiqueLocally(shadow: ShadowProject): CriticOutput {
  const risks: Risk[] = [];

  // Risk: Low readiness
  if (shadow.readinessScore < 0.5) {
    risks.push({
      description: 'Project shape is still unclear. Premature structure risks building the wrong thing.',
      severity: 'high',
      category: 'structural',
      affectedBeliefs: [],
    });
  }

  // Risk: No core beliefs
  if (shadow.coreBeliefs.length === 0) {
    risks.push({
      description: 'No core beliefs established. Without a center, scope creep is inevitable.',
      severity: 'high',
      category: 'blind-spot',
      affectedBeliefs: [],
    });
  }

  // Risk: Many open questions
  if (shadow.openQuestions.length > 3) {
    risks.push({
      description: `${shadow.openQuestions.length} unresolved questions. Each is a potential pivot point.`,
      severity: 'medium',
      category: 'assumption',
      affectedBeliefs: [],
    });
  }

  // Risk: Anxieties not addressed
  if (shadow.anxieties.length > 0) {
    risks.push({
      description: `Stated anxieties (${shadow.anxieties.length}) may indicate unexamined assumptions.`,
      severity: 'medium',
      category: 'blind-spot',
      affectedBeliefs: shadow.anxieties,
    });
  }

  // Risk: Type unknown
  if (shadow.inferredType === 'unknown') {
    risks.push({
      description: 'Project type is unclear. Different types require different approaches.',
      severity: 'high',
      category: 'structural',
      affectedBeliefs: [],
    });
  }

  // Risk: Constraints may conflict with beliefs
  if (shadow.constraints.length > 0 && shadow.coreBeliefs.length > 0) {
    risks.push({
      description: 'Constraints and beliefs may be in tension. Not all constraints are compatible with all visions.',
      severity: 'medium',
      category: 'assumption',
      affectedBeliefs: shadow.coreBeliefs,
    });
  }

  // Risk: Anti-patterns without positive vision
  if (shadow.antiPatterns.length > shadow.aesthetics.length) {
    risks.push({
      description: 'More things to avoid than positive direction. Opposition alone doesn\'t create.',
      severity: 'low',
      category: 'blind-spot',
      affectedBeliefs: [],
    });
  }

  // Risk: No constraints
  if (shadow.constraints.length === 0 && shadow.readinessScore > 0.3) {
    risks.push({
      description: 'No explicit constraints. Unbounded scope is a failure mode.',
      severity: 'medium',
      category: 'structural',
      affectedBeliefs: [],
    });
  }

  // Type-specific risks
  risks.push(...generateTypeRisks(shadow.inferredType));

  return {
    risks,
    overallAssessment: generateAssessment(risks),
  };
}

function generateTypeRisks(type: ShadowProject['inferredType']): Risk[] {
  const typeRisks: Record<ShadowProject['inferredType'], Risk[]> = {
    website: [
      {
        description: 'Websites often ship and then die. What ensures ongoing relevance?',
        severity: 'low',
        category: 'failure-mode',
        affectedBeliefs: [],
      },
    ],
    app: [
      {
        description: 'Apps require ongoing maintenance. Who handles that?',
        severity: 'medium',
        category: 'blind-spot',
        affectedBeliefs: [],
      },
      {
        description: 'User acquisition is often harder than building. Plan exists?',
        severity: 'medium',
        category: 'assumption',
        affectedBeliefs: [],
      },
    ],
    campaign: [
      {
        description: 'Campaigns have natural ends. What happens after?',
        severity: 'low',
        category: 'blind-spot',
        affectedBeliefs: [],
      },
    ],
    content: [
      {
        description: 'Content without distribution is invisible.',
        severity: 'medium',
        category: 'blind-spot',
        affectedBeliefs: [],
      },
    ],
    product: [
      {
        description: 'Products need customers. Who are they, specifically?',
        severity: 'high',
        category: 'assumption',
        affectedBeliefs: [],
      },
      {
        description: 'Pricing is a product decision, not an afterthought.',
        severity: 'medium',
        category: 'blind-spot',
        affectedBeliefs: [],
      },
    ],
    'brand-identity': [
      {
        description: 'Identity without application is abstract. What does this identity do?',
        severity: 'low',
        category: 'structural',
        affectedBeliefs: [],
      },
    ],
    system: [
      {
        description: 'Systems outlive their creators. Documentation plan?',
        severity: 'medium',
        category: 'blind-spot',
        affectedBeliefs: [],
      },
    ],
    unknown: [
      {
        description: 'Unknown type means unknown risks. Clarity needed first.',
        severity: 'critical',
        category: 'structural',
        affectedBeliefs: [],
      },
    ],
  };

  return typeRisks[type] || typeRisks.unknown;
}

function generateAssessment(risks: Risk[]): string {
  const critical = risks.filter((r) => r.severity === 'critical').length;
  const high = risks.filter((r) => r.severity === 'high').length;

  if (critical > 0) {
    return `${critical} critical risk(s) require resolution before proceeding.`;
  }
  if (high > 2) {
    return `Multiple high-severity risks. Caution advised.`;
  }
  if (high > 0) {
    return `${high} high-severity risk(s) identified. Addressable.`;
  }
  if (risks.length === 0) {
    return 'No obvious risks, which itself is suspicious.';
  }
  return `${risks.length} risks identified, none critical.`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { CRITIC_SYSTEM_PROMPT, buildCriticUserPrompt };
