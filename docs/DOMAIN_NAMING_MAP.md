## Domain Naming Map

Purpose: Provide a single, canonical vocabulary for Codra domain concepts and their storage keys. This is the source of truth for naming decisions in code, storage, and analytics.

### Canonical Concepts

- Project
  - The top-level record a user owns. Contains core metadata, access, and budget policy.
- ProjectContext
  - The structured brief for a project (identity, audience, brand, success, guardrails).
  - Stored as revisions. The approved revision is the source of truth for the workspace.
- ProjectIntent
  - The intent metadata captured during onboarding that informs the ProjectContext.
- Workspace
  - The active production environment for a project (Execution Desk).
  - Routes: `/p/:projectId/workspace` and related panels.
- Spread
  - The structured output layout (sections + TOC). Think “assembled work surface.”
- TaskQueue
  - The ordered list of execution tasks derived from the Spread + Context.

### Canonical Storage Keys

- `codra:context:revisions:${projectId}` — ProjectContext revisions (canonical).
- `codra:context:${projectId}` — ProjectContext snapshot (if stored).
- `codra:spread:${projectId}` — Spread document.
- `codra:spread:${projectId}:layout` — Spread layout preferences.
- `codra:task-queue:${projectId}` — TaskQueue.
- `codra:onboarding-profile:${projectId}` — Onboarding profile (canonical).
- `codra:extended-onboarding-profile:${projectId}` — Extended onboarding profile.
- `codra:smart-defaults:${projectId}` — Smart defaults used during provisioning.
- `codra:projects` — Project list (local cache).

### Forbidden Legacy Terms (use canonical instead)

- TearSheet / tearSheet → ProjectContext or ContextRevision
- tearSheetRevision → ProjectContextRevision
- tearSheetAnchor → contextAnchor (or contextSectionId)
- tearSheetVersion → contextVersion
- tearSheetIntent → projectIntent
- codra:tearSheet:* → codra:context:revisions:*
- codra:onboardingProfile:* → codra:onboarding-profile:*
- codra:taskQueue:* → codra:task-queue:*
- codra:smartDefaults:* → codra:smart-defaults:*

### Analytics Event Naming

Use canonical terms in event names and properties:

- “context” for ProjectContext revisions.
- “workspace” for the execution surface.
- “spread” for layout and document events.
- Avoid “tearSheet” in new events. If legacy events exist, document a migration plan before changing names.

### Adapter Policy

Use `storageAdapter` (`src/lib/storage/StorageKeyAdapter.ts`) for localStorage access:

- Read from canonical keys first, fall back to legacy keys.
- Write only to canonical keys.
- Never delete legacy keys without an explicit migration plan.
