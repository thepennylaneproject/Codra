/**
 * Debate cost preflight
 *
 * Deterministic, no-LLM estimate for debate execution.
 */

import type {
  CreditEstimate,
  CreditEstimateBasis,
  DebateModelPlan,
  ReasoningRole,
  ShadowProject,
  ThoughtFragment,
} from '../types';
import { costService } from '@/lib/billing/cost-service';

export interface DebatePreflightOptions {
  modelPlan?: DebateModelPlan[];
}

const DEFAULT_ROLES: ReasoningRole[] = [
  'explorer',
  'critic',
  'adversary',
  'synthesizer',
  'verifier',
];

const DEFAULT_MODEL_PLAN: DebateModelPlan[] = DEFAULT_ROLES.map((role) => ({ role }));

export function estimateDebateCost(
  shadow: ShadowProject,
  fragments: ThoughtFragment[],
  options: DebatePreflightOptions = {}
): CreditEstimate {
  const modelPlan = options.modelPlan?.length ? options.modelPlan : DEFAULT_MODEL_PLAN;

  const inputText = [
    shadow.inferredType,
    ...shadow.coreBeliefs,
    ...shadow.constraints,
    ...shadow.anxieties,
    ...shadow.aesthetics,
    ...shadow.antiPatterns,
    ...shadow.openQuestions,
    ...fragments.map((f) => f.content),
  ].join(' ');

  const inputChars = inputText.length;
  const shadowChars = JSON.stringify({
    inferredType: shadow.inferredType,
    coreBeliefs: shadow.coreBeliefs,
    constraints: shadow.constraints,
    anxieties: shadow.anxieties,
    aesthetics: shadow.aesthetics,
    antiPatterns: shadow.antiPatterns,
    openQuestions: shadow.openQuestions,
    readinessScore: shadow.readinessScore,
  }).length;

  const fragmentCount = fragments.length;
  const modelCount = modelPlan.length;

  const estimate = costService.estimateDebateTokens({
    inputChars,
    shadowChars,
    fragmentCount,
    modelCount,
  });

  const tokensIn = estimate.tokensIn;
  const tokensOut = estimate.tokensOut;
  const tokensTotal = estimate.tokensTotal;
  const creditsTotal = estimate.creditsTotal;
  const basis: CreditEstimateBasis = estimate.basis;

  const estimateHash = hashEstimateInputs({
    shadow,
    fragments,
    modelPlan,
    basis,
  });

  return {
    tokensIn,
    tokensOut,
    tokensTotal,
    creditsTotal,
    basis,
    models: modelPlan,
    estimateHash,
    createdAt: new Date(0),
  };
}

function hashEstimateInputs(input: {
  shadow: ShadowProject;
  fragments: ThoughtFragment[];
  modelPlan: DebateModelPlan[];
  basis: CreditEstimateBasis;
}): string {
  const payload = JSON.stringify({
    shadow: {
      inferredType: input.shadow.inferredType,
      coreBeliefs: input.shadow.coreBeliefs,
      constraints: input.shadow.constraints,
      anxieties: input.shadow.anxieties,
      aesthetics: input.shadow.aesthetics,
      antiPatterns: input.shadow.antiPatterns,
      openQuestions: input.shadow.openQuestions,
      readinessScore: input.shadow.readinessScore,
    },
    fragments: input.fragments.map((fragment) => ({
      id: fragment.id,
      content: fragment.content,
      type: fragment.type,
      strength: fragment.strength,
      mentionCount: fragment.mentionCount,
      relatedFragments: fragment.relatedFragments,
      confidence: fragment.confidence,
    })),
    modelPlan: input.modelPlan.map((plan) => ({
      role: plan.role,
      provider: plan.provider ?? '',
      model: plan.model ?? '',
    })),
    basis: input.basis,
  });

  return djb2Hash(payload);
}

function djb2Hash(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}
