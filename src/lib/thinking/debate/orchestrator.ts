/**
 * Debate Orchestrator
 *
 * Runs the multi-model debate in the required order
 * and returns a normalized Proposal.
 */

import type {
  ChangeRequest,
  DebateConsent,
  DebateDecision,
  DebateModelPlan,
  DebateModelUsage,
  Fragment,
  Proposal,
  ProposalModule,
  ShadowProject,
} from '../types';
import { THINKING_CONSTRAINTS } from '../types';
import type { ExplorerProvider } from './explorer';
import type { CriticProvider } from './critic';
import type { AdversaryOutput, AdversaryProvider } from './adversary';
import type { SynthesizerInput, SynthesizerOutput, SynthesizerProvider } from './synthesizer';
import type { VerifierOutput, VerifierProvider } from './verifier';
import { exploreLocally } from './explorer';
import { critiqueLocally } from './critic';
import { challengeLocally } from './adversary';
import { synthesizeLocally, synthesizerOutputToProposal } from './synthesizer';
import { verifyLocally } from './verifier';
import { estimateDebateCost } from './cost-preflight';

export interface DebateOptions {
  explorer: ExplorerProvider;
  critic: CriticProvider;
  adversary: AdversaryProvider;
  synthesizer: SynthesizerProvider;
  verifier: VerifierProvider;
  modelUsage?: DebateModelUsage[];
  consent: DebateConsent;
  modelPlan?: DebateModelPlan[];
}

type DebateErrorCode =
  | 'missing-input'
  | 'missing-provider'
  | 'invalid-output'
  | 'consent_required'
  | 'consent_invalid';

export class DebateOrchestratorError extends Error {
  readonly code: DebateErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: DebateErrorCode, message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message);
    this.name = 'DebateOrchestratorError';
    this.code = code;
    this.details = details;
    if (cause !== undefined) {
      (this as { cause?: unknown }).cause = cause;
    }
  }
}

export async function conductDebate(
  shadow: ShadowProject,
  fragments: Fragment[],
  options?: DebateOptions
): Promise<Proposal> {
  if (!shadow || !shadow.id) {
    throw new DebateOrchestratorError('missing-input', 'Shadow project is required.', {
      field: 'shadow',
    });
  }

  if (!Array.isArray(fragments) || fragments.length === 0) {
    throw new DebateOrchestratorError('missing-input', 'Fragments are required.', {
      field: 'fragments',
    });
  }

  if (!options) {
    throw new DebateOrchestratorError('missing-provider', 'Debate providers are required.');
  }

  const expectedEstimate = estimateDebateCost(shadow, fragments, {
    modelPlan: options.modelPlan,
  });

  if (!options.consent || options.consent.approved !== true) {
    throw new DebateOrchestratorError('consent_required', 'Debate consent is required.', {
      estimate: expectedEstimate,
      next: 'resubmit_with_consent',
    });
  }

  if (!options.consent.estimateHash) {
    throw new DebateOrchestratorError('consent_required', 'Debate cost estimate is required.', {
      estimate: expectedEstimate,
      next: 'resubmit_with_consent',
    });
  }

  if (expectedEstimate.estimateHash !== options.consent.estimateHash) {
    throw new DebateOrchestratorError('consent_invalid', 'Debate consent does not match estimate.', {
      estimate: expectedEstimate,
      expected: expectedEstimate.estimateHash,
      provided: options.consent.estimateHash,
      next: 'resubmit_with_consent',
    });
  }

  const providers = validateProviders(options);
  const startedAt = new Date();
  const partialFailures: string[] = [];

  const [explorerResult, criticResult, adversaryResult] = await Promise.allSettled([
    providers.explorer.explore(shadow),
    providers.critic.critique(shadow),
    providers.adversary.challenge(shadow, fragments),
  ]);

  const explorer = resolveSettledOutput(
    'explorer',
    explorerResult,
    () => exploreLocally(shadow),
    partialFailures
  );
  const critic = resolveSettledOutput(
    'critic',
    criticResult,
    () => critiqueLocally(shadow),
    partialFailures
  );
  const adversary = resolveSettledOutput(
    'adversary',
    adversaryResult,
    () => challengeLocally(shadow, fragments),
    partialFailures
  );

  const synthesisInput: SynthesizerInput = {
    shadow,
    explorer,
    critic,
    adversary,
  };

  const synthesis = await runWithFallback(
    'synthesizer',
    () => providers.synthesizer.synthesize(synthesisInput),
    () => synthesizeLocally(synthesisInput),
    partialFailures
  );

  if (!synthesis || synthesis.modules.length === 0) {
    throw new DebateOrchestratorError('invalid-output', 'Synthesizer output is empty.');
  }

  const verification = await runWithFallback(
    'verifier',
    () => providers.verifier.verify(synthesis),
    () => verifyLocally(synthesis),
    partialFailures
  );

  if (!verification) {
    throw new DebateOrchestratorError('invalid-output', 'Verifier output is missing.');
  }

  const baseProposal = synthesizerOutputToProposal(synthesis, shadow.id);
  const normalizedModules = normalizeModulesWithVerification(
    baseProposal.modules,
    verification,
    partialFailures
  );
  const citations = collectCitations(fragments, adversary, synthesis);
  const decision = determineDecision(synthesis, verification, partialFailures);
  const verifierNotes = collectVerifierNotes(verification);
  const changeSet = buildChangeSet(normalizedModules, verification);

  const completedAt = new Date();

  return {
    ...baseProposal,
    decision,
    modules: normalizedModules,
    changeSet,
    citations,
    verifierNotes,
    metadata: {
      timing: {
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      },
      modelUsage: options.modelUsage ?? [],
      partialFailures,
    },
    estimatedCost: verification.totalCost,
    costDrivers: flattenCostDrivers(verification),
    scopeReductionOptions: flattenScopeReductions(verification),
  };
}

function validateProviders(options: DebateOptions): DebateOptions {
  const missing: string[] = [];

  if (!options.explorer?.explore) missing.push('explorer');
  if (!options.critic?.critique) missing.push('critic');
  if (!options.adversary?.challenge) missing.push('adversary');
  if (!options.synthesizer?.synthesize) missing.push('synthesizer');
  if (!options.verifier?.verify) missing.push('verifier');

  if (missing.length > 0) {
    throw new DebateOrchestratorError(
      'missing-provider',
      `Missing debate providers: ${missing.join(', ')}.`,
      { missing }
    );
  }

  return options;
}

function resolveSettledOutput<T>(
  role: string,
  result: PromiseSettledResult<T>,
  fallback: () => T,
  partialFailures: string[]
): T {
  if (result.status === 'fulfilled' && result.value) {
    return result.value;
  }

  const error =
    result.status === 'rejected'
      ? result.reason
      : new Error(`Empty output for ${role}.`);

  partialFailures.push(formatFailure(role, error));

  try {
    return fallback();
  } catch (fallbackError) {
    throw new DebateOrchestratorError(
      'invalid-output',
      `Fallback for ${role} failed.`,
      { role },
      fallbackError
    );
  }
}

async function runWithFallback<T>(
  role: string,
  run: () => Promise<T>,
  fallback: () => T,
  partialFailures: string[]
): Promise<T> {
  try {
    const result = await run();
    if (result) {
      return result;
    }
    throw new Error(`Empty output for ${role}.`);
  } catch (error) {
    partialFailures.push(formatFailure(role, error));
    try {
      return fallback();
    } catch (fallbackError) {
      throw new DebateOrchestratorError(
        'invalid-output',
        `Fallback for ${role} failed.`,
        { role },
        fallbackError
      );
    }
  }
}

function normalizeModulesWithVerification(
  modules: ProposalModule[],
  verification: VerifierOutput,
  partialFailures: string[]
): ProposalModule[] {
  const moduleByName = new Map(modules.map((m) => [m.name, m]));
  const verifiedNames = new Set<string>();

  for (const check of verification.moduleVerifications) {
    const module = moduleByName.get(check.moduleName);
    if (!module) {
      partialFailures.push(`Verifier returned unknown module "${check.moduleName}".`);
      continue;
    }

    verifiedNames.add(check.moduleName);
    module.estimatedCost = check.costBreakdown.total;

    const riskNotes = [...check.coherenceIssues, ...check.feasibilityIssues];
    if (riskNotes.length > 0) {
      module.riskFactors = [...module.riskFactors, ...riskNotes];
    }
  }

  for (const module of modules) {
    if (!verifiedNames.has(module.name)) {
      partialFailures.push(`Module "${module.name}" missing verification output.`);
    }
  }

  return modules;
}

function flattenCostDrivers(verification: VerifierOutput) {
  return verification.moduleVerifications.flatMap((v) => v.costDrivers);
}

function flattenScopeReductions(verification: VerifierOutput) {
  return verification.moduleVerifications.flatMap((v) => v.reductionOptions);
}

function collectCitations(
  fragments: Fragment[],
  adversary: AdversaryOutput,
  synthesis: SynthesizerOutput
): string[] {
  const validIds = new Set(fragments.map((f) => f.id));
  const citations = new Set<string>();

  for (const contradiction of adversary.contradictions) {
    for (const id of contradiction.fragmentIds) {
      if (validIds.has(id)) citations.add(id);
    }
  }

  for (const pressure of adversary.pressurePoints) {
    if (validIds.has(pressure.fragmentId)) {
      citations.add(pressure.fragmentId);
    }
  }

  for (const assumption of synthesis.assumptions) {
    for (const id of assumption.basedOn) {
      if (validIds.has(id)) citations.add(id);
    }
  }

  if (citations.size === 0) {
    for (const fragment of fragments) {
      citations.add(fragment.id);
    }
  }

  return Array.from(citations);
}

function collectVerifierNotes(verification: VerifierOutput): string[] {
  const notes = new Set<string>();

  for (const issue of verification.criticalIssues) {
    if (issue) notes.add(issue);
  }

  for (const recommendation of verification.recommendations) {
    if (recommendation) notes.add(recommendation);
  }

  for (const module of verification.moduleVerifications) {
    for (const issue of module.coherenceIssues) {
      notes.add(`Module "${module.moduleName}": ${issue}`);
    }
    for (const issue of module.feasibilityIssues) {
      notes.add(`Module "${module.moduleName}": ${issue}`);
    }
  }

  return Array.from(notes);
}

function buildChangeSet(
  modules: ProposalModule[],
  verification: VerifierOutput
): ChangeRequest[] {
  const changeSet: ChangeRequest[] = [];
  const moduleByName = new Map(modules.map((m) => [m.name, m]));

  for (const check of verification.moduleVerifications) {
    const module = moduleByName.get(check.moduleName);
    if (!module) continue;

    const issues = [
      ...check.coherenceIssues.map((issue) => `Coherence: ${issue}`),
      ...check.feasibilityIssues.map((issue) => `Feasibility: ${issue}`),
    ];

    if (issues.length === 0) continue;

    const previousValue = {
      ...module,
      dependencies: [...module.dependencies],
      riskFactors: [...module.riskFactors],
      verificationCriteria: [...module.verificationCriteria],
    };

    changeSet.push({
      id: crypto.randomUUID(),
      type: 'modify',
      target: 'module',
      targetId: module.id,
      previousValue,
      newValue: null,
      reason: issues.join(' | '),
      requestedAt: new Date(),
    });
  }

  return changeSet;
}

function determineDecision(
  synthesis: SynthesizerOutput,
  verification: VerifierOutput,
  partialFailures: string[]
): DebateDecision {
  const meetsConfidence =
    synthesis.confidenceScore >= THINKING_CONSTRAINTS.minimumConfidenceForProposal;
  const hasCriticalIssues = verification.criticalIssues.length > 0;

  if (!verification.overallCoherence && !verification.overallFeasibility) {
    return 'reject';
  }

  if (!meetsConfidence || hasCriticalIssues || partialFailures.length > 0) {
    return 'needs-review';
  }

  return 'approve';
}

function formatFailure(role: string, error: unknown): string {
  if (error instanceof Error) {
    return `${role} failed: ${error.message}`;
  }
  return `${role} failed: ${String(error)}`;
}
