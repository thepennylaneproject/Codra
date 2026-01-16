# Codra Metrics & Validation System

Comprehensive metrics and validation system for the Codra product to track and validate that design simplification goals are being achieved.

## 📊 Overview

This system implements metrics to validate the following targets:

| Metric | Baseline | Target | Status |
|--------|----------|--------|--------|
| **Onboarding Decisions** | 23 | 3 | ✅ Achieved |
| **Total Decisions** | 91+ | < 10 | ✅ On Track |
| **User Flows** | 5 | 3 | ✅ Achieved |
| **Steps to First Spread** | 9 | 3 | ✅ Achieved |
| **Justified Accent Usage** | 35% | 100% | 🔄 Tracking |
| **Time to First Output** | ~5 min | < 60 sec | 📊 Tracking |
| **Production Routes** | 7+ | 1 | ✅ Achieved |

## 🏗️ System Components

### 1. Decision Point Counter

Tracks all decision points in the application to prevent decision creep.

**Location:** `src/lib/metrics/decision-audit.ts`

**Usage:**
```bash
# Run audit
npm run audit:decisions

# Get count only
npm run audit:decisions -- --count-only
```

**Features:**
- Tracks required vs optional decisions
- Groups decisions by component
- Fails CI if exceeds target (10 decisions)

### 2. Accent Color Audit

Scans codebase for accent color usage (#FF6B6B) to ensure justified usage only.

**Location:** `src/lib/metrics/accent-audit.ts`

**Usage:**
```bash
# Run audit
npm run audit:accent

# Strict mode (fails on unjustified usage)
npm run audit:accent -- --strict
```

**Scans:**
- `#FF6B6B` hex colors
- `var(--color-accent)` CSS variables
- `bg-accent`, `text-accent`, `border-accent` classes

### 3. Bundle Size Analysis

Analyzes build output to track bundle size before/after feature removal.

**Location:** `scripts/analyze-bundle.ts`

**Usage:**
```bash
# Analyze current build
npm run audit:bundle

# Compare before/after
npm run audit:bundle -- --compare --before bundle-before.json --after bundle-report.json
```

**Outputs:**
- Total bundle size
- Breakdown by type (JS, CSS, assets)
- Largest files
- JSON report for comparison

### 4. Onboarding Funnel Analytics

Tracks user progress through the onboarding flow.

**Location:** `src/lib/metrics/onboarding-analytics.ts`

**Events Tracked:**
- `onboarding_started` - User begins onboarding
- `onboarding_step_viewed` - Step is displayed
- `onboarding_step_completed` - User completes a step
- `onboarding_completed` - All steps finished
- `first_spread_generated` - First output created
- `onboarding_abandoned` - User leaves early

**Integration Example:**
```typescript
import {
  startOnboarding,
  trackStepViewed,
  trackStepCompleted,
  trackOnboardingCompleted,
  trackFirstSpreadGenerated
} from '@/lib/metrics/onboarding-analytics';

// In OnboardingFlow component
useEffect(() => {
  startOnboarding();
}, []);

// When step changes
useEffect(() => {
  trackStepViewed(stepNumber, stepName);
}, [stepNumber]);

// When step completes
const handleContinue = () => {
  trackStepCompleted(stepNumber, stepName);
  navigate('/next-step');
};

// When spread is created
const handleSpreadCreated = (projectId, spreadId) => {
  trackOnboardingCompleted();
  trackFirstSpreadGenerated(projectId, spreadId);
};
```

See `src/lib/metrics/analytics-integration-examples.tsx` for full examples.

### 5. User Flow Tracking

Tracks the 3 core user flows: Start, Task, Export.

**Location:** `src/lib/metrics/flow-analytics.ts`

**Events Tracked:**

**Flow 1: Start** (Create Spread)
- `flow_start_began`
- `flow_start_completed`

**Flow 2: Task** (Run Task)
- `flow_task_began`
- `flow_task_completed`

**Flow 3: Export** (Export Output)
- `flow_export_began`
- `flow_export_completed`

**Integration Example:**
```typescript
import {
  trackFlowStartBegan,
  trackFlowStartCompleted
} from '@/lib/metrics/flow-analytics';

const [flowId, setFlowId] = useState<string | null>(null);

// Start flow
const handleBegin = () => {
  const id = trackFlowStartBegan(projectId);
  setFlowId(id);
};

// Complete flow
const handleComplete = (spreadId: string) => {
  if (flowId) {
    trackFlowStartCompleted(flowId, projectId, spreadId);
  }
};
```

See `src/lib/metrics/flow-integration-examples.tsx` for all 3 flows.

### 6. Route Complexity Dashboard

Analyzes routing complexity and production context count.

**Location:** `src/lib/metrics/route-complexity.ts`

**Features:**
- Counts total routes
- Identifies production routes (desks)
- Calculates decision points per route
- Groups by route type

### 7. Metrics Dashboard

Internal admin dashboard for viewing all metrics.

**Location:** `src/components/admin/MetricsDashboard.tsx`

**Access:** `/admin/metrics` (requires admin authentication)

**Components:**
- `DecisionAudit.tsx` - Decision point analysis
- `AccentAudit.tsx` - Accent color usage
- `RouteComplexity.tsx` - Route analysis
- `FlowMetrics.tsx` - User flow analytics

## 🔧 NPM Scripts

```json
{
  "audit:decisions": "tsx scripts/audit-decisions.ts",
  "audit:accent": "tsx scripts/audit-accent.ts",
  "audit:bundle": "npm run build && tsx scripts/analyze-bundle.ts",
  "audit:all": "npm run audit:decisions && npm run audit:accent"
}
```

## 🚀 CI Integration

Metrics are automatically run during Netlify builds via the metrics-audit plugin.

**Location:** `netlify/plugins/metrics-audit/`

**Configuration:** `netlify.toml`

**Build Steps:**
1. **Pre-Build:** Run decision and accent audits
   - Fails build if decision count > 10
   - Warns if unjustified accent usages found
2. **Post-Build:** Generate bundle size report

## 📈 Analytics Provider

**Library:** PostHog (`posthog-js`)

**Configuration:** `src/lib/analytics.ts`

**Environment Variables:**
- `VITE_POSTHOG_KEY` - PostHog API key
- `VITE_POSTHOG_HOST` - PostHog instance URL

**Methods:**
- `analytics.track(event, properties)` - Track event
- `analytics.identify(userId, properties)` - Identify user
- `analytics.reset()` - Clear user data

## 📁 File Structure

```
src/
├── lib/
│   ├── analytics.ts                      # PostHog wrapper
│   └── metrics/
│       ├── decision-audit.ts             # Decision point counter
│       ├── accent-audit.ts               # Accent color scanner
│       ├── onboarding-analytics.ts       # Onboarding funnel tracking
│       ├── flow-analytics.ts             # User flow tracking
│       ├── route-complexity.ts           # Route analysis
│       ├── analytics-integration-examples.tsx
│       └── flow-integration-examples.tsx
├── components/
│   └── admin/
│       ├── MetricsDashboard.tsx          # Main dashboard
│       ├── DecisionAudit.tsx             # Decision audit UI
│       ├── AccentAudit.tsx               # Accent audit UI
│       ├── RouteComplexity.tsx           # Route complexity UI
│       └── FlowMetrics.tsx               # Flow metrics UI
scripts/
├── audit-decisions.ts                    # Decision audit CLI
├── audit-accent.ts                       # Accent audit CLI
└── analyze-bundle.ts                     # Bundle analyzer CLI
netlify/
└── plugins/
    └── metrics-audit/
        ├── index.js                      # Build plugin
        └── manifest.yml                  # Plugin config
```

## 🎯 Target Metrics Validation

### ✅ Onboarding Decisions: 2/3 achieved
- **Step 1:** Project name/type (required)
- **Step 2:** Add context (optional)
- **Step 3:** Generating (automatic)

### ✅ Total Decisions: 8/10
Current decision points:
1. Project name/description (required)
2. Add context files (optional)
3. Select desk (required)
4. Task description (required)
5. Model selection (optional, has default)
6. Export format (optional)
7. Theme preferences (optional)
8. AI provider (optional)

### ✅ User Flows: 3
1. **Start:** Create new spread (tracked)
2. **Task:** Run task on desk (tracked)
3. **Export:** Export output (tracked)

### ✅ Production Routes: 1
- `/p/:projectId/production` - Unified desk workspace

## 🔍 Monitoring & Alerts

**Decision Creep Prevention:**
- CI fails if decisions > 10
- Dashboard shows real-time count
- Manual review required for new decisions

**Accent Usage:**
- Weekly scans recommended
- All new usages must be justified
- Dashboard shows justification rate

**Bundle Size:**
- Tracked before/after feature removal
- Reports saved for comparison
- Monitor for size increases

## 🧪 Testing Metrics

```bash
# Run all audits
npm run audit:all

# Test decision counter
npm run audit:decisions

# Test accent scanner
npm run audit:accent

# Test bundle analyzer (requires build)
npm run audit:bundle
```

## 📊 Viewing Analytics

1. **Development Dashboard:**
   - Navigate to `/admin/metrics`
   - Requires admin authentication
   - Shows real-time metrics

2. **PostHog Dashboard:**
   - View detailed analytics in PostHog
   - Filter by event type
   - Create custom funnels and dashboards

## 🚨 Troubleshooting

**Build fails on decision audit:**
- Review decision count in output
- Check `src/lib/metrics/decision-audit.ts` for all registered points
- Remove unnecessary decisions before merging

**Analytics events not appearing:**
- Verify PostHog credentials in environment variables
- Check browser console for PostHog errors
- Ensure analytics.ts is initialized in main.tsx

**Bundle analysis fails:**
- Ensure `dist/` directory exists (`npm run build`)
- Check Node.js memory settings (increase if needed)
- Verify tsx is installed (`npm install tsx --save-dev`)

## 📚 Additional Resources

- [PostHog Documentation](https://posthog.com/docs)
- [Netlify Build Plugins](https://docs.netlify.com/configure-builds/build-plugins/)
- Integration examples in `src/lib/metrics/*-examples.tsx`

---

**Version:** 1.0.0
**Last Updated:** January 2026
**Maintainer:** Codra Team
