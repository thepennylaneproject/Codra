# Legacy Identifiers Report

**Date:** 2026-01-17
**Status:** Comprehensive Codebase Scan
**Purpose:** Identify and categorize all legacy/non-canonical terminology for safe migration

---

## Executive Summary

**Total Files Affected:** 29
**Total Legacy Identifier Occurrences:** ~150+
**Critical Category (Safe to Rename Now):** 12 identifiers
**Important Category (Requires Migration Plan):** 18 identifiers
**Files with Storage Key Issues:** 4
**Files with Type Definition Issues:** 6

---

## Category 1: Type Name Issues (SAFE TO RENAME NOW)

These can be renamed immediately in type definitions without breaking code.

### 1.1 `TearSheetRevision` → `ProjectContextRevision`

**Canonical:** `ProjectContextRevision`

**Current Status:**
```typescript
// CURRENT (DEPRECATED)
export interface TearSheetRevision {
    id: string;
    version: number;
    createdAt: string;
    summary: string;
    status: 'draft' | 'approved';
    // ...
}
```

**Files to Update:** 6
- `src/domain/types.ts` (type definition)
- `src/hooks/useContextRevisions.ts` (import, usage, function params)
- `src/components/context/RevisionSelector.tsx` (import, props)
- `src/components/context/VersionHistory.tsx` (import, props)
- `src/new/routes/onboarding/steps/ModeSelectionStep.tsx` (import, variable)
- `src/new/routes/onboarding/steps/GeneratingStep.tsx` (import, variable)

**Effort:** Low
**Risk:** Low (type rename with search-and-replace)
**Action:** Rename type, update all imports and usages

---

### 1.2 `TearSheetIntentData` → `ProjectIntentData` (or `OnboardingIntentData`)

**Canonical:** `ProjectIntentData` (suggests project-level intent) or `OnboardingIntentData` (suggests it's from onboarding)

**Current Status:**
```typescript
// CURRENT (DEPRECATED)
export interface TearSheetIntentData {
    storyStatement?: string;
    coreMessage?: string;
    useCase?: string;
    detailLevel?: number;
    // ...
}

export const DEFAULT_TEAR_SHEET_INTENT: TearSheetIntentData = { ... }
```

**Files to Update:** 7
- `src/domain/onboarding-types.ts` (type def, constant)
- `src/new/routes/onboarding/store.ts` (import, type, function name)
- `src/new/routes/onboarding/steps/ContextIntentStep.tsx` (import, usage)
- `src/new/routes/onboarding/moodboardGeneratorV2.ts` (usage)

**Effort:** Low
**Risk:** Low
**Action:** Rename type and default constant; update all imports and usages

**Recommendation:** Use `ProjectIntentData` (shorter, refers to project-level intent)

---

## Category 2: Field Name Issues (SAFE TO RENAME NOW)

These are struct field names that can be updated with careful refactoring.

### 2.1 `tearSheetAnchor` → `contextAnchor` or `contextSectionId`

**Canonical:** `contextAnchor` (consistent with domain terminology)

**Current Status:**
```typescript
// CURRENT (DEPRECATED)
export interface SpreadTask {
    // ...
    tearSheetAnchor?: string; // Reference to context section
    // ...
}
```

**Occurrences:** 17 in `src/domain/spread/task-queue-engine.ts` + references in other files

**Files to Update:** 8
- `src/domain/task-queue.ts` (field definition)
- `src/domain/spread/task-queue-engine.ts` (17 assignments)
- `src/new/routes/NewSpreadPage.tsx` (2 usages)
- `src/new/components/PromptExecutionZone.tsx` (1 usage)
- `src/lib/coherence-scan/coherence-scan-service.ts` (1 usage)

**Effort:** Low-Medium (multiple occurrences but straightforward replacements)
**Risk:** Low (internal field)
**Action:** Rename field; use find-and-replace; test that task-to-section linking still works

---

### 2.2 `tearSheetVersion` → `contextVersion`

**Canonical:** `contextVersion`

**Current Status:**
```typescript
// CURRENT (DEPRECATED)
export interface TaskQueue {
    // ...
    tearSheetVersion: number;  // Version of context that generated this queue
    // ...
}

export function detectScopeChange(
    queue: TaskQueue,
    currentTearSheetVersion: number
): boolean
```

**Occurrences:** 5
- `src/domain/task-queue.ts` (field definition)
- `src/domain/spread/task-queue-engine.ts` (3 usages in function signatures and assignments)
- `src/lib/project-state/ProjectStateManager.ts` (1 usage)

**Effort:** Low
**Risk:** Low
**Action:** Rename field and function parameters; update call sites

---

### 2.3 `tearSheetIntent` → `projectIntent` or `onboardingIntent`

**Canonical:** `projectIntent` (in ExtendedOnboardingProfile context)

**Current Status:**
```typescript
// CURRENT (DEPRECATED)
export interface ExtendedOnboardingProfile {
    // ...
    tearSheetIntent: TearSheetIntentData;  // Project intent/use case
    // ...
}
```

**Occurrences:** ~10+ across codebase

**Files to Update:** 7
- `src/domain/onboarding-types.ts` (field definition)
- `src/new/routes/onboarding/store.ts` (function names, field access)
- `src/new/routes/onboarding/steps/ContextIntentStep.tsx` (7+ usages)
- `src/domain/spread/section-builders.ts` (2 usages)
- `src/new/routes/onboarding/steps/GeneratingStep.tsx` (2 usages)
- `src/new/routes/onboarding/moodboardGeneratorV2.ts` (1 usage)

**Effort:** Low-Medium
**Risk:** Low (internal field, well-scoped)
**Action:** Rename field; update all field access; update function names (e.g., `updateTearSheetIntent` → `updateProjectIntent`)

---

## Category 3: Storage Key Issues (REQUIRES ADAPTER FIRST, THEN GRADUAL MIGRATION)

These storage keys are in use across the app and should migrate gradually using the StorageKeyAdapter.

### 3.1 `codra:tearSheet:${projectId}` → `codra:context:revisions:${projectId}`

**Status:** USES ADAPTER

**Current Usage:** 4 files
- `src/new/routes/onboarding/steps/ModeSelectionStep.tsx` (2 writes)
- `src/new/routes/onboarding/steps/GeneratingStep.tsx` (1 write)
- `src/hooks/useContextRevisions.ts` (STORAGE_PREFIX constant)

**Migration Path:**
1. StorageKeyAdapter already handles this (reads both, writes canonical)
2. Update `useContextRevisions.ts` to use adapter instead of direct localStorage
3. Update onboarding steps to use adapter for writes
4. Adapter will transparently migrate on read

**Effort:** Low-Medium
**Risk:** Low (adapter provides safety layer)
**Action:** Use StorageKeyAdapter in place of direct `localStorage.setItem/getItem`

**Code Change Example:**
```typescript
// BEFORE
localStorage.setItem(`codra:tearSheet:${projectId}`, JSON.stringify([revision]));

// AFTER
storageAdapter.saveContextRevisions(projectId, [revision]);
```

---

### 3.2 `codra:onboardingProfile:${projectId}` → `codra:onboarding-profile:${projectId}` (camelCase → snake_case)

**Status:** USES ADAPTER

**Current Usage:** 5 files
- `src/new/routes/NewSpreadPage.tsx` (1 read)
- `src/new/routes/ExecutionDeskPage.tsx` (1 read)
- `src/new/routes/ProjectContextPage.tsx` (1 read)
- `src/new/routes/onboarding/steps/GeneratingStep.tsx` (1 write)

**Migration Path:**
1. StorageKeyAdapter handles this (reads camelCase legacy, writes snake_case canonical)
2. Update all reads to use `storageAdapter.getOnboardingProfile(projectId)`
3. Update all writes to use `storageAdapter.saveOnboardingProfile(projectId, profile)`
4. Adapter transparently handles migration

**Effort:** Low
**Risk:** Low (adapter provides safety layer)
**Action:** Replace all direct localStorage calls with adapter methods

---

### 3.3 `codra:smartDefaults:${projectId}` → `codra:onboarding-profile:${projectId}` (merge into profile)

**Status:** POTENTIALLY DEPRECATED

**Current Usage:** 1 file
- `src/new/routes/onboarding/hooks/useSpreadGeneration.ts` (1 write)

**Issue:** This key stores smart defaults but duplicates information that could live in OnboardingProfile or ExtendedOnboardingProfile.

**Recommendation:**
- Determine if smartDefaults are actually used elsewhere
- If not, remove and merge into extended profile
- If yes, migrate to canonical key structure

**Effort:** Medium (requires understanding usage context)
**Risk:** Medium (may have undocumented dependencies)
**Action:** Audit usage; either deprecate or migrate to proper storage

---

## Category 4: Comment/Constant Issues (SAFE TO UPDATE)

### 4.1 `DEFAULT_TEAR_SHEET_INTENT` → `DEFAULT_PROJECT_INTENT`

**Location:** `src/domain/onboarding-types.ts:436`

**Status:** Rename-only change

**Effort:** Trivial
**Risk:** None (constant rename with usage update)
**Action:** Rename constant and update all references (1-2 files)

---

## Category 5: Variable & Function Name Issues (LOW-RISK REFACTORING)

### 5.1 Function: `updateTearSheetIntent()` → `updateProjectIntent()`

**Location:** `src/new/routes/onboarding/store.ts:227`

**Current Status:**
```typescript
updateTearSheetIntent: (updates: Partial<TearSheetIntentData>) => void;
```

**Files to Update:**
- `src/new/routes/onboarding/store.ts` (definition)
- `src/new/routes/onboarding/steps/ContextIntentStep.tsx` (usage)

**Effort:** Trivial
**Risk:** None
**Action:** Rename function and all call sites

---

### 5.2 Variable: `tearSheetRevision` → `contextRevision`

**Locations:**
- `src/new/routes/onboarding/steps/ModeSelectionStep.tsx` (variable name)
- `src/new/routes/onboarding/steps/GeneratingStep.tsx` (variable name)

**Effort:** Trivial
**Risk:** None
**Action:** Rename variable (local scope, safe)

---

### 5.3 Variable: `currentTearSheetVersion` → `currentContextVersion`

**Location:** `src/domain/spread/task-queue-engine.ts:399`

**Effort:** Trivial
**Risk:** None
**Action:** Rename parameter and local variable

---

## Category 6: Complex Issues (REQUIRES MIGRATION PLANNING)

### 6.1 `tearSheetIntent.useCase` in Multiple Places

**Issue:** The `useCase` field within `TearSheetIntentData` is used to determine project type and complexity. When renamed to `ProjectIntentData.useCase`, all downstream logic must be updated.

**Affected Code:**
- `src/new/routes/onboarding/steps/GeneratingStep.tsx` (2 conditionals on useCase)
- `src/domain/spread/section-builders.ts` (1 check on useCase)
- `src/new/routes/onboarding/moodboardGeneratorV2.ts` (1 check on useCase)

**Migration Path:**
1. Keep field name unchanged (`useCase` is clear)
2. Update only the parent interface name (`TearSheetIntentData` → `ProjectIntentData`)
3. All useCase checks continue to work

**Effort:** Low (no logic changes needed)
**Risk:** Low
**Action:** Update type name only; field access unchanged

---

### 6.2 Comment Referencing Deprecated Term

**Location:** `src/domain/types.ts:107`
```typescript
// Rebranded from TearSheet to ProjectContext
export interface ProjectContext { ... }
```

**Status:** Comment is good documentation! Keep it.

**Action:** No change needed (or update comment to reference this migration document)

---

## Migration Strategy: Phased Approach

### Phase 1: Setup (Non-Breaking)
- ✅ StorageKeyAdapter already created
- ✅ Naming map already created
- [ ] Add StorageKeyAdapter to exports/index
- [ ] Update documentation

**Effort:** 1-2 hours
**Risk:** None

---

### Phase 2: Type Renaming (Isolated Changes)
- [ ] Rename `TearSheetRevision` → `ProjectContextRevision`
- [ ] Rename `TearSheetIntentData` → `ProjectIntentData`
- [ ] Update all imports and usages

**Effort:** 4-6 hours
**Risk:** Low (search-and-replace friendly)
**Validation:** TypeScript should catch all breaking changes

---

### Phase 3: Field Renaming (Systematic Updates)
- [ ] Rename field `tearSheetAnchor` → `contextAnchor`
- [ ] Rename field `tearSheetVersion` → `contextVersion`
- [ ] Rename field `tearSheetIntent` → `projectIntent`
- [ ] Update all accesses

**Effort:** 6-8 hours
**Risk:** Low-Medium (ensure function signatures match)
**Validation:** Test task-to-section linking, version tracking

---

### Phase 4: Storage Key Migration (Gradual with Adapter)
- [ ] Replace direct localStorage calls with StorageKeyAdapter
- [ ] Update `useContextRevisions.ts` to use adapter
- [ ] Update onboarding steps to use adapter
- [ ] Monitor for any missed keys

**Effort:** 4-6 hours
**Risk:** Low (adapter handles fallback)
**Validation:** Test localStorage read/write across projects

---

### Phase 5: Variable & Function Renaming (Polish)
- [ ] Rename constants (`DEFAULT_TEAR_SHEET_INTENT` → `DEFAULT_PROJECT_INTENT`)
- [ ] Rename functions (`updateTearSheetIntent` → `updateProjectIntent`)
- [ ] Rename local variables (`tearSheetRevision` → `contextRevision`)

**Effort:** 1-2 hours
**Risk:** None
**Validation:** Simple grep confirmation

---

### Phase 6: Cleanup (Final)
- [ ] Verify no remaining `TearSheet` or `tearSheet` in new code
- [ ] Update API docs if applicable
- [ ] Add comment in DOMAIN_NAMING_MAP noting completion
- [ ] Plan legacy storage key cleanup (after safeguarding period)

**Effort:** 1-2 hours
**Risk:** None

---

## Safe-to-Rename-Now Summary

These identifiers can be renamed immediately with low risk:

| Identifier | Type | Current | Canonical | Risk | Effort |
|-----------|------|---------|-----------|------|--------|
| `TearSheetRevision` | Type | → | `ProjectContextRevision` | Low | Low |
| `TearSheetIntentData` | Type | → | `ProjectIntentData` | Low | Low |
| `tearSheetAnchor` | Field | → | `contextAnchor` | Low | Low-Med |
| `tearSheetVersion` | Field | → | `contextVersion` | Low | Low |
| `tearSheetIntent` | Field | → | `projectIntent` | Low | Low-Med |
| `DEFAULT_TEAR_SHEET_INTENT` | Const | → | `DEFAULT_PROJECT_INTENT` | None | Trivial |
| `updateTearSheetIntent()` | Function | → | `updateProjectIntent()` | None | Trivial |
| `tearSheetRevision` (var) | Variable | → | `contextRevision` | None | Trivial |
| `currentTearSheetVersion` (param) | Parameter | → | `currentContextVersion` | None | Trivial |
| `DEFAULT_TEAR_SHEET_INTENT` (const) | Constant | → | `DEFAULT_PROJECT_INTENT` | None | Trivial |

---

## Requires-Migration-Plan Summary

These require coordination or carry higher risk:

| Identifier | Current | Issue | Mitigation | Effort |
|-----------|---------|-------|-----------|--------|
| `codra:tearSheet:` | Key | Legacy storage | Use StorageKeyAdapter | Med |
| `codra:onboardingProfile:` | Key | camelCase → snake_case | Use StorageKeyAdapter | Med |
| `codra:smartDefaults:` | Key | Unclear usage | Audit + migrate | Med-High |

---

## File-by-File Cleanup Roadmap

### High-Impact Files (Rename This First)

1. **`src/domain/types.ts`** (2 changes)
   - Rename `TearSheetRevision` → `ProjectContextRevision`
   - Update comment if desired

2. **`src/domain/onboarding-types.ts`** (3 changes)
   - Rename `TearSheetIntentData` → `ProjectIntentData`
   - Rename `DEFAULT_TEAR_SHEET_INTENT` → `DEFAULT_PROJECT_INTENT`

3. **`src/domain/task-queue.ts`** (2 changes)
   - Rename field `tearSheetAnchor` → `contextAnchor`
   - Rename field `tearSheetVersion` → `contextVersion`

### Medium-Impact Files (Update After Core Rename)

4. **`src/hooks/useContextRevisions.ts`** (Update to use StorageKeyAdapter)
5. **`src/new/routes/onboarding/store.ts`** (Rename function + field access)
6. **`src/domain/spread/task-queue-engine.ts`** (Update field references)

### Lower-Impact Files (Can be Updated in Batches)

- All remaining files with field access (`tearSheetIntent`, `contextAnchor`, etc.)

---

## Verification Checklist

After completing the migration:

- [ ] Zero instances of `TearSheet` or `tearSheet` in new code (legacy only in adapter/comments)
- [ ] All `ProjectContextRevision` correctly imported
- [ ] All `ProjectIntentData` correctly imported
- [ ] All `contextAnchor` field accesses work
- [ ] All `contextVersion` field accesses work
- [ ] All `projectIntent` field accesses work
- [ ] StorageKeyAdapter successfully reads legacy keys
- [ ] StorageKeyAdapter writes only to canonical keys
- [ ] localStorage after a save uses canonical key names
- [ ] All tests pass
- [ ] Code review confirms naming consistency

---

## Questions & Support

For clarification or issues during migration, refer to:
1. `docs/DOMAIN_NAMING_MAP.md` (canonical reference)
2. `src/lib/storage/StorageKeyAdapter.ts` (adapter usage)
3. Git history for rename PRs (commit messages explain changes)

