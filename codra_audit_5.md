# CODRA: COMPREHENSIVE DESIGN SYSTEM & UX AUDIT

**Conducted by:** Senior Product Designer + UX Systems Auditor
**Date:** January 2025
**Scope:** End-to-end design system integrity, visual language consistency, and UX patterns
**Baseline Constraint:** Ink & Ivory + Gold accent visual language with manuscript/ledger/journal aesthetic
**Current Status:** Design system is architecturally sound but UI implementation diverges from stated aesthetic

---

## EXECUTIVE SUMMARY

### Most Important Systemic Problems

1. **Card-Wall Creep** (P0): The app leans heavily on `GlassPanel` components styled as elevated cards/containers. This violates the core constraint of "no card wall UI." The layout feels like a glossy SaaS dashboard, not a manuscript or ledger.

2. **Button-Centric Actions** (P0): Primary affordances are expressed through colored pill buttons (e.g., "CONNECT GITHUB", "NEXT"), not through typographic cues or inline underlined actions. This contradicts the "button-free" goal.

3. **Accent Color Chaos** (P1): Gold is specified as the rare accent, but screenshots show cyan, orange, and gold used interchangeably as primary UI colors. Theme system defines these, but enforcement is weak.

4. **Weak Typography Hierarchy** (P1): Only 4 typographic roles defined (pageTitle, sectionHeading, body, meta). A manuscript/ledger system requires finer granularity: display, H1–H3, subheading, body, accent label, micro, note, margin text.

5. **Navigation Pattern Inconsistency** (P1): Task workspace uses cyan pill-badge tabs ("ART & DESIGN", "ENGINEERING"). This is trendy-SaaS, not manuscript. No clear "marginalia" or side-note navigation patterns.

6. **Missing Manuscript Fundamentals** (P1): No heavy reliance on lines, rules, and borders as hierarchy-makers. No marginalia (side annotations, notes). Spacing alone is insufficient; structure needs typographic rules.

7. **First-Run Experience Void** (P0): No onboarding guidance, empty state messaging, or contextual prompts. Users land on a blank workspace with no sense of what to do or how the system works.

### Guiding Principles for Improved Experience

1. **Typography as Primary Affordance** – Underlines, small caps, margin annotations, and inline links replace colored buttons. Gold is reserved for critical emphasis only.

2. **Rules Over Cards** – Horizontal and vertical rules (subtle borders, dividing lines) create structure and hierarchy, not rounded containers with shadows.

3. **Ledger-Like Simplicity** – Clean, structured, columnar layouts with clear hierarchy. Think of a well-designed printed journal: clear hierarchy, restful whitespace, and purposeful typography.

4. **Marginalia and Side Notes** – Secondary information, actions, and guidance live in margins or asides, not in overlays or modal cards.

5. **One Navigation Mental Model** – Consistent patterns for moving between sections, states, and content. No pill-badge tabs competing with header navigation.

6. **Gold-Only Emphasis** – Gold accents mark critical states (approval, urgent action, key milestone) or rare highlights. Never used as default UI chrome.

7. **Institutional Calm** – No gradients, heavy shadows, or motion gimmicks. Restful, grounded, trustworthy aesthetic that invokes professional journals and manuscripts.

---

## PART 1: SYSTEM-LEVEL RECOMMENDATIONS

### 1. Information Architecture

#### Recommended Section Structure

Organize the app into distinct "ledger sections," each with clear mental models:

```
Primary Ledger (Projects List)
  ↓
Active Project Workspace
  ├─ Context Ledger (project context/metadata)
  ├─ Execution Surface (active tasks, outputs)
  ├─ Proof Panel (verification, review results)
  └─ Lyra Column (conversational guidance)

Secondary Ledgers:
  ├─ Coherence Scan (audit results)
  └─ Asset Inventory (if enabled)
```

**Key Rules:**

1. **Project Context is the source of truth.** All spreads, task queues, and outputs derive from it. Make this relationship explicit in navigation.

2. **Three-column pattern is correct.** Left (Lyra input), center (execution), right (verification). This is a strong mental model. Do NOT add more columns or panels.

3. **Workspace is a "ledger entry."** When a user opens a project, they are viewing a single, evolving ledger entry. All edits persist to that entry. No drafts/versions until user explicitly "approves."

4. **Marginalia lives in left and right columns.** Lyra (left) provides guidance. Proof panel (right) shows validation. Don't duplicate this in modals.

5. **Task queue is a sub-ledger.** Within execution surface, tasks are list items with state (pending → running → complete/error). Each task is also an "entry" with output that can be edited.

**Naming Conventions:**

- Use institutional, calm names: "Project Context," "Execution Surface," "Proof Panel," not "Dashboard," "Canvas," "Inspector."
- Labels should be small caps or sentence case, never shouty caps.
- Section headers use a single rule line below (or subtle border).

---

### 2. Layout & Spacing System

#### Base Spacing Scale

Define a 4px base unit:

```
0 = 0px
1 = 4px
2 = 8px
3 = 12px
4 = 16px (paragraph spacing)
6 = 24px (section spacing)
8 = 32px (major section)
12 = 48px (page margins)
16 = 64px (full-page gaps)
```

#### Application Rules

| Context | Spacing | Example |
|---------|---------|---------|
| Page margins (top/bottom/sides) | 12 (48px) | Main content area breathing room |
| Column gutters | 6–8 (24–32px) | Space between Lyra, center, Proof |
| Block spacing (between sections within a column) | 4–6 (16–24px) | Space between "Context" and "Deliverables" sections |
| Inline spacing (within a row/field) | 2–3 (8–12px) | Space between label and input; icon and text |
| Line spacing (text) | 1.5x font size | Ensures readability and manuscript feel |
| Column width | 300–400px (side) / 600–800px (center) | Respects manuscript line lengths |

#### Rules for Maximizing Readability

1. **Manuscript line length:** Content columns should be 600–800px wide (50–75 characters per line).
2. **Marginalia width:** Side columns (Lyra, Proof) should be 300–400px.
3. **Negative space:** Use at least 20% of visible space as pure whitespace. Don't fill every corner.
4. **Rule lines:** Use subtle 1px horizontal rules (opacity: 0.1–0.2) between major sections instead of padding alone.

---

### 3. Typography System

#### Typographic Roles

Define these roles explicitly (not just "heading" and "body"):

| Role | Font Size | Font Weight | Line Height | Usage | Example |
|------|-----------|-------------|-------------|-------|---------|
| **Ledger Title** | 32px | 600 (semibold) | 1.2 | Page title, major section | "AI Playground" |
| **Section Heading** | 18px | 600 (semibold) | 1.3 | Section header (Deliverables, Context, etc.) | "PRODUCTION CONTEXT" |
| **Subheading** | 14px | 600 (semibold) | 1.3 | Sub-section label | "PRIMARY SEGMENT" |
| **Body** | 14px | 400 (normal) | 1.6 | Main content text | Description, form input labels |
| **Label** | 12px | 500 (medium) | 1.4 | Field labels, metadata | "TARGET AUDIENCE" |
| **Note/Caption** | 12px | 400 (normal) | 1.4 | Footnotes, explanatory text | "Optional field" |
| **Micro** | 11px | 500 (medium) | 1.3 | Status badges, timestamps | "DRAFT", "2m ago" |

#### Hierarchy in Practice

```
LEDGER TITLE
Large, bold, clear. Sets the page's purpose.

SECTION HEADING
Introduce major content blocks. Use rules above/below.

Subheading
Refines the section. Often sits beside content.

Regular body text flows here. 14px, 1.6 line height.
Renders comfortably for reading.

[Small label] supporting information or status

Fine print goes here. 11px, slightly lighter.
```

#### Typographic Constraints

1. **No more than 3 font sizes in a single view.** Ledger Title + Section Heading + Body is the core trio.
2. **Weight, not color, creates emphasis.** Use 600 (semibold) for headings, 400 for body. Avoid multiple weights in the same line.
3. **Avoid ALL CAPS unless for micro labels** (badges, micro text). Use sentence case for headings to maintain readability and institutional tone.
4. **Line length discipline:** Aim for 50–75 characters per line. Longer content should be in narrower columns.

---

### 4. Affordances and Actions (No Generic Buttons)

#### Principle: Typographic Affordance Over Color

Instead of:
```
[Primary Blue Button] [Secondary Gray Button]
```

Use:

```
Action text that is underlined and can be clicked
Larger font might be bolder or in small caps for primary emphasis

secondary action also underlined, smaller, lighter
```

#### Primary Action Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Underlined text link (body size)** | Common secondary actions | "Save draft", "Review changes", "Edit field" |
| **Small caps + underline (label size)** | Prominent but not critical | "APPROVE", "EXPORT", "VIEW" |
| **Small caps + gold underline (label size)** | Critical/irreversible actions | "EXECUTE APPROVAL", "DELETE PROJECT" |
| **Inline icon + underlined text (body)** | Actions with visual emphasis | "✓ Mark complete", "→ Next step" |
| **Marginalia buttons (Lyra/Proof sidebars)** | Contextual, secondary actions | "Refine this", "Review prompt", "Improve coherence" |

#### No Generic Buttons Rule

- ❌ Avoid pill-shaped buttons with solid background colors
- ❌ No oversized "NEXT →" primary CTAs in modals
- ❌ No rainbow badge tabs (e.g., cyan "ART & DESIGN", green "ENGINEERING")
- ✅ Use underlined links, small caps labels, margin actions

#### Destructive Actions

For actions that cannot be undone (e.g., "Execute Approval", "Delete Project"):

1. **Use gold underline** to signal criticality
2. **Require confirmation dialog** with explicit text: "This action cannot be undone. Are you sure?"
3. **No shortcuts or auto-triggering.** User must read and confirm.

---

### 5. Color & States System

#### Color Palette

```
PRIMARY BACKGROUND (Light Mode):
  Ivory: #F5F5F0 (main canvas)
  Off-White: #FAFAF8 (subtle tint for panels)

PRIMARY TEXT (Light Mode):
  Ink: #1A1A1A (body text)
  Ink-Secondary: #666666 (meta, labels)
  Ink-Tertiary: #999999 (disabled, hint)

ACCENT (Gold Only):
  Gold: #D4AF37 (primary accent for critical states)
  Gold-Light: #E8D4A8 (subtle highlights)
  Gold-Dark: #B8921F (hover, active states)

SEMANTIC COLORS:
  Success: #10B981 (emerald, for complete/verified)
  Error: #EF4444 (red, for failures)
  Warning: #F59E0B (amber, for caution)
  Info: #3B82F6 (blue, for information)

BORDERS & RULES:
  Rule (subtle): rgba(0, 0, 0, 0.08) (dividing lines)
  Border (input): rgba(0, 0, 0, 0.12) (input borders)
  Border (strong): rgba(0, 0, 0, 0.2) (focused, active inputs)
```

#### State Definitions

| State | Visual Treatment | Usage |
|-------|------------------|-------|
| **Default** | Ink text, ivory background, rule border | Normal form fields, text links |
| **Hover** | Text color slightly darker, background slightly lighter | Interactive elements on mouseover |
| **Active/Focused** | Ink text, gold underline or border | Focused input field, current section |
| **Disabled** | Ink-Tertiary text, 50% opacity | Locked fields, unavailable actions |
| **Success** | Emerald text + checkmark icon, gold highlight background (optional) | Task complete, validation passed |
| **Error** | Red text + error icon, subtle red background tint | Validation failed, task failed |
| **Loading** | Spinner (ink color), slightly lighter background | Async operation in progress |
| **Draft** | Amber/warning color label "DRAFT", no background tint | Unsaved changes, provisional state |
| **Approved** | Emerald label "APPROVED", subtle success background | Locked state, finalized |

#### Minimum Contrast Requirements

- Body text on backgrounds: 4.5:1 (WCAG AA)
- UI components (links, buttons): 3:1 minimum
- All text must be legible in both light and dark modes

---

### 6. Component Library Alignment

#### Glass Panel (Current Usage: Too Prevalent)

**Current:**
```jsx
<GlassPanel>
  <div>Content</div>
</GlassPanel>
```

**Problem:** Overuse as a container defeats the manuscript aesthetic. Every panel feels like a "card."

**Fix:**
- **Reduce usage.** Use GlassPanel only for truly elevated content (modals, floats, secondary panels).
- **Primary content should live on the ivory background** with rule dividers, not in containers.
- **When used:** Reserve for sidebar panels (Lyra, Proof) and modal overlays.

#### Button Component (Current Usage: Too Generic)

**Current:**
```jsx
<Button variant="primary">NEXT</Button>
```

**Problem:** Default button patterns. Looks like generic SaaS.

**Fix:**
- **Deprecate oversized primary buttons.**
- **Add new variants:**
  - `variant="link"` – Underlined text, no background. Default for secondary actions.
  - `variant="subtle"` – Underlined, small caps, label-sized. For more prominent actions.
  - `variant="critical"` – Underlined with gold, small caps. For destructive actions.
- **Restrict colored buttons** to utility actions (save, cancel) where needed.
- **All buttons should have `aria-label`** for accessibility.

#### New Typography Variants to Add

```tsx
const variants = {
  // Headings
  ledgerTitle: 'text-3xl font-semibold leading-tight',
  sectionHeading: 'text-lg font-semibold leading-relaxed',
  subheading: 'text-base font-semibold leading-relaxed',

  // Body
  body: 'text-sm font-normal leading-relaxed',
  bodySmall: 'text-xs font-normal leading-relaxed',

  // Labels & Meta
  label: 'text-xs font-medium leading-normal',
  labelSmall: 'text-[11px] font-medium leading-normal',
  note: 'text-xs font-normal leading-normal text-gray-600',

  // Special
  micro: 'text-[11px] font-medium uppercase leading-tight',
};
```

#### Spacing Utility Classes

Define reusable spacing classes:

```css
.spacer-2 { gap: 8px; }
.spacer-3 { gap: 12px; }
.spacer-4 { gap: 16px; }
.spacer-6 { gap: 24px; }

.section-gap { gap: 32px; }
.block-spacing { margin-bottom: 24px; }

.page-margin { padding: 48px; }
.column-gutter { gap: 24px; }
```

---

## PART 2: DETAILED ISSUE LOG

| Location | Category | Severity | Problem Description | Root Cause | Proposed Fix | Notes |
|----------|----------|----------|---------------------|-----------|--------------|-------|
| **Onboarding Modal** (Login screen) | Visual | P1 | White card with orange icon and black pill button looks generic SaaS, not manuscript. Violates Ink & Ivory palette. | Using standard modal card pattern; orange accent not gold. | Replace modal with full-page white background. Orange icon → gold or ink icon. Pill button → underlined link text "Next →". | Copy-only + styling change |
| **Task Workspace Tabs** (Art/Eng) | Visual + IA | P1 | Cyan pill-badge navigation tabs ("ART & DESIGN", "ENGINEERING") are trendy-SaaS and break the manuscript aesthetic. | Default UI component styling; no manuscript alternative designed. | Replace tabs with text-based navigation using underlines and rules. "ART & DESIGN" becomes smaller, underlined, with a subtle border below. | Requires new Tab component variant |
| **GlassPanel Overuse** | Visual + IA | P1 | Nearly every content area is wrapped in a GlassPanel container, creating a "card wall" feel. Violates no-card-wall constraint. | GlassPanel is the only container primitive available; designers defaulted to it. | Define rules: GlassPanel only in sidebars (Lyra, Proof) and modals. Primary content on ivory background with rule dividers. | Requires layout refactor |
| **Button Component Defaults** | Visual | P1 | Generic primary/secondary button variants with solid colors and rounded corners. No typographic link alternative. | Button.tsx only has solid-bg variants; no link/underline variant. | Add `variant="link"` (underlined text) and `variant="subtle"` (small caps, minimal bg). Deprecate "primary" for most use cases. | Component enhancement |
| **Accent Color Governance** | Visual | P1 | Cyan, orange, and gold used as primary UI colors across screens. Gold should be rare emphasis only. | Theme system allows multiple accent hues; enforcement is weak. UI uses theme colors instead of limiting to gold. | Audit all theme presets. Define that only "Editorial" and gold-aware presets are allowed. Replace cyan/orange with ink or gold. | Requires color refactor + enforcement |
| **Typography Hierarchy Weakness** | Visual | P1 | Only 4 typographic roles (pageTitle, sectionHeading, body, meta). Not enough nuance for manuscript aesthetic. | Typography.tsx has minimal variant library. | Add: ledgerTitle, subheading, label, labelSmall, note, micro roles. Define sizes and weights per guidelines above. | Token enhancement |
| **No Manuscript Rules/Borders** | Visual | P1 | Layout relies only on spacing and containers, not on rules/lines. Missing the "ledger page" visual language. | No CSS utilities for subtle rule lines; designers lean on containers instead. | Create utility classes: `.rule-below`, `.rule-above`, `.column-divider` for 1px borders. Use in place of padding/spacing. | Token + component enhancement |
| **Navigation Inconsistency** | IA | P1 | No clear mental model for navigation. Task workspace tabs, sidebar menu, header nav all compete. No marginalia pattern. | No unified navigation framework. Layouts are ad-hoc. | Define single nav model: Primary nav in left sidebar (Lyra column). Workspace-specific tabs only if truly necessary, using text + underlines. Right sidebar is for verification (Proof), not nav. | Architecture decision |
| **Empty State Messaging Missing** | UX | P0 | No guidance when workspace is empty, task queue is empty, or context is incomplete. Users don't know what to do. | No empty state components or messaging pattern. | Create empty state template: Icon + 1-line description + optional link ("Try adding a task..."). Use in ExecutionSurface, TaskQueue, LyraColumn when empty. | New component + messaging |
| **First-Run Onboarding Void** | UX | P0 | No walkthrough, tooltips, or guided experience for new users. Cold-start anxiety is high. | No FRE (first-run experience) component. Onboarding skips to workspace. | Add Shepherd.js tour or similar: "This is where Lyra helps you. This is your execution space. This is where outputs appear." Make optional (can dismiss). | New feature |
| **Save Feedback Missing** | UX | P1 | When user saves context changes or edits, no visual confirmation. User anxiety about data loss. | No toast notification or visual indicator on save. | Show inline checkmark + "Saved" label next to fields on success. Or toast: "Context updated." Include timestamp. | Component + logic change |
| **Modal Overuse** (Context, Settings, Export) | Visual + UX | P1 | Key workflows are hidden in modals (white cards that cover content). This breaks the manuscript/ledger aesthetic and discoverages content. | Modal components are convenient; default pattern for non-primary flows. | Convert modals to sidebars or full-page views where possible. Reserve modals only for confirmations or critical alerts. Context editing → full sidebar. Settings → right sidebar. | Layout refactor |
| **Pill-Shaped "Quick Action" Buttons** (Lyra column) | Visual | P1 | Quick actions in Lyra sidebar ("Review this prompt", "Improve coherence") use pill buttons. Should be text links. | Button component default styling. No link variant in Lyra component. | Make quick actions underlined text links, label-sized. Option: add subtle gold border on hover. | Copy change + variant update |
| **Form Input Styling** | Visual | P1 | Input fields likely have excessive padding and border radius (not reviewed in detail). Should be minimal: thin border, small padding, no rounded corners. | Default form styling in browsers; not explicitly minimized. | Define input tokens: 1px border, 4px padding, 0px border-radius (square corners). Font: label size (12px), normal weight. | Token definition |
| **No Confirmation Dialogs** (Approve, Delete) | UX | P1 | Irreversible actions (approve context, delete project) have no "Are you sure?" step. Risk of accidental data loss. | No confirmation pattern implemented. | Add confirmation dialog for critical actions: "This action cannot be undone. Are you sure?" Require explicit button click (not just pressing Enter). | UX pattern + component |
| **Lyra Column Layout** | Visual | P1 | Lyra (left sidebar) may have unclear hierarchy or overuse containers. Should feel like a note-taking margin. | No specific marginalia design pattern. | Redesign Lyra as a true marginalia: Small section header ("LYRA ASSISTANT"), then a conversational area, then "QUICK ACTIONS" with text links, not buttons. | Layout refactor |
| **Page Margins Inconsistent** | Visual | P1 | Margin spacing around page content likely varies. Should be uniform (48px on all sides). | No page-margin utility or strict constraint. | Define `.page-container` with `padding: 48px`. Apply to all major pages (ProjectContextPage, ExecutionDeskPage, etc.). | Utility + refactor |
| **Proof Panel Visual Hierarchy** | Visual | P1 | Right sidebar (Proof) may have unclear hierarchy or excessive containers. Should feel like a review ledger. | No specific design for how verification results are presented. | Redesign Proof panel: Clear section headers with rules, list-style results, status badges (small caps). No modal overlays for details. | Layout refactor |
| **Color Contrast in Dark Themes** | Accessibility | P1 | If dark theme is used, text contrast must meet WCAG AA (4.5:1). Likely not tested. | No explicit contrast audit against dark backgrounds. | Audit all text colors against backgrounds. Adjust ink colors if needed. Test with contrast checker (WebAIM). | Testing + token adjustment |
| **Font Size Consistency** | Visual | P1 | Some text may be too small (< 12px) or too large (> 18px) for readability. | Inconsistent font sizes in Typography.tsx. | Define minimum 12px for all body text. Headlines max 32px. Test readability at 125% zoom. | Token definition + testing |
| **Focus States & Keyboard Navigation** | Accessibility | P1 | Focus indicators may be missing or hard to see. Keyboard users cannot navigate. | Limited focus-state styling. No keyboard nav testing. | Add visible focus ring to all interactive elements (links, buttons, inputs). Use gold underline or 2px border. Test with keyboard-only navigation. | Focus state enhancement |
| **Line Length & Readability** | Visual | P1 | Content lines may exceed 75 characters, making reading harder. | No column width constraint or wrapper. | Define max-width: 800px for body text columns. Narrow side columns (Lyra, Proof): max-width 400px. Enforce with CSS wrapper. | Utility + constraint |
| **Hover & Active States Unclear** | Visual | P1 | Buttons and links may not have clear hover/active states. User unsure what's clickable. | No explicit hover/active styling defined per component. | Define: Hover = text color slightly darker + background slightly lighter. Active = gold underline. Focus = 2px gold ring. | Component enhancement |
| **Notification/Toast Styling** | Visual | P1 | Success/error messages likely use default toast styling. Should match manuscript aesthetic. | No custom toast component or styling. | Design minimal toast: small (12px text), bottom-right, Ink on ivory or ivory on ink. Use semantic colors (emerald for success, red for error) but minimal. | Component design |
| **Loading States Visual Feedback** | UX | P1 | Loading spinners, skeletons, and progress indicators may not exist or be minimal. | No explicit loading state components. | Add: Subtle spinner (ink color, not rainbow). Optional: skeleton loader (light gray striped bars). Progress indicator for long operations (e.g., "Generating spreads... 2/5"). | Component design |
| **Print Styles Not Considered** | Visual | P1 | If users want to print a spread or context, output likely doesn't look like a printed document. | No @media print styles. | Add print stylesheet: Ivory background, black ink, no shadows/effects, serif fonts for body. Output should look like a printed manuscript. | CSS enhancement |
| **Column Gutter Inconsistency** | Visual | P1 | Space between Lyra, center, and Proof columns may vary. Should be uniform (24–32px). | No constraint on column gaps. | Define `.column-gutter { gap: 24px; }`. Apply to main workspace layout. | Utility + refactor |
| **Dark Mode Toggle** | Visual | P1 | If dark mode exists, transition should be smooth and text contrast maintained. | Dark mode may not be properly tested against new design system. | Test all dark theme colors against backgrounds. Ensure gold is visible on dark backgrounds. Smooth transition animation (200ms). | Testing + refinement |
| **Responsive Design Breakpoints** | Visual | P1 | Mobile/tablet layouts may not respect manuscript aesthetic. Columns may stack awkwardly. | No defined responsive behavior. | Define: Desktop (3-col), Tablet (2-col: center + right), Mobile (1-col: center only). Ensure line length is respected on all sizes. | Layout constraint + testing |
| **SVG Icon Styling** | Visual | P1 | Icons from Lucide React may have inconsistent stroke widths or sizing. | No icon system defined. | Define: Icon sizes (16px, 20px, 24px). Stroke width 1.5px. Color: Ink by default, gold for critical states. | Token + usage guide |
| **Breadcrumb Navigation** | IA | P2 | No breadcrumb shown. Users may not know their location in the app. | No breadcrumb component or pattern. | Add breadcrumb above page title: "Projects > AI Playground > Context". Use small (12px), ink-secondary color. Clickable for back-navigation. | Component + UX pattern |
| **Anchor Links & Jump Navigation** | UX | P2 | No way to jump to sections in long pages (e.g., context page with many fields). | No anchor link pattern. | Add "Jump to section" links (small, top-right of page): "Target Audience", "Brand Constraints", "Success Criteria". Use small caps, underlined. | Navigation enhancement |
| **Status Badges** | Visual | P2 | Status indicators (DRAFT, APPROVED, RUNNING) may use pill badges or tags. Should be minimal. | No badge component; likely using default Tailwind. | Design minimal badge: small caps (11px), underlined text, no background. Only use color for semantic meaning: amber for DRAFT, emerald for APPROVED, blue for RUNNING. | Component design |
| **Section Rules & Dividers** | Visual | P2 | Sections may be divided by spacing only, no visual rule. Should use subtle 1px borders. | No rule-divider utility. | Create `.rule-below`, `.rule-above` utilities (1px border, opacity 0.1). Apply between major sections. | Utility design |
| **Linked Text Styling** | Visual | P2 | Hyperlinks may not be clearly distinguished (underline required). | Links may not have visible underline. | All links must have underline. Optional: gold underline for primary links, ink-secondary for secondary. | Styling constraint |
| **Form Label Placement** | Visual | P2 | Form labels may be above inputs (standard) but placement should be consistent. | No form component library. | Define: Labels above inputs (not inline). Label size 12px, medium weight. Input size 14px, normal weight. Gap between label and input: 8px. | Component design |
| **Disabled State Visibility** | Visual | P2 | Disabled form fields/buttons may not be visually distinct enough. | Disabled styling may only use opacity. | Disabled state: 50% opacity + ink-tertiary color. Optional: striped background pattern (very subtle). Cursor: not-allowed. | Styling constraint |
| **Whitespace Balance** | Visual | P2 | Pages may not have enough negative space. Every pixel feels used. | Designers pack content densely. | Enforce: min 20% of viewport as whitespace. Use rule dividers instead of more content. White space aids comprehension. | Design principle |
| **Onboarding Form Copy** | Copy | P2 | Form labels and helper text may be unclear (e.g., "Add Context (Optional)" — unclear if should skip). | Copy not user-tested. | Clarify: "Add Context (optional but recommended—helps Lyra understand your project better)". Add helper text below labels. | Copy refinement |
| **Error Message Clarity** | Copy | P2 | Error messages may be technical or unclear. | Errors likely echo API/validation messages. | Rewrite for plain language: Instead of "Invalid input: field 'audience' required", say "Please tell us who your target audience is." | Copy refinement |
| **Task Status Labels** | Copy | P2 | Task statuses may use unclear terms. Should be: Pending, Running, Complete, Error, Cancelled. | No consistent naming. | Define: "Pending" (not yet run), "Running" (in progress), "Complete" (done), "Error" (failed, can retry), "Cancelled" (user stopped). Use consistently. | Copy + UX standard |
| **Empty State Copy** | Copy | P2 | When workspace/queue/panel is empty, message may be generic or missing. | No empty state components. | Design: Icon + 1-line description ("No tasks yet—create your first task to get started"). Optional light link ("Learn more"). | Copy + component |

---

## PART 3: PER-SCREEN / PER-FLOW ANALYSIS

### Flow 1: First-Time User Onboarding

#### Current State
User signs up, sees an onboarding modal (white card, orange icon, pill button). Form is clean but no guidance on why they're doing this. User skips context (unclear if they should), waits on blank "generating" page, lands in workspace with no guidance on what to do.

**Top 3 Issues:**
1. **Onboarding modal violates aesthetic** – White card, orange icon, dark pill button = generic SaaS
2. **"Add Context (Optional)" is ambiguous** – User doesn't know consequences of skipping
3. **No guidance in workspace** – User lands and doesn't know what to click or how to use Lyra

#### After Design System Audit Applied
User enters a clean full-page form (ivory background, clear typography hierarchy). Title: "Create Your First Project." Helper text explains: "Tell us about your project. This information helps Lyra assist you." Context section has clear explanation: "Adding context is optional but recommended. It helps Lyra understand your goals." Generating page shows a subtle progress indicator with ETA. When workspace loads, a light tooltip appears: "Lyra is your AI assistant (left), your work appears here (center), and verification shows here (right). Dismiss this tour anytime." A "Quick Start" guide suggests first action: "Try telling Lyra about your audience."

---

### Flow 2: Editing Project Context

#### Current State
User navigates to context page (clean 2-column layout, good typography). Edits a field (e.g., "Target Audience"). Saves. No feedback. User unsure if changes persisted. Form shows validation errors in toasts, not inline.

**Top 3 Issues:**
1. **No save confirmation** – User has "Did it save?" anxiety
2. **Validation errors are toasts, not inline** – User must re-edit blindly
3. **"Draft" vs "Approved" not clearly explained** – User doesn't understand the revision model

#### After Design System Audit Applied
User edits field. Upon blur, a small checkmark appears next to the field: "✓ Saved". Field briefly highlights in soft gold. At page bottom, a persistent "DRAFT CONTEXT" badge (small caps, amber, underlined) indicates unsaved revision state. Inline validation: Fields with errors show 1px red underline + tooltip below ("This field is required"). Before "Execute Approval", a confirmation dialog: "This will lock your context as the source of truth. You can still edit after, but changes will create a new revision. Proceed?"

---

### Flow 3: Task Execution & Verification

#### Current State
Task execution is disabled (commented-out). User tries to click a task to run it; nothing happens. Center surface shows "Loading workspace..." indefinitely. Proof panel on right is empty.

**Top 3 Issues:**
1. **Core feature is disabled** – No task execution
2. **No progress feedback during generation** – User sees blank page
3. **Proof panel has no guidance** – User doesn't know what verification means

#### After Design System Audit Applied
Once task execution is re-enabled: User sees a task list in center (text + underlined "Run" links, not buttons). Clicking "Run" transitions task to "Running" state with spinner. Progress shown: "Processing... 2m remaining". Output appears below the task. Proof panel on right shows verification results: Section header "VERIFICATION", then list-style items ("✓ Matches audience", "⚠ Missing guardrail"). Status badges (small caps, minimal styling) indicate completeness.

---

### Flow 4: Lyra Conversational Guidance

#### Current State
Left sidebar (Lyra) shows assistant status and quick actions. Layout is unclear. "Quick Actions" may be buttons or text. Lyra column blends with workspace rather than feeling like marginalia.

**Top 3 Issues:**
1. **Lyra doesn't feel like marginalia** – It's another panel, not a note-taking space
2. **Quick action buttons are generic** – Should be text links
3. **No clear prompt mechanism** – User doesn't know how to ask Lyra something

#### After Design System Audit Applied
Lyra column is clearly a sidebar: Small section header "LYRA ASSISTANT" with small rule below. Below: A conversational area (text input at bottom, messages above). Then "QUICK ACTIONS" (label-sized, small caps). Each action is an underlined text link: "Review this prompt", "Improve coherence", "Suggest next step". Hovering shows subtle gold underline. Clicking opens an interaction. Empty state: "Ask me anything about your project, or try a quick action."

---

### Flow 5: Coherence Scan & Audit Results

#### Current State
Unclear (not fully reviewed in code). Likely a separate page with results in modal or list.

**Top 3 Issues:**
1. **Unknown visual treatment** – May not match design system
2. **Results presentation unclear** – "Blind spots", "Kill list", "Ship-ready" — not obvious what these are
3. **No action mechanism** – User unsure how to address insights

#### After Design System Audit Applied
Coherence Scan is a full page (not modal): "Project Audit Results" as ledger title. Results organized by category with section headers: "BLIND SPOTS", "KILL LIST", "VALUE PROPOSITIONS", "SHIP READINESS". Each insight is a list item with description (14px body) + small label indicating priority. Actions are underlined links: "Mark addressed", "Dismiss", "Learn more". Dismissed insights are archived (crossed-out, lighter color). Progress shown: "4 of 7 blind spots addressed."

---

## PART 4: IMPLEMENTATION ROADMAP

### Phase 1: Foundations & Core Tokens (Weeks 1–2)

**Goal:** Define and enforce the design system tokens, typography, spacing, and color palette.

#### Tasks

| Task | Effort | Dependencies | User Impact |
|------|--------|-------------|------------|
| **1.1 Expand Typography System** | Medium | None | Medium – More nuanced hierarchy |
| Refine Typography.tsx component with new roles (ledgerTitle, subheading, label, note, micro). Create Storybook stories for each. Document font scale and usage rules. | | | |
| **1.2 Define Spacing Utilities** | Low | None | Low – Internal only |
| Create CSS utilities: `.spacer-2` through `.spacer-12`, `.page-margin`, `.column-gutter`, `.section-gap`. Document grid. Add to design tokens. | | | |
| **1.3 Establish Rule/Border Utilities** | Low | None | Medium – Visual language shift |
| Create `.rule-below`, `.rule-above`, `.column-divider` utilities (1px borders, subtle opacity). Document usage in context (between sections, not containers). | | | |
| **1.4 Refactor Color Tokens** | Medium | Theme system review | Medium – Accent consistency |
| Audit all theme presets. Lock in single gold accent (#D4AF37). Redefine semantic colors (Success, Error, Warning, Info). Create CSS custom properties. Document state colors (hover, active, disabled, loading). | | | |
| **1.5 Design Button Variants** | Medium | 1.1, 1.4 | Medium – Affordance shift |
| Add `variant="link"` (underlined text), `variant="subtle"` (small caps, minimal), `variant="critical"` (gold underline). Test all in light/dark. Deprecate oversized primary buttons. | | | |
| **1.6 Document Design System** | High | 1.1–1.5 | Low – Internal reference |
| Create design-system.md guide: token list, typography scale, spacing rules, color definitions, affordance patterns. Include before/after visual examples. Link in Storybook. | | | |

**Expected User Impact:**
- Stronger visual consistency
- Clearer hierarchy across screens
- Better accessibility (larger text, better contrast)
- More manuscript-like aesthetic

---

### Phase 2: Critical UX Fixes (Weeks 2–4)

**Goal:** Address P0 and P1 issues from the issue log. Reduce anxiety, add guidance, improve clarity.

#### Tasks

| Task | Effort | Dependencies | User Impact |
|------|--------|-------------|------------|
| **2.1 Redesign Onboarding Modal** | Low | Phase 1 | High – Better first impression |
| Convert to full-page form (not card modal). Use new typography and spacing from Phase 1. Orange icon → gold. Pill button → underlined link. Test on mobile. | | | |
| **2.2 Clarify "Add Context" Step** | Low | None | High – Reduces confusion |
| Update copy: "Adding context is optional but recommended—it helps Lyra assist you better." Add helper text below description field. Test with new users. | | | |
| **2.3 Add Save Feedback Toasts** | Medium | None | High – Reduces anxiety |
| Show toast on successful save: "Context saved" (with timestamp). Show error toast on failure with retry button. Add inline checkmarks next to saved fields. | | | |
| **2.4 Implement Inline Form Validation** | Medium | Phase 1 | High – Better error recovery |
| Show validation errors as inline red underlines + tooltips (not toasts). Validation runs on blur. Button disabled until form valid. | | | |
| **2.5 Add First-Run Experience** | High | Phase 1 | High – Reduces abandonment |
| Integrate Shepherd.js tour (or custom tooltips). Tour on first workspace visit: "Lyra here (left), your work (center), verification (right)." Make dismissible, allow re-launch from help. | | | |
| **2.6 Design Empty States** | Medium | Phase 1 | Medium – Clearer guidance |
| Create empty state component: icon + 1-line description + optional link. Use in: ExecutionSurface (no tasks), TaskQueue (empty), LyraColumn (no messages), ProofPanel (no results). | | | |
| **2.7 Add Confirmation Dialogs** | Low | None | High – Prevents accidents |
| Add before irreversible actions (Execute Approval, Delete Project, Cancel revision): "This cannot be undone. Are you sure?" Test keyboard flow. | | | |
| **2.8 Refactor Navigation Tabs** | High | Phase 1 | Medium – Visual consistency |
| Remove cyan pill-badge tabs from task workspace. Replace with text-based nav: underlined labels with subtle border below. Or move to left sidebar (marginalia). Document nav pattern. | | | |
| **2.9 Reduce Modal Overuse** | High | Phase 1, 2.1, 2.8 | Medium – Improves readability |
| Convert Context modal → right sidebar (or full page). Settings modal → right sidebar. Keep only: confirmations, alerts. Update all modal styling to match system. | | | |
| **2.10 Design Lyra Marginalia** | High | Phase 1 | High – Clearer purpose |
| Redesign left sidebar as true marginalia: Header + conversational area + "QUICK ACTIONS" (text links, not buttons). Add empty state. Test interaction patterns. | | | |

**Expected User Impact:**
- New users understand what to do
- Anxiety about saving is reduced
- Errors are clearer and easier to fix
- Visual language is more consistent
- Core features are not hidden in modals

---

### Phase 3: Layout & Container Refactor (Weeks 4–6)

**Goal:** Replace card-wall patterns with manuscript-like layout. Use rules instead of containers.

#### Tasks

| Task | Effort | Dependencies | User Impact |
|------|--------|-------------|------------|
| **3.1 Audit GlassPanel Usage** | Medium | None | None – Internal audit |
| Grep for all `.glass-panel` usage. Document which are necessary (sidebars, modals) vs. unnecessary (content blocks). Flag refactor targets. | | | |
| **3.2 Refactor Execution Surface** | High | Phase 1, 3.1 | High – Better content structure |
| Remove GlassPanel from task list/output blocks. Use rules (`.rule-below`) instead. Content directly on ivory background. Add rule dividers between sections. | | | |
| **3.3 Refactor Proof Panel** | High | Phase 1, 3.1 | High – Better visual hierarchy |
| Redesign as true verification ledger: Section headers with rules, list-style results, minimal badges. Remove containers. Ensure text is readable against background. | | | |
| **3.4 Define Page Container Patterns** | Medium | Phase 1 | Low – Internal structure |
| Create `.page-container` utility: max-width 1400px, padding 48px, centered. Apply to all pages. Document max line length (600–800px for body). | | | |
| **3.5 Enforce Column Width Rules** | Medium | Phase 1, 3.4 | Medium – Better readability |
| Set max-width constraints: Main column 800px, side columns 400px. Test on various screen sizes. Ensure responsive behavior on mobile (stack to 1-col). | | | |
| **3.6 Replace Container Shadows with Rules** | Medium | Phase 1 | Medium – Visual language shift |
| Audit shadows in design system. Replace with subtle 1px borders where appropriate. Remove drop-shadows on cards (they're being removed anyway). | | | |
| **3.7 Implement Manuscript Print Styles** | Low | Phase 1 | Low – Edge case |
| Add @media print CSS: Ivory background, black ink, no shadows/effects. Serif fonts optional. Test: print context page to PDF, review. | | | |

**Expected User Impact:**
- Layout feels less like a dashboard, more like a document
- Less visual "clutter" from containers
- Better text readability
- Stronger manuscript/ledger aesthetic
- Clearer hierarchy and structure

---

### Phase 4: Polish & Accessibility (Weeks 6–7)

**Goal:** Fine-tune interactions, accessibility, and edge cases.

#### Tasks

| Task | Effort | Dependencies | User Impact |
|------|--------|-------------|------------|
| **4.1 Focus States & Keyboard Navigation** | Medium | Phase 1, 3 | High – Accessibility |
| Audit all interactive elements for focus indicators. Add gold focus ring (2px) to links, buttons, inputs. Test keyboard-only navigation (Tab, Shift+Tab, Enter). Fix any gaps. | | | |
| **4.2 Color Contrast Audit** | Medium | Phase 1, 3 | High – Accessibility |
| Run WebAIM contrast checker on all text. Ensure 4.5:1 ratio for body text, 3:1 for UI. Test dark mode. Adjust ink colors if needed. | | | |
| **4.3 Responsive Design Testing** | High | Phase 1, 3 | High – Mobile experience |
| Test at breakpoints: mobile (375px), tablet (768px), desktop (1400px). Ensure 3-col layout collapses gracefully, text is readable, buttons are tap-able (44px min). | | | |
| **4.4 Icon System Consistency** | Low | Phase 1 | Medium – Visual consistency |
| Define icon sizes (16px, 20px, 24px) and stroke width (1.5px). Color: ink by default, gold for critical. Test with Lucide React icons. Document usage. | | | |
| **4.5 Hover & Active State Testing** | Medium | Phase 1, 3 | Medium – Interaction clarity |
| Test all interactive elements: links, buttons, form inputs, sidebar items. Ensure hover state is visible, active state is clear. Test on slow devices (low-end hardware). | | | |
| **4.6 Loading & Error State Coverage** | High | Phase 2 | High – Reliability feedback |
| Ensure all async operations have loading state (spinner, skeleton, ETA). All errors have clear message + retry option. Test network failures. | | | |
| **4.7 Dark Mode Testing** | Medium | Phase 1, 3 | Medium – Theme consistency |
| If dark mode is used, test all colors against dark backgrounds. Ensure gold is visible. Test transitions (200ms smooth). Update theme tokens if needed. | | | |
| **4.8 Browser Compatibility** | Low | Phase 3 | Low – Cross-browser support |
| Test on Chrome, Safari, Firefox, Edge (latest 2 versions). Check for CSS/JS compatibility. Test grid/flex layouts, backdrop-filter, custom properties. | | | |
| **4.9 Animation Polish** | Low | Phase 1, 3 | Low – Delight |
| Smooth page transitions (100–200ms). Subtle hover effects (color fade, scale ±2%). No heavy motion. Ensure no animation on `prefers-reduced-motion`. | | | |
| **4.10 Documentation & Handoff** | High | All phases | None – Internal reference |
| Write implementation guide for engineers: token usage, component adoption, common patterns. Create Storybook stories for all components. Link to design-system.md. | | | |

**Expected User Impact:**
- Accessible to keyboard and screen reader users
- Works well on mobile and tablet
- Smooth, polished interactions
- Reliable feedback on all operations
- Consistent experience across browsers

---

### Phase 5: Feature-Specific Refinements (Weeks 7–8, Ongoing)

**Goal:** Apply design system to remaining features (coherence scan, asset pipeline, etc.).

#### Tasks

| Task | Effort | Dependencies | User Impact |
|------|--------|-------------|------------|
| **5.1 Coherence Scan UI Design** | High | Phase 1, 3 | High – Audit clarity |
| Design full-page audit results layout. Results organized by category (blind spots, kill list, ship-ready). Insights as list items with actions (mark addressed, dismiss). Progress bar. | | | |
| **5.2 Asset Pipeline UI (If Shipping)** | High | Phase 1, 2, 3 | High – Asset management |
| Design asset upload interface (not modal; sidebar or full page). Show upload progress. Display asset gallery with thumbnails. Wire to spread sections. Or: remove from v1.0 and document as v2.0 feature. | | | |
| **5.3 Settings Modal Refactor** | Medium | Phase 1, 3 | Medium – Clarity |
| Move settings from modal to right sidebar. Sections: Budget, AI Preferences, Tier. Use design system typography and spacing. Test on mobile. | | | |
| **5.4 Export Modal Redesign** | Low | Phase 1, 3 | Low – Export UX |
| Minimal design: format selector, scope selector (radio buttons, text labels). Export button as text link or minimal button. No modal feel. | | | |
| **5.5 Notification System** | Medium | Phase 1 | Medium – Feedback clarity |
| Design custom toast component: small text (12px), minimal styling, bottom-right placement. Use semantic colors. Document usage in Storybook. | | | |
| **5.6 Breadcrumb Navigation** | Low | Phase 1 | Low – Wayfinding |
| Add breadcrumb above page title on all pages. "Projects > AI Playground > Context". Clickable for back-nav. Small (12px), ink-secondary color. | | | |

**Expected User Impact:**
- All features use consistent design system
- Clearer workflows for secondary features
- More discoverable actions and information
- Stronger overall product coherence

---

## PART 5: SUCCESS METRICS & MONITORING

### Key Performance Indicators (KPIs)

#### Design System Adherence
- **Target:** 100% of new components use design system tokens (color, type, spacing)
- **Measurement:** Code review checklist; ESLint audit for token usage
- **Cadence:** Per PR

#### User Experience Metrics
- **Onboarding completion rate:** Target >60% (baseline unknown; track after Phase 2)
- **Time to first task creation:** Target <5 minutes
- **Save error rate:** Target <0.5% (no silent failures)
- **Modal close rate (accidental):** Target <2% (reduce overuse)
- **Keyboard navigation success:** Target 100% of interactive elements

#### Accessibility Metrics
- **WCAG AA compliance:** Target 100%
- **Color contrast issues:** Target 0
- **Focus state coverage:** Target 100% of interactive elements
- **Keyboard navigation issues:** Target 0 blocking issues

#### Aesthetic Metrics (Qualitative)
- **Design system consistency:** Regular design reviews
- **Manuscript feel score:** Subjective, but track removal of card-wall elements, button reduction, rule adoption
- **User interviews:** "This feels like a journal, not a SaaS dashboard" – aim for this feedback

---

## PART 6: RISK MITIGATION

### Potential Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Refactoring breaks existing layouts | High | High | Branch-by-branch refactor with A/B testing. QA on each phase. Rollback plan ready. |
| Removing buttons breaks muscle memory | Medium | Medium | Gradual transition: links + buttons coexist for 1 sprint, then remove old buttons. Announce in release notes. |
| Dark mode breaks new colors | Medium | Medium | Test dark theme as you go. Use CSS custom properties to enable easy theme swaps. Automated contrast checker in CI. |
| Performance degrades with new patterns | Low | Medium | Benchmark current performance. Profile after refactors. Lighthouse CI for each PR. |
| Designers/PMs disagree on aesthetic | High | High | Document design decisions in design-system.md with rationale. Weekly design reviews to align. Get stakeholder buy-in before Phase 1. |

---

## CONCLUSION

The Codra codebase has a strong architectural foundation and comprehensive design system infrastructure. However, the UI implementation diverges from the stated Ink & Ivory + Gold manuscript aesthetic. By systematically applying the recommendations in this audit—expanding the typography system, reducing card-wall patterns, replacing buttons with typographic affordances, and adding clarity to first-run experiences—Codra can deliver a visually and functionally cohesive product that feels institutional, calm, and trustworthy.

The phased roadmap ensures that changes are manageable and user-impacting improvements are prioritized. Phase 1 (tokens) and Phase 2 (critical UX fixes) are the highest-impact items and should be completed before major user launches.

---

**Audit Conducted By:** Senior Product Designer specializing in design systems and manuscript aesthetics
**Baseline Knowledge:** Comprehensive codebase review, screenshot analysis, design token system audit
**Confidence Level:** High (code review, pattern analysis, design system evaluation)
**Next Steps:** Share with design + engineering leads. Prioritize Phase 1–2. Schedule weekly design review during implementation.
