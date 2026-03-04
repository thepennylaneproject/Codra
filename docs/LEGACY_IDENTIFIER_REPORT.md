## Legacy Identifier Report (grep-based)

Generated with:

```
rg -n "tearSheet|TearSheet|tear-sheet|codra:taskQueue|codra:onboardingProfile|codra:smartDefaults" src
```

### Safe to rename now

- Adapter-only legacy keys (expected): `src/lib/storage/StorageKeyAdapter.ts`
- Alias for compatibility: `src/domain/types.ts:101` (`TearSheetRevision` → alias of `ProjectContextRevision`)
- Comment-only legacy label: `src/domain/types.ts:109` (rebranding note)

### Requires migration plan

These identifiers are persisted or stored in localStorage/DB and need a migration strategy before renaming.

- `tearSheetAnchor` / `tearSheetVersion` (TaskQueue persisted fields, now normalized to `contextAnchor`/`contextVersion`)
  - `src/domain/task-queue.ts`
  - `src/domain/spread/task-queue-engine.ts`
  - `src/hooks/useSupabaseSpread.ts` (maps to `tear_sheet_version`)
  - `src/new/components/PromptExecutionZone.tsx` (display of `tearSheetAnchor`)
- `tearSheetIntent` / `TearSheetIntentData` (legacy onboarding field, now normalized to `projectIntent`)
  - `src/domain/onboarding-types.ts`
  - `src/new/routes/onboarding/store.ts`
  - `src/new/routes/onboarding/steps/ContextIntentStep.tsx`
  - `src/new/routes/onboarding/moodboardGeneratorV2.ts`
  - `src/domain/spread/section-builders.ts`
- `tear-sheet-intent` (legacy step identifier used in onboarding flow routing)
  - `src/new/routes/onboarding/store.ts`

### Notes

- Legacy localStorage keys (`codra:tearSheet:*`, `codra:onboardingProfile:*`, `codra:taskQueue:*`, `codra:smartDefaults:*`) are now read-only via the adapter. New writes use canonical keys.
