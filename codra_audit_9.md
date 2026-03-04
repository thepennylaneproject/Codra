Findings
Issue 1
Location: src/new/routes/onboarding/steps/StepProjectInfo.tsx, src/new/routes/
onboarding/hooks/useSpreadGeneration.ts, src/domain/projects.ts
Category: Flow / State / Data model
Severity: P0
Problem: The onboarding flow creates a project twice via two different sources
of truth. Step 1 creates a server project through /.netlify/functions/
projects-create, while Step 3 creates a new local project via createProject
and then routes to that new ID. The projectId in the URL is ignored in
generation, so users can end up in a workspace that does not match the project
they just created.
Cognitive impact: Users see “project created” but land in a different
workspace with missing context, making the flow feel unreliable and non-
linear. It forces them to mentally reconcile why the new project isn’t in
their list or why edits don’t seem to apply to the original project.
Root cause (technical): Two parallel project creation pipelines (server API vs
localStorage mock) with no shared ID or reconciliation, and
useSpreadGeneration not using the existing projectId.
Proposed fix: Make Step 1 the only project creation step and pass projectId
into useSpreadGeneration; the generation step should provision a spread for
the existing project, not create a new project. Replace createProject usage in
useSpreadGeneration with a server-side “provision spread” API call that
returns a spread ID for the existing project.
Dependencies: Needs a backend endpoint for “provision spread” (or extend /
projects-create to return a spread), and update createProject in src/domain/
projects.ts to point to that API or be removed from this flow.

Issue 2
Location: src/domain/projects.ts, src/new/routes/ProjectsPage.tsx
Category: Data model / State
Severity: P1
Problem: The app’s project list and project retrieval are localStorage-only
and seeded with mock data, while onboarding uses server creation. This means
projects created in onboarding can be missing from the Projects page or vice
versa, and status logic reads localStorage task queues that don’t match
Supabase tasks.
Cognitive impact: Users cannot trust the Projects list as a stable ledger of
their work; their mental model breaks when a newly created project is missing
or status is wrong.
Root cause (technical): getProjects and getProjectById are localStorage-backed
mocks, while other parts of the app use server storage (Supabase / Netlify
functions).
Proposed fix: Replace src/domain/projects.ts with API-backed reads/writes;
make the Projects page read from the same API and remove mock-only state. If
offline support is needed, cache server responses and sync via a queue rather
than using a separate local project store.
Dependencies: Requires API contract for listing and fetching projects; may
require Supabase table or Netlify function updates.

Issue 3
Location: src/hooks/useContextRevisions.ts, src/new/routes/
ProjectContextPage.tsx
Category: State / Data model
Severity: P1
Problem: Context revisions (draft/approved) are stored only in localStorage,
and “approve” doesn’t update the project record on the server. On a new device
or after cache clears, approved context disappears and the workspace reverts
to base project data.
Cognitive impact: Users lose confidence in whether “approved context” is
actually durable. They must remember that context may be local-only, which
contradicts a ledger-like experience.
Root cause (technical): Revision lifecycle is entirely client-side with
localStorage persistence; there is no canonical server write for approved
context.
Proposed fix: Persist revisions to a server table (project_context_revisions)
and write the approved revision into the canonical project record (or a linked
context table). Update useContextRevisions to fetch/persist via API and use
localStorage only as a cache.
Dependencies: New backend schema/table and API endpoints; migration of local
revisions if needed.

Issue 4
Location: src/new/routes/ProjectContextPage.tsx
Category: State / Interaction
Severity: P1
Problem: isDraft is initialized from URL or the latest revision, but it
doesn’t track the selected revision. If a user selects an approved revision
from the dropdown, the page can still behave as if it’s in draft mode (showing
draft affordances and saving to draft).
Cognitive impact: Users can’t trust what state they are in, creating
hesitation around edits and approvals. It makes the “version” concept feel
slippery.
Root cause (technical): isDraft is a standalone state, not derived from
currentRevision?.status, and isn’t updated when currentRevisionId changes.
Proposed fix: Remove isDraft local state and derive a single isDraft boolean
from currentRevision?.status === 'draft' plus explicit query param overrides.
If query param is needed, set currentRevisionId to the correct revision rather
than toggling a separate flag.
Dependencies: None beyond this component and useContextRevisions.

Issue 5
Location: src/hooks/useSupabaseSpread.ts
Category: State / Error handling
Severity: P1
Problem: A single saving flag gates both saveSpread and saveTaskQueue. If a
spread save is in flight, task queue updates are dropped early without retry,
which can silently lose state.
Cognitive impact: Users see tasks revert or disappear with no explanation,
undermining predictability in the workspace.
Root cause (technical): Shared saving state for two independent resources;
“early return” logic prevents queued updates.
Proposed fix: Split saving into savingSpread and savingTaskQueue (or use per-
resource request queues). Always enqueue a pending update if another save is
running, then flush in order.
Dependencies: Minimal; this hook and dependent components.

Issue 6
Location: src/new/routes/ExecutionDeskPage.tsx
Category: State / Interaction
Severity: P1
Problem: Task execution updates use taskQueue from closure inside an async
flow. If external updates arrive (Supabase updates or another local update),
handleRunTask can overwrite the latest queue with stale data.
Cognitive impact: Users may see task statuses jump backward or lose updates,
which feels inconsistent and mentally taxing to reconcile.
Root cause (technical): Async updates built from captured state instead of
functional updates or a versioned merge strategy.
Proposed fix: Use functional setTaskQueue(prev => ...) updates and persist the
resulting queue; introduce a task queue version or conflict check (similar to
spread) to prevent overwrites on concurrent updates.
Dependencies: Update useSupabaseSpread to support task queue versioning or
conflict checks.

Issue 7
Location: src/lib/store/useFlowStore.ts, src/new/routes/ExecutionDeskPage.tsx
Category: State / Flow
Severity: P1
Problem: Flow state (active section, layout, routing preferences) is persisted
globally and reused across projects. Opening a different project can reuse an
activeSectionId that doesn’t exist, leaving the workspace with no active
section and inconsistent layout.
Cognitive impact: Users must re-orient on every project because the app
carries hidden state from previous contexts.
Root cause (technical): Flow state is not scoped by projectId.
Proposed fix: Scope flow state by projectId (e.g., flowByProject[projectId])
or reset key fields when the project changes. Persist per-project layout and
routing preferences separately.
Dependencies: Updates to useFlowStore and the components that read/write it.

Issue 8
Location: src/hooks/useSupabaseSpread.ts, src/new/routes/ExecutionDeskPage.tsx
Category: State / Error handling
Severity: P1
Problem: Offline queueing and save errors exist, but there is no UI feedback
in the workspace. Users cannot tell if their work is saved, queued, or failed.
Cognitive impact: The workspace feels unreliable; users must guess whether
edits are durable, which increases anxiety and cognitive load.
Root cause (technical): isOnline, saving, error, and queue length are not
surfaced in the UI layer.
Proposed fix: Add a save/connection indicator to the workspace header using
isOnline, saving, error, and queued item count. Use the existing SaveIndicator
pattern from the context page and show “Queued” vs “Saved”.
Dependencies: Expose queue length from useSupabaseSpread or add a helper.

Issue 9
Location: src/new/routes/onboarding/steps/StepAddContext.tsx, src/new/routes/
onboarding/hooks/useSpreadGeneration.ts
Category: Flow / Interaction
Severity: P1
Problem: The “Add Context” step accepts files but doesn’t upload or use them
in spread generation. The user invests time but receives no effect, and the
data is not persisted.
Cognitive impact: This violates “predictable output for input,” leading users
to question whether the system notices their actions.
Root cause (technical): File uploads are stored only in client state;
useSpreadGeneration ignores contextFiles.
Proposed fix: Either hide this step until file ingestion exists, or implement
upload to storage and pass file references into spread generation (attach to
project context or preprocessing pipeline).
Dependencies: Storage service and a server endpoint for context file
ingestion.

Issue 10
Location: src/hooks/useContextRevisions.ts, src/domain/spread/\*, src/new/
routes/ExecutionDeskPage.tsx
Category: Data model
Severity: P2
Problem: The codebase uses overlapping terms (“spread,” “tear sheet,”
“context,” “workspace”) for adjacent concepts and keys (codra:tearSheet,
codra:spread, workspace). This makes it hard to maintain a single mental model
of the system.
Cognitive impact: Internal inconsistency increases the chance of UX
inconsistencies and leaks into user-visible labels or errors.
Root cause (technical): Evolving terminology without a canonical domain model
and shared naming conventions.
Proposed fix: Create a domain naming map (e.g., ProjectContext, Workspace,
Spread) and enforce it across types, storage keys, and API fields; add
adapters for legacy storage keys until migration completes.
Dependencies: Light refactor across domain types, storage keys, and analytics
event naming.

Missing Inputs (for a fuller audit)

- API contracts and schemas for /.netlify/functions/projects-create, spread/
  task queue tables, and any server-side context/approval storage.
- Telemetry or error logs for onboarding drop-offs, task execution failures,
  and conflict resolution frequency.
- A definitive “source of truth” diagram (server vs client) for project,
  spread, task queue, and context.

System-Level Recommendations
Guiding principles for low-cognitive-load logic

- Single source of truth per entity (project, context, spread, task queue)
  with explicit cache boundaries.
- One clear path per core task (create project, add context, run tasks) with
  no duplicate creation flows.
- Explicit state enums for drafts/approved/pending to avoid ambiguous UI
  modes.
- Visible saving/offline states and no hidden retries for user-authored work.
- Action handlers must be idempotent and merge-safe for realtime updates.

Refactor plan

- Consolidate project creation and retrieval into one API-backed module,
  remove localStorage mocks for production flows.
- Introduce a ProjectContext server model with revision history; treat
  “approved” as canonical.
- Normalize task queue updates with versioning or conflict checks like
  spreads.
- Scope flow/layout state by projectId and reset on project switch.
- Centralize save status and offline queue indicators in a shared UI
  component.

Complexity budget

- 1 primary action per screen; no more than 2 secondary actions visible by
  default.
- Max 1 mode toggle per screen; if more, move to settings.
- Max 3 decision points per onboarding step; keep optional actions
  collapsible.
- Enforce with component props (primaryAction, secondaryActions,
  advancedActions) and lint rules where possible.

Implementation Roadmap
Phase 1 – Core mental model & state cleanup

- Tasks: unify project creation flow; replace localStorage project mocks with
  API module; make generation use existing projectId; scope flow state by
  projectId
- Impact: restores predictable “create → see → open” flow and removes
  duplicate projects
- Effort: High

Phase 2 – Interaction and error logic

- Tasks: split save flags; add task queue conflict/version handling; surface
  save/connection/queue status in workspace header
- Impact: reduces uncertainty about what saved and prevents hidden overwrites
- Effort: Medium

Phase 3 – Complexity & edge cases

- Tasks: persist context revisions to server; resolve draft mode derivation;
  either implement file ingestion or gate the step; normalize domain naming
  across spread/context/workspace
- Impact: stabilizes context as a durable ledger and reduces conceptual
  fragmentation
- Effort: Medium

If you want, I can prioritize these into a concrete PR sequence or draft the
API interface changes needed for Phase 1.
