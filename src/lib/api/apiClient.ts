/**
 * API CLIENT WITH RETRY LOGIC
 * src/lib/api/apiClient.ts
 *
 * Provides fetchWithRetry with exponential backoff for transient failures.
 * Auth errors (401/403) are NOT retried.
 */

import { analytics } from '@/lib/analytics';

// ============================================================
// Types
// ============================================================

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // ms
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
};

// ============================================================
// Error Message Mapping
// ============================================================

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Your session expired. Please log in again.',
  403: "You don't have permission to do this.",
  404: 'Resource not found.',
  408: 'Request took too long. Please try again.',
  429: 'Too many requests. Please wait a moment before trying again.',
  500: 'Server error. Our team has been notified. Try again in a moment.',
  502: 'Server temporarily unavailable. Please try again.',
  503: 'Service unavailable. Please try again in a moment.',
  504: 'Request timed out. Please try again.',
};

/**
 * Get a user-friendly error message for an HTTP status code
 */
export function getErrorMessageForStatus(status: number): string {
  if (HTTP_ERROR_MESSAGES[status]) {
    return HTTP_ERROR_MESSAGES[status];
  }

  if (status >= 500) {
    return 'Server error. Please try again in a moment.';
  }

  if (status >= 400) {
    return 'Request failed. Please try again.';
  }

  return 'An unexpected error occurred.';
}

// ============================================================
// Fetch with Retry
// ============================================================

/**
 * Performs a fetch request with exponential backoff retry for transient failures.
 *
 * - Returns immediately for successful responses (2xx)
 * - Returns immediately (no retry) for auth errors (401/403)
 * - Retries with exponential backoff for other failures
 * - Tracks analytics for network failures and retries
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @param retryConfig - Retry configuration (defaults to 3 retries, 1s/2s/4s backoff)
 * @param pageContext - Page context for analytics (e.g., 'ProjectContextPage')
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
  pageContext: string = 'unknown'
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retryConfig.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Do not retry auth/permission errors - return immediately
      if (response.status === 401 || response.status === 403) {
        analytics.track('network_failure', {
          errorType: response.status === 401 ? 'auth_expired' : 'forbidden',
          endpoint: url,
          status: response.status,
          pageContext,
        });
        return response;
      }

      // Success - return immediately
      if (response.ok) {
        return response;
      }

      // Non-retryable client errors (except timeout-like)
      if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
        analytics.track('network_failure', {
          errorType: 'client_error',
          endpoint: url,
          status: response.status,
          pageContext,
        });
        return response;
      }

      // Retryable error - log and continue
      if (attempt < retryConfig.maxRetries - 1) {
        analytics.track('network_retry', {
          attempt: attempt + 1,
          endpoint: url,
        });

        const delay = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Final attempt failed
      analytics.track('network_failure', {
        errorType: 'server_error',
        endpoint: url,
        status: response.status,
        pageContext,
      });

      return response;
    } catch (error) {
      lastError = error as Error;

      // Network error (offline, DNS failure, etc.)
      if (attempt < retryConfig.maxRetries - 1) {
        analytics.track('network_retry', {
          attempt: attempt + 1,
          endpoint: url,
        });

        const delay = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // All retries exhausted
      analytics.track('network_failure', {
        errorType: 'network_error',
        endpoint: url,
        pageContext,
      });

      throw lastError ?? new Error('Network request failed after retries');
    }
  }

  throw lastError ?? new Error('Network request failed after retries');
}

/**
 * Checks if we should queue a request (when offline)
 */
export function shouldQueueRequest(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}
