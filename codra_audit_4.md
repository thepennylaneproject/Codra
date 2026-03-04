Below is a cognitive‑load audit focused on logic, state, and flow control. I’m
basing this on the code available in the repo; I did not run the app or
inspect telemetry. If you have user flow analytics, error logs, or backend
schema contracts, share them to validate severity.

Per‑issue log

1. Location: src/new/routes/ProjectsPage.tsx (Projects list and create/import)
   Category: Flow
   Severity: P1
   Problem: “Create” is a dropdown with three paths and no immediate sense of
   the next step or what happens after selection; Import triggers a file
   dialog but then reloads the entire page. The import flow lacks a
   deterministic state transition (no explicit “imported project created”).
   Cognitive impact: Users must predict which path is correct and remember
   that Import will restart context, which increases uncertainty. A page
   reload after import looks like a crash or reset.
   Root cause (technical): Create is a local showCreateMenu toggle; import
   uses window.location.reload() instead of state updates or navigation.
   Proposed fix: Normalize creation into a single “New project” flow with a
   secondary “Import” link that shows a modal, parses, and then navigates to
   the created project without reload. Persist import results into projects
   state and show a toast + “Open project” affordance.
   Dependencies: Requires import endpoint or local store update strategy.
2. Location: src/new/routes/onboarding/OnboardingFlow.tsx and src/new/routes/
   onboarding/steps/StepProjectInfo.tsx
   Category: Flow
   Severity: P1
   Problem: The onboarding flow uses URL steps plus localStorage plus Zustand
   state. This causes multiple potential sources of truth (URL step,
   localStorage step, in‑memory step) that can diverge.
   Cognitive impact: Users can land on mismatched steps or resume states that
   don’t reflect what they last saw, undermining trust.
   Root cause (technical): Step is derived from URL, stored in localStorage,
   and also stored in Zustand without a single authoritative model.
   Proposed fix: Make URL the single source of truth for step and projectId;
   use localStorage only as a cache. On mount, compute a canonical step from
   localStorage and immediately navigate() to it, then clear any inconsistent
   store state.
   Dependencies: Changes to onboarding store + route guards.
3. Location: src/new/routes/onboarding/steps/StepAddContext.tsx
   Category: Flow
   Severity: P1
   Problem: The “Skip” and “Continue” both navigate forward but with different
   analytics and localStorage updates. There’s no clear outcome difference in
   UI.
   Cognitive impact: Users must infer why two buttons exist for the same
   direction; makes the sequence feel arbitrary.
   Root cause (technical): Two paths are treated as different, but state/flow
   are almost identical.
   Proposed fix: Collapse into a single “Continue” action and a “Skip” link
   that simply sets a skippedContext: true flag in the onboarding state; use
   that flag for later messaging.
   Dependencies: Update onboarding state schema.
4. Location: src/new/routes/onboarding/steps/StepGeneratingNew.tsx
   Category: State
   Severity: P1
   Problem: Generation auto‑starts on mount, but the hook is driven by local
   progress and error with no explicit “generation id.” If the component
   remounts or reloads, the flow can re‑trigger.
   Cognitive impact: Users cannot tell whether generation is already running
   or restarted, leading to uncertainty about progress.
   Root cause (technical): No idempotent generation session or persisted
   status; hook appears to be local‑state driven.
   Proposed fix: Create a generationSessionId persisted in localStorage or
   backend, and have useSpreadGeneration read/continue existing sessions
   before starting a new one.
   Dependencies: Requires server support or local session persistence.
5. Location: src/new/routes/ExecutionDeskPage.tsx
   Category: State
   Severity: P1
   Problem: Multiple state sources (Supabase useSupabaseSpread, local spread,
   taskQueue, and taskRunStates) are patched together; UI opens proof panel if
   any pending tasks exist, but this can be stale vs. server.
   Cognitive impact: Users may see panels open/close seemingly by themselves
   or not reflect true task status.
   Root cause (technical): Duplicate client state and derived UI behaviors not
   tied to a single source of truth.
   Proposed fix: Normalize to a single “spread state” object derived from
   Supabase; use a reducer that computes UI flags from server state (e.g.,
   hasPendingTasks).
   Dependencies: Refactor useSupabaseSpread + local state removal.
6. Location: src/new/components/workspace/TaskQueuePanel.tsx
   Category: Interaction
   Severity: P1
   Problem: “Run” appears per task, but only one task can run globally, and
   “Run” can be disabled without explanation when another task runs.
   Cognitive impact: Users must guess why a button is disabled; increases
   uncertainty about system constraints.
   Root cause (technical): Single‑flight logic (isAnyRunning) is global but
   not surfaced in UI.
   Proposed fix: Add a global banner or inline disabled reason (e.g., “Another
   task is running”) and show a queue‑level status.
   Dependencies: None.
7. Location: src/new/components/workspace/TaskQueuePanel.tsx
   Category: State
   Severity: P1
   Problem: taskRunStates duplicates task status with task.status, and
   “failed/timed out” logic is built from both.
   Cognitive impact: Users can see inconsistent status labels or mixed cues
   (e.g., “Failed” but status still pending).
   Root cause (technical): Parallel state sources without reconciliation.
   Proposed fix: Replace taskRunStates with a single task.status enum that
   includes running, failed, timed-out, cancelled, complete.
   Dependencies: Update task executor and task queue engine.
8. Location: src/new/routes/ExecutionDeskPage.tsx
   Category: Interaction
   Severity: P2
   Problem: Proof panel opens on triggers but no clear mechanism to close with
   keyboard or avoid repeated reopen.
   Cognitive impact: Users feel loss of control over layout and can’t predict
   why it reopens.
   Root cause (technical): proofTrigger auto‑opens without persistent “user
   dismissed” state.
   Proposed fix: Track proofDismissedAt and suppress auto‑open for the session
   unless a new failure event occurs after that timestamp.
   Dependencies: Add session state in useFlowStore.
9. Location: src/new/components/shell/WorkspaceHeader.tsx
   Category: Interaction
   Severity: P1
   Problem: Multiple menus (tools, user, studio) open independently; only
   outside click closes them. No keyboard close or focus management.
   Cognitive impact: Keyboard users and power users experience mode confusion
   and lost focus.
   Root cause (technical): menus are raw divs; no shared menu controller.
   Proposed fix: Implement a Menu component with focus trap, Escape close, and
   aria-\* roles; centralize open state to ensure only one menu open at a time.
   Dependencies: New UI primitive.
10. Location: src/new/routes/ProjectContextPage.tsx
    Category: State
    Severity: P1
    Problem: Edit/save state is local with editingSection and tempData, but the
    page also manages versions and revisions; save indicator uses mixed local
    and server state.
    Cognitive impact: Users cannot be sure which version they’re editing or
    whether the save is applied to the correct revision.
    Root cause (technical): Editing state and version selection are not linked
    to a single “active revision” entity.
    Proposed fix: Introduce a currentRevision state object from the server and
    bind edit state to it; force a revision lock or draft mode on edit.
    Dependencies: Backend support for revision locking or draft mode.
11. Location: src/new/routes/onboarding/steps/StepProjectInfo.tsx
    Category: State
    Severity: P2
    Problem: isCreating is local, but errors do not reset all session state;
    there is no “retry last request” or idempotency.
    Cognitive impact: Users may double‑submit or fear duplicate project
    creation.
    Root cause (technical): No idempotency key; local state only.
    Proposed fix: Use an idempotency key stored with startTime and pass to
    projects-create so duplicate submissions are ignored.
    Dependencies: API change.
12. Location: src/new/routes/ProjectsPage.tsx
    Category: Data model
    Severity: P2
    Problem: Status is inferred from localStorage task queues, not server
    state.
    Cognitive impact: Users see “Running/Complete” status that may be wrong
    across devices or sessions.
    Root cause (technical): Status derived from localStorage per project.
    Proposed fix: Store status in project or task queue server-side; display
    last known status from API.
    Dependencies: Backend change.
13. Location: src/new/routes/ExecutionDeskPage.tsx
    Category: Error handling
    Severity: P1
    Problem: Spread generation errors are stored in spreadError, but recovery
    logic is not clearly tied to a consistent retry state; local
    isRetryingSpread competes with other loading states.
    Cognitive impact: Users are unsure whether retry actually started or
    failed.
    Root cause (technical): Multiple loading flags for the same operation.
    Proposed fix: Create a single spreadGenerationState enum (idle|loading|
    error|retrying|success) used by all related UI.
    Dependencies: Refactor around useSupabaseSpread.
14. Location: src/new/routes/ExecutionDeskPage.tsx and src/new/components/
    workspace/ExecutionDesk.tsx
    Category: Interaction
    Severity: P2
    Problem: Keyboard shortcuts (Cmd+\, Cmd+/) are global but undocumented and
    only work in some contexts.
    Cognitive impact: Hidden actions reduce predictability and can cause
    accidental layout changes.
    Root cause (technical): Global keydown listener without contextual
    affordance.
    Proposed fix: Add a visible “Keyboard shortcuts” link or tooltip in header;
    scope keydown to workspace focus.
    Dependencies: Minimal.
15. Location: src/new/routes/SettingsPage.tsx
    Category: Complexity
    Severity: P2
    Problem: Settings mixes subscription, AI defaults, and financial guardrails
    in one long page without scoping or progressive disclosure.
    Cognitive impact: Users must parse multiple concepts at once and understand
    advanced options.
    Root cause (technical): Flat layout with no state‑driven disclosure.
    Proposed fix: Split into top‑level “Account,” “AI,” “Budget” sections with
    collapsible panels or route tabs.
    Dependencies: Minor routing or local state.
16. Location: src/components/auth/LoginForm.tsx
    Category: Flow
    Severity: P2
    Problem: OAuth buttons and email form are presented simultaneously without
    a clear primary path.
    Cognitive impact: Too many parallel choices for a simple task.
    Root cause (technical): UI presents all options at once rather than
    staging.
    Proposed fix: Default to email form with a secondary “Use other sign‑in
    methods” toggle revealing OAuth buttons.
    Dependencies: Minor UI state.

System-level recommendations

Guiding principles for low cognitive load logic:

- Single source of truth for each flow state (URL or server, not localStorage
  - Zustand + local state).
- One path per core task; any alternative should be explicitly labeled as
  optional.
- Every irreversible action has a recoverable or confirmable model
  (idempotency, retry states).
- UI state derives from domain state; avoid parallel UI flags.
- Any global interaction (shortcuts, auto panels) must be visible and
  reversible.

Refactor plan:

- Centralize flow state via route‑driven steps and server‑derived statuses.
- Standardize async states as enums (idle/loading/success/error), not
  booleans.
- Consolidate taskQueue and taskRunStates into a single task status model.
- Introduce shared state primitives: useAsyncState, useMenuController,
  useFlowStep.

Complexity budget:

- Max 1–2 primary actions per screen; secondary actions tucked into overflow.
- Max 3 visible toggles or options on any single view before disclosure.
- Max 2 parallel navigation levels (Project > Desk > Subview).
  Enforcement: lint rules for component props (primaryAction,
  secondaryAction), and a design guideline for “no more than 2 CTAs.”

Implementation roadmap

Phase 1 – Core mental model & state cleanup

- Unify onboarding steps to URL as source of truth; normalize resume logic
  (OnboardingFlow).
- Replace localStorage project status on Projects page with server status.
- Introduce async enums for spread generation and task execution state.
  Impact: Users always know “where I am” and “what’s happening.”
  Effort: High.

Phase 2 – Interaction and error logic

- Create a menu/controller primitive for Workspace header.
- Add explicit queue‑level constraints messaging in Task Queue.
- Add idempotency keys to project creation.
  Impact: Fewer surprises and lower fear of duplication or hidden constraints.
  Effort: Medium.

Phase 3 – Complexity & edge cases

- Progressive disclosure for Settings and Auth options.
- Session‑based “proof panel dismissed” state.
- Keyboard shortcut visibility and scoping.
  Impact: Reduced cognitive overload and increased predictability.
  Effort: Low–Medium.
