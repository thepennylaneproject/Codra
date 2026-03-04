# Domain Naming Migration: Document Index

**Navigation guide to all migration documents.**

---

## 🎯 Find Your Document by Role

### I'm a Product Manager / Stakeholder
**You need to understand:** What's changing and why?

→ Read: `NAMING_MIGRATION_SUMMARY.md` (2 min)
→ Then: `DOMAIN_NAMING_MAP.md` "Quick Start" section (1 min)

---

### I'm an Architect / Tech Lead
**You need to understand:** Complete scope, risks, and implementation plan

→ Read: `NAMING_MIGRATION_SUMMARY.md` (2 min)
→ Read: `LEGACY_IDENTIFIERS_REPORT.md` (10 min)
→ Reference: `DOMAIN_NAMING_MAP.md` (bookmark for team)
→ Action: Plan phase ownership and timeline

---

### I'm a Developer Implementing Changes
**You need to understand:** What to change and how to verify it

→ Read: `NAMING_MIGRATION_README.md` "Quick Start" (5 min)
→ Check: `LEGACY_IDENTIFIERS_REPORT.md` for your files
→ Implement: Follow the specific changes listed
→ Verify: Use `NAMING_MIGRATION_VERIFICATION.md` checklist
→ Reference: `DOMAIN_NAMING_MAP.md` for canonical names

---

### I'm a Code Reviewer
**You need to understand:** What to look for and approve

→ Read: `NAMING_MIGRATION_VERIFICATION.md` "Code Review Checklist" (2 min)
→ Reference: `LEGACY_IDENTIFIERS_REPORT.md` for expected changes
→ Check: Verify grep commands pass
→ Approve: Use checklist to sign off

---

### I'm Working on Storage / Persistence
**You need to understand:** How to integrate the adapter

→ Read: `src/lib/storage/StorageKeyAdapter.ts` (code comments)
→ Reference: `DOMAIN_NAMING_MAP.md` "Storage Key Convention"
→ Example: See storage update sections in `NAMING_MIGRATION_VERIFICATION.md`

---

## 📚 Find Your Document by Question

### "What is a Spread? What is ProjectContext? What is a Workspace?"
→ `DOMAIN_NAMING_MAP.md` → "Quick Start (One-Minute Glossary)"

### "What old terms need to be renamed?"
→ `LEGACY_IDENTIFIERS_REPORT.md` → "Safe-to-Rename-Now Summary"

### "Which files do I need to edit?"
→ `LEGACY_IDENTIFIERS_REPORT.md` → "File-by-File Cleanup Roadmap"

### "How much effort is this?"
→ `LEGACY_IDENTIFIERS_REPORT.md` → "Migration Strategy: Phased Approach"

### "What are the risks?"
→ `NAMING_MIGRATION_SUMMARY.md` → "Risks Mitigated"

### "How do I verify my changes?"
→ `NAMING_MIGRATION_VERIFICATION.md` → Your phase (1-5)

### "How do I use StorageKeyAdapter?"
→ `src/lib/storage/StorageKeyAdapter.ts` (read code + comments)

### "What should we rename first?"
→ `NAMING_MIGRATION_README.md` → "Migration Timeline"

### "What if something breaks?"
→ `NAMING_MIGRATION_VERIFICATION.md` → "Rollback Plan"

### "I'm confused. Where do I start?"
→ `NAMING_MIGRATION_README.md` → "Quick Start for Developers"

---

## 📋 Document Summary Table

| Document | Purpose | Audience | Read Time | Bookmark? |
|----------|---------|----------|-----------|-----------|
| **NAMING_MIGRATION_SUMMARY.md** | Executive overview | Everyone | 5 min | 👍 Yes |
| **NAMING_MIGRATION_README.md** | Developer quick-start | Implementers | 10 min | 👍 Yes |
| **DOMAIN_NAMING_MAP.md** | Canonical reference | Everyone | 10-15 min | 👍 Yes |
| **LEGACY_IDENTIFIERS_REPORT.md** | Complete scope & roadmap | Architects, implementers | 20-30 min | Optional |
| **NAMING_MIGRATION_VERIFICATION.md** | Testing & validation | Implementers, reviewers | 15 min per phase | 👍 Yes (per phase) |
| **src/lib/storage/StorageKeyAdapter.ts** | Implementation | Storage developers | 10 min | 👍 Reference |

---

## 🚀 Recommended Reading Order

### For Everyone (15 min)
1. This index (you're here)
2. `NAMING_MIGRATION_SUMMARY.md` (2 min)
3. `DOMAIN_NAMING_MAP.md` → "Quick Start" (1 min)
4. `NAMING_MIGRATION_README.md` → "In One Minute" (1 min)

### For Architects (30 min)
1. `NAMING_MIGRATION_SUMMARY.md` (2 min)
2. `LEGACY_IDENTIFIERS_REPORT.md` (15 min)
3. `DOMAIN_NAMING_MAP.md` (10 min, bookmark)
4. Plan: Assign phases to developers

### For Implementers (20 min per phase)
1. `NAMING_MIGRATION_README.md` → Your phase (5 min)
2. `LEGACY_IDENTIFIERS_REPORT.md` → Your phase section (5 min)
3. Implement changes
4. `NAMING_MIGRATION_VERIFICATION.md` → Your phase checklist (10 min)

### For Reviewers (10 min per PR)
1. `NAMING_MIGRATION_VERIFICATION.md` → "Code Review Checklist" (2 min)
2. Run verification commands
3. Review against checklist
4. Approve if all ✅

---

## 🔗 Document Links

**Quick Links (bookmark these):**
- 🗺️ Canonical Reference: [`DOMAIN_NAMING_MAP.md`](./DOMAIN_NAMING_MAP.md)
- 📊 Full Scope: [`LEGACY_IDENTIFIERS_REPORT.md`](./LEGACY_IDENTIFIERS_REPORT.md)
- ✅ Verification: [`NAMING_MIGRATION_VERIFICATION.md`](./NAMING_MIGRATION_VERIFICATION.md)
- 🚀 Quick Start: [`NAMING_MIGRATION_README.md`](./NAMING_MIGRATION_README.md)
- 📋 Summary: [`NAMING_MIGRATION_SUMMARY.md`](./NAMING_MIGRATION_SUMMARY.md)
- 💻 Adapter Code: [`src/lib/storage/StorageKeyAdapter.ts`](../src/lib/storage/StorageKeyAdapter.ts)

---

## 📌 Key Concepts Glossary

**TL;DR** — If you only read this section:

| Concept | What It Is | Example |
|---------|-----------|---------|
| **Project** | Root creative work entity | A website redesign |
| **ProjectContext** | Project's brief (was: TearSheet) | "Build landing page for SaaS" |
| **Spread** | Interactive rendered brief | The formatted brief in the app |
| **Workspace** | Three-column execution environment | Where users run tasks |
| **ProductionDesk** | Specialized executor (Write/Design/Code/Analyze) | The "Write" desk for copy |
| **TaskQueue** | Ordered AI tasks from a Spread version | "Generate copy" → "Design" → "Code" |

**Storage Keys:**
- Old: `codra:tearSheet:` → New: `codra:context:revisions:`
- Old: `codra:onboardingProfile:` → New: `codra:onboarding-profile:`
- (StorageKeyAdapter handles both automatically)

---

## 🎯 Success Criteria

**When is migration complete?**

- [ ] All documents read and understood by team
- [ ] All phases completed (5 phases total)
- [ ] All grep commands pass (zero legacy terms in active code)
- [ ] All tests pass
- [ ] Verification checklist completed
- [ ] PR merged with approvals
- [ ] DOMAIN_NAMING_MAP.md marked as "Completed"

---

## 💬 Getting Help

**I have a question about:**

| Topic | Look Here |
|-------|-----------|
| What a term means | `DOMAIN_NAMING_MAP.md` |
| Which files to change | `LEGACY_IDENTIFIERS_REPORT.md` |
| How to verify changes | `NAMING_MIGRATION_VERIFICATION.md` |
| Getting started | `NAMING_MIGRATION_README.md` |
| Overall status | `NAMING_MIGRATION_SUMMARY.md` |
| Using the adapter | `src/lib/storage/StorageKeyAdapter.ts` comments |

---

## 📅 Timeline Estimate

- **Phase 1** (Setup): ✅ Done
- **Phase 2** (Type renaming): 4-6 hours
- **Phase 3** (Field renaming): 6-8 hours
- **Phase 4** (Storage adapter integration): 4-6 hours
- **Phase 5** (Cleanup): 3-5 hours
- **Total**: 20-30 hours (can parallelize)

**Recommended:** 1-2 weeks (staggered across team)

---

## ✅ Verification

**Each document includes:**
- ✅ Clear purpose statement
- ✅ Navigation guidance
- ✅ Actionable steps
- ✅ Verification commands
- ✅ Sign-off checklist

**This index provides:**
- ✅ Document roadmap
- ✅ Role-based guidance
- ✅ Question-based routing
- ✅ Reading order recommendations
- ✅ Quick reference tables

---

## 🎓 Learning Path

### Beginner (30 min)
1. `NAMING_MIGRATION_SUMMARY.md`
2. `DOMAIN_NAMING_MAP.md` → "Quick Start"
3. `NAMING_MIGRATION_README.md` → "In One Minute"

### Intermediate (1-2 hours)
1. All beginner materials
2. `LEGACY_IDENTIFIERS_REPORT.md` → "Safe-to-Rename-Now"
3. Your assigned phase details

### Advanced (2-3 hours)
1. All beginner + intermediate
2. Full `LEGACY_IDENTIFIERS_REPORT.md`
3. `NAMING_MIGRATION_VERIFICATION.md` for your phase
4. `src/lib/storage/StorageKeyAdapter.ts` source code

---

## 📞 Support Resources

- **Slack Channel:** #domain-naming-migration (team discussion)
- **Drive Folder:** `Domain Naming Migration` (shared docs)
- **GitHub Milestone:** `Domain Naming Refactor` (issue tracking)
- **Wiki Link:** [CODRA Domain Model](../wiki/CODRA-Domain-Model) (background)

---

## Next Action

**Do one of these now:**

👉 **If you haven't read anything yet:**
→ Read `NAMING_MIGRATION_SUMMARY.md` (2 min)

👉 **If you're assigned to implement:**
→ Read `NAMING_MIGRATION_README.md` → "Quick Start" (5 min)

👉 **If you're planning the timeline:**
→ Read `LEGACY_IDENTIFIERS_REPORT.md` → "Migration Strategy" (5 min)

👉 **If you're reviewing code:**
→ Bookmark `NAMING_MIGRATION_VERIFICATION.md` "Code Review Checklist"

---

**Last Updated:** 2026-01-17
**Questions?** See "Getting Help" section above

