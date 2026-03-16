/**
 * src/utils/retry.ts
 *
 * Generic retry utility with exponential backoff and per-source circuit breaker.
 * Used by the ingestion pipeline to handle transient API failures gracefully.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 3 */
  maxAttempts?: number;
  /** Initial delay in ms before the first retry. Default: 1000 */
  baseDelayMs?: number;
  /** Multiplier applied to delay after each failure. Default: 2 (exponential) */
  backoffMultiplier?: number;
  /**
   * Predicate that decides whether a thrown error is retryable.
   * Return false to abort immediately (e.g. for 4xx client errors).
   * Default: all errors are retryable.
   */
  isRetryable?: (error: unknown) => boolean;
}

export interface RetryResult<T> {
  value: T;
  attempts: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Returns true for HTTP status codes that indicate transient server-side failures.
 * 4xx client errors (except 408 Request Timeout and 429 Too Many Requests) are
 * considered permanent and should not be retried.
 */
export function isTransientHttpStatus(status: number): boolean {
  if (status === 408 || status === 429) return true;
  if (status >= 500) return true;
  return false;
}

// ─── Core retry function ──────────────────────────────────────────────────────

/**
 * Executes `fn` with automatic retry on failure.
 *
 * - Retries up to `maxAttempts - 1` times with exponential backoff.
 * - Respects `isRetryable` to skip retries for permanent errors (e.g. 400).
 * - Throws the last error when all attempts are exhausted.
 *
 * @example
 * const { value } = await withRetry(() => fetch('https://api.example.com/jobs'), {
 *   maxAttempts: 3,
 *   baseDelayMs: 1000,
 *   isRetryable: (err) => err instanceof HttpError && isTransientHttpStatus(err.status),
 * });
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    backoffMultiplier = 2,
    isRetryable = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const value = await fn();
      return { value, attempts: attempt };
    } catch (error) {
      lastError = error;

      const retryable = isRetryable(error);
      const hasAttemptsLeft = attempt < maxAttempts;

      if (!retryable || !hasAttemptsLeft) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(backoffMultiplier, attempt - 1);
      await sleep(delay);
    }
  }

  // Unreachable, but satisfies the TypeScript control-flow checker.
  throw lastError;
}

// ─── Circuit Breaker ──────────────────────────────────────────────────────────

export interface CircuitBreakerOptions {
  /** Number of consecutive full failures before the circuit opens. Default: 3 */
  failureThreshold?: number;
}

export type CircuitState = 'closed' | 'open';

/**
 * Simple per-source circuit breaker.
 *
 * Tracks consecutive failures per key (e.g. a source URL or name).
 * Once a source exceeds `failureThreshold` consecutive failures the circuit
 * "opens" and subsequent calls are rejected immediately without making any
 * network request, preventing further waste of API quota.
 *
 * The circuit resets to "closed" on the first successful call for a key.
 *
 * @example
 * const breaker = new CircuitBreaker({ failureThreshold: 3 });
 *
 * if (breaker.isOpen('source-a')) {
 *   console.warn('Circuit open – skipping source-a');
 * } else {
 *   try {
 *     const data = await fetchSource('source-a');
 *     breaker.recordSuccess('source-a');
 *   } catch {
 *     breaker.recordFailure('source-a');
 *   }
 * }
 */
export class CircuitBreaker {
  private readonly failureThreshold: number;
  private readonly failures = new Map<string, number>();

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 3;
  }

  /** Returns true when the circuit is open (source should be skipped). */
  isOpen(key: string): boolean {
    return (this.failures.get(key) ?? 0) >= this.failureThreshold;
  }

  /** Returns the circuit state for a key. */
  getState(key: string): CircuitState {
    return this.isOpen(key) ? 'open' : 'closed';
  }

  /** Call after a successful operation to reset the failure counter. */
  recordSuccess(key: string): void {
    this.failures.delete(key);
  }

  /** Call after a complete failure (all retries exhausted) to increment the counter. */
  recordFailure(key: string): void {
    this.failures.set(key, (this.failures.get(key) ?? 0) + 1);
  }

  /** Returns the current failure count for a key. */
  getFailureCount(key: string): number {
    return this.failures.get(key) ?? 0;
  }

  /** Manually reset the circuit for a key (e.g. for testing or manual recovery). */
  reset(key: string): void {
    this.failures.delete(key);
  }
}
