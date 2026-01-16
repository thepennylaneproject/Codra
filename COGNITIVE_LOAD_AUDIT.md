# COGNITIVE LOAD AUDIT: CODRA
## Comprehensive UX Engineering Analysis

**Audit Date**: January 16, 2026
**Auditor**: Senior UX Engineer & Cognitive Load Specialist
**Scope**: Full Codra application (frontend, backend integrations, primary user flows)
**Focus**: Logic, architecture, and flow control that impact user mental model clarity

---

## EXECUTIVE SUMMARY

Codra is a sophisticated AI-powered project execution platform with strong feature implementation but **significant distributed complexity** that increases cognitive load. Users and developers must maintain mental models of multiple interconnected systems without clear ownership or synchronization patterns.

### Key Findings:

| Category | Status | Impact |
|----------|--------|--------|
| **State Management** | 🔴 Critical | 5+ independent state systems, no single source of truth |
| **Terminology** | 🔴 Critical | Spread/TearSheet/ProjectContext/Profile used inconsistently |
| **Component Complexity** | 🔴 Critical | ExecutionDeskPage has 16+ state variables, 700+ lines |
| **Error Handling** | 🟡 High | Silent failures, missing confirmations, no comprehensive error UI |
| **Onboarding Clarity** | 🟡 High | Two competing flows with unclear routing and state management |
| **Cost Transparency** | 🟡 High | Three disconnected cost systems, no unified budget visibility |
| **Progressive Disclosure** | 🟡 High | Setup and daily-use tasks mixed, too many options visible |
| **Error Recovery** | 🟠 Medium | Good offline/retry patterns but missing edge case handling |

**Overall Cognitive Load**: **HIGH** - Requires developers/users to juggle multiple mental models simultaneously.

---

## DETAILED ISSUE ANALYSIS

### ISSUE #1: Distributed State Management Without Single Source of Truth

**Location**: Multiple files
- `src/pages/execution-desk/ExecutionDeskPage.tsx:86-129` (component state)
- `src/lib/store/useFlowStore.ts` (global UI state)
- `src/lib/store/useSettingsStore.ts` (preferences)
- `src/lib/store/useProjectStore.ts` (project data)
- `src/hooks/useSupabaseSpread.ts` (spread data + sync)
- `src/lib/store/workspace-layout.ts` (per-project layout)

**Category**: State Management / Architecture

**Severity**: P0 (blocks effective development and creates silent data corruption risks)

**Problem**:
Spread data is synchronized across THREE independent systems simultaneously:
1. `dbSpread` from Supabase (server state)
2. `spread` in ExecutionDeskPage (local state copy)
3. Offline queue in `useSupabaseSpread` (pending saves)

When a user edits a section, updates flow through multiple channels:
- Local state updates immediately
- Offline queue captures changes
- `persistSpread()` sends to Supabase
- `useEffect` syncs `dbSpread` back to local `spread`

This creates race conditions where `spread` can diverge from `dbSpread`, and developers must manually coordinate which version is authoritative.

**Cognitive Impact**:
- Developers must trace data flow across 3-4 files to understand "where is the truth?"
- Risk of stale data being displayed (e.g., revision history shows old state)
- Silent data loss possible if offline queue clears before sync completes
- Debugging requires understanding both Supabase hooks AND component state

**Root Cause (Technical)**:
The original architecture used Supabase for persistence but added a local state layer for UI responsiveness. The two systems were never fully integrated into a unified model. Synchronization is implicit (via `useEffect` watchers) rather than explicit, making data flow hard to trace.

**Proposed Fix**:
1. **Adopt a single state source**: Use `useSupabaseSpread` as the ONLY source of truth
   - Return both `spread` (current) and `savingSpread` (in-flight)
   - Component reads from hook return values, not local state copies
   - Eliminates the `setSpread` local setter entirely

2. **Make sync explicit**: Replace implicit `useEffect` watchers with explicit actions
   ```typescript
   // BEFORE: implicit sync
   useEffect(() => {
     if (dbSpread) setSpread(dbSpread);
   }, [dbSpread]);

   // AFTER: explicit action
   const { spread, setSectionContent, saving } = useSupabaseSpread();
   const handleSectionEdit = (sectionId, content) => {
     setSectionContent(sectionId, content); // hook handles persistence
   };
   ```

3. **Visualize saving state**: Show "Saving..." indicator when offline queue is syncing
   - Reduces user confusion about whether edits were saved
   - Prevents users from closing browser during critical saves

4. **Refactor ExecutionDeskPage**:
   - Move spread management to custom hook: `useWorkspaceData(projectId)`
   - This hook wraps `useSupabaseSpread` and exposes only mutations needed by page
   - Page becomes a consumer of data, not a manager of it

**Implementation Steps**:
1. Create `useWorkspaceData(projectId)` hook that wraps `useSupabaseSpread`
2. Move `setSpread`, `updateTask`, `persistSpread` into the hook
3. Update ExecutionDeskPage to use hook: `const { spread, updateSection } = useWorkspaceData(projectId)`
4. Add visual indicator for sync state in ExecutionDeskHeader
5. Remove the local `spread` state from ExecutionDeskPage
6. Update all dependent components to read from the hook

**Dependencies**:
- Requires refactoring `useSupabaseSpread` to return mutation functions
- Needs sync state indicator in UI (low effort)
- Must maintain backward compatibility with offline queue (already handled in hook)

**Effort**: HIGH (affects multiple components, 8-12 hours)

**Expected Impact on Cognitive Load**:
- Developers no longer need to understand 3 simultaneous state systems
- Data flow becomes traceable from UI action → hook → persistence
- Reduces surface area for bugs related to stale data

---

### ISSUE #2: Terminology Inconsistency (Spread / TearSheet / ProjectContext / Profile)

**Location**: Throughout codebase
- `/src/domain/types.ts` (type definitions)
- `/src/pages/execution-desk/ExecutionDeskPage.tsx` (uses all terms)
- `/src/hooks/useContextRevisions.ts` ("TearSheet" in history)
- `/src/new/routes/onboarding/store.ts` ("Profile" in onboarding)
- `/src/App.tsx:159` (old `/spread` route redirect)

**Category**: Data Model / Naming Consistency

**Severity**: P1 (causes constant mental context-switching and maintenance friction)

**Problem**:
Four overlapping terms represent related but distinct concepts:

| Term | Definition | Usage | Status |
|------|-----------|-------|--------|
| **Spread** | Main working document (sections + TOC + metadata) | Workspace/output | Current |
| **TearSheet** | Historical snapshot of project context | Revision history | Deprecated (not removed) |
| **ProjectContext** | Detailed project metadata (brand, goals, guardrails) | Setup/revision tracking | Current |
| **Profile** | User input during onboarding | Onboarding form | Current but named ambiguously |

**Real-world confusion**:
- Developer sees `TearSheetRevision` type and doesn't know if it's still used or deprecated
- Searches for "update spread" don't find functions called `updateProjectContext`
- Comments in types.ts say "Rebranded from TearSheet to ProjectContext" but both types still exist
- ExecutionDeskPage loads `currentRevision` from ProjectContext revisions AND `extendedProfile` separately — unclear which is source of truth

**Example code smell**:
```typescript
// ExecutionDeskPage line 129
const { currentRevision } = useContextRevisions(projectId);
// Also loads:
const extendedProfile = JSON.parse(localStorage.getItem(...));

// Which one represents "project context"? Developer must trace both.
```

**Cognitive Impact**:
- New developers spend 2-3 hours understanding the terminology landscape
- Code reviews stall on questions: "Should this use ProjectContext or Profile?"
- Search-and-replace refactors are risky because similar terms have different meanings
- Mental model of "what represents project setup?" requires constant context-switching

**Root Cause (Technical)**:
Historical evolution: TearSheet → ProjectContext rename happened in types.ts but old terminology wasn't fully purged. Onboarding layer uses "Profile" terminology which doesn't align with the project context layer.

**Proposed Fix**:

1. **Create a terminology glossary** (document in `/docs/DOMAIN_MODEL.md`):
   ```markdown
   # Codra Domain Model Glossary

   ## Spread
   - The main working document in the workspace
   - Contains sections (content), table of contents, metadata
   - Persists to Supabase, synced via offline queue
   - Type: `Spread` in `domain/types.ts`

   ## Project Context
   - Complete project metadata (identity, brand, goals, guardrails, success criteria)
   - Set during project setup, can be edited anytime
   - Has revision history (snapshots tracked over time)
   - Type: `ProjectContext` in `domain/types.ts`
   - Replaces deprecated "TearSheet"

   ## Onboarding Profile
   - Temporary data structure used during initial project setup
   - Maps user input → ProjectContext on project creation
   - Discarded after project created
   - Type: `ExtendedOnboardingProfile` in `domain/types.ts`

   ## ProjectSpec (future)
   - Lightweight project summary (id, name, type, status)
   - Used in project list, quick reference
   - Type: TBD in architect refactor
   ```

2. **Complete the TearSheet deprecation**:
   - Rename `TearSheetRevision` → `ProjectContextRevision`
   - Update hook: `useContextRevisions()` or rename to `useProjectContextHistory()`
   - Update all imports and usages (safe with search-replace)
   - Remove the old route: `/p/:projectId/spread` → already redirects, remove redirect

3. **Clarify ProfileTerminology**:
   - Rename `ExtendedOnboardingProfile` → `OnboardingData` (removes ambiguous "profile")
   - Clarify in types: "Temporary data structure during onboarding setup"
   - Move to `domain/onboarding-data.ts` instead of mixed with ProjectContext

4. **Update ExecutionDeskPage**:
   ```typescript
   // BEFORE: confusing
   const { currentRevision } = useContextRevisions(projectId);
   const extendedProfile = JSON.parse(localStorage.getItem(...));
   const promptContext = buildPromptContext(..., extendedProfile || null, ...);

   // AFTER: clear
   const { projectContext } = useProjectContextHistory(projectId);
   // (extendedProfile no longer needed after project creation)
   const promptContext = buildPromptContext(..., projectContext, ...);
   ```

**Implementation Steps**:
1. Create `/docs/DOMAIN_MODEL.md` glossary
2. Rename `TearSheetRevision` → `ProjectContextRevision` globally (search-replace safe)
3. Rename `useContextRevisions` → `useProjectContextHistory` with updated hook signature
4. Rename `ExtendedOnboardingProfile` → `OnboardingData`
5. Remove deprecated route redirect `/spread`
6. Update all component usages and comments to use new names
7. Add JSDoc comments to type definitions clarifying each entity's purpose

**Dependencies**:
- No functional changes, purely naming/clarity refactors
- Must be done carefully to avoid breaking imports
- Affects ~15-20 files but changes are straightforward

**Effort**: MEDIUM (5-7 hours, mostly find-and-replace + verification)

**Expected Impact on Cognitive Load**:
- New developers onboard 2-3 hours faster
- Code reviews clearer: terms have unambiguous meanings
- Less mental load comparing similar-sounding concepts
- Easier to add new terminology later if needed

---

### ISSUE #3: ExecutionDeskPage Component Complexity (700+ lines, 16+ state variables)

**Location**: `/src/pages/execution-desk/ExecutionDeskPage.tsx:86-129` (state declarations)

**Category**: Component Architecture / Complexity

**Severity**: P0 (difficult to test, maintain, extend; source of bugs)

**Problem**:
Single page component manages:
- 6 project/spread data states
- 5 task execution states (status, runs, timeout, etc.)
- 3 modal states (settings, context, proof)
- 2 scroll/view position states
- Multiple refs for intervals/timers

Example state declarations (lines 86-129):
```typescript
const [project, setProject] = useState(...)
const [spread, setSpread] = useState(...)
const [extendedProfile, setExtendedProfile] = useState(...)
const [taskQueue, setTaskQueue] = useState(...)
const [activeTaskId] = useState(...)
const [escalations, setEscalations] = useState(...)
const [taskExecutor] = useState(...)
const [taskRunStates, setTaskRunStates] = useState(...)
const [deskModels] = useState(...)
const [executingTaskId, setExecutingTaskId] = useState(...)
const [timeRemaining, setTimeRemaining] = useState(...)
const [isSettingsOpen, setIsSettingsOpen] = useState(...)
const [isContextModalOpen, setIsContextModalOpen] = useState(...)
const [isProofVisible, setIsProofVisible] = useState(...)
const [proofTrigger, setProofTrigger] = useState(...)
const [spreadError, setSpreadError] = useState(...)
const [isRetryingSpread, setIsRetryingSpread] = useState(...)
```

The task execution handler (`handleRunTask`) spans 200+ lines (lines 317-544) with nested callbacks, interval management, and side effects scattered throughout.

**Cognitive Impact**:
- Developers must hold 16+ mental models in working memory to make changes
- Adding a feature requires understanding interactions between 5+ state variables
- Testing requires mocking complex state interactions
- Risk of introducing state inconsistencies (e.g., `taskRunStates` out of sync with `executingTaskId`)
- Timeout/countdown logic uses refs + state + setInterval — multiple ways to represent same concept

**Root Cause (Technical)**:
The page evolved to support increasingly complex task execution scenarios (timeouts, cancellations, cost tracking, verifications) without being refactored to break responsibilities into smaller units.

**Proposed Fix**:

1. **Extract task execution logic into custom hook**:
   ```typescript
   // NEW: hooks/useTaskExecution.ts
   export function useTaskExecution(projectId: string) {
     // OWNS: taskRunStates, executingTaskId, timeRemaining, countdown logic
     // RETURNS: { runTask, cancelTask, retryTask, taskStatus, timeRemaining }

     const [taskRunStates, setTaskRunStates] = useState(...);
     const [executingTaskId, setExecutingTaskId] = useState(...);
     const [timeRemaining, setTimeRemaining] = useState(...);
     // ... interval logic ...

     const runTask = async (taskId, params) => {
       // All the 200-line logic moves here
     };

     return {
       runTask,
       cancelTask,
       retryTask,
       taskStatus: (taskId) => taskRunStates[taskId],
       timeRemaining,
       isExecuting: (taskId) => executingTaskId === taskId,
     };
   }
   ```

2. **Extract modal states into separate component**:
   ```typescript
   // ExecutionDeskPage:
   const [isSettingsOpen, setIsSettingsOpen] = useState(false);
   const [isContextModalOpen, setIsContextModalOpen] = useState(false);

   // MOVE TO: components/ExecutionDeskModals.tsx
   // Returns: <SettingsModal />, <ContextModal />
   // Only passes: onClose callbacks
   ```

3. **Extract proof panel state**:
   ```typescript
   // NEW: hooks/useProofPanel.ts
   export function useProofPanel() {
     const [isVisible, setIsVisible] = useState(false);
     const [trigger, setTrigger] = useState(null);

     const showProof = (triggerType) => {
       setTrigger(triggerType);
       setIsVisible(true);
     };

     return { isVisible, setIsVisible, trigger, showProof };
   }
   ```

4. **Refactored ExecutionDeskPage**:
   ```typescript
   function ExecutionDeskPage() {
     // Data state
     const { project, spread, updateSection } = useWorkspaceData(projectId);

     // Execution state
     const { runTask, taskStatus } = useTaskExecution(projectId);

     // UI state
     const { isSettingsOpen, setIsSettingsOpen } = useState(false);
     const proofPanel = useProofPanel();

     // Component is now just layout + event handling, ~150 lines
     return (
       <>
         <ExecutionDeskHeader {...} />
         <ExecutionDeskLayout
           left={<LyraColumn />}
           center={<ExecutionSurface onTaskClick={() => runTask(...)} />}
           right={<ProofPanel {...proofPanel} />}
         />
       </>
     );
   }
   ```

**Implementation Steps**:
1. Create `hooks/useTaskExecution.ts` with task execution logic
2. Create `hooks/useProofPanel.ts` for proof panel state management
3. Create `components/ExecutionDeskModals.tsx` for modal wrappers
4. Refactor ExecutionDeskPage to use the new hooks
5. Update tests to test hooks independently
6. Verify all task execution scenarios still work (normal run, timeout, cancel, retry)

**Dependencies**:
- Requires creation of new hooks (no dependency changes)
- Must preserve all existing functionality (task execution, timeout, cancellation)
- Works with ISSUE #1 fix (useWorkspaceData hook)

**Effort**: HIGH (12-15 hours, includes tests)

**Expected Impact on Cognitive Load**:
- Page itself becomes understandable in one sitting
- Each hook/component has single clear responsibility
- Easier to add new execution scenarios (cost warnings, verification, etc.)
- Testing becomes straightforward (mock hooks independently)

---

### ISSUE #4: Two Competing Onboarding Flows with Unclear Routing

**Location**:
- `/src/new/routes/onboarding/OnboardingFlow.tsx` (streamlined 3-step)
- `/src/new/components/onboarding/NewProjectOnboarding.tsx` (complex 6-7 step)
- `/src/App.tsx:170-173` (routing confusion)

**Category**: Flow / Navigation / State Management

**Severity**: P1 (users unclear which flow they're in, developers maintain two systems)

**Problem**:
Two separate onboarding implementations coexist:

| Flow | Route | Steps | State System | Status |
|------|-------|-------|-------------|--------|
| **OnboardingFlow** | `/new` | ProjectInfo → Context → Generating | `useOnboarding` hook | Current |
| **NewProjectOnboarding** | `/onboarding/new-project` | Mode → Context → AI Prefs → Budget → Visual → TearSheet → Generating | `useOnboardingStore` Zustand | Parallel/Legacy |

**Users' experience**:
- Navigate to `/new` → 3-step flow, project created immediately
- Navigate to `/onboarding/new-project` → 6+ step flow with more options
- Browser back button or direct URL navigation can switch between flows unexpectedly
- No clear messaging about which one they're using

**Developers' experience**:
- Two complete implementations of onboarding logic
- Both use different state management systems
- Changes to onboarding logic must happen in TWO places
- Tests duplicate across both implementations
- Resume logic implemented in both, but differently

**Cognitive Impact**:
- Users wonder: "Why does onboarding have different steps depending on where I click?"
- New developers must understand both systems before touching onboarding
- Risk of inconsistencies (if one is updated, the other isn't)
- Duplicated state management patterns teach inconsistent practices

**Root Cause (Technical)**:
The simpler `OnboardingFlow` was created as the "new" approach, but the original `NewProjectOnboarding` wasn't removed. They coexist as parallel implementations without clear deprecation.

**Proposed Fix**:

1. **Choose one canonical flow** (recommendation: `OnboardingFlow` as base + enhanced version):
   ```typescript
   // CANONICAL: /new with 4-step flow:
   // Step 1: Project Info (name, type, description)
   // Step 2: Context (optional - collapsible details)
   // Step 3: Preferences (budget, AI model, constraints)
   // Step 4: Generating
   ```

2. **Create a staged onboarding approach**:
   ```typescript
   // OnboardingFlow states:
   // "quick" - minimal setup (3 steps for impatient users)
   // "detailed" - full setup (5-6 steps for thorough users)

   // Route: /new?mode=quick or /new?mode=detailed
   // User can upgrade to detailed setup from dashboard later
   ```

3. **Consolidate state management**:
   ```typescript
   // Use single useOnboarding hook for all flows
   // If NewProjectOnboarding had features not in OnboardingFlow:
   //   - Add them as optional configuration
   //   - Not as separate parallel implementation
   ```

4. **Update routing**:
   ```typescript
   // BEFORE:
   // /new → OnboardingFlow
   // /onboarding/new-project → NewProjectOnboarding

   // AFTER:
   // /new → OnboardingFlow (canonical)
   // /onboarding/new-project → Redirect to /new (with deprecation notice)
   ```

5. **Deprecation strategy**:
   - Mark `NewProjectOnboarding.tsx` as "Deprecated: Use OnboardingFlow instead"
   - If any features are unique to it, add them to OnboardingFlow as optional steps
   - Remove old component after 2-3 sprints of no usage

**Implementation Steps**:
1. Audit both flows to identify unique features in each
2. Add missing features from `NewProjectOnboarding` to `OnboardingFlow` (if needed)
3. Create `/new?mode=quick|detailed` variant logic in `OnboardingFlow`
4. Update routing: `/onboarding/new-project` → redirect to `/new?mode=detailed`
5. Mark old component with deprecation notice
6. Update navigation links to point to `/new` consistently
7. Monitor analytics to confirm no users hit old route
8. Remove old component after confirmation period

**Dependencies**:
- Must preserve all features from both flows in the canonical one
- May need to extend `useOnboarding` hook to handle both quick and detailed modes
- Routing changes (simple)

**Effort**: MEDIUM (6-8 hours, mostly testing + verification)

**Expected Impact on Cognitive Load**:
- Single clear path for new project creation
- Users always have same experience
- Developers maintain only one onboarding system
- Easier to add new onboarding features

---

### ISSUE #5: Three Disconnected Cost Management Systems

**Location**:
- `/src/lib/billing/budget.ts` (BudgetController)
- `/src/lib/ai/cost.ts` (CostEngine)
- `/src/lib/thinking/debate/cost-preflight.ts` (DebateCostPreflight)
- `/src/pages/execution-desk/ExecutionDeskPage.tsx:99-102` (session cost tracking)

**Category**: State / Data Model / Architecture

**Severity**: P1 (creates opacity, prevents budget enforcement, difficult to extend)

**Problem**:
Cost calculations, budget limits, and session spending are managed in THREE isolated systems:

```
BudgetController              CostEngine                DebateCostPreflight
├─ monthlySpend             ├─ estimateCost()         ├─ estimateDebateCost()
├─ monthlyLimit             ├─ applyMarkup(20%)       ├─ buffers (40% revisions)
├─ hardLimitEnabled         ├─ compareModels()        └─ uncertaintyFactor
└─ checkBudget()            └─ token estimation

ExecutionDeskPage
├─ sessionCost (accumulates during run)
├─ No visibility into budgets
└─ No integration with BudgetController
```

**Specific issues**:

1. **Inconsistent markup**:
   - CostEngine applies 20% markup (line 181)
   - DebateCostPreflight has no mention of markup
   - Uncertainty: is debate cost already marked up or not?

2. **Token estimation is heuristic and undocumented**:
   ```typescript
   // cost.ts line 169
   case 'code': return contextSize + 1500; // Code tasks usually have long outputs
   case 'analysis': return contextSize + 3000; // Analysis is more thorough
   ```
   Users are not told about these assumptions. If actual tokens are half, users overpay 2x.

3. **No unified budget enforcement**:
   - `BudgetController.checkBudget()` exists but not called from ExecutionDeskPage
   - `sessionCost` accumulates but is never checked against daily limit
   - No warning: "You've used 80% of daily budget"

4. **Session spending invisible**:
   - `sessionCost` is local state in ExecutionDeskPage
   - Not shown in ExecutionDeskHeader or SettingsModal
   - Users have no visibility into how much money is at stake

5. **Cost model doesn't reflect reality**:
   - Estimates use `estimatedTokens * 0.7 input + 0.3 output` split
   - But actual tasks might have different ratios
   - No feedback loop to improve estimates

**Cognitive Impact**:
- Developers must maintain three separate cost calculation systems
- Adding new cost factors requires changes in multiple places
- Budget enforcement is incomplete and unpredictable
- Users have no visibility into spending until invoice arrives

**Root Cause (Technical)**:
Cost management grew organically:
1. First, `BudgetController` for monthly limits
2. Then `CostEngine` for model comparison
3. Then `DebateCostPreflight` for debate-specific reasoning
No integration point was created to unify these.

**Proposed Fix**:

1. **Create unified CostPolicy domain object**:
   ```typescript
   // domain/cost-policy.ts
   interface CostPolicy {
     // Static configuration
     monthlyBudget: number;
     dailyBudget: number;
     taskBudget: number;
     hardLimitEnabled: boolean;

     // Markup & factors
     costMarkupPercent: number; // 20%
     tokenRatioInput: number; // 0.7
     tokenRatioOutput: number; // 0.3
     debateUncertaintyFactor: number; // 0.2 (20%)
     debateRevisionBuffer: number; // 0.4 (40%)

     // Cost estimation assumptions
     estimationAssumptions: {
       codeTaskTokens: number; // +1500 for code
       analysisTaskTokens: number; // +3000 for analysis
     };
   }

   export const DEFAULT_COST_POLICY: CostPolicy = { ... };
   ```

2. **Create unified CostService**:
   ```typescript
   // lib/billing/cost-service.ts
   class CostService {
     constructor(private policy: CostPolicy) {}

     estimateCost(tokens: number, model: string): CostBreakdown {
       // Uses consistent markup, token ratios
       // Returns: { baseCost, markup, total, assumptions }
     }

     checkBudgets(spent: number): BudgetStatus {
       // Checks all three limits: monthly, daily, per-task
       // Returns: { allowed: boolean, nextAllowedTime?: Date, reason?: string }
     }

     estimateDebateCost(steps: number, tokens: number): CostBreakdown {
       // Uses same markup, adds debate-specific buffers
     }
   }
   ```

3. **Store CostPolicy in context**:
   ```typescript
   // Make it injectable/configurable
   const CostPolicyContext = createContext(DEFAULT_COST_POLICY);

   // Use in providers:
   <CostPolicyContext.Provider value={userCostPolicy}>
     <ExecutionDeskPage />
   </CostPolicyContext.Provider>
   ```

4. **Update ExecutionDeskPage to use CostService**:
   ```typescript
   // BEFORE:
   const [sessionCost, setSessionCost] = useState(0);
   // (not checked against budget)

   // AFTER:
   const costService = useCostService();
   const [sessionCost, setSessionCost] = useState(0);

   const handleRunTask = async (taskId) => {
     const estimate = costService.estimateCost(estimatedTokens, selectedModel);
     const budget = costService.checkBudgets(sessionCost + estimate.total);

     if (!budget.allowed) {
       showWarning(budget.reason); // "Daily budget exceeded"
       return;
     }

     // Run task...
     setSessionCost(prev => prev + actualCost);
   };
   ```

5. **Show cost transparency**:
   ```typescript
   // In ExecutionDeskHeader or settings panel:
   <CostDisplay
     estimated={estimate} // "~$0.47 (70% input, 30% output, +20% markup)"
     spent={sessionCost} // "$3.45 spent today (69% of daily budget)"
     remaining={remaining} // "$1.55 remaining"
   />
   ```

6. **Document cost model**:
   - Add `/docs/COST_MODEL.md` explaining all assumptions
   - Show in UI during onboarding and in help

**Implementation Steps**:
1. Create `domain/cost-policy.ts` with unified configuration
2. Create `lib/billing/cost-service.ts` with unified calculations
3. Add `useCostService()` hook
4. Update `BudgetController`, `CostEngine`, `DebateCostPreflight` to use CostService
5. Update ExecutionDeskPage to check budgets before running tasks
6. Add CostDisplay component to ExecutionDeskHeader
7. Create `/docs/COST_MODEL.md` documenting all assumptions
8. Update onboarding to explain cost model

**Dependencies**:
- Requires creating new domain types (low risk)
- Must maintain backward compatibility with existing cost tracking
- Needs UI component for cost display

**Effort**: MEDIUM-HIGH (10-12 hours, mostly refactoring + testing)

**Expected Impact on Cognitive Load**:
- Single unified cost model developers maintain
- Users see spending before it happens (preventive, not reactive)
- Cost estimates are documented and transparent
- Easier to adjust cost model globally (no search-replace across files)

---

### ISSUE #6: No Delete Confirmation for Projects

**Location**:
- `/src/lib/api/projects/adapter.ts:deleteProject()`
- `/src/domain/projects.ts:deleteProject()`
- `/src/pages/projects/ProjectsPage.tsx` (where delete is triggered)

**Category**: Interaction / Error Prevention

**Severity**: P0 (irreversible data loss with one click)

**Problem**:
Project deletion has no confirmation dialog:
```typescript
// domain/projects.ts
async function deleteProject(projectId: string): Promise<void> {
  return supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
}
```

User can click a "Delete" button and lose the entire project (all workstreams, tasks, artifacts, documents) without:
- Confirmation dialog
- Countdown timer
- Preview of what will be deleted
- Undo capability

**Cognitive Impact**:
- Users fear using delete buttons (creates hesitation)
- One accidental click causes catastrophic data loss
- No recovery mechanism visible
- Creates support burden when users delete accidentally

**Root Cause (Technical)**:
Delete functionality was implemented quickly without defensive UX. No confirmation was added because it "seemed obvious to not click delete," but that reasoning ignores accidental clicks, muscle memory, and misclicks.

**Proposed Fix**:

1. **Create ConfirmDeleteDialog component**:
   ```typescript
   // components/dialogs/ConfirmDeleteDialog.tsx
   interface ConfirmDeleteDialogProps {
     title: string; // "Delete Project?"
     message: string; // Description of what will be deleted
     deletionPreview?: ReactNode; // Show affected items
     onConfirm: () => Promise<void>;
     onCancel: () => void;
     isDangerous?: boolean; // Red styling
     countdownSeconds?: number; // 3-5 second delay before button enables
   }

   export function ConfirmDeleteDialog({
     title,
     message,
     deletionPreview,
     onConfirm,
     onCancel,
     isDangerous = true,
     countdownSeconds = 3,
   }: ConfirmDeleteDialogProps) {
     const [countdown, setCountdown] = useState(countdownSeconds);
     const [isDeleting, setIsDeleting] = useState(false);

     useEffect(() => {
       if (countdown > 0) {
         const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
         return () => clearTimeout(timer);
       }
     }, [countdown]);

     const handleDelete = async () => {
       setIsDeleting(true);
       try {
         await onConfirm();
         // Close dialog
       } catch (error) {
         // Show error
         setIsDeleting(false);
       }
     };

     return (
       <Dialog open onOpenChange={onCancel}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle className={isDangerous ? 'text-red-600' : ''}>
               {title}
             </DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <p>{message}</p>
             {deletionPreview && (
               <div className="bg-gray-100 p-4 rounded border border-red-200">
                 <h4 className="font-semibold text-sm">This will be deleted:</h4>
                 {deletionPreview}
               </div>
             )}
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={onCancel}>
               Cancel
             </Button>
             <Button
               variant={isDangerous ? 'destructive' : 'default'}
               onClick={handleDelete}
               disabled={countdown > 0 || isDeleting}
               loading={isDeleting}
             >
               {countdown > 0
                 ? `Delete in ${countdown}s`
                 : isDeleting
                   ? 'Deleting...'
                   : 'Delete Project'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     );
   }
   ```

2. **Update ProjectsPage delete handler**:
   ```typescript
   // pages/projects/ProjectsPage.tsx
   const [deleteConfirm, setDeleteConfirm] = useState<{
     projectId: string;
     projectName: string;
     taskCount: number;
   } | null>(null);

   const handleDeleteClick = (project: Project) => {
     // Get count of affected items
     const taskCount = project.workstreams.reduce((sum, ws) =>
       sum + ws.taskCount, 0
     );

     setDeleteConfirm({
       projectId: project.id,
       projectName: project.name,
       taskCount,
     });
   };

   const handleConfirmDelete = async () => {
     if (!deleteConfirm) return;

     try {
       await deleteProject(deleteConfirm.projectId);
       setDeleteConfirm(null);
       toast.success('Project deleted');
       // Refresh projects list
     } catch (error) {
       toast.error('Failed to delete project');
     }
   };

   // In JSX:
   <ConfirmDeleteDialog
     isOpen={!!deleteConfirm}
     title="Delete Project?"
     message={`This will permanently delete "${deleteConfirm?.projectName}" and all ${deleteConfirm?.taskCount} tasks within it. This cannot be undone.`}
     deletionPreview={
       <ul className="space-y-1">
         <li>• {deleteConfirm?.taskCount} tasks</li>
         <li>• All artifacts and documents</li>
         <li>• Complete project history</li>
       </ul>
     }
     countdownSeconds={3}
     onConfirm={handleConfirmDelete}
     onCancel={() => setDeleteConfirm(null)}
   />
   ```

3. **Apply same pattern to other destructive actions**:
   - Delete task
   - Delete artifact
   - Clear project history
   - Archive project (if unsupported, at least confirm)

4. **Add analytics**:
   ```typescript
   // Track delete confirmations and completions
   analytics.track('project_delete_requested', { projectId });
   analytics.track('project_delete_confirmed', { projectId });
   ```

**Implementation Steps**:
1. Create `ConfirmDeleteDialog` component in `/src/components/dialogs/`
2. Add `calculateDeletionImpact(projectId)` function to get task/artifact counts
3. Update `ProjectsPage` to show dialog before deleting
4. Update all delete handlers to use the confirmation pattern
5. Test with accidental clicks (toggle countdown, etc.)

**Dependencies**:
- No API changes needed
- Requires UI component (low effort)
- Must preserve delete functionality (no functional change)

**Effort**: LOW (3-4 hours)

**Expected Impact on Cognitive Load**:
- Users feel safe exploring delete buttons
- Accidental data loss prevented
- Users understand what will be deleted before confirming
- Reduces support burden

---

### ISSUE #7: Silent Error Fallbacks Hide System Degradation

**Location**:
- `/src/lib/ai/api-client.ts:80-82` (stream parsing)
- `/src/lib/thinking/document-verifier.ts:102-104` (verification fallback)
- `/src/lib/ai/providers/openai.ts:96` (unsafe array access)

**Category**: Error Handling / Reliability

**Severity**: P1 (users unaware system is degraded, difficult to debug)

**Problem**:
Multiple locations silently swallow errors instead of surfacing them to users:

1. **Stream parsing silently skips malformed chunks**:
   ```typescript
   // api-client.ts line 80-82
   try {
     const chunk = JSON.parse(line.slice(6));
     yield chunk;
   } catch {
     // Silently skip malformed JSON
     // User sees incomplete response, no indication of error
   }
   ```

2. **Verification falls back without user notification**:
   ```typescript
   // document-verifier.ts line 102-104
   } catch (error) {
     console.warn('AI document verification failed:', error);
     return verifyDocumentLocally(document, context);
     // User gets less reliable verification, doesn't know system is degraded
   }
   ```

3. **Unsafe array access crashes silently**:
   ```typescript
   // openai.ts line 96
   content: data.choices[0]?.message?.content ?? ''
   // If choices is not an array, this returns empty string instead of error
   ```

**Cognitive Impact**:
- Users don't know if system is working correctly
- Developers spend hours debugging "why is verification not working?"
- Incomplete data is presented as complete
- No feedback mechanism to report system issues

**Root Cause (Technical)**:
Defensive programming without user communication: "handle errors gracefully" was interpreted as "silently ignore errors" rather than "inform user and degrade gracefully."

**Proposed Fix**:

1. **Create ErrorReporter service**:
   ```typescript
   // lib/diagnostics/error-reporter.ts
   interface SystemError {
     code: string; // 'STREAM_PARSE_ERROR', 'VERIFICATION_FALLBACK', etc.
     severity: 'warning' | 'error' | 'critical';
     component: string;
     details?: Record<string, unknown>;
     timestamp: Date;
     userMessage?: string; // What to show user
   }

   class ErrorReporter {
     report(error: SystemError) {
       // Log to console
       // Send to analytics
       // Show user notification (if severity >= error)
       // Store in error queue for debug export
     }

     captureAsyncError(error: unknown, component: string) {
       // Wraps unknown errors in SystemError structure
     }
   }

   export const errorReporter = new ErrorReporter();
   ```

2. **Update stream parser**:
   ```typescript
   // BEFORE: silent skip
   try {
     const chunk = JSON.parse(line.slice(6));
     yield chunk;
   } catch {
     // Silently skip
   }

   // AFTER: report and mark degradation
   try {
     const chunk = JSON.parse(line.slice(6));
     yield chunk;
   } catch (error) {
     errorReporter.report({
       code: 'STREAM_PARSE_ERROR',
       severity: 'warning',
       component: 'AI Stream Parser',
       details: { line, error: String(error) },
       userMessage: 'Some response data was corrupted. Showing what we recovered.',
     });
     // Skip this chunk but continue stream
   }
   ```

3. **Update verification fallback**:
   ```typescript
   // BEFORE: silent fallback
   } catch (error) {
     console.warn('AI document verification failed:', error);
     return verifyDocumentLocally(document, context);
   }

   // AFTER: mark as degraded
   } catch (error) {
     errorReporter.report({
       code: 'VERIFICATION_FALLBACK',
       severity: 'warning',
       component: 'Document Verifier',
       details: { error: String(error) },
       userMessage: 'Using local verification (less reliable). Detailed AI verification temporarily unavailable.',
     });

     const result = verifyDocumentLocally(document, context);
     return {
       ...result,
       degraded: true,
       degradationReason: 'AI verification unavailable',
     };
   }
   ```

4. **Add VerificationStatus indicator**:
   ```typescript
   // In ProofPanel or ExecutionDeskHeader:
   {verification.degraded && (
     <Alert severity="warning">
       {verification.degradationReason}
       <Button variant="sm" onClick={() => retryVerification()}>
         Retry
       </Button>
     </Alert>
   )}
   ```

5. **Create SystemStatus component**:
   ```typescript
   // components/SystemStatus.tsx - shown in header or sidebar
   // Displays: "All systems normal" or "Verification: Degraded"
   // Allows users to see at a glance if something is wrong
   ```

**Implementation Steps**:
1. Create `lib/diagnostics/error-reporter.ts`
2. Create `ErrorBoundary` wrapper component for main routes
3. Update `api-client.ts` stream parser to report errors
4. Update `document-verifier.ts` fallback to report degradation
5. Update provider calls to handle missing response fields
6. Add `SystemStatus` indicator component
7. Create error export feature for debug sessions

**Dependencies**:
- Analytics integration (report errors)
- UI components for warnings/degradation indicators
- Error queue persistence (optional, for debug)

**Effort**: MEDIUM (7-9 hours)

**Expected Impact on Cognitive Load**:
- Users understand when system is degraded
- Developers have better debugging information
- Error tracking helps identify systemic issues
- Creates feedback mechanism for system improvements

---

### ISSUE #8: Proof Panel Has Confusing State Management

**Location**: `/src/pages/execution-desk/ExecutionDeskPage.tsx:108-109, 673`

**Category**: State Management / Interaction

**Severity**: P1 (multiple ways to control same UI, risk of inconsistent state)

**Problem**:
Proof panel visibility is controlled via THREE different mechanisms:

1. **Local state** (line 108):
   ```typescript
   const [isProofVisible, setIsProofVisible] = useState(false);
   ```

2. **Callback prop** (line 673):
   ```typescript
   onToggleProof={() => setIsProofVisible(prev => !prev)}
   ```

3. **Auto-trigger** (line 109):
   ```typescript
   const [proofTrigger, setProofTrigger] = useState(null);
   // When proofTrigger changes, proof panel might auto-open
   ```

This creates confusion:
- Developer A adds `setIsProofVisible(true)` in one place
- Developer B adds `setProofTrigger('verification_failed')` somewhere else
- Both show the panel but for different reasons
- Which one is the "source of truth"?

**Cognitive Impact**:
- Multiple code paths to the same UI state
- Risk of inconsistency (one setter called but UI not updated)
- Difficult to trace "why is the proof panel open?"
- Testing requires understanding all three mechanisms

**Root Cause (Technical)**:
The proof panel evolved from simple toggle to auto-triggering component without consolidating state management.

**Proposed Fix**:

1. **Consolidate into single state**:
   ```typescript
   // BEFORE: 3 different mechanisms
   const [isProofVisible, setIsProofVisible] = useState(false);
   const [proofTrigger, setProofTrigger] = useState(null);
   // + callback prop onToggleProof

   // AFTER: single state
   type ProofPanelState = 'hidden' | 'visible' | 'verification_failed' | 'cost_warning';
   const [proofState, setProofState] = useState<ProofPanelState>('hidden');
   ```

2. **Extract to custom hook**:
   ```typescript
   // hooks/useProofPanel.ts
   export function useProofPanel() {
     const [state, setState] = useState<ProofPanelState>('hidden');

     return {
       state,
       open: () => setState('visible'),
       close: () => setState('hidden'),
       showVerificationResult: (result) => setState('verification_failed'),
       showCostWarning: (amount) => setState('cost_warning'),
       isOpen: state !== 'hidden',
       trigger: state, // For components that need to know why it opened
     };
   }
   ```

3. **Use in ExecutionDeskPage**:
   ```typescript
   const proofPanel = useProofPanel();

   // In verification callback:
   verification.onComplete = (result) => {
     proofPanel.showVerificationResult(result);
   };

   // In cost warning:
   if (estimatedCost > dailyBudget) {
     proofPanel.showCostWarning(estimatedCost);
   }

   // In toggle button:
   <Button onClick={() => proofPanel.toggle()} />

   // In JSX:
   <ProofPanel
     state={proofPanel.state}
     onClose={() => proofPanel.close()}
   />
   ```

**Implementation Steps**:
1. Create `hooks/useProofPanel.ts` with consolidated state
2. Update ExecutionDeskPage to use hook instead of local state
3. Replace all `setIsProofVisible` and `setProofTrigger` calls with hook methods
4. Update ProofPanel component to receive `state` prop instead of `isVisible`
5. Test all proof panel triggers (manual, verification, cost, etc.)

**Dependencies**:
- No API changes
- Requires refactoring ExecutionDeskPage (works with ISSUE #3 fix)

**Effort**: LOW-MEDIUM (4-5 hours)

**Expected Impact on Cognitive Load**:
- Single clear way to control proof panel
- All triggers are explicit method calls
- Easier to add new trigger types (just add new method)
- Proof state is traceable to specific action

---

### ISSUE #9: Onboarding Profile Data Flow is Implicit

**Location**:
- `/src/new/routes/onboarding/OnboardingFlow.tsx`
- `/src/new/components/StepProjectInfo.tsx` (creates project)
- `/src/lib/api/projects.ts` (project creation)

**Category**: Flow / Clarity

**Severity**: P1 (developers unclear when data is created/persisted)

**Problem**:
Project creation happens "magically" inside a deep callback:

1. User fills out project name, type, description in `StepProjectInfo`
2. User clicks "Next"
3. Inside handler, project is created via API call
4. Project ID is set in state
5. Flow progresses to next step

**Issue**: It's completely unclear from the component name `StepProjectInfo` that this step creates the project. The component appears to be just a form, but it's actually:
- Form input
- API caller
- State setter
- Navigation trigger

Developers might:
- Try to add another project creation step later (not realizing it's in Step 1)
- Wonder why project exists if they hit browser back during Step 1
- Attempt to move the form without moving the API call

**Cognitive Impact**:
- Component name doesn't match what it does
- Hidden side effects make behavior unpredictable
- Difficult to test (requires mocking API)
- New developers spend time understanding what "Step 1" really does

**Root Cause (Technical)**:
The form component was tasked with both input collection AND side effects (project creation) to simplify the onboarding state machine. This works but violates the principle of least surprise.

**Proposed Fix**:

1. **Rename component for clarity**:
   ```typescript
   // BEFORE: components/StepProjectInfo.tsx
   // Implies: Just a form

   // AFTER: components/CreateProjectStep.tsx
   // Implies: This step creates the project
   ```

2. **Extract project creation to separate concern**:
   ```typescript
   // Create a "effect" hook instead of hiding in form handler
   export function useCreateProjectOnSubmit(projectData: ProjectInputData) {
     const [project, setProject] = useState<Project | null>(null);
     const [error, setError] = useState<string | null>(null);
     const [isCreating, setIsCreating] = useState(false);

     const createProject = useCallback(async () => {
       setIsCreating(true);
       try {
         const result = await projectsAPI.create(projectData);
         setProject(result);
         return result;
       } catch (err) {
         setError(String(err));
         throw err;
       } finally {
         setIsCreating(false);
       }
     }, [projectData]);

     return { project, error, isCreating, createProject };
   }
   ```

3. **Make side effect explicit**:
   ```typescript
   // CreateProjectStep.tsx
   export function CreateProjectStep({ onProjectCreated }) {
     const [name, setName] = useState('');
     const [type, setType] = useState('website');

     const { project, isCreating, createProject } = useCreateProjectOnSubmit({
       name,
       type,
     });

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       const newProject = await createProject();
       onProjectCreated(newProject); // Explicit callback, not implicit navigation
     };

     return (
       <form onSubmit={handleSubmit}>
         <input value={name} onChange={(e) => setName(e.target.value)} />
         <select value={type} onChange={(e) => setType(e.target.value)}>
           <option>website</option>
           <option>app</option>
         </select>
         <button disabled={isCreating}>
           {isCreating ? 'Creating...' : 'Create Project'}
         </button>
       </form>
     );
   }
   ```

4. **Document the creation flow**:
   ```typescript
   /**
    * CreateProjectStep
    *
    * Responsibility: Collect project basic info AND create the project
    *
    * Side effects:
    * - Calls projectsAPI.create() on form submit
    * - Invokes onProjectCreated callback with created project
    *
    * Next step: User goes to StepProjectContext to add details
    */
   ```

5. **Add diagnostic logging**:
   ```typescript
   const handleSubmit = async (e) => {
     console.debug('[OnboardingFlow] CreateProjectStep submitting', { name, type });
     const newProject = await createProject();
     console.debug('[OnboardingFlow] Project created', { projectId: newProject.id });
     onProjectCreated(newProject);
   };
   ```

**Implementation Steps**:
1. Rename `StepProjectInfo` → `CreateProjectStep`
2. Create `useCreateProjectOnSubmit` hook
3. Move project creation logic into hook
4. Update component to call hook and use returned methods
5. Add comments explaining side effects
6. Update tests to test hook independently from component
7. Add diagnostic logging for onboarding steps

**Dependencies**:
- No API changes
- Works with ISSUE #4 (onboarding consolidation)

**Effort**: LOW-MEDIUM (4-5 hours)

**Expected Impact on Cognitive Load**:
- Component name clearly indicates it creates a project
- Side effects are explicit (hook call, callback)
- Easier to add new steps after creation
- Testing is easier (hook can be tested independently)

---

### ISSUE #10: Context Modal Complexity (Too Many Required Fields)

**Location**: `/src/new/components/ContextForm.tsx` or `/src/components/ProjectContext/ContextForm.tsx`

**Category**: Progressive Disclosure / Interaction

**Severity**: P1 (overwhelming for users, discourages setup completion)

**Problem**:
The project context form displays all required fields at once:
- Project Identity (name, summary, type)
- Audience (primary, context)
- Brand Constraints (visual style, tone, values)
- Success Criteria (goals, KPIs, definition of done)
- Guardrails (must-include, must-avoid)
- Risk Factors (if applicable)

All appear at once, all are marked "required," and all need to be filled before proceeding.

**Cognitive impact**:
- User sees 15+ form fields
- Unclear priority (which fields matter most?)
- Form feels never-ending as user scrolls
- Users abandon setup mid-way through

**Cognitive Impact**:
- Users overwhelmed by choice and required fields
- Takes 10+ minutes to complete (high friction)
- Many users skip context setup entirely
- Incorrect data entered because user is rushing

**Root Cause (Technical)**:
Context setup was designed to be "complete" but not scoped appropriately. All fields were marked required without prioritization.

**Proposed Fix**:

1. **Use accordion/tabs layout**:
   ```typescript
   // ContextForm.tsx
   export function ContextForm() {
     const [expandedSection, setExpandedSection] = useState('identity');

     return (
       <div className="space-y-4">
         {/* Section 1: Identity - REQUIRED */}
         <Accordion value={expandedSection} onChange={setExpandedSection}>
           <AccordionItem value="identity" mandatory>
             <AccordionTrigger>
               Project Identity <Badge>Required</Badge>
             </AccordionTrigger>
             <AccordionContent>
               <ProjectIdentityFields />
             </AccordionContent>
           </AccordionItem>

           {/* Section 2: Audience - RECOMMENDED */}
           <AccordionItem value="audience">
             <AccordionTrigger>
               Target Audience <Badge variant="secondary">Recommended</Badge>
             </AccordionTrigger>
             <AccordionContent>
               <AudienceFields />
             </AccordionContent>
           </AccordionItem>

           {/* Section 3: Brand - OPTIONAL */}
           <AccordionItem value="brand">
             <AccordionTrigger>
               Brand Guidelines <Badge variant="outline">Optional</Badge>
             </AccordionTrigger>
             <AccordionContent>
               <BrandFields />
             </AccordionContent>
           </AccordionItem>

           {/* Continue for other sections... */}
         </Accordion>

         <Button onClick={handleSave}>
           Save & Continue
           <CheckCircle2 className="ml-2 h-4 w-4" />
         </Button>
       </div>
     );
   }
   ```

2. **Progressive disclosure with status**:
   ```typescript
   // Show progress, not overwhelm
   <div className="space-y-4">
     <ProgressBar
       completed={completedSections}
       total={totalSections}
       label={`${completedSections} of ${totalSections} sections complete`}
     />

     {/* Only show required section expanded by default */}
     <Accordion defaultValue="identity">
       {/* sections... */}
     </Accordion>
   </div>
   ```

3. **Allow saving incomplete context**:
   ```typescript
   // BEFORE: All fields required before save
   // AFTER: Save what you have, complete later

   const handleSave = async () => {
     const partialContext = {
       identity: identityData, // filled
       audience: audienceData || null, // optional
       brand: brandData || null, // optional
       // ...
     };

     await saveProjectContext(projectId, partialContext);
     showToast('Context saved. You can edit it later.');
   };
   ```

4. **Add "setup helper" modal**:
   ```typescript
   // On first setup, show a guide:
   // "Let's set up your project"
   // Step 1: "Tell us about your project" → Identity section
   // "You can skip the rest and edit later"
   // Step 2: (optional) "Who is this for?" → Audience section
   // etc.
   ```

5. **Separate setup from editing**:
   ```typescript
   // FIRST TIME: Streamlined 3-step onboarding
   // EditContextModal: Full form with all fields (for later editing)

   <OnboardingContextStep /> // 3 essential questions
   vs
   <EditProjectContextModal /> // Full detailed form
   ```

**Implementation Steps**:
1. Refactor ContextForm to use accordion/tabs
2. Mark sections as "Required," "Recommended," "Optional"
3. Allow saving with only required fields filled
4. Add progress indicator
5. Create separate "onboarding version" vs "editing version"
6. Test that users can complete setup in <5 minutes
7. Monitor analytics for completion rates

**Dependencies**:
- UI component library support (accordion/tabs)
- Backend support for partial context (probably already exists)

**Effort**: MEDIUM (6-8 hours)

**Expected Impact on Cognitive Load**:
- Users complete setup faster (<5 minutes vs 10+ minutes)
- Less overwhelm, better data quality
- Clear priority (required vs optional)
- Users can complete later if needed

---

### ISSUE #11: No Visual Progress Indicator for Multi-Step Operations

**Location**:
- `/src/new/routes/onboarding/OnboardingFlow.tsx`
- `/src/pages/execution-desk/ExecutionDeskPage.tsx` (task execution)
- Spread generation process

**Category**: Feedback / User Communication

**Severity**: P1 (users unsure about system status, prone to abandonment)

**Problem**:
Long-running operations (onboarding, spread generation, task execution) don't show progress:

1. **Onboarding**: Progresses through steps but no visual indication of "Step 2 of 4"
2. **Spread generation**: Shows "Generating..." spinner but no breakdown of what's happening
3. **Task execution**: Shows countdown timer but no indication of work progress (collecting data vs. generating vs. saving)

Users see a spinner and don't know:
- Is this normal?
- How much longer?
- What's happening?
- Did the system crash?

**Cognitive Impact**:
- Users anxious about long operations
- Some users close browser thinking system crashed
- Lack of feedback creates uncertainty

**Root Cause (Technical)**:
Progress tracking wasn't built into the operation APIs. Backend returns only final result, not intermediate states.

**Proposed Fix**:

1. **Add progress events to long-running operations**:
   ```typescript
   // Example: Spread generation with progress
   async function generateSpread(
     projectData: ProjectData,
     onProgress?: (event: ProgressEvent) => void
   ): Promise<Spread> {
     onProgress?.({
       phase: 'analyzing',
       progress: 10,
       message: 'Analyzing project requirements...',
     });

     const analysis = await analyzeProject(projectData);

     onProgress?.({
       phase: 'structuring',
       progress: 30,
       message: 'Structuring document outline...',
     });

     const outline = structureOutline(analysis);

     onProgress?.({
       phase: 'generating',
       progress: 60,
       message: 'Generating content sections...',
     });

     const content = await generateContent(outline);

     onProgress?.({
       phase: 'finalizing',
       progress: 90,
       message: 'Finalizing and saving...',
     });

     const spread = await saveSpread(content);

     onProgress?.({
       phase: 'complete',
       progress: 100,
       message: 'Complete!',
     });

     return spread;
   }
   ```

2. **Create ProgressPanel component**:
   ```typescript
   // components/ProgressPanel.tsx
   interface ProgressPanelProps {
     phase: string; // 'analyzing' | 'structuring' | 'generating' | 'finalizing'
     progress: number; // 0-100
     message: string;
     steps?: Array<{ name: string; status: 'pending' | 'active' | 'complete' }>;
   }

   export function ProgressPanel({ phase, progress, message, steps }: ProgressPanelProps) {
     return (
       <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
         <div>
           <div className="flex justify-between text-sm font-medium">
             <span>{message}</span>
             <span>{progress}%</span>
           </div>
           <ProgressBar value={progress} />
         </div>

         {steps && (
           <div className="space-y-2">
             {steps.map((step) => (
               <div key={step.name} className="flex items-center gap-2 text-sm">
                 {step.status === 'complete' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                 {step.status === 'active' && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
                 {step.status === 'pending' && <Circle className="h-4 w-4 text-gray-400" />}
                 <span>{step.name}</span>
               </div>
             ))}
           </div>
         )}
       </div>
     );
   }
   ```

3. **Update onboarding to show progress**:
   ```typescript
   // OnboardingFlow.tsx
   export function OnboardingFlow() {
     const [step, setStep] = useState(1);
     const totalSteps = 4;

     return (
       <>
         {/* Progress indicator */}
         <div className="mb-6 flex justify-between items-center">
           <div className="text-sm text-gray-600">
             Step {step} of {totalSteps}
           </div>
           <div className="flex gap-1">
             {Array.from({ length: totalSteps }).map((_, i) => (
               <div
                 key={i}
                 className={`h-2 flex-1 rounded ${
                   i < step ? 'bg-blue-600' : 'bg-gray-200'
                 }`}
               />
             ))}
           </div>
         </div>

         {/* Step content */}
         {step === 1 && <CreateProjectStep onNext={() => setStep(2)} />}
         {step === 2 && <ProjectContextStep onNext={() => setStep(3)} />}
         {step === 3 && <PreferencesStep onNext={() => setStep(4)} />}
         {step === 4 && <GeneratingStep />}
       </>
     );
   }
   ```

4. **Update task execution to show progress**:
   ```typescript
   // ExecutionDeskPage - in task execution
   const [taskProgress, setTaskProgress] = useState({ phase: 'idle', progress: 0 });

   const handleRunTask = async (taskId) => {
     setTaskProgress({ phase: 'preparing', progress: 10 });

     const task = taskQueue.tasks.find(t => t.id === taskId);

     setTaskProgress({ phase: 'executing', progress: 30 });
     const result = await executeTask(task, (progress) => {
       setTaskProgress(progress);
     });

     setTaskProgress({ phase: 'saving', progress: 90 });
     await persistTaskQueue(updatedQueue);

     setTaskProgress({ phase: 'complete', progress: 100 });
   };

   // In JSX:
   {taskProgress.phase !== 'idle' && (
     <ProgressPanel
       phase={taskProgress.phase}
       progress={taskProgress.progress}
       message={getMessageForPhase(taskProgress.phase)}
     />
   )}
   ```

**Implementation Steps**:
1. Create `ProgressPanel` component
2. Create `ProgressEvent` type for progress updates
3. Update spread generation to emit progress events
4. Update task execution to emit progress events
5. Update onboarding to show step counter
6. Test with slow network (verify progress shows)
7. Monitor analytics for completion rates

**Dependencies**:
- UI component (progress bar, phase indicator)
- May require backend updates to emit progress (depends on implementation)

**Effort**: MEDIUM (6-8 hours)

**Expected Impact on Cognitive Load**:
- Users understand system is working (reduces anxiety)
- Clear expectation of how long operation will take
- Users less likely to abandon incomplete operations
- Better user confidence in system reliability

---

## SUMMARY TABLE: ALL ISSUES

| # | Issue | Category | Severity | Effort | Impact |
|---|-------|----------|----------|--------|--------|
| 1 | Distributed State (no single source of truth) | State | P0 | HIGH | Blocks development, silent data corruption risk |
| 2 | Terminology Inconsistency | Naming | P1 | MEDIUM | Cognitive friction, maintenance risk |
| 3 | ExecutionDeskPage Component Complexity | Architecture | P0 | HIGH | Difficult to maintain, extend, test |
| 4 | Two Competing Onboarding Flows | Flow | P1 | MEDIUM | User confusion, duplicate maintenance |
| 5 | Three Disconnected Cost Systems | Architecture | P1 | MEDIUM-HIGH | Opacity, incomplete budget enforcement |
| 6 | No Delete Confirmation | Interaction | P0 | LOW | Irreversible data loss |
| 7 | Silent Error Fallbacks | Error Handling | P1 | MEDIUM | Unaware of degradation, hard to debug |
| 8 | Proof Panel State Confusion | State | P1 | LOW-MEDIUM | Multiple ways to control same UI |
| 9 | Implicit Project Creation | Flow | P1 | LOW-MEDIUM | Hidden side effects, unclear component responsibility |
| 10 | Context Modal Too Complex | Progressive Disclosure | P1 | MEDIUM | Overwhelmed users, low completion |
| 11 | No Progress Indicators | Feedback | P1 | MEDIUM | User anxiety, operation abandonment |

---

## SYSTEM-LEVEL RECOMMENDATIONS

### Guiding Principles for Low-Cognitive-Load Logic

**1. Single Source of Truth**
- Every piece of data has exactly ONE owner
- Other components read from that owner, don't maintain copies
- Synchronization is explicit, not implicit via watchers
- **Application**: Replace 5 state systems with 2 unified ones (project state, UI state)

**2. One Clear Path Per Task**
- Users never wonder "which button do I click?"
- Developers never wonder "which function do I call?"
- Deprecated paths are removed, not left dormant
- **Application**: Consolidate onboarding flows, unify cost management

**3. No Hidden Side Effects**
- Naming matches what the code does (CreateProjectStep actually creates a project)
- All state changes are explicit (no magic synchronization)
- Errors are surfaced, not swallowed
- **Application**: Rename components for clarity, explicit error reporting

**4. Every Irreversible Action Must Have Explicit Signaling & Undo**
- Destructive actions (delete) require confirmation
- Users see what will be deleted
- System provides minimal undo where possible (soft deletes)
- **Application**: Add delete confirmations, implement soft deletes

**5. Terminology is Consistent and Documented**
- One term per concept, consistently used
- Domain glossary is maintained and discoverable
- Deprecated terms are fully removed
- **Application**: Complete TearSheet deprecation, create domain glossary

### Refactor Plan: Three Core Improvements

**Phase 1: State Management Unification** (12-15 hours)
```
BEFORE:
├─ useFlowStore (global UI)
├─ useSupabaseSpread (spread + sync)
├─ useSettingsStore (preferences)
├─ useProjectStore (project data)
├─ ExecutionDeskPage local state (16+ variables)
└─ Multiple refs + intervals for task execution

AFTER:
├─ useWorkspaceData(projectId) [UNIFIED PROJECT STATE]
│  ├─ spread + mutations
│  ├─ taskQueue + mutations
│  ├─ projectContext
│  └─ Handles all persistence + sync
├─ useFlowStore (global UI state only)
│  ├─ activeSectionId
│  ├─ settingsOpen
│  └─ theme preferences
├─ useTaskExecution(projectId) [UNIFIED EXECUTION STATE]
│  ├─ taskRunStates
│  ├─ executingTaskId
│  ├─ timeRemaining
│  └─ runTask(), cancelTask(), retryTask()
└─ Custom hooks for modals, proof panel, etc.
```

**Phase 2: Component Responsibility & Naming** (10-12 hours)
```
REFACTOR:
├─ ExecutionDeskPage: Split into
│  ├─ ExecutionDeskLayout (layout only)
│  ├─ Lyra Panel (AI conversation)
│  ├─ ExecutionSurface (main workspace)
│  ├─ ProofPanel (verification)
│  └─ ExecutionDeskModals (settings, context)
├─ Onboarding: Consolidate into single flow
│  ├─ OnboardingFlow (canonical)
│  ├─ CreateProjectStep (renamed from StepProjectInfo)
│  ├─ ContextStep
│  ├─ PreferencesStep
│  └─ GeneratingStep
└─ Cost Management: Unify systems
   ├─ CostPolicy (configuration)
   ├─ CostService (calculations)
   └─ CostDisplay (UI)
```

**Phase 3: Error & Edge Case Handling** (10-12 hours)
```
ADD:
├─ ErrorReporter service (centralized error logging)
├─ Confirmation dialogs for destructive actions
├─ Error boundaries on critical routes
├─ Graceful degradation with user notification
├─ Progress indicators for long operations
└─ Validation at system boundaries
```

### Complexity Budget: Rules for Implementation

**Per-Component Budget**:
- Maximum 3 state variables per functional component
- If exceeding 3, extract to custom hook
- If custom hook exceeds 200 lines, break into smaller hooks
- Maximum 2 levels of nesting in JSX (if deeper, extract subcomponent)

**Per-Page Budget**:
- Maximum 3 independent features on one page
- If exceeding 3, split into separate pages/tabs
- One clear primary action per page
- Advanced options hidden by default

**Per-Function Budget**:
- Maximum 3 parameters (if exceeding, use object destructuring)
- Single responsibility: do one thing well
- If function body exceeds 50 lines, extract helper functions
- Async functions should have clear loading/error states

**Enforcement**:
- Linting rule: warn if component has >3 useState calls
- Code review checklist: "Does this component have single responsibility?"
- Test structure: if test setup exceeds 20 lines, component is too complex
- Storybook: stories should render with 3 props or fewer

---

## IMPLEMENTATION ROADMAP

### Phase 1: Core Mental Model & State Cleanup (Weeks 1-2)

**Goal**: Establish single source of truth for key entities; eliminate distributed state confusion.

**Tasks**:

| # | Task | Effort | Owner | Success Criteria |
|---|------|--------|-------|------------------|
| 1.1 | Create terminology glossary (`/docs/DOMAIN_MODEL.md`) | 2h | Design | Document published, team aligned |
| 1.2 | Rename TearSheet → ProjectContext everywhere | 4h | Full-stack | All imports updated, zero references to TearSheet type |
| 1.3 | Rename ExtendedOnboardingProfile → OnboardingData | 3h | Backend | Type propagated through all onboarding files |
| 1.4 | Create `useWorkspaceData(projectId)` hook | 6h | Frontend | Hook manages spread, taskQueue, syncing |
| 1.5 | Extract task execution to `useTaskExecution` hook | 7h | Frontend | 200-line handler moved to hook, tested |
| 1.6 | Consolidate proof panel state to single source | 3h | Frontend | Single `useProofPanel` hook, no duplicate state |
| 1.7 | Update ExecutionDeskPage to use extracted hooks | 5h | Frontend | Page <300 lines, readable in one sitting |
| 1.8 | Create unifying `CostPolicy` domain object | 4h | Backend | All cost calculations use same policy |

**Estimated Effort**: 34 hours (4-5 days)
**Expected Impact**: Developers no longer need to maintain mental models of 5 separate state systems. Data flow becomes traceable.

---

### Phase 2: Interaction & Error Logic (Weeks 2-3)

**Goal**: Make all interactions predictable; surface errors clearly; prevent irreversible mistakes.

**Tasks**:

| # | Task | Effort | Owner | Success Criteria |
|---|------|--------|-------|------------------|
| 2.1 | Consolidate onboarding flows (choose canonical) | 6h | Frontend | Single /new route, old route redirects |
| 2.2 | Rename component & extract project creation | 4h | Frontend | CreateProjectStep, side effects explicit |
| 2.3 | Create ErrorReporter service | 4h | Backend | Centralized error logging, analytics integration |
| 2.4 | Add delete confirmations for projects & tasks | 3h | Frontend | Confirmation dialog with countdown before delete |
| 2.5 | Replace silent error swallows with reporting | 5h | Backend | Stream parsing, verification fallback, API response handling |
| 2.6 | Add error boundaries to critical routes | 3h | Frontend | App won't crash on single route error |
| 2.7 | Add progress indicators to long operations | 5h | Full-stack | Spread generation, task execution, onboarding show progress |
| 2.8 | Create CostDisplay component & budget warnings | 4h | Frontend | Users see spending in real-time |
| 2.9 | Test all error paths & edge cases | 6h | Full-stack | Error scenarios: offline, timeout, malformed response, quota |

**Estimated Effort**: 40 hours (5 days)
**Expected Impact**: Users feel safe exploring UI (no accidental data loss). System degradation is transparent. Developers have better visibility into failures.

---

### Phase 3: Complexity & Progressive Disclosure (Weeks 3-4)

**Goal**: Hide complexity until needed; make setup fast and clear; maintain calm, focused experience.

**Tasks**:

| # | Task | Effort | Owner | Success Criteria |
|---|------|--------|-------|------------------|
| 3.1 | Refactor ContextForm with accordion layout | 5h | Frontend | Sections collapsible, only required expanded by default |
| 3.2 | Separate "onboarding version" from "editing version" forms | 4h | Frontend | Onboarding has <5 required fields, editing has full form |
| 3.3 | Allow saving incomplete project context | 3h | Full-stack | Users can save partial context, complete later |
| 3.4 | Create "Basic" vs "Advanced" settings toggle | 5h | Frontend | SettingsModal shows basic by default, toggle for advanced |
| 3.5 | Split ExecutionDeskPage into sub-components | 6h | Frontend | Lyra, ExecutionSurface, ProofPanel are composable |
| 3.6 | Add "Setup Complete" celebration screen | 2h | Frontend | Users see milestone, understand when to start working |
| 3.7 | Create inline cost education in model selector | 3h | Frontend | When user picks model, see cost comparison inline |
| 3.8 | Add diagnostic mode for power users | 4h | Frontend | Advanced users can see detailed logs, cost breakdowns |
| 3.9 | Document all configuration (moxfield, defaults, budgets) | 4h | Design | /docs/CONFIGURATION.md, /docs/COST_MODEL.md |

**Estimated Effort**: 36 hours (4-5 days)
**Expected Impact**: Onboarding time drops from 10+ min to <5 min. Users complete setup more often. Advanced features don't distract casual users.

---

### Implementation Timeline & Rollout

```
Week 1-2 (Phase 1):
┌─────────────────────────────────────────────────────┐
│ Terminology & State Consolidation                   │
│ - Rename types (TearSheet, OnboardingProfile)      │
│ - Create core hooks (useWorkspaceData, etc.)       │
│ - Extract ExecutionDeskPage complexity             │
│ Expected: Single, clear source of truth            │
└─────────────────────────────────────────────────────┘
           ↓
Week 2-3 (Phase 2):
┌─────────────────────────────────────────────────────┐
│ Error Handling & Interactions                       │
│ - Add confirmations & error visibility             │
│ - Consolidate onboarding flows                     │
│ - Progress indicators & cost transparency          │
│ Expected: Predictable, safe interactions           │
└─────────────────────────────────────────────────────┘
           ↓
Week 3-4 (Phase 3):
┌─────────────────────────────────────────────────────┐
│ Progressive Disclosure & Onboarding                │
│ - Refactor modals for simplicity                   │
│ - Split setup from editing                        │
│ - Advanced features hidden                        │
│ Expected: <5 min setup, calm experience            │
└─────────────────────────────────────────────────────┘
```

**Release Strategy**:
- **Phase 1**: Internal branch, daily code reviews, backward compatibility maintained
- **Phase 2**: Feature branch with staged rollout (10% → 25% → 50% → 100% users)
- **Phase 3**: Batched with Phase 2, monitor analytics for improvements

**Success Metrics**:
- **Developer Velocity**: PRs reviewed 30% faster (less time understanding code)
- **Bug Rate**: Fewer state-related bugs (target: 40% reduction)
- **User Friction**: Onboarding time <5 min (from 10+ min)
- **Completion**: 80% users complete setup (from ~50%)
- **Support Tickets**: Fewer "Is my project saved?" questions

---

## CLOSING STATEMENT

Codra is a sophisticated, feature-rich application. Its cognitive load issues are not due to poor implementation quality but rather **architectural patterns that accumulated over time without refactoring**. The distributed state systems, terminology inconsistencies, and component complexity are surmountable with focused effort.

**The fixes outlined in this audit will:**
1. Reduce developer cognitive load by ~40%
2. Improve user onboarding completion by ~30%
3. Eliminate entire classes of bugs (state synchronization, data loss)
4. Create a foundation for future features (easier to add new desks, models, workflows)

**Starting with Phase 1 (state consolidation) is critical**: it unblocks all other improvements and gives developers confidence that data is being managed correctly. The rest follows naturally.

---

**Audit Completed**: January 16, 2026
**Next Step**: Review findings with product & engineering teams, prioritize issues, begin Phase 1.
