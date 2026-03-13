# Cognitive Load Audit: Codra

**Auditor:** Senior UX Engineer & Cognitive Load Lead
**Date:** January 17, 2026
**Status:** Initial Audit

---

## 1. Task and Flow Structure

### Issue: The Gap between Work-Plan and Work-Product

- **Location:** `src/new/routes/ExecutionDeskPage.tsx`
- **Category:** Flow / State
- **Severity:** P0
- **Problem:** The user must mentally map "Tasks" (in the right-hand Proof/Queue panel) to "Sections" (in the center Execution Surface). When a task runs, its output eventually populates a section, but the relationship is implicit and requires constant scanning between columns.
- **Cognitive impact:** Increases split-attention effect. User has to hold the task's intent in mind while waiting for the section to update, then verify they are looking at the right artifact.
- **Root cause (technical):** `SpreadTask` and `SpreadSection` are separate domain objects synced via separate database tables. The UI renders them in separate, non-aligned layout columns.
- **Proposed fix:** Introduce a **unified "Work Block"** component that visually binds a Task to its corresponding Section. In the center surface, instead of just showing `OutputDocument`, show a `WorkUnit` that includes the pending/running task status if the section is not yet "Ready".
- **Dependencies:** Refactor of `ExecutionSurface` and `TaskQueuePanel`.

---

## 2. State management and feedback logic

### Issue: Brittle State Initialization and Sync

- **Location:** `useSupabaseSpread.ts` and `ExecutionDeskPage.tsx`
- **Category:** State
- **Severity:** P1
- **Problem:** The page rely on multiple `useEffect` hooks to move data from the loading hook into local state, then into the UI. There is a risk of "state tearing" where the `spread` and `taskQueue` get out of sync during concurrent updates or network blips.
- **Cognitive impact:** "Phantom" states—user sees a loading spinner or old data and doesn't know if the system has caught up. Teammate changes are shown as a notification but not automatically integrated, forcing a manual mental "refresh".
- **Root cause (technical):** Lack of a single source of truth for the "Project Working State". Data is loaded into a flat object in the hook but then duplicated into local states in the page.
- **Proposed fix:** Move the core "Project Working State" into the `useSpread` hook completely, using a reducer or `zustand` to manage the transition between `Loading` -> `Ready` -> `Saving` -> `Conflict`. Remove local state duplication in `ExecutionDeskPage`.
- **Dependencies:** Refactor of `useSupabaseSpread`.

---

## 3. Data structures and naming

### Issue: "Execution Desk" vs "Quiet Manuscript" Dissonance

- **Location:** Global naming convention (`ExecutionDeskPage`, `ProductionDeskId`)
- **Category:** Data model
- **Severity:** P1
- **Problem:** The internal naming (`Execution`, `Desk`, `Task`) is high-energy and "operational," which conflicts with the intended "Quiet, manuscript/ledger/journal" feel.
- **Cognitive impact:** Symbolic friction. The user's mental model is "I am writing a report," but the UI says "Execute Task on the Production Desk." This creates a subtle sense of being a "cog in a machine" rather than an "expert at a workbench."
- **Root cause (technical):** Evolution of the project from a "Chat-with-agents" model to a "Work-bench" model without a complete nomenclature refactor.
- **Proposed fix:** Rebrand internal and user-facing concepts to align with "The Workbench" or "The Atelier".
  - `ExecutionDesk` -> `Workbench`
  - `Task` -> `Motion` or `Stage`
  - `Proof Panel` -> `Observation Deck` or `Verification Roll`
- **Dependencies:** Significant renaming effort across types, routes, and components.

---

## 4. Interaction logic and affordances

### Issue: Overloaded "Proof" Panel

- **Location:** `src/new/components/workspace/ProofPanel`
- **Category:** Interaction
- **Severity:** P1
- **Problem:** The right-hand column is doing too much: it shows the Task Queue (inputs), the Execution status (running), and the Verification results (outputs).
- **Cognitive impact:** Conceptual clutter. The user has to filter "what I'm about to do" from "how the system is doing it" and "what the system verified."
- **Root cause (technical):** Attempt to keep the three-column layout "stable" by forcing all auxiliary information into the right column.
- **Proposed fix:** Separate "Intent" from "Verification". Move the "Task Queue" (Intent) into a collapsible list at the bottom of the center surface (linear flow) or a specific "Plan" view. Keep "Proof" strictly for verification and technical logs.
- **Dependencies:** Layout refactor in `ExecutionDesk`.

---

## 5. Error handling and edge cases

### Issue: Opaque AI Generation Failures

- **Location:** `ExecutionDeskPage.tsx` -> `handleRunTask`
- **Category:** Error handling
- **Severity:** P1
- **Problem:** When an AI task fails, the error is caught and shown as a toast. The UI state resets or stays in "failed".
- **Cognitive impact:** Mental debugging. The user is left wondering "Did it fail because of my prompt? The model? The network?" without a clear remediating action besides "Retry".
- **Root cause (technical):** Errors are treated as transient UI notifications rather than first-class domain states.
- **Proposed fix:** Implement **"Degraded State"** components for sections. If a task fails, the section should render a "failed" state with the specific error and a "Refine & Retry" button that opens a contextual edit view.
- **Dependencies:** New `ErrorState` component for sections.

---

## 6. Progressive disclosure and complexity control

### Issue: Budget & Cost over-exposed

- **Location:** `ExecutionDeskFooter.tsx`
- **Category:** Complexity
- **Severity:** P2
- **Problem:** Session cost and task counts are always visible in the footer.
- **Cognitive impact:** Financial anxiety. In a "quiet ledger" app, cost is an "audit" concern, not a "writing" concern. Constant visibility makes every click feel like a spending decision.
- **Root cause (technical):** Design choice to be "transparent" about AI costs.
- **Proposed fix:** Hide session cost by default in the footer. Only show "Budget status" as a quiet indicator (e.g., a simple color dot or a "ledger" icon that reveals details on hover). Move specific cost audits to the "Settings/Audit" modal.
- **Dependencies:** CSS/UI update to `ExecutionDeskFooter`.

---

## System-level Recommendations

### 1. The "Single Source of Truth" Principle

Every piece of state (is it loading? is it saved?) should derive from a single "Project State Machine". Components should never manually manage "saving" or "loading" flags for global entities.

### 2. Physicality of Movement

The UI should reflect a linear progression: **Plan -> Generate -> Verify**. These three should feel like physically distinct but connected spaces.

### 3. Complexity Budgeting

No view should expose more than **3 primary choices** at once. (e.g., on the Execution Desk: 1. Which section am I looking at? 2. What's the current task? 3. Is it verified?).

---

## Implementation Roadmap

### Phase 1: Mental Model & Vocabulary (Low Effort / High Impact)

- [ ] Rename "Execution Desk" to "Workbench".
- [ ] Consolidate `Spread` and `TaskQueue` into a single `WorkspaceState`.
- [ ] Centralize execution logic into a custom hook.

### Phase 2: Sequential Logic & Clarity (Medium Effort)

- [ ] Implement the "Work Block" unified view in the center surface.
- [ ] Add explicit "Pending Output" placeholders to sections.
- [ ] Redesign footer to reduce financial noise.

### Phase 3: Error & Multi-user Polish (Medium Effort)

- [ ] Build first-class "Degraded State" sections.
- [ ] Implement auto-refresh or "Merge Incoming" quiet alerts for multi-user sync.
