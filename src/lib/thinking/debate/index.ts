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
