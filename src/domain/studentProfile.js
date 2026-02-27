/**
 * Student profile domain logic — pure functions, no side effects.
 *
 * Assembles student profile data for staff display and validates
 * evaluation note inputs.
 */

const VALID_TRACKS = ['dance', 'vocal', 'callbacks', 'general'];

/**
 * Assemble a structured profile summary for staff display.
 * @param {object|null} student - full student row
 * @param {object|null} danceSignup - dance_signups row with session join, or null
 * @param {object|null} vocalBooking - vocal_bookings row with slot join, or null
 * @param {Array} evaluations - student_evaluations rows with staff joins
 * @returns {{ student: object|null, dance: object|null, vocal: object|null, callbackInvited: boolean, evaluations: Array, missingFields: Array<string> }}
 */
export function assembleProfileSummary(student, danceSignup, vocalBooking, evaluations) {
  if (!student) {
    return {
      student: null,
      dance: null,
      vocal: null,
      callbackInvited: false,
      evaluations: [],
      missingFields: ['Student not found'],
    };
  }

  const missingFields = [];
  if (!student.first_name) missingFields.push('first_name');
  if (!student.last_name) missingFields.push('last_name');
  if (!student.grade) missingFields.push('grade');
  if (!student.photo_storage_path) missingFields.push('photo');
  if (!student.parent_first_name) missingFields.push('parent_first_name');
  if (!student.parent_last_name) missingFields.push('parent_last_name');
  if (!student.parent_email) missingFields.push('parent_email');
  if (!student.parent_phone) missingFields.push('parent_phone');

  return {
    student,
    dance: danceSignup || null,
    vocal: vocalBooking || null,
    callbackInvited: student.callback_invited === true,
    evaluations: evaluations || [],
    missingFields,
  };
}

/**
 * Validate evaluation note input before submission.
 * @param {string} notes - the evaluation text
 * @param {string} track - one of 'dance', 'vocal', 'callbacks', 'general'
 * @returns {{ valid: boolean, errors: Array<string> }}
 */
export function validateEvaluationInput(notes, track) {
  const errors = [];

  if (!notes || !notes.trim()) {
    errors.push('Notes cannot be empty.');
  }

  if (!track || !VALID_TRACKS.includes(track)) {
    errors.push(`Track must be one of: ${VALID_TRACKS.join(', ')}.`);
  }

  return { valid: errors.length === 0, errors };
}
