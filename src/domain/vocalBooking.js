/**
 * Vocal booking domain logic — pure functions, no side effects.
 *
 * Handles eligibility checks, lock time evaluation, capacity checks,
 * input validation, and 15-minute slot time generation.
 */

import { LOCK_TIME_HOUR } from './scheduling.js';

/** Hard capacity cap per vocal slot. */
export const VOCAL_SLOT_CAPACITY = 7;

/** Slot duration in minutes. */
export const VOCAL_SLOT_DURATION = 15;

/**
 * Check if a student is eligible to book a vocal slot.
 * @param {object|null} student
 * @param {boolean} student.registration_complete
 * @returns {{ eligible: boolean, reason: string|null }}
 */
export function checkVocalEligibility(student) {
  if (!student) {
    return { eligible: false, reason: 'Student not found.' };
  }
  if (!student.registration_complete) {
    return {
      eligible: false,
      reason: 'Registration must be complete before booking a vocal slot.',
    };
  }
  return { eligible: true, reason: null };
}

/**
 * Check if the lock time has passed for a given audition date.
 * @param {string|null} auditionDate - YYYY-MM-DD
 * @param {Date} now - current datetime
 * @returns {boolean} true if locked (past cutoff)
 */
export function isVocalLocked(auditionDate, now) {
  if (!auditionDate) return false;
  const lockTime = new Date(
    `${auditionDate}T${String(LOCK_TIME_HOUR).padStart(2, '0')}:00:00`,
  );
  return now >= lockTime;
}

/**
 * Check if a slot has capacity remaining.
 * @param {number} currentCount - current number of bookings
 * @param {number} maxCapacity - slot capacity (default 7)
 * @returns {{ available: boolean, spotsLeft: number }}
 */
export function checkSlotCapacity(currentCount, maxCapacity = VOCAL_SLOT_CAPACITY) {
  const spotsLeft = Math.max(0, maxCapacity - currentCount);
  return { available: spotsLeft > 0, spotsLeft };
}

/**
 * Validate vocal booking input.
 * @param {string|null} studentId
 * @param {string|null} slotId
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateVocalBookingInput(studentId, slotId) {
  const errors = [];
  if (!studentId) errors.push('Student is required.');
  if (!slotId) errors.push('Vocal slot selection is required.');
  return { valid: errors.length === 0, errors };
}

/**
 * Generate 15-minute slot start/end times within a window.
 * @param {string} startTime - HH:MM format
 * @param {string} endTime - HH:MM format
 * @param {number} durationMinutes - slot duration (default 15)
 * @returns {Array<{start: string, end: string}>} array of slot times
 */
export function generateSlotTimes(startTime, endTime, durationMinutes = VOCAL_SLOT_DURATION) {
  if (!startTime || !endTime) return [];
  if (durationMinutes <= 0) return [];

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes >= endMinutes) return [];

  const slots = [];
  let current = startMinutes;

  while (current + durationMinutes <= endMinutes) {
    const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
    const slotEnd = `${String(Math.floor((current + durationMinutes) / 60)).padStart(2, '0')}:${String((current + durationMinutes) % 60).padStart(2, '0')}`;
    slots.push({ start: slotStart, end: slotEnd });
    current += durationMinutes;
  }

  return slots;
}
