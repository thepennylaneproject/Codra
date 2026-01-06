/**
 * Multi-Model Debate System
 *
 * How Codra thinks internally — you don't see this debate.
 * You see only the clarity that emerges.
 *
 * Models:
 * - Explorer: Aggressive possibility expansion
 * - Critic: Structural risks and blind spots
 * - Adversary: Assumes you're wrong, tries to break it
 * - Synthesizer: Reconciles disagreement
 * - Verifier: Checks coherence and feasibility
 */

export {
  createAIExplorer,
  exploreLocally,
  EXPLORER_SYSTEM_PROMPT,
  buildExplorerUserPrompt,
  type ExplorerDirection,
  type ExplorerOutput,
  type ExplorerProvider,
} from './explorer';

export {
  createAICritic,
  critiqueLocally,
  CRITIC_SYSTEM_PROMPT,
  buildCriticUserPrompt,
  type Risk,
  type RiskSeverity,
  type CriticOutput,
  type CriticProvider,
} from './critic';

export {
  createAIAdversary,
  challengeLocally,
  ADVERSARY_SYSTEM_PROMPT,
  buildAdversaryUserPrompt,
  type Contradiction,
  type PressurePoint,
  type AdversaryOutput,
  type AdversaryProvider,
} from './adversary';

export {
  createAISynthesizer,
  synthesizeLocally,
  synthesizerOutputToProposal,
  SYNTHESIZER_SYSTEM_PROMPT,
  buildSynthesizerUserPrompt,
  type SynthesizerInput,
  type SynthesizedModule,
  type SynthesizerOutput,
  type SynthesizerProvider,
} from './synthesizer';

export {
  createAIVerifier,
  verifyLocally,
  verifyModuleLocally,
  VERIFIER_SYSTEM_PROMPT,
  buildVerifierUserPrompt,
  type ModuleVerification,
  type VerifierOutput,
  type VerifierProvider,
} from './verifier';

export {
  conductDebate,
  DebateOrchestratorError,
  type DebateOptions,
} from './orchestrator';

export {
  estimateDebateCost,
  type DebatePreflightOptions,
} from './cost-preflight';
