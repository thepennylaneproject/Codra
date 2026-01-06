/**
 * Synthesizer Model
 *
 * You reconcile disagreement into structure.
 * Produce a proposal that respects constraints, risk, and cost.
 *
 * Rules:
 * - No execution steps.
 * - Modules must be independently approvable.
 * - Surface uncertainty explicitly.
 *
 * This is Model D in the multi-model debate.
 * It takes the Explorer's possibilities, the Critic's risks,
 * and the Adversary's contradictions — and finds coherence.
 */

import type { ShadowProject, Proposal, CostRange, Assumption } from '../types';
import type { ExplorerOutput } from './explorer';
import type { CriticOutput } from './critic';
import type { AdversaryOutput } from './adversary';

// ============================================================================
// SYNTHESIZER SCHEMA
// ============================================================================

export interface SynthesizerInput {
  shadow: ShadowProject;
  explorer: ExplorerOutput;
  critic: CriticOutput;
  adversary: AdversaryOutput;
}

export interface SynthesizedModule {
  name: string;
  objective: string;
  outcome: string;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedCostRange: CostRange;
  verificationCriteria: string[];
  addressesRisks: string[];      // Which critic risks this addresses
  survivesAdversary: boolean;    // Does this hold against the adversary's case?
}

export interface SynthesizerOutput {
  modules: SynthesizedModule[];
  knownUnknowns: string[];
  assumptions: Assumption[];
  confidenceScore: number;
  synthesisNotes: string[];
}

// ============================================================================
// SYNTHESIZER PROMPT
// ============================================================================

const SYNTHESIZER_SYSTEM_PROMPT = `You reconcile disagreement into structure.

TASK:
Produce a proposal that respects constraints, risk, and cost.

RULES:
- No execution steps.
- Modules must be independently approvable.
- Surface uncertainty explicitly.`;

function buildSynthesizerUserPrompt(input: SynthesizerInput): string {
  const { shadow, explorer, critic, adversary } = input;

  const explorerSummary = explorer.directions
    .slice(0, 5)
    .map((d) => `- ${d.direction}: ${d.rationale}`)
    .join('\n');

  const criticSummary = critic.risks
    .slice(0, 5)
    .map((r) => `- [${r.severity}] ${r.description}`)
    .join('\n');

  const adversarySummary = [
    ...adversary.contradictions.slice(0, 3).map((c) => `- Contradiction: ${c.tension}`),
    ...adversary.pressurePoints.slice(0, 3).map((p) => `- Pressure: ${p.point}`),
  ].join('\n');

  return `INPUT:
Shadow Project:
- Type: ${shadow.inferredType}
- Core Beliefs: ${shadow.coreBeliefs.join('; ') || '(none)'}
- Constraints: ${shadow.constraints.join('; ') || '(none)'}

Explorer:
${explorerSummary || '(no directions)'}

Critic:
${criticSummary || '(no risks identified)'}

Adversary:
${adversarySummary || '(no contradictions)'}
Case Against: ${adversary.caseAgainst || '(none)'}

OUTPUT JSON:
{
  "modules": [
    {
      "name": "",
      "objective": "",
      "outcome": "",
      "riskLevel": "low | medium | high",
      "estimatedCostRange": { "minimum": 0, "expected": 0, "maximum": 0 },
      "verificationCriteria": []
    }
  ],
  "knownUnknowns": [],
  "assumptions": [],
  "confidenceScore": 0.0-1.0
}`;
}

// ============================================================================
// AI SYNTHESIZER
// ============================================================================

export interface SynthesizerProvider {
  synthesize(input: SynthesizerInput): Promise<SynthesizerOutput>;
}

/**
 * Create an AI-powered synthesizer.
 */
export function createAISynthesizer(
  complete: (systemPrompt: string, userPrompt: string) => Promise<string>
): SynthesizerProvider {
  return {
    async synthesize(input: SynthesizerInput): Promise<SynthesizerOutput> {
      const userPrompt = buildSynthesizerUserPrompt(input);

      try {
        const response = await complete(SYNTHESIZER_SYSTEM_PROMPT, userPrompt);
        return parseSynthesizerResponse(response, input);
      } catch (error) {
        console.warn('AI synthesis failed:', error);
        return synthesizeLocally(input);
      }
    },
  };
}

/**
 * Parse synthesizer response.
 */
function parseSynthesizerResponse(
  response: string,
  input: SynthesizerInput
): SynthesizerOutput {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return synthesizeLocally(input);
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    const modules: SynthesizedModule[] = [];
    if (Array.isArray(parsed.modules)) {
      for (const m of parsed.modules) {
        if (m.name && m.objective) {
          modules.push({
            name: String(m.name),
            objective: String(m.objective),
            outcome: String(m.outcome || ''),
            riskLevel: validateRiskLevel(m.riskLevel),
            estimatedCostRange: validateCostRange(m.estimatedCostRange),
            verificationCriteria: Array.isArray(m.verificationCriteria)
              ? m.verificationCriteria.map(String)
              : [],
            addressesRisks: [],
            survivesAdversary: true,
          });
        }
      }
    }

    const knownUnknowns = Array.isArray(parsed.knownUnknowns)
      ? parsed.knownUnknowns.map(String)
      : [];

    const assumptions: Assumption[] = Array.isArray(parsed.assumptions)
      ? parsed.assumptions.map((a: any) => ({
          id: crypto.randomUUID(),
          statement: String(a.statement || a),
          basedOn: [],
          confidence: typeof a.confidence === 'number' ? a.confidence : 0.5,
          canBeValidated: true,
          validationMethod: null,
        }))
      : [];

    const confidenceScore =
      typeof parsed.confidenceScore === 'number'
        ? Math.min(1, Math.max(0, parsed.confidenceScore))
        : 0.5;

    return {
      modules,
      knownUnknowns,
      assumptions,
      confidenceScore,
      synthesisNotes: [],
    };
  } catch {
    return synthesizeLocally(input);
  }
}

function validateRiskLevel(level: unknown): 'low' | 'medium' | 'high' {
  if (level === 'low' || level === 'medium' || level === 'high') {
    return level;
  }
  return 'medium';
}

function validateCostRange(range: unknown): CostRange {
  const defaultRange: CostRange = {
    minimum: 0,
    expected: 0,
    maximum: 0,
    currency: 'USD',
    confidence: 0.5,
  };

  if (typeof range !== 'object' || range === null) {
    return defaultRange;
  }

  const r = range as Record<string, unknown>;
  return {
    minimum: typeof r.minimum === 'number' ? r.minimum : 0,
    expected: typeof r.expected === 'number' ? r.expected : 0,
    maximum: typeof r.maximum === 'number' ? r.maximum : 0,
    currency: 'USD',
    confidence: typeof r.confidence === 'number' ? r.confidence : 0.5,
  };
}

// ============================================================================
// LOCAL SYNTHESIZER (Fallback)
// ============================================================================

/**
 * Local synthesis when AI is unavailable.
 */
export function synthesizeLocally(input: SynthesizerInput): SynthesizerOutput {
  const { shadow, explorer, critic, adversary } = input;
  const modules: SynthesizedModule[] = [];
  const knownUnknowns: string[] = [];
  const assumptions: Assumption[] = [];

  // Module 1: Foundation (always present)
  modules.push({
    name: 'Foundation',
    objective: 'Establish core identity and constraints before building.',
    outcome: 'Documented beliefs, constraints, and boundaries.',
    riskLevel: 'low',
    estimatedCostRange: {
      minimum: 0.5,
      expected: 1.0,
      maximum: 1.5,
      currency: 'USD',
      confidence: 0.8,
    },
    verificationCriteria: [
      'Core beliefs documented',
      'Constraints explicit',
      'No unresolved contradictions',
    ],
    addressesRisks: ['unclear vision', 'scope creep'],
    survivesAdversary: true,
  });

  // Generate modules from explorer directions
  const viableDirections = explorer.directions.filter((d) => {
    // Filter out directions that the adversary's case against directly undermines
    const caseAgainstLower = adversary.caseAgainst.toLowerCase();
    const directionLower = d.direction.toLowerCase();
    return !caseAgainstLower.includes(directionLower.slice(0, 20));
  });

  for (const direction of viableDirections.slice(0, 2)) {
    const relatedRisks = critic.risks.filter((r) =>
      r.description.toLowerCase().includes(direction.direction.toLowerCase().split(' ')[0])
    );

    const riskLevel = relatedRisks.some((r) => r.severity === 'critical' || r.severity === 'high')
      ? 'high'
      : relatedRisks.some((r) => r.severity === 'medium')
      ? 'medium'
      : 'low';

    modules.push({
      name: truncate(direction.direction, 30),
      objective: direction.rationale,
      outcome: direction.opens.join(', ') || 'Specified deliverable',
      riskLevel,
      estimatedCostRange: {
        minimum: 1.0,
        expected: 2.0,
        maximum: 4.0,
        currency: 'USD',
        confidence: 0.5,
      },
      verificationCriteria: [
        'Outcome matches objective',
        'Constraints respected',
        'Within cost estimate',
      ],
      addressesRisks: relatedRisks.map((r) => r.description),
      survivesAdversary: adversary.contradictions.length < 2,
    });
  }

  // Add known unknowns from critic and adversary
  for (const risk of critic.risks.filter((r) => r.category === 'blind-spot')) {
    knownUnknowns.push(risk.description);
  }

  for (const question of shadow.openQuestions.slice(0, 3)) {
    knownUnknowns.push(question);
  }

  // Add assumptions
  for (const belief of shadow.coreBeliefs) {
    assumptions.push({
      id: crypto.randomUUID(),
      statement: belief,
      basedOn: [],
      confidence: 0.7,
      canBeValidated: true,
      validationMethod: null,
    });
  }

  // Calculate confidence
  let confidenceScore = 0.6;

  // Reduce for high adversary pressure
  if (adversary.contradictions.length > 2) {
    confidenceScore -= 0.15;
  }

  // Reduce for critical risks
  if (critic.risks.some((r) => r.severity === 'critical')) {
    confidenceScore -= 0.2;
  }

  // Reduce for unknown type
  if (shadow.inferredType === 'unknown') {
    confidenceScore -= 0.15;
  }

  // Boost for clear core beliefs
  if (shadow.coreBeliefs.length >= 2) {
    confidenceScore += 0.1;
  }

  confidenceScore = Math.max(0.1, Math.min(0.9, confidenceScore));

  return {
    modules,
    knownUnknowns,
    assumptions,
    confidenceScore,
    synthesisNotes: [
      'Synthesized from debate outputs',
      `Explorer provided ${explorer.directions.length} directions`,
      `Critic identified ${critic.risks.length} risks`,
      `Adversary raised ${adversary.contradictions.length} contradictions`,
    ],
  };
}

// ============================================================================
// CONVERT TO PROPOSAL
// ============================================================================

/**
 * Convert synthesizer output to a Proposal.
 */
export function synthesizerOutputToProposal(
  output: SynthesizerOutput,
  shadowProjectId: string
): Proposal {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    derivedFrom: shadowProjectId,
    createdAt: new Date(),
    decision: 'needs-review',
    modules: output.modules.map((m, i) => ({
      id: crypto.randomUUID(),
      name: m.name,
      objective: m.objective,
      outcome: m.outcome,
      dependencies: i === 0 ? [] : [output.modules[0].name], // All depend on Foundation
      estimatedCost: m.estimatedCostRange,
      riskLevel: m.riskLevel,
      riskFactors: m.addressesRisks,
      isFoundational: i === 0,
      verificationCriteria: m.verificationCriteria,
      order: i,
    })),
    knownUnknowns: output.knownUnknowns,
    assumptions: output.assumptions,
    changeSet: [],
    citations: [],
    verifierNotes: [],
    metadata: {
      timing: {
        startedAt: now,
        completedAt: now,
        durationMs: 0,
      },
      modelUsage: [],
      partialFailures: [],
    },
    estimatedCost: calculateTotalCost(output.modules),
    costDrivers: [],
    scopeReductionOptions: [],
    confidenceScore: output.confidenceScore,
    confidenceFactors: output.synthesisNotes,
    state: 'draft',
  };
}

function calculateTotalCost(modules: SynthesizedModule[]): CostRange {
  let minimum = 0;
  let expected = 0;
  let maximum = 0;

  for (const m of modules) {
    minimum += m.estimatedCostRange.minimum;
    expected += m.estimatedCostRange.expected;
    maximum += m.estimatedCostRange.maximum;
  }

  return {
    minimum,
    expected,
    maximum,
    currency: 'USD',
    confidence: modules.length > 0
      ? modules.reduce((acc, m) => acc + m.estimatedCostRange.confidence, 0) / modules.length
      : 0,
  };
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 3) + '...';
}

// ============================================================================
// EXPORTS
// ============================================================================

export { SYNTHESIZER_SYSTEM_PROMPT, buildSynthesizerUserPrompt };
