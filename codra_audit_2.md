UX Audit: Cognitive Load & Interaction Logic
This audit assesses whether the underlying logic, architecture, and flow control of Codra support a low-friction, calm experience. It focuses on the mental model and cognitive effort required to navigate the application.

1. Identified Issues
   [P0] Fragmentation of Workspaces (Core Flow Collision)
   Location:

App.tsx
,

ExecutionDeskPage.tsx
,

DeskWorkspacePage.tsx
Category: Flow / Interaction Severity: P0 Problem: There are two distinct workspace architectures (/workspace and /production) that fulfill similar roles but use different UI metaphors and implementation logic. Users must choose between an "Execution Desk" and a "Desk Workspace" without a clear functional distinction. Cognitive impact: High mental friction as users must learn two sets of navigation patterns, shortcuts, and layout constraints for the same core task. Root cause (technical): Redundant route definitions and parallel development of UI paradigms (

ExecutionDesk
vs DeskCanvas) that have not been unified. Proposed fix: Deprecate

ExecutionDeskPage
in favor of a unified

WorkspacePage
that uses the DeskSwitcher and DeskCanvas architecture. Consolidate layout logic into a single responsive shell. Dependencies: Refactor of

useSupabaseSpread
to handle both view types seamlessly.

[P1] Metaphorical Overload (Naming Mismatch)
Location:

domain/types.ts
,

ExecutionDeskPage.tsx
, UI Labels Category: Data model / Complexity Severity: P1 Problem: The app uses heavy metaphors ("Tear Sheet", "Spread", "Lyra", "Desk", "Proof") that don't always map cleanly to standard web production tasks. For example, "Tear Sheet" was rebranded to "Project Context" in some places but persists in code and comments. Cognitive impact: Users must maintain a large translation table in their minds to map system terms to their actual work products. Root cause (technical): Incomplete rebranding and attachment to a specific aesthetic metaphor that overpowers functional clarity. Proposed fix: Standardize around "Project" and "Artifact / Document" for primary entities. Rename "Tear Sheet" to "Context" globally. Use "Review" instead of "Proof" to align with standard production terminology while maintaining a professional tone. Dependencies: Global grep and replace of legacy terms in code and UI.

[P1] Automatic Side-Effect Complexity (Surprising Behavior)
Location:

ExecutionDeskPage.tsx
(useEffect blocks) Category: State management / Flow Severity: P1 Problem: Crucial domain objects like

Spread
and

TaskQueue
are generated automatically via side-effects upon landing on the workspace page. If generation fails, a "fallback" is silently created. Cognitive impact: "Magic" generation makes the system feel unpredictable. Users don't know why a specific set of tasks appeared or why their project looks the way it does. Root cause (technical): Business logic (generation engine) is triggered by component mounting rather than explicit user actions or stable backend states. Proposed fix: Move generation logic to an explicit "Initialize Project" or "Plan Execution" step in the onboarding or workspace header. Replace automatic generation side-effects with a "Draft" status that requires user confirmation. Dependencies: Update

useSupabaseSpread
to handle distinct "Draft" and "Live" states.

[P2] Inconsistent Saving Feedback (UI Lag)
Location:

hooks/useSupabaseSpread.ts
Category: State management / Feedback Severity: P2 Problem: The hook implements an offline queue and optimistic updates, but the UI feedback for "Saving..." is inconsistent across different pages. The ConnectionIndicator is tucked away and doesn't explicitly link to data durability. Cognitive impact: Users feel anxiety about whether their latest edits are "safe," especially when switching between the Ivory-styled

ExecutionDesk
and the Bauhaus-styled

DeskWorkspace
. Root cause (technical): Decoupled saving logic in hooks with no centralized "Ledger Status" component. Proposed fix: Implement a persistent, calm "Ledger Status" in the workspace header (e.g., "All changes saved locally," "Syncing 2 updates..."). Centralize save status in a shared store (useFlowStore). Dependencies: Integration of

useSupabaseSpread
status into useFlowStore.

[P2] Interaction Ambiguity (Shortcut Discovery)
Location:

ExecutionDeskPage.tsx
,

DeskWorkspacePage.tsx
Category: Interaction / Accessibility Severity: P2 Problem: Keyboard shortcuts (Cmd+E, Shift+S) are powerful but completely invisible in the UI. There is no central command palette or shortcut guide. Cognitive impact: High cost to move from "novice" to "expert" state; users must guess or remember shortcuts found in documentation. Root cause (technical): Ad-hoc keyboard event listeners in page components. Proposed fix: Create a "Shortcuts" hint overlay or tooltips for icons that display their key bindings. Centralize shortcut management to prevent conflicts between different page architectures. Dependencies: Shared shortcut management hook.

2. System-Level Recommendations
   Guiding Principles for Low-Cognitive-Load Logic
   Source of Truth Transparency: Every piece of data should have a clear origin (e.g., "Inferred from Brand Guidelines" or "Manually entered").
   Predictable Persistence: "Ledger-like" durability. The app should feel like a physical book where marks are permanent once made, with explicit "Undo" instead of "Save/Cancel".
   One Path, One Workspace: Remove redundant routes. If multiple views exist, they must be explicit toggles within a single workspace shell, not different routes with different logic.
   Complexity Budget
   The "Quiet Page" Rule: No screen should expose more than 3 parallel active decisions. Use progressive disclosure to bury advanced model settings (temperature, provider) unless explicitly requested.
   Enforcement: Introduce a "Complexity Guard" in the component props that flags if a screen exceeds a defined number of interactive elements.
3. Implementation Roadmap
   Phase 1: Core Mental Model & State Cleanup (The "Stable Foundation")
   Refactor

useSupabaseSpread
: Centralize saving, conflict, and offline status into a single, robust hook with clear outward-facing statuses.
Unify Workspace Routes: Merge

ExecutionDeskPage
and

DeskWorkspacePage
into a single /p/:projectId/workspace route with a standard layout.
Standardize Naming: Perform a system-wide rename of

TearSheet
->

Context
and

Spread
-> Ledger / Document.
Phase 2: Interaction and Error Logic (The "Calm Interaction")
Explicit Generation: Remove automatic useEffect generation. Add an "Architecture Scan" or "Initialize" step that users explicitly trigger.
Normalize Actions: Standardize all primary buttons and icons. Ensure every destructive action has a centered, calm "Undo/Rollback" affordance.
Ledger Status Bar: Add a global saving/connection indicator that speaks the language of a journal ("Permanent Record Updated").
Phase 3: Complexity & Progressive Disclosure (The "Quiet Expert")
Shortcut Discovery: Add subtle key-binding hints to UI elements.
Advanced Mode: Hide model parameters and cost breakdowns under a "Technical Details" drawer.
Edge Case Grace: Refine the "Fallback Spread" logic to be a helpful "Empty State Generator" rather than a silent failure recovery.
