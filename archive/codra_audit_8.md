Implementation Plan: Cognitive Load Reduction
This plan addresses several key friction points identified in the UX audit, focusing on unifying the project state and aligning the application with its "Quiet Manuscript" design goal.

User Review Required
IMPORTANT

Rename "Execution Desk" to "Workbench" This is a significant nomenclature shift. It affects routes, variable names, and UI labels. The goal is to move away from "high-energy" operational terms towards a more "calm workbench" feel.

IMPORTANT

Unifying Spread and TaskQueue state Currently, the UI manages two separate objects. We propose merging these into a single WorkspaceState to reduce the split-attention effect.

Proposed Changes
Core State & Domain
[MODIFY]
types.ts
Add WorkspaceState interface that encapsulates
Spread
,
TaskQueue
, and ConnectionStatus.
Rebrand
SpreadSection
context where appropriate.
[MODIFY]
useSupabaseSpread.ts
Refactor to return a single unified state object.
Simplify state management logic by moving orchestration into the hook.
Workspace UI
[MODIFY]
ExecutionDeskPage.tsx
Rename to WorkbenchPage.tsx (and update routing).
Refactor to use the unified useWorkspaceState hook.
Implement "Work Block" logic where pending tasks are shown in-line with their target sections.
[MODIFY]
ExecutionSurface.tsx
Update to handle the showing of "Pending" sections.
[MODIFY]
ExecutionDeskFooter.tsx
Rebrand to WorkbenchFooter.tsx.
Hide detailed cost metrics behind a "Ledger" icon to reduce cognitive noise.
Logic & Orchestration
[NEW]
useWorkflow.ts
A new hook to centralize the logic currently in handleRunTask (validation, execution, timers, analytics). This decouples the view from the heavy business logic.
Verification Plan
Automated Tests
Run npm run test to ensure existing domain logic remains intact.
Add new unit tests for useWorkflow hook to verify state transitions (Pending -> Running -> Complete/Failed).
Manual Verification
Open the new "Workbench" and verify that starting a task shows a clear placeholder in the center execution surface.
Check that the footer is less "noisy" by default.
Verify that teammate updates are integrated more smoothly.
