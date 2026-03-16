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

export interface FetchJobsResult<T = unknown> {
  source: string;
  /** Parsed response data from the source, or null if the fetch failed. */
  data: T | null;
  /** Whether the fetch ultimately succeeded. */
  ok: boolean;
  /** Number of attempts made (including the first). */
  attempts: number;
  /** Error message if the fetch failed after all retries. */
  error?: string;
  /** True when the circuit breaker prevented the request from being made. */
  skipped?: boolean;
}

/** Raw job shape as returned by external job API responses. */
export interface RawJobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  url?: string;
  /** ISO date string e.g. "2024-01-15" */
  posted_at?: string;
}

/** Normalized job shape used throughout the application. */
export interface ParsedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  /** Normalized from `posted_at`; null when the source omits the field. */
  postedAt: string | null;
}

/** Envelope returned by external job APIs. */
export interface JobApiResponse {
  results: RawJobResult[] | null | undefined;
}

/** Result of a single ingestion batch run. */
export interface BatchResult {
  batchId: string;
  count: number;
  jobs: ParsedJob[];
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

const INGESTION_MAX_ATTEMPTS = 3;

const INGESTION_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: INGESTION_MAX_ATTEMPTS,
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
export async function fetchJobs<T = unknown>(source: JobSource): Promise<FetchJobsResult<T>> {
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

    const data = (await response.json()) as T;
    ingestionCircuitBreaker.recordSuccess(name);

    return { source: name, data, ok: true, attempts };
  } catch (error) {
    ingestionCircuitBreaker.recordFailure(name);
    const message = error instanceof Error ? error.message : String(error);

    return {
      source: name,
      data: null,
      ok: false,
      attempts: INGESTION_MAX_ATTEMPTS,
      error: message,
    };
  }
}

/**
 * Fetches jobs from all provided sources concurrently.
 * Sources that have an open circuit are skipped automatically.
 */
export async function fetchAllJobs<T = unknown>(sources: JobSource[]): Promise<FetchJobsResult<T>[]> {
  return Promise.all(sources.map((s) => fetchJobs<T>(s)));
}

// ─── Job API parsing ──────────────────────────────────────────────────────────

/**
 * Normalizes a raw `JobApiResponse` envelope into an array of `ParsedJob`
 * objects. Returns an empty array when `results` is null/undefined and emits a
 * console warning so callers can detect unexpected API shapes.
 */
export function parseJobResponse(response: JobApiResponse): ParsedJob[] {
  const { results } = response;

  if (results == null) {
    console.warn('[jobIngestion] parseJobResponse: received null/undefined results — returning empty array');
    return [];
  }

  return results.map((raw): ParsedJob => ({
    id: raw.id,
    title: raw.title,
    company: raw.company,
    location: raw.location,
    description: raw.description ?? '',
    url: raw.url ?? '',
    postedAt: raw.posted_at ?? null,
  }));
}

/**
 * Runs a single ingestion batch: calls `fetchFn`, parses the response, and
 * returns a `BatchResult`. Errors from `fetchFn` are caught and logged so the
 * caller always receives a valid (possibly empty) batch.
 */
export async function ingestJobBatch(
  fetchFn: () => Promise<JobApiResponse>,
  batchId: string,
): Promise<BatchResult> {
  try {
    const response = await fetchFn();
    const jobs = parseJobResponse(response);
    return { batchId, count: jobs.length, jobs };
  } catch (error) {
    console.error(`[jobIngestion] ingestJobBatch "${batchId}" failed:`, error);
    return { batchId, count: 0, jobs: [] };
  }
}
