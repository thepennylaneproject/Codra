# PostHog Dashboard Setup Guide

This document outlines how to configure the PostHog dashboard to match Codra's metrics framework.

## Required Saved Insights

### 1. Onboarding Funnel

- **Event Selection**:
  - 1. `onboarding_step_viewed` (Filter: `step == 1`)
  - 2. `onboarding_step_viewed` (Filter: `step == 2`)
  - 3. `onboarding_step_viewed` (Filter: `step == 3`)
  - 4. `onboarding_completed`
- **Visualization**: Funnel
- **Goal**: Monitor drop-off rates between onboarding steps.

### 2. Time to First Spread

- **Event Selection**: `first_spread_generated`
- **Aggregation**: Average of property `durationFromStartMs`
- **Visualization**: Trend
- **Goal**: Measure the "Time to Value" for new users.

### 3. Task Completion Rate

- **Events Selection**:
  - A: `flow_task_began`
  - B: `flow_task_completed`
- **Formula**: `(B / A) * 100`
- **Visualization**: Big Number / Trend
- **Goal**: Monitor AI execution reliability.

### 4. Export Format Popularity

- **Event Selection**: `flow_export_completed`
- **Breakdown**: `format`
- **Visualization**: Pie Chart
- **Goal**: Understand which formats are most valuable to users.

### 5. Desk Switch Behavior

- **Event Selection**: `desk_switched`
- **Breakdown**: `method` (click vs keyboard)
- **Visualization**: Bar Chart
- **Goal**: Measure power user adoption of keyboard shortcuts.

## Environment Variables

Ensure these are set in your production environment:

```bash
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://app.posthog.com
```

## Event Properties Reference

| Event                       | Property     | Type   | Description            |
| --------------------------- | ------------ | ------ | ---------------------- |
| `onboarding_step_completed` | `durationMs` | Number | Time spent on the step |
| `flow_task_completed`       | `cost`       | Number | Calculated cost in USD |
| `flow_task_completed`       | `modelUsed`  | String | Model ID (e.g. gpt-4o) |
| `desk_switched`             | `toDesk`     | String | Target desk name       |
