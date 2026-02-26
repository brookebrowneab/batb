/**
 * Scheduling domain logic — pure functions for audition window config validation.
 *
 * No side effects, no Supabase imports.
 */

/**
 * Validate that a time window has start < end.
 * @param {string|null} startTime - HH:MM format
 * @param {string|null} endTime - HH:MM format
 * @param {string} label - window name for error messages
 * @returns {string[]} array of error messages (empty if valid)
 */
export function validateTimeWindow(startTime, endTime, label) {
  const errors = [];
  if (!startTime && !endTime) return errors; // both empty = window not configured (ok)
  if (startTime && !endTime) {
    errors.push(`${label}: end time is required when start time is set.`);
    return errors;
  }
  if (!startTime && endTime) {
    errors.push(`${label}: start time is required when end time is set.`);
    return errors;
  }
  if (startTime >= endTime) {
    errors.push(`${label}: start time must be before end time.`);
  }
  return errors;
}

/**
 * Validate a full audition window config row.
 * @param {object} config
 * @param {string} config.audition_date
 * @param {string|null} config.dance_start_time
 * @param {string|null} config.dance_end_time
 * @param {string|null} config.vocal_start_time
 * @param {string|null} config.vocal_end_time
 * @param {string|null} config.callback_start_time
 * @param {string|null} config.callback_end_time
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateWindowConfig(config) {
  const errors = [];

  if (!config.audition_date) {
    errors.push('Audition date is required.');
  }

  errors.push(...validateTimeWindow(config.dance_start_time, config.dance_end_time, 'Dance'));
  errors.push(...validateTimeWindow(config.vocal_start_time, config.vocal_end_time, 'Vocal'));
  errors.push(
    ...validateTimeWindow(config.callback_start_time, config.callback_end_time, 'Callback'),
  );

  return { valid: errors.length === 0, errors };
}

/**
 * Format a time string for display (HH:MM → 12hr format).
 * @param {string|null} time - HH:MM
 * @returns {string}
 */
export function formatTime(time) {
  if (!time) return '—';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Lock time policy — fixed at 2:00 PM local on audition day.
 * This is a display constant; enforcement happens server-side in booking RPCs.
 */
export const LOCK_TIME_DISPLAY = '2:00 PM on audition day';
export const LOCK_TIME_HOUR = 14; // 24hr
