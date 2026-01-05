# Feature Flag Rollout Procedure

This document outlines the standard procedure for rolling out new features wrapped in PostHog feature flags.

## Standard Rollout Schedule

| Phase                | Day   | Percentage         | Monitoring Focus                       |
| -------------------- | ----- | ------------------ | -------------------------------------- |
| Internal QA          | Day 1 | 0% (Internal Only) | Basic functionality, edge cases        |
| Initial Alpha        | Day 2 | 10%                | Error rates, performance impact        |
| Beta Expansion       | Day 3 | 25%                | Engagement metrics, funnel health      |
| Wide Release         | Day 5 | 50%                | Support ticket volume, scalability     |
| General Availability | Day 7 | 100%               | Final verification before flag removal |

## Rollback Criteria

Rollback (setting flag to 0%) should be triggered immediately if any of the following are observed:

- **Error Rate:** >2% increase in global error rate.
- **Performance:** Page load time increases by >2s.
- **Feature Errors:** >10% error rate specific to the flagged feature.
- **Support:** >5x baseline support tickets related to the feature in 1 hour.
- **Critical:** Any reports of data loss or corruption.

## How to Roll Back

1. Navigate to the PostHog Dashboard → Feature Flags.
2. Locate the relevant flag (e.g., `model-cost-explainer`).
3. Set the rollout percentage to **0%**.
4. The change is typically effective within 30 seconds for active users.
5. No code deployment is required for rollback.

## Flag Cleanup

Feature flags should be removed from the codebase after the feature has been at 100% rollout (GA) for at least 30 days without issues.
