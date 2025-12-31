# CODRA COGNITIVE LOAD AUDIT

**Date**: December 2025
**Auditor**: Product Editor
**Mandate**: Reduce thinking, not add flexibility

---

## AUDIT METHODOLOGY

For each feature, I count:
- **Decisions introduced**: Every choice, toggle, slider, or selection required
- **Decisions eliminated**: Downstream choices removed by making this decision
- **Net decision load**: Positive (adds burden) or Negative (reduces burden)

---

## ONBOARDING FLOW

### AI Preferences Step

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 2 |
| — Quality Priority | 1 (4 options: quality, balanced, fast, cheap) |
| — Data Sensitivity | 1 (4 options) |
| **Decisions eliminated** | 0 |
| **Net decision load** | **+2** (Positive) |
| **Accent load** | Low (dark borders only) |
| **Recommendation** | **DEFAULT** |
| **Justification** | "Smart Mode" already claims to handle routing—these questions are redundant; default to "balanced" and "internal" silently. |

---

### Budget Preferences Step

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 2 |
| — Daily Budget Limit | 1 (slider: $10–$500) |
| — Spending Strategy | 1 (2 options) |
| **Decisions eliminated** | 8 (the step claims to collapse 8 settings) |
| **Net decision load** | **−6** (Negative) |
| **Accent load** | Low |
| **Recommendation** | **KEEP (but DEFAULT the slider)** |
| **Justification** | If 8 settings are collapsed, the product should pick the sensible default ($50, balanced) and skip this step unless the user explicitly opts in. |

---

### Permissions Step

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 7 |
| — Default Autonomy Level | 1 (3 options) |
| — Always Require Approval | 1 (6 toggleable options) |
| — Max Steps Before Pause | 1 (4 options) |
| — Risk Tolerance | 1 (5-point slider) |
| — Unacceptable Mistakes | 1 (5 toggleable options) |
| — Data Access Mode | 1 (3 options) |
| — Conflict Resolution | 1 (3 options) |
| **Decisions eliminated** | 0 (the AI still asks for approval anyway) |
| **Net decision load** | **+7** (Positive) |
| **Accent load** | Low |
| **Recommendation** | **REMOVE** (entire step) |
| **Justification** | This step is "optional" per its own UI. If optional, it should not exist in onboarding. Move to Settings. Default to "apply-with-approval, 10 steps, risk 3, session-logs, ask-user." |

---

### Visual Direction Step

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 12+ |
| — Product Personality | 1 (9 options, pick 3) |
| — Aesthetic Style | 1 (9 options, pick 3) |
| — Visual Audience | 1 (8 multi-select options) |
| — Color Directions | 1 (8 options, pick 3) |
| — Plus 8 "collapsed" questions mentioned | 8 (hidden but referenced) |
| **Decisions eliminated** | Unclear—presumably guides AI generation |
| **Net decision load** | **+12** (Positive) |
| **Accent load** | Medium (red accent on selections, multiple accented elements compete) |
| **Recommendation** | **COLLAPSE** |
| **Justification** | 4 mood plates with 9 options each is exhausting. Reduce to 1 question: "Pick 3 words that describe your brand" and derive the rest. |

---

### Onboarding Flow (Total)

| Metric | Value |
|--------|-------|
| **Total decisions introduced** | 23+ across 4 steps |
| **Total decisions eliminated** | ~8 (Budget step) |
| **Net decision load** | **+15** (Positive) |
| **Accent load** | Medium |
| **Recommendation** | **COLLAPSE** to 3 decisions max |
| **Justification** | 23 decisions before seeing any output is hostile. Ask: (1) What are you making? (2) Upload existing context? (3) Generate. Everything else defaults or infers. |

---

## SETTINGS PAGE

### Subscription & Plan Section

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 1 |
| — Upgrade to Pro | 1 (binary: upgrade or not) |
| **Decisions eliminated** | 0 |
| **Net decision load** | **+1** (Positive) |
| **Accent load** | High (red badge, white CTA, gradient glow—3 competing visual elements) |
| **Recommendation** | **DEMOTE** |
| **Justification** | Upgrade prompt should be subtle. The current implementation is visually aggressive for a Settings page. |

---

### AI & Intelligence Defaults Section

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 2 |
| — Quality vs. Cost Priority | 1 (4 options) |
| — Show Model per Step | 1 (toggle) |
| **Decisions eliminated** | 0 |
| **Net decision load** | **+2** (Positive) |
| **Accent load** | Medium (red accent on selected priority card) |
| **Recommendation** | **HIDE** |
| **Justification** | "Smart Mode" makes routing decisions. Exposing quality/cost priority contradicts the smart mode promise. Hide behind "Advanced" or remove entirely. |

---

### Financial Guardrails Section

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 1 |
| — Default Budget Mode | 1 (3 options) |
| **Decisions eliminated** | 0 |
| **Net decision load** | **+1** (Positive) |
| **Accent load** | Low (emerald accent, appropriate for financial status) |
| **Recommendation** | **DEFAULT** |
| **Justification** | "Smart balance" should be the unchangeable default. Exposing "Budget mode" and "Performance mode" adds cognitive load for minimal user benefit. |

---

### Autonomy & Safety Section

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 1 |
| — Default Autonomy Level | 1 (3 options) |
| **Decisions eliminated** | 0 |
| **Net decision load** | **+1** (Positive) |
| **Accent load** | Low (rose accent on selection) |
| **Recommendation** | **DEFAULT** |
| **Justification** | "Apply with approval" is the only sensible default. Remove the choice; let power users override per-project. |

---

### Settings Page (Total)

| Metric | Value |
|--------|-------|
| **Total decisions introduced** | 5 |
| **Total decisions eliminated** | 0 |
| **Net decision load** | **+5** (Positive) |
| **Accent load** | Medium-High |
| **Recommendation** | **DEFAULT** all settings; show read-only summary |
| **Justification** | Settings pages should confirm defaults, not demand configuration. Current implementation treats every preference as equally important. |

---

## LYRA PANEL

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 9+ |
| — Which suggestion to accept | 1–5 (variable) |
| — Which question to answer/dismiss | 1–3 (variable) |
| — Which desk to start from grid | 7 (one per desk) |
| — Which quick action to use | 2 ("Draft Copy" or "Create Visual") |
| — "Suggest Tasks" CTA | 1 |
| **Decisions eliminated** | 0 (suggestions are additive, not reductive) |
| **Net decision load** | **+9** (Positive) |
| **Accent load** | Medium (rose dots, amber icons, multiple sections with different color codes) |
| **Recommendation** | **COLLAPSE** |
| **Justification** | Panel presents too many options simultaneously. Show exactly ONE next step. If uncertain, ask the user what they want to do—don't show 9 alternatives. |

---

## MODEL SELECTOR

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 20+ |
| — Model selection | 1 (but dropdown shows 20+ models across providers) |
| **Decisions eliminated** | 0 (user must still decide if output is good) |
| **Net decision load** | **+20** (Positive) |
| **Accent load** | Medium (rose accent on selected, search + grouping adds visual complexity) |
| **Recommendation** | **REMOVE** from default view |
| **Justification** | "Smart Mode" exists. Exposing 20+ model options in a dropdown contradicts the product's own routing intelligence. Hide completely; show only in diagnostics or debugging mode. |

---

## LYRA CUSTOMIZER

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 20+ |
| — Base body selection | 1 (multiple options) |
| — Hair selection | 1 (multiple options) |
| — Clothing selection | 1 (multiple options) |
| — Accessory selection | 1 (multiple options + "none") |
| — Expression selection | 1 (multiple options) |
| **Decisions eliminated** | 0 |
| **Net decision load** | **+20** (Positive) |
| **Accent load** | Medium (rose selection rings) |
| **Recommendation** | **REMOVE** |
| **Justification** | Paper-doll customization introduces 20+ decisions that produce zero work output. This is a game, not a productivity feature. |

---

## PRODUCTION DESKS (7)

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 7 |
| — Which desk to use | 1 (but 7 options) |
| **Decisions eliminated** | 0 (user still decides what to do within desk) |
| **Net decision load** | **+7** (Positive) |
| **Accent load** | Low (icons only, no accent color abuse) |
| **Recommendation** | **INFER** |
| **Justification** | Smart Router should select desk based on task description. User should not manually route. Collapse to 4 desks maximum, auto-select based on intent. |

---

## BUDGET METER

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 0 |
| **Decisions eliminated** | 0 |
| **Net decision load** | **0** (Neutral) |
| **Accent load** | Low (status colors appropriate) |
| **Recommendation** | **INFER** → **COLLAPSE into Activity Strip** |
| **Justification** | Meter is informational but takes prominent space. Activity Strip already shows budget. Eliminate duplication. |

---

## CONTEXT WINDOW INDICATOR

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 0 |
| **Decisions eliminated** | 0 |
| **Net decision load** | **0** (Neutral—but creates anxiety without action path) |
| **Accent load** | Low |
| **Recommendation** | **REMOVE** |
| **Justification** | User cannot act on context window status. Showing it creates worry without recourse. Product should manage context silently. |

---

## COHERENCE LOOP VIEW

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 2 |
| — Run another loop | 1 |
| — Dismiss | 1 |
| **Decisions eliminated** | Unclear (quality assurance is ongoing) |
| **Net decision load** | **+2** (Positive) |
| **Accent load** | Low (emerald/amber status colors) |
| **Recommendation** | **HIDE** |
| **Justification** | Coherence verification should run automatically and surface only failures. User should not manually trigger "loops." |

---

## EXPORT MODAL

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 1 |
| — Format selection | 1 (3–4 options based on content type) |
| **Decisions eliminated** | 0 |
| **Net decision load** | **+1** (Positive, but acceptable) |
| **Accent load** | Low (indigo accent, clear selection states) |
| **Recommendation** | **DEFAULT** to most common format |
| **Justification** | Default to PDF for documents, PNG for images. Show other formats as secondary options. Most users will accept default. |

---

## CROSS-DESK SUGGESTIONS

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 1–N |
| — Accept/dismiss each suggestion | Variable |
| **Decisions eliminated** | 0 |
| **Net decision load** | **+N** (Positive) |
| **Accent load** | Medium (brand accent on badges) |
| **Recommendation** | **REMOVE** |
| **Justification** | With fewer desks, cross-desk suggestions are unnecessary. Feature adds decisions without clear value. |

---

## ACTIVITY STRIP

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 0 |
| — Git/Deploy buttons hidden | 0 |
| **Decisions eliminated** | 0 |
| **Net decision load** | **0** (Neutral) |
| **Accent load** | Low (red progress dot, emerald status) |
| **Recommendation** | **KEEP** |
| **Justification** | Strip is informational and non-intrusive. Good example of status without decision burden. |

---

## 4-LAYER BACKGROUND + THEMES

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 4 |
| — Theme selection | 1 (4 options) |
| **Decisions eliminated** | 0 |
| **Net decision load** | **+4** (Positive) |
| **Accent load** | N/A (cosmetic) |
| **Recommendation** | **DEFAULT** |
| **Justification** | Pick one theme. Don't ask users to choose visual appearance before they've done any work. |

---

## SPARKLE LAYER

| Metric | Value |
|--------|-------|
| **Decisions introduced** | 0 |
| **Decisions eliminated** | 0 |
| **Net decision load** | **0** (Neutral) |
| **Accent load** | High (gold particles are constant visual noise) |
| **Recommendation** | **REMOVE** |
| **Justification** | Particles add zero utility but compete for visual attention constantly. Pure cognitive tax. |

---

# SUMMARY: TOTAL DECISION BURDEN

| Surface | Decisions Introduced | Decisions Eliminated | Net |
|---------|---------------------|---------------------|-----|
| Onboarding (4 steps) | 23+ | 8 | **+15** |
| Settings Page | 5 | 0 | **+5** |
| Lyra Panel | 9+ | 0 | **+9** |
| Model Selector | 20+ | 0 | **+20** |
| Lyra Customizer | 20+ | 0 | **+20** |
| Production Desks | 7 | 0 | **+7** |
| Coherence Loop | 2 | 0 | **+2** |
| Export Modal | 1 | 0 | **+1** |
| Cross-Desk Suggestions | Variable | 0 | **+N** |
| Themes | 4 | 0 | **+4** |
| **TOTAL** | **91+** | **8** | **+83** |

---

# CRITICAL FINDINGS

## 1. Decision Inflation

The product introduces **91+ explicit decisions** before and during work, while eliminating only **8**. Net burden is **+83 decisions**.

A user creating their first Spread faces:
- 23 onboarding decisions
- 7 desk choices
- 20+ model options
- 9+ Lyra panel alternatives

This is not "power"—it is paralysis.

## 2. Smart Mode is Contradicted

"Smart Mode" claims to handle routing, model selection, and optimization. Yet:
- Model Selector exposes 20+ models
- Quality/Cost Priority asks user to choose
- Budget Mode offers 3 strategies

If Smart Mode works, these choices should not exist. If they must exist, Smart Mode does not work.

## 3. Accent Color Creates Visual Decision Load

Accent color should reduce decisions by signaling "do this next." Instead:
- Settings page has 3 competing accented elements
- Lyra Panel uses rose, amber, and brand accent simultaneously
- Sparkle Layer adds constant gold noise

When everything is accented, nothing is primary.

## 4. Configuration Theater

Permissions Step asks 7 questions, then notes "This step is optional." If optional, it should not exist in onboarding.

Budget Step claims to "collapse 8 settings" but still asks 2 questions. If settings are collapsed, the step should be skipped.

Visual Direction claims to hide "8 secondary questions" but still presents 12+ choices. This is not simplification.

---

# RECOMMENDATIONS

## Priority 1: Default Everything

| Feature | Current | Recommended Default |
|---------|---------|-------------------|
| Quality Priority | 4 options | balanced |
| Budget Mode | 3 options | smart-balance |
| Autonomy Level | 3 options | apply-with-approval |
| Daily Budget | $10–$500 slider | $50 |
| Theme | 4 options | Cyber Cyan |
| Export Format | 3–4 options per type | PDF (docs), PNG (images) |

Users who want control can find it in Settings. First-run should be frictionless.

## Priority 2: Remove Decision Surfaces

| Feature | Action |
|---------|--------|
| Model Selector | Remove from UI; Smart Mode handles it |
| Lyra Customizer | Remove entirely |
| Permissions Step | Move to Settings |
| Visual Direction | Collapse to 1 question |
| Cross-Desk Suggestions | Remove |
| Context Window Indicator | Remove |
| Sparkle Layer | Remove |

## Priority 3: Infer Instead of Ask

| Decision | Inference Method |
|----------|-----------------|
| Which desk to use | Parse task description; route automatically |
| Quality vs. speed | Infer from deadline/urgency language |
| Data sensitivity | Infer from project name/type |
| Visual style | Infer from industry/role selection |

If the product can guess correctly 80% of the time, guessing is better than asking.

## Priority 4: Reduce Accent Color

| Surface | Current Accent | Recommended |
|---------|----------------|-------------|
| Settings Page | 3 competing elements | 0 (no accent; settings are neutral) |
| Lyra Panel | rose, amber, brand accent | 1 (rose for primary CTA only) |
| Onboarding | red on selections | 1 per step (next action only) |
| Sparkle Layer | constant gold | Remove |

---

# VERDICT

Codra treats configuration as a feature. It is not. Configuration is tax.

Every decision introduced must eliminate more decisions downstream. The current ratio is **91:8**—an 11:1 tax on user attention.

The product's own "Smart Mode" philosophy is correct: make decisions for the user. The implementation contradicts this philosophy on every surface.

**Reduce decisions from 91 to under 10.** The remaining 10 should each eliminate 5+ downstream choices.

---

*This audit prioritizes user momentum over optionality. A tool that asks 91 questions is not powerful—it is uncertain.*
