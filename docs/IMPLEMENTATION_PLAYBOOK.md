# CODRA IMPLEMENTATION PLAYBOOK
## Detailed Self-Contained Agent Prompts with Verification Receipts

**Purpose:** Close gaps identified in E2E UX audit and evolve Codra into best-in-class creative software
**Audience:** Engineering agents + QA verification
**Structure:** 4 phases × sequential modules; each module is self-contained with clear acceptance criteria

---

## PHASE 1: CRITICAL FIXES (SHIP BLOCKERS)
*Must complete all Phase 1 modules before any launch. Estimated: 15-18 days*

---

### **MODULE 1.1: Enable Task Execution Engine**

**Objective:** Un-comment, integrate, and test the complete task execution pipeline. Users must be able to click "Run" on tasks and see AI-generated output.

**Acceptance Criteria (Receipts):**
- [ ] `handleRunTask()` function is fully uncommented and callable in ExecutionDeskPage
- [ ] Task execution button visible in UI (Proof panel or center surface)
- [ ] When user clicks "Run Task":
  - Task status transitions: `pending` → `in-progress` → `complete`/`failed`
  - AI prompt sent to Claude (verified in network tab or logs)
  - Output rendered in center surface (spread section) within 15 seconds
  - User sees real-time status updates ("Generating...", progress %, "Complete")
- [ ] On task failure:
  - Error message shown in user-friendly language
  - "Retry" button visible
  - Task reverts to "pending" state
- [ ] On task success:
  - Output is persisted to DB (Supabase)
  - Spread section shows generated content
  - UI shows "Saved" confirmation
- [ ] Task execution respects budget limits:
  - User is warned if task exceeds budget
  - User can proceed or cancel
  - Cost is deducted from account
- [ ] Code quality:
  - No console errors
  - All commented code removed (clean git diff)
  - TypeScript strict mode passes
  - Proper error boundaries in place

**Implementation Guidance:**

1. **Find and uncomment task execution code:**
   ```
   src/new/routes/ExecutionDeskPage.tsx (lines ~201-327)
   ```
   - Remove all `/*` and `*/` comment markers
   - Ensure function signature and dependencies are intact

2. **Wire task button to UI:**
   - Locate task list rendering (likely in TaskQueue component)
   - Add click handler: `onClick={() => handleRunTask(taskId, mode)}`
   - Style button with status color (gray=pending, amber=running, green=complete, red=failed)

3. **Add loading/progress states:**
   - Show spinner while `status === 'in-progress'`
   - Optionally show ETA (estimate from task type + model)
   - Show cancel button (calls `handleCancelTask`)

4. **Test with real Claude API:**
   - Use `src/lib/ai/client.ts` (assumes Claude model routing exists)
   - Send test task through pipeline
   - Verify output appears in spread

5. **Error handling:**
   - Wrap `handleRunTask` in try-catch
   - Catch API errors (rate limit, invalid prompt, timeout)
   - Show user-friendly error: "AI response failed. Try again?"

**Files to Modify:**
- `src/new/routes/ExecutionDeskPage.tsx` (uncomment + wire UI)
- `src/components/TaskQueue.tsx` (add button if not present)
- `src/lib/ai/prompt-builder.ts` (verify prompts are formatted correctly)

**Files to Create/Add:**
- `src/hooks/useTaskExecution.ts` (extract execution logic into custom hook if needed)
- Tests: `src/__tests__/task-execution.test.ts`

**Verification Checklist:**
- [ ] Create new test project
- [ ] Navigate to workspace
- [ ] See task queue with "Run" buttons
- [ ] Click "Run" on a task
- [ ] Watch status change in real-time
- [ ] See output in center surface within 15s
- [ ] Refresh page; output persists
- [ ] Intentionally break API key; see error message + retry option
- [ ] Run multiple tasks in sequence; all complete successfully

**Success Metrics:**
- Task execution success rate: 95%+
- Average time to first output: <15s
- User can complete a full workflow (create project → fill context → run task → see result)

---

### **MODULE 1.2: Spread Generation Error Handling & Recovery**

**Objective:** Add bulletproof error handling to spread generation so users never see a blank workspace. If spread fails, user sees clear error + recovery path.

**Acceptance Criteria (Receipts):**
- [ ] Spread generation wrapped in try-catch block
- [ ] If generation fails:
  - Error is logged to analytics
  - User sees error banner in workspace with human-readable message
  - "Retry" button is visible
  - "View details" link shows technical error (for debugging)
- [ ] Fallback behavior:
  - If spread missing, create minimal default spread (empty sections ready for content)
  - User can start working even if AI generation partially failed
- [ ] Spread validation:
  - Before rendering spread sections, validate structure (required fields present)
  - If invalid, show warning but allow user to continue
- [ ] Network error handling:
  - If DB fetch fails during spread load, show "Connection failed. Retry?"
  - Retry uses exponential backoff (1s, 2s, 4s, 8s)
- [ ] Code quality:
  - Error boundary wraps ExecutionDesk
  - All errors use `useToast()` for user feedback
  - Console.error logs include helpful context (projectId, step, function)

**Implementation Guidance:**

1. **Find spread generation code:**
   ```
   src/new/routes/ExecutionDeskPage.tsx (useEffect block that calls generateSpreadFromProfile)
   ```

2. **Wrap in try-catch:**
   ```tsx
   useEffect(() => {
     (async () => {
       try {
         const newSpread = generateSpreadFromProfile(...);
         setSpread(newSpread);
         await persistSpread(newSpread);
       } catch (error) {
         console.error("Spread generation failed:", error);
         analytics.track("spread_generation_error", {
           projectId,
           errorMessage: error.message
         });
         setSpreadError(error.message);
         toast.error("Failed to generate project brief. " + error.message);
       }
     })();
   }, [projectId]);
   ```

3. **Add error state to component:**
   ```tsx
   const [spreadError, setSpreadError] = useState<string | null>(null);
   ```

4. **Render error UI:**
   ```tsx
   {spreadError && (
     <div className="bg-red-50 border border-red-200 p-4 rounded">
       <p className="text-red-900 font-semibold">Project brief generation failed</p>
       <p className="text-red-800 text-sm mt-1">{spreadError}</p>
       <div className="flex gap-2 mt-4">
         <button onClick={() => { setSpreadError(null); /* retry */ }}>
           Try Again
         </button>
         <button onClick={() => { /* show tech details */ }}>
           View Details
         </button>
       </div>
     </div>
   )}
   ```

5. **Create Error Boundary component:**
   ```tsx
   // src/components/ErrorBoundary.tsx
   export class ExecutionDeskErrorBoundary extends React.Component {
     componentDidCatch(error, errorInfo) {
       console.error("ExecutionDesk crashed:", error, errorInfo);
       analytics.track("execution_desk_error", { error: error.message });
       this.setState({ hasError: true });
     }
     render() {
       if (this.state?.hasError) {
         return (
           <div className="...error styling...">
             <h2>Workspace encountered an error</h2>
             <p>Please refresh the page.</p>
           </div>
         );
       }
       return this.props.children;
     }
   }
   ```

6. **Wrap ExecutionDesk in error boundary:**
   ```tsx
   <ExecutionDeskErrorBoundary>
     <ExecutionDeskPage />
   </ExecutionDeskErrorBoundary>
   ```

**Files to Modify:**
- `src/new/routes/ExecutionDeskPage.tsx` (add try-catch, error state, error UI)
- `src/domain/spread.ts` (add validation function)

**Files to Create:**
- `src/components/ErrorBoundary.tsx` (reusable React error boundary)
- `src/hooks/useSpreadGeneration.ts` (extract spread generation logic)
- Tests: `src/__tests__/spread-error-handling.test.ts`

**Verification Checklist:**
- [ ] Create new project
- [ ] Intentionally break spread generation (edit generateSpreadFromProfile to throw error)
- [ ] See error banner in workspace
- [ ] Click "Try Again"
- [ ] Verify error is logged to analytics
- [ ] Fix spread generation code
- [ ] Retry button works; spread loads successfully
- [ ] Refresh page multiple times; no console errors
- [ ] Simulate DB connection failure (disconnect network)
- [ ] See "Connection failed" message + retry button
- [ ] Reconnect network; retry works

**Success Metrics:**
- 0 blank workspace errors in QA testing
- 100% of spread generation failures have user-facing error message
- 95%+ of spread generation retries succeed

---

### **MODULE 1.3: Project Creation Lifecycle & De-duplication**

**Objective:** Define clear project creation timeline (which step creates the project? when?). Prevent duplicate projects if user restarts onboarding. Ensure users can resume mid-flow.

**Acceptance Criteria (Receipts):**
- [ ] Project is created at **end of Onboarding Step 1** (after name/type/summary submitted)
  - Project gets unique ID immediately
  - User shown confirmation: "Project created: [name]"
  - ProjectID stored in localStorage and Zustand store
- [ ] If user restarts onboarding before Step 1 completes:
  - "Create" button says "Create Project" (gray, new)
- [ ] If user restarts onboarding **after** Step 1 completes:
  - Detect existing project in localStorage
  - Ask: "Resume existing project '[name]'?" with options:
    - "Resume" → go to Step 2 with existing projectId
    - "Create New" → clear localStorage, start fresh (new project)
  - Prevents accidental duplicates
- [ ] Project stored in DB immediately after Step 1:
  - `projects` table has new row with `id`, `name`, `type`, `summary`
  - Basic fields only (context added in Step 2-3)
  - Default values set (empty deliverables, no context yet)
- [ ] On redirect from Step 1 → Step 2:
  - URL reflects projectId: `/new?step=context&projectId=abc123`
  - projectId is validated (exists in DB)
- [ ] Abandoned project recovery:
  - User can visit `/new` at any time
  - Onboarding detects incomplete project in localStorage
  - Offers to resume previous flow
- [ ] Data integrity:
  - No duplicate projects in DB
  - Project creation is idempotent (clicking "Create" twice = same result)
  - All project fields are validated before DB insert

**Implementation Guidance:**

1. **Define onboarding flow state (Zustand store):**
   ```tsx
   // src/lib/stores/onboarding-flow.ts
   interface OnboardingFlow {
     step: "info" | "context" | "generating" | "complete";
     projectId: string | null;
     projectName: string;
     isResuming: boolean;
     // ...
   }
   ```

2. **Create project on Step 1 completion:**
   ```tsx
   // src/new/routes/onboarding/steps/StepProjectInfo.tsx
   const handleCreateProject = async (formData: {name, type, summary}) => {
     try {
       // 1. Call API to create project
       const response = await fetch("/api/projects/create", {
         method: "POST",
         body: JSON.stringify(formData),
         headers: { "Content-Type": "application/json" }
       });
       const { projectId } = await response.json();

       // 2. Store in localStorage + Zustand
       localStorage.setItem("codra:onboardingProject", JSON.stringify({
         projectId,
         name: formData.name,
         createdAt: Date.now(),
         step: "context"
       }));
       useOnboardingStore.setState({ projectId, step: "context" });

       // 3. Show confirmation
       toast.success(`Project "${formData.name}" created. Let's add context.`);

       // 4. Navigate to Step 2
       navigate(`/new?step=context&projectId=${projectId}`);
     } catch (error) {
       toast.error("Failed to create project. Please try again.");
     }
   };
   ```

3. **Detect & handle resume on onboarding mount:**
   ```tsx
   // src/new/routes/onboarding/OnboardingFlow.tsx
   useEffect(() => {
     const saved = localStorage.getItem("codra:onboardingProject");
     if (saved) {
       const { projectId, name, step } = JSON.parse(saved);

       // Ask user: resume or create new?
       setResumePrompt({
         show: true,
         projectName: name,
         onResume: () => {
           useOnboardingStore.setState({ projectId, step });
           setResumePrompt({ show: false });
         },
         onCreate: () => {
           localStorage.removeItem("codra:onboardingProject");
           useOnboardingStore.setState({ projectId: null, step: "info" });
           setResumePrompt({ show: false });
         }
       });
     }
   }, []);
   ```

4. **Render resume prompt:**
   ```tsx
   {resumePrompt.show && (
     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
       <div className="bg-white p-8 rounded-lg max-w-md">
         <h2 className="text-lg font-semibold mb-2">Resume Project?</h2>
         <p className="text-sm text-gray-600 mb-6">
           We found an incomplete project: <strong>{resumePrompt.projectName}</strong>
         </p>
         <div className="flex gap-3">
           <button onClick={resumePrompt.onResume} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded">
             Resume
           </button>
           <button onClick={resumePrompt.onCreate} className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded">
             Create New
           </button>
         </div>
       </div>
     </div>
   )}
   ```

5. **Validate projectId on URL navigation:**
   ```tsx
   // src/new/routes/onboarding/OnboardingFlow.tsx
   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     const projectId = params.get("projectId");

     if (projectId) {
       // Verify project exists in DB
       verifyProjectExists(projectId)
         .then(exists => {
           if (!exists) {
             toast.error("Project not found. Starting fresh.");
             navigate("/new");
           }
         });
     }
   }, []);
   ```

**Files to Modify:**
- `src/new/routes/onboarding/OnboardingFlow.tsx` (add resume logic)
- `src/new/routes/onboarding/steps/StepProjectInfo.tsx` (create project on completion)
- `src/lib/stores/onboarding-flow.ts` (define flow state)

**Files to Create:**
- `src/lib/api/projects.ts` (client-side API functions)
- Tests: `src/__tests__/project-creation.test.ts`

**Backend API to add:**
- `POST /api/projects/create` → creates row in `projects` table, returns `projectId`
- `GET /api/projects/:projectId/exists` → verifies project exists

**Verification Checklist:**
- [ ] Create new project → see "Project created: [name]" toast
- [ ] Open DevTools; see projectId in localStorage
- [ ] Refresh page during Step 1 → see resume prompt
- [ ] Click "Resume" → go to Step 2 with same projectId
- [ ] Click "Create New" → start fresh with new projectId
- [ ] Complete onboarding → project appears in Projects page
- [ ] Go to Projects page; count projects before and after
- [ ] Verify no duplicates created
- [ ] Edit URL to invalid projectId → see error, redirect to /new
- [ ] Restart browser; manually edit onboarding flow step in localStorage to invalid value → error handling works

**Success Metrics:**
- 0 duplicate projects created during testing
- 100% of onboarding completions result in exactly 1 project in DB
- Resume flow works on 100% of page refresh scenarios

---

### **MODULE 1.4: Feature Gating by Tier (Free/Pro/Team)**

**Objective:** Enforce plan limits across the app. Users cannot access Pro/Team features without subscription. Upsell prompts are shown respectfully.

**Acceptance Criteria (Receipts):**
- [ ] User tier is determined at login:
  - Free, Pro, Team, or Admin
  - Stored in Zustand + localStorage
  - Fetched from DB on session init
- [ ] Feature gates enforced:
  - **Projects:**
    - Free: max 1 project
    - Pro: max 10 projects
    - Team: unlimited
  - **Context fields:** All available to Pro/Team; Free has basic only
  - **Coherence Scan:** Free=0/month, Pro=5/month, Team=unlimited
  - **Task Execution:** Free=disabled, Pro/Team=enabled
  - **Collaboration:** Free/Pro=disabled, Team=enabled
- [ ] When user hits limit:
  - Action button is disabled (grayed out)
  - Tooltip/message explains limit: "Free users can create 1 project. Upgrade to Pro for 10."
  - Click tries to show upgrade modal
- [ ] Upgrade modal shows:
  - Feature being blocked
  - Plan comparison table (Free/Pro/Team)
  - CTA: "Upgrade to Pro" (with price)
  - Close button: "Not now"
- [ ] Free users see upgrade prompts at key moments:
  - When creating 2nd project
  - When trying to run a task
  - When trying to access coherence scan
  - When trying to collaborate
- [ ] Prompts are non-aggressive:
  - Only shown once per session
  - Dismissable without friction
  - No dark patterns (like auto-billing)
- [ ] Tier is correctly passed to all components:
  - `useUserTier()` hook returns current tier
  - All gated features check `useUserTier()`
  - No hardcoded "premium" checks

**Implementation Guidance:**

1. **Create user tier store:**
   ```tsx
   // src/lib/stores/user-tier.ts
   export const useUserStore = create((set) => ({
     tier: "free" as "free" | "pro" | "team" | "admin",
     projectCount: 0,
     coherenceScanUsage: 0, // count used this month
     isLoading: true,

     loadUserTier: async () => {
       const response = await fetch("/api/user/tier");
       const { tier, projectCount, coherenceScanUsage } = await response.json();
       set({ tier, projectCount, coherenceScanUsage, isLoading: false });
     }
   }));
   ```

2. **Add hook to check if feature is allowed:**
   ```tsx
   // src/lib/hooks/useFeatureGate.ts
   export function useFeatureGate(feature: "projects" | "coherence_scan" | "collaboration" | "task_execution") {
     const { tier, projectCount, coherenceScanUsage } = useUserStore();

     const limits = {
       projects: { free: 1, pro: 10, team: Infinity },
       coherence_scan: { free: 0, pro: 5, team: Infinity },
       collaboration: { free: false, pro: false, team: true },
       task_execution: { free: false, pro: true, team: true }
     };

     const limit = limits[feature][tier];

     return {
       allowed: feature === "projects" ? projectCount < limit : feature === "coherence_scan" ? coherenceScanUsage < limit : limit !== false,
       remaining: feature === "projects" ? limit - projectCount : feature === "coherence_scan" ? limit - coherenceScanUsage : 0,
       tier,
       showUpgrade: () => { /* show modal */ }
     };
   }
   ```

3. **Gate create project:**
   ```tsx
   // src/new/routes/ProjectsPage.tsx
   const { allowed, remaining, showUpgrade } = useFeatureGate("projects");

   <button
     onClick={() => allowed ? setShowCreateMenu(true) : showUpgrade()}
     disabled={!allowed}
     title={!allowed ? `Free users can create 1 project. Upgrade to Pro for 10.` : ""}
   >
     {allowed ? "Create" : `Create (${remaining} remaining)`}
   </button>
   ```

4. **Gate task execution:**
   ```tsx
   // src/new/routes/ExecutionDeskPage.tsx
   const { allowed: tasksAllowed, showUpgrade: showTasksUpgrade } = useFeatureGate("task_execution");

   {tasksAllowed ? (
     <button onClick={() => handleRunTask(taskId)}>Run</button>
   ) : (
     <button onClick={showTasksUpgrade} className="opacity-50">
       Run (Pro feature)
     </button>
   )}
   ```

5. **Create upgrade modal:**
   ```tsx
   // src/components/UpgradeModal.tsx
   export function UpgradeModal({ feature, isOpen, onClose }) {
     const plans = [
       { name: "Free", price: "$0", features: ["1 project", "Basic context", "No task execution"] },
       { name: "Pro", price: "$29/mo", features: ["10 projects", "Full context", "Task execution", "5 coherence scans/mo"], highlighted: true },
       { name: "Team", price: "$99/mo", features: ["Unlimited projects", "Real-time collaboration", "Task execution", "Unlimited scans"] }
     ];

     return (
       <Modal isOpen={isOpen} onClose={onClose}>
         <h2>Upgrade to unlock {feature}</h2>
         <div className="grid grid-cols-3 gap-4">
           {plans.map(plan => (
             <div key={plan.name} className={plan.highlighted ? "border-2 border-blue-600" : "border"}>
               <h3 className="font-bold">{plan.name}</h3>
               <p className="text-2xl font-bold">{plan.price}</p>
               <ul className="space-y-2">
                 {plan.features.map(f => <li key={f}>✓ {f}</li>)}
               </ul>
               <button className="w-full bg-blue-600 text-white py-2 rounded">
                 {plan.name === "Free" ? "Current Plan" : "Upgrade"}
               </button>
             </div>
           ))}
         </div>
       </Modal>
     );
   }
   ```

6. **Load tier on app init:**
   ```tsx
   // src/App.tsx
   useEffect(() => {
     useUserStore.getState().loadUserTier();
   }, []);
   ```

**Files to Modify:**
- `src/new/routes/ProjectsPage.tsx` (gate create project)
- `src/new/routes/ExecutionDeskPage.tsx` (gate task execution)
- `src/new/routes/CoherenceScanPage.tsx` (gate coherence scan)
- `src/App.tsx` (init user tier on load)

**Files to Create:**
- `src/lib/stores/user-tier.ts`
- `src/lib/hooks/useFeatureGate.ts`
- `src/components/UpgradeModal.tsx`
- Tests: `src/__tests__/feature-gating.test.ts`

**Backend APIs to add:**
- `GET /api/user/tier` → returns `{ tier, projectCount, coherenceScanUsage }`
- `POST /api/projects/create` → checks `projectCount` against tier limit; error if over

**Verification Checklist:**
- [ ] Log in as free user
- [ ] See tier = "free" in DevTools
- [ ] Create 1 project → success
- [ ] Try to create 2nd project → button disabled + tooltip
- [ ] Click disabled button → upgrade modal shows
- [ ] Compare plans in modal (Pro highlighted)
- [ ] Close modal without upgrading
- [ ] Try to run task → button disabled + "Pro feature" label
- [ ] Log in as Pro user
- [ ] See tier = "pro" in DevTools
- [ ] Create projects up to 10 → success
- [ ] 11th project → disabled
- [ ] Run tasks → enabled
- [ ] Log in as admin user
- [ ] See tier = "admin" in DevTools
- [ ] Create unlimited projects
- [ ] All features enabled

**Success Metrics:**
- 100% of free users blocked from 2nd project
- 100% of free users blocked from task execution
- 0 free users accessing paid features
- Upgrade modal shown on 100% of feature gate violations
- Revenue attribution working (track which feature drove upgrade)

---

### **MODULE 1.5: First-Run Experience (FRE) Onboarding**

**Objective:** Guide new users through their first workflow so they understand what Codra does and experience a quick win within 2 minutes.

**Acceptance Criteria (Receipts):**
- [ ] FRE is shown on first login (detected via `user.onboardingCompleted === false`)
- [ ] FRE sequence:
  1. Tooltip: "Welcome to Codra. Let's create your first creative project."
  2. Highlight "Create" button
  3. User clicks "Create" → tooltip: "Choose 'New project' to start from scratch."
  4. Onboarding form appears → tooltip walks through each field
  5. User fills form, submits → tooltip: "Your project has been created!"
  6. Workspace loads → tooltip: "This is Lyra, your AI assistant. This is where your project comes to life."
  7. Highlight task queue → tooltip: "These are your project tasks. Click one to run it."
  8. User clicks "Run" → tooltip: "Watch as Lyra generates your first output..."
  9. Output appears → tooltip: "Congratulations! You just created something. Here's your next step: [...]"
  10. Mark `user.onboardingCompleted = true`
- [ ] Tooltips are skippable:
  - "Next >" button to advance
  - "Skip" button to skip entire FRE
  - Tooltips don't block interaction (can click through)
- [ ] FRE uses sample/template project:
  - Not a blank project; has pre-populated context (brand, audience, etc.)
  - Tasks are curated (e.g., "Write a hero headline", not 20 random tasks)
  - User can complete full workflow in <5 minutes
- [ ] After FRE completes:
  - User is in workspace with completed task
  - CTA: "Create another project" or "Explore coherence scan"
  - FRE modal closes gracefully
- [ ] FRE can be re-triggered:
  - Button in Settings: "Replay tutorial"
  - Useful for returning users who forgot
- [ ] FRE is mobile-aware:
  - Tooltips reposition on small screens
  - Mobile doesn't show FRE (too cramped); docs link instead
- [ ] Analytics:
  - Track FRE start, each step, skips, completion
  - Cohort: "Users who completed FRE" vs "Users who skipped" → retention diff

**Implementation Guidance:**

1. **Create FRE flow component using Shepherd.js:**
   ```tsx
   // src/components/FirstRunExperience.tsx
   import Shepherd from 'shepherd.js';

   export function FirstRunExperience({ onComplete }) {
     const tour = new Shepherd.Tour({
       useModalOverlay: true,
       defaultStepOptions: {
         classes: "shepherd-theme-dark",
         scrollTo: true,
         cancelIcon: { enabled: true }
       }
     });

     tour.addStep({
       id: "welcome",
       title: "Welcome to Codra",
       text: "Let's create your first creative project. Click the 'Create' button.",
       attachTo: { element: "[data-tour='create-button']", on: "bottom" },
       buttons: [
         { text: "Skip Tutorial", action: tour.cancel },
         { text: "Next >", action: tour.next }
       ]
     });

     tour.addStep({
       id: "new-project",
       title: "Create a Project",
       text: "Choose 'New project' to start from scratch.",
       attachTo: { element: "[data-tour='create-menu']", on: "left" }
     });

     // ... more steps ...

     tour.on("complete", () => {
       markUserOnboardingComplete();
       analytics.track("fre_completed");
       onComplete();
     });

     tour.on("cancel", () => {
       analytics.track("fre_skipped");
       onComplete();
     });

     tour.start();

     return <div className="shepherd-container" />;
   }
   ```

2. **Detect first-time user:**
   ```tsx
   // src/lib/auth/user.ts
   export async function isFirstTimeUser(): Promise<boolean> {
     const user = await supabase.auth.getUser();
     const profile = await supabase
       .from("user_profiles")
       .select("onboarding_completed")
       .eq("id", user.data.user?.id)
       .single();
     return !profile.data?.onboarding_completed;
   }
   ```

3. **Show FRE on app load:**
   ```tsx
   // src/App.tsx
   function App() {
     const [showFRE, setShowFRE] = useState(false);

     useEffect(() => {
       isFirstTimeUser().then(isFirst => {
         if (isFirst) {
           setShowFRE(true);
           analytics.track("fre_shown");
         }
       });
     }, []);

     return (
       <>
         {showFRE && (
           <FirstRunExperience onComplete={() => setShowFRE(false)} />
         )}
         <Router>
           {/* app routes */}
         </Router>
       </>
     );
   }
   ```

4. **Create sample project template:**
   ```tsx
   // src/domain/templates/sample-project.ts
   export const SAMPLE_PROJECT = {
     name: "My First Creative Project",
     type: "website",
     summary: "A beautiful, modern website to showcase my work.",
     audience: "Creative professionals looking for inspiration",
     brandConstraints: { voiceGuidelines: "Professional, inspiring, forward-thinking" },
     successCriteria: { definitionOfDone: ["Homepage designed", "Portfolio section complete", "Contact form works"] },
     guardrails: { mustAvoid: ["Generic stock photos", "Slow load times"] },
     tasks: [
       { id: "1", title: "Write Hero Headline", description: "Create a compelling headline for the homepage" },
       { id: "2", title: "Design Color Palette", description: "Choose 3-4 colors that reflect your brand" },
       { id: "3", title: "Write About Me Section", description: "Tell visitors who you are" }
     ]
   };
   ```

5. **Add tour attribute to key UI elements:**
   ```tsx
   // In ProjectsPage:
   <button data-tour="create-button" onClick={() => setShowCreateMenu(true)}>
     Create
   </button>

   // In ExecutionDeskPage:
   <div data-tour="task-queue">
     {/* task list */}
   </div>
   ```

6. **Mark onboarding complete:**
   ```tsx
   async function markUserOnboardingComplete() {
     const user = await supabase.auth.getUser();
     await supabase
       .from("user_profiles")
       .update({ onboarding_completed: true })
       .eq("id", user.data.user?.id);
   }
   ```

**Files to Modify:**
- `src/App.tsx` (detect first-time user, show FRE)
- `src/new/routes/ProjectsPage.tsx` (add data-tour attributes)
- `src/new/routes/ExecutionDeskPage.tsx` (add data-tour attributes)

**Files to Create:**
- `src/components/FirstRunExperience.tsx`
- `src/domain/templates/sample-project.ts`
- `src/lib/auth/user.ts` (first-time user detection)
- Tests: `src/__tests__/fre.test.ts`

**NPM Dependencies:**
- `npm install shepherd.js` (tour library)

**Verification Checklist:**
- [ ] Create new account
- [ ] See FRE modal on first login
- [ ] Each step shows correct tooltip + highlight
- [ ] Click "Next >" button → advance to next step
- [ ] Click "Skip" → FRE closes, modal dismissed
- [ ] Complete full FRE from start to finish
- [ ] See "Congratulations" screen
- [ ] Check user_profiles table: `onboarding_completed = true`
- [ ] Log out + log in again
- [ ] FRE does NOT show (already completed)
- [ ] Go to Settings → click "Replay Tutorial"
- [ ] FRE shows again
- [ ] Open DevTools → check analytics events (fre_shown, fre_completed)
- [ ] Test on mobile (should skip or show docs link instead)

**Success Metrics:**
- 80%+ of new users complete FRE
- 95%+ of FRE starters reach workspace (completion rate)
- Users who complete FRE have 3x higher 7-day retention
- Average time to first task execution: <3 min

---

## PHASE 2: ESSENTIAL UX (LAUNCH WITH CONFIDENCE)
*Complete Phase 2 before launch. Estimated: 12-15 days*

---

### **MODULE 2.1: Save/Discard Confirmations & Feedback**

**Objective:** Users always know when their changes are saved. No "Did I lose my work?" anxiety.

**Acceptance Criteria (Receipts):**
- [ ] On successful section save (ProjectContextPage):
  - Toast appears: "Changes saved"
  - Green checkmark icon next to section title
  - SaveIndicator state shows "saved" (green) for 2 seconds, then fades
- [ ] On save failure:
  - Error toast: "Failed to save. [Retry]"
  - Red border around field that failed
  - User can click "Retry" to save again
- [ ] On unsaved changes:
  - If user tries to navigate away, confirmation dialog:
    "You have unsaved changes. Leave without saving?"
  - Options: "Save & Leave", "Leave Without Saving", "Keep Editing"
- [ ] Before irreversible actions:
  - Approval dialog on "Execute approval" button:
    "Approve this context? This will lock it and generate your project brief."
    "This action cannot be undone."
  - Options: "Approve", "Cancel"
- [ ] Inline validation feedback:
  - As user types in required fields, visual feedback:
    - Empty: gray border
    - Typing: blue border
    - Invalid (too short): red border + error message below
    - Valid: green border + checkmark
  - Example: "Primary Segment" field min 3 chars
- [ ] Form-level validation:
  - Before "Execute Approval", validate all required fields
  - If invalid, show inline errors on each field (not just toast)
  - "Execute Approval" button disabled until form is valid
- [ ] Save state indicator:
  - Small UI element in header shows current state:
    - "Saving..." (spinner)
    - "Saved" (green checkmark, fade after 2s)
    - "Error" (red X, stays until retry)
- [ ] Accessibility:
  - All validation messages linked to form fields (aria-describedby)
  - Keyboard navigation: Tab through required fields, see validation

**Implementation Guidance:**

1. **Create SaveIndicator component:**
   ```tsx
   // src/components/ui/SaveIndicator.tsx
   export function SaveIndicator({
     state: 'idle' | 'saving' | 'saved' | 'error',
     onRetry?: () => void
   }) {
     return (
       <div className="flex items-center gap-2">
         {state === 'saving' && <Spinner className="text-amber-500" />}
         {state === 'saving' && <span className="text-sm text-amber-600">Saving...</span>}

         {state === 'saved' && <CheckCircle className="text-green-500" />}
         {state === 'saved' && <span className="text-sm text-green-600">Saved</span>}

         {state === 'error' && <AlertCircle className="text-red-500" />}
         {state === 'error' && (
           <div>
             <span className="text-sm text-red-600">Save failed</span>
             {onRetry && (
               <button onClick={onRetry} className="text-xs text-red-600 underline ml-2">
                 Retry
               </button>
             )}
           </div>
         )}
       </div>
     );
   }
   ```

2. **Add validation to context form fields:**
   ```tsx
   // src/lib/validation/projectBrief.ts
   export const FIELD_VALIDATION = {
     audience: {
       primary: { min: 3, max: 100, required: true, message: "Primary segment required (3-100 chars)" }
     },
     brand: {
       voiceGuidelines: { min: 10, required: true, message: "Voice guidelines required (10+ chars)" }
     },
     success: {
       definitionOfDone: { minItems: 1, required: true, message: "At least 1 success criterion required" }
     },
     guardrails: {
       mustAvoid: { minItems: 1, required: true, message: "At least 1 guardrail required" }
     }
   };

   export function validateField(fieldName: string, value: any): string | null {
     const rules = FIELD_VALIDATION[fieldName];
     if (!rules) return null;

     if (rules.required && !value) return rules.message;
     if (rules.min && value.length < rules.min) return rules.message;
     if (rules.minItems && value.length < rules.minItems) return rules.message;

     return null;
   }
   ```

3. **Add inline validation to form input:**
   ```tsx
   // In ContextSection renderEdit():
   const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

   <div>
     <input
       type="text"
       value={tempData.primary}
       onChange={(e) => {
         setTempData({ ...tempData, primary: e.target.value });
         const error = validateField("audience.primary", e.target.value);
         setFieldErrors({
           ...fieldErrors,
           "audience.primary": error || ""
         });
       }}
       aria-describedby={fieldErrors["audience.primary"] ? "error-audience-primary" : undefined}
       className={cn(
         "w-full border-b outline-none pb-1",
         !fieldErrors["audience.primary"] ? "border-blue-500" : "border-red-500"
       )}
     />
     {fieldErrors["audience.primary"] && (
       <p id="error-audience-primary" className="text-xs text-red-600 mt-1">
         {fieldErrors["audience.primary"]}
       </p>
     )}
   </div>
   ```

4. **Add confirmation dialog before approval:**
   ```tsx
   // In ProjectContextPage:
   const [confirmApproval, setConfirmApproval] = useState(false);

   const handleApproveAndLaunch = () => {
     // Show confirmation dialog
     setConfirmApproval(true);
   };

   // In render:
   {confirmApproval && (
     <Dialog open={confirmApproval} onOpenChange={setConfirmApproval}>
       <DialogContent>
         <h2>Approve Project Context?</h2>
         <p>This will lock your context as the source of truth for Lyra module output.</p>
         <p className="text-sm text-gray-600">This action cannot be undone. (You can create a new version later.)</p>
         <div className="flex gap-3">
           <button onClick={() => {
             // Actual approval logic here
             approveRevision(activeRevision.data, 'Approved context');
             setConfirmApproval(false);
           }} className="bg-blue-600 text-white px-4 py-2 rounded">
             Approve
           </button>
           <button onClick={() => setConfirmApproval(false)} className="bg-gray-200 px-4 py-2 rounded">
             Cancel
           </button>
         </div>
       </DialogContent>
     </Dialog>
   )}
   ```

5. **Disable Approve button until form valid:**
   ```tsx
   <button
     onClick={() => setConfirmApproval(true)}
     disabled={!isFormValid}
     className={cn(
       "px-8 py-2 rounded",
       isFormValid ? "bg-blue-600 text-white cursor-pointer" : "bg-gray-300 text-gray-500 cursor-not-allowed"
     )}
   >
     {isFormValid ? "Execute Approval" : "Complete Required Fields"}
   </button>
   ```

**Files to Modify:**
- `src/new/routes/ProjectContextPage.tsx` (add confirmApproval dialog, disable button)
- `src/lib/validation/projectBrief.ts` (add inline validation rules)
- `src/components/ui/SaveIndicator.tsx` (create component)
- `src/components/codra/ContextSection.tsx` (add inline error display)

**Files to Create:**
- `src/hooks/useFormValidation.ts` (reusable form validation hook)

**Verification Checklist:**
- [ ] Open context page
- [ ] Edit a field → see blue border
- [ ] Leave field empty → see red border + error message
- [ ] Fill field correctly → see green border + checkmark
- [ ] Click "Save changes" → see "Saving..." state
- [ ] Wait for save to complete → see "Saved" state with green checkmark
- [ ] Intentionally break API → see "Save failed" + "Retry" button
- [ ] Click "Retry" → tries to save again
- [ ] Fill entire form correctly → "Execute Approval" button enabled
- [ ] Leave a required field empty → "Execute Approval" button disabled + tooltip
- [ ] Click "Execute Approval" → see confirmation dialog
- [ ] Click "Approve" in dialog → context locked, redirect to workspace
- [ ] Try to navigate away with unsaved changes → see unsaved changes dialog
- [ ] Tab through all required fields; validate keyboard navigation

**Success Metrics:**
- 0 "I don't know if that saved" support tickets
- 95%+ of form submissions are valid (caught before DB save)
- Save error retry rate: 100% success on 2nd attempt
- User anxiety score (from NPS): 20% reduction in "unclear save state" mentions

---

### **MODULE 2.2: Network Failure Retry & Recovery**

**Objective:** When network fails, user sees clear "Connection lost" message + automatic retry. Data is queued if offline.

**Acceptance Criteria (Receipts):**
- [ ] Network failure detection:
  - Fetch request fails → catch error
  - Show "Connection error. Retrying..." toast (not dismissable)
  - Wait 1s → retry
  - If still fails, wait 2s → retry
  - If still fails, wait 4s → retry
  - After 3 retries + all failed, show persistent error: "No connection. [Retry] [Close]"
- [ ] User can click "Retry" to force immediate retry
- [ ] After network is restored:
  - Toast auto-dismisses
  - Shows "Back online" confirmation
  - Queued requests flush automatically
- [ ] Offline queue:
  - If user makes edits while offline, queue locally (IndexedDB or localStorage)
  - Show "Saving when connection restored" indicator
  - When online, flush queue (batch requests if multiple)
- [ ] Specific error messages:
  - Network timeout: "Request took too long. Please try again."
  - 401 Unauthorized: "Your session expired. Please log in again."
  - 403 Forbidden: "You don't have permission to do this."
  - 500 Server Error: "Server error. Our team has been notified. Try again in a moment."
  - 429 Rate Limited: "Too many requests. Please wait a moment before trying again."
- [ ] User feedback:
  - Small status indicator in header shows connection state
  - Green dot = online
  - Red dot + "Offline" = no connection
  - Yellow dot + "Retrying..." = attempting retry
- [ ] Monitoring:
  - Log all network failures to analytics
  - Track: error type, endpoint, timestamp, user action
  - Alert team if error rate spikes

**Implementation Guidance:**

1. **Create API client with retry logic:**
   ```tsx
   // src/lib/api/client.ts
   interface RetryConfig {
     maxRetries: number;
     baseDelay: number; // ms
     backoffMultiplier: number;
   }

   const DEFAULT_RETRY_CONFIG: RetryConfig = {
     maxRetries: 3,
     baseDelay: 1000,
     backoffMultiplier: 2
   };

   export async function fetchWithRetry(
     url: string,
     options: RequestInit = {},
     retryConfig = DEFAULT_RETRY_CONFIG
   ): Promise<Response> {
     let lastError: Error | null = null;

     for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
       try {
         const response = await fetch(url, options);

         if (response.ok || response.status === 401 || response.status === 403) {
           return response; // Don't retry auth errors
         }

         if (attempt < retryConfig.maxRetries) {
           const delay = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt);
           await new Promise(resolve => setTimeout(resolve, delay));
           continue;
         }

         return response;
       } catch (error) {
         lastError = error as Error;

         if (attempt < retryConfig.maxRetries) {
           const delay = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt);
           await new Promise(resolve => setTimeout(resolve, delay));
         }
       }
     }

     throw lastError || new Error("Network request failed after retries");
   }
   ```

2. **Create offline queue:**
   ```tsx
   // src/lib/api/offline-queue.ts
   interface QueuedRequest {
     id: string;
     url: string;
     options: RequestInit;
     timestamp: number;
     retries: number;
   }

   export const offlineQueue = {
     queue: [] as QueuedRequest[],

     add(url: string, options: RequestInit) {
       const id = `${Date.now()}-${Math.random()}`;
       this.queue.push({
         id,
         url,
         options,
         timestamp: Date.now(),
         retries: 0
       });
       localStorage.setItem("codra:offlineQueue", JSON.stringify(this.queue));
     },

     async flush() {
       const queue = [...this.queue];
       for (const request of queue) {
         try {
           const response = await fetchWithRetry(request.url, request.options);
           if (response.ok) {
             this.queue = this.queue.filter(r => r.id !== request.id);
           }
         } catch (error) {
           console.error(`Queue request failed: ${request.url}`, error);
         }
       }
       localStorage.setItem("codra:offlineQueue", JSON.stringify(this.queue));
     },

     load() {
       const stored = localStorage.getItem("codra:offlineQueue");
       if (stored) {
         this.queue = JSON.parse(stored);
       }
     }
   };
   ```

3. **Create connection status hook:**
   ```tsx
   // src/hooks/useConnectionStatus.ts
   export function useConnectionStatus() {
     const [isOnline, setIsOnline] = useState(navigator.onLine);
     const [retrying, setRetrying] = useState(false);
     const toast = useToast();

     useEffect(() => {
       const handleOnline = () => {
         setIsOnline(true);
         setRetrying(false);
         toast.success("Back online");
         offlineQueue.flush();
       };

       const handleOffline = () => {
         setIsOnline(false);
         toast.error("No connection. Saving when you're back online.");
       };

       window.addEventListener("online", handleOnline);
       window.addEventListener("offline", handleOffline);

       return () => {
         window.removeEventListener("online", handleOnline);
         window.removeEventListener("offline", handleOffline);
       };
     }, []);

     return { isOnline, retrying, setRetrying };
   }
   ```

4. **Add connection indicator to header:**
   ```tsx
   // In App.tsx or Header.tsx:
   const { isOnline } = useConnectionStatus();

   <div className="flex items-center gap-2">
     <div className={cn(
       "w-2 h-2 rounded-full",
       isOnline ? "bg-green-500" : "bg-red-500"
     )} />
     <span className="text-xs text-gray-600">
       {isOnline ? "Online" : "Offline"}
     </span>
   </div>
   ```

5. **Wrap API calls with error handling:**
   ```tsx
   // In ProjectContextPage.tsx handleSaveSection:
   const handleSaveSection = async (section: string) => {
     setSaveState('saving');

     try {
       const response = await fetchWithRetry(
         `/api/project/${projectId}/context/${section}`,
         {
           method: "POST",
           body: JSON.stringify(tempData),
           headers: { "Content-Type": "application/json" }
         }
       );

       if (!response.ok) {
         const error = await response.json();
         throw new Error(error.message || "Save failed");
       }

       setSaveState('saved');
       toast.success("Changes saved");
       setTimeout(() => setSaveState('idle'), 2000);
     } catch (error) {
       console.error("Save error:", error);
       setSaveState('error');

       analytics.track("save_error", {
         section,
         projectId,
         error: error.message
       });

       // Queue for retry if offline
       if (!navigator.onLine) {
         offlineQueue.add(
           `/api/project/${projectId}/context/${section}`,
           {
             method: "POST",
             body: JSON.stringify(tempData)
           }
         );
       }
     }
   };
   ```

**Files to Modify:**
- `src/lib/api/client.ts` (add retry logic)
- `src/new/routes/ProjectContextPage.tsx` (use fetchWithRetry)
- `src/new/routes/ExecutionDeskPage.tsx` (use fetchWithRetry)
- `src/App.tsx` (add connection indicator)

**Files to Create:**
- `src/lib/api/offline-queue.ts`
- `src/hooks/useConnectionStatus.ts`

**Verification Checklist:**
- [ ] Disconnect network (DevTools → Network tab → Offline)
- [ ] Try to save context changes
- [ ] See "Connection lost. Retrying..." toast
- [ ] Watch retries happen (1s, 2s, 4s delays)
- [ ] After 3 retries, see "No connection. [Retry] [Close]"
- [ ] Reconnect network
- [ ] See "Back online" toast
- [ ] Offline queue flushes; changes saved
- [ ] Check DevTools → see only 1 final request (not 3 retries)
- [ ] Slow network (DevTools → 3G): simulate slow connection
- [ ] Requests retry as expected
- [ ] Fast reconnect: offline queue flushes immediately
- [ ] Check analytics: track network errors (errors.network, count)
- [ ] Manually trigger different error codes (401, 403, 500)
- [ ] See appropriate error messages for each

**Success Metrics:**
- Network failure recovery: 95%+ on 2nd retry
- Offline queue success rate: 100% (after network restored)
- User-perceived recovery time: <5s
- 0 "lost my changes" support tickets due to network issues

---

### **MODULE 2.3: Task Timeout & Cancel Mechanism**

**Objective:** Long-running tasks don't hang forever. Users can cancel + see ETA.

**Acceptance Criteria (Receipts):**
- [ ] Task execution timeout:
  - Default: 30 minutes
  - User configurable in Settings (5-120 min)
  - Stored in user_preferences table
- [ ] If task exceeds timeout:
  - Task status reverts to "pending"
  - Toast shown: "Task timed out after 30 min. Retry?"
  - "Retry" button available
- [ ] Cancel button during execution:
  - While task status = "in-progress", show "Cancel" button
  - Click "Cancel" → calls `POST /api/tasks/:taskId/cancel`
  - Task status reverts to "pending"
  - Toast: "Task cancelled"
- [ ] ETA estimation:
  - Based on task type + model + prompt length:
    - Short task (headline): 5-10s
    - Medium (section): 15-30s
    - Long (full page): 45-60s
  - Show: "Generating... (~15s remaining)"
  - Update ETA in real-time
- [ ] Progress indicator:
  - Show progress bar (0-100%) as task progresses
  - If no real progress data, show spinner instead
  - Update every 1-2s
- [ ] Task history:
  - All cancelled/timed-out tasks logged
  - User can see in task history: "Failed - Timeout", "Cancelled by user"
  - Timestamp of failure
- [ ] Monitoring:
  - Alert if timeout rate >10% (signal of slow API)
  - Track average task duration by type
  - Alert if cancellation rate >20% (UX issue)

**Implementation Guidance:**

1. **Add task timeout config:**
   ```tsx
   // src/domain/types.ts
   export interface UserPreferences {
     taskTimeoutMinutes: number; // default 30
     autoRetryFailed: boolean; // default false
   }

   export interface Task {
     id: string;
     title: string;
     status: 'pending' | 'in-progress' | 'complete' | 'failed' | 'cancelled' | 'timed-out';
     startedAt?: number;
     completedAt?: number;
     cancelledAt?: number;
     estimatedDurationSeconds?: number;
   }
   ```

2. **Create task execution hook with timeout:**
   ```tsx
   // src/hooks/useTaskExecution.ts
   export function useTaskExecution(taskId: string, projectId: string) {
     const [task, setTask] = useState<Task | null>(null);
     const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
     const toast = useToast();
     const prefs = useUserPreferences();

     const runTask = useCallback(async () => {
       setTask({ ...task, status: 'in-progress', startedAt: Date.now() });

       const timeoutMs = (prefs.taskTimeoutMinutes || 30) * 60 * 1000;
       const timeoutHandle = setTimeout(() => {
         setTask(prev => ({ ...prev, status: 'timed-out' }));
         toast.error(`Task timed out after ${prefs.taskTimeoutMinutes} minutes. Retry?`);
         analytics.track("task_timeout", { taskId, projectId });
       }, timeoutMs);

       // Start countdown timer
       const timerHandle = setInterval(() => {
         const elapsed = Date.now() - (task?.startedAt || 0);
         const remaining = Math.max(0, timeoutMs - elapsed);
         setTimeRemaining(Math.ceil(remaining / 1000));
       }, 1000);

       try {
         const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/execute`, {
           method: "POST"
         });
         clearTimeout(timeoutHandle);
         clearInterval(timerHandle);

         if (response.ok) {
           const result = await response.json();
           setTask(prev => ({ ...prev, status: 'complete', completedAt: Date.now() }));
           toast.success("Task complete");
         } else {
           throw new Error(await response.text());
         }
       } catch (error) {
         clearTimeout(timeoutHandle);
         clearInterval(timerHandle);
         setTask(prev => ({ ...prev, status: 'failed' }));
         toast.error(`Task failed: ${error.message}`);
       }
     }, [taskId, projectId, prefs.taskTimeoutMinutes]);

     const cancelTask = useCallback(async () => {
       try {
         await fetch(`/api/projects/${projectId}/tasks/${taskId}/cancel`, {
           method: "POST"
         });
         setTask(prev => ({ ...prev, status: 'cancelled', cancelledAt: Date.now() }));
         toast.info("Task cancelled");
         analytics.track("task_cancelled", { taskId, projectId });
       } catch (error) {
         toast.error("Failed to cancel task");
       }
     }, [taskId, projectId]);

     return { task, timeRemaining, runTask, cancelTask };
   }
   ```

3. **Render task with progress:**
   ```tsx
   // In TaskQueue component:
   const { task, timeRemaining, runTask, cancelTask } = useTaskExecution(taskId, projectId);

   <div className="task-item">
     <h4>{task?.title}</h4>
     {task?.status === 'in-progress' && (
       <>
         <div className="progress-bar" style={{ width: `${progress}%` }} />
         <p className="text-sm text-gray-600">
           {timeRemaining && `~${timeRemaining}s remaining`}
         </p>
         <button onClick={cancelTask} className="text-xs text-red-600">
           Cancel
         </button>
       </>
     )}
     {task?.status === 'timed-out' && (
       <button onClick={runTask} className="text-xs text-blue-600">
         Retry
       </button>
     )}
     {task?.status === 'cancelled' && (
       <p className="text-xs text-gray-600">Cancelled by user at {new Date(task.cancelledAt).toLocaleTimeString()}</p>
     )}
   </div>
   ```

4. **Add timeout settings to Settings modal:**
   ```tsx
   // In SettingsModal:
   <div>
     <label>Task Timeout (minutes)</label>
     <input
       type="number"
       min="5"
       max="120"
       value={prefs.taskTimeoutMinutes}
       onChange={(e) => updatePreference({ taskTimeoutMinutes: parseInt(e.target.value) })}
     />
     <p className="text-xs text-gray-600">Tasks will be cancelled if they exceed this time.</p>
   </div>
   ```

**Files to Modify:**
- `src/new/routes/ExecutionDeskPage.tsx` (integrate useTaskExecution)
- `src/components/TaskQueue.tsx` (show progress, cancel button)
- `src/components/SettingsModal.tsx` (add timeout setting)

**Files to Create:**
- `src/hooks/useTaskExecution.ts`

**Backend APIs to add:**
- `POST /api/projects/:projectId/tasks/:taskId/cancel` → sets status to "cancelled", kills running process

**Verification Checklist:**
- [ ] Start a task
- [ ] See "Generating... (~15s remaining)"
- [ ] See progress bar advancing
- [ ] Countdown timer updates every second
- [ ] Click "Cancel" button
- [ ] Task status → "cancelled"
- [ ] See "Task cancelled" toast
- [ ] Task history shows "Cancelled by user"
- [ ] Settings → change timeout to 5 minutes
- [ ] Start task → wait 5 min 30 sec
- [ ] See "Task timed out" toast
- [ ] Task status → "timed-out"
- [ ] Click "Retry" button
- [ ] Task runs again

**Success Metrics:**
- Task timeout rate: <5%
- Cancel rate: <10%
- Average task duration matches estimate: ±30%
- User trust in long-running tasks: improved (from NPS)

---

### **MODULE 2.4: Concurrent Edit Conflict Detection & Merge**

**Objective:** When two users edit the same project, conflict detection prevents data loss.

**Acceptance Criteria (Receipts):**
- [ ] Version vector on each spread:
  - Each spread has `version: number` (increments on every save)
  - Each spread has `lastModifiedBy: userId` + `lastModifiedAt: timestamp`
- [ ] On save attempt:
  - Client sends current version: `PUT /api/spreads/:spreadId { version: 5, data: {...} }`
  - Server checks: `if (dbVersion !== clientVersion) return 409 Conflict`
  - If conflict, return: `{ conflict: true, serverVersion: 6, serverData: {...} }`
- [ ] Conflict UI:
  - Dialog appears: "This project was modified while you were editing"
  - Show diff:
    - "Your changes: [list changes]"
    - "Their changes: [list changes]"
    - "Overlapping sections: [mark if same section edited]"
  - Options:
    - "Use my version" (overwrite)
    - "Use their version" (discard mine)
    - "Merge" (if no overlap; merge both)
    - "Save as draft" (keep editing, create new version)
- [ ] Merge strategy:
  - If different sections edited: auto-merge (combine both)
  - If same section edited: show conflict dialog (user chooses)
  - Merged result has version incremented
- [ ] Notification:
  - Toast when conflict detected: "Project updated by [username]. Review changes?"
  - Link to version history to see what changed
- [ ] Monitoring:
  - Track conflict rate (% of saves that conflict)
  - Alert if conflict rate >5%
  - Track most-conflicted sections

**Implementation Guidance:**

1. **Add version tracking to types:**
   ```tsx
   // src/domain/types.ts
   export interface Spread {
     id: string;
     projectId: string;
     version: number; // incremented on save
     lastModifiedBy: string; // userId
     lastModifiedAt: number; // timestamp
     data: SpreadData;
   }
   ```

2. **Create conflict detection hook:**
   ```tsx
   // src/hooks/useConflictDetection.ts
   export function useConflictDetection(spreadId: string) {
     const [conflict, setConflict] = useState<ConflictState | null>(null);
     const [serverVersion, setServerVersion] = useState<number | null>(null);
     const [serverData, setServerData] = useState<SpreadData | null>(null);

     const saveWithConflictCheck = useCallback(async (data: SpreadData, clientVersion: number) => {
       try {
         const response = await fetch(`/api/spreads/${spreadId}`, {
           method: "PUT",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ version: clientVersion, data })
         });

         if (response.status === 409) {
           // Conflict!
           const { serverVersion: newServerVersion, serverData: newServerData } = await response.json();
           setServerVersion(newServerVersion);
           setServerData(newServerData);

           // Detect which sections changed
           const yourChanges = diffObjects(serverData, data);
           const theirChanges = diffObjects(serverData, newServerData);
           const overlap = yourChanges.filter(c => theirChanges.includes(c));

           setConflict({
             yourChanges,
             theirChanges,
             overlap,
             canAutoMerge: overlap.length === 0
           });

           analytics.track("spread_conflict", { spreadId, overlap: overlap.length });

           return { success: false, conflict: true };
         }

         if (response.ok) {
           setConflict(null);
           return { success: true };
         }
       } catch (error) {
         console.error("Save error:", error);
         return { success: false, conflict: false };
       }
     }, [spreadId]);

     const resolveConflict = useCallback((strategy: 'mine' | 'theirs' | 'merge') => {
       // Implementation for each strategy
       if (strategy === 'merge' && conflict?.canAutoMerge) {
         // Combine both changes
         const merged = { ...serverData };
         // Apply client changes to serverData
         // ...
       }
       setConflict(null);
     }, [conflict, serverData]);

     return { conflict, saveWithConflictCheck, resolveConflict };
   }
   ```

3. **Render conflict dialog:**
   ```tsx
   // In ExecutionDeskPage or a separate ConflictDialog component:
   {conflict && (
     <Dialog open={!!conflict} onOpenChange={() => {}}>
       <DialogContent>
         <h2>Project Updated</h2>
         <p>This project was modified by another user while you were editing.</p>

         <div className="bg-blue-50 p-4 rounded mt-4">
           <h4 className="font-semibold text-sm mb-2">Your changes:</h4>
           <ul className="text-sm space-y-1">
             {conflict.yourChanges.map(c => <li key={c}>- {c}</li>)}
           </ul>
         </div>

         <div className="bg-green-50 p-4 rounded mt-4">
           <h4 className="font-semibold text-sm mb-2">Their changes:</h4>
           <ul className="text-sm space-y-1">
             {conflict.theirChanges.map(c => <li key={c}>- {c}</li>)}
           </ul>
         </div>

         {conflict.overlap.length > 0 && (
           <div className="bg-amber-50 p-4 rounded mt-4 border border-amber-200">
             <h4 className="font-semibold text-sm mb-2 text-amber-900">Conflicting sections:</h4>
             <ul className="text-sm space-y-1">
               {conflict.overlap.map(c => <li key={c}>⚠ {c}</li>)}
             </ul>
             <p className="text-xs text-amber-800 mt-2">You'll need to choose one version for these.</p>
           </div>
         )}

         <div className="flex gap-3 mt-6">
           {conflict.canAutoMerge && (
             <button onClick={() => resolveConflict('merge')} className="flex-1 bg-green-600 text-white px-4 py-2 rounded">
               Merge (Combine both)
             </button>
           )}
           <button onClick={() => resolveConflict('mine')} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded">
             Keep my changes
           </button>
           <button onClick={() => resolveConflict('theirs')} className="flex-1 bg-gray-600 text-white px-4 py-2 rounded">
             Use their changes
           </button>
         </div>
       </DialogContent>
     </Dialog>
   )}
   ```

4. **Enable real-time subscriptions (Supabase):**
   ```tsx
   // In ExecutionDeskPage:
   useEffect(() => {
     const subscription = supabase
       .from(`spreads:projectId=eq.${projectId}`)
       .on("*", (payload) => {
         if (payload.new.version > spread.version) {
           toast.info(`${payload.new.lastModifiedBy} updated this project`);
           analytics.track("spread_updated_by_other_user", { projectId });
         }
       })
       .subscribe();

     return () => supabase.removeSubscription(subscription);
   }, [projectId, spread.version]);
   ```

**Files to Modify:**
- `src/new/routes/ExecutionDeskPage.tsx` (integrate useConflictDetection)
- `src/hooks/useSpreadPersistence.ts` (add conflict handling)

**Files to Create:**
- `src/hooks/useConflictDetection.ts`
- `src/components/ConflictDialog.tsx`

**Backend APIs to modify:**
- `PUT /api/spreads/:spreadId` → add version check, return 409 if conflict

**Verification Checklist:**
- [ ] Open project in 2 browser windows (user A, user B)
- [ ] User A edits Section 1
- [ ] User B edits Section 2 (different section)
- [ ] User A clicks "Save" → success
- [ ] User B clicks "Save" → see conflict dialog
- [ ] Dialog shows: "Your changes: Section 2", "Their changes: Section 1"
- [ ] Click "Merge" → both sections saved
- [ ] Both users refresh → see merged result
- [ ] User A edits Section 1 again
- [ ] User B edits Section 1 (same section)
- [ ] User A clicks "Save" → success
- [ ] User B clicks "Save" → see conflict dialog
- [ ] Dialog shows: "Conflicting sections: Section 1"
- [ ] Options: "Keep my changes", "Use their changes", NOT "Merge" (auto-merge disabled)
- [ ] User B clicks "Keep my changes"
- [ ] User A's changes overwritten; User B's preserved
- [ ] Check analytics: track conflict resolution strategies

**Success Metrics:**
- Conflict rate: <5%
- Auto-merge success: 90%+ (when no overlap)
- User satisfaction with conflict UX: 80%+
- 0 silent data loss incidents

---

## PHASE 3: ASSET PIPELINE INTEGRATION (IF SHIPPING V1)
*Only if assets are part of v1.0. Otherwise, document as v2.0 roadmap. Estimated: 8-10 days*

---

### **MODULE 3.1: Asset Manager UI**

**Objective:** Users can upload, organize, and manage project assets (images, icons, etc.). Asset metadata is auto-enriched. Assets are available in spread sections.

**Acceptance Criteria (Receipts):**
- [ ] Asset manager page/modal accessible from:
  - ExecutionDeskPage (sidebar button)
  - ProjectContextPage (dedicated section)
- [ ] Upload interface:
  - Drag-drop zone for images
  - "Select files" button (file picker)
  - Multiple files at once
  - Shows upload progress per file (% complete)
- [ ] Asset list shows:
  - Thumbnail preview
  - Filename
  - Upload date
  - File size
  - Asset role (hero, icon, texture, etc.)
  - Energy level (auto-detected: low/medium/high)
  - Palette mode (light/dark/neutral)
  - Status: Draft, Approved, Deprecated
- [ ] Asset actions:
  - Approve asset (promote from Draft → Approved)
  - Deprecate asset (mark as no longer usable)
  - Delete asset
  - Edit metadata (role, tags)
  - Download original file
- [ ] Enrichment indicator:
  - While enriching: spinner + "Analyzing..."
  - Once enriched: checkmark + "Complete"
  - If enrichment failed: warning icon + "Retry"
- [ ] Asset filtering:
  - Filter by status (draft, approved, deprecated)
  - Filter by role (hero, icon, texture, etc.)
  - Filter by energy (low, medium, high)
  - Search by filename or tags
- [ ] Asset organization:
  - View: Grid (thumbnails) or List (details)
  - Sort: Upload date, file size, name
- [ ] Batch actions:
  - Select multiple assets
  - Approve all at once
  - Add same tag to multiple
  - Delete multiple
- [ ] Integration with spread sections:
  - When editing spread section, click "Insert Asset"
  - Asset picker opens
  - User selects asset or image slot requirement
  - Asset is resolved (deterministically) and embedded in section
  - Shows selected asset thumbnail in section

**Implementation Guidance:**

1. **Create AssetManager page:**
   ```tsx
   // src/new/routes/AssetManagerPage.tsx
   export function AssetManagerPage() {
     const { projectId } = useParams();
     const [assets, setAssets] = useState<Asset[]>([]);
     const [filter, setFilter] = useState({ status: 'approved', role: '' });
     const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

     useEffect(() => {
       fetchProjectAssets(projectId, filter).then(setAssets);
     }, [projectId, filter]);

     const handleUpload = async (files: File[]) => {
       for (const file of files) {
         const formData = new FormData();
         formData.append("file", file);
         formData.append("projectId", projectId);

         const response = await fetch("/api/assets/upload", {
           method: "POST",
           body: formData
         });

         if (response.ok) {
           const asset = await response.json();
           setAssets(prev => [...prev, asset]);
           toast.success(`${file.name} uploaded`);
         }
       }
     };

     const handleApproveAssets = async (assetIds: string[]) => {
       await Promise.all(assetIds.map(id =>
         fetch(`/api/assets/${id}/approve`, { method: "POST" })
       ));
       setAssets(prev => prev.map(a =>
         assetIds.includes(a.id) ? { ...a, status: 'approved' } : a
       ));
       toast.success(`${assetIds.length} assets approved`);
     };

     return (
       <div className="space-y-6">
         <h1>Project Assets</h1>

         {/* Upload Zone */}
         <div
           onDrop={(e) => {
             e.preventDefault();
             handleUpload(Array.from(e.dataTransfer.files));
           }}
           className="border-2 border-dashed border-gray-300 rounded p-8 text-center"
         >
           <p>Drag images here or <button onClick={() => document.getElementById('fileInput').click()}>select files</button></p>
           <input id="fileInput" type="file" multiple onChange={(e) => handleUpload(Array.from(e.target.files || []))} hidden />
         </div>

         {/* Filters */}
         <div className="flex gap-4">
           <select value={filter.status} onChange={(e) => setFilter({...filter, status: e.target.value})}>
             <option value="">All Status</option>
             <option value="draft">Draft</option>
             <option value="approved">Approved</option>
             <option value="deprecated">Deprecated</option>
           </select>
           <select value={filter.role} onChange={(e) => setFilter({...filter, role: e.target.value})}>
             <option value="">All Roles</option>
             <option value="hero">Hero</option>
             <option value="icon">Icon</option>
             <option value="texture">Texture</option>
           </select>
         </div>

         {/* Asset Grid */}
         <div className="grid grid-cols-4 gap-4">
           {assets.map(asset => (
             <AssetCard
               key={asset.id}
               asset={asset}
               selected={selectedAssets.includes(asset.id)}
               onSelect={(id) => setSelectedAssets(prev =>
                 prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
               )}
             />
           ))}
         </div>

         {/* Batch Actions */}
         {selectedAssets.length > 0 && (
           <div className="flex gap-4">
             <button onClick={() => handleApproveAssets(selectedAssets)}>
               Approve {selectedAssets.length}
             </button>
             <button onClick={() => deleteAssets(selectedAssets)}>
               Delete {selectedAssets.length}
             </button>
           </div>
         )}
       </div>
     );
   }
   ```

2. **Create AssetCard component:**
   ```tsx
   // src/components/AssetCard.tsx
   export function AssetCard({ asset, selected, onSelect }) {
     return (
       <div
         className={cn(
           "border rounded cursor-pointer",
           selected && "border-blue-600 bg-blue-50"
         )}
         onClick={() => onSelect(asset.id)}
       >
         <img src={asset.thumbnailUrl} alt={asset.filename} className="w-full h-32 object-cover" />
         <div className="p-3">
           <p className="font-medium text-sm truncate">{asset.filename}</p>
           <p className="text-xs text-gray-600">{asset.role}</p>
           <div className="flex justify-between items-center mt-2">
             <span className={cn(
               "text-xs px-2 py-1 rounded",
               asset.status === 'approved' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
             )}>
               {asset.status}
             </span>
             {asset.enriching && <Spinner className="w-4 h-4" />}
             {asset.enriched && <CheckCircle className="w-4 h-4 text-green-600" />}
           </div>
         </div>
       </div>
     );
   }
   ```

3. **Create asset insertion modal for spread:**
   ```tsx
   // src/components/AssetPickerModal.tsx
   export function AssetPickerModal({ isOpen, onSelect, slotDescriptor }) {
     const [assets, setAssets] = useState<Asset[]>([]);
     const [filtered, setFiltered] = useState<Asset[]>([]);

     useEffect(() => {
       if (slotDescriptor) {
         // Filter assets based on slot requirements
         // e.g., if slot wants "hero" images, show high-energy, large-aspect assets
         const matches = assets.filter(a => matchesSlot(a, slotDescriptor));
         setFiltered(matches);
       }
     }, [assets, slotDescriptor]);

     return (
       <Dialog open={isOpen}>
         <h2>Choose an image for: {slotDescriptor?.purpose}</h2>
         <div className="grid grid-cols-3 gap-4">
           {filtered.map(asset => (
             <div
               key={asset.id}
               onClick={() => onSelect(asset)}
               className="cursor-pointer border rounded overflow-hidden hover:shadow-lg"
             >
               <img src={asset.thumbnailUrl} alt={asset.filename} className="w-full h-24 object-cover" />
               <p className="p-2 text-sm">{asset.filename}</p>
             </div>
           ))}
         </div>
       </Dialog>
     );
   }
   ```

**Files to Create:**
- `src/new/routes/AssetManagerPage.tsx`
- `src/components/AssetCard.tsx`
- `src/components/AssetPickerModal.tsx`
- `src/hooks/useAssetManager.ts`

**Backend APIs to add:**
- `POST /api/assets/upload` → upload to Cloudinary, create asset record
- `GET /api/projects/:projectId/assets` → list project assets
- `POST /api/assets/:assetId/approve` → promote to approved
- `POST /api/assets/:assetId/deprecate` → mark deprecated
- `DELETE /api/assets/:assetId` → delete asset

**Verification Checklist:**
- [ ] Navigate to Asset Manager
- [ ] See empty asset list
- [ ] Drag image file to upload zone
- [ ] See upload progress (file name, %)
- [ ] Asset added to list in "Draft" status
- [ ] Enrichment spinner shows, then checkmark
- [ ] Click on asset → see metadata (role, energy, palette)
- [ ] Select multiple assets → see batch action buttons
- [ ] Click "Approve All" → all selected → "Approved" status
- [ ] Filter by "Approved" → only approved assets shown
- [ ] Filter by "hero" role → only hero images shown
- [ ] In spread section, click "Insert Asset"
- [ ] Asset picker modal opens, pre-filtered
- [ ] Select asset → modal closes, asset inserted in section
- [ ] Refresh page → asset persists in section

**Success Metrics:**
- Asset upload success rate: 99%+
- Enrichment completion rate: 99%+
- User can insert asset into spread in <30s
- Asset discovery (filtering) helps users find correct asset 90%+ of time

---

## PHASE 4: BEST-IN-CLASS FEATURES
*After Phases 1-3. These elevate Codra beyond minimum viable product. Estimated: 20+ days*

---

### **MODULE 4.1: Real-Time Collaboration (Team Tier)**

**Objective:** Multiple team members can edit the same project simultaneously. Changes sync in real-time.

**Acceptance Criteria (Receipts):**
- [ ] Real-time presence:
  - See who's in the project (avatars in header)
  - See active editors (green dot next to name)
  - Cursor presence: see other users' cursors in real-time (optional but delightful)
- [ ] Real-time sync:
  - When User A edits Section 1, User B sees changes appear in real-time
  - Latency: <500ms
  - No flickering or jank
- [ ] Conflict-free editing:
  - Operational Transform or CRDT-based conflict resolution
  - If both edit same field simultaneously, both edits merge
  - No data loss
- [ ] Activity feed:
  - Timeline of who changed what, when
  - "Alice edited Brand Voice, 2 minutes ago"
  - Searchable + filterable
- [ ] Comments:
  - Users can comment on sections
  - Comments persist + timestamped
  - Notifications when someone comments on your section
- [ ] Permissions per team member:
  - Owner: full access
  - Editor: can edit all sections
  - Viewer: read-only
  - Stakeholder: can comment but not edit
- [ ] Notifications:
  - When someone mentions you: "@Alice reviewed this"
  - Toast: "Alice started editing"
  - Email digest: daily summary of activity
- [ ] Version control:
  - All changes tracked (separate from revision history)
  - Can revert to any point in time
  - Blame: see who made each change
  - Diff: compare two versions

**Implementation Guidance:**
This is a significant feature. Use Supabase realtime + CRDT library (e.g., Yjs).

1. **Set up Supabase realtime:**
   ```tsx
   // src/lib/realtime/collaboration.ts
   import * as Y from 'yjs';
   import { WebsocketProvider } from 'y-websocket';

   export function createCollaborativeSpread(spreadId: string) {
     const ydoc = new Y.Doc();
     const provider = new WebsocketProvider(
       `wss://your-supabase-url/realtime/v1/websocket?apikey=${SUPABASE_KEY}`,
       `spreads:${spreadId}`,
       ydoc
     );

     const ymap = ydoc.getMap('spread');

     return { ydoc, ymap, provider };
   }
   ```

2. **Bind React state to Yjs:**
   ```tsx
   useEffect(() => {
     const unsub = ymap.observe(event => {
       // Yjs detected changes from other users
       // Update React state
       setSpread(prev => ({...prev, ...Object.fromEntries(ymap)}));
     });
     return unsub;
   }, [ymap]);
   ```

3. **Show presence:**
   ```tsx
   const [awareness, setAwareness] = useState(provider.awareness);

   awareness.setLocalState({
     user: { name: currentUser.name, color: '#FF0000' },
     cursor: { x: mouseX, y: mouseY }
   });

   awareness.on("update", changes => {
     // Re-render presence cursors
   });
   ```

(Full implementation is substantial—would need dedicated sprint)

---

### **MODULE 4.2: Smart Defaults & AI-Assisted Workflows**

**Objective:** Codra suggests next steps, auto-fills fields, and learns from user patterns.

**Acceptance Criteria (Receipts):**
- [ ] Smart onboarding:
  - Instead of blank form, show curated questions based on project type
  - "Landing page" → asks about CTA, value prop, social proof
  - "Portfolio site" → asks about portfolio categories, bio length
- [ ] Auto-fill suggestions:
  - When user starts typing audience, suggest common segments
  - "SaaS founders" → suggest "Product-focused, technical, budget-conscious"
  - "E-commerce shops" → suggest "Direct-to-consumer, price-sensitive"
- [ ] Next-step guidance:
  - After filling section, tooltip suggests: "Good! Next, let's define guardrails"
  - Context-aware: "You haven't defined success criteria. Want to add some?"
- [ ] Task suggestions:
  - Based on project type + context, auto-generate suggested task list
  - User can accept all, edit, or add custom
  - "Landing page" → suggests: Hero headline, Value prop section, CTA button, Social proof
- [ ] Content templates:
  - "Write hero headline" → shows examples from successful projects (with permission)
  - User can use template as starting point
- [ ] Guardrails AI assistant:
  - Suggest guardrails based on industry + audience
  - "Finance app" → suggests: "Comply with GDPR", "Avoid misleading terms"
- [ ] Learning from feedback:
  - User marks output as "Good" or "Needs work"
  - AI learns user preferences
  - Next task output is more aligned
- [ ] Personalization:
  - Store user preferences (voice style, detail level, format)
  - Apply to all future AI outputs

**Implementation Guidance:**
This requires building suggestion engines + prompt tuning.

---

### **MODULE 4.3: Advanced Coherence Scanning**

**Objective:** Coherence scan goes beyond basic validation. Identifies strategic gaps, brand inconsistencies, and competitive blind spots.

**Acceptance Criteria (Receipts):**
- [ ] Blind-spot detection:
  - "You emphasize features but not benefits"
  - "Your CTA is weak compared to competitors"
  - "You haven't addressed common objections"
- [ ] Brand consistency audit:
  - Checks voice against brand guidelines
  - Flags tone mismatches
  - Scores consistency (0-100)
- [ ] Competitive analysis:
  - Cross-references guardrails competitors
  - Highlights overlaps
  - Suggests differentiation opportunities
- [ ] Audience alignment:
  - Checks if content speaks to audience sophistication
  - "Your copy is too technical for novice users"
- [ ] Goal-outcome mapping:
  - Validates success criteria are achievable
  - Flags unrealistic timelines
- [ ] Risk assessment:
  - Identifies potential issues
  - "Your value prop relies on unproven features"
- [ ] Improvement suggestions:
  - Prioritized list of "quick wins"
  - Estimated impact (low/medium/high)
  - "Add social proof section (medium effort, high impact)"
- [ ] Trend analysis:
  - Compares against industry benchmarks
  - "Your brand voice is more formal than SaaS average"

**Implementation Guidance:**
Requires sophisticated prompt engineering + Claude API calls.

---

### **MODULE 4.4: Export & Sharing**

**Objective:** Users can export projects as documents, presentations, or shareable links.

**Acceptance Criteria (Receipts):**
- [ ] Export formats:
  - PDF (with styling, brand colors)
  - DOCX (editable)
  - HTML (web-ready)
  - Markdown (GitHub-friendly)
  - Figma links (if using design tools)
- [ ] Shareable links:
  - `codra.app/s/abc123` (public read-only view)
  - Password-protected option
  - Expiration date
  - Track who viewed + when
- [ ] Download options:
  - Single section
  - Entire project
  - With or without assets
- [ ] Branding:
  - Exports use project brand colors
  - Logo included in header
  - Custom footer with project name
- [ ] Share integrations:
  - Copy link to clipboard
  - Email share (generates shareable link, sends email)
  - Slack integration (share to channel)
  - Twitter/LinkedIn (share project summary)

**Implementation Guidance:**
Uses: jsPDF, docx library, html2canvas for rendering.

---

### **MODULE 4.5: Usage Analytics & Insights**

**Objective:** Help users understand project progress + provide productivity metrics.

**Acceptance Criteria (Receipts):**
- [ ] Project dashboard:
  - Completion %: How many sections filled, how many tasks completed
  - Time spent: Total hours on project
  - Collaborators: Who's contributed
  - Last activity: "Updated 2 hours ago"
- [ ] Productivity metrics:
  - Tasks completed per day (chart)
  - Average task duration
  - Most active times (when are you most creative?)
  - Busiest sections (where do you spend time?)
- [ ] Team insights:
  - Who's most active
  - Collaboration patterns
  - Task completion by person
  - Review cycle times (how long to approve sections?)
- [ ] Usage trends:
  - Month-to-month growth
  - Feature adoption (% using coherence scan, assets, etc.)
  - Retention cohorts
- [ ] Benchmarking:
  - "Average project takes X days"
  - "Your team is Y% faster than average"
  - Industry comparisons
- [ ] Notifications:
  - "Your project is almost complete!"
  - "Alice hasn't reviewed in 3 days"
  - "Your team's most productive time is Tuesday mornings"

**Implementation Guidance:**
Uses PostHog (already integrated) for event tracking + custom dashboard.

---

## APPENDIX: ACCEPTANCE CRITERIA TEMPLATE

For each module, QA should verify:

```
## MODULE X.X: [NAME]

### Pre-Launch Checklist
- [ ] Code review completed (2+ engineers)
- [ ] Unit tests: 80%+ coverage
- [ ] Integration tests: all user flows passing
- [ ] E2E tests: critical paths tested
- [ ] Performance benchmarks: meet targets
- [ ] Accessibility: WCAG 2.1 AA compliant
- [ ] Browser compatibility: Chrome, Firefox, Safari, Edge
- [ ] Mobile responsiveness: tested on iPhone 12, iPad, Android
- [ ] Security review: no XSS, SQLi, CSRF vulnerabilities
- [ ] Analytics: events tracked + dashboards working
- [ ] Documentation: README, API docs, user guide updated

### Launch Readiness
- [ ] Code merged to main, reviewed, approved
- [ ] Deployed to staging environment
- [ ] QA sign-off on staging
- [ ] Monitoring alerts set up
- [ ] Rollback plan documented
- [ ] Support team trained
- [ ] Marketing messaging prepared
- [ ] User documentation published
- [ ] Changelog updated
- [ ] Feature flag ready (for safe rollout)

### Post-Launch Monitoring (Week 1)
- [ ] Error rate <0.1%
- [ ] Performance: p99 latency <1s
- [ ] User adoption: >80% of target users
- [ ] Support tickets: <5 related to this feature
- [ ] Analytics: events firing correctly
- [ ] No regression in other features
```

---

## SUMMARY TABLE: ALL MODULES

| Phase | Module | Priority | Effort (days) | Impact | Blockers |
|-------|--------|----------|---------------|--------|----------|
| **1** | Task Execution | CRITICAL | 3-5 | Core feature | P1 |
| **1** | Spread Error Handling | CRITICAL | 1 | Data loss prevention | P1 |
| **1** | Project Creation Lifecycle | CRITICAL | 1-2 | Data integrity | P1 |
| **1** | Feature Gating | CRITICAL | 1-2 | Revenue protection | P1 |
| **1** | First-Run Experience | CRITICAL | 2-3 | Onboarding/retention | P1 |
| **2** | Save Confirmations | HIGH | 1-2 | UX trust | P2 |
| **2** | Network Retry | HIGH | 1-2 | Reliability | P2 |
| **2** | Task Timeout/Cancel | HIGH | 1-2 | UX predictability | P2 |
| **2** | Conflict Detection | HIGH | 2-3 | Data integrity | P2 |
| **3** | Asset Manager UI | MEDIUM | 2-3 | Feature completeness | P3 (if shipping assets) |
| **4** | Real-Time Collab | MEDIUM | 5-7 | Team tier differentiation | P4 |
| **4** | Smart Defaults | MEDIUM | 3-5 | Delight + retention | P4 |
| **4** | Advanced Coherence | MEDIUM | 3-5 | Strategic value | P4 |
| **4** | Export/Sharing | MEDIUM | 2-3 | Distribution | P4 |
| **4** | Analytics | MEDIUM | 2-3 | Product insights | P4 |

**Total Effort:**
- **Phase 1 (Critical):** 10-13 days → Ship blocker
- **Phase 2 (Essential):** 7-10 days → Ship with confidence
- **Phase 3 (Optional):** 8-10 days → Only if assets in v1
- **Phase 4 (Best-in-Class):** 20+ days → Post-launch roadmap

**Recommended Launch Timeline:**
- Week 1-2: Phases 1-2 (critical + essential fixes)
- Week 3: QA + polish
- Week 4: Launch

---

**This playbook is your engineering roadmap to launch-ready software. Each module is self-contained; agents can work in parallel on different modules. Use the acceptance criteria as your pass/fail gate.**

