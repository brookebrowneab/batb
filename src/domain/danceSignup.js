/**
 * Dance sign-up domain logic — pure functions, no side effects.
 *
 * Handles eligibility checks, lock time evaluation, capacity checks,
 * and input validation for dance session sign-ups.
 */

import { LOCK_TIME_HOUR } from './scheduling.js';

/**
 * Check if a student is eligible to sign up for dance.
 * @param {object|null} student
 * @param {boolean} student.registration_complete
 * @returns {{ eligible: boolean, reason: string|null }}
 */
export function checkDanceEligibility(student) {
  if (!student) {
    return { eligible: false, reason: 'Student not found.' };
  }
  if (!student.registration_complete) {
    return {
      eligible: false,
      reason: 'Registration must be complete before signing up for dance.',
    };
  }
  return { eligible: true, reason: null };
}

/**
 * Check if the lock time has passed for a given audition date.
 * Lock time is 2:00 PM local on audition day.
 * @param {string|null} auditionDate - YYYY-MM-DD
 * @param {Date} now - current datetime
 * @returns {boolean} true if locked (past cutoff)
 */
export function isDanceLocked(auditionDate, now) {
  if (!auditionDate) return false;
  const lockTime = new Date(
    `${auditionDate}T${String(LOCK_TIME_HOUR).padStart(2, '0')}:00:00`,
  );
  return now >= lockTime;
}

/**
 * Check if a session has capacity remaining.
 * @param {object|null} session - { capacity: number|null }
 * @param {number} currentCount - current number of sign-ups
 * @returns {{ available: boolean, spotsLeft: number|null }}
 */
export function checkSessionCapacity(session, currentCount) {
  if (!session) return { available: false, spotsLeft: null };
  if (session.capacity === null || session.capacity === undefined) {
    return { available: true, spotsLeft: null }; // unlimited
  }
  const spotsLeft = session.capacity - currentCount;
  return { available: spotsLeft > 0, spotsLeft: Math.max(0, spotsLeft) };
}

/**
 * Validate dance sign-up input.
 * @param {string|null} studentId
 * @param {string|null} danceSessionId
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateDanceSignupInput(studentId, danceSessionId) {
  const errors = [];
  if (!studentId) errors.push('Student is required.');
  if (!danceSessionId) errors.push('Dance session selection is required.');
  return { valid: errors.length === 0, errors };
}
