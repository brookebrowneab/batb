/**
 * Client-side rate limiting utilities.
 * Defense-in-depth on top of existing button-disable guards.
 */

/**
 * Minimum delay between rapid-fire calls (ms).
 */
export const DEFAULT_COOLDOWN_MS = 1000;

/**
 * Creates a guarded version of an async function.
 * While the function is in-flight, subsequent calls are ignored.
 * After completion, enforces a cooldown period before the next call.
 * @param {Function} fn - async function to wrap
 * @param {number} cooldownMs - minimum ms between calls (default 1000)
 * @returns {Function} guarded function
 */
export function createSubmitGuard(fn, cooldownMs = DEFAULT_COOLDOWN_MS) {
  let inFlight = false;
  let lastCall = 0;
  return async (...args) => {
    const now = Date.now();
    if (inFlight || now - lastCall < cooldownMs) return;
    inFlight = true;
    lastCall = now;
    try {
      return await fn(...args);
    } finally {
      inFlight = false;
    }
  };
}
