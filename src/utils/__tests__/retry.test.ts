/**
 * src/utils/__tests__/retry.test.ts
 *
 * Unit tests for the retry utility and circuit breaker.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, CircuitBreaker, isTransientHttpStatus } from '../retry';

// ─── isTransientHttpStatus ────────────────────────────────────────────────────

describe('isTransientHttpStatus', () => {
    it('returns true for 5xx server errors', () => {
        expect(isTransientHttpStatus(500)).toBe(true);
        expect(isTransientHttpStatus(502)).toBe(true);
        expect(isTransientHttpStatus(503)).toBe(true);
        expect(isTransientHttpStatus(504)).toBe(true);
    });

    it('returns true for 408 (Request Timeout)', () => {
        expect(isTransientHttpStatus(408)).toBe(true);
    });

    it('returns true for 429 (Too Many Requests)', () => {
        expect(isTransientHttpStatus(429)).toBe(true);
    });

    it('returns false for 400 (Bad Request)', () => {
        expect(isTransientHttpStatus(400)).toBe(false);
    });

    it('returns false for 401 (Unauthorized)', () => {
        expect(isTransientHttpStatus(401)).toBe(false);
    });

    it('returns false for 403 (Forbidden)', () => {
        expect(isTransientHttpStatus(403)).toBe(false);
    });

    it('returns false for 404 (Not Found)', () => {
        expect(isTransientHttpStatus(404)).toBe(false);
    });
});

// ─── withRetry ────────────────────────────────────────────────────────────────

describe('withRetry', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the value immediately when the first attempt succeeds', async () => {
        const fn = vi.fn().mockResolvedValue('ok');

        const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 100 });
        await vi.runAllTimersAsync();
        const result = await promise;

        expect(result.value).toBe('ok');
        expect(result.attempts).toBe(1);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on a transient error (503) and succeeds on the second attempt', async () => {
        const transientError = new Error('HTTP 503');
        const fn = vi
            .fn()
            .mockRejectedValueOnce(transientError)
            .mockResolvedValueOnce('recovered');

        const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 100 });
        await vi.runAllTimersAsync();
        const result = await promise;

        expect(result.value).toBe('recovered');
        expect(result.attempts).toBe(2);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('gives up after maxAttempts and throws the last error', async () => {
        const permanentError = new Error('HTTP 503 persistent');
        const fn = vi.fn().mockRejectedValue(permanentError);

        // Attach the rejection handler before advancing timers to avoid
        // an unhandled-rejection warning from Vitest.
        const assertion = expect(
            withRetry(fn, { maxAttempts: 3, baseDelayMs: 100 }),
        ).rejects.toThrow('HTTP 503 persistent');
        await vi.runAllTimersAsync();
        await assertion;

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('does not retry when isRetryable returns false (e.g. 400 client error)', async () => {
        const clientError = new Error('HTTP 400');
        const fn = vi.fn().mockRejectedValue(clientError);

        const assertion = expect(
            withRetry(fn, {
                maxAttempts: 3,
                baseDelayMs: 100,
                isRetryable: () => false,
            }),
        ).rejects.toThrow('HTTP 400');
        await vi.runAllTimersAsync();
        await assertion;

        // Should only try once – no retries.
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('applies exponential backoff between retries', async () => {
        const error = new Error('transient');
        const fn = vi.fn().mockRejectedValue(error);

        const advanceSpy = vi.spyOn(global, 'setTimeout');

        const assertion = expect(
            withRetry(fn, { maxAttempts: 3, baseDelayMs: 1000, backoffMultiplier: 2 }),
        ).rejects.toThrow('transient');
        await vi.runAllTimersAsync();
        await assertion;

        // Delays should be 1000ms (attempt 1→2) and 2000ms (attempt 2→3).
        const delays = advanceSpy.mock.calls.map((call) => call[1] as number);
        expect(delays).toContain(1000);
        expect(delays).toContain(2000);
    });

    it('succeeds with default options when no options are provided', async () => {
        const fn = vi.fn().mockResolvedValue(42);

        const promise = withRetry(fn);
        await vi.runAllTimersAsync();
        const result = await promise;

        expect(result.value).toBe(42);
    });
});

// ─── CircuitBreaker ───────────────────────────────────────────────────────────

describe('CircuitBreaker', () => {
    it('starts in a closed state', () => {
        const breaker = new CircuitBreaker({ failureThreshold: 3 });
        expect(breaker.isOpen('source-a')).toBe(false);
        expect(breaker.getState('source-a')).toBe('closed');
    });

    it('opens the circuit after reaching the failure threshold', () => {
        const breaker = new CircuitBreaker({ failureThreshold: 3 });

        breaker.recordFailure('source-a');
        expect(breaker.isOpen('source-a')).toBe(false);

        breaker.recordFailure('source-a');
        expect(breaker.isOpen('source-a')).toBe(false);

        breaker.recordFailure('source-a');
        expect(breaker.isOpen('source-a')).toBe(true);
        expect(breaker.getState('source-a')).toBe('open');
    });

    it('resets to closed after a successful call', () => {
        const breaker = new CircuitBreaker({ failureThreshold: 3 });

        breaker.recordFailure('source-a');
        breaker.recordFailure('source-a');
        breaker.recordFailure('source-a');
        expect(breaker.isOpen('source-a')).toBe(true);

        breaker.recordSuccess('source-a');
        expect(breaker.isOpen('source-a')).toBe(false);
        expect(breaker.getFailureCount('source-a')).toBe(0);
    });

    it('tracks failure counts independently per key', () => {
        const breaker = new CircuitBreaker({ failureThreshold: 3 });

        breaker.recordFailure('source-a');
        breaker.recordFailure('source-a');
        breaker.recordFailure('source-a');

        expect(breaker.isOpen('source-a')).toBe(true);
        expect(breaker.isOpen('source-b')).toBe(false);
    });

    it('allows manual reset of a circuit', () => {
        const breaker = new CircuitBreaker({ failureThreshold: 3 });

        breaker.recordFailure('source-a');
        breaker.recordFailure('source-a');
        breaker.recordFailure('source-a');
        expect(breaker.isOpen('source-a')).toBe(true);

        breaker.reset('source-a');
        expect(breaker.isOpen('source-a')).toBe(false);
    });

    it('uses a default threshold of 3 when none is provided', () => {
        const breaker = new CircuitBreaker();

        breaker.recordFailure('x');
        breaker.recordFailure('x');
        expect(breaker.isOpen('x')).toBe(false);

        breaker.recordFailure('x');
        expect(breaker.isOpen('x')).toBe(true);
    });
});
