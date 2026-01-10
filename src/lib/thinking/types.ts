/**
 * Thinking Workspace Core Types
 *
 * Codra is not a tool you operate.
 * Codra is a workspace that thinks alongside you.
 */

// ============================================================================
// PHASE 1: ARRIVAL (Cognitive Landing)
// ============================================================================

export type FragmentType =
  | 'statement'    // Declarative intent
  | 'question'     // Open inquiry
  | 'constraint'   // What they won't do
  | 'anxiety'      // What they're worried about
  | 'signal'       // Recurring theme
  | 'aesthetic'    // How it should feel
  | 'anti-pattern'; // What they hate

export type FragmentStrength =
  | 'passing'    // Mentioned once, might change
  | 'recurring'  // Mentioned 2+ times
  | 'core';      // Central to identity

export interface ThoughtFragment {
  id: string;
  content: string;
  timestamp: Date;
  type: FragmentType;
  strength: FragmentStrength;
  mentionCount: number;
  relatedFragments: string[]; // IDs of connected thoughts
  confidence: number; // 0-1, how core is this belief
}

export type Fragment = ThoughtFragment;

export interface FragmentClassification {
  type: FragmentType;
  strength: FragmentStrength;
  domain: 'product' | 'system' | 'narrative' | 'execution' | 'identity';
  sentiment: 'positive' | 'negative' | 'neutral';
  isActionable: boolean;
}

// ============================================================================
// SHADOW PROJECT (Built silently in background)
// ============================================================================

export type InferredProjectType =
  | 'website'
  | 'app'
  | 'campaign'
  | 'content'
  | 'product'
  | 'brand-identity'
  | 'system'
  | 'unknown';

export interface ShadowProject {
  id: string;
  inferredType: InferredProjectType;
  coreBeliefs: string[];           // Statements mentioned 2+ times
  constraints: string[];            // Things they won't do
  anxieties: string[];              // Things they're worried about
  aesthetics: string[];             // How it should feel
  antiPatterns: string[];           // What they hate
  openQuestions: string[];          // Unresolved uncertainties
  readinessScore: number;           // 0-1, enough signal to propose?
  confidenceMap: Map<string, number>; // Confidence per belief
  lastUpdated: Date;
}

// ============================================================================
// PHASE 2: LYRA (Reflective Presence)
// ============================================================================

export type LyraMode =
  | 'dormant'    // Not yet engaged
  | 'observing'  // Watching input, building patterns
  | 'reflecting' // About to surface something
  | 'present';   // Active dialogue (rare)

export type ObservationType =
  | 'pattern'           // Recurring theme detected
  | 'contradiction'     // Conflicting statements
  | 'recurring-theme'   // Something mentioned multiple times
  | 'missing-piece'     // Conspicuous absence
  | 'emotional-weight'  // Anxiety or passion detected
  | 'pivot-point';      // Change in direction

export interface LyraObservation {
  id: string;
  type: ObservationType;
  content: string;
  evidence: string[]; // Fragment IDs that triggered this
  confidence: number;
  shouldSurface: boolean;
  surfacedAt: Date | null;
  dismissedAt: Date | null;
}

export interface ReflectiveIntervention {
  id: string;
  observation: LyraObservation;
  statement: string;        // What Lyra says (not a question)
  implicitQuestion: string; // The underlying inquiry
  requiresResponse: boolean;
  deliveredAt: Date | null;
  responseFragment: string | null; // ID of user's response fragment
}

// ============================================================================
// PHASE 3: MULTI-MODEL REASONING (Silent Multiplicity)
// ============================================================================

export type ReasoningRole =
  | 'explorer'    // Creative, aggressive exploration
  | 'critic'      // Structural risks, blind spots
  | 'adversary'   // Assumes idea is wrong, tries to break it
  | 'synthesizer' // Reconciles disagreements
  | 'verifier';   // Checks coherence, feasibility

export interface ReasoningOutput {
  role: ReasoningRole;
  content: string;
  keyPoints: string[];
  risks: string[];
  suggestions: string[];
  confidence: number;
  tokensUsed: number;
  cost: number;
}

export interface DebateModelPlan {
  role: ReasoningRole;
  provider?: string;
  model?: string;
}

export interface CreditEstimateBasis {
  inputChars: number;
  shadowChars: number;
  fragmentCount: number;
  modelCount: number;
  perModelOverheadTokens: number;
  outputTokenBase: number;
  outputTokenPerFragment: number;
}

export interface CreditEstimate {
  tokensIn: number;
  tokensOut: number;
  tokensTotal: number;
  creditsTotal: number;
  basis: CreditEstimateBasis;
  models: DebateModelPlan[];
  estimateHash: string;
  createdAt: Date;
}

export interface DebateConsent {
  approved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  estimateHash?: string;
}

export interface DebateReceiptStep {
  step: ReasoningRole | 'preflight';
  success: boolean;
  error?: string;
}

export interface DebateReceipt {
  estimate: CreditEstimate;
  actual: {
    durationMs: number;
    steps: DebateReceiptStep[];
    tokensUsedTotal?: number;
  };
}

export type DebateDecision = 'approve' | 'reject' | 'needs-review';

export interface DebateModelUsage {
  role: ReasoningRole;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  cost?: number;
}

export interface ProposalMetadata {
  timing: {
    startedAt: Date;
    completedAt: Date;
    durationMs: number;
  };
  modelUsage: DebateModelUsage[];
  partialFailures: string[];
  receipt?: DebateReceipt;
}

export interface DebateRound {
  round: number;
  outputs: Map<ReasoningRole, ReasoningOutput>;
  synthesis: ReasoningOutput | null;
  verification: VerificationResult | null;
  consensusReached: boolean;
  totalCost: number;
}

export interface SynthesizedProposal {
  rounds: DebateRound[];
  finalSynthesis: ReasoningOutput;
  confidence: number;
  totalCost: number;
  duration: number; // ms
}

// ============================================================================
// PHASE 4: PROPOSAL (Structure Emerges)
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high';

export interface CostRange {
  minimum: number;
  expected: number;
  maximum: number;
  currency: 'USD';
  confidence: number; // 0-1
}

export interface CostDriver {
  factor: string;
  impact: RiskLevel;
  estimatedCost: number;
  mitigation: string;
}

export interface ScopeReduction {
  id: string;
  description: string;
  savingsEstimate: number;
  tradeoff: string;
  recommended: boolean;
}

export interface ProposalModule {
  id: string;
  name: string;
  objective: string;        // One sentence max
  outcome: string;          // What exists when done
  dependencies: string[];   // Other module IDs
  estimatedCost: CostRange;
  riskLevel: RiskLevel;
  riskFactors: string[];
  isFoundational: boolean;  // Shouldn't change once started
  verificationCriteria: string[];
  order: number;
}

export interface Assumption {
  id: string;
  statement: string;
  basedOn: string[];  // Fragment IDs
  confidence: number;
  canBeValidated: boolean;
  validationMethod: string | null;
}

export interface Proposal {
  id: string;
  derivedFrom: string; // ShadowProject ID
  createdAt: Date;
  decision: DebateDecision;

  // The shape of the work
  modules: ProposalModule[];

  // Transparency
  knownUnknowns: string[];
  assumptions: Assumption[];
  changeSet: ChangeRequest[];
  citations: string[];
  verifierNotes: string[];
  metadata: ProposalMetadata;

  // Cost
  estimatedCost: CostRange;
  costDrivers: CostDriver[];
  scopeReductionOptions: ScopeReduction[];

  // Confidence
  confidenceScore: number;
  confidenceFactors: string[];

  // State
  state: 'draft' | 'presented' | 'approved' | 'revised' | 'rejected';
}

// ============================================================================
// PHASE 5: COST CONSENT
// ============================================================================

export interface CostBreakdown {
  reasoning: number;      // Multi-model debate cost
  generation: number;     // Content generation
  verification: number;   // Quality checks
  revisionBuffer: number; // Expected revisions
  uncertainty: number;    // Buffer for unknowns
  total: CostRange;
}

export interface CostConsent {
  id: string;
  moduleId: string;
  estimatedRange: CostRange;
  breakdown: CostBreakdown;
  userApprovedMax: number;
  consentedAt: Date;
  warnings: string[];
}

// ============================================================================
// PHASE 6: EXECUTION (Documents Placed)
// ============================================================================

export type DocumentType =
  | 'artifact'      // Primary deliverable
  | 'verification'  // Proof of quality
  | 'note'          // Contextual information
  | 'reference';    // Supporting material

export type DocumentState =
  | 'materializing' // Being generated
  | 'placed'        // Visible, not yet verified
  | 'verified'      // Passed verification
  | 'attention'     // Needs review
  | 'superseded';   // Replaced by newer version

export interface DocumentPosition {
  section: string;  // Module ID
  order: number;
  column: number;
}

export interface PlacedDocument {
  id: string;
  moduleId: string;
  type: DocumentType;
  title: string;
  content: string;
  state: DocumentState;
  position: DocumentPosition;
  placedAt: Date;
  generationCost: number;
  version: number;
  previousVersionId: string | null;
}

// ============================================================================
// PHASE 7: VERIFICATION
// ============================================================================

export type VerificationStatus =
  | 'pending'   // Not yet verified
  | 'verified'  // Passed all checks
  | 'attention' // Needs human review
  | 'conflict'  // Contradicts something
  | 'stale';    // Outdated by later changes

export type ConflictType =
  | 'contradiction'       // Direct conflict
  | 'assumption-violated' // Breaks an assumption
  | 'constraint-failed';  // Violates user constraint

export type ConflictSeverity = 'note' | 'review' | 'blocking';

export interface VerificationCheck {
  id: string;
  name: string;
  passed: boolean;
  details: string | null;
  checkedAt: Date;
}

export interface Conflict {
  id: string;
  type: ConflictType;
  description: string;
  relatedDocuments: string[];
  relatedFragments: string[];
  severity: ConflictSeverity;
  resolvedAt: Date | null;
  resolution: string | null;
}

export interface VerificationResult {
  documentId: string;
  status: VerificationStatus;
  checks: VerificationCheck[];
  conflicts: Conflict[];
  notes: string[];
  verifiedAt: Date;
}

// ============================================================================
// PHASE 8: CHANGE MANAGEMENT
// ============================================================================

export type ChangeType = 'modify' | 'remove' | 'add';
export type ChangeTarget = 'fragment' | 'module' | 'document' | 'constraint';

export interface ChangeRequest {
  id: string;
  type: ChangeType;
  target: ChangeTarget;
  targetId: string;
  previousValue: any;
  newValue: any;
  reason: string | null;
  requestedAt: Date;
}

export interface ImpactAnalysis {
  changeRequest: ChangeRequest;
  directlyAffected: string[];      // Documents that must change
  potentiallyAffected: string[];   // Documents to re-verify
  unaffected: string[];            // Preserved as-is
  costToResolve: CostRange;
  riskAssessment: string;
  recommendedAction: 'apply' | 'preview' | 'reconsider';
}

export interface ChangeConsent {
  id: string;
  changeRequest: ChangeRequest;
  impactAnalysis: ImpactAnalysis;
  approvedAt: Date | null;
  appliedAt: Date | null;
}

// ============================================================================
// PHASE 9: COMPLETION
// ============================================================================

export interface CompletionState {
  id: string;
  proposalId: string;
  allModulesVerified: boolean;
  totalCost: number;
  expectedCost: number;
  costVariance: number;
  varianceExplanation: string | null;
  decisionsTraceable: boolean;
  completedAt: Date;
}

export interface WorkBody {
  proposalId: string;
  modules: ProposalModule[];
  documents: PlacedDocument[];
  verifications: VerificationResult[];
  changes: ChangeRequest[];
  totalCost: number;
}

// ============================================================================
// WORKSPACE STATE (Unified)
// ============================================================================

export type ThinkingPhase =
  | 'arrival'       // Dumping fragments
  | 'reflection'    // Lyra surfacing patterns
  | 'debate'        // Multi-model reasoning (hidden)
  | 'proposal'      // Structure emerging
  | 'consent'       // Cost approval
  | 'execution'     // Work being placed
  | 'verification'  // Quality checking
  | 'complete';     // Done

export interface ThinkingWorkspaceState {
  // Phase
  currentPhase: ThinkingPhase;
  phaseHistory: Array<{ phase: ThinkingPhase; enteredAt: Date }>;

  // Arrival
  fragments: ThoughtFragment[];
  shadowProject: ShadowProject | null;

  // Lyra
  lyraMode: LyraMode;
  observations: LyraObservation[];
  interventions: ReflectiveIntervention[];

  // Debate (internal state, not shown)
  debateInProgress: boolean;
  debateRounds: DebateRound[];

  // Proposal
  proposal: Proposal | null;
  moduleApprovals: Map<string, ApprovalState>;

  // Cost
  costConsents: CostConsent[];
  totalEstimatedCost: CostRange | null;
  totalActualCost: number;

  // Execution
  documents: PlacedDocument[];
  verifications: Map<string, VerificationResult>;

  // Changes
  pendingChanges: ChangeRequest[];
  changeHistory: ChangeConsent[];

  // Completion
  completion: CompletionState | null;
}

export type ApprovalState =
  | 'proposed'   // Presented, not yet reviewed
  | 'reviewing'  // User examining
  | 'approved'   // User committed
  | 'deferred'   // "Not now"
  | 'revised'    // User modified scope
  | 'rejected';  // "This isn't right"

// ============================================================================
// CONSTRAINTS (What Codra Never Does)
// ============================================================================

export const THINKING_CONSTRAINTS = {
  // Structure
  neverForceStructureBeforeClarity: true,
  minimumFragmentsBeforeProposal: 5,
  requireExplicitApprovalForExecution: true,

  // Confidence
  neverPretendConfidenceWhenUncertain: true,
  minimumConfidenceForProposal: 0.7,
  showConfidenceAlways: true,

  // Cost
  neverHideCostBehindAbstraction: true,
  requireCostConsentBeforeExecution: true,
  showCostBreakdownAlways: true,

  // Motion vs Progress
  neverConfuseMotionWithProgress: true,
  requireVerificationBeforeComplete: true,

  // Communication
  neverConfuseFriendlinessWithTrust: true,
  lyraObservesNotChatters: true,
  noExclamationPoints: true,
  noCelebrations: true,
  noConfetti: true,
} as const;
