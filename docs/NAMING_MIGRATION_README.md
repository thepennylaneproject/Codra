# CODRA Domain Naming Migration Guide

**Quick-start guide for implementing canonical domain terminology across CODRA.**

---

## 📚 Documents in This Migration

1. **`DOMAIN_NAMING_MAP.md`** — **START HERE**
   - Canonical concepts and definitions
   - Legacy terms and what replaces them
   - Storage key conventions
   - Analytics event naming

2. **`LEGACY_IDENTIFIERS_REPORT.md`** — **SCOPE & PLANNING**
   - Complete scan of all legacy identifiers
   - Categorized by type and risk level
   - File-by-file cleanup roadmap
   - Phase-by-phase migration strategy

3. **`NAMING_MIGRATION_VERIFICATION.md`** — **TESTING & VALIDATION**
   - Pre-migration checklist
   - Per-phase verification steps
   - Grep commands to confirm completion
   - Runtime testing scenarios
   - Sign-off process

4. **`src/lib/storage/StorageKeyAdapter.ts`** — **IMPLEMENTATION**
   - Non-breaking backward-compatible adapter
   - Reads legacy keys, writes canonical keys
   - Migration utilities for one-time data conversion

---

## 🎯 In One Minute: What's Changing?

| Old Term | New Term | Why |
|----------|----------|-----|
| `TearSheet` | `ProjectContext` | Reflects actual concept (project's brief/requirements) |
| `TearSheetRevision` | `ProjectContextRevision` | Consistent naming |
| `TearSheetIntentData` | `ProjectIntentData` | Clearer, shorter |
| `tearSheetAnchor` | `contextAnchor` | Consistent field naming |
| `tearSheetVersion` | `contextVersion` | Consistent field naming |
| `tearSheetIntent` | `projectIntent` | Consistent field naming |
| `codra:tearSheet:` | `codra:context:revisions:` | Follows canonical key pattern |
| `codra:onboardingProfile:` | `codra:onboarding-profile:` | snake_case convention |

**Bottom Line:** All terminology now reflects domain concepts (Project, Context, Spread, Workspace, Desk), not implementation details.

---

## ⚡ Quick Start for Developers

### Step 1: Read the Map (5 min)
Open `DOMAIN_NAMING_MAP.md`:
- Scroll to "Quick Start (One-Minute Glossary)"
- Understand the 7 canonical concepts
- Bookmark for reference

### Step 2: Understand Your Task (10 min)
1. Check `LEGACY_IDENTIFIERS_REPORT.md` → "Safe-to-Rename-Now Summary"
2. Find your assigned identifiers
3. Note which files need changes

### Step 3: Make Changes (varies by task)
**Example: Renaming `TearSheetRevision`**

```bash
# 1. Update type definition in src/domain/types.ts
-export interface TearSheetRevision { ... }
+export interface ProjectContextRevision { ... }

# 2. Update all imports
grep -r "TearSheetRevision" src/ --include="*.ts" --include="*.tsx"
# Replace all with ProjectContextRevision

# 3. Test
npm run build
npm run type-check
```

### Step 4: Verify (5 min)
Open `NAMING_MIGRATION_VERIFICATION.md`:
- Find your phase (1-5)
- Run the grep commands
- Check the verification box
- Commit

---

## 📋 Migration Timeline

| Phase | Task | Files | Effort | Risk |
|-------|------|-------|--------|------|
| 1 | Setup (Adapter + Docs) | ✅ Done | 1h | None |
| 2 | Type Renaming | 6-8 files | 4-6h | Low |
| 3 | Field Renaming | 8-10 files | 6-8h | Low |
| 4 | Storage Key Migration | 4-5 files | 4-6h | Low* |
| 5 | Const/Function Renaming | 5-6 files | 1-2h | None |
| 6 | Cleanup & Testing | All | 2-3h | None |

**Total:** ~20-30 hours spread over 2-3 weeks
**Can be parallelized:** Phases 2-5 are largely independent

*Low risk because StorageKeyAdapter handles backward compatibility

---

## 🛡️ Safety Features

### 1. Backward Compatibility
- **StorageKeyAdapter** reads both legacy and canonical keys
- Old projects continue to work seamlessly
- New saves automatically use canonical keys

### 2. Type Safety
- All changes are TypeScript-first
- Compiler catches mismatches immediately
- No runtime surprises

### 3. Gradual Migration
- No need to migrate all data at once
- Can run with mixed legacy/canonical keys
- Migration happens naturally over time

### 4. Zero User Disruption
- Users don't see any UI changes
- No data loss
- Existing projects work unchanged

---

## ❓ FAQ

### Q: Will this break my existing projects?
**A:** No. StorageKeyAdapter reads legacy keys, so existing projects load normally.

### Q: Can I deploy this incrementally?
**A:** Yes! Each phase is independent. You can deploy Phase 1-2 before Phase 3-4.

### Q: What if I need to rollback?
**A:** Just revert commits. Adapter ensures we never delete legacy keys, so old data is safe.

### Q: How do I know I'm done?
**A:** Run the verification checklist in `NAMING_MIGRATION_VERIFICATION.md`. All checks ✅ = done.

### Q: Which document do I read first?
**A:** `DOMAIN_NAMING_MAP.md` — it's the source of truth.

### Q: I'm seeing `TearSheet` in old code comments. Should I rename that too?
**A:** Only if the comment explains implementation detail. If it's documenting history ("Rebranded from TearSheet..."), leave it for context.

---

## 🔍 Key Files & Their Roles

| File | Purpose | Who Reads |
|------|---------|-----------|
| `DOMAIN_NAMING_MAP.md` | Canonical reference | Everyone (bookmark it) |
| `LEGACY_IDENTIFIERS_REPORT.md` | Scope & roadmap | Architects, task planners |
| `NAMING_MIGRATION_VERIFICATION.md` | Testing checklist | Implementers, reviewers |
| `StorageKeyAdapter.ts` | Backward-compatible adapter | Implementers |

---

## 📞 Getting Help

### I don't understand a canonical concept
→ Open `DOMAIN_NAMING_MAP.md` → "Canonical Concepts" section

### I'm not sure which files to edit
→ Open `LEGACY_IDENTIFIERS_REPORT.md` → "File-by-File Cleanup Roadmap"

### I need to verify my changes
→ Open `NAMING_MIGRATION_VERIFICATION.md` → Find your phase

### I found an identifier that's not in the report
→ It's either:
1. New code (doesn't need migration)
2. Missed in scan (add to report, file issue)
3. In StorageKeyAdapter (expected place for legacy terms)

---

## 🚀 Getting Started Now

1. **Bookmark:** `docs/DOMAIN_NAMING_MAP.md`
2. **Read:** "Quick Start (One-Minute Glossary)"
3. **Download:** Copy these docs locally
4. **Discuss:** Share with team (15-min sync)
5. **Plan:** Assign phases to developers
6. **Execute:** Start with Phase 1 (done!) then Phase 2

---

## ✅ Completion Criteria

When migration is complete:

- [ ] Zero `TearSheet`/`tearSheet` in src/domain, src/new, src/lib (except adapter)
- [ ] All storage keys follow canonical pattern
- [ ] All type names use canonical forms
- [ ] All tests pass
- [ ] PR merged with approval from architecture/lead
- [ ] DOMAIN_NAMING_MAP.md updated with "Completed: [date]"

---

## 📊 Impact Summary

**Before Migration:**
- 30 files using legacy terminology
- ~150+ legacy identifier occurrences
- Inconsistent storage key patterns
- Terminology confusion for new developers

**After Migration:**
- Canonical terminology across codebase
- Consistent storage key patterns
- New developers can learn domain model in 1 minute
- Reduced cognitive load (reason about concepts, not terminology)

---

## Next Steps

1. **Now:** Read `DOMAIN_NAMING_MAP.md` (5 min)
2. **Today:** Discuss timeline with team (15 min)
3. **This week:** Plan phase ownership
4. **Next week:** Start Phase 2 (type renaming)

---

**Questions? Check the specific document. Can't find it? File an issue.**

Happy migrating! 🎉

