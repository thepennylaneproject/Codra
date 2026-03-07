# Missing Global Error Handlers in main.tsx

**ID:** DEPLOY-002  
**Type:** bug  
**Severity:** major  
**Priority:** P1  
**Confidence:** evidence  
**Status:** fixed_pending_verify

## Description

`src/main.tsx` had no global handlers for uncaught synchronous errors or unhandled Promise rejections occurring outside React's component tree. Errors in `setTimeout` callbacks, event listeners, or third-party scripts fell completely silently in production — no logging, no analytics capture.

## Proof

- **File:** `src/main.tsx` — zero `onerror` / `unhandledrejection` handlers prior to fix
- **Impact:** Any async crash outside a React component (e.g. Supabase realtime subscription errors, scheduled retry failures) is invisible in PostHog and the browser console in production

## Fix Applied

Added two event listeners in `src/main.tsx`, registered immediately after `analytics.init()`:

- `window.addEventListener('error', ...)` — catches uncaught synchronous errors
- `window.addEventListener('unhandledrejection', ...)` — catches rejected Promises with no `.catch()` handler

Both route to `analytics.track('frontend_error', { message, stack, source })` via the existing PostHog wrapper. TypeScript check passes clean (uses `CatchAllEvent` — no new event type needed).

## Tests / Verification

- [ ] In dev: open DevTools console; throw `new Error('test')` in a `setTimeout` → expect `[GlobalError]` log + PostHog capture
- [ ] In dev: `Promise.reject(new Error('test'))` with no catch → expect `[UnhandledRejection]` log + PostHog capture
- [ ] Deploy preview: confirm `frontend_error` events appear in PostHog under the test project
- [ ] `npx tsc --noEmit --skipLibCheck` → exit 0 ✅

## History

- `2026-03-06T18:34:12Z` — `build-deploy-auditor` flagged as DEPLOY-002 (schema violation; original did not conform to v1.1.0)
- `2026-03-06T19:14:52Z` — `synthesizer` confirmed file exists; original finding uplifted to canonical
- `2026-03-06T19:14:52Z` — `triage` selected as real confirmed fix; P0 ingestion findings downgraded pending file verification
- `2026-03-06T19:15:30Z` — **Fix applied** — `window.addEventListener` handlers added to `src/main.tsx`; TypeScript clean
