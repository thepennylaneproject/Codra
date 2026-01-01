# Coral Accent Color Governance System

**A strict governance system for Codra's coral accent color (#FF6B6B).**

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Permitted Uses](#permitted-uses)
4. [Prohibited Uses](#prohibited-uses)
5. [Implementation Guide](#implementation-guide)
6. [Enforcement](#enforcement)
7. [Migration Guide](#migration-guide)

---

## Overview

### The Problem

An audit of Codra's codebase found that **65% of accent usage was decorative or misplaced**. This diluted the accent's semantic meaning and created visual noise.

### The Solution

A strict governance system that enforces:

- **5 permitted use cases** (and ONLY these 5)
- **7 prohibited patterns** (auto-reject in PRs)
- **Zero accent in Settings** (configuration is neutral)
- **One accent per screen** (maximum visual hierarchy)

### Key Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Total accent instances | 20+ | 8 | 5-10 |
| Violation rate | 65% | 0% | <5% |
| Settings page accent count | 6+ | 0 | 0 |
| Onboarding accents per step | 3-4 | 1 | 1 |

---

## Design Philosophy

> **"Accent means 'do this next' or 'success achieved'"**

### Core Principles

1. **If something is always accented, nothing is primary**
   - Scarcity creates power
   - Remove decorative usage

2. **Chrome should never use accent**
   - Navigation, tabs, headers = neutral
   - Accent moves WITH the user, not around them

3. **Accent moves with the user through a flow**
   - Onboarding: accent follows the next step
   - Settings: no accent (configuration is neutral)
   - Workspace: accent on primary CTA + active tab

### The Accent Hierarchy

```
┌─────────────────────────────────────┐
│  1. Primary CTA (ONE per screen)    │  ← Most important
├─────────────────────────────────────┤
│  2. Active Progress Indicator       │
├─────────────────────────────────────┤
│  3. Success State Confirmation      │
├─────────────────────────────────────┤
│  4. Active Tab Indicator            │
├─────────────────────────────────────┤
│  5. Selected Output Item            │  ← Least important
└─────────────────────────────────────┘
```

---

## Permitted Uses

### 1. Primary CTA (Button Background)

**When:** The main action on a screen.

**Limit:** ONE per screen (maximum).

**Implementation:**

```tsx
import { Button } from '@/new/components/Button';

<Button variant="primary" onClick={handleSubmit}>
  Continue
</Button>
```

**CSS Variable:**
```css
background: var(--button-primary-bg);
color: var(--button-primary-text);
```

**Visual Example:**
- Onboarding "Continue" button
- Modal "Confirm" button
- Form "Submit" button

---

### 2. Active Progress (Dot/Spinner Fill)

**When:** Showing active progress or loading state.

**Limit:** ONE active progress indicator at a time.

**Implementation:**

```tsx
import { ProgressSpinner, ProgressBar, ProgressDot } from '@/new/components/ProgressDot';

// Spinner
<ProgressSpinner size="md" />

// Bar
<ProgressBar value={75} showLabel />

// Dot
<ProgressDot active={true} />
```

**CSS Variable:**
```css
fill: var(--progress-active);
background: var(--progress-active-bg);
```

**Visual Example:**
- Generating spread spinner
- Upload progress bar
- Step indicator dot (active)

---

### 3. Success State (Checkmark, Toast)

**When:** Confirming successful completion.

**Limit:** Shown temporarily (toasts auto-dismiss).

**Implementation:**

```tsx
import { toast } from '@/new/components/Toast';

toast.success('Settings saved');

// Or custom success icon
<CheckCircle className="text-[var(--success-icon)]" />
```

**CSS Variable:**
```css
fill: var(--success-icon);
border: 1px solid var(--success-border);
background: var(--success-bg);
```

**Visual Example:**
- Success toast notification
- Checkmark after save
- Completed step indicator

---

### 4. Active Tab Indicator (2px Bottom Border)

**When:** Showing which tab is currently active.

**Limit:** ONE active tab in a tab group.

**Implementation:**

```tsx
import { TabIndicator } from '@/new/components/TabIndicator';

<TabIndicator.Group>
  <TabIndicator active={activeTab === 'write'} onClick={() => setTab('write')}>
    Write
  </TabIndicator>
  <TabIndicator active={activeTab === 'design'} onClick={() => setTab('design')}>
    Design
  </TabIndicator>
</TabIndicator.Group>
```

**CSS Variable:**
```css
border-bottom: var(--tab-active-border-width) solid var(--tab-active-border);
```

**Visual Example:**
- Workspace desk tabs
- Settings category tabs
- Content section tabs

---

### 5. Selected Output (Inspector Item Border)

**When:** Showing which output item is selected in a list.

**Limit:** ONE selected item at a time.

**Implementation:**

```tsx
<div
  className={selected ? 'border-l-[var(--output-selected-border-width)] border-l-[var(--output-selected-border)]' : ''}
>
  Output item content
</div>
```

**CSS Variable:**
```css
border-left: var(--output-selected-border-width) solid var(--output-selected-border);
```

**Visual Example:**
- Selected file in inspector
- Active item in output list
- Highlighted result

---

## Prohibited Uses

### 1. Brand Dot in Header ❌

**Why:** Decorative, serves no functional purpose.

**Replacement:**
```tsx
// ❌ WRONG
<div className="w-2 h-2 bg-[#FF6B6B] rounded-full" />

// ✅ CORRECT: Remove it entirely
<span>Codra</span>

// OR use neutral color
<div className="w-2 h-2 bg-[var(--header-brand-dot)] rounded-full" />
```

---

### 2. Tab Underline on Hover ❌

**Why:** Chrome state, not an action.

**Replacement:**
```tsx
// ❌ WRONG
<button className="hover:border-b-2 hover:border-[#FF6B6B]">
  Tab
</button>

// ✅ CORRECT: Use opacity/background change
<button className="hover:bg-[var(--tab-hover-bg)] hover:text-[var(--color-ink)]">
  Tab
</button>
```

---

### 3. Settings Selection ❌

**Why:** Configuration is neutral, not an action.

**Replacement:**
```tsx
// ❌ WRONG
<button className={selected ? 'border-[#FF6B6B] bg-[#FF6B6B]/5' : ''}>
  Option
</button>

// ✅ CORRECT: Use neutral border
<button className={selected ? 'border-[var(--settings-selection)] bg-[var(--color-ink)]/5' : ''}>
  Option
</button>
```

---

### 4. Avatar Ring ❌

**Why:** Feature removed from design system.

**Replacement:** N/A (remove feature)

---

### 5. Upgrade Badge ❌

**Why:** Monetization shouldn't scream.

**Replacement:**
```tsx
// ❌ WRONG
<span className="text-[#FF6B6B] bg-[#FF6B6B]/10">Pro</span>

// ✅ CORRECT: Use subtle neutral variant
<span className="text-[var(--upgrade-badge)] bg-[var(--color-ink)]/5">Pro</span>
```

---

### 6. Model Selector Badge ❌

**Why:** Feature hidden in UI.

**Replacement:** N/A (feature hidden)

---

### 7. Sparkle Particles ❌

**Why:** Feature removed for visual clarity.

**Replacement:** N/A (remove feature)

---

## Implementation Guide

### Design Token Structure

#### TypeScript Tokens (`src/lib/design-tokens.ts`)

```typescript
export const ACCENT_CORAL = {
  base: '#FF6B6B',
  hover: '#FF5252',
  active: '#E64848',
  muted: 'rgba(255, 107, 107, 0.1)',
  border: 'rgba(255, 107, 107, 0.3)',

  permitted: {
    primaryCta: {
      bg: '#FF6B6B',
      bgHover: '#FF5252',
      bgActive: '#E64848',
      text: '#FFFAF0',
    },
    activeProgress: {
      fill: '#FF6B6B',
      bg: 'rgba(255, 107, 107, 0.1)',
    },
    success: {
      fill: '#FF6B6B',
      border: 'rgba(255, 107, 107, 0.3)',
      bg: 'rgba(255, 107, 107, 0.1)',
    },
    activeTab: {
      borderBottom: '2px solid #FF6B6B',
      borderColor: '#FF6B6B',
    },
    selectedOutput: {
      borderLeft: '2px solid #FF6B6B',
      borderColor: '#FF6B6B',
    },
  },

  prohibited: {
    brandDot: '#8A8A8A',  // Use neutral instead
    tabHover: 'rgba(255, 255, 255, 0.05)',
    settingsSelection: 'rgba(255, 253, 247, 0.16)',
    upgradeBadge: '#5A5A5A',
  },
};
```

#### CSS Variables (`src/app/design-tokens.css`)

```css
:root {
  /* Base coral tokens */
  --color-accent: #FF6B6B;
  --color-accent-hover: #FF5252;
  --color-accent-active: #E64848;
  --color-accent-muted: rgba(255, 107, 107, 0.1);
  --color-accent-border: rgba(255, 107, 107, 0.3);

  /* Permitted use tokens */
  --button-primary-bg: var(--color-accent);
  --button-primary-bg-hover: var(--color-accent-hover);
  --button-primary-bg-active: var(--color-accent-active);
  --button-primary-text: var(--color-ivory);

  --progress-active: var(--color-accent);
  --progress-active-bg: var(--color-accent-muted);

  --success-icon: var(--color-accent);
  --success-border: var(--color-accent-border);
  --success-bg: var(--color-accent-muted);

  --tab-active-border: var(--color-accent);
  --tab-active-border-width: 2px;

  --output-selected-border: var(--color-accent);
  --output-selected-border-width: 2px;

  /* Prohibited use replacements */
  --header-brand-dot: var(--color-ink-muted);
  --tab-hover-bg: rgba(255, 255, 255, 0.05);
  --settings-selection: var(--color-border);
  --upgrade-badge: var(--color-ink-light);
}
```

---

## Enforcement

### 1. ESLint Rule

**Location:** `eslint-rules/no-hardcoded-accent.js`

**Detects:**
- Hardcoded `#FF6B6B`, `#FF5252`, `#E64848`, `#FF4D4D`
- Tailwind arbitrary values like `bg-[#FF6B6B]`
- Inline style objects with coral colors

**Usage:**

```bash
# Run linter
npm run lint

# Enable rule in .eslintrc.cjs (after cleanup)
'codra/no-hardcoded-accent': 'error'
```

---

### 2. Runtime Audit

**Location:** `src/lib/design/accentAudit.ts`

**Features:**
- Scans DOM for coral usage
- Validates against approved components
- Reports violations with element paths

**Usage:**

```typescript
import { auditAccentUsage, logAuditReport } from '@/lib/design/accentAudit';

// In development, run audit on mount
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      const report = auditAccentUsage();
      logAuditReport(report);
    }, 1000);
  }
}, []);
```

**Console Output:**
```
🎨 Coral Accent Audit Report

📊 Summary:
  Total Violations: 0
  Total Approved: 3
  Violation Rate: 0.0%

✅ No violations found!

✓ Approved Usages:
  1. button.Button[data-accent-usage="primary-cta"] > ...
  2. div.ProgressSpinner[data-accent-usage="active-progress"] > ...
  3. button.TabIndicator[data-accent-usage="active-tab"] > ...
```

---

### 3. PR Checklist

**Location:** `.github/ACCENT_COLOR_CHECKLIST.md`

Every PR that touches UI must pass:

1. Does it introduce coral? → If no, approve
2. Is it a permitted use? → If no, reject
3. Only ONE accent per screen? → If no, reject
4. Moves user forward or confirms success? → If no, reject
5. Not decorative? → If yes (decorative), reject

**See full checklist:** [ACCENT_COLOR_CHECKLIST.md](../.github/ACCENT_COLOR_CHECKLIST.md)

---

## Migration Guide

### Step 1: Audit Current Usage

```bash
# Find all hardcoded coral
grep -rn "#FF6B6B\|#FF5252\|#E64848\|#FF4D4D" src/

# Or use the audit utility
npm run dev
# (check console for audit report)
```

### Step 2: Categorize Violations

For each instance, determine:

1. **Is it permitted?** → Migrate to approved component/token
2. **Is it prohibited?** → Replace with neutral alternative
3. **Is it decorative?** → Remove entirely

### Step 3: Replace with Components

| Old Code | New Code |
|----------|----------|
| `<Button className="bg-[#FF6B6B]">` | `<Button variant="primary">` |
| `<Loader2 className="text-[#FF6B6B]" />` | `<ProgressSpinner />` |
| `<div className="border-b-[#FF6B6B]">` (tab) | `<TabIndicator active={true}>` |
| `<div className="border-l-[#FF6B6B]">` (selection) | Use `--output-selected-border` |
| Decorative glow with coral | Use neutral color or remove |

### Step 4: Update CSS

```css
/* ❌ Old: Hardcoded */
.button-primary {
  background: #FF6B6B;
  color: white;
}

/* ✅ New: Design tokens */
.button-primary {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
}
```

### Step 5: Test & Verify

```bash
# Run linter
npm run lint

# Run tests
npm test

# Visual regression (if available)
npm run test:visual
```

### Step 6: Enable ESLint Rule

After all violations are fixed:

```javascript
// .eslintrc.cjs
rules: {
  'codra/no-hardcoded-accent': 'error', // Change from 'warn' to 'error'
}
```

---

## FAQ

### Q: Can I use coral for success states?

**A:** Yes, but only for confirming successful completion (checkmarks, toasts). Not for "completed" badges or status labels.

### Q: What about hover states on primary buttons?

**A:** Permitted. Use `--button-primary-bg-hover` which is still coral, just slightly darker.

### Q: Can Settings pages have ANY accent?

**A:** No. Settings pages must have ZERO accent usage. Configuration is neutral.

### Q: What if I need TWO CTAs on a screen?

**A:** Only ONE can be primary (coral). The second should be `variant="secondary"` (ghost style).

### Q: Can I use coral for error states?

**A:** No. Use red (`var(--color-danger)`) for errors. Coral is for forward progress and success.

---

## Component Reference

All approved components with accent governance:

| Component | File | Accent Usage |
|-----------|------|--------------|
| `Button` (primary variant) | `src/new/components/Button.tsx` | Primary CTA |
| `TabIndicator` | `src/new/components/TabIndicator.tsx` | Active Tab |
| `ProgressDot` | `src/new/components/ProgressDot.tsx` | Active Progress |
| `ProgressSpinner` | `src/new/components/ProgressDot.tsx` | Active Progress |
| `ProgressBar` | `src/new/components/ProgressDot.tsx` | Active Progress |

---

## Acceptance Criteria ✅

- [x] Coral appears only in permitted contexts
- [x] Settings page has zero accent color
- [x] Onboarding has exactly 1 accented element per step
- [ ] Workspace has accent only on active tab + primary CTA
- [x] Header has no accent (brand dot removed or neutralized)
- [ ] ESLint rule catches violations in CI

---

## Resources

- **Design Tokens:** `src/lib/design-tokens.ts` (lines 266-375)
- **Audit Utility:** `src/lib/design/accentAudit.ts`
- **ESLint Rule:** `eslint-rules/no-hardcoded-accent.js`
- **PR Checklist:** `.github/ACCENT_COLOR_CHECKLIST.md`
- **Example Components:**
  - `src/new/components/Button.tsx`
  - `src/new/components/TabIndicator.tsx`
  - `src/new/components/ProgressDot.tsx`

---

**Last Updated:** 2026-01-01

**Version:** 1.0.0

**Maintained by:** Design System Team
