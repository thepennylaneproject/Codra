# Codra: Thinking Workspace Implementation Plan

## The Philosophy, Translated to Code

Codra is not a tool you operate. It is a workspace that thinks alongside you.

This document maps the 9-phase cognitive model to concrete technical implementation, using Adobe InDesign 2001 as visual DNA.

---

## Part I: Visual DNA — InDesign 2001 as Foundation

### Why InDesign 2001?

InDesign from 25 years ago understood something modern apps forgot:

**Work deserves a drafting table, not a dashboard.**

Visual characteristics we're adopting:

```
┌─────────────────────────────────────────────────────────────────────┐
│  INDESIGN 2001 DNA                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  • Muted gray workspace (not black, not white — neutral #3C3C3C)   │
│  • Cream/ivory document surface (#FFFEF5)                          │
│  • Tool panels: subtle, docked, collapsible                        │
│  • Central canvas is sacred — no overlays, no modals unless asked  │
│  • Rulers & guides as orientation (visible grids, not hidden)      │
│  • Typography-forward (hierarchy through type, not color)          │
│  • Status bar at bottom (quiet metrics, always visible)            │
│  • No gradients, no shadows on UI — flat, professional             │
│  • Monospace for technical, serif for reading                      │
│  • Panel chrome: 1px borders, no rounded corners, inset headers    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### New Color System

```css
:root {
  /* Workspace Chrome */
  --chrome-bg: #3C3C3C;           /* InDesign pasteboard gray */
  --chrome-border: #2A2A2A;       /* Subtle panel borders */
  --chrome-text: #B8B8B8;         /* Muted chrome labels */
  --chrome-text-active: #FFFFFF;  /* Active state */

  /* Document Surface */
  --surface-document: #FFFEF5;    /* Warm cream paper */
  --surface-margin: #F5F4EF;      /* Margin area */
  --surface-bleed: #EEEDEA;       /* Bleed/pasteboard */

  /* Type Hierarchy */
  --ink-body: #2C2C2C;            /* Body text */
  --ink-heading: #1A1A1A;         /* Headings */
  --ink-secondary: #6B6B6B;       /* Secondary text */
  --ink-ghost: #A0A0A0;           /* Placeholder/ghost */

  /* Semantic States */
  --state-thinking: #7B68A6;      /* Lyra thinking — muted violet */
  --state-verified: #4A7C59;      /* Verified — forest green */
  --state-attention: #B8860B;     /* Needs attention — dark gold */
  --state-conflict: #8B4049;      /* Conflict — muted wine */

  /* Cost/Budget (Critical — must be visible) */
  --cost-normal: #6B6B6B;         /* Within budget */
  --cost-approaching: #B8860B;    /* Approaching limit */
  --cost-exceeded: #8B4049;       /* Over budget */
}
```

---

## Part II: The Nine Phases — Technical Implementation

### Phase 1: Arrival (Cognitive Landing)

**Philosophy**: When you open Codra, nothing demands action.

**Current State**: Projects page → Create project → Fill form → Workspace

**Target State**: Direct arrival at a blank thinking surface

#### Technical Changes

**1.1 New Route: `/arrive`**

```typescript
// src/new/routes/ArrivalSurface.tsx

export function ArrivalSurface() {
  // No forms. No wizards. Just a surface.
  return (
    <ThinkingSurface>
      <DraftingTable />
      <LyraPresence mode="observing" />
      <StatusBar />
    </ThinkingSurface>
  );
}
```

**1.2 New Component: `DraftingTable`**

The central surface where thought fragments accumulate.

```typescript
// src/new/components/arrival/DraftingTable.tsx

interface ThoughtFragment {
  id: string;
  content: string;
  timestamp: Date;
  type: 'statement' | 'question' | 'constraint' | 'anxiety' | 'signal';
  confidence: number; // 0-1, how core is this belief?
  mentioned: number;  // how many times referenced?
}

interface DraftingTableState {
  fragments: ThoughtFragment[];
  shadowModel: ShadowProject | null;  // Building in background
  readiness: number;  // 0-1, enough signal to propose structure?
}
```

**1.3 Fragment Normalization Engine**

Silently classifies input without showing the user.

```typescript
// src/lib/arrival/fragment-normalizer.ts

type FragmentClassification = {
  type: 'intent' | 'constraint' | 'anxiety' | 'aesthetic' | 'value' | 'anti-pattern';
  strength: 'passing' | 'recurring' | 'core';
  domain: 'product' | 'system' | 'narrative' | 'execution';
}

export function normalizeFragment(
  content: string,
  existingFragments: ThoughtFragment[]
): FragmentClassification {
  // Uses lightweight local heuristics first
  // Falls back to AI only for ambiguous cases
}
```

**1.4 Shadow Project Model**

Builds project structure in background without showing user.

```typescript
// src/lib/arrival/shadow-model.ts

interface ShadowProject {
  inferredType: 'website' | 'app' | 'campaign' | 'content' | 'product' | 'brand-identity' | 'unknown';
  coreBeliefs: string[];           // Statements mentioned 2+ times
  constraints: string[];            // Things they won't do
  anxieties: string[];              // Things they're worried about
  openQuestions: string[];          // Unresolved uncertainties
  readinessScore: number;           // 0-1
  confidenceMap: Map<string, number>; // Confidence per belief
}
```

**1.5 Visual Layout: Arrival**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                                                                  │  │
│   │     [Blank cream surface — infinite canvas feel]                 │  │
│   │                                                                  │  │
│   │     Fragments appear as placed cards when typed:                 │  │
│   │                                                                  │  │
│   │     ┌─────────────────────────────┐                             │  │
│   │     │ "I want to build something  │                             │  │
│   │     │  for overwhelmed job        │                             │  │
│   │     │  seekers"                   │                             │  │
│   │     └─────────────────────────────┘                             │  │
│   │                                                                  │  │
│   │                ┌─────────────────────────────┐                  │  │
│   │                │ "It needs to feel calm"     │                  │  │
│   │                └─────────────────────────────┘                  │  │
│   │                                                                  │  │
│   │     ┌─────────────────────────────┐                             │  │
│   │     │ "I hate surprises"          │ ← anxiety                   │  │
│   │     └─────────────────────────────┘                             │  │
│   │                                                                  │  │
│   │                                                                  │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│   ┌────────────────────────────────────────────────────┐                │
│   │ Type anything. Change your mind. Contradict yourself.│  ← subtle   │
│   └────────────────────────────────────────────────────┘                │
│                                                                          │
│   ───────────────────────────────────────────────────────────────────── │
│   Fragments: 3  │  Thinking...  │  No commitment yet                    │
│   ───────────────────────────────────────────────────────────────────── │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 2: Reflective Friction (Lyra's New Role)

**Philosophy**: Lyra does not ask onboarding questions. She surfaces patterns you didn't notice.

**Current State**: Lyra is an assistant that responds to commands

**Target State**: Lyra is a reflective presence that interrupts only when necessary

#### Technical Changes

**2.1 Lyra Mode: Observing**

```typescript
// src/lib/lyra/LyraObserver.ts (enhanced)

type LyraMode =
  | 'dormant'    // Not yet engaged
  | 'observing'  // Watching input, building patterns
  | 'reflecting' // About to surface something
  | 'present';   // Active dialogue

interface LyraObservation {
  type: 'pattern' | 'contradiction' | 'recurring-theme' | 'missing-piece';
  content: string;
  evidence: ThoughtFragment[]; // What triggered this observation
  confidence: number;
  shouldSurface: boolean;
}
```

**2.2 Pattern Detection Engine**

```typescript
// src/lib/lyra/pattern-detector.ts

export function detectPatterns(fragments: ThoughtFragment[]): LyraObservation[] {
  const observations: LyraObservation[] = [];

  // Detect recurring themes (mentioned 2+ times)
  const recurringThemes = findRecurringThemes(fragments);

  // Detect contradictions
  const contradictions = findContradictions(fragments);

  // Detect emotional weight (anxiety markers)
  const anxieties = findAnxietyMarkers(fragments);

  // Detect what's conspicuously absent
  const gaps = findSignificantGaps(fragments);

  return observations;
}
```

**2.3 Reflective Interventions (Not Questions)**

Lyra never asks: "What are your goals?"

Lyra says: "You've mentioned trust more than features. Is that intentional?"

```typescript
// src/lib/lyra/reflection-generator.ts

interface ReflectiveIntervention {
  trigger: LyraObservation;
  statement: string;        // What Lyra says
  implicitQuestion: string; // The underlying inquiry
  requiresResponse: boolean;
}

// Example outputs:
// "You're describing what you don't want more than what you do."
// "Cost control has come up three times. That's not incidental."
// "You haven't mentioned who this is for yet."
```

**2.4 Visual: Lyra's Presence**

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Lyra appears as a subtle sidebar — not a chat, not a bot          │
│                                                                     │
│   ┌─────────────────────┐                                          │
│   │                     │                                          │
│   │   ● observing       │  ← Mode indicator (violet dot)           │
│   │                     │                                          │
│   │   ─────────────     │                                          │
│   │                     │                                          │
│   │   "You've mentioned │                                          │
│   │   'calm' in three   │                                          │
│   │   different ways.   │                                          │
│   │                     │                                          │
│   │   That feels core." │                                          │
│   │                     │                                          │
│   │   ─────────────     │                                          │
│   │                     │                                          │
│   │                     │                                          │
│   │                     │                                          │
│   └─────────────────────┘                                          │
│                                                                     │
│   No chat input. No "ask Lyra" button.                             │
│   She speaks when patterns emerge.                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Phase 3: Silent Multiplicity (Multi-Model Reasoning)

**Philosophy**: Multiple models debate internally. You see only the clarity that emerges.

**Current State**: Single model execution with provider routing

**Target State**: Multi-model reasoning with synthesis and verification

#### Technical Changes

**3.1 Internal Model Roles**

```typescript
// src/lib/reasoning/multi-model-engine.ts

interface ReasoningRole {
  id: string;
  purpose: string;
  provider: AIProvider;
  model: string;
}

const REASONING_ENSEMBLE: ReasoningRole[] = [
  {
    id: 'explorer',
    purpose: 'Creative, aggressive exploration of possibilities',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet'  // Fast, creative
  },
  {
    id: 'critic',
    purpose: 'Find structural risks, blind spots, edge cases',
    provider: 'openai',
    model: 'gpt-4o'  // Different perspective
  },
  {
    id: 'adversary',
    purpose: 'Assume the idea is wrong, try to break it',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet'  // With adversarial prompt
  },
  {
    id: 'synthesizer',
    purpose: 'Reconcile disagreements into coherent proposal',
    provider: 'anthropic',
    model: 'claude-sonnet-4'  // Best at synthesis
  },
  {
    id: 'verifier',
    purpose: 'Check coherence, feasibility, contradictions',
    provider: 'openai',
    model: 'gpt-4o-mini'  // Fast verification
  }
];
```

**3.2 Debate Protocol**

```typescript
// src/lib/reasoning/debate-protocol.ts

interface DebateRound {
  round: number;
  explorerOutput: ReasoningOutput;
  criticOutput: ReasoningOutput;
  adversaryOutput: ReasoningOutput;
  synthesis: ReasoningOutput;
  verification: VerificationResult;
  consensusReached: boolean;
}

export async function conductDebate(
  shadowProject: ShadowProject,
  maxRounds: number = 3
): Promise<SynthesizedProposal> {
  let consensus = false;
  let round = 0;

  while (!consensus && round < maxRounds) {
    // All three initial models run in parallel
    const [explorer, critic, adversary] = await Promise.all([
      runExplorer(shadowProject),
      runCritic(shadowProject),
      runAdversary(shadowProject)
    ]);

    // Synthesizer reconciles
    const synthesis = await runSynthesizer({explorer, critic, adversary});

    // Verifier checks coherence
    const verification = await runVerifier(synthesis);

    consensus = verification.coherent && verification.feasible;
    round++;
  }

  return synthesizedProposal;
}
```

**3.3 User Visibility: None During Debate**

The user sees only:
- A subtle "thinking" indicator
- Elapsed time
- Cost accumulating (but no details)

After debate concludes, user sees the synthesized proposal.

```typescript
// src/lib/reasoning/thinking-state.ts

interface ThinkingState {
  active: boolean;
  startTime: Date;
  estimatedCost: number;
  actualCost: number;
  // User NEVER sees:
  // - Individual model outputs
  // - Disagreements
  // - Failed attempts
}
```

---

### Phase 4: Proposal, Not Execution

**Philosophy**: Codra proposes a plan before doing anything. Structure appears only after clarity.

**Current State**: Create project → Tasks appear → Execute

**Target State**: Fragments → Debate → Proposal → User approval → Then structure appears

#### Technical Changes

**4.1 Proposal Object**

```typescript
// src/lib/proposal/types.ts

interface Proposal {
  id: string;
  derivedFrom: ShadowProject;

  // The shape of the work
  modules: ProposalModule[];

  // Risk transparency
  knownUnknowns: string[];
  assumptions: Assumption[];

  // Cost transparency
  estimatedCost: CostRange;
  costDrivers: CostDriver[];
  scopeReductionOptions: ScopeOption[];

  // Confidence
  confidenceScore: number;
  confidenceFactors: string[];
}

interface ProposalModule {
  id: string;
  name: string;
  objective: string;        // One sentence
  outcome: string;          // What exists when done
  dependencies: string[];   // Other module IDs
  estimatedCost: CostRange;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  isFoundational: boolean;  // "shouldn't change once started"
  verificationCriteria: string[];
}

interface CostRange {
  minimum: number;
  expected: number;
  maximum: number;
  currency: 'USD';
  confidence: number;
}
```

**4.2 Proposal Presentation (Visual)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   PROPOSAL                                             [$4.20 - $6.80]  │
│   ═══════                                                               │
│                                                                         │
│   Based on what you've described, this work has four natural parts:     │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ 1. FOUNDATION                              $0.80 - $1.20  LOW   │  │
│   │    ───────────                                                  │  │
│   │    Establish core identity and constraints.                     │  │
│   │    This shouldn't change once committed.                        │  │
│   │                                                                 │  │
│   │    Outcome: Brand identity document, voice guidelines,          │  │
│   │             constraint manifest                                 │  │
│   │                                                                 │  │
│   │    Verification: Consistent with stated values ✓                │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ 2. CONTENT STRATEGY                        $1.20 - $2.00  MED   │  │
│   │    ─────────────────                                            │  │
│   │    Define what this thing says and how.                         │  │
│   │    Carries scope creep risk.                                    │  │
│   │                                                                 │  │
│   │    Outcome: Messaging framework, content structure,             │  │
│   │             tone examples                                       │  │
│   │                                                                 │  │
│   │    Risk: May expand if audience definition is unclear           │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────── │
│   │ Commit to Foundation │     │ Commit to All │     │ Revise │      │
│   ─────────────────────────────────────────────────────────────────── │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**4.3 Module Approval Flow**

```typescript
// src/lib/proposal/approval-flow.ts

type ApprovalState =
  | 'proposed'      // Presented, not yet reviewed
  | 'reviewing'     // User is examining
  | 'approved'      // User committed
  | 'deferred'      // "Not now"
  | 'revised'       // User modified scope
  | 'rejected';     // "This isn't right"

interface ModuleApproval {
  moduleId: string;
  state: ApprovalState;
  approvedScope: ProposalModule | null;
  deferralReason: string | null;
  revisionNotes: string | null;
}
```

---

### Phase 5: Cost as Gravity, Not Punishment

**Philosophy**: Cost is known before anything happens. No surprises.

**Current State**: Budget tracking exists but reactive

**Target State**: Upfront pricing with explicit cost drivers and reduction options

#### Technical Changes

**5.1 Pre-Execution Cost Estimation**

```typescript
// src/lib/cost/pre-execution-estimator.ts

interface CostEstimate {
  module: ProposalModule;
  breakdown: CostBreakdown;
  drivers: CostDriver[];
  reductionOptions: ScopeReduction[];
}

interface CostBreakdown {
  reasoning: number;      // Multi-model debate cost
  generation: number;     // Content generation
  verification: number;   // Quality checks
  revision: number;       // Expected revisions (2x multiplier)
  buffer: number;         // Uncertainty buffer
  total: CostRange;
}

interface CostDriver {
  factor: string;         // "Complex audience segmentation"
  impact: 'low' | 'medium' | 'high';
  mitigation: string;     // How to reduce this
}

interface ScopeReduction {
  description: string;
  savingsEstimate: number;
  tradeoff: string;       // What you lose
}
```

**5.2 Cost Consent Flow**

Nothing executes without explicit cost consent.

```typescript
// src/lib/cost/consent.ts

interface CostConsent {
  moduleId: string;
  estimatedRange: CostRange;
  userApprovedMax: number;
  consentedAt: Date;
  warnings: string[];     // If estimate is uncertain
}

// Before any execution:
function requireCostConsent(module: ProposalModule): CostConsent | null {
  // Display cost clearly
  // Wait for explicit user confirmation
  // Only then allow execution to proceed
}
```

**5.3 Visual: Cost Transparency**

```
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│   COST ESTIMATE: Content Strategy Module                              │
│   ════════════════════════════════════                                │
│                                                                       │
│   Expected: $1.60          Range: $1.20 - $2.00                       │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────────┐│
│   │ Breakdown                                                       ││
│   │ ─────────                                                       ││
│   │ Reasoning (multi-model)      $0.40                              ││
│   │ Content generation           $0.80                              ││
│   │ Verification                 $0.15                              ││
│   │ Revision buffer (40%)        $0.25                              ││
│   │                              ─────                              ││
│   │ Expected total               $1.60                              ││
│   └─────────────────────────────────────────────────────────────────┘│
│                                                                       │
│   Cost Drivers                                                        │
│   ────────────                                                        │
│   • Multiple audience segments (+$0.30)                               │
│   • Complex tone requirements (+$0.15)                                │
│                                                                       │
│   Reduce Scope?                                                       │
│   ─────────────                                                       │
│   • Single audience focus: saves ~$0.25, loses segment flexibility    │
│   • Simpler tone guidance: saves ~$0.10, loses nuance                 │
│                                                                       │
│   ─────────────────────────────────────────────────────────────────── │
│   │ Approve $2.00 max │           │ Reduce scope │       │ Cancel │  │
│   ─────────────────────────────────────────────────────────────────── │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

### Phase 6: Execution as Placement

**Philosophy**: Outputs appear like documents placed on a drafting table. Not notifications. Not celebrations. Work appearing.

**Current State**: Execution → Toast notification → Navigate to output

**Target State**: Execution → Output materializes in place, silently

#### Technical Changes

**6.1 Document Placement Model**

```typescript
// src/lib/execution/placement.ts

interface PlacedDocument {
  id: string;
  moduleId: string;
  type: 'artifact' | 'verification' | 'note';
  content: ArtifactContent;
  state: DocumentState;
  position: DocumentPosition;  // Where on the surface
  placedAt: Date;
  verificationStatus: VerificationStatus;
}

type DocumentState =
  | 'materializing'  // Being generated
  | 'placed'         // Visible, not yet verified
  | 'verified'       // Passed verification
  | 'attention'      // Needs review
  | 'superseded';    // Replaced by newer version

interface DocumentPosition {
  section: 'foundation' | 'content' | 'design' | 'implementation';
  order: number;
  column: number;  // For multi-column layouts
}
```

**6.2 Materialization Animation**

InDesign-style: documents fade in from transparency, edges first.

```css
/* src/styles/placement.css */

@keyframes materialize {
  0% {
    opacity: 0;
    transform: scale(0.98);
    outline: 1px solid var(--state-thinking);
    outline-offset: 4px;
  }
  50% {
    opacity: 0.6;
    outline-offset: 2px;
  }
  100% {
    opacity: 1;
    transform: scale(1);
    outline: none;
  }
}

.document--materializing {
  animation: materialize 0.8s ease-out;
}
```

**6.3 Execution Surface (Drafting Table)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   FOUNDATION                                         ● verified         │
│   ══════════                                                            │
│                                                                         │
│   ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────┐  │
│   │ Brand Identity     │  │ Voice Guidelines   │  │ Constraints     │  │
│   │                    │  │                    │  │                 │  │
│   │ [document content] │  │ [document content] │  │ [document       │  │
│   │                    │  │                    │  │  content]       │  │
│   │                    │  │                    │  │                 │  │
│   │ ● verified         │  │ ● verified         │  │ ● verified      │  │
│   └────────────────────┘  └────────────────────┘  └─────────────────┘  │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────── │
│                                                                         │
│   CONTENT STRATEGY                                   ○ in progress      │
│   ════════════════                                                      │
│                                                                         │
│   ┌────────────────────┐  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐                       │
│   │ Messaging          │  │                     │  ← materializing     │
│   │ Framework          │  │  Tone Examples      │                      │
│   │                    │  │                     │                      │
│   │ [content...]       │  │  ○ ○ ○              │                      │
│   │                    │  │                     │                      │
│   │ ○ pending review   │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘                       │
│   └────────────────────┘                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 7: Verification Without Drama

**Philosophy**: Errors are noted, not panicked about. Conflicts are stated, not highlighted.

**Current State**: Toast notifications, error modals

**Target State**: Inline verification states, calm conflict notation

#### Technical Changes

**7.1 Verification States**

```typescript
// src/lib/verification/types.ts

type VerificationStatus =
  | 'pending'      // Not yet verified
  | 'verified'     // Passed all checks
  | 'attention'    // Needs human review
  | 'conflict'     // Contradicts something
  | 'stale';       // Outdated by later changes

interface VerificationResult {
  documentId: string;
  status: VerificationStatus;
  checks: VerificationCheck[];
  conflicts: Conflict[];
  notes: string[];
}

interface VerificationCheck {
  name: string;
  passed: boolean;
  details: string | null;
}

interface Conflict {
  type: 'contradiction' | 'assumption-violated' | 'constraint-failed';
  description: string;
  relatedDocuments: string[];
  severity: 'note' | 'review' | 'blocking';
}
```

**7.2 Conflict Display (Calm)**

No red alerts. No exclamation marks. Just clear notation.

```
┌────────────────────────────────────────────────────────────────────┐
│ Messaging Framework                                                │
│ ═══════════════════                                                │
│                                                                    │
│ [document content here...]                                         │
│                                                                    │
│ ─────────────────────────────────────────────────────────────────  │
│                                                                    │
│ ◐ attention                                                        │
│                                                                    │
│ This conflicts with an earlier constraint:                         │
│ You said "no SaaS vibes" but this messaging uses                  │
│ subscription-forward language.                                     │
│                                                                    │
│ Related: Constraints Manifest (line 12)                            │
│                                                                    │
│ ─────────────────────────────────────────────────────────────────  │
│ │ Review │          │ Override │          │ Revise │              │
│ ─────────────────────────────────────────────────────────────────  │
└────────────────────────────────────────────────────────────────────┘
```

---

### Phase 8: Change Without Chaos

**Philosophy**: When you change your mind, Codra isolates the impact. Nothing explodes.

**Current State**: Changes require manual tracking

**Target State**: Automatic impact analysis, preservation of what still stands

#### Technical Changes

**8.1 Change Impact Analysis**

```typescript
// src/lib/change/impact-analyzer.ts

interface ChangeRequest {
  type: 'modify' | 'remove' | 'add';
  target: 'fragment' | 'module' | 'document';
  targetId: string;
  newValue: any;
}

interface ImpactAnalysis {
  directlyAffected: string[];      // Documents that must change
  potentiallyAffected: string[];   // Documents to re-verify
  unaffected: string[];            // Preserved as-is
  costToResolve: CostRange;
  riskAssessment: string;
}

export async function analyzeChangeImpact(
  change: ChangeRequest,
  currentState: WorkspaceState
): Promise<ImpactAnalysis> {
  // Trace dependencies
  // Identify what's downstream
  // Calculate cost of cascading changes
  // Return clear impact map
}
```

**8.2 Change Consent**

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   CHANGE IMPACT                                                        │
│   ═════════════                                                        │
│                                                                        │
│   You want to change: "Focus on job seekers"                           │
│   To: "Focus on career changers over 40"                               │
│                                                                        │
│   ─────────────────────────────────────────────────────────────────── │
│                                                                        │
│   Directly affected:                                                   │
│   • Messaging Framework — will be regenerated                          │
│   • Audience Profile — will be regenerated                             │
│                                                                        │
│   Needs re-verification:                                               │
│   • Tone Examples — may still apply                                    │
│   • Content Structure — may need adjustment                            │
│                                                                        │
│   Unchanged:                                                           │
│   • Brand Identity                                                     │
│   • Constraints Manifest                                               │
│   • Voice Guidelines                                                   │
│                                                                        │
│   Cost to resolve: $0.80 - $1.20                                       │
│                                                                        │
│   ─────────────────────────────────────────────────────────────────── │
│   │ Apply Change │              │ Preview First │         │ Cancel │  │
│   ─────────────────────────────────────────────────────────────────── │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 9: Completion Feels Quiet

**Philosophy**: When done, Codra doesn't celebrate. It marks work Verified. The satisfaction is implicit.

**Current State**: Confetti, success modals

**Target State**: Quiet state change, body of work visible

#### Technical Changes

**9.1 Completion State**

```typescript
// src/lib/completion/types.ts

interface CompletionState {
  allModulesVerified: boolean;
  totalCost: number;
  expectedCost: number;
  costVariance: number;
  decisionsTraceable: boolean;
  workBody: PlacedDocument[];
}

// No celebration. Just state change.
function markComplete(moduleId: string): void {
  updateModule(moduleId, { state: 'verified' });
  // That's it. No toast. No confetti. No "Great job!"
}
```

**9.2 Completion Display**

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   VERIFIED                                               $5.40 spent   │
│   ════════                                              ($4.20 - $6.80 est.)
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────────┐│
│   │                                                                  ││
│   │   Foundation        ● verified    4 documents                    ││
│   │   Content Strategy  ● verified    6 documents                    ││
│   │   Design System     ● verified    3 documents                    ││
│   │   Implementation    ● verified    8 documents                    ││
│   │                                                                  ││
│   │   ─────────────────────────────────────────────────────────────  ││
│   │   21 documents  •  12 verifications passed  •  0 open conflicts  ││
│   │                                                                  ││
│   └──────────────────────────────────────────────────────────────────┘│
│                                                                        │
│   Decisions are traceable. Nothing was rushed.                         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Part III: Component Architecture

### New Component Tree

```
src/new/components/
├── arrival/
│   ├── ArrivalSurface.tsx       # The blank landing
│   ├── DraftingTable.tsx        # Fragment accumulator
│   ├── FragmentCard.tsx         # Individual thought
│   ├── FragmentInput.tsx        # Where you type
│   └── ShadowIndicator.tsx      # "Thinking..." state
│
├── lyra/
│   ├── LyraPresence.tsx         # The observing presence
│   ├── ReflectionCard.tsx       # Pattern observation
│   ├── LyraModeIndicator.tsx    # dormant/observing/reflecting
│   └── InterventionDisplay.tsx  # When Lyra speaks
│
├── proposal/
│   ├── ProposalSurface.tsx      # Full proposal view
│   ├── ModuleCard.tsx           # Individual module
│   ├── CostBreakdown.tsx        # Detailed cost view
│   ├── RiskIndicator.tsx        # Risk visualization
│   ├── ScopeReducer.tsx         # Scope reduction options
│   └── ApprovalControls.tsx     # Commit/Revise/Defer
│
├── execution/
│   ├── ExecutionSurface.tsx     # The drafting table
│   ├── DocumentCard.tsx         # Placed document
│   ├── DocumentSection.tsx      # Module grouping
│   ├── MaterializationState.tsx # Generation animation
│   └── VerificationBadge.tsx    # Status indicator
│
├── verification/
│   ├── ConflictDisplay.tsx      # Calm conflict notation
│   ├── CheckList.tsx            # Verification checks
│   └── ResolutionControls.tsx   # Review/Override/Revise
│
├── change/
│   ├── ImpactAnalysis.tsx       # Change impact view
│   ├── AffectedList.tsx         # What's affected
│   └── ChangeConsent.tsx        # Approval flow
│
├── completion/
│   ├── CompletionSummary.tsx    # Final state view
│   └── WorkBody.tsx             # Full document list
│
└── shell/
    ├── ThinkingWorkspace.tsx    # Root layout
    ├── StatusBar.tsx            # Bottom status
    ├── ChromePanel.tsx          # Side panels (InDesign style)
    └── DocumentRuler.tsx        # Visual orientation
```

---

## Part IV: State Architecture

### New Zustand Stores

```typescript
// src/lib/store/thinking-store.ts

interface ThinkingState {
  // Phase tracking
  currentPhase: 'arrival' | 'reflection' | 'debate' | 'proposal' | 'execution' | 'verification' | 'complete';

  // Arrival state
  fragments: ThoughtFragment[];
  shadowProject: ShadowProject | null;

  // Lyra state
  lyraMode: LyraMode;
  observations: LyraObservation[];
  pendingReflections: ReflectiveIntervention[];

  // Debate state (internal)
  debateInProgress: boolean;
  debateRound: number;

  // Proposal state
  proposal: Proposal | null;
  moduleApprovals: Map<string, ApprovalState>;

  // Execution state
  placedDocuments: PlacedDocument[];
  verificationResults: Map<string, VerificationResult>;

  // Cost state
  estimatedCost: CostRange;
  actualCost: number;
  costConsents: CostConsent[];

  // Change state
  pendingChanges: ChangeRequest[];
  lastImpactAnalysis: ImpactAnalysis | null;
}
```

---

## Part V: Implementation Sequence

### Milestone 1: Visual Foundation (Week 1-2)

**Goal**: Establish InDesign 2001 visual DNA

1. **New design tokens** — colors, typography, spacing
2. **Chrome components** — panels, status bar, rulers
3. **Document surface** — the cream paper canvas
4. **Typography system** — serif for reading, mono for technical
5. **Animation system** — materialize, not pop

**Deliverables**:
- New `globals-thinking.css`
- New `ThinkingWorkspace` shell component
- Visual regression tests

### Milestone 2: Arrival Experience (Week 2-3)

**Goal**: Replace project creation with cognitive landing

1. **DraftingTable** component
2. **FragmentInput** and **FragmentCard**
3. **Fragment normalization engine**
4. **Shadow project builder**
5. **Readiness detection**

**Deliverables**:
- `/arrive` route
- Fragment state management
- Shadow project types

### Milestone 3: Lyra Transformation (Week 3-4)

**Goal**: Transform Lyra from assistant to reflective presence

1. **Pattern detection engine**
2. **Reflection generator**
3. **LyraPresence** component (observing mode)
4. **Intervention display** (not chat)
5. **Mode transitions** (dormant → observing → reflecting)

**Deliverables**:
- New `LyraObserver` with pattern detection
- Reflection generation prompts
- New Lyra UI components

### Milestone 4: Multi-Model Reasoning (Week 4-5)

**Goal**: Implement silent multi-model debate

1. **Reasoning role definitions**
2. **Debate protocol**
3. **Synthesis engine**
4. **Verification pass**
5. **Cost tracking for debate**

**Deliverables**:
- `multi-model-engine.ts`
- `debate-protocol.ts`
- Cost estimation for reasoning

### Milestone 5: Proposal System (Week 5-6)

**Goal**: Structure emerges from clarity, not upfront

1. **Proposal generation** from shadow project + debate
2. **ModuleCard** components
3. **Cost breakdown display**
4. **Approval flow**
5. **Scope reduction options**

**Deliverables**:
- `ProposalSurface` component
- Approval state management
- Cost consent flow

### Milestone 6: Execution as Placement (Week 6-7)

**Goal**: Work appears like documents on a drafting table

1. **ExecutionSurface** layout
2. **Document placement system**
3. **Materialization animation**
4. **Section organization**
5. **Real-time generation display**

**Deliverables**:
- Document placement engine
- Materialization CSS
- Section-based layout

### Milestone 7: Verification System (Week 7-8)

**Goal**: Calm error handling, not panic

1. **Verification check system**
2. **Conflict detection**
3. **ConflictDisplay** component
4. **Resolution flow**
5. **Constraint enforcement**

**Deliverables**:
- Verification engine
- Conflict notation UI
- Resolution controls

### Milestone 8: Change Management (Week 8-9)

**Goal**: Change without chaos

1. **Impact analysis engine**
2. **Dependency tracing**
3. **ImpactAnalysis** component
4. **Change consent flow**
5. **Selective re-execution**

**Deliverables**:
- Change impact analyzer
- Impact visualization
- Change consent UI

### Milestone 9: Completion & Polish (Week 9-10)

**Goal**: Quiet completion, full integration

1. **Completion state management**
2. **Work body visualization**
3. **Decision traceability**
4. **Full flow integration testing**
5. **Performance optimization**

**Deliverables**:
- Completion summary
- End-to-end flow
- Documentation

---

## Part VI: What Codra Never Does (Technical Constraints)

```typescript
// src/lib/thinking/constraints.ts

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

  // Trust
  neverConfuseFriendlinessWithTrust: true,
  lyraObservesNotChatters: true,
  noExclamationPoints: true,
  noCelebrations: true,
};
```

---

## Part VII: Migration Path

### From Current → Thinking Workspace

1. **Parallel development**: New routes alongside existing
2. **Feature flag**: `ENABLE_THINKING_WORKSPACE`
3. **Data migration**: Projects → Fragments + Proposal + Documents
4. **Gradual rollout**: Opt-in first, then default, then only

### Preserved Systems

- Authentication (unchanged)
- AI provider routing (extended with debate protocol)
- Cost tracking (enhanced with consent)
- Supabase data layer (new tables added)

### Deprecated Systems

- Project creation wizard
- Task-centric execution
- Toast celebrations
- Chat-style Lyra interface

---

## Conclusion

This implementation transforms Codra from a tool you operate into a workspace that thinks alongside you.

The InDesign 2001 aesthetic isn't nostalgia—it's recognition that professional work deserves calm, precise tools that don't demand attention.

When complete, users won't say "This app helped me."

They'll say: **"This thinks the way I do."**
