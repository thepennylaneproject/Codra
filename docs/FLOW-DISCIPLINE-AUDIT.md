# CODRA FLOW DISCIPLINE AUDIT

**Date**: December 2025
**Auditor**: Product Editor
**Mandate**: Movement, not management

---

## PRIMARY FLOWS IDENTIFIED

Based on routing structure and component analysis, Codra has **5 observable user flows**:

1. **Project Creation Flow** — Start a new Spread
2. **Task Execution Flow** — Run an AI task to produce output
3. **Desk Work Flow** — Deep work in a specialized canvas
4. **Export Flow** — Download a finished artifact
5. **Configuration Flow** — Adjust settings (anti-flow)

---

## FLOW 1: PROJECT CREATION

### Steps

| Step | Screen | Action |
|------|--------|--------|
| 1 | Projects Page | Click "New Workspace" |
| 2 | Mode Selection | Choose new vs. import |
| 3 | Context & Intent | Answer 6 questions |
| 4 | AI Preferences | Answer 2 questions |
| 5 | Budget Preferences | Set slider + toggle |
| 6 | Permissions | Answer 7 questions (optional) |
| 7 | Visual Direction | Answer 12+ questions |
| 8 | Generating | Wait for Spread |
| 9 | Spread Workspace | Begin work |

### Completion Moment

User sees generated Spread with sections and TOC.

### Flow Breaks

| Location | Break Type | Description |
|----------|------------|-------------|
| Step 2 | Decision gate | User must choose "new" vs "import" before proceeding |
| Step 3 | Configuration wall | 6 questions before any output |
| Step 4 | Configuration wall | AI preferences not connected to visible outcome |
| Step 5 | Configuration wall | Budget slider disconnected from task at hand |
| Step 6 | Optional detour | "Skip" button suggests step is unnecessary—why include it? |
| Step 7 | Configuration wall | 12+ visual decisions before seeing any visual output |

### Accent Usage

| Location | Accent Element | Justified? |
|----------|---------------|------------|
| Projects Page header | Red dot (brand mark) | Unjustified — decorative |
| "New Workspace" button | Dark fill → red hover | Justified — primary CTA |
| Onboarding navigation | Red underline on active tab | Unjustified — accent on navigation chrome |
| Step completion | Dark border on selected cards | Neutral — selection state |
| "Continue" button | Dark fill | Justified — next action |

**Accent verdict**: 2 justified, 2 unjustified. Accent on brand dot and nav tabs is noise.

### Recommendation

**SHORTEN**

Collapse 8 steps to 3:
1. What are you making? (project name + type)
2. Upload existing context? (optional file drop)
3. Generate

All other configuration (AI preferences, budget, permissions, visual direction) should:
- Default to sensible values
- Be adjustable in Settings after first output

---

## FLOW 2: TASK EXECUTION

### Steps

| Step | Screen | Action |
|------|--------|--------|
| 1 | Spread Workspace | See TOC or Lyra Panel |
| 2 | Left Dock (AI Tasks tab) | Browse tasks by desk/status |
| 3 | Task Card | Click to select |
| 4 | Model Selector | (Optional) Override model |
| 5 | CodraWorkspace | See task in "execute" mode |
| 6 | CodraWorkspace | Click "Begin Production" |
| 7 | CodraWorkspace | Wait for AI execution |
| 8 | Output Inspector | See result in right dock |

### Completion Moment

Task status changes to "complete" and output appears in inspector.

### Flow Breaks

| Location | Break Type | Description |
|----------|------------|-------------|
| Step 2 | Tab switch required | User must click "AI Tasks" tab — not visible by default |
| Step 4 | Configuration detour | Model Selector shows 20+ options despite "Smart Mode" |
| Step 5 | Mode transition | Workspace switches from "consult" to "execute" — unclear mental model |
| Step 6 | Guardrail interruption | Escalation modals may block execution |

### Accent Usage

| Location | Accent Element | Justified? |
|----------|---------------|------------|
| Tab underline (AI Tasks) | Red | Unjustified — chrome accent |
| Task card selection | Border highlight | Neutral — selection state |
| "Begin Production" button | Red background | Justified — primary action |
| Model Selector badge | Rose on "Smart" | Unjustified — decorative emphasis |
| Progress indicator | Red dot | Justified — active status |

**Accent verdict**: 2 justified, 2 unjustified. Model Selector badge and tab underline add noise.

### Recommendation

**STRENGTHEN**

- Default to "AI Tasks" tab or merge with TOC (tasks belong to sections)
- Remove Model Selector from default view — Smart Mode handles it
- Remove consult/execute mode distinction — just run tasks
- Show progress inline, not in separate Inspector

---

## FLOW 3: DESK WORK

### Steps

| Step | Screen | Action |
|------|--------|--------|
| 1 | Spread Workspace | See TOC with Desk entries |
| 2 | TOC Sidebar | Click "Production Desk" category |
| 3 | Desk Workspace | Enter specialized canvas |
| 4 | Desk Workspace | Brief Lyra in input field |
| 5 | Desk Canvas | Work in Art/Engineering/Writing/Workflow |

### Completion Moment

User produces output within the desk (asset, code, document).

### Flow Breaks

| Location | Break Type | Description |
|----------|------------|-------------|
| Step 3 | Context loss | Navigating to desk leaves Spread — separate route |
| Step 4 | Unclear entry point | Lyra input says "Brief Lyra for this Desk..." but no prompt |
| Step 5 | Empty canvas | Many desks show placeholder "Canvas is Ready" without action |

### Accent Usage

| Location | Accent Element | Justified? |
|----------|---------------|------------|
| Desk header icon | Rose background | Justified — desk identity |
| "Launch Lyra" button | Rose background | Unjustified — why "launch" if Lyra panel already visible? |
| Lyra panel input | Rose ring on focus | Neutral — focus state |
| Loading spinner | Rose border | Neutral — status |

**Accent verdict**: 1 justified, 1 unjustified. "Launch Lyra" button is redundant — Lyra panel is already present.

### Recommendation

**MERGE**

Desks should not be separate routes. Integrate desk canvases into Spread Workspace as switchable views:
- TOC click on desk → swap center canvas (no navigation)
- Preserve context and state
- Remove "Launch Lyra" button — Lyra is ambient, not launched

---

## FLOW 4: EXPORT

### Steps

| Step | Screen | Action |
|------|--------|--------|
| 1 | Spread Workspace | Work until satisfied |
| 2 | Output Inspector | View completed output |
| 3 | Export Modal | Click export button |
| 4 | Format Selection | Choose PDF/Markdown/JSON |
| 5 | Download | File saves |

### Completion Moment

File appears in user's downloads folder.

### Flow Breaks

| Location | Break Type | Description |
|----------|------------|-------------|
| Step 3 | Discoverability | Export button location unclear — hidden in inspector? |
| Step 4 | Decision point | 3–4 format options require choice |

### Accent Usage

| Location | Accent Element | Justified? |
|----------|---------------|------------|
| Export button | Indigo/blue | Justified — terminal action |
| Format selection | Indigo highlight | Justified — current selection |

**Accent verdict**: 2 justified. Export flow is clean.

### Recommendation

**KEEP**

Export is the one flow with appropriate accent discipline. Accent moves with the user: action → selection → confirmation.

Minor improvement: Default to most common format (PDF for docs, PNG for images) to reduce one decision.

---

## FLOW 5: CONFIGURATION (ANTI-FLOW)

### Steps

| Step | Screen | Action |
|------|--------|--------|
| 1 | Projects Page | Click Settings icon |
| 2 | Settings Page | Scroll sections |
| 3 | Settings Section | Adjust toggles/selectors |
| 4 | Settings Page | Changes auto-save |
| 5 | Projects Page | Navigate back |

### Completion Moment

None. Configuration has no completion — it is a state, not a journey.

### Flow Breaks

| Location | Break Type | Description |
|----------|------------|-------------|
| Entire flow | Configuration theater | User is adjusting dials, not producing output |
| Step 2 | Visual noise | Multiple accented elements compete |
| Step 3 | Decision burden | Each section demands choices without clear benefit |

### Accent Usage

| Location | Accent Element | Justified? |
|----------|---------------|------------|
| Upgrade badge | Red | Unjustified — upsell in settings |
| Upgrade CTA | White button with shadow | Unjustified — visual weight on monetization |
| Priority cards | Red on selection | Unjustified — settings should be neutral |
| Budget mode toggle | Emerald on "smart" | Marginally justified — but why highlight default? |
| Autonomy selection | Rose on selection | Unjustified — settings should be neutral |

**Accent verdict**: 0 justified, 5 unjustified. Settings page is accent-polluted.

### Recommendation

**ELIMINATE** (as a user-facing flow)

Settings should be:
- Accessible but not prominent
- Zero accent color
- Read-only summary by default, editable on request
- Never interrupt production flows

Configuration is not a flow — it is maintenance. Treat it as such.

---

## VISUAL SPOTLIGHT DISCIPLINE SUMMARY

### Accent Color Audit by Flow

| Flow | Accent Points | Justified | Unjustified | Ratio |
|------|--------------|-----------|-------------|-------|
| Project Creation | 4 | 2 | 2 | 50% |
| Task Execution | 5 | 2 | 3 | 40% |
| Desk Work | 4 | 1 | 1 | 50% |
| Export | 2 | 2 | 0 | 100% |
| Configuration | 5 | 0 | 5 | 0% |
| **TOTAL** | **20** | **7** | **11** | **35%** |

**Only 35% of accent color usage is justified.**

65% of accent color is:
- Decorative (brand dots, tab underlines)
- Chrome-level (navigation states)
- Monetization (upgrade prompts)
- Selection states that don't require emphasis

---

## FLOW VERDICTS

| Flow | Verdict | Rationale |
|------|---------|-----------|
| Project Creation | **SHORTEN** | 8 steps → 3; defer configuration |
| Task Execution | **STRENGTHEN** | Remove Model Selector, merge tabs, inline progress |
| Desk Work | **MERGE** | Integrate desks into Spread; no separate route |
| Export | **KEEP** | Clean accent discipline; default format to reduce decision |
| Configuration | **ELIMINATE** | Not a flow; hide behind summary card |

---

## CRITICAL FINDINGS

### 1. Configuration Interrupts All Flows

Every production flow (creation, execution, desk work) is interrupted by configuration surfaces:
- Onboarding asks 23 questions before first output
- Task execution exposes Model Selector despite Smart Mode
- Desk work requires navigation to separate route

**Remedy**: Configuration should follow output, not precede it.

### 2. Accent Color Does Not Move

Accent should signal "what to do next" and move with the user. Instead:
- Projects Page: accent on brand dot (static)
- Onboarding: accent on tabs (static chrome)
- Task Execution: accent on Model Selector badge (static)
- Settings: 5 competing accent elements (static)

**Remedy**: One accent per screen, on the next action only.

### 3. Separate Routes Fragment Context

Desk Workspace is a separate route (`/p/:projectId/desk/:deskId`), losing context from the Spread.

**Remedy**: Desk canvases should be views within the Spread, not destinations.

### 4. Export Is the Only Clean Flow

Export has:
- Clear entry (inspector → export button)
- Minimal decisions (format selection)
- Justified accent (action → selection)
- Definite completion (file downloads)

All other flows should learn from Export.

---

## RECOMMENDED ARCHITECTURE

### Current Flow Count: 5

| Flow | Steps | Decisions | Accent Points |
|------|-------|-----------|---------------|
| Project Creation | 9 | 23 | 4 |
| Task Execution | 8 | 20+ | 5 |
| Desk Work | 5 | 7 | 4 |
| Export | 5 | 1 | 2 |
| Configuration | 5 | 5 | 5 |
| **TOTAL** | 32 | 56+ | 20 |

### Target Flow Count: 3

| Flow | Steps | Decisions | Accent Points |
|------|-------|-----------|---------------|
| Start Project | 3 | 3 | 1 |
| Run Task | 3 | 0 | 1 |
| Export | 3 | 1 | 1 |
| **TOTAL** | 9 | 4 | 3 |

**Reduction**:
- Steps: 32 → 9 (72% reduction)
- Decisions: 56 → 4 (93% reduction)
- Accent points: 20 → 3 (85% reduction)

---

## FINAL VERDICT

Codra has **5 flows** where it should have **3**.

The two excess flows (Configuration, Desk Work as separate route) fragment attention and add configuration burden.

The remaining three flows (Project Creation, Task Execution, Export) are bloated with decisions and accent noise.

**Target state**:
1. **Start**: Name → Generate → Work (3 steps)
2. **Run**: Click task → Output (2 steps)
3. **Export**: Click export → Download (2 steps)

Everything else is configuration. Hide it.

---

*A product with 5 flows and 32 steps is explaining itself. A product with 3 flows and 9 steps is getting out of the way.*
