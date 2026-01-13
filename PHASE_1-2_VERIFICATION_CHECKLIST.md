# PHASE 1-2 IMPLEMENTATION VERIFICATION CHECKLIST
## Confirm receipt criteria met before launch

---

## PHASE 1: CRITICAL FIXES

### MODULE 1.1: Enable Task Execution Engine ✓ or ✗?

**Code Quality:**
- [ ] `handleRunTask()` fully uncommented (no `/*` or `*/` in task execution code)
- [ ] Git diff clean (only task execution code changes, no accidental modifications)
- [ ] TypeScript strict mode passes: `npm run type-check` → 0 errors
- [ ] ESLint passes: `npm run lint` → 0 errors in modified files
- [ ] No console errors in browser (DevTools clean)

**Feature Completeness:**
- [ ] Task "Run" button visible in UI (Proof panel or center surface)
- [ ] Clicking button: `pending` → `in-progress` → `complete`/`failed`
- [ ] Task status persisted to DB (verify in Supabase)
- [ ] API request sent to Claude (verify in DevTools → Network)
- [ ] Output rendered in spread section within 15s
- [ ] Save confirmation shown: "Task complete" toast

**Error Handling:**
- [ ] Task failure: shows human-readable error message (not technical jargon)
- [ ] "Retry" button visible on failure
- [ ] Task reverts to `pending` after failed attempt
- [ ] Multiple errors logged to analytics

**UX & Responsiveness:**
- [ ] Real-time status updates (not just pending → complete)
- [ ] Progress indicator visible (spinner, %, "Generating...")
- [ ] ETA shown (e.g., "~10s remaining") if available
- [ ] Page doesn't freeze during execution (async/await)
- [ ] Multiple tasks can be queued

**Testing:**
- [ ] Create project → navigate to workspace → click "Run"
- [ ] Output appears within 15s → refreshes, output persists
- [ ] Break API key → see error + retry → fix + retry succeeds
- [ ] Run 3 tasks sequentially → all complete successfully
- [ ] Analytics: task execution events logged correctly

**Evidence Required:**
```
[ ] Screen recording: click Run → see output
[ ] Network tab screenshot: POST to Claude API visible
[ ] Database query: task status in DB = "complete"
[ ] Analytics dashboard: task_execution_completed events visible
```

**SIGN-OFF:** ✅ Module 1.1 COMPLETE or ❌ BLOCKERS?

---

### MODULE 1.2: Spread Generation Error Handling ✓ or ✗?

**Error Handling:**
- [ ] Spread generation wrapped in try-catch
- [ ] Error logged to analytics with `{ projectId, errorMessage }`
- [ ] Error does NOT crash page (no blank workspace)

**User Feedback:**
- [ ] Error banner appears when generation fails (red background, prominent)
- [ ] Message is human-readable (not technical stack trace)
- [ ] "Retry" button visible and functional
- [ ] "View Details" link shows technical error (optional but helpful)

**Fallback Behavior:**
- [ ] If generation fails: show error banner OR fallback spread (not blank)
- [ ] User can manually create sections or skip to task execution

**Error Boundary:**
- [ ] React error boundary wraps ExecutionDeskPage
- [ ] If ExecutionDesk crashes: error boundary catches it
- [ ] Shows: "Workspace encountered an error. Please refresh the page."
- [ ] Error logged to analytics + console

**Testing:**
- [ ] Mock spread generation error → see error banner ✓
- [ ] Click "Retry" → generation retries ✓
- [ ] Fix code, retry succeeds → banner disappears ✓
- [ ] Throw error from ExecutionDesk → error boundary catches ✓

**Evidence Required:**
```
[ ] Screen recording: spread error → banner appears → retry works
[ ] Network tab: analytics event spread_generation_error logged
[ ] Console: no unhandled errors
[ ] Code review: try-catch visible, error boundary in place
```

**SIGN-OFF:** ✅ Module 1.2 COMPLETE or ❌ BLOCKERS?

---

### MODULE 1.3: Project Creation Lifecycle ✓ or ✗?

**Project Creation Timing:**
- [ ] Project created at END of Step 1 (after name/type/summary submitted)
- [ ] Project gets unique ID immediately
- [ ] User sees confirmation toast: "Project created: [name]"
- [ ] Project row inserted into `projects` table

**State Management:**
- [ ] projectId stored in localStorage: `codra:onboardingProject`
- [ ] projectId stored in Zustand: `useOnboardingStore.state.projectId`
- [ ] Both storage locations match (consistency)

**Duplicate Prevention:**
- [ ] Detect existing projectId on onboarding mount
- [ ] Show dialog: "Resume project '[name]'?" with Resume / Create New options
- [ ] Resume: navigate to Step 2 with same projectId
- [ ] Create New: clear localStorage, start fresh (new projectId)
- [ ] Old project NOT deleted (preserved in DB)
- [ ] projectId validated against DB (verify exists)

**Resume Flow:**
- [ ] Complete Step 1 → Refresh page
- [ ] Resume dialog appears (auto-detected from localStorage)
- [ ] Click Resume → Step 2 with same projectId
- [ ] Complete onboarding → 1 project in DB (no duplicate)

**Data Integrity:**
- [ ] After 3 complete onboarding cycles:
  - Database has exactly 3 project rows
  - 0 duplicates
  - Each with unique projectId
- [ ] Project fields validated before DB insert
- [ ] URL on Step 2 contains projectId: `/new?step=context&projectId=abc123`
- [ ] Invalid projectId in URL → error + redirect to `/new`

**Testing:**
- [ ] Complete Step 1 → project created ✓
- [ ] Refresh during Step 2 → resume dialog ✓
- [ ] Resume → same projectId ✓
- [ ] Restart → "Create New" → new projectId ✓
- [ ] Complete 3 times → 3 projects, 0 duplicates ✓
- [ ] Invalid projectId → error ✓

**Evidence Required:**
```
[ ] Database screenshot: 3 projects with unique IDs
[ ] Screen recording: onboarding → resume dialog → resume → completion
[ ] localStorage screenshot: projectId matches Zustand
[ ] Network tab: POST /api/projects/create visible
```

**SIGN-OFF:** ✅ Module 1.3 COMPLETE or ❌ BLOCKERS?

---

### MODULE 1.4: Feature Gating by Tier ✓ or ✗?

**User Tier Detection:**
- [ ] On login, user tier fetched from DB
- [ ] Tier stored in Zustand: `useUserStore.state.tier`
- [ ] Tier values: "free", "pro", "team", "admin"
- [ ] Default for new user: "free"

**Feature Limits Enforced:**
- [ ] Free: max 1 project (2nd disabled, tooltip shown)
- [ ] Free: tasks disabled ("Pro feature" button)
- [ ] Free: coherence scan disabled ("Pro feature" button)
- [ ] Pro: max 10 projects (11th disabled)
- [ ] Pro: tasks enabled, scans enabled (5/month)
- [ ] Team: unlimited everything

**UI Gating:**
- [ ] useFeatureGate() hook returns `{ allowed, remaining, tier, showUpgrade }`
- [ ] Button disabled if not allowed (grayed out, cursor: not-allowed)
- [ ] Error message clear: "Pro feature" or "Limit exceeded"
- [ ] Tooltip on disabled button explains limit

**Upgrade Modal:**
- [ ] Click disabled feature → modal appears
- [ ] Modal shows Free | Pro | Team columns
- [ ] Pro is highlighted (recommended)
- [ ] Price: Free ($0) | Pro ($29/mo) | Team ($99/mo)
- [ ] CTA buttons: "Current Plan" (if already subscribed), "Upgrade", "Contact Sales"
- [ ] Close button dismisses without action

**Backend Enforcement:**
- [ ] Free user creates 1 project → success
- [ ] Free user tries to create 2nd → `403 Forbidden: Project limit reached`
- [ ] Free user tries to run task → `403 Forbidden: Feature unavailable`
- [ ] Pro user creates 11 projects → `403 Forbidden: Limit exceeded`

**Analytics:**
- [ ] Track: `feature_gate_shown` with `{ feature, tier }`
- [ ] Track: `upgrade_modal_shown` with `{ feature }`
- [ ] Track: `upgrade_attempted` with `{ source: "feature_gate" }`

**Testing:**
- [ ] Sign up as free user → tier = "free" ✓
- [ ] Create 1 project → success ✓
- [ ] Try 2nd → button disabled + tooltip ✓
- [ ] Click disabled → upgrade modal ✓
- [ ] Modal shows pricing ✓
- [ ] Upgrade in DB → refresh → features enabled ✓

**Evidence Required:**
```
[ ] Screen recording: free user tries features → modal appears
[ ] Upgrade modal screenshot: pricing table visible
[ ] Network tab: 403 Forbidden when free user over limit
[ ] Analytics dashboard: feature_gate_shown events logged
```

**SIGN-OFF:** ✅ Module 1.4 COMPLETE or ❌ BLOCKERS?

---

### MODULE 1.5: First-Run Experience ✓ or ✗?

**FRE Detection:**
- [ ] On login, check: `user.onboarding_completed === false`
- [ ] If false, show FRE modal on first page
- [ ] FRE persists across navigation (until completed or skipped)
- [ ] On re-login, FRE does NOT show (already completed)

**FRE Content:**
- [ ] 8 steps: welcome → create → onboarding → workspace → task → success
- [ ] Each step has tooltip highlighting relevant UI element
- [ ] "Next >" button advances to next step
- [ ] "Skip" button dismisses FRE (user still logged in)
- [ ] Tooltips don't block clicks (can click through if needed)

**Sample Project:**
- [ ] FRE uses pre-configured sample project (not blank)
- [ ] Sample has: name, context (audience, brand, success, guardrails), 3-5 tasks
- [ ] User can complete first task in <2 min
- [ ] Output visibly rendered in workspace

**Completion:**
- [ ] After all 8 steps:
  - Toast: "Great job! FRE complete"
  - Database: `onboarding_completed = true`
  - FRE closes, user in workspace
- [ ] If skip:
  - `onboarding_completed` stays false
  - User can re-trigger from Settings

**Analytics:**
- [ ] Event: `fre_started` (user sees FRE)
- [ ] Event: `fre_step_viewed` with `{ step: 1-8 }`
- [ ] Event: `fre_completed` (all steps done)
- [ ] Event: `fre_skipped` (user skipped)

**Testing:**
- [ ] Create new account → FRE appears ✓
- [ ] Watch 8 steps → all advance correctly ✓
- [ ] Complete → "Congratulations" ✓
- [ ] Sample project in DB ✓
- [ ] Logout + login → FRE hidden ✓
- [ ] Replay from Settings → FRE shows ✓
- [ ] Mobile: tooltips reposition ✓

**Evidence Required:**
```
[ ] Screen recording: all 8 FRE steps
[ ] Sample project screenshot in workspace
[ ] Database: onboarding_completed = true
[ ] Analytics: fre_completed event logged
```

**SIGN-OFF:** ✅ Module 1.5 COMPLETE or ❌ BLOCKERS?

---

## PHASE 2: ESSENTIAL UX

### MODULE 2.1: Save/Discard Confirmations & Feedback ✓ or ✗?

**Save Feedback:**
- [ ] Successful save: green toast "Changes saved" fades after 2s
- [ ] SaveIndicator component exists with states: idle, saving, saved, error
- [ ] Saving: spinner + "Saving..." (amber)
- [ ] Saved: checkmark + "Saved" (green), fades 2s
- [ ] Error: X icon + "Save failed. [Retry]" (red), persistent

**Error Recovery:**
- [ ] Save failure: error toast "Failed to save. [Retry]"
- [ ] "Retry" button retries (success or shows error again)
- [ ] SaveIndicator shows retry button on error state

**Inline Validation:**
- [ ] As user types in required field:
  - Empty: gray border
  - Typing: blue border
  - Too short: red border + error message below
  - Valid: green border + checkmark
- [ ] Required fields marked with asterisk (*)
- [ ] Error message specific: "Primary Segment required (3-100 chars)"

**Confirmation Dialogs:**
- [ ] Before "Execute Approval":
  - Dialog: "Approve Project Context?"
  - Message: "This will lock your context as source of truth..."
  - Message: "This action cannot be undone. (Create new version later if needed.)"
  - Buttons: "Approve", "Cancel"
- [ ] Approve → context locked, redirect to workspace
- [ ] Cancel → stay on context page
- [ ] Navigate away with unsaved changes:
  - Dialog: "You have unsaved changes. Leave without saving?"
  - Options: "Save & Leave", "Leave Without Saving", "Keep Editing"

**Button State:**
- [ ] "Execute Approval" disabled until all required fields filled
- [ ] Disabled button: grayed out, cursor: not-allowed
- [ ] Tooltip: "Complete required fields to approve"
- [ ] Valid form: button blue, cursor: pointer

**Testing:**
- [ ] Edit field → blue border ✓
- [ ] Leave empty → red border + error ✓
- [ ] Fill correctly → green border + checkmark ✓
- [ ] Click "Save changes" → "Saving..." → "Saved" ✓
- [ ] Fail API → error + "Retry" ✓
- [ ] Retry succeeds → "Saved" ✓
- [ ] Invalid form → "Execute Approval" disabled ✓
- [ ] Fill all → button enabled ✓
- [ ] Click Approve → confirmation dialog ✓
- [ ] Navigate away unsaved → unsaved changes dialog ✓

**Evidence Required:**
```
[ ] Screen recording: edit → save → success toast
[ ] Screen recording: edit → save fails → retry → success
[ ] Screen recording: inline validation (red/green borders)
[ ] Screen recording: confirmation dialog before approve
[ ] Screen recording: navigate away with unsaved changes
```

**SIGN-OFF:** ✅ Module 2.1 COMPLETE or ❌ BLOCKERS?

---

### MODULE 2.2: Network Failure Retry & Recovery ✓ or ✗?

**Network Failure Detection:**
- [ ] Fetch fails → show "Connection error. Retrying..." toast (not dismissable)
- [ ] Retry: 1s → 2s → 4s delays (exponential backoff)
- [ ] After 3 retries + all failed → "No connection. [Retry] [Close]"
- [ ] User can click "Retry" to force immediate retry
- [ ] When network restored → "Back online" toast auto-dismisses
- [ ] Queued requests flush automatically

**Offline Queue:**
- [ ] If offline, edits queued locally (IndexedDB or localStorage)
- [ ] Show "Saving when connection restored" indicator
- [ ] When online, queue flushes (batch requests)

**Error Messages:**
- [ ] Network timeout: "Request took too long. Try again."
- [ ] 401 Unauthorized: "Your session expired. Please log in again."
- [ ] 403 Forbidden: "You don't have permission to do this."
- [ ] 500 Server Error: "Server error. Our team notified. Try again soon."
- [ ] 429 Rate Limited: "Too many requests. Wait before trying again."

**Connection Status Indicator:**
- [ ] Header shows connection state: green dot (online), red dot (offline), yellow dot (retrying)
- [ ] Text: "Online", "Offline", "Retrying..."

**Monitoring:**
- [ ] Log all network failures to analytics
- [ ] Track: error type, endpoint, timestamp, user action
- [ ] Alert if error rate spikes

**Testing:**
- [ ] Disconnect network (DevTools → Offline)
- [ ] Try to save → "Connection error. Retrying..." ✓
- [ ] Watch retries: 1s, 2s, 4s delays ✓
- [ ] Reconnect → "Back online" toast ✓
- [ ] Queue flushes automatically ✓
- [ ] Check network tab: only 1 final request (not 3 retries) ✓
- [ ] Test different error codes (401, 403, 500) ✓
- [ ] See appropriate error messages ✓

**Evidence Required:**
```
[ ] Screen recording: disconnect → retry → reconnect → "Back online"
[ ] Network tab screenshot: exponential backoff delays visible
[ ] Analytics: network_error events logged with error codes
[ ] Header screenshot: offline indicator (red dot)
```

**SIGN-OFF:** ✅ Module 2.2 COMPLETE or ❌ BLOCKERS?

---

### MODULE 2.3: Task Timeout & Cancel Mechanism ✓ or ✗?

**Task Timeout:**
- [ ] Default: 30 minutes (configurable in Settings: 5-120 min)
- [ ] If task exceeds timeout:
  - Task status reverts to "pending"
  - Toast: "Task timed out after 30 min. Retry?"
  - "Retry" button visible

**Cancel Button:**
- [ ] While task in-progress, "Cancel" button visible
- [ ] Click "Cancel" → task reverts to "pending"
- [ ] Toast: "Task cancelled"

**ETA Estimation:**
- [ ] Show: "Generating... (~15s remaining)"
- [ ] Update ETA real-time
- [ ] Short task: 5-10s estimate, Medium: 15-30s, Long: 45-60s

**Progress Indicator:**
- [ ] Progress bar or spinner visible during execution
- [ ] Update every 1-2s
- [ ] Show % complete if available

**Task History:**
- [ ] Cancelled/timed-out tasks logged
- [ ] Task history shows: "Failed - Timeout", "Cancelled by user"
- [ ] Timestamp of failure visible

**Settings:**
- [ ] User can configure timeout in Settings modal
- [ ] Input: 5-120 minutes (with slider or text field)
- [ ] Help text: "Tasks will be cancelled if they exceed this time."

**Monitoring:**
- [ ] Alert if timeout rate >10%
- [ ] Track avg task duration by type
- [ ] Alert if cancellation rate >20%

**Testing:**
- [ ] Start task → see "Generating... (~Xs remaining)" ✓
- [ ] Progress bar advances ✓
- [ ] Countdown timer updates ✓
- [ ] Click "Cancel" → task cancelled ✓
- [ ] See "Task cancelled" toast ✓
- [ ] Task history shows "Cancelled by user" ✓
- [ ] Settings → change timeout to 5 min ✓
- [ ] Start task → wait 5m 30s ✓
- [ ] See "Task timed out" toast ✓
- [ ] Task status → "timed-out" ✓
- [ ] Click "Retry" → task runs again ✓

**Evidence Required:**
```
[ ] Screen recording: task execution with ETA countdown
[ ] Screen recording: click Cancel → task reverts
[ ] Screen recording: task timeout after X min
[ ] Settings screenshot: timeout configuration
[ ] Analytics dashboard: task_timeout events logged
```

**SIGN-OFF:** ✅ Module 2.3 COMPLETE or ❌ BLOCKERS?

---

### MODULE 2.4: Concurrent Edit Conflict Detection & Merge ✓ or ✗?

**Version Tracking:**
- [ ] Each spread has: `version: number`, `lastModifiedBy: userId`, `lastModifiedAt: timestamp`
- [ ] Version increments on every save

**Conflict Detection:**
- [ ] On save attempt:
  - Client sends: `{ version: 5, data: {...} }`
  - Server checks: `if (dbVersion !== clientVersion) return 409 Conflict`
  - Response: `{ conflict: true, serverVersion: 6, serverData: {...} }`

**Conflict UI:**
- [ ] Dialog appears: "This project was modified while you were editing"
- [ ] Show diff:
  - "Your changes: [list]"
  - "Their changes: [list]"
  - "Overlapping sections: [list if any]"
- [ ] Options:
  - "Use my version" (overwrite)
  - "Use their version" (discard mine)
  - "Merge" (if no overlap; combine both)
  - "Save as draft" (keep editing, create new version)

**Merge Strategy:**
- [ ] Different sections edited: auto-merge (combine both)
- [ ] Same section edited: show conflict dialog (user chooses)
- [ ] Merged result has version incremented

**Notification:**
- [ ] Toast when conflict detected: "Project updated by [user]. Review changes?"
- [ ] Link to version history to see what changed

**Real-Time Presence:**
- [ ] See who's in the project (avatars in header)
- [ ] Presence indicator: green dot next to active editors
- [ ] When user A saves while user B editing: user B notified in real-time

**Monitoring:**
- [ ] Track conflict rate (% of saves that conflict)
- [ ] Alert if conflict rate >5%
- [ ] Track most-conflicted sections

**Testing:**
- [ ] Open project in 2 browser windows (User A, User B)
- [ ] A edits Section 1, B edits Section 2 (different sections)
- [ ] A clicks "Save" → success ✓
- [ ] B clicks "Save" → conflict dialog ✓
- [ ] Dialog shows: "Your changes: Section 2", "Their changes: Section 1"
- [ ] Click "Merge" → both sections saved ✓
- [ ] Refresh both → merged result visible ✓
- [ ] A edits Section 1, B edits Section 1 (same section)
- [ ] A clicks "Save" → success ✓
- [ ] B clicks "Save" → conflict dialog ✓
- [ ] Dialog shows: "Conflicting sections: Section 1"
- [ ] Options: "Keep mine", "Use theirs" (NOT "Merge")
- [ ] Click "Keep mine" → A's changes overwritten ✓

**Evidence Required:**
```
[ ] Screen recording: User A and User B edit simultaneously
[ ] Screen recording: different sections → auto-merge
[ ] Screen recording: same section → conflict dialog
[ ] Network tab: 409 Conflict response visible
[ ] Analytics: spread_conflict events logged
```

**SIGN-OFF:** ✅ Module 2.4 COMPLETE or ❌ BLOCKERS?

---

## OVERALL PHASE 1-2 SUMMARY

**Total Modules:** 9 (5 Phase 1 + 4 Phase 2)

**Sign-Off Status:**
- [ ] 1.1: ✅ COMPLETE
- [ ] 1.2: ✅ COMPLETE
- [ ] 1.3: ✅ COMPLETE
- [ ] 1.4: ✅ COMPLETE
- [ ] 1.5: ✅ COMPLETE
- [ ] 2.1: ✅ COMPLETE
- [ ] 2.2: ✅ COMPLETE
- [ ] 2.3: ✅ COMPLETE
- [ ] 2.4: ✅ COMPLETE

**QA Sign-Off:** _________________________ (QA Lead) Date: _________

**Engineering Sign-Off:** _________________________ (Tech Lead) Date: _________

**Product Sign-Off:** _________________________ (Product Manager) Date: _________

---

## NEXT STEPS (If All Modules COMPLETE)

- [ ] Phase 3: Asset Manager UI (if shipping assets in v1.0)
- [ ] Launch readiness final review
- [ ] Deploy to staging environment
- [ ] Final smoke test
- [ ] Deploy to production (Week 4)

