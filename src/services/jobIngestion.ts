/**
 * src/services/jobIngestion.ts
 *
 * Ingestion pipeline for fetching jobs from external sources.
 * Each source is fetched with exponential-backoff retry logic and
 * protected by a per-source circuit breaker that skips sources
 * that have experienced repeated consecutive failures.
 */

import { withRetry, CircuitBreaker, isTransientHttpStatus, RetryOptions } from '@/utils/retry';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface JobSource {
  /** Unique identifier / human-readable name for this source. */
  name: string;
  /** The URL from which jobs are fetched. */
  url: string;
  /** Optional per-source fetch options (e.g. auth headers). */
  fetchOptions?: RequestInit;
}

export interface FetchJobsResult {
  source: string;
  /** Parsed response data from the source, or null if the fetch failed. */
  data: unknown;
  /** Whether the fetch ultimately succeeded. */
  ok: boolean;
  /** Number of attempts made (including the first). */
  attempts: number;
  /** Error message if the fetch failed after all retries. */
  error?: string;
  /** True when the circuit breaker prevented the request from being made. */
  skipped?: boolean;
}

// ─── Non-retryable error ──────────────────────────────────────────────────────

class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
  ) {
    super(`HTTP ${status} from ${url}`);
    this.name = 'HttpError';
  }
}

// ─── Module-level circuit breaker ─────────────────────────────────────────────

/**
 * Shared circuit breaker instance for the ingestion pipeline.
 * Exported for testing and observability purposes only; callers should not
 * manipulate state directly in production code.
 */
export const ingestionCircuitBreaker = new CircuitBreaker({ failureThreshold: 3 });

// ─── Retry configuration ──────────────────────────────────────────────────────

const INGESTION_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  backoffMultiplier: 2,
  isRetryable: (error: unknown) => {
    if (error instanceof HttpError) {
      return isTransientHttpStatus(error.status);
    }
    // Network errors (TypeError: Failed to fetch, etc.) are always retryable.
    return true;
  },
};

// ─── fetchJobs ────────────────────────────────────────────────────────────────

/**
 * Fetches jobs from a single external source with retry and circuit-breaker
 * protection.
 *
 * - Retries up to 3 times with exponential backoff (1 s → 2 s → 4 s).
 * - Does NOT retry on 4xx client errors (except 408 and 429).
 * - After 3 consecutive full failures the circuit opens and the source is
 *   skipped on subsequent calls until manually reset or a successful call
 *   resets the counter.
 */
export async function fetchJobs(source: JobSource): Promise<FetchJobsResult> {
  const { name, url, fetchOptions } = source;

  // Check circuit breaker before attempting any network call.
  if (ingestionCircuitBreaker.isOpen(name)) {
    return {
      source: name,
      data: null,
      ok: false,
      attempts: 0,
      error: `Circuit open – source "${name}" has exceeded the consecutive failure threshold`,
      skipped: true,
    };
  }

  try {
    const { value: response, attempts } = await withRetry(async () => {
      const res = await fetch(url, fetchOptions);
      if (!res.ok) {
        throw new HttpError(res.status, url);
      }
      return res;
    }, INGESTION_RETRY_OPTIONS);

    const data = await response.json();
    ingestionCircuitBreaker.recordSuccess(name);

    return { source: name, data, ok: true, attempts };
  } catch (error) {
    ingestionCircuitBreaker.recordFailure(name);
    const message = error instanceof Error ? error.message : String(error);

    return {
      source: name,
      data: null,
      ok: false,
      attempts: INGESTION_RETRY_OPTIONS.maxAttempts ?? 3,
      error: message,
    };
  }
}

/**
 * Fetches jobs from all provided sources concurrently.
 * Sources that have an open circuit are skipped automatically.
 */
export async function fetchAllJobs(sources: JobSource[]): Promise<FetchJobsResult[]> {
  return Promise.all(sources.map(fetchJobs));
}
