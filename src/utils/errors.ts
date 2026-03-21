/**
 * src/utils/errors.ts
 *
 * Shared error-handling utilities used throughout the codebase.
 */

/**
 * Extracts a human-readable message from an unknown thrown value.
 *
 * TypeScript catch clauses type the caught value as `unknown`, so callers
 * must guard before accessing `.message`. This helper centralises that
 * guard so call-sites stay concise.
 *
 * @example
 * try { ... }
 * catch (error) {
 *   throw new Error(`Operation failed: ${getErrorMessage(error)}`);
 * }
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
