# Investor Readiness Remediation Plan
**Audit:** `investor-readiness-audit-2026-03-16.md`  
**Branch:** `cursor/investor-readiness-audit-remediation-4238`  
**Date:** 2026-03-16  
**Owner:** Cursor Cloud Agent  

---

## Executive Summary

The audit scored Codra at **3.5 / 10** for investor readiness. Six critical blockers and eleven recommended improvements were identified. This plan addresses all critical findings and the highest-leverage recommended items in three phases. Estimated total engineering effort: **2–3 days**.

---

## Phase 1 — Critical Blockers (Do Today)

These items must be resolved before any investor or technical evaluator reviews the repo. A broken build and no live demo are disqualifying.

### C1 + C3 · Fix the broken build and failing tests

**Finding:** `npm run build` exits with code 2 due to 4 TypeScript errors in `src/services/__tests__/jobIngestion.test.ts`. The test imports `parseJobResponse`, `ingestJobBatch`, `JobApiResponse`, and `RawJobResult` — none of which are exported from the current `jobIngestion.ts`. 12 of the 13 failing tests come from this file.

**Fix:** Add the missing exports to `src/services/jobIngestion.ts`:
- `interface RawJobResult` — raw API shape (`id`, `title`, `company`, `location`, `description?`, `url?`, `posted_at?`)
- `interface JobApiResponse` — `{ results: RawJobResult[] | null | undefined }`
- `interface ParsedJob` — normalized shape with camelCase `postedAt`
- `interface BatchResult` — `{ batchId, count, jobs }`
- `function parseJobResponse(response: JobApiResponse): ParsedJob[]`
- `async function ingestJobBatch(fetchFn, batchId): Promise<BatchResult>`

**Verification:** `npm run build` passes, `npx vitest run src/services/__tests__/jobIngestion.test.ts` shows 12 passing.

**Files changed:** `src/services/jobIngestion.ts`

---

### C2 · Patch the critical jsPDF vulnerability

**Finding:** `jspdf@^3.0.4` has a critical PDF injection vulnerability (GHSA-pqxr-3g65-p328) allowing arbitrary JavaScript execution.

**Fix:** Run `npm audit fix` and verify `jspdf` is updated to a non-vulnerable version. If `npm audit fix` cannot resolve it automatically, upgrade manually: `npm install jspdf@latest`.

**Verification:** `npm audit` reports 0 critical vulnerabilities.

**Files changed:** `package.json`, `package-lock.json`

---

### C4 · Require authentication on `retrieval_search` endpoint

**Finding:** `netlify/functions/retrieval_search.ts` calls Brave Search and Tavily (paid APIs) for unauthenticated users. In-memory rate limiting is ineffective across serverless cold starts.

**Fix:** Add Supabase JWT verification at the top of the handler (matching the pattern in `ai-complete.ts`). If no valid Bearer token is present, return `401`. The `userId` extraction from the auth header (currently `TODO` at lines 160 and 194) becomes the actual implementation.

**Pattern to follow:** `netlify/functions/ai-complete.ts` — the `verifyUser()` helper pattern.

**Files changed:** `netlify/functions/retrieval_search.ts`

---

### C5 · Add a live demo URL to the README

**Finding:** No deployed URL, no screenshots. Investors cannot evaluate the product without one.

**Action (requires human):** Deploy to Netlify (or confirm the existing deployment is live) and add the URL to the README as the first piece of information after the product description. Add 2–3 screenshots inline using Markdown image syntax.

**Automated fix included in this PR:** Fix the `[REDACTED]` broken sentence in the README dev server section, and add a `## Live Demo` section as a placeholder with instructions to fill in the URL.

---

### C6 · Complete `.env.example` with all required variables

**Finding:** `.env.example` documents 3 of 19+ required environment variables. Any engineer or evaluator trying to run the app has no guide.

**Fix:** Rewrite `.env.example` to document all required variables with placeholder values, grouped by service, with source links. Also fix the `SUPABASE_SERVICE_ROLE_KEY` vs `SUPABASE_SERVICE_KEY` inconsistency in `analyze-new-assets.ts`.

**Files changed:** `.env.example`, `netlify/functions/analyze-new-assets.ts`

---

## Phase 2 — Recommended (This Week)

These items signal engineering maturity to a technical evaluator.

### R1 · Run `npm audit fix` for high-severity vulnerabilities

Run `npm audit fix --force` to address the 11 high-severity issues in `undici` and `axios` (transitive via storybook). Accept the updated lockfile.

---

### R4 + P8 · Remove pipeline artifacts and fix `.gitignore`

**Finding:** 5.5MB of pipeline artifacts, debug scripts, and operational notes are committed at the repo root. The `.gitignore` has a typo (`.out/` instead of `out/`) that allowed these to slip through.

**Files to remove from tracking (not delete from disk if still needed locally):**
- `analysis.log`
- `assets-index-enriched.json`, `assets-index-enriched.csv`, `assets-index-raw.json`
- `assets-analysis-results-v1.json`, `assets-enrichment-receipt.json`
- `debug-assets.ts`, `debug-cloudinary.ts`, `debug-cloudinary-error.ts`, `debug-codra.ts`, `debug-count.ts`
- `analyze-assets.mjs`, `enrich-assets-bulk.mjs`, `enrich-assets-index.mjs`, `process_assets.cjs`
- `codra_stripe_integration.txt`, `sample_tag_plan.json`
- `tailwind.config.generated.js` (committed despite being gitignored)
- `reports/` directory (40+ timestamped CSV/JSON sync artifacts)
- `out/` directory

**Fix `.gitignore`:** Change `.out/` to `out/`. Add entries for all removed file patterns.

---

### R5 · Add a LICENSE file

**Finding:** No `LICENSE` file. The legal status of the code is ambiguous for investors conducting IP diligence.

**Fix:** Create `LICENSE` at repo root with a proprietary copyright notice:  
`Copyright © 2026 The Penny Lane Project. All rights reserved.`

If open-sourcing is intended, choose an SPDX license (MIT, Apache-2.0) and add it here.

---

### R7 · Extract shared `getCredentialForProvider` utility

**Finding:** `netlify/functions/ai-complete.ts` and `netlify/functions/ai-stream.ts` contain an identical copy-pasted `getCredentialForProvider()` function (lines 30–52 in each).

**Fix:** Extract to `netlify/functions/utils/credential-utils.ts` and import from both files. Both files also duplicate the provider initialization block — this can be extracted to a shared factory in the same pass.

**Files changed:** New `netlify/functions/utils/credential-utils.ts`, updated `ai-complete.ts`, `ai-stream.ts`

---

### R8 · Fix `package.json` metadata fields

**Finding:** Missing `author`, `license`, `repository`, and `homepage` fields.

**Fix:**
```json
"author": "The Penny Lane Project",
"license": "UNLICENSED",
"repository": {
  "type": "git",
  "url": "https://github.com/thepennylaneproject/Codra"
},
"homepage": "https://codra.app"
```

---

### R10 · Move build tools to `devDependencies`

**Finding:** `typescript`, `vite`, `tailwindcss`, `postcss`, `autoprefixer`, `dotenv`, and four `@types/*` packages are in `dependencies` instead of `devDependencies`.

**Fix:** Move them. This reduces the production bundle surface and signals that the distinction between build and runtime dependencies is maintained.

**Packages to move:**
- `typescript`, `vite`, `tailwindcss`, `postcss`, `autoprefixer`, `dotenv`
- `@types/canvas-confetti`, `@types/lodash.isequal`, `@types/sharp`, `@types/uuid`

---

### R2 · Remove egregious `console.log` statements

**Finding:** 130 `console.log` calls in `src/`. Feature flag evaluations and "not yet implemented" messages log to every user's browser console in production.

**Targeted fixes (highest-visibility):**
- `src/hooks/useFeatureFlag.ts:25` — remove log of every flag evaluation
- `src/components/workspace/WorkspaceShell.tsx:91` — remove "not yet implemented" keyboard shortcut log
- `src/new/components/panels/git/GitPanel.tsx:40` — remove `console.log("Selected repo:", repo)`
- `src/new/components/advanced/ModelDiagnostics.tsx:57` — remove model override attempt log

A full pass (all 130) is desirable but lower priority — the above four are the ones that fire continuously during normal user sessions.

---

## Phase 3 — Polish (Before Demo Day)

| ID | Action | Effort |
|----|--------|--------|
| P1 | Add `CHANGELOG.md` with version history from git log | Small |
| P2 | Add JSDoc to the 10 most-read files in `src/lib/` | Medium |
| P3 | Move `.rtf` working notes out of `docs/` to a private location | Trivial |
| P5 | Move `debug-*.ts` files to `scripts/debug/` or delete them | Trivial |
| P6 | Delete `codra_stripe_integration.txt` (operational notes, not source) | Trivial |
| P7 | Delete or merge stale branches `cursor/development-environment-setup-263f`, `copilot/audit-repo-hygiene` | Trivial |
| P9 | Fix `assets-enrichment-receipt.json` local path leak | Trivial |
| R6 | Rename `src/new/` to `src/features/` or complete the migration | Large |
| R9 | Cannot rewrite "Initial plan" commit messages without history rewrite — document as known debt | — |
| R11 | Implement or clearly gate Lyra execution, Lyra suggestion, and coherence scan behind feature flags with UI indicating alpha/stub status | Large |

---

## Out-of-Scope for This PR

- **C5 (Live demo URL):** Requires a deployed environment. Human action required — deploy to Netlify and add the URL.
- **R3 (135 `:any` annotations):** A comprehensive type-safety pass is warranted but is a large refactor that deserves its own branch/PR.
- **R6 (`src/new/` migration):** Large structural refactor. Deserves its own planning session.
- **R11 (Stub feature gating):** Requires product decisions about how to present alpha features.

---

## Implementation Checklist

- [x] Plan document created
- [x] C1/C3: `jobIngestion.ts` exports fixed, build passes, 12 tests now pass
- [x] C2: jsPDF vulnerability patched via `npm audit fix --force` (upgraded to 4.2.0, 0 vulnerabilities)
- [x] C4: `retrieval_search.ts` JWT auth added — returns 401 for unauthenticated callers
- [x] C6: `.env.example` completed — all 19+ vars documented with placeholders and source links
- [x] R4/P8: 5.5MB of pipeline artifacts removed from tracking, `.gitignore` updated
- [x] R5: `LICENSE` file added (proprietary copyright notice)
- [x] R7: `getCredentialForProvider` + `verifyBearerToken` extracted to `netlify/functions/utils/credential-utils.ts`; both `ai-complete.ts` and `ai-stream.ts` updated to use the shared utility
- [x] R8: `package.json` author, license, repository, homepage fields added
- [x] R10: `typescript`, `vite`, `tailwindcss`, `postcss`, `autoprefixer`, `dotenv`, and 4 `@types/*` packages moved to `devDependencies`
- [x] R2: Most egregious `console.log` calls removed (WorkspaceShell keyboard stub, GitPanel repo selection, ModelDiagnostics override attempt)
- [x] README: `[REDACTED]` fixed, env var setup section added, deployment docs linked

## Remaining Items (Human Action Required)

- [ ] C5: Add live demo URL to README — requires Netlify deployment confirmation
- [ ] R3: Fix 135 `:any` type annotations — large refactor, dedicated branch recommended
- [ ] R6: Rename/migrate `src/new/` directory — large structural refactor
- [ ] R9: "Initial plan" commit messages — cannot rewrite without explicit history rewrite approval
- [ ] R11: Gate stub features (Lyra execution, coherence scan) behind alpha feature flags
