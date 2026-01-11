# CODRA: DETAILED AGENT EXECUTION PROMPTS
## Self-Contained Implementation Tasks with Verification Receipts

Each prompt below is designed for a specialized agent (software engineer, QA, or architect) to execute independently. Upon completion, the agent must provide a **Receipt** (evidence of completion) before proceeding to the next prompt.

---

## AGENT PROMPT 1.1: Enable Task Execution Engine
**Target Agent:** Software Engineer (Full-Stack)
**Duration:** 3-5 days
**Complexity:** High
**Dependencies:** None (foundational)

### TASK DESCRIPTION

Your objective is to resurrect the task execution pipeline. Currently, all task execution code is commented-out in `ExecutionDeskPage.tsx`, making the core feature non-functional. You must:

1. **Uncomment and clean** all task execution code
2. **Wire the UI** so users see "Run" buttons on tasks
3. **Add error handling** with user-friendly error messages
4. **Implement real-time progress** (status updates, ETA, progress bar)
5. **Test end-to-end** with Claude API

### ACCEPTANCE CRITERIA (Your Receipt)

You are done when ALL of the following are TRUE:

**Code Quality:**
- [ ] `handleRunTask()` function in ExecutionDeskPage.tsx is fully uncommented (no `/*` or `*/` markers in task execution code)
- [ ] Git diff shows clean changes: only un-commented code, no accidental modifications
- [ ] TypeScript strict mode passes: `npm run type-check` exits 0
- [ ] ESLint passes: `npm run lint` shows 0 errors in modified files
- [ ] No console errors in browser (DevTools → Console is clean)

**Feature Completeness:**
- [ ] Task execution button is visible in the UI (Proof panel or center surface)
- [ ] Button is labeled "Run" or "Execute" (not "Run Task")
- [ ] Clicking button transitions task: `pending` → `in-progress` → `complete` or `failed`
- [ ] Task status is persisted to localStorage AND database (verify in browser storage + DB)
- [ ] API request to Claude is sent (verify in DevTools → Network tab, see POST to Claude API endpoint)
- [ ] Output is rendered in spread section within 15 seconds of completion
- [ ] Save confirmation shown: "Task complete" or similar toast

**Error Handling:**
- [ ] If API returns error: task status → `failed`, error message shown in UI (not console-only)
- [ ] Error message is human-readable: "AI response failed. Try again?" not technical jargon
- [ ] "Retry" button visible when task fails (user can re-run without page refresh)
- [ ] Task reverts to `pending` state after failure (not stuck in `failed`)
- [ ] Multiple errors: each one logged to analytics + shown to user

**UX & Responsiveness:**
- [ ] Task status shows real-time updates as execution progresses (not just pending → complete)
- [ ] Progress indicator visible (spinner, % complete, or "Generating...")
- [ ] ETA shown (e.g., "~10s remaining") if available
- [ ] Page doesn't freeze during execution (async/await, not blocking)
- [ ] Multiple tasks can be queued (user can queue 3+ tasks, they run in order)

**Testing:**
- [ ] Create new test project
- [ ] Navigate to workspace
- [ ] Click "Run" on a task
- [ ] Watch output appear within 15s
- [ ] Refresh page → output persists
- [ ] Intentionally break API key in config
- [ ] Try to run task → see error message + retry button
- [ ] Fix API key, click retry → task succeeds
- [ ] Run 3 tasks in sequence → all complete successfully
- [ ] Check analytics: task execution events logged with correct status

**Analytics:**
- [ ] Event tracked: `task_execution_started` with `{ taskId, projectId }`
- [ ] Event tracked: `task_execution_completed` with `{ taskId, duration, tokensUsed }`
- [ ] Event tracked: `task_execution_failed` with `{ taskId, error }`
- [ ] Dashboard shows execution success rate (target: >95%)

### SPECIFIC IMPLEMENTATION GUIDANCE

**File:** `src/new/routes/ExecutionDeskPage.tsx`
- Find lines ~201-327 where `handleRunTask` is commented
- Uncomment carefully (preserve function logic)
- Wire to task button: `onClick={() => handleRunTask(taskId, 'default')}`

**File:** `src/lib/ai/prompt-builder.ts`
- Verify prompt formatting for Claude API
- Test with a short, simple prompt first

**File:** `src/components/TaskQueue.tsx` or similar
- Add run button to each task item
- Show status badge (pending → amber, running → blue, complete → green, failed → red)

**Create new hook if needed:**
- `src/hooks/useTaskExecution.ts` (extract execution logic for reusability)

**Testing approach:**
```bash
1. npm run dev                    # Start dev server
2. Create new project via onboarding
3. Open workspace
4. Look for task queue in UI
5. Click "Run" on a task
6. Open DevTools → Network tab
7. Verify POST to Claude API
8. Watch output appear
9. Refresh page; verify output persists
```

### VERIFICATION RECEIPT FORMAT

When complete, provide this receipt in a comment/PR description:

```
## MODULE 1.1: Task Execution Engine ✅ COMPLETE

**Evidence:**
- Task execution code fully uncommented ✓
- UI shows "Run" button on all tasks ✓
- Task execution succeeds: 100% in QA testing (10/10 test runs successful) ✓
- Error handling works: intentional API failure triggers error message + retry ✓
- Progress shown in real-time: "Generating... (~8s remaining)" ✓
- Output persists after page refresh ✓
- Analytics events firing: task_execution_completed logged ✓
- TypeScript strict mode passes ✓
- ESLint passes ✓
- No console errors ✓

**Test Summary:**
- 10/10 successful task executions
- Error recovery: 5/5 retries successful
- Performance: avg execution time 8.2s (within estimate)
- User can complete full workflow: create project → run task → see result ✓

**Git Commit:**
```
feat: enable task execution engine with real-time progress

Uncomment handleRunTask() and wire to UI. Add error handling, progress
indicator, and retry mechanism. Tasks now execute via Claude API and
render output in spread sections. Supports task queueing and state
persistence.

- Uncommented task execution code in ExecutionDeskPage
- Added "Run" button to task queue UI
- Implemented real-time progress updates
- Error handling with user-friendly messages
- Analytics tracking for execution metrics
- 100% success rate in QA testing

Fixes #[issue]
```
```

---

## AGENT PROMPT 1.2: Add Spread Generation Error Handling
**Target Agent:** Software Engineer (Frontend)
**Duration:** 1 day
**Complexity:** Medium
**Dependencies:** Module 1.1 (can be parallel)

### TASK DESCRIPTION

Currently, if spread generation fails, users see a blank workspace with no error message. This is unacceptable. You must:

1. **Wrap spread generation** in try-catch
2. **Catch + log errors** to analytics
3. **Show error UI** to user (banner with message + retry button)
4. **Provide fallback** (minimal working spread or empty sections)
5. **Create error boundary** to catch React render errors

### ACCEPTANCE CRITERIA (Your Receipt)

You are done when ALL of the following are TRUE:

**Error Handling:**
- [ ] Spread generation wrapped in try-catch (in useEffect)
- [ ] Error caught AND logged to analytics with `{ projectId, errorMessage, function }`
- [ ] Error does NOT crash the page (error boundary in place)

**User Feedback:**
- [ ] When spread generation fails, error banner appears in workspace (not blank page)
- [ ] Banner is prominent: red background, clear text, readable from across room
- [ ] Message is human-readable: "Failed to generate project brief. Please try again." (not technical stack trace)
- [ ] "Retry" button visible; clicking retries generation immediately
- [ ] "View Details" link shows technical error (for debugging, optional)

**Fallback Behavior:**
- [ ] If spread generation fails, page does NOT show blank center surface
- [ ] Instead: either show fallback spread (empty sections) OR show error message
- [ ] User can manually create sections or skip to task execution

**Error Boundary:**
- [ ] React error boundary wraps ExecutionDeskPage component
- [ ] If ExecutionDesk crashes for ANY reason, error boundary catches it
- [ ] Renders: "Workspace encountered an error. Please refresh the page."
- [ ] Error is logged to analytics + console

**Testing:**
- [ ] Create new project
- [ ] Intentionally break spread generation (mock function throws error)
- [ ] Refresh workspace
- [ ] See error banner with message
- [ ] Click "Retry" → spread generation retries
- [ ] Fix the broken function
- [ ] Retry succeeds → banner disappears, workspace shows normally
- [ ] Intentionally throw error from ExecutionDesk component
- [ ] Error boundary catches it → shows error message (not blank page)

### SPECIFIC IMPLEMENTATION GUIDANCE

**File:** `src/new/routes/ExecutionDeskPage.tsx`
- Find useEffect where `generateSpreadFromProfile()` is called
- Wrap in try-catch:
  ```tsx
  try {
    const newSpread = generateSpreadFromProfile(...);
    setSpread(newSpread);
  } catch (error) {
    console.error("Spread generation failed:", error);
    setSpreadError(error.message);
    analytics.track("spread_generation_error", { projectId, error: error.message });
  }
  ```

**Create File:** `src/components/ErrorBoundary.tsx`
```tsx
export class ExecutionDeskErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error("ExecutionDesk error:", error, errorInfo);
    analytics.track("execution_desk_crash", { error: error.message });
  }
}
```

**File:** `src/App.tsx`
- Wrap ExecutionDeskPage in error boundary

**Testing approach:**
```bash
1. Create new project, fill onboarding
2. Add console error before spread generation:
   if (!project.name) throw new Error("Test error");
3. Refresh workspace
4. See error banner
5. Click "Retry"
6. Remove test error, retry succeeds
```

### VERIFICATION RECEIPT FORMAT

```
## MODULE 1.2: Spread Generation Error Handling ✅ COMPLETE

**Evidence:**
- Spread generation wrapped in try-catch ✓
- Error banner shows when generation fails ✓
- Error message is user-friendly (not technical) ✓
- "Retry" button retries successfully ✓
- Error boundary catches React crashes ✓
- Analytics event: spread_generation_error logged ✓
- Fallback behavior: empty sections shown instead of blank page ✓
- No console errors ✓

**Test Summary:**
- Simulated spread generation error: ✓ caught, message shown, retry works
- Simulated React crash: ✓ caught by error boundary, recovery message shown
- 5/5 retry attempts successful ✓

**Git Commit:**
```
fix: add comprehensive error handling to spread generation

Wrap spread generation in try-catch. If generation fails, show user-
friendly error banner with retry option. Add React error boundary to
catch render errors. Fallback to empty sections if generation fails.

- Try-catch around generateSpreadFromProfile()
- Error banner with retry button
- React error boundary in ExecutionDeskPage
- Analytics tracking for errors
- Fallback spread for error cases

Fixes #[issue]
```
```

---

## AGENT PROMPT 1.3: Clarify Project Creation Lifecycle
**Target Agent:** Software Engineer (Backend/Full-Stack)
**Duration:** 1-2 days
**Complexity:** Medium
**Dependencies:** None (can be parallel)

### TASK DESCRIPTION

Currently, it's unclear WHEN a project is created during onboarding. This causes:
- Duplicate project creation (user restarts onboarding, project created twice)
- Ambiguous resume state (don't know which project to resume)
- Data integrity risk (user may think project is created when it's not)

You must:

1. **Define:** Project created at END of Step 1 (project name/type/summary)
2. **Implement:** API endpoint creates project immediately after Step 1
3. **Store:** projectId in localStorage + Zustand store
4. **Prevent duplicates:** If user restarts, detect existing project and offer resume
5. **Test:** No duplicates created in any restart scenario

### ACCEPTANCE CRITERIA (Your Receipt)

You are done when ALL of the following are TRUE:

**Project Creation Timing:**
- [ ] Project is created at END of Step 1 (after name/type/summary submitted)
- [ ] Project receives unique ID immediately
- [ ] Project row inserted into database `projects` table
- [ ] projectId returned to frontend
- [ ] User sees confirmation toast: "Project created: [name]"

**State Management:**
- [ ] projectId stored in localStorage: `codra:onboardingProject` JSON object
- [ ] projectId stored in Zustand store: `useOnboardingStore.state.projectId`
- [ ] projectId matches in both storage locations (consistency)

**Duplicate Prevention:**
- [ ] On onboarding mount, check localStorage for existing projectId
- [ ] If found, show dialog: "Resume project '[name]'?" with options:
  - "Resume" → navigate to Step 2 with same projectId
  - "Create New" → clear localStorage, start fresh (new projectId)
- [ ] If user clicks "Create New", old project is NOT deleted (preserved in DB)
- [ ] If user clicks "Resume", projectId is validated against DB (verify exists)

**Resume Flow:**
- [ ] User completes Step 1
- [ ] Page refreshes (F5)
- [ ] Resume dialog appears (auto-detected from localStorage)
- [ ] User clicks "Resume"
- [ ] Navigates to Step 2 with same projectId
- [ ] Can continue/complete onboarding
- [ ] Final project has correct id (no duplicate)

**Data Integrity:**
- [ ] After completing onboarding 3 times (different projects):
  - Database has exactly 3 project rows
  - 0 duplicates
  - Each with unique projectId
- [ ] Project fields validated before DB insert:
  - name: required, non-empty
  - type: required, valid value
  - summary: optional but validated
- [ ] On navigation from Step 1 → Step 2:
  - URL contains projectId: `/new?step=context&projectId=abc123`
  - projectId is validated (exists in DB)
  - If invalid, show error + redirect to `/new`

**Testing:**
- [ ] Complete onboarding Step 1 → project created ✓
- [ ] Refresh page during Step 2 → resume dialog appears ✓
- [ ] Resume → same projectId, continue Step 2 ✓
- [ ] Complete onboarding → 1 project in DB ✓
- [ ] Restart → "Create New" → new projectId ✓
- [ ] Complete onboarding → 2 projects in DB (no duplicates) ✓
- [ ] Repeat 3 times → 3 projects (no duplicates) ✓
- [ ] Edit URL projectId to fake value → error page ✓
- [ ] localStorage shows correct projectId ✓

### SPECIFIC IMPLEMENTATION GUIDANCE

**Backend API to create:**
```
POST /api/projects/create
Request: { name, type, summary }
Response: { projectId, createdAt }
Action: Insert row in projects table, return projectId
```

**File:** `src/new/routes/onboarding/steps/StepProjectInfo.tsx`
```tsx
const handleCreateProject = async (formData) => {
  try {
    const response = await fetch("/api/projects/create", {
      method: "POST",
      body: JSON.stringify(formData)
    });
    const { projectId } = await response.json();

    // Store in localStorage
    localStorage.setItem("codra:onboardingProject", JSON.stringify({
      projectId,
      name: formData.name,
      step: "context",
      createdAt: Date.now()
    }));

    // Store in Zustand
    useOnboardingStore.setState({ projectId, step: "context" });

    toast.success(`Project "${formData.name}" created!`);
    navigate(`/new?step=context&projectId=${projectId}`);
  } catch (error) {
    toast.error("Failed to create project");
  }
};
```

**File:** `src/new/routes/onboarding/OnboardingFlow.tsx`
```tsx
useEffect(() => {
  const saved = localStorage.getItem("codra:onboardingProject");
  if (saved) {
    const { projectId, name } = JSON.parse(saved);

    // Show resume dialog
    setResumeDialog({
      show: true,
      projectName: name,
      onResume: () => {
        useOnboardingStore.setState({ projectId, step: "context" });
        setResumeDialog({ show: false });
        navigate(`/new?step=context&projectId=${projectId}`);
      },
      onCreate: () => {
        localStorage.removeItem("codra:onboardingProject");
        useOnboardingStore.setState({ projectId: null, step: "info" });
        setResumeDialog({ show: false });
      }
    });
  }
}, []);
```

### VERIFICATION RECEIPT FORMAT

```
## MODULE 1.3: Project Creation Lifecycle ✅ COMPLETE

**Evidence:**
- Project created at end of Step 1 ✓
- projectId returned immediately ✓
- projectId stored in localStorage + Zustand ✓
- Resume dialog detects existing project ✓
- "Resume" navigates with correct projectId ✓
- "Create New" creates new projectId, old project preserved ✓
- URL contains projectId validation ✓
- No duplicate projects created (tested 3x) ✓

**Test Summary:**
- Completed onboarding 3 times: 3 projects created, 0 duplicates ✓
- Resumed mid-onboarding: same projectId used ✓
- Invalid projectId in URL: error + redirect ✓
- Database consistency: verified all rows ✓

**Git Commit:**
```
feat: clarify project creation lifecycle and prevent duplicates

Define: Project created at end of onboarding Step 1.
Implement: Resume detection with dialog prompt.
Store: projectId in localStorage + Zustand for resumability.
Prevent: Duplicate project creation on restart.

- POST /api/projects/create endpoint
- Project creation at Step 1 completion
- Resume dialog on onboarding mount
- projectId validation on navigation
- localStorage + Zustand consistency

Fixes #[issue]
```
```

---

## AGENT PROMPT 1.4: Implement Feature Gating by Tier
**Target Agent:** Software Engineer (Full-Stack)
**Duration:** 1-2 days
**Complexity:** Medium-High
**Dependencies:** None (can be parallel)

### TASK DESCRIPTION

Currently, all features are accessible to all users. This must change:
- Free users should NOT access Pro features (task execution, coherence scan)
- Free users limited to 1 project (not unlimited)
- Users should see clear upgrade prompts (not dark patterns)

You must:

1. **Create tier system:** Free, Pro, Team (with feature limits)
2. **Fetch user tier** on login (from DB user_profiles)
3. **Gate features** with useFeatureGate() hook
4. **Show upgrade modal** when user hits limit
5. **Enforce on backend** (return 403 if user tries unauthorized action)

### ACCEPTANCE CRITERIA (Your Receipt)

You are done when ALL of the following are TRUE:

**User Tier Detection:**
- [ ] On login, user tier fetched from DB: `select tier from user_profiles where id = ?`
- [ ] Tier stored in Zustand: `useUserStore.state.tier`
- [ ] Tier retrieved on every page load (or cached reasonably)
- [ ] Tier values: "free", "pro", "team", "admin"
- [ ] Default tier for new user: "free"

**Feature Limits Enforced:**
- [ ] Free users: max 1 project
  - After creating 1st project, "Create" button disabled
  - Tooltip: "Free users can create 1 project. Upgrade to Pro for 10."
- [ ] Free users: max 0 task executions (disabled entirely)
  - "Run" button grayed out on all tasks
  - Tooltip: "Task execution is a Pro feature"
- [ ] Free users: max 0 coherence scans
  - "Run Scan" button disabled
  - Tooltip: "Coherence scan is a Pro feature"
- [ ] Pro users: max 10 projects, unlimited tasks, 5 scans/month
- [ ] Team users: unlimited everything

**UI Gating:**
- [ ] useFeatureGate() hook returns: `{ allowed: bool, remaining: number, tier: string, showUpgrade: () => void }`
- [ ] Button disabled if not allowed:
  ```tsx
  const { allowed, showUpgrade } = useFeatureGate("projects");
  <button disabled={!allowed} onClick={() => allowed ? create() : showUpgrade()}>
    Create
  </button>
  ```
- [ ] Error message clear: "Pro feature" or "Limit exceeded"

**Upgrade Modal:**
- [ ] When user clicks disabled feature, modal appears
- [ ] Modal shows:
  - Feature name: "Task Execution"
  - 3-column table: Free | Pro | Team
  - Features listed per tier
  - Price: Free ($0) | Pro ($29/mo) | Team ($99/mo)
  - Pro is highlighted (recommended)
  - CTA buttons: "Current Plan", "Upgrade to Pro", "Contact Sales"
- [ ] "Current Plan" button disabled (grayed out)
- [ ] "Upgrade to Pro" button has working link to billing page
- [ ] Close (X) button dismisses without action
- [ ] Modal not shown if user is already Pro/Team

**Backend Enforcement:**
- [ ] Free user tries POST /api/projects/create
  - Server checks: `userTier === "free" && projectCount >= 1`
  - Returns: `403 Forbidden: { error: "Project limit reached" }`
  - Frontend shows error toast: "Upgrade to Pro to create more projects"
- [ ] Free user tries POST /api/tasks/:taskId/execute
  - Returns: `403 Forbidden: { error: "Feature unavailable" }`
- [ ] Pro user tries POST /api/coherence-scan (6th scan in month)
  - Returns: `403 Forbidden: { error: "Monthly scan limit exceeded" }`

**Analytics:**
- [ ] Track: `feature_gate_shown` with `{ feature, tier, action: "upgrade_clicked" | "dismissed" }`
- [ ] Track: `upgrade_modal_shown` with `{ feature, tier }`
- [ ] Track: `upgrade_attempted` with `{ source: "feature_gate" }`
- [ ] Dashboard shows: upgrade funnel (modal shown → upgrade clicked → upgrade completed)

**Testing:**
- [ ] Sign up as new user (tier = "free")
- [ ] Create 1 project → success
- [ ] Try to create 2nd → "Create" button disabled, tooltip visible
- [ ] Click disabled button → upgrade modal appears
- [ ] Modal shows "Free" vs "Pro" vs "Team" pricing
- [ ] Click "Upgrade to Pro" → redirects to billing (test environment)
- [ ] Mock upgrade: manually set user tier to "pro" in DB
- [ ] Refresh page
- [ ] "Create" button enabled
- [ ] Can create 2nd, 3rd, ..., 10th projects
- [ ] Try to create 11th → disabled
- [ ] Try to run task (as free user) → "Pro feature" button
- [ ] Click → upgrade modal
- [ ] Try to run coherence scan (as free user) → disabled
- [ ] Upgrade to Pro → all features enabled

### SPECIFIC IMPLEMENTATION GUIDANCE

**Create user tier store:**
```tsx
// src/lib/stores/user-tier.ts
export const useUserStore = create((set) => ({
  tier: "free",
  projectCount: 0,
  coherenceScanUsage: 0, // count used this month

  loadUserTier: async () => {
    const response = await fetch("/api/user/tier");
    const data = await response.json();
    set(data);
  }
}));
```

**Create feature gate hook:**
```tsx
// src/lib/hooks/useFeatureGate.ts
export function useFeatureGate(feature: "projects" | "task_execution" | "coherence_scan" | "collaboration") {
  const { tier, projectCount, coherenceScanUsage } = useUserStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const limits = {
    projects: { free: 1, pro: 10, team: Infinity },
    task_execution: { free: false, pro: true, team: true },
    coherence_scan: { free: 0, pro: 5, team: Infinity },
    collaboration: { free: false, pro: false, team: true }
  };

  const limit = limits[feature][tier];
  const allowed = feature === "projects"
    ? projectCount < limit
    : feature === "coherence_scan"
    ? coherenceScanUsage < limit
    : limit !== false;

  return {
    allowed,
    remaining: feature === "projects" ? limit - projectCount : 0,
    tier,
    showUpgrade: () => setShowUpgradeModal(true),
    upgradeModalOpen: showUpgradeModal,
    closeUpgradeModal: () => setShowUpgradeModal(false)
  };
}
```

**Use in component:**
```tsx
// src/new/routes/ProjectsPage.tsx
const { allowed, remaining, showUpgrade } = useFeatureGate("projects");

<button
  onClick={() => allowed ? setShowCreateMenu(true) : showUpgrade()}
  disabled={!allowed}
  title={!allowed ? "Free users can create 1 project. Upgrade to Pro." : ""}
>
  Create
</button>
```

**Backend:**
```
GET /api/user/tier
Response: { tier: "free" | "pro" | "team", projectCount: number, coherenceScanUsage: number }

POST /api/projects/create
Validation: if (tier === "free" && projectCount >= 1) return 403;
```

### VERIFICATION RECEIPT FORMAT

```
## MODULE 1.4: Feature Gating by Tier ✅ COMPLETE

**Evidence:**
- User tier fetched on login ✓
- useFeatureGate() hook working ✓
- Free: can create 1 project, can't create 2nd ✓
- Free: can't run tasks (button disabled) ✓
- Free: can't run coherence scans (button disabled) ✓
- Pro: can create 10 projects ✓
- Pro: can run tasks ✓
- Pro: can run 5 scans/month ✓
- Team: unlimited everything ✓
- Upgrade modal shows on feature gate violation ✓
- Backend enforces: 403 on unauthorized action ✓
- Analytics: feature_gate_shown events logged ✓

**Test Summary:**
- Free user: 10/10 correct feature gate behaviors ✓
- Pro user: all features enabled ✓
- Upgrade flow: modal shown → upgrade link works ✓
- Backend enforcement: 403 returned for free user over limit ✓

**Git Commit:**
```
feat: implement feature gating by user tier (Free/Pro/Team)

Add tier-based feature access control:
- Free: 1 project, no task execution, no coherence scans
- Pro: 10 projects, task execution, 5 scans/month
- Team: unlimited, collaboration features

- Tier fetched from user_profiles on login
- useFeatureGate() hook for UI gating
- Upgrade modal with pricing table
- Backend 403 enforcement
- Analytics tracking for upgrade funnel

Fixes #[issue]
```
```

---

## AGENT PROMPT 1.5: First-Run Experience (FRE) Onboarding
**Target Agent:** Software Engineer (Frontend/UX)
**Duration:** 2-3 days
**Complexity:** Medium
**Dependencies:** Modules 1.1-1.4 (should be complete first)

### TASK DESCRIPTION

New users land on the app and have NO IDEA what to do. They bounce immediately. You must:

1. **Build FRE flow** using Shepherd.js (tour library)
2. **Walk through** create project → onboarding → workspace → run task → success
3. **Show tooltips** at each step (skippable)
4. **Use sample project** (pre-populated with context)
5. **Mark completion** so FRE only shows once per user

### ACCEPTANCE CRITERIA (Your Receipt)

You are done when ALL of the following are TRUE:

**FRE Detection:**
- [ ] On login, check: `user.onboarding_completed === false` (from DB)
- [ ] If false, show FRE modal on first page
- [ ] FRE persists across page navigation (until completed or skipped)
- [ ] On logout + re-login, FRE does NOT show (already completed)

**FRE Content:**
- [ ] Step 1: Welcome, "Click Create button"
- [ ] Step 2: "Choose New Project"
- [ ] Step 3: Highlight name field, "Enter project name"
- [ ] Step 4: Fill form, submit, "Creating your project..."
- [ ] Step 5: Workspace loads, "This is Lyra, your AI assistant"
- [ ] Step 6: Highlight task queue, "Click Run to generate content"
- [ ] Step 7: Task executes, output appears, "Congratulations!"
- [ ] Step 8: "You've created something. Next steps: [...]"
- [ ] End: FRE closes, user in workspace

**Interactivity:**
- [ ] "Next >" button advances to next step
- [ ] "Skip Tour" button dismisses FRE (user still logged in)
- [ ] Tooltips don't block clicks (can click through if needed)
- [ ] Each step highlights relevant UI element (border, highlight)
- [ ] Tooltips reposition on mobile (don't overflow screen)

**Sample Project:**
- [ ] FRE uses pre-configured sample project (not blank)
- [ ] Sample has:
  - Name: "My First Creative Project"
  - Context: audience, brand voice, success criteria, guardrails
  - Task queue: 3-5 short tasks (not overwhelming)
- [ ] User can complete first task in <2 min
- [ ] Output is visibly rendered in workspace

**Completion:**
- [ ] After completing FRE (all 8 steps):
  - Toast: "Great job! FRE complete"
  - Database: `UPDATE user_profiles SET onboarding_completed = true WHERE id = ?`
  - FRE modal closes
  - User in workspace with sample project
- [ ] If user skips FRE:
  - `onboarding_completed` stays false (user can re-trigger)
  - User lands in blank projects page

**Analytics:**
- [ ] Event: `fre_started` (user sees FRE)
- [ ] Event: `fre_step_viewed` with `{ step: 1-8 }`
- [ ] Event: `fre_completed` (all steps done)
- [ ] Event: `fre_skipped` (user clicked skip)
- [ ] Cohort analysis: retention of "FRE completers" vs "FRE skippers"

**Testing:**
- [ ] Create new account → FRE appears
- [ ] Watch all 8 steps in sequence ✓
- [ ] Complete FRE → "Congratulations" message ✓
- [ ] Sample project created in DB ✓
- [ ] Can see sample project in workspace ✓
- [ ] Logout + login → FRE does NOT show ✓
- [ ] Replay FRE from Settings → FRE shows again ✓
- [ ] On mobile (iPhone): tooltips reposition ✓
- [ ] On mobile: FRE still usable (or shows docs link instead) ✓
- [ ] Skip FRE midway → continues where user left off (optional)

### SPECIFIC IMPLEMENTATION GUIDANCE

**Install:** `npm install shepherd.js`

**Create component:**
```tsx
// src/components/FirstRunExperience.tsx
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/shepherd.css';

export function FirstRunExperience({ onComplete }) {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      classes: 'shepherd-theme-dark',
      scrollTo: true
    }
  });

  tour.addStep({
    id: 'welcome',
    title: 'Welcome to Codra',
    text: 'Let's create your first creative project. Ready?',
    buttons: [
      { text: 'Skip Tour', action: tour.cancel },
      { text: 'Next >', action: tour.next }
    ]
  });

  tour.addStep({
    id: 'create-button',
    title: 'Create a Project',
    text: 'Click the Create button to start.',
    attachTo: { element: '[data-tour="create-button"]', on: 'bottom' },
    buttons: [{ text: 'Next >', action: tour.next }]
  });

  // ... more steps ...

  tour.on('complete', () => {
    markUserOnboardingComplete();
    analytics.track('fre_completed');
    onComplete();
  });

  tour.on('cancel', () => {
    analytics.track('fre_skipped');
    onComplete();
  });

  tour.start();
  return null;
}
```

**Detect FRE in App:**
```tsx
// src/App.tsx
useEffect(() => {
  isFirstTimeUser().then(isFirst => {
    if (isFirst) {
      setShowFRE(true);
      analytics.track('fre_started');
    }
  });
}, []);

return (
  <>
    {showFRE && <FirstRunExperience onComplete={() => setShowFRE(false)} />}
    <Router>...</Router>
  </>
);
```

**Create sample project:**
```tsx
// src/domain/templates/sample-project.ts
export const SAMPLE_PROJECT = {
  name: "My First Creative Project",
  type: "website",
  summary: "A beautiful, modern website to showcase my work.",
  // ... audience, brand, success, guardrails ...
  tasks: [
    { title: "Write Hero Headline", description: "Create a compelling tagline" },
    { title: "Define Brand Colors", description: "Choose 3-4 colors" },
    { title: "Write Call-to-Action", description: "What do you want visitors to do?" }
  ]
};
```

### VERIFICATION RECEIPT FORMAT

```
## MODULE 1.5: First-Run Experience ✅ COMPLETE

**Evidence:**
- FRE shown on new account ✓
- 8 steps: welcome → create → onboarding → workspace → run task → success ✓
- Tooltips highlight relevant UI elements ✓
- "Next >" and "Skip" buttons work ✓
- Sample project created with pre-filled context ✓
- User can complete first task in FRE (~2 min) ✓
- FRE completion marked in DB: onboarding_completed = true ✓
- FRE does NOT show on re-login ✓
- Re-trigger from Settings works ✓
- Analytics: fre_started, fre_completed, fre_skipped logged ✓
- Mobile responsive: tooltips reposition ✓

**Test Summary:**
- 5 new accounts: 5/5 saw FRE ✓
- 5 completions: time avg 1.5 min ✓
- 1 skip test: onboarding_completed stayed false ✓
- Re-login: FRE hidden ✓

**Git Commit:**
```
feat: add first-run experience (FRE) onboarding

Guide new users through their first workflow with Shepherd.js tour.
Sample project with pre-filled context. Quick win: <2 min to first output.

- FRE flow: create project → fill context → run task → success
- 8 steps with tooltips (skippable)
- Sample project template with pre-populated context
- Analytics: FRE funnel tracking
- Mobile responsive

Fixes #[issue]
```
```

---

## AGENT PROMPT 2.1: Save/Discard Confirmations & Feedback
**Target Agent:** Software Engineer (Frontend)
**Duration:** 1-2 days
**Complexity:** Low-Medium
**Dependencies:** Modules 1.1-1.5 (should be complete)

### TASK DESCRIPTION

Users edit context but don't know if changes saved. No confirmation dialogs before irreversible actions. Fix:

1. **Toast on successful save** ("Changes saved")
2. **Red border + error message** on save failure
3. **Inline validation** (green for valid, red for invalid)
4. **Confirmation dialog** before "Execute Approval"
5. **Disable Approve button** if form not valid

### ACCEPTANCE CRITERIA (Your Receipt)

You are done when ALL of the following are TRUE:

**Save Feedback:**
- [ ] On successful section save: green toast "Changes saved" appears, fades after 2s
- [ ] SaveIndicator UI component exists with states: idle, saving, saved, error
- [ ] Saving state: spinner + "Saving..." text (amber color)
- [ ] Saved state: checkmark + "Saved" text (green color), fades after 2s
- [ ] Error state: X icon + "Save failed. [Retry]" (red color), persistent until retry

**Error Recovery:**
- [ ] On save failure (intentional API error):
  - Error toast shown: "Failed to save. Retry?"
  - "Retry" button in toast; clicking retries
  - OR SaveIndicator shows "Save failed" with "Retry" button
- [ ] After retry succeeds: error state clears, shows "Saved"

**Inline Validation:**
- [ ] As user types in required field:
  - Empty: gray border
  - Typing: blue border
  - Too short: red border + error message below field
  - Valid: green border + checkmark icon
- [ ] Required fields marked: asterisk (*) or "required" label
- [ ] Error messages specific: "Primary Segment required (3-100 chars)" not just "Invalid"

**Confirmation Dialogs:**
- [ ] Before "Execute Approval" button, click shows dialog:
  - Title: "Approve Project Context?"
  - Message: "This will lock your context as the source of truth..."
  - Message: "This action cannot be undone. (Create new version later if needed.)"
  - Buttons: "Approve", "Cancel"
- [ ] Click "Approve" → context locked, redirect to workspace
- [ ] Click "Cancel" → dialog closes, stay on context page
- [ ] Before navigating away with unsaved changes:
  - Dialog: "You have unsaved changes. Leave without saving?"
  - Options: "Save & Leave", "Leave Without Saving", "Keep Editing"

**Button State:**
- [ ] "Execute Approval" button disabled until all required fields filled
- [ ] Disabled button is grayed out + cursor: not-allowed
- [ ] Tooltip on disabled button: "Complete required fields to approve"
- [ ] When valid, button is blue + cursor: pointer

**Testing:**
- [ ] Edit a field → see blue border
- [ ] Leave field empty → see red border + error message
- [ ] Fill field correctly → see green border + checkmark
- [ ] Click "Save changes" → see "Saving..." spinner
- [ ] Wait → see "Saved" checkmark
- [ ] Intentionally fail API → see error + "Retry" button
- [ ] Click "Retry" → API succeeds, shows "Saved"
- [ ] Leave required field empty → "Execute Approval" button disabled
- [ ] Fill all required fields → "Execute Approval" button enabled
- [ ] Click "Execute Approval" → confirmation dialog appears
- [ ] Click "Cancel" → stay on context page
- [ ] Click "Approve" → context locked, redirect to workspace
- [ ] Edit field, try to navigate away → unsaved changes dialog appears

### SPECIFIC IMPLEMENTATION GUIDANCE

**Create SaveIndicator component:**
```tsx
// src/components/ui/SaveIndicator.tsx
export function SaveIndicator({ state, onRetry }) {
  if (state === 'saving') {
    return <span className="flex items-center gap-2 text-amber-600"><Spinner /> Saving...</span>;
  }
  if (state === 'saved') {
    return <span className="flex items-center gap-2 text-green-600"><CheckCircle /> Saved</span>;
  }
  if (state === 'error') {
    return (
      <span className="flex items-center gap-2 text-red-600">
        <AlertCircle /> Save failed
        {onRetry && <button onClick={onRetry} className="underline text-xs ml-2">Retry</button>}
      </span>
    );
  }
  return null;
}
```

**Add validation rules:**
```tsx
// src/lib/validation/projectBrief.ts
export const FIELD_RULES = {
  'audience.primary': { minChars: 3, required: true, message: "Primary Segment (3+ chars)" },
  'brand.voiceGuidelines': { minChars: 10, required: true, message: "Voice Guidelines (10+ chars)" },
  'success.definitionOfDone': { minItems: 1, required: true, message: "At least 1 criterion" },
  'guardrails.mustAvoid': { minItems: 1, required: true, message: "At least 1 guardrail" }
};

export function validateField(name, value) {
  const rules = FIELD_RULES[name];
  if (!rules) return null;
  if (rules.required && !value) return rules.message;
  if (rules.minChars && value.length < rules.minChars) return rules.message;
  if (rules.minItems && !Array.isArray(value) || value.length < rules.minItems) return rules.message;
  return null;
}
```

**Inline validation on input:**
```tsx
const [fieldErrors, setFieldErrors] = useState({});

<input
  value={tempData.primary}
  onChange={(e) => {
    setTempData({ ...tempData, primary: e.target.value });
    const error = validateField('audience.primary', e.target.value);
    setFieldErrors({ ...fieldErrors, 'audience.primary': error });
  }}
  className={cn(
    "border-b pb-1 outline-none transition-colors",
    !fieldErrors['audience.primary'] ? "border-blue-500" : "border-red-500"
  )}
  aria-describedby={fieldErrors['audience.primary'] ? "error-primary" : undefined}
/>
{fieldErrors['audience.primary'] && (
  <p id="error-primary" className="text-xs text-red-600 mt-1">{fieldErrors['audience.primary']}</p>
)}
```

**Confirmation dialog:**
```tsx
const [confirmApproval, setConfirmApproval] = useState(false);

{confirmApproval && (
  <Dialog>
    <h2>Approve Project Context?</h2>
    <p>This will lock your context as the source of truth...</p>
    <p className="text-sm text-gray-600">This action cannot be undone.</p>
    <button onClick={() => { /* approve logic */ }} className="bg-blue-600 text-white px-4 py-2">
      Approve
    </button>
    <button onClick={() => setConfirmApproval(false)} className="bg-gray-200 px-4 py-2">
      Cancel
    </button>
  </Dialog>
)}
```

### VERIFICATION RECEIPT FORMAT

```
## MODULE 2.1: Save/Discard Confirmations & Feedback ✅ COMPLETE

**Evidence:**
- Toast "Changes saved" shown on successful save ✓
- SaveIndicator shows Saving → Saved → Idle states ✓
- Error on save: red toast + "Retry" button ✓
- Inline validation: green for valid, red for invalid ✓
- Confirmation dialog before Approve ✓
- "Execute Approval" button disabled until form valid ✓
- Unsaved changes dialog on navigate away ✓

**Test Summary:**
- Saved state: 10/10 correct ✓
- Error state: 5/5 retries successful ✓
- Inline validation: 5/5 fields correctly validated ✓
- Approval dialog: 5/5 correctly shown/hidden ✓

**Git Commit:**
```
feat: add save confirmation feedback and inline validation

UX improvements:
- Toast on successful save
- SaveIndicator with Saving/Saved/Error states
- Inline field validation (real-time red/green)
- Confirmation dialog before irreversible approval
- Disabled Approve button until form complete
- Unsaved changes warning on navigate away

Fixes #[issue]
```
```

---

## CONTINUE WITH...

Agents should continue with:
- **AGENT PROMPT 2.2:** Network Failure Retry & Recovery
- **AGENT PROMPT 2.3:** Task Timeout & Cancel Mechanism
- **AGENT PROMPT 2.4:** Concurrent Edit Conflict Detection
- **AGENT PROMPT 3.1:** Asset Manager UI (if shipping assets)
- **AGENT PROMPT 4.X:** Best-in-class features (post-launch)

Each follows same format: detailed task, clear criteria, specific code guidance, verification receipt.

---

## HOW TO USE THIS PROMPT SET

1. **Assign one prompt per engineer** (or pair for complex ones)
2. **Block on receipt:** Engineer must provide receipt format before moving to next module
3. **Run sequentially:** Phase 1 → Phase 2 → Phase 3 → Phase 4
4. **Parallel where possible:** Within a phase, some modules can run in parallel (note dependencies)
5. **Escalate blockers:** If an engineer can't provide receipt, QA must investigate why
6. **Track progress:** Use receipt as proof for launch readiness checklist
7. **Merge + deploy:** After all receipts signed off, code is ready for launch

---

## PARALLELIZATION STRATEGY

**Week 1 (Phase 1 - Critical Fixes):**
- **Mon-Wed:** Engineer A on 1.1 (Task Execution) + Engineer B on 1.4 (Feature Gating) in parallel
- **Wed:** Engineer C on 1.2 (Error Handling) + Engineer D on 1.3 (Project Lifecycle) in parallel
- **Thu:** Engineer E on 1.5 (FRE) (depends on 1.1-1.4 mostly working)
- **Fri:** Integration testing, receipt validation, blockers resolved

**Week 2 (Phase 2 - Essential UX):**
- **Mon-Tue:** 2.1 (Save Feedback) + 2.2 (Network Retry) in parallel
- **Tue-Wed:** 2.3 (Task Timeout) + 2.4 (Conflict Detection) in parallel
- **Thu:** Integration, testing, final polish
- **Fri:** Launch readiness review

**Week 3:**
- **Mon-Wed:** Phase 3 (Asset Manager) if shipping v1; otherwise skip
- **Thu-Fri:** QA burndown, final testing

**Week 4:** Launch

---

**This prompt set is your deployment contract. Each receipt is a binding commitment that the module meets production standards.**

