Executive Summary

- Visual system drifts toward modern SaaS (glass panels, pills, cards,
  gradients, shadows) in core flows, breaking the manuscript/ledger language
  and eroding consistency.
- Color governance is breached across tokens and UI (coral/teal/emerald/red/
  blue), so gold is not rare and status cues depend on color.
- Navigation and IA are fragmented: different headers, naming systems, and
  modes across Projects, Workspace, Context, and Studio make orientation and
  return paths unclear.
- Typography hierarchy is underpowered (tiny 9–11px, low opacity) and
  inconsistent across screens, reducing readability and accessibility.
- Interaction patterns are button‑centric with filled CTAs, badges, and pill
  tabs, rather than typographic cues and ruled structures.

Guiding principles for the improved experience:

- One navigation mental model: Project > Desk > Context > Archive.
- Typography and rules create hierarchy; shapes and shadows do not.
- Gold appears only for rare emphasis or critical markers.
- Actions read like marginalia and inline links, not buttons.
- Pages feel like a ledger spread: calm, aligned, and ruled.

System-Level Recommendations

- Information architecture
- Guideline: Normalize section naming and routes into a single model
  (Projects, Workspace/Desk, Context, Archive, Settings).
- Guideline: Keep Workspace, Context, and Studio as tabs in the same header
  with identical placement and labeling.
- Example: “Projects” list -> “Project Desk” (workspace) -> “Context” ->
  “Archive” -> “Settings”.
- Layout & spacing
- Base spacing scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Page margins: 32–40px desktop, 20–24px mobile; consistent top rhythm (32/48)
  between sections.
- Column rules: main text column 680–760px; marginalia column 200–240px for
  actions/metadata.
- Line length: 60–72 characters for body, 40–55 for notes.
- Typography
- Roles: Ledger Title (28/32), Section Heading (18/22), Entry Label (12/16,
  small caps), Body (14/20), Note (12/18), Micro (11/16).
- Use serif for titles/section headings and clean sans for body; mono only for
  IDs and timestamps.
- Avoid opacity below 60% for primary information.
- Affordances and actions
- Primary actions: underlined text or margin “action labels” (e.g., “Add
  entry” in right margin).
- Secondary actions: inline links with thin rule underline; hover shows subtle
  underline or rule darkening.
- Destructive actions: explicit label + confirmation line; optional gold
  marker for irreversible actions.
- Color & states
- Default: Ivory canvas, Ink text, rules at 10–15% Ink.
- Hover: subtle ivory darkening or rule emphasis; no filled buttons.
- Active/Focus: gold rule or caret only on selected item; avoid gold fills.
- Error/Success: use Ink with a left rule + explicit label; do not rely on
  color alone.
- Contrast: minimum 4.5:1 for body text, 3:1 for UI controls and borders.

Detailed Issue Log (table)

| Location | Category | Severity | Problem description | Root cause | Proposed
fix | Notes |
|---|---|---|---|---|---|---|
| src/lib/design-tokens.ts | Visual | P1 | Token palette includes coral/teal/
magenta and “glass” effects, conflicting with Ink/Ivory/Gold system. | Legacy
palette used as default tokens. | Deprecate non‑system accents; create
semantic tokens that map to Ink/Ivory/Gold only. | Requires new token set. |
| src/styles/generated-tokens.css | Visual | P1 | Multiple primary/brand
colors and button colors violate gold‑as‑rare‑accent. | Auto‑generated tokens
mirror broad palette. | Regenerate with constrained palette; remove coral/teal
as default accent. | Token regeneration. |
| src/components/ui/Button.tsx | Interaction | P1 | Primary button uses coral
fills and hover states, creating button‑centric UI. | Component defaults to
CTA style. | Replace primary with typographic action variants (underlined
text, margin action). | New action component. |
| src/new/components/shell/WorkspaceHeader.tsx | Visual | P1 | Glass panel
header with pill tabs reads as SaaS. | Glass panel and pill nav reuse. |
Replace with flat ivory header, thin rules, and underlined tab labels. |
Layout primitive update. |
| src/new/routes/ProjectContextPage.tsx | Visual | P1 | Header uses glass +
pill nav + zinc palette, diverging from system. | Separate styling per page. |
Align with same header primitive and Ink/Ivory palette. | Shared header
component. |
| src/new/routes/SettingsPage.tsx | Visual | P1 | Card wall with shadows and
color badges creates dashboard look. | Layout built from cards and CTA
buttons. | Convert sections to ruled lists with section headers and inline
actions. | Layout refactor. |
| src/new/routes/CoherenceScanPage.tsx | Visual | P2 | Severity badges use
red/orange/blue fills; heavy iconography. | Status colors tied to audit types.
| Use text labels + rule styles; reserve gold for critical flags only. |
Status token update. |
| src/new/components/workspace/TaskQueuePanel.tsx | Visual/Accessibility | P1
| Status badges rely on color; Run/Cancel buttons are filled and
high‑contrast. | SaaS status pattern. | Replace badges with inline status text
and rule marks; actions as links. | UI pattern update. |
| src/new/components/workspace/ProofPanel.tsx | Visual/Accessibility | P1 |
Colored dots (green/red/amber) + 9–11px text reduce accessibility. | Color-
coded status mapping. | Use text labels with icons and 12–14px; avoid opacity
below 60%. | Typography update. |
| src/new/components/workspace/ExecutionDesk.tsx | Visual | P2 | Center column
uses white background while side columns use ivory. | Default background set
to white. | Standardize ivory canvas; use “paper” panels only for output
documents. | Surface token update. |
| src/new/components/workspace/OutputDocument.tsx | Visual | P2 | output-
document class has no styling, so documents lack visual boundaries. | Missing
CSS definition. | Add ruled boundaries and margins (top/bottom rule, subtle
inset). | New CSS. |
| src/new/routes/ProjectsPage.tsx | Interaction | P1 | Import flow reloads the
page after parsing; no inline confirmation or open action. | Placeholder
import behavior. | Update state in-place and offer “Open imported project”
action. | Logic update. |
| src/new/routes/onboarding/steps/StepProjectInfo.tsx | Visual | P2 | Emoji
icons and card‑like selectors feel playful, not ledger‑like. | Onboarding
style borrowed from SaaS. | Replace emojis with typographic labels and
rule‑based selection states. | UI update. |
| src/new/routes/onboarding/steps/StepAddContext.tsx | Accessibility | P2 |
Drop zone is a clickable div; keyboard and screen reader flows are weak. |
Custom drop zone. | Convert to labeled input with focus states and clear link
action. | Component update. |
| src/new/routes/onboarding/steps/StepGeneratingNew.tsx | Visual | P2 |
Success and error states use emerald/red fills and large badges. | Status
colors from generic palette. | Use Ink text + rule + explicit label; gold for
rare emphasis only. | Status token update. |
| src/components/auth/LoginForm.tsx | Visual | P2 | Split hero with gradient
and shadowed logo clashes with manuscript feel. | Marketing-style auth layout.
| Shift to ivory page, ruled sections, and typographic branding. | Layout
rewrite. |
| src/new/components/shell/WorkspaceHeader.tsx | Accessibility | P1 | Dropdown
menus lack keyboard navigation and ARIA menu semantics. | Click-only menu
logic. | Implement menu component with focus trap, ESC close, and aria-\*
roles. | New menu primitive. |
| src/new/routes/SettingsPage.tsx | Accessibility | P2 | Toggle uses Button
without switch semantics. | Custom toggle design. | Replace with native
checkbox or ARIA switch + visible label. | Component update. |
| src/new/routes/ProjectsPage.tsx | Accessibility | P2 | 11px, 35% opacity
metadata is too low contrast. | Opacity used for hierarchy. | Raise to 12px
with 60–70% opacity; use rules for hierarchy. | Typography tokens. |
| src/new/components/ui/Button.tsx | Interaction | P2 | Active scale and heavy
shadows create tactile button feel. | Default motion and shadow tokens. |
Remove scale/shadow for actions; use underline/weight change only. | Motion
token update. |

Per‑Screen / Per‑Flow Notes

- Projects registry
- Current: clean list with thin rules, but actions read as buttons and import
  reloads the app.
- Top issues: CTA styling, low‑contrast metadata, disruptive import behavior.
- After: a ledger list with inline “Open” and “Create” actions in the margin;
  import updates in place.
- Onboarding (New Project)
- Current: card/grid selections, emoji icons, fixed bottom CTA.
- Top issues: card‑wall feel, button‑centric actions, mixed copy (“Open next
  step”).
- After: step content reads like a form in a journal, actions in the right
  margin, consistent verbs.
- Workspace / Execution Desk
- Current: strong three‑column layout but with white center, glass header,
  pill nav.
- Top issues: header system mismatch, button‑centric tools, color‑coded
  status.
- After: a calm ledger spread with ruled tabs, ivory surfaces, and typographic
  status markers.
- Project Context
- Current: zinc palette, glass header, pill nav, card sections.
- Top issues: inconsistent palette, inconsistent nav, card‑wall hierarchy.
- After: context reads like a dossier with section rules and clear edit
  affordances.
- Settings
- Current: dashboard cards with shadows, accent colors, and CTA buttons.
- Top issues: visual system drift, accessibility of toggles, color overuse.
- After: structured ledger sections with inline toggles and minimal ornament.
- Coherence Scan
- Current: badge‑heavy severity and vivid color system.
- Top issues: reliance on color, heavy iconography, card‑like grouping.
- After: audit report reads as a report: headings, numbered findings, ruled
  severity labels.
- Login / Auth
- Current: marketing hero and gradient aesthetic.
- Top issues: mismatch to product’s manuscript language, inconsistent
  typography.
- After: minimal, typographic sign‑in with clear rules and ivory canvas.

Implementation Roadmap

- Phase 1 – Foundations (tokens + primitives)
- Tasks: constrain palette to Ink/Ivory/Gold; define ruled surfaces; add menu/
  action primitives; update typography roles and sizes.
- Impact: establishes consistent system for all screens; reduces visual drift.
- Effort: High.
- Phase 2 – Critical flows
- Tasks: refactor Workspace header + tabs, Projects registry + import,
  Onboarding steps, Task Queue/Proof statuses.
- Impact: primary journeys feel coherent, readable, and aligned with ledger
  language.
- Effort: Medium–High.
- Phase 3 – Long tail & refinement
- Tasks: Settings layout, Coherence Scan report styling, Auth screens, copy/
  label pass, accessibility polish.
- Impact: removes remaining SaaS patterns and improves learnability.
- Effort: Medium.
