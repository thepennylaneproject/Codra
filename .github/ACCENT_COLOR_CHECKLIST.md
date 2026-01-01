# Coral Accent Color Governance - PR Checklist

**Run this checklist on every PR that touches UI components.**

## Governance Philosophy

> **Accent means "do this next" or "success achieved"**
>
> - If something is always accented, nothing is primary
> - Chrome (navigation, tabs, headers) should NEVER use accent
> - Accent moves with the user through a flow

---

## PR Review Checklist

### 1. Does the change introduce coral (#FF6B6B)?

- [ ] **NO** → Approved, no further checks needed
- [ ] **YES** → Continue to question 2

### 2. Is it one of the 5 permitted uses?

Check if the coral usage matches ONE of these permitted cases:

- [ ] **Primary CTA** - Button background fill (ONE per screen max)
- [ ] **Active Progress** - Dot/spinner fill color
- [ ] **Success State** - Checkmark, toast fill or border
- [ ] **Active Tab Indicator** - 2px bottom border underline
- [ ] **Selected Output** - Inspector item left border (2px)

**If NO match:** ❌ Reject - Use neutral alternative

**If YES:** Continue to question 3

### 3. Is there only ONE accented element visible at a time?

- [ ] **YES** → Continue to question 4
- [ ] **NO** → ❌ Reject - Remove redundant accent usage

### 4. Does the accent move the user forward (action) or confirm success?

- [ ] **YES** → ✅ Approved
- [ ] **NO** → ❌ Reject - Accent should indicate next action or success

### 5. Is it decorative?

- [ ] **NO** → ✅ Approved
- [ ] **YES** → ❌ Reject - Use neutral alternative

---

## Prohibited Uses (Auto-Reject)

If the PR introduces coral in ANY of these contexts, **immediately request changes**:

| Prohibited Use | Why | Replacement |
|----------------|-----|-------------|
| Brand dot in header | Decorative | Use `--header-brand-dot` (neutral) or remove |
| Tab underline on hover | Chrome state | Use `--tab-hover-bg` (opacity) |
| Settings selection | Configuration is neutral | Use `--settings-selection` (border only) |
| Avatar ring | Feature removed | N/A |
| Upgrade badge | Monetization shouldn't scream | Use `--upgrade-badge` (subtle) |
| Model Selector badge | Feature hidden | N/A |
| Sparkle particles | Feature removed | N/A |
| Any decorative glow/shadow | Visual decoration | Use neutral colors |
| Text selection highlight | Not an action | Use neutral background |

---

## Implementation Checks

### Code Patterns to Flag

```tsx
// ❌ VIOLATION: Hardcoded coral in className
<Button className="bg-[#FF6B6B] hover:bg-[#FF5252]" />

// ✅ CORRECT: Use variant="primary"
<Button variant="primary" />
```

```tsx
// ❌ VIOLATION: Inline style with coral
<div style={{ backgroundColor: '#FF6B6B' }} />

// ✅ CORRECT: Use CSS variable
<div style={{ backgroundColor: 'var(--button-primary-bg)' }} />
```

```tsx
// ❌ VIOLATION: Decorative coral glow
<div className="bg-gradient-to-r from-[#FF6B6B]/20" />

// ✅ CORRECT: Use neutral glow
<div className="bg-gradient-to-r from-[#1A1A1A]/10" />
```

### Component Usage Checks

- [ ] Primary buttons use `<Button variant="primary">` (NOT className overrides)
- [ ] Progress indicators use `<ProgressSpinner>` or `<ProgressBar>` components
- [ ] Active tabs use `<TabIndicator active={true}>` component
- [ ] Success states use `<SuccessToast>` or semantic tokens
- [ ] Selected items use `--output-selected-border` variable

---

## Design Token Usage

All coral usage MUST reference semantic design tokens:

### CSS Variables (Permitted Uses)

```css
/* Primary CTA */
--button-primary-bg: var(--color-accent);
--button-primary-bg-hover: var(--color-accent-hover);
--button-primary-bg-active: var(--color-accent-active);
--button-primary-text: var(--color-ivory);

/* Active Progress */
--progress-active: var(--color-accent);
--progress-active-bg: var(--color-accent-muted);

/* Success State */
--success-icon: var(--color-accent);
--success-border: var(--color-accent-border);
--success-bg: var(--color-accent-muted);

/* Active Tab */
--tab-active-border: var(--color-accent);

/* Selected Output */
--output-selected-border: var(--color-accent);
```

### TypeScript Tokens (Permitted Uses)

```typescript
import { ACCENT_CORAL } from '@/lib/design-tokens';

// Primary CTA
ACCENT_CORAL.permitted.primaryCta.bg
ACCENT_CORAL.permitted.primaryCta.bgHover
ACCENT_CORAL.permitted.primaryCta.text

// Active Progress
ACCENT_CORAL.permitted.activeProgress.fill

// Success State
ACCENT_CORAL.permitted.success.fill

// Active Tab
ACCENT_CORAL.permitted.activeTab.borderColor

// Selected Output
ACCENT_CORAL.permitted.selectedOutput.borderColor
```

---

## Audit Tools

### Manual Audit (Quick Check)

Run this grep command to find all coral usage:

```bash
# Find all hardcoded coral colors
grep -r "#FF6B6B\|#FF5252\|#E64848\|#FF4D4D" src/
```

### Automated Audit (Recommended)

```bash
# Run ESLint with custom accent rule
npm run lint

# Expected: Zero violations after cleanup
```

### Runtime Audit (Development)

Add this to your root component in development:

```typescript
import { auditAccentUsage, logAuditReport } from '@/lib/design/accentAudit';

useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      const report = auditAccentUsage();
      logAuditReport(report);
    }, 1000);
  }
}, []);
```

---

## Quick Reference

### Acceptance Criteria ✅

- [ ] Coral appears only in permitted contexts
- [ ] Settings page has **zero** accent color
- [ ] Onboarding has **exactly 1** accented element per step
- [ ] Workspace has accent only on **active tab** + **primary CTA**
- [ ] Header has **no** accent (brand dot removed or neutralized)
- [ ] ESLint rule catches violations in CI (when enabled)

### Common Violations & Fixes

| Violation | Fix |
|-----------|-----|
| `bg-[#FF6B6B]` on button | Use `variant="primary"` |
| Coral toggle switch | Use `bg-[#1A1A1A]` for active state |
| Coral selection border | Use `border-[#1A1A1A]` |
| Coral hover state | Use `hover:bg-zinc-100` or `hover:opacity-80` |
| Hardcoded spinner color | Use `<ProgressSpinner>` component |
| Coral brand dot | Remove or use `bg-[#8A8A8A]` |

---

## Questions?

- **Design Token Reference**: `src/lib/design-tokens.ts` (lines 266-375)
- **Audit Utility**: `src/lib/design/accentAudit.ts`
- **ESLint Rule**: `eslint-rules/no-hardcoded-accent.js`
- **Example Components**: `src/new/components/Button.tsx`, `TabIndicator.tsx`, `ProgressDot.tsx`

---

**Remember:** When in doubt, use neutral colors. Accent scarcity = accent power.
