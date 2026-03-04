# Domain Naming Migration Verification Checklist

**Quick verification guide for developers implementing the migration.**

---

## Pre-Migration Verification (Phase 0)

- [ ] Read `DOMAIN_NAMING_MAP.md` (understand canonical concepts)
- [ ] Review `LEGACY_IDENTIFIERS_REPORT.md` (understand scope)
- [ ] Understand StorageKeyAdapter usage (read `src/lib/storage/StorageKeyAdapter.ts`)
- [ ] Confirm current branch is up-to-date with main
- [ ] Ensure all tests pass before starting

---

## Phase 1: Type Renaming Verification

After renaming `TearSheetRevision` → `ProjectContextRevision`:

```bash
# Verify no remaining TearSheetRevision
grep -r "TearSheetRevision" src/ --include="*.ts" --include="*.tsx"
# Should return: (nothing, or only comments/adapter)

# Verify imports are updated
grep -r "ProjectContextRevision" src/ --include="*.ts" --include="*.tsx" | wc -l
# Should be > 0 (at least in types and one consumer)
```

- [ ] TypeScript compilation passes (`npm run build` or `tsc --noEmit`)
- [ ] All imports of `ProjectContextRevision` resolve correctly
- [ ] Component props expecting `ProjectContextRevision[]` type-check correctly

---

After renaming `TearSheetIntentData` → `ProjectIntentData`:

```bash
# Verify no remaining TearSheetIntentData
grep -r "TearSheetIntentData" src/ --include="*.ts" --include="*.tsx"
# Should return: (nothing, or only comments/adapter)

# Verify DEFAULT_PROJECT_INTENT constant
grep -r "DEFAULT_PROJECT_INTENT" src/ --include="*.ts" --include="*.tsx" | wc -l
# Should be > 0
```

- [ ] TypeScript compilation passes
- [ ] Default constant is used correctly in onboarding store
- [ ] All field accesses (`.useCase`, `.coreMessage`, etc.) work without issues

---

## Phase 2: Field Renaming Verification

After renaming `tearSheetAnchor` → `contextAnchor`:

```bash
# Verify no remaining tearSheetAnchor in domain code
grep -r "tearSheetAnchor" src/domain/ --include="*.ts" --include="*.tsx"
# Should return: (nothing)

# Check component usage
grep -r "contextAnchor" src/new/ --include="*.ts" --include="*.tsx" | wc -l
# Should be > 0
```

- [ ] SpreadTask.contextAnchor is correctly read in NewSpreadPage
- [ ] PromptExecutionZone displays contextAnchor correctly
- [ ] Task-to-section linking works (test: verify section highlights when task has anchor)

---

After renaming `tearSheetVersion` → `contextVersion`:

```bash
# Verify no remaining tearSheetVersion in types
grep -r "tearSheetVersion" src/domain/ --include="*.ts" --include="*.tsx"
# Should return: (nothing)

# Verify contextVersion is used
grep -r "contextVersion" src/domain/spread/ --include="*.ts" | head -5
```

- [ ] TaskQueue.contextVersion is correctly compared for staleness checks
- [ ] Task queue regeneration works when context version changes

---

After renaming `tearSheetIntent` → `projectIntent`:

```bash
# Verify no remaining tearSheetIntent
grep -r "tearSheetIntent" src/ --include="*.ts" --include="*.tsx"
# Should return: (nothing, or only comments)

# Verify projectIntent is used
grep -r "projectIntent" src/domain/onboarding-types.ts --include="*.ts" | head -3
```

- [ ] Spread generation correctly reads `projectIntent.useCase`
- [ ] Moodboard generator correctly reads `projectIntent` for complexity inference
- [ ] ContextIntentStep correctly updates `projectIntent` on form changes

---

## Phase 3: Storage Key Adapter Verification

After updating `useContextRevisions.ts` to use adapter:

```bash
# Verify adapter is imported
grep -r "storageAdapter" src/hooks/useContextRevisions.ts

# Verify no direct localStorage calls for context revisions
grep -r "codra:tearSheet:" src/hooks/useContextRevisions.ts
# Should return: (nothing, adapter handles it)
```

- [ ] StorageKeyAdapter.getContextRevisions() is called on load
- [ ] StorageKeyAdapter.saveContextRevisions() is called on save
- [ ] Existing legacy localStorage data is still readable (backward compatible)
- [ ] New saves use canonical key `codra:context:revisions:${projectId}`

---

After updating onboarding steps to use adapter:

```bash
# Verify adapter is imported in ModeSelectionStep
grep -r "storageAdapter" src/new/routes/onboarding/steps/ModeSelectionStep.tsx

# Verify no direct localStorage.setItem for tearSheet
grep -r "codra:tearSheet:" src/new/routes/onboarding/steps/ModeSelectionStep.tsx
# Should return: (nothing)
```

- [ ] ModeSelectionStep uses `storageAdapter.saveContextRevisions()`
- [ ] GeneratingStep uses `storageAdapter.saveContextRevisions()`
- [ ] New context revisions are saved to canonical key

---

After updating onboarding profile storage:

```bash
# Verify adapter is used for profile reads/writes
grep -r "storageAdapter.getOnboardingProfile\|storageAdapter.saveOnboardingProfile" src/ --include="*.ts" --include="*.tsx" | wc -l
# Should be > 0

# Verify no direct localStorage calls for onboarding profiles
grep -r 'localStorage.*"codra:onboardingProfile:"' src/ --include="*.ts" --include="*.tsx"
# Should return: (nothing in active code)
```

- [ ] ExecutionDeskPage uses adapter to read onboarding profile
- [ ] ProjectContextPage uses adapter to read onboarding profile
- [ ] GeneratingStep uses adapter to save onboarding profile
- [ ] New saves use canonical key `codra:onboarding-profile:${projectId}`

---

## Phase 4: Constant & Function Renaming Verification

After renaming `DEFAULT_TEAR_SHEET_INTENT` → `DEFAULT_PROJECT_INTENT`:

```bash
# Verify no remaining DEFAULT_TEAR_SHEET_INTENT
grep -r "DEFAULT_TEAR_SHEET_INTENT" src/ --include="*.ts" --include="*.tsx"
# Should return: (nothing)

# Verify DEFAULT_PROJECT_INTENT is used
grep -r "DEFAULT_PROJECT_INTENT" src/domain/onboarding-types.ts
```

- [ ] Constant is exported and used correctly
- [ ] Type is inferred as `ProjectIntentData`

---

After renaming `updateTearSheetIntent()` → `updateProjectIntent()`:

```bash
# Verify no remaining updateTearSheetIntent
grep -r "updateTearSheetIntent" src/ --include="*.ts" --include="*.tsx"
# Should return: (nothing)

# Verify updateProjectIntent is used
grep -r "updateProjectIntent" src/new/routes/onboarding/ --include="*.tsx" | wc -l
# Should be > 0
```

- [ ] ContextIntentStep calls `updateProjectIntent()` correctly
- [ ] Store action `updateProjectIntent()` is invoked

---

## Phase 5: Comprehensive Verification

### Storage Keys Check

```bash
# After migration, verify canonical storage keys are used
# Open DevTools → Application → localStorage
# Look for these canonical keys:
# - codra:context:revisions:${projectId}
# - codra:spread:${projectId}
# - codra:task-queue:${projectId}
# - codra:onboarding-profile:${projectId}

# Should NOT see these legacy keys:
# - codra:tearSheet:${projectId}
# (unless from old projects, and adapter should handle them)
```

**Verification Steps:**
1. Create a new project
2. Go through onboarding
3. Open DevTools → Application → localStorage → Storage
4. Filter for `codra:` keys
5. Confirm canonical key names are used
6. Confirm no legacy keys are created by new code

---

### Type Checking

```bash
# Full TypeScript compilation
npm run build
# or
npx tsc --noEmit

# Should have 0 errors related to:
# - TearSheet (except in adapter/legacy context)
# - tearSheetAnchor, tearSheetVersion, tearSheetIntent
```

- [ ] No TypeScript errors in build
- [ ] No unused imports of old types

---

### Runtime Testing

**Test Checklist:**

1. **Onboarding Flow**
   - [ ] Create new project through onboarding
   - [ ] Verify storage keys use canonical names
   - [ ] Verify onboarding profile is saved correctly

2. **Spread Generation**
   - [ ] Generate spread for existing project
   - [ ] Verify sections are generated correctly
   - [ ] Verify spread is saved with canonical key

3. **Task Queue**
   - [ ] Generate task queue
   - [ ] Verify contextVersion is set correctly
   - [ ] Verify contextAnchor references are valid

4. **Revision History**
   - [ ] Edit project context
   - [ ] Create a draft revision
   - [ ] Create an approved revision
   - [ ] Verify revisions are saved with canonical key
   - [ ] Restore previous revision
   - [ ] Verify revision restores correctly

5. **Execution**
   - [ ] Start a task
   - [ ] Verify task reads projectIntent correctly
   - [ ] Verify task output uses contextAnchor

---

### Backward Compatibility Testing

**Test Legacy Data Migration:**

1. Create an old project (with legacy storage keys)
2. Open it in updated code
3. Verify adapter reads legacy data correctly
4. Make a change (e.g., edit context)
5. Verify change is saved to canonical key
6. Reload page
7. Verify data loads correctly
8. Verify both legacy and canonical keys are present (during transition period)

- [ ] StorageKeyAdapter.getContextRevisions() reads legacy key
- [ ] StorageKeyAdapter.saveContextRevisions() writes canonical key
- [ ] Legacy data is not lost during migration
- [ ] New edits use canonical keys

---

## Grep Confirmation Checklist

Run these final grep commands to confirm migration:

```bash
# 1. No TearSheet in domain or new code
grep -r "TearSheet\|tearSheet" src/domain/ src/new/ --include="*.ts" --include="*.tsx"
# Should return: (nothing, or only in comments)

# 2. No tearSheetAnchor in code
grep -r "tearSheetAnchor" src/domain/ src/lib/ --include="*.ts" --include="*.tsx"
# Should return: (nothing)

# 3. No tearSheetVersion in code
grep -r "tearSheetVersion" src/domain/ src/lib/ --include="*.ts" --include="*.tsx"
# Should return: (nothing)

# 4. All storage keys follow canonical pattern
grep -r "codra:[a-z-]*:" src/ --include="*.ts" --include="*.tsx" | \
  grep -v "codra:spread:\|codra:task-queue:\|codra:context:\|codra:onboarding-profile:\|codra:extended-onboarding-profile:\|codra:projects\|codra:export:\|codra:lyra:" | \
  head -10
# Should return: (only adapter or comments, if anything)

# 5. Verify canonical names are used
grep -r "contextAnchor\|contextVersion\|projectIntent\|ProjectContextRevision\|ProjectIntentData" src/domain/ --include="*.ts" --include="*.tsx" | wc -l
# Should be > 20 (multiple uses throughout codebase)
```

---

## Code Review Checklist

When reviewing PRs for this migration:

- [ ] All TearSheet/tearSheet references removed from non-adapter code
- [ ] All imports updated to use canonical names
- [ ] StorageKeyAdapter used for all localStorage operations
- [ ] No direct `localStorage.setItem/getItem` for migrated keys
- [ ] Type definitions match domain naming map
- [ ] Function signatures updated (parameter names, return types)
- [ ] Comments updated to reflect new terminology
- [ ] Tests pass (especially storage/adapter tests)
- [ ] No regression in existing functionality

---

## Final Verification

After all phases complete:

**Smoketest (10 minutes):**
1. Create new project via onboarding
2. Review generated spread
3. Check localStorage for canonical keys
4. Execute a task
5. Edit project context
6. Restore previous context revision
7. Check that all operations work smoothly

**Automated Verification:**
```bash
# Run full test suite
npm test

# Run type check
npm run type-check

# Run build
npm run build

# Run linter
npm run lint

# All should pass with 0 errors
```

**Manual Verification:**
- [ ] No console errors in DevTools
- [ ] No TypeScript errors in IDE
- [ ] Storage keys visible in DevTools match canonical pattern
- [ ] All user workflows (create, edit, execute, view revisions) work

---

## Sign-Off

When all checks pass, update this file:

**Completed by:** [Name]
**Date:** [Date]
**PR Link:** [GitHub PR URL]
**Notes:** [Any issues encountered or special considerations]

---

## Rollback Plan (If Needed)

If critical issues are discovered:

1. Revert all commits from this migration
2. Run: `npm install` (restore dependencies)
3. Run: `npm run build` (verify old code builds)
4. File issue with detailed error reproduction
5. Re-plan migration with adjustments

**Estimated Rollback Time:** < 5 minutes

