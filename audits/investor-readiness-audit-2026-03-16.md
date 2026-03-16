# Codra — Investor Readiness Audit
**Date:** 2026-03-16  
**Branch audited:** `main` (HEAD: `047ff5d`)  
**Auditor:** Cursor Cloud Agent  
**Scope:** Full repo audit across hygiene, security, documentation, code quality, CI/CD, dependencies, git discipline, and portfolio cohesion.

---

## REPO HYGIENE

### 1. README.md

**File:** `README.md`

**Present:** Yes.

**Findings:**

- **Product description:** Clear and present. Opens with "Codra is an AI workflow tool that helps creatives and teams produce structured content..." — adequate for a 1-sentence scan.
- **Setup instructions:** Minimal. Only `npm install && npm run dev`. There are no instructions for setting up Netlify Dev (required for backend function support), no mention that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set before the app boots (it throws at startup without them), and no mention of the 19 other environment variables required for full operation.
- **Environment variables:** Not documented in the README at all. The `.env.example` exists but documents only Cloudinary credentials (3 vars). The actual application requires 19+ environment variables spanning Supabase, Stripe, all AI providers, GitHub OAuth, encryption secrets, and analytics keys. No investor, engineer, or new hire can get this running from the README alone.
- **Live demo link:** Missing entirely. No URL, no screenshots, no deployed environment link. The README mentions `[REDACTED]` in the dev server section — this appears to be a Vite port number that was redacted by tooling, leaving a broken placeholder sentence.
- **Current state:** The README says "Alpha" and is broadly accurate about the architecture, but omits the broken build state, the incomplete features (Lyra execution stub, coherence scan mock), and the 13 failing tests.

**Verdict:** Below standard for investor review. No demo link, incomplete env var documentation, broken sentence from redacted content.

---

### 2. .gitignore

**File:** `.gitignore`

**Present:** Yes. Core exclusions are in place: `node_modules/`, `dist/`, `.env`, `.env.local`, `.DS_Store`, logs.

**Problems found:**

- `out/` is in `.gitignore` but the `out/` directory **is committed** to the repo (5 large JSON/CSV files, 907KB total). The `.gitignore` entry uses `.out/` (with a leading dot), not `out/`. This typo means the `out/` directory was never excluded.
- The following files are committed at the repo root and are clearly pipeline/debug artifacts, not source code. They should not be in version control:
  - `analysis.log` (191KB) — committed in `b4e4e37 pipeline v1`
  - `assets-index-enriched.json` (2.0MB) — committed in `b4e4e37`
  - `assets-index-enriched.csv` (916KB) — committed in `b4e4e37`
  - `assets-index-raw.json` (690KB) — committed in `b4e4e37`
  - `assets-analysis-results-v1.json` (929KB) — committed in `b4e4e37`
  - `assets-enrichment-receipt.json` (415 bytes, contains local path `/Users/sarahsahl/Desktop/codra/...`)
  - `debug-assets.ts`, `debug-cloudinary.ts`, `debug-cloudinary-error.ts`, `debug-codra.ts`, `debug-count.ts` — debug scripts at the repo root
  - `analyze-assets.mjs`, `enrich-assets-bulk.mjs`, `enrich-assets-index.mjs`, `process_assets.cjs` — pipeline scripts that belong in `scripts/` or a separate tool, not root
  - `codra_stripe_integration.txt` — plaintext operational notes committed to the repo root
  - `sample_tag_plan.json` — stray data file at root
  - `tailwind.config.generated.js` — this file is in `.gitignore` but is committed and tracked (`-rw-r--r-- 1 ubuntu ubuntu 4264 Mar 13`)
- The `reports/` directory contains 40+ timestamped CSV/JSON sync artifacts committed to the repo. This is pipeline output, not source code.

**Total extraneous committed data:** ~5.5MB of pipeline artifacts, debug scripts, and operational notes that have no business being in a source repository.

---

### 3. LICENSE

**File:** None found.

**Finding:** No `LICENSE` file exists. The README footer reads "All rights reserved. © The Penny Lane Project." — this is a copyright notice, not a license. Without a formal `LICENSE` file, the legal status of this code is ambiguous. For investors conducting due diligence, unlicensed code raises IP ownership questions. If this is proprietary software, a formal proprietary license file (or at minimum a `LICENSE` file asserting the copyright and "All rights reserved") should be present.

---

### 4. package.json

**File:** `package.json`

- **name:** `"codra"` — acceptable
- **version:** `"0.2.0"` — present
- **description:** `"AI workflow tool with multi-provider integration"` — present but generic
- **author:** **Missing.** No `author` field.
- **license:** **Missing.** No `license` field (consistent with the absent LICENSE file).
- **repository:** **Missing.** No `repository` field linking to the GitHub repo.
- **homepage:** **Missing.** No deployed app URL documented here.

A technical evaluator will notice the missing author, license, repository, and homepage fields immediately.

---

## SECURITY

### 5. Hardcoded Secrets / API Keys

**Finding:** No hardcoded API keys, tokens, or passwords were found in current source files or netlify function files. Environment variable access is correctly done via `process.env.*` (server-side) and `import.meta.env.VITE_*` (client-side).

One borderline case: `netlify/functions/utils/stripe.ts` line 14 uses `} as any` to bypass TypeScript's Stripe API version typing. This is not a secret exposure but signals incomplete implementation.

Git history scan (`git log -S "sb-"`) found two commits (`d5e7795`, `a3b79fa`) that touched `netlify.toml` in the period when Supabase public keys were being managed — these did not expose actual key values, only configuration for how Netlify's scanner handled them.

**Verdict:** Clean on hardcoded secrets in current HEAD.

---

### 6. Environment Variables — `.env.example` Completeness

**File:** `.env.example`

**Critical gap:** The `.env.example` documents only 3 Cloudinary variables. The actual application requires **19 distinct environment variables** to run fully:

**Server-side (Netlify functions):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (also referenced as `SUPABASE_SERVICE_KEY` — inconsistency)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `AIMLAPI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `MISTRAL_API_KEY`, `COHERE_API_KEY_PROD`, `HUGGINGFACE_API_KEY`, `DEEPAI_API_KEY`
- `BRAVE_SEARCH_API_KEY`, `TAVILY_API_KEY`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `CODRA_APP_SECRET`, `ENCRYPTION_APP_SECRET`
- `ADMIN_EMAILS`, `CORS_ORIGIN`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Client-side (VITE_* vars):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`, `VITE_ANALYTICS_DEBUG`

An investor's technical evaluator attempting to stand up this application cannot do so from the documented environment. This is a significant documentation gap.

Additionally, the inconsistency between `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_SERVICE_KEY` across function files (`analyze-new-assets.ts` uses `SUPABASE_SERVICE_KEY` while all others use `SUPABASE_SERVICE_ROLE_KEY`) means some functions may silently fail in production without the duplicate env var set.

---

### 7. Exposed Supabase / Stripe Keys in Client Code

**Supabase anon key:** Correctly accessed via `import.meta.env.VITE_SUPABASE_ANON_KEY` in `src/lib/supabase.ts`. This is the public anon key — exposure in client-side bundle is by design with Supabase's RLS model. No hardcoded values found.

**Stripe publishable key:** Not found in client-side code. The `src/lib/billing/stripe.ts` file makes API calls to serverside endpoints only — correctly structured.

**Stripe secret key:** Correctly in `process.env.STRIPE_SECRET_KEY` server-side only.

One historical note: commit `6a1ce315` ("build: disable netlify secrets scanner to allow public supabase keys") **disabled Netlify's secrets scanner entirely** (`SECRETS_SCAN_ENABLED = "false"`) rather than using the more surgical `SECRETS_SCAN_OMIT_KEYS`. A subsequent commit re-enabled it. The history shows the scanner was bypassed entirely for a period — this is a process concern even if no actual leak occurred.

---

### 8. Unauthenticated / Unrate-limited API Routes

**Finding — concern:**

- `netlify/functions/providers.ts` — **intentionally public**, no auth. Returns the AI provider registry. Acceptable.
- `netlify/functions/retrieval_search.ts` — Has in-memory rate limiting (20 req/min/IP) but **no authentication**. The `userId` is set to `null` in two places with `// TODO: Extract from auth header if available` (lines 160 and 194). This function makes live calls to Brave Search and Tavily APIs on behalf of unauthenticated callers, consuming API quota without any user verification.
- `netlify/functions/utils/telemetry-helpers.ts` line 265 — `// TODO: Implement JWT verification if needed` — the telemetry logging function skips user verification.
- `netlify/functions/ai-complete.ts` and `netlify/functions/ai-stream.ts` — Both correctly authenticate via Bearer token + Supabase JWT verification before processing.

The `retrieval_search` endpoint is the most actionable concern: it proxies paid search APIs to unauthenticated users. In-memory rate limiting in a serverless environment is unreliable (no persistence across cold starts, no global coordination).

---

## DOCUMENTATION

### 9. Inline Code Documentation

**Findings:**

- JSDoc (`/** ... */`) block count across all 573 TypeScript files (535 in `src/`, 38 in `netlify/`): **0 files** in `src/` contain `@param` or `@returns` annotations. Zero.
- `netlify/` functions are better documented — most have a top-level block comment describing the endpoint. But the individual helper functions and types within them lack JSDoc.
- The design system, AI router, and billing modules — which are the most complex parts of the codebase — have essentially no inline documentation. `src/lib/ai/router/smart-router.ts`, `src/lib/billing/stripe.ts`, and `src/lib/models/registry/registry-service.ts` contain `console.log` calls but no JSDoc.
- `src/lib/ai/telemetry/ai-telemetry.ts` explicitly notes itself as "a stub/pattern for future integration" in its file comment, which is at least honest.

**Verdict:** Inline documentation is absent across the entire frontend codebase. A new engineer or technical evaluator reading this code has no JSDoc safety net anywhere in `src/`.

---

### 10. TypeScript Type Discipline

**File:** `tsconfig.json` — `"strict": true` is correctly set. This is a positive signal.

**However:** The `@typescript-eslint/no-explicit-any` rule is set to `"warn"` (not `"error"`) in `.eslintrc.cjs`, and the codebase has 135 explicit `: any` type annotations in `src/` alone. Selected examples:

- `src/new/components/Typography.tsx:11` — `as?: any`
- `src/new/routes/ProjectContextPage.tsx:91` — `const updates: any = {}`
- `src/types/flow.ts:23-25` — three `any` annotations in the core flow type definitions
- `src/lib/analytics.ts:34` — `properties?: any`
- `netlify/functions/billing-webhook.ts` — 5 instances of `as any` in Stripe event handling

With `strict: true` set, these `any` types represent conscious suppressions, not ignorance. The volume (135) suggests significant portions of the type system are being bypassed.

---

### 11. CHANGELOG.md

**Not present.** No version history, release notes, or decision log. The commit history serves as an implicit changelog, but there is no curated, human-readable record of what changed between versions. Absence is noted — this is a "recommended" fix, not critical.

---

### 12. Naming Clarity

**Positive:** The extensive `docs/NAMING_MIGRATION_*.md` documents (6 files) show deliberate effort to standardize terminology. The transition from "desk/studio" to "workspace" is documented and largely complete.

**Concerns:**
- `src/new/` directory: the `new/` prefix on an entire directory of components is a code smell. This is the pattern of someone who added a parallel structure but didn't complete the migration. A `new/` directory signals unfinished work to any reader.
- Several component directories contain both old-style and new-style components with no clear demarcation of which is canonical.
- `useLyraSuggestion` and `useLyraExecution` hooks — named after "Lyra" (an internal AI agent) — are stubs that simulate responses. The naming implies implementation that doesn't exist.

---

## CODE QUALITY

### 13. Linting Configuration

**Files:** `.eslintrc.cjs`, `.stylelintrc.json`

**ESLint:** Present, configured with `@typescript-eslint/recommended`, `plugin:react/recommended`, `plugin:react-hooks/recommended`, and a custom `eslint-plugin-codra` for design system enforcement. This is solid.

**Issue:** The CI `ci.yml` lint job runs `npm run lint -- --max-warnings 0`, but the AGENTS.md documents "~844 pre-existing problems (mostly design-system rules)." Either the CI lint check is not actually passing in CI (it would fail at 0 warnings), or the 844 problems are all errors rather than warnings and the `--max-warnings 0` flag is not catching them. Either way, 844 lint violations in a pre-investor codebase is not a signal of engineering maturity.

**Prettier:** No `.prettierrc` or equivalent found. Formatting discipline relies entirely on ESLint. This is acceptable but worth noting.

---

### 14. Dead Code, TODOs, Commented-Out Code

**TODO/FIXME count (src/ + netlify/):** 15 instances, including:

- `src/new/components/lyra/hooks/useLyraExecution.ts:27` — `// TODO: Replace with actual API call when backend is ready` — the entire Lyra execution feature is a stub returning `{ success: true, output: { taskId } }` after a 1.5s `setTimeout`.
- `src/new/components/lyra/hooks/useLyraSuggestion.ts:37` — same pattern, Lyra suggestion is partially mocked.
- `src/lib/coherence-scan/coherence-scan-service.ts:283` — `// TODO: Integrate with actual AI provider` — the coherence scan feature returns **hardcoded mock findings**.
- `netlify/functions/retrieval_search.ts:160,194` — `// TODO: Extract from auth header if available` — auth bypass in a live API endpoint.
- `netlify/functions/utils/telemetry-helpers.ts:265` — `// TODO: Implement JWT verification if needed`.
- `src/lib/image-policy/canonical-registry.ts:103` and `promotion.ts:149` — both note they need production Supabase implementations.
- `src/new/components/advanced/ModelDiagnostics.tsx:55` — `// TODO: Implement override logic`.
- `src/lib/ai/telemetry/ai-telemetry.ts:76,105` — entire telemetry module is a documented stub with no live endpoint.

The README says "Alpha — Core AI completion and project management flows work end-to-end." Two of the three named features highlighted in the README (coherence scan, asset pipeline) are explicitly described in code as mocked or "in active development."

**Commented-out code:**
- `src/new/components/lyra/hooks/useLyraExecution.ts:29-34` — commented-out fetch call
- `src/new/components/lyra/hooks/useLyraSuggestion.ts:38-40` — commented-out fetch call

**`src/new/` directory structure** is effectively a parallel codebase-in-progress committed alongside the production code with no clear isolation boundary.

---

### 15. Error Handling in Async Operations

**Netlify functions:** All production-facing functions (`ai-complete.ts`, `ai-stream.ts`, `projects-list.ts`, `billing-checkout.ts`, `billing-webhook.ts`, etc.) use top-level try/catch blocks. This is adequate.

**Frontend src/:** Async operations in hooks are less consistent. `src/hooks/useSpecification.ts` catches errors in its queue flush logic. `src/lib/api/offline-queue.ts` handles errors. However, several `await fetch(...)` calls in the new components section do not have explicit catch blocks — relying on React error boundaries is not guaranteed.

**Stripe Webhook (serverside):** `netlify/functions/billing-webhook.ts` uses `as any` in 5 places when handling Stripe events, bypassing the Stripe SDK's type safety on webhook event payloads. If Stripe changes an event shape, the type errors are masked.

---

### 16. console.log in Production Code

**Count:** 130 `console.log` statements in `src/`. Selected examples from production-facing code:

- `src/hooks/useSpecification.ts:173,234,339,424` — logs every queue flush, save, and offline queue operation
- `src/components/workspace/WorkspaceShell.tsx:91` — logs every keyboard shortcut press with message "not yet implemented"
- `src/hooks/useFeatureFlag.ts:25` — logs every feature flag evaluation to console
- `src/new/components/panels/git/GitPanel.tsx:40` — `console.log("Selected repo:", repo)`
- `src/new/components/advanced/ModelDiagnostics.tsx:57` — logs every model override attempt
- `src/pipeline/registry/` — 10+ logs in pipeline scripts (these are build-time scripts so lower severity)

A shipped application logging feature flag states, keyboard shortcuts ("not yet implemented"), and queue operations to the browser console in every user session is unprofessional in a demo context.

---

### 17. Copy-Paste / Non-Abstracted Code

**`netlify/functions/ai-complete.ts` and `netlify/functions/ai-stream.ts`:** Both files contain an **identical** `getCredentialForProvider()` function (lines 30-52 in each file). This function is copy-pasted verbatim. If a new AI provider is added, it must be updated in two places.

Both files also duplicate the provider initialization block (8 provider imports + `new XProvider()` calls). This is a classic "extract a factory" refactor that hasn't been done.

`netlify/functions/` pattern: multiple functions duplicate the Supabase client initialization pattern using `process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL`. This fallback exists because the env var naming is inconsistent — a symptom of the underlying env var naming inconsistency noted in Section 6.

---

## CI/CD & DEPLOYMENT

### 18. CI/CD Pipeline

**File:** `.github/workflows/ci.yml`

**Present and configured** with 5 jobs: lint, typecheck, test, build, design-audit. Build depends on lint + typecheck + test passing. This is a solid pipeline structure.

**However — the build is currently broken.** Running `npm run build` from a clean checkout fails with TypeScript errors:

```
src/services/__tests__/jobIngestion.test.ts(4,5): error TS2305: 
  Module '"../jobIngestion"' has no exported member 'parseJobResponse'.
src/services/__tests__/jobIngestion.test.ts(5,5): error TS2305: 
  Module '"../jobIngestion"' has no exported member 'ingestJobBatch'.
src/services/__tests__/jobIngestion.test.ts(7,15): error TS2305: 
  Module '"../jobIngestion"' has no exported member 'JobApiResponse'.
src/services/__tests__/jobIngestion.test.ts(7,31): error TS2305: 
  Module '"../jobIngestion"' has no exported member 'RawJobResult'.
```

The `jobIngestion` module (`src/services/jobIngestion.ts`) exports `FetchJobsResult` and `JobSource` but not `parseJobResponse`, `ingestJobBatch`, `JobApiResponse`, or `RawJobResult` — which the test file tries to import. The test was written against an API that no longer exists or was never completed. The `tsc` step in `npm run build` compiles test files, causing the build to fail.

**This means CI is currently red on every push to `main`.**

---

### 19. Deployment Documentation

**Present:** `netlify.toml` documents the build command, publish directory, functions directory, and Node version. `docs/PHASE1_DEPLOYMENT.md` and `docs/SUPABASE_MIGRATIONS.md` exist and appear thorough.

**Gap:** The README does not reference the deployment docs. A new contributor following only the README cannot deploy this application.

---

### 20. Environment Separation

**`netlify.toml`** defines three contexts: `production`, `deploy-preview`, `branch-deploy`. The `production` context has an **empty environment block** (`environment = { }`). There are no staging-specific or preview-specific environment overrides. All environments share the same Netlify environment variable set — there is no documented separation between development and production Supabase projects, API keys, or Stripe environments.

`codra_stripe_integration.txt` (committed to root) explicitly mentions `sk_test_...` as the prerequisite, implying test and production Stripe are expected to be different — but there's no automation or documentation ensuring they are.

---

### 21. Build Test

**Result: FAILS.**

```bash
npm run build
# Exit code 2
# 4 TypeScript errors in src/services/__tests__/jobIngestion.test.ts
```

The build has been broken by a test file whose imports don't match the module's exported API. This is a `CRITICAL` finding for an investor review — the application cannot be built from source.

---

## DEPENDENCY MANAGEMENT

### 22. Dependencies

**`npm audit` result:** 18 vulnerabilities — 6 moderate, 11 high, 1 critical.

- **Critical:** `jsPDF` — PDF Injection via AcroFormChoiceField allowing arbitrary JavaScript execution (GHSA-pqxr-3g65-p328 and GHSA-p5xg-68wr-hm3m). `jsPDF` is in `dependencies` as `"jspdf": "^3.0.4"`.
- **High:** `undici` (7.0.0–7.23.0) — 6 issues including unbounded decompression, WebSocket overflow, HTTP smuggling. This is via `storybook` devDependency chain.
- **High:** `axios` — version in dependency chain has a known vulnerability.
- **Moderate:** `esbuild`, `minimatch`, `flatted`, `dompurify`.

The `jsPDF` critical vulnerability is in a **production dependency** and is exploitable in user-generated content contexts. This must be addressed before investor review.

**Misclassified dependencies (dev tools listed as production):**

The following are in `dependencies` but are build/type tools that should be in `devDependencies`:
- `typescript@^5.9.3`
- `vite@^5.4.0`
- `tailwindcss@^3.4.10`
- `postcss@^8.4.41`
- `autoprefixer@^10.4.20`
- `dotenv@^17.2.3`
- `@types/canvas-confetti`, `@types/lodash.isequal`, `@types/sharp`, `@types/uuid`

This inflates the production dependency surface and signals that the distinction between build tooling and runtime dependencies isn't being maintained. For a serverless JAMstack app, this affects the Netlify function bundle unnecessarily.

---

### 23. Lockfile

**File:** `package-lock.json` — **present and committed.** This is correct.

---

## GIT DISCIPLINE

### 24. Commit Messages

**Reviewed:** All 126 commits.

**Positive:** 47 of 126 (37%) follow conventional commits format (`feat:`, `fix:`, `refactor:`, `chore:`, `build:`, `docs:`). The copilot-generated commits (`copilot/` branch PRs) follow conventional commits consistently.

**Problems:**

- **7 commits** with message `"Initial plan"` — these appear to be AI agent planning artifacts that were committed to the repo history: SHAs `9e89b3c`, `68edd05`, `815c0e9`, `f1ffcf5`, `e114c08`, `7cc5ab8`, `7daba8a`. These are not code changes — they are agent planning notes committed as if they were work.
- `7ffff79` — commit message: `"lyra updates"`. Zero information.
- `97fc2a2` — commit message: `"rls policymigrations"` — no space, unclear scope.
- `b3c0d42` — commit message is 3 sentences long and lists 6 unrelated changes in one commit.
- `abb1e00` — commit message: `"coherence_cycle_1"` — unclear.

**Summary:** ~8% of commits are meaningless or agent artifacts. 37% follow conventional commits. The rest are inconsistent.

---

### 25. Stale Branches

**Remote branches:** 3 total.
- `origin/main` — active
- `origin/cursor/development-environment-setup-263f` — stale, not merged to main
- `origin/copilot/audit-repo-hygiene` — stale, not merged to main

Two unmerged stale branches. Minor but signals incomplete cleanup.

---

### 26. Repository Visibility & History

The repo is at `github.com/thepennylaneproject/Codra`. No `.env` files or secret values were found committed at any point in history via targeted searches. The "pre-launch security cleanup" commit (`11904ae`) removed screenshots from the repo history at `d5e7795`.

One concern: `out/assets-analysis-receipt.json` contains the developer's local machine path `/Users/sarahsahl/Desktop/codra/...`. This is a data leak of workstation configuration. Not a security issue per se, but unprofessional in a public or investor-visible repo.

---

## PORTFOLIO COHESION

### 27. Portfolio Alignment

Codra is explicitly positioned as part of The Penny Lane Project via the README header and `thepennylaneproject.org` link. The naming, branding, and purpose are coherent with that positioning. An investor browsing the portfolio would understand where this fits.

**Gap:** The README does not describe the relationship between Codra and the other 10 portfolio apps, or why this is the flagship investment candidate among them. Portfolio context that aids an investor thesis is absent.

---

### 28. Tech Stack Consistency

The stack (React 18, Vite, TypeScript, Netlify functions, Supabase, Stripe) is standard modern JAMstack. The custom design token system and `eslint-plugin-codra` suggest investment in long-term consistency — this is a positive signal.

The extensive `docs/` directory (45+ markdown files including cognitive load audits, flow discipline audits, and naming migration docs) shows a founder thinking seriously about product quality. However, the presence of 45+ internal planning documents committed to the main repo (`.rtf` files, `blind_spot_audit.rtf`, `the_kill_list_audit.rtf`, `pre_investor_diligence_audit.rtf`) is unusual. These are working documents, not technical documentation. Committed `.rtf` files in a TypeScript repo are a signal.

---

### 29. Live URL / Demo

**Missing.** The README contains no live URL. The `[REDACTED]` in the development section suggests a URL was present but got stripped. There is no deployed demo link, no screenshots in the README (screenshots were deleted in `d5e7795`), and no reference to a production Netlify deployment URL.

An investor cannot see the product. This is the single highest-leverage gap for investor readiness.

---

## RISK SUMMARY

### CRITICAL — Must fix before investor review

| # | Finding | Location | Detail |
|---|---------|----------|--------|
| C1 | **Build is broken** | `src/services/__tests__/jobIngestion.test.ts` | `npm run build` fails with 4 TypeScript errors. CI is red. |
| C2 | **Critical npm vulnerability** | `jspdf@^3.0.4` in `dependencies` | PDF injection vulnerability allowing arbitrary JavaScript execution (GHSA-pqxr-3g65-p328). |
| C3 | **13 failing tests** | `src/services/__tests__/jobIngestion.test.ts` (12), `src/lib/flow/__tests__/executor.test.ts` (1) | Test suite has 13 failures — 8.2% failure rate. The `should handle conditions` flow test is a pre-existing known failure. |
| C4 | **Unauthenticated API endpoint consuming paid quota** | `netlify/functions/retrieval_search.ts:160,194` | Retrieval search calls Brave/Tavily APIs for unauthenticated users. Rate limiting is in-memory and ineffective across serverless cold starts. |
| C5 | **No live demo** | README | No deployed URL, no screenshots. Investors cannot evaluate the product without one. |
| C6 | **.env.example documents 3 of 19+ required env vars** | `.env.example` | A new deployer has no guide to the full environment. Supabase, Stripe, all AI provider keys, GitHub OAuth, and encryption secrets are completely undocumented. |

---

### RECOMMENDED — Should fix to signal engineering maturity

| # | Finding | Location | Detail |
|---|---------|----------|--------|
| R1 | **11 high npm vulnerabilities** | `undici`, `axios` in dep chain | Run `npm audit fix` for addressable ones. |
| R2 | **130 console.log statements in production code** | Throughout `src/` | Feature flag evaluations, keyboard shortcut noop messages, and queue flush details logged to browser console on every user action. |
| R3 | **135 `: any` type annotations in src/** | Throughout `src/` | `@typescript-eslint/no-explicit-any` should be `"error"`, not `"warn"`. Core types in `src/types/flow.ts` use `any`. |
| R4 | **5.5MB of pipeline artifacts committed to repo root** | `analysis.log`, `assets-index-*.json`, `assets-index-*.csv`, `out/` | Not source code. Inflate the repo, pollute history, and signal disorganization. |
| R5 | **No LICENSE file** | Repo root | Legal ambiguity for investors conducting IP diligence. |
| R6 | **`src/new/` parallel codebase directory** | `src/new/` | An entire subdirectory named `new/` signals an incomplete migration. |
| R7 | **Getredential duplication in ai-complete/ai-stream** | `netlify/functions/ai-complete.ts`, `netlify/functions/ai-stream.ts` | Identical function copied verbatim. |
| R8 | **`package.json` missing author, license, repository, homepage** | `package.json` | Standard fields a technical evaluator checks first. |
| R9 | **7 "Initial plan" commits in history** | Git log | AI agent planning artifacts committed as code history. |
| R10 | **Dev tools in production dependencies** | `package.json` | `typescript`, `vite`, `tailwindcss`, `postcss`, `dotenv`, and 4 `@types/*` packages in `dependencies` instead of `devDependencies`. |
| R11 | **Three key features are stubs/mocks** | `useLyraExecution.ts`, `useLyraSuggestion.ts`, `coherence-scan-service.ts` | Lyra execution returns a setTimeout mock, Lyra suggestion is partially mocked, coherence scan returns hardcoded mock findings. README implies these features work. |

---

### POLISH — Nice-to-have for diligence confidence

| # | Finding | Detail |
|---|---------|--------|
| P1 | CHANGELOG.md absent | No curated version history. |
| P2 | Zero JSDoc annotations in 535 src/ files | Codebase is entirely undocumented at the function level. |
| P3 | 45+ internal planning `.md`/`.rtf` files in `docs/` | Working notes committed to source. Distract from technical documentation. |
| P4 | `[REDACTED]` placeholder in README dev server section | Broken sentence. Remove or replace. |
| P5 | `debug-*.ts` files at repo root | Debug scripts should be deleted or moved to `scripts/`. |
| P6 | `codra_stripe_integration.txt` at repo root | Operational notes don't belong in source control. |
| P7 | 2 stale unmerged remote branches | `cursor/development-environment-setup-263f`, `copilot/audit-repo-hygiene`. |
| P8 | `tailwind.config.generated.js` tracked despite .gitignore entry | The `.gitignore` entry uses `.out/` (with dot) instead of `out/` — typo meant generated file stayed tracked. |
| P9 | `assets-enrichment-receipt.json` contains local developer path `/Users/sarahsahl/Desktop/codra/` | Workstation path committed to repo. |
| P10 | No `author` field in `package.json` | Basic attribution missing. |

---

## INVESTOR READINESS SCORE

### Score: **3.5 / 10**

**Justification:**

The architecture is sound and the ambition is evident. The design token system, multi-provider AI router, custom ESLint plugin, and structured `docs/` directory show an engineer who thinks seriously about maintainability. The CI/CD pipeline structure is correct. Security practices around credentials are mostly sound.

However, the application **cannot be built from source** (C1). The test suite has **13 failures** (C3). A critical `jsPDF` vulnerability is sitting in production dependencies (C2). There is **no live demo link** anywhere in the repository (C5). The `.env.example` documents 3 of 19 required environment variables (C6). 130 console.log statements fire in every user session (R2). Two of the three features highlighted in the README as "actively in use" are, in the code, acknowledged stubs or mocks (R11).

A technical evaluator conducting diligence would form a negative impression quickly. The score reflects the gap between the architectural intent (which earns a 6-7) and the current execution state (which pulls it down sharply).

---

## TOP 3 HIGHEST-LEVERAGE ACTIONS

### Action 1: Fix the Build and the Tests — Today

Fix the `src/services/__tests__/jobIngestion.test.ts` import mismatch so `npm run build` passes. Then fix or delete the `should handle conditions` flow executor test. A broken build is disqualifying — it is the first thing a technical evaluator will run.

**Estimated effort:** 30–60 minutes. The fix is either exporting the missing symbols from `jobIngestion.ts` or updating the test imports to match the current API.

---

### Action 2: Add a Live Demo URL to the README — Today

Deploy a live instance (or confirm the existing Netlify deployment is live) and add the URL to the README as the first piece of information after the product description. Add 2–3 screenshots directly in the README using Markdown image syntax. Investors and technical evaluators will not clone and build your project — they will click a link.

**Estimated effort:** 1 hour if a deployment exists. 2–3 hours if it needs to be stood up.

---

### Action 3: Complete the `.env.example` and Fix the `jsPDF` Vulnerability — This Week

Expand `.env.example` to document all 19+ required environment variables with placeholder values and source links. This directly unblocks any engineer trying to evaluate or contribute to the codebase.

In the same pass: run `npm audit fix` to address the critical `jsPDF` vulnerability and the addressable high-severity issues. Upgrade `jsPDF` to a non-vulnerable version or replace it.

**Estimated effort:** 2–3 hours combined.
