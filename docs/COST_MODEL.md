# Cost Model

This document defines Codra's unified cost model and the assumptions behind its estimates.

## Sources Of Truth

- `src/domain/cost-policy.ts` holds the canonical configuration: pricing, markup, and heuristics.
- `src/lib/billing/cost-service.ts` is the single calculator that interprets the policy.
- `src/lib/execution/cost-ledger.ts` records all cost transactions with rollback/refund semantics.

## Pricing Assumptions

- Prices are USD per 1k tokens, based on public rates as of late 2024.
- A 20% markup is applied to estimated costs for infrastructure and overhead.
- Actual costs use raw token pricing without markup.

## Token Heuristics

### Task Estimates

- Default context size: 2000 tokens.
- Task overhead by type:
  - `code`: +1500 tokens
  - `analysis`: +1000 tokens
  - `chat`: +500 tokens
  - `creative`: +2000 tokens
  - `default`: +500 tokens
- Estimated split for cost: 70% input, 30% output.

### Debate Preflight

Debate estimates rely on deterministic heuristics:

- Input tokens: `(inputChars / 4) + (shadowChars / 6) + (fragmentCount * 50) + perModelOverhead`.
- Output tokens: `outputTokenBase + min(fragmentCount * outputTokenPerFragment, outputTokenPerFragmentCap)`.
- Totals scale by `modelCount`.
- Credits are computed as `tokensTotal / 1000`.

These values live in `CostPolicy.debateTokenHeuristics` and are reused by `CostService`.

## Cost Ledger Semantics

The ledger is an append-only log stored locally:

- `reserve`: optimistic estimate at task start.
- `commit`: actual cost when the task completes.
- `rollback`: cancels a reservation for failed or cancelled attempts.
- `refund`: reverses previously committed spend.

Daily "spent" totals include commits minus refunds. Reservations and rollbacks are tracked separately to avoid inflating spend when retries fail.

## Budget Enforcement

- Per-run checks compare a task's estimated cost against `BudgetPolicy.maxCostPerRun`.
- Daily checks compare today's committed spend (ledger) against `BudgetPolicy.dailyLimit`.
