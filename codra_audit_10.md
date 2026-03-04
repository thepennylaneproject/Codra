CODRA: Comprehensive Cognitive Load Audit

Executive Summary

CODRA is an AI workflow orchestration platform built on a thoughtful mental model: users define project context, the system decomposes work into tasks, and teams execute collaboratively. However, the underlying logic, state management, and flow control patterns create several classes of friction that add cognitive load—particularly around state synchronization, task dependency management, and error recovery.

The codebase demonstrates strong architectural foundations (domain-driven design, smart routing, modular stores), but suffers from scattered state ownership, implicit state upgrades, fragmented error handling, and unclear mental models in critical flows. These issues don't break functionality, but they increase the mental burden on users and maintainers.

Below is a detailed audit organized by issue category, followed by system-level recommendations and a phased roadmap.

---

CRITICAL COGNITIVE LOAD ISSUES

ISSUE 1: Task Status Upgrade Logic is Silent and Non-Idempotent

Location: src/domain/task-queue.ts:258-266 (isTaskReady + getTasksByStatus)
Category: State logic
Severity: P1 (High friction in core workflow)
User Surface: Task Queue panel; tasks appear "ready" but triggering event is unclear to users.

Problem:
The getTasksByStatus() function contains implicit state upgrade logic: it silently promotes tasks from pending → ready based on dependency checks, without updating the underlying task object. This means:

- The task's status field remains 'pending', but it's grouped under 'ready'.
- When the task queue is reloaded, this transient upgrade disappears.
- Users may think a task is "ready to run," but the state isn't persisted.
- If a dependent task is marked complete then immediately in-progress (e.g., due to retry), the dependee's ready state can flip without explicit notification.

Cognitive Impact:
Users must mentally track which tasks are "logically ready" vs. "officially ready." This breaks predictability. When a task unexpectedly vanishes from the ready queue (e.g., after a page reload), it feels like the system broke, not that transient state was lost. Maintainers must understand both status and getTasksByStatus() logic to reason about task state.

Root Cause (Technical):

- Task readiness is computed on-the-fly rather than being a durable state update.
- There's no single source of truth: the task's status field vs. the computed readiness result diverge.
- No event or hook fires when a task transitions to ready, so dependent UI is stale.

Proposed Fix:

1. Explicit state upgrade function: Add a upgradeTasksToReady() function that:


    - Scans all pending tasks
    - For each with all dependencies met, explicitly sets status: 'ready'
    - Returns a list of newly-promoted tasks
    - Called whenever a task completes or is restored

2. Update task persistence layer:
   // src/domain/spread/task-queue-engine.ts
   export function upgradeTasksToReady(queue: TaskQueue): { queue: TaskQueue; upgraded: SpreadTask[] } {
   const upgraded: SpreadTask[] = [];
   const tasks = queue.tasks.map(task => {
   if (task.status !== 'pending' || !isTaskReady(task, queue.tasks)) {
   return task;
   }
   upgraded.push({ ...task, status: 'ready' });
   return { ...task, status: 'ready', updatedAt: new Date().toISOString() };
   });
   return { queue: { ...queue, tasks }, upgraded };
   }
3. Call upgrade after state changes:


    - After updateTaskStatus(..., 'complete'): call upgradeTasksToReady()
    - After restoring a failed task: call upgradeTasksToReady()
    - After queue reload from storage: call upgradeTasksToReady() before rendering

4. Remove implicit upgrade from getTasksByStatus():


    - Simplify to a pure read-only grouping function.
    - Rely on persisted status field only.

Dependencies:

- Requires updates to updateTaskStatus() call sites to also call upgradeTasksToReady().
- May need to debounce rapid task completions to avoid thrashing upgrades.

---

ISSUE 2: Multi-Layered State Synchronization Creates Race Conditions

Location: src/new/routes/ExecutionDeskPage.tsx:86-150 (state initialization), src/hooks/useSupabaseSpread.ts (inferred from usage), useFlowStore.ts
Category: State management
Severity: P0 (Can block primary workflow)
User Surface: Spread content and task queue inconsistently reflect what's saved; conflicts detected unexpectedly.

Problem:
CODRA maintains state across four independent layers:

1. React component state (spread, project, taskQueue, etc.)
2. Zustand store (useFlowStore: layout, routing, session cost)
3. localStorage (persisted copies of spread, task queue, context revisions)
4. Supabase (backend source of truth)

All four are loaded and updated independently with no coordination:

- ExecutionDeskPage loads from Supabase (dbSpread, dbTaskQueue)
- Simultaneously, it may load from localStorage backup
- Spread updates are written via persistSpread() (to both local state and Supabase)
- Real-time Supabase subscriptions notify of updates from other users
- The conflict resolution logic (useSupabaseSpread with version tracking) is unclear to the flow

Example Failure Scenario:

1. User edits a section offline; it's saved to localStorage.
2. User opens spread on another device; Supabase version is newer.
3. Page loads: component state gets local version, Supabase hook gets remote.
4. A conflict is detected, but it's unclear which version is active or how to resolve it.
5. User refreshes; now they see the Supabase version, losing their offline changes.

Cognitive Impact:
Users cannot easily answer: "Is my work saved? On which device? What's the ground truth?" Maintainers face a matrix of potential inconsistencies and must mentally coordinate across four independent persistence layers.

Root Cause (Technical):

- No orchestration layer: each piece of state independently manages its own persistence.
- Version tracking exists in useSupabaseSpread, but conflict resolution UI is not prominently exposed.
- localStorage is treated as both a cache and a fallback, creating ambiguity.
- Spread generation, task queue generation, and persistence all happen in separate useEffects with loose ordering.

Proposed Fix:

1. Introduce a "ProjectStateManager" layer that owns all four persistence levels and enforces a clear priority:

// src/lib/project-state/ProjectStateManager.ts

interface ProjectStateSnapshot {
spread: Spread;
taskQueue: TaskQueue;
context: ProjectContext;
lastSyncedAt: string;
source: 'local' | 'remote';
localVersion: number;
remoteVersion: number;
}

export class ProjectStateManager {
private projectId: string;
private local: ProjectStateSnapshot | null = null;
private remote: ProjectStateSnapshot | null = null;
private syncInProgress = false;
private onConflict: (local: ProjectStateSnapshot, remote: ProjectStateSnapshot) => Promise<'local' | 'remote'> = () => Promise.resolve('remote');

      constructor(projectId: string) {
          this.projectId = projectId;
      }

      async load(): Promise<{ state: ProjectStateSnapshot; conflict?: { local: ProjectStateSnapshot; remote: ProjectStateSnapshot } }> {
          // 1. Load from local storage first
          this.local = this.loadFromLocalStorage();

          // 2. Load from Supabase
          this.remote = await this.loadFromSupabase();

          // 3. Compare versions and detect conflict
          if (this.local && this.remote && this.local.localVersion !== this.remote.remoteVersion) {
              return {
                  state: this.remote, // Default to remote, but notify
                  conflict: { local: this.local, remote: this.remote },
              };
          }

          // 4. Return the most recent
          return { state: this.remote || this.local || this.createEmpty() };
      }

      async save(snapshot: ProjectStateSnapshot): Promise<void> {
          if (this.syncInProgress) {
              throw new Error('Sync already in progress');
          }

          this.syncInProgress = true;
          try {
              // 1. Save to local immediately
              this.saveToLocalStorage(snapshot);

              // 2. Attempt to sync to Supabase
              const result = await this.syncToSupabase(snapshot);
              this.remote = result;
          } finally {
              this.syncInProgress = false;
          }
      }

      async resolveConflict(choice: 'local' | 'remote'): Promise<ProjectStateSnapshot> {
          const chosen = choice === 'local' ? this.local : this.remote;
          if (!chosen) throw new Error('Cannot resolve: missing snapshot');

          // Persist the chosen version as the new ground truth
          await this.save(chosen);
          this.local = chosen;
          this.remote = chosen;

          return chosen;
      }

      private loadFromLocalStorage(): ProjectStateSnapshot | null {
          try {
              const stored = localStorage.getItem(`codra:project:${this.projectId}`);
              return stored ? JSON.parse(stored) : null;
          } catch {
              return null;
          }
      }

      private saveToLocalStorage(snapshot: ProjectStateSnapshot): void {
          localStorage.setItem(`codra:project:${this.projectId}`, JSON.stringify(snapshot));
      }

      private async loadFromSupabase(): Promise<ProjectStateSnapshot | null> {
          // Use Supabase REST API to fetch the latest project state
          // Returns null if no remote state exists
      }

      private async syncToSupabase(snapshot: ProjectStateSnapshot): Promise<ProjectStateSnapshot> {
          // Update Supabase with new snapshot, handle version conflicts
      }

      private createEmpty(): ProjectStateSnapshot {
          // Return a minimal empty state
      }

} 2. Simplify ExecutionDeskPage: - Use a single "useProjectState" hook that wraps ProjectStateManager. - All component state updates flow through ProjectStateManager. - Conflict UI surfaces a explicit choice, not a silent resolution. 3. Make version/conflict tracking explicit: - Show a persistent badge if offline changes exist locally but differ from remote. - Require explicit user choice to resolve conflicts (not auto-resolution).

Dependencies:

- Requires refactoring useSupabaseSpread and related persistence hooks.
- May need to adjust Supabase schema to track version metadata.

---

ISSUE 3: Spread Section Builders Have Implicit Ordering Dependencies

Location: src/domain/spread/engine.ts:106-191, src/domain/spread/section-builders.ts
Category: Flow logic
Severity: P1 (Fragile, hard to reason about)
User Surface: Section ordering; sometimes context info appears in wrong section; TOC navigation is confusing.

Problem:
Section builders (buildOverviewSection(), buildAudienceSection(), etc.) are called in a specific sequence with no explicit dependency documentation:

// src/domain/spread/engine.ts:114-154
sections.push(buildOverviewSection(project, extendedProfile, contextOverride));
sections.push(buildAudienceSection(...));
sections.push(buildGoalsSection(...));
// ... more sections

However, section builders reference data from other sections:

- buildAudienceSection() looks for visualAudience from the profile.
- buildGoalsSection() depends on context and project goals.
- buildLayoutDirectionSection() infers layout based on creative goals.
- buildComponentsSection() includes imagery types.

If a builder is reordered or a new builder is inserted, downstream builders may fail silently or produce incorrect output. There's also "inferred desk" logic (lines 160-170) that runs after section generation but modifies activeDesks used in TOC generation—order matters but is fragile.

Cognitive Impact:
Developers adding a new section must understand the implicit dependency graph. Users see section content that looks out of order or missing, but it's unclear why. When debugging, the mental model of "sections are independent" is wrong.

Root Cause (Technical):

- Section builders are pure functions but have implicit shared dependencies on profile/project data.
- No explicit dependency graph or topological sort.
- Inferred desks logic runs after sections are generated, creating a phase that modifies TOC retroactively.

Proposed Fix:

1. Define an explicit dependency graph:

// src/domain/spread/engine.ts

interface SectionTemplate {
type: SpreadSectionType;
builder: (data: SpreadBuilderContext) => SpreadSection | null;
dependencies: SpreadSectionType[]; // Sections this depends on
}

const SECTION_TEMPLATES: SectionTemplate[] = [
{
type: 'overview',
builder: buildOverviewSection,
dependencies: [],
},
{
type: 'audience',
builder: buildAudienceSection,
dependencies: ['overview'],
},
{
type: 'goals',
builder: buildGoalsSection,
dependencies: ['overview', 'audience'],
},
{
type: 'visual_direction',
builder: buildVisualDirectionSection,
dependencies: [],
},
{
type: 'layout_direction',
builder: buildLayoutDirectionSection,
dependencies: ['goals', 'visual_direction'],
},
// ... etc
]; 2. Topologically sort sections:

export function generateSpreadFromProfile(...): Spread {
// ... validate and collect active desks first

      const context: SpreadBuilderContext = { project, extendedProfile, contextOverride, activeDesks };

      // Build sections in dependency order
      const sections = buildSectionsInOrder(context);
      const toc = generateTableOfContents(sections, activeDesks);
      const lyraState = buildInitialLyraState(project, extendedProfile);

      return {
          id: crypto.randomUUID(),
          projectId: project.id,
          sections,
          toc,
          lyraState,
          version: 1,
          lastModifiedBy: '',
          lastModifiedAt: now,
          createdAt: now,
          updatedAt: now,
      };

}

function buildSectionsInOrder(context: SpreadBuilderContext): SpreadSection[] {
const built = new Map<SpreadSectionType, SpreadSection>();
const visited = new Set<SpreadSectionType>();
const results: SpreadSection[] = [];

      function visit(type: SpreadSectionType) {
          if (visited.has(type)) return;
          visited.add(type);

          const template = SECTION_TEMPLATES.find(t => t.type === type);
          if (!template) return;

          // Ensure dependencies are built first
          for (const dep of template.dependencies) {
              visit(dep);
          }

          // Build this section
          const section = template.builder(context);
          if (section) {
              built.set(type, section);
              results.push(section);
          }
      }

      // Visit all templates in definition order (implicit ordering for readability)
      for (const template of SECTION_TEMPLATES) {
          visit(template.type);
      }

      return results;

} 3. Deduplicate desk inference: - Run desk inference before section generation. - Pass inferred desks to all builders, not as a post-hoc modification.

Dependencies:

- Refactor buildSectionsInOrder() and all builder signatures.
- Update TOC generation to use finalized desks.

---

ISSUE 4: Flow Store Conflates Multiple Concerns in One Store

Location: src/lib/store/useFlowStore.ts
Category: State architecture
Severity: P2 (Creates confusion, hard to reason about)
User Surface: Routing changes affect history; session cost isn't scoped correctly; task settings are mixed with layout.

Problem:
useFlowStore manages seven conceptually separate concerns:

1. UI layout (left dock, right dock visibility)
2. Active context (active desk, active section)
3. Routing preferences (quality level, allowed providers, cost limits)
4. Session cost tracking (cumulative cost across tasks)
5. Task-scoped settings (per-task AI/budget preferences)
6. Interaction history (for analytics/replay)
7. Studio mode flag

This creates several problems:

- When a user changes routing quality, it's logged to history, but was that an intentional action or a side effect?
- Session cost accumulates globally, but the user might want per-task cost tracking.
- Task-scoped settings overwrite global routing preferences, but the precedence is unclear.
- The store is persisted to localStorage as a single blob, so clearing session cost requires reloading.

Cognitive Impact:
Developers must understand how all seven concerns interact. A change to routing affects history, which affects cost tracking, which affects task settings. There's no clear mental model of "what is responsible for what." When debugging a cost issue, searching for addToSessionCost leads to the store, but understanding why it was called requires tracing through task execution logic.

Root Cause (Technical):

- The store was designed as a catch-all for "user session state," grouping concerns by persistence layer rather than semantic meaning.
- No clear boundaries between UI state, runtime config, and analytics telemetry.

Proposed Fix:

1. Split into three focused stores:

// src/lib/store/useLayoutStore.ts
// Responsible only for UI layout state
export const useLayoutStore = create<LayoutState>()(
persist(
immer((set) => ({
leftDockVisible: true,
leftDockWidth: 320,
rightDockVisible: false,
rightDockWidth: 400,
showActivityStrip: true,
setLeftDockVisible: (visible) => set(state => { state.leftDockVisible = visible; }),
// ...
})),
{ name: 'codra-layout' }
)
);

// src/lib/store/useRoutingStore.ts
// Responsible for AI model routing and task execution preferences
export const useRoutingStore = create<RoutingState>()(
persist(
immer((set) => ({
globalQuality: 'balanced' as SmartRouterQuality,
globalMaxCostPerTask: null,
globalAllowedProviders: [],
taskOverrides: {} as Record<string, Partial<RoutingPreferences>>,

              setGlobalQuality: (quality) => set(state => { state.globalQuality = quality; }),
              setTaskOverride: (taskId, overrides) => set(state => {
                  state.taskOverrides[taskId] = overrides;
              }),

              // Computed: effective routing for a task
              getEffectiveRouting: (taskId) => (state) => ({
                  quality: state.taskOverrides[taskId]?.quality ?? state.globalQuality,
                  maxCost: state.taskOverrides[taskId]?.maxCostPerTask ?? state.globalMaxCostPerTask,
                  allowedProviders: state.taskOverrides[taskId]?.allowedProviders ?? state.globalAllowedProviders,
              }),
          })),
          { name: 'codra-routing' }
      )

);

// src/lib/store/useExecutionContextStore.ts
// Responsible for the active "desk" and "section" the user is working on
export const useExecutionContextStore = create<ExecutionContextState>()(
persist(
immer((set) => ({
activeDeskId: null as ProductionDeskId | null,
activeSectionId: null as string | null,
studioEnabled: false,

              setActiveDesk: (deskId) => set(state => { state.activeDeskId = deskId; }),
              setActiveSection: (sectionId) => set(state => { state.activeSectionId = sectionId; }),
          })),
          { name: 'codra-execution-context' }
      )

);

// src/lib/store/useSessionStore.ts
// Responsible for session-scoped telemetry and cost tracking
export const useSessionStore = create<SessionState>()(
immer((set) => ({
sessionId: crypto.randomUUID(),
startedAt: new Date().toISOString(),
totalCost: 0,
events: [] as InteractionEvent[],

          recordEvent: (event) => set(state => {
              state.events.push({
                  ...event,
                  id: crypto.randomUUID(),
                  timestamp: new Date().toISOString(),
              });
              if (state.events.length > 100) state.events.shift();
          }),

          addCost: (amount) => set(state => { state.totalCost += amount; }),

          // NOT persisted; cleared on page reload
      }))

); 2. Update ExecutionDeskPage to use the split stores: - Import useLayoutStore, useRoutingStore, useExecutionContextStore. - Session tracking goes through useSessionStore for analytics. 3. Create a "composite hook" for convenience:
export function useFlowState() {
const layout = useLayoutStore();
const routing = useRoutingStore();
const context = useExecutionContextStore();
const session = useSessionStore();
return { layout, routing, context, session };
}

Dependencies:

- Requires updating all components that use useFlowStore to import the appropriate split stores.
- May need to migrate existing localStorage data from codra-flow-store to the new stores.

---

ISSUE 5: Cost Tracking is Optimistic but Lacks Rollback Logic

Location: src/new/routes/ExecutionDeskPage.tsx:81, 336-345 (addToSessionCost), src/lib/ai/execution/task-executor.ts (inferred)
Category: State logic
Severity: P1 (Can mislead users about budget)
User Surface: Session cost display; budget alerts; cost per task.

Problem:
In ExecutionDeskPage, session cost is incremented optimistically when a task starts (via addToSessionCost), but:

- If the task fails, cost isn't decremented.
- If a task is retried, the initial cost isn't rolled back, so retries add additional cost to the display.
- There's no explicit record of which tasks contributed what cost.
- Session cost is a running total with no per-task breakdown for audit.

Example:

1. User starts Task A, estimated cost $0.05 → session cost becomes $0.05.
2. Task A fails due to API error.
3. User retries Task A, estimated cost $0.05 → session cost becomes $0.10.
4. Task A succeeds on second attempt, but the display shows $0.10, not $0.05.

Cognitive Impact:
Users can't trust the cost display. They must wonder: "Did it actually cost that much, or is it a bug?" Budget alerts may fire incorrectly, leaving users confused. If they have a $0.50 daily budget, seeing $0.45 spent on a single task feels alarming, even if only one attempt succeeded.

Root Cause (Technical):

- Cost is tracked in session state with no transaction log.
- No rollback mechanism for failed tasks.
- Estimated cost is added before execution; actual cost may differ.
- Task-level cost metadata isn't aggregated for reporting.

Proposed Fix:

1. Introduce a "Cost Ledger" that tracks actual costs:

// src/lib/execution/cost-ledger.ts

interface CostEntry {
id: string;
taskId: string;
timestamp: string;
type: 'estimated' | 'actual' | 'refunded';
amount: number;
reason: string; // e.g., "task_started", "task_completed", "task_failed_retry"
}

export class CostLedger {
private entries: CostEntry[] = [];
private onUpdate: (ledger: CostLedger) => void;

      constructor(onUpdate?: (ledger: CostLedger) => void) {
          this.onUpdate = onUpdate || (() => {});
      }

      recordEstimatedCost(taskId: string, amount: number): void {
          this.entries.push({
              id: crypto.randomUUID(),
              taskId,
              timestamp: new Date().toISOString(),
              type: 'estimated',
              amount,
              reason: 'task_started',
          });
          this.onUpdate(this);
      }

      recordActualCost(taskId: string, amount: number): void {
          this.entries.push({
              id: crypto.randomUUID(),
              taskId,
              timestamp: new Date().toISOString(),
              type: 'actual',
              amount,
              reason: 'task_completed',
          });
          this.onUpdate(this);
      }

      recordRefund(taskId: string, amount: number, reason: string): void {
          this.entries.push({
              id: crypto.randomUUID(),
              taskId,
              timestamp: new Date().toISOString(),
              type: 'refunded',
              amount: -amount,
              reason,
          });
          this.onUpdate(this);
      }

      getTotalCost(): number {
          return this.entries.reduce((sum, e) => sum + e.amount, 0);
      }

      getCostForTask(taskId: string): { estimated: number; actual: number; refunded: number } {
          const taskEntries = this.entries.filter(e => e.taskId === taskId);
          return {
              estimated: taskEntries.filter(e => e.type === 'estimated').reduce((sum, e) => sum + e.amount, 0),
              actual: taskEntries.filter(e => e.type === 'actual').reduce((sum, e) => sum + e.amount, 0),
              refunded: taskEntries.filter(e => e.type === 'refunded').reduce((sum, e) => sum + Math.abs(e.amount), 0),
          };
      }

      getEntries(): CostEntry[] {
          return [...this.entries];
      }

      serialize(): string {
          return JSON.stringify(this.entries);
      }

      static deserialize(json: string): CostLedger {
          const ledger = new CostLedger();
          ledger.entries = JSON.parse(json);
          return ledger;
      }

} 2. Update task execution to use the ledger:

// In handleRunTask callback
const handleRunTask = async (taskId: string, mode: ExecutionMode) => {
// ... existing setup ...

      const task = taskQueue.tasks.find(t => t.id === taskId);
      if (!task) return;

      // Record estimated cost (don't add to session cost yet)
      costLedger.recordEstimatedCost(taskId, task.estimatedCost || 0);

      try {
          const result = await taskExecutor.executeTask(task);

          // Record actual cost
          costLedger.recordActualCost(taskId, result.actualCost || task.estimatedCost || 0);

          // Now update session cost with actual cost
          addToSessionCost(result.actualCost || task.estimatedCost || 0);
      } catch (error) {
          // If task failed, refund the estimated cost
          costLedger.recordRefund(taskId, task.estimatedCost || 0, `task_failed: ${error.message}`);

          // Optionally retry: don't refund, just record a new estimate for the retry
      } finally {
          // ...
      }

}; 3. Expose cost breakdown in UI: - Show a "Cost Ledger" panel in the ProofPanel or sidebar. - Per-task: estimated vs. actual vs. refunded. - Grand total reflects only "kept" costs, not estimates.

Dependencies:

- Requires integrating CostLedger into task execution workflow.
- May need to adjust TaskExecutor to return actual cost.

---

ISSUE 6: Error States Are Underspecified; Fallbacks Hide Problems

Location: src/new/routes/ExecutionDeskPage.tsx:211-250 (spread generation with fallback), src/domain/spread/engine.ts:203-239 (Lyra confidence calc), src/lib/coherence-scan/coherence-scan-service.ts (error handling)
Category: Error handling
Severity: P1 (Users can't recover from failures)
User Surface: Spread shows blank sections; Lyra state is generic; "something went wrong" messages.

Problem:
When spread generation fails, ExecutionDeskPage catches the error and creates a fallback empty spread:

// src/new/routes/ExecutionDeskPage.tsx:235-250
catch (error) {
const errorMessage = error instanceof Error ? error.message : 'Unknown error';
console.error('Spread generation failed:', error);
setSpreadError(errorMessage);

      setSpread(createFallbackSpread(project));

}

The fallback spread has zero sections, so the user sees a blank workspace. The error is logged to console and to analytics, but:

- The error message shown to the user is generic ("Unknown error").
- It's unclear why the spread failed (missing data? validation error? timeout?).
- There's no guidance on recovery (retry? edit context? contact support?).
- The "Retry" button exists but may encounter the same error silently.

Similarly, Lyra state initialization calculates a confidence score (0-1) but doesn't expose why confidence is low (e.g., "missing audience" vs. "insufficient context").

Cognitive Impact:
Users encounter a blank screen and are left to guess what happened. They may retry repeatedly without understanding the root cause. Maintainers receive opaque error messages like "Error: Invalid section data" without context about which section or why validation failed.

Root Cause (Technical):

- Errors are caught generically and mapped to human-friendly messages only at the UI layer.
- No structured error types; all errors are stringified.
- Fallback behavior is silent; no persistent indication that something failed.
- Error context (data that was being processed) is lost.

Proposed Fix:

1. Define structured error types:

// src/domain/spread/errors.ts

export type SpreadErrorCode =
| 'missing_required_field'
| 'invalid_section_type'
| 'generation_timeout'
| 'profile_data_corrupted'
| 'circular_dependency'
| 'section_builder_failed';

export class SpreadGenerationError extends Error {
constructor(
public code: SpreadErrorCode,
public details: Record<string, unknown> = {},
public recoveryHint?: string
) {
super(formatErrorMessage(code, details));
}
}

function formatErrorMessage(code: SpreadErrorCode, details: Record<string, unknown>): string {
switch (code) {
case 'missing_required_field':
return `Required field "${details.field}" is missing. Please check your onboarding data.`;
case 'invalid_section_type':
return `Invalid section type: ${details.sectionType}. This is a bug; please report it.`;
case 'generation_timeout':
return 'Spread generation took too long. Try again or contact support if it persists.';
case 'profile_data_corrupted':
return 'Onboarding data is corrupted. Clear your browser cache or restart.';
case 'circular_dependency':
return `Sections have a circular dependency: ${details.chain}. This is a bug.`;
case 'section_builder_failed':
return `Failed to build section "${details.sectionType}": ${details.reason}`;
default:
return 'Unknown error during spread generation.';
}
} 2. Update section builders to throw typed errors:

// src/domain/spread/section-builders.ts

export function buildGoalsSection(
project: Project,
extendedProfile: ExtendedOnboardingProfile | null,
context?: ProjectContext
): SpreadSection {
try {
// ... existing logic ...
} catch (error) {
throw new SpreadGenerationError(
'section_builder_failed',
{
sectionType: 'goals',
reason: error instanceof Error ? error.message : 'Unknown error',
},
'Try editing the project goals in the context panel.'
);
}
} 3. Replace fallback with error recovery UI:

// src/new/routes/ExecutionDeskPage.tsx

if (spreadError && !isRetryingSpread) {
return (
<ErrorBoundary>
<SpreadGenerationErrorPanel
error={spreadError}
onRetry={handleRetrySpreadGeneration}
onEditContext={() => setIsContextModalOpen(true)}
project={project}
/>
</ErrorBoundary>
);
}

// src/new/components/SpreadGenerationErrorPanel.tsx
export function SpreadGenerationErrorPanel({
error,
onRetry,
onEditContext,
project,
}: Props) {
const structuredError = error instanceof SpreadGenerationError ? error : parseErrorMessage(error);

      return (
          <div className="spread-generation-error">
              <h2>Spread Generation Failed</h2>
              <p className="error-message">{structuredError.message}</p>
              {structuredError.recoveryHint && (
                  <p className="recovery-hint">💡 {structuredError.recoveryHint}</p>
              )}
              <div className="actions">
                  <button onClick={onRetry}>Retry</button>
                  <button onClick={onEditContext}>Edit Context</button>
                  <button onClick={() => downloadErrorReport(error, project)}>Report Error</button>
              </div>
          </div>
      );

} 4. Enhance Lyra confidence calculation:

// src/domain/spread/engine.ts

function buildInitialLyraState(
project: Project,
extendedProfile: ExtendedOnboardingProfile | null
): LyraState {
const gaps: string[] = [];
let confidence = 0.5;

      if (!project.description || project.description.length < 20) {
          gaps.push('project description is too brief');
          confidence -= 0.1;
      } else {
          confidence += 0.1;
      }

      if (!project.audience) {
          gaps.push('primary audience is not defined');
          confidence -= 0.1;
      } else {
          confidence += 0.1;
      }

      if (!project.goals || project.goals.length === 0) {
          gaps.push('project goals are missing');
          confidence -= 0.1;
      } else {
          confidence += 0.1;
      }

      // ... more checks ...

      return {
          visible: true,
          appearance: DEFAULT_LYRA_APPEARANCE,
          suggestedArtifacts: [/* ... */],
          confidence: Math.min(confidence, 1.0),
          confidenceGaps: gaps, // Expose what's missing
          pendingQuestions: generatePendingQuestions(gaps),
      };

}

Dependencies:

- Requires defining SpreadGenerationError and updating all section builders.
- May need to update UI to display structured errors.

---

ISSUE 7: Task Dependencies Are Linear Per-Desk, but Implicit Cross-Desk Ordering

Location: src/domain/spread/task-queue-engine.ts:336-350
Category: Flow logic
Severity: P2 (Can lead to poor task ordering)
User Surface: Users run design tasks before code architecture is planned; tasks seem out of order.

Problem:
The task queue establishes dependencies within each desk (line 345-350):

// Link dependencies within each desk
for (const deskTaskList of Object.values(deskTasks)) {
for (let i = 1; i < deskTaskList.length; i++) {
deskTaskList[i].dependencies = [deskTaskList[i - 1].id];
}
}

This means:

- Write Desk 1 → Write Desk 2 (ordered)
- Design Desk 1 → Design Desk 2 (ordered)
- Code Desk 1 → Code Desk 2 (ordered)

But there are no dependencies across desks. So even if the logical sequence is:

1. Architecture (Code Desk)
2. Hero Visual (Design Desk)
3. Copy (Write Desk)

The system allows all desks to run in parallel, and users must manually enforce the logical order.

Cognitive Impact:
Users don't have a "natural" sequence suggested by the system. They might start writing copy before understanding the architecture, leading to inconsistent or misaligned outputs. The task queue doesn't reflect the product's real task dependencies.

Root Cause (Technical):

- Task dependencies are hardcoded to be per-desk only.
- There's no model of cross-desk dependencies or critical path.
- Task generation doesn't analyze the project to infer which desk should go first.

Proposed Fix:

1. Extend task dependency model to support cross-desk ordering:

// src/domain/spread/task-queue-engine.ts

// After all desk tasks are collected, establish cross-desk dependencies
// based on task priority and desk specialization

function establishCrossDeskDependencies(
deskTasks: Record<string, SpreadTask[]>,
project: Project
): void {
// Priority desks (establish natural order)
const DESK_ORDER: ProductionDeskId[] = ['code', 'design', 'analyze', 'write'];

      let previousDeskLastTask: SpreadTask | null = null;

      for (const deskId of DESK_ORDER) {
          const tasks = deskTasks[deskId];
          if (!tasks || tasks.length === 0) continue;

          // First task in this desk depends on last task in previous desk
          if (previousDeskLastTask && tasks[0].priority !== 'critical') {
              if (!tasks[0].dependencies.includes(previousDeskLastTask.id)) {
                  tasks[0].dependencies.push(previousDeskLastTask.id);
              }
          }

          previousDeskLastTask = tasks[tasks.length - 1];
      }

} 2. Make desk ordering configurable:

// src/domain/types.ts

interface ProjectMetadata {
// ... existing fields ...
deskExecutionOrder?: ProductionDeskId[]; // User can override
} 3. Surface the suggested order to users: - Show a visual "critical path" in the task queue panel. - Highlight tasks that are ready but are predecessors to other tasks. - Suggest parallel work where possible (e.g., if Design and Write are independent, show them as parallelizable).

Dependencies:

- Requires extending task queue generation logic.
- May need UI updates to visualize cross-desk dependencies.

---

SECONDARY COGNITIVE LOAD ISSUES

ISSUE 8: Smart Router Scoring Has Undefined Fallback Behavior

Location: src/lib/ai/router/smart-router.ts:479-490 (getFallbackModel)
Severity: P2
Problem: When no models match constraints, the router silently selects a hardcoded fallback without explanation. Users don't know why their cost/latency constraints were ignored.
Fix: Log the fallback selection with explanation; surface to user if their constraints can't be met.

---

ISSUE 9: Context Revision Coalescing Window is Magic

Location: src/hooks/useContextRevisions.ts:114-126
Severity: P2
Problem: Draft revisions are coalesced within a 5-second window, but this is a magic number with no user visibility. Users might create multiple drafts unwittingly.
Fix: Make coalesce window configurable; show user when a draft is being coalesced vs. creating a new revision.

---

ISSUE 10: Conflict Resolution is Passive

Location: src/new/routes/ExecutionDeskPage.tsx:122-126 (conflict hook), src/hooks/useSupabaseSpread.ts (inferred)
Severity: P2
Problem: When a conflict is detected, the system defaults to remote without explicitly asking the user. The conflict UI might be buried or dismissed.
Fix: Surface conflicts as a modal or prominent banner; require explicit user choice before proceeding.

---

ISSUE 11: Coherence Scan Status is In-Memory; Lost on Refresh

Location: src/lib/coherence-scan/coherence-scan-service.ts:37
Severity: P2
Problem: Scans in progress are stored in new Map(), so they're lost if the user refreshes or closes the tab.
Fix: Persist scan state to Supabase or localStorage with a recovery mechanism.

---

ISSUE 12: Task Executor Validation Doesn't Surface Validation Failures

Location: src/new/routes/ExecutionDeskPage.tsx:329-333
Severity: P2
Problem: taskExecutor.validateTask() returns a boolean with an error message, but if validation fails, users see a toast and the task list doesn't update. It's unclear what's wrong.
Fix: Return structured validation error with remediation steps; update task UI to show why it can't run.

---

SYSTEM-LEVEL RECOMMENDATIONS

1. Guiding Principles for Low-Cognitive-Load Logic

Adopt these principles for all future development:

1. Single Source of Truth for Each Concept


    - Task status has one home: the persisted SpreadTask.status field.
    - Project state has one home: coordinated through ProjectStateManager.
    - No transient computed state that diverges from durable state.

2. Explicit State Transitions


    - Every state change is logged and justified (e.g., "task moved from pending to ready because dependency X completed").
    - Use state machines for complex flows (Upstash, XState, or custom reducer).
    - Never silently upgrade state; always make transitions durable.

3. One Clear Path Per Task


    - For each user task (e.g., "execute a task"), there is one recommended sequence of actions.
    - Advanced users can deviate, but the default path is obvious.
    - No parallel choices that create cognitive branching.

4. Failures Are Specific, Not Generic


    - Every error code has a structured type and recovery hint.
    - "Something went wrong" is never the user-facing message.
    - All errors are loggable with full context for debugging.

5. No Hidden Side Effects


    - Changing routing quality doesn't silently affect cost tracking or history.
    - Retrying a task doesn't silently refund costs.
    - UI actions have visible consequences, always.

6. Conflicts Are Explicit


    - When two versions of state differ, the user is prompted to choose, not silently defaulted.
    - Conflicts are surfaced before proceeding, not buried in logs.

---

2. Recommended Refactoring Plan

Priority 1: State Architecture (Phase 1)

- Implement ProjectStateManager to unify Supabase + localStorage + component state.
- Split useFlowStore into three focused stores (Layout, Routing, ExecutionContext).
- Add CostLedger for transparent cost tracking.

Priority 2: Task Logic (Phase 1-2)

- Implement upgradeTasksToReady() as explicit state updates.
- Define section dependency graph and topological sorting.
- Add cross-desk task dependencies based on project goals.

Priority 3: Error Handling (Phase 2)

- Define SpreadGenerationError and other structured error types.
- Update all error throws to use structured types.
- Build error recovery UI component.

Priority 4: Visibility & Monitoring (Phase 2-3)

- Add Cost Ledger UI to show per-task cost breakdown.
- Add Conflict Resolution modal.
- Add Coherence Scan persistence.

---

3. Complexity Budget

Per-Screen Complexity Limits:

- No component should have more than 3 independent state sources.
  - Example: ExecutionDeskPage currently has 7+ (component state, Zustand, localStorage, Supabase, hooks). Reduce to: ProjectStateManager + LayoutStore + RoutingStore.
- No store should manage more than 2 semantic concerns.
  - Current: useFlowStore manages 7. Split into: LayoutStore (1 concern), RoutingStore (1), ExecutionContextStore (1), SessionStore (1).
- No flow should have more than 5 sequential steps without explicit checkpoints.
  - Example: Spread generation → Task queue generation → Task execution is 3 steps; each should have explicit success/failure checkpoint.
- No async operation should lack a timeout.
  - All Supabase queries, API calls, and AI tasks have explicit timeouts with fallback behavior.

Enforcement:

- Require code reviews to check: "Does this component import more than 3 stores?" or "Does this store manage more than 2 concerns?"
- Add a "state map" diagram to every new feature PR showing all state sources and how they sync.

---

PHASED IMPLEMENTATION ROADMAP

Phase 1: Core Mental Model & State Cleanup (2-3 weeks)

Objective: Align all state layers (React, Zustand, localStorage, Supabase) around a single, consistent mental model.

Tasks:

1. ProjectStateManager Implementation


    - Create src/lib/project-state/ProjectStateManager.ts
    - Implement load, save, conflict detection, and resolution.
    - Add tests for version tracking and conflict scenarios.
    - Effort: Medium
    - Expected Impact: Eliminates data race conditions; makes conflict handling explicit.

2. Zustand Store Refactoring


    - Split useFlowStore into LayoutStore, RoutingStore, ExecutionContextStore, SessionStore.
    - Migrate existing localStorage data to new stores.
    - Update ExecutionDeskPage and related components to import split stores.
    - Effort: Medium
    - Expected Impact: Reduces state coupling; makes each concern independently testable.

3. Task State Upgrade Implementation


    - Add upgradeTasksToReady() function to task-queue-engine.
    - Update updateTaskStatus() to call upgradeTasksToReady().
    - Remove implicit upgrades from getTasksByStatus().
    - Add tests for dependency resolution.
    - Effort: Low
    - Expected Impact: Task status becomes deterministic and persistent; users see consistent "ready" state across reloads.

4. Section Dependency Graph


    - Define SECTION_TEMPLATES with dependencies.
    - Implement buildSectionsInOrder() with topological sort.
    - Update section builders to declare dependencies.
    - Move desk inference before section generation.
    - Effort: Low-Medium
    - Expected Impact: Section ordering is explicit and maintainable; new sections can't break existing ones.

---

Phase 2: Interaction & Error Logic (2-3 weeks)

Objective: Make failures specific and recoverable; normalize error handling across the app.

Tasks:

1. Structured Error Types


    - Define SpreadGenerationError, TaskExecutionError, CoherenceScanError.
    - Update all error-throwing functions to use structured types.
    - Add error serialization for logging/analytics.
    - Effort: Low
    - Expected Impact: Errors are machine-readable and user-friendly; debugging is easier.

2. Error Recovery UI


    - Build SpreadGenerationErrorPanel component.
    - Build TaskExecutionErrorPanel component.
    - Show recovery hints and guided actions.
    - Effort: Low-Medium
    - Expected Impact: Users know what to do when things fail; fewer support requests.

3. Cost Ledger Implementation


    - Create CostLedger class with transaction log.
    - Integrate into task execution workflow.
    - Add Cost Ledger UI panel.
    - Effort: Medium
    - Expected Impact: Cost tracking is transparent and auditable; users trust the cost display.

4. Conflict Resolution UI


    - Build modal for explicit version choice.
    - Surface conflicts before proceeding.
    - Log conflict resolution for analytics.
    - Effort: Low-Medium
    - Expected Impact: Users have control over data conflicts; no more silent defaults.

---

Phase 3: Complexity & Advanced Features (2-3 weeks)

Objective: Hide unnecessary complexity; clarify advanced flows; handle edge cases gracefully.

Tasks:

1. Cross-Desk Task Dependencies


    - Implement establishCrossDeskDependencies().
    - Add user-configurable desk execution order.
    - Add critical path visualization in task queue.
    - Effort: Low-Medium
    - Expected Impact: Task sequence is natural and logical; users don't get stuck with out-of-order work.

2. Coherence Scan State Persistence


    - Move scan state from in-memory Map to Supabase/localStorage.
    - Implement scan recovery on page reload.
    - Add scan progress tracking.
    - Effort: Low
    - Expected Impact: Scans survive page reloads; users don't lose progress.

3. Smart Router Constraint Feedback


    - Log when fallback is used due to unsatisfied constraints.
    - Surface to user: "Your cost limit couldn't be met; using X model instead."
    - Allow users to adjust constraints on-the-fly.
    - Effort: Low-Medium
    - Expected Impact: Users understand why models are selected; no surprises.

4. Context Revision Configuration


    - Make coalesce window configurable.
    - Show user when drafts are being coalesced.
    - Add option to force new revision.
    - Effort: Low
    - Expected Impact: Draft versioning is predictable and transparent.

5. Task Validation Surface


    - Return structured validation errors, not booleans.
    - Show validation failures in task list with remediation steps.
    - Prevent running invalid tasks with clear UI lockout.
    - Effort: Low-Medium
    - Expected Impact: Users can't accidentally run broken tasks; validation errors guide them to fix issues.

---

Success Metrics

After implementing this roadmap, you should see:

1. Lower Task Failure Rate: Clearer errors → faster recovery.
2. Reduced Support Volume: Users can self-diagnose and fix issues.
3. Improved Developer Velocity: State management is simpler and more predictable.
4. Better Data Consistency: Explicit sync logic eliminates race conditions.
5. Higher User Trust: Transparent cost tracking, conflicts, and errors build confidence.

---

Quick-Reference Issue Table
#: 1
Issue: Task Status Upgrade Logic
Severity: P1
Category: State
Phase: 1
Effort: Low
────────────────────────────────────────
#: 2
Issue: Multi-Layered State Sync
Severity: P0
Category: State
Phase: 1
Effort: High
────────────────────────────────────────
#: 3
Issue: Section Builder Dependencies
Severity: P1
Category: Flow
Phase: 1
Effort: Low
────────────────────────────────────────
#: 4
Issue: Flow Store Conflates Concerns
Severity: P2
Category: Architecture
Phase: 1
Effort: Medium
────────────────────────────────────────
#: 5
Issue: Cost Tracking is Optimistic
Severity: P1
Category: Logic
Phase: 2
Effort: Medium
────────────────────────────────────────
#: 6
Issue: Error States Underspecified
Severity: P1
Category: Error Handling
Phase: 2
Effort: Low
────────────────────────────────────────
#: 7
Issue: Cross-Desk Dependencies Implicit
Severity: P2
Category: Flow
Phase: 3
Effort: Low
────────────────────────────────────────
#: 8
Issue: Smart Router Fallback Undefined
Severity: P2
Category: Logic
Phase: 3
Effort: Low
────────────────────────────────────────
#: 9
Issue: Revision Coalesce is Magic
Severity: P2
Category: UX
Phase: 3
Effort: Low
────────────────────────────────────────
#: 10
Issue: Conflict Resolution Passive
Severity: P2
Category: Error Handling
Phase: 2
Effort: Low
────────────────────────────────────────
#: 11
Issue: Coherence Scan State Lost
Severity: P2
Category: State
Phase: 3
Effort: Low
────────────────────────────────────────
#: 12
Issue: Task Validation Not Surfaced
Severity: P2
Category: Error Handling
Phase: 2
Effort: Low

---

Conclusion

CODRA's architecture and domain logic are thoughtfully designed. The core issue is not conceptual but operational: state management is scattered, error handling is generic, and implicit transitions create cognitive friction. By unifying state around a ProjectStateManager, splitting stores by concern, explicitly modeling task state transitions, and surfacing all errors with recovery hints, you can dramatically reduce cognitive load for both users and developers.

The phased roadmap prioritizes the highest-impact changes first, allowing you to realize benefits incrementally. Each phase builds on the previous, with Phase 1 establishing a solid foundation for all future work.

---

⏺ I've completed a comprehensive cognitive load audit of CODRA focused on logic, architecture, and flow control.

Summary

I identified 12 distinct cognitive load issues across 3 severity levels, ranging from silent state upgrades that break predictability to multi-layered state synchronization creating race conditions. The core problems are:

1. Scattered state ownership (React hooks + Zustand + localStorage + Supabase) with no coordination
2. Implicit state transitions (task readiness computed on-the-fly, not persisted)
3. Fragmented error handling (generic fallbacks, no recovery paths)
4. Conflated concerns in stores (layout + routing + cost tracking + history in one store)
5. Magic numbers and invisible dependencies (5-second coalesce window, per-desk-only task ordering)

Key Findings

Critical Issues:

- Issue #2 (P0): Multi-layered state sync creates undetected conflicts
- Issue #1 (P1): Task status upgrade is silent and non-idempotent—tasks vanish after page reload
- Issue #5 (P1): Cost tracking is optimistic with no rollback—failed retries show doubled cost
- Issue #6 (P1): Errors are generic with no recovery guidance—users see blank spreads

Proposed Fixes

For each issue, I provided:

- Specific code-level fixes (e.g., ProjectStateManager to unify state, CostLedger for transparency)
- Structured error types to replace generic messages
- Explicit task state upgrades instead of transient computed values
- Split stores to reduce coupling (LayoutStore, RoutingStore, ExecutionContextStore, SessionStore)

3-Phase Roadmap
┌───────┬──────────┬───────────────────────┬─────────────────────────────────┐
│ Phase │ Duration │ Focus │ Impact │
├───────┼──────────┼───────────────────────┼─────────────────────────────────┤
│ 1 │ 2-3 │ State Architecture, │ Eliminates race conditions; │
│ │ weeks │ Task Logic │ makes state deterministic │
├───────┼──────────┼───────────────────────┼─────────────────────────────────┤
│ 2 │ 2-3 │ Error Handling, Cost │ Users recover from failures; │
│ │ weeks │ Transparency │ trust cost tracking │
├───────┼──────────┼───────────────────────┼─────────────────────────────────┤
│ 3 │ 2-3 │ Advanced Flows, Edge │ Cross-desk ordering; scan │
│ │ weeks │ Cases │ recovery; validation feedback │
└───────┴──────────┴───────────────────────┴─────────────────────────────────┘
The audit includes a Quick-Reference Table mapping all 12 issues to severity, phase, and effort for prioritization.
