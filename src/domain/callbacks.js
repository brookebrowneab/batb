/**
 * Callbacks domain logic — pure functions, no side effects.
 *
 * Handles callback invite gating, notification template generation,
 * and validation for callback-related operations.
 */

import { formatTime } from './scheduling.js';

/**
 * Check if a student is invited to callbacks.
 * @param {object|null} student - { callback_invited: boolean }
 * @returns {boolean}
 */
export function isCallbackInvited(student) {
  return student?.callback_invited === true;
}

/**
 * Determine what callback info a student should see.
 * @param {object|null} student - { callback_invited: boolean }
 * @param {Array} configs - audition_window_config rows
 * @returns {{ visible: boolean, message: string, windows: Array<{ date: string, start: string, end: string }> }}
 */
export function getCallbackVisibility(student, configs) {
  if (!student || !isCallbackInvited(student)) {
    return {
      visible: false,
      message: 'You have not been invited to callbacks.',
      windows: [],
    };
  }

  const windows = (configs || [])
    .filter((c) => c.callback_start_time && c.callback_end_time)
    .map((c) => ({
      date: c.audition_date,
      start: c.callback_start_time,
      end: c.callback_end_time,
    }));

  return {
    visible: true,
    message: 'You are invited to callbacks!',
    windows,
  };
}

/**
 * Generate the callback notification email content.
 * @param {object} student - { first_name, last_name, parent_first_name }
 * @param {Array} configs - audition_window_config rows (will be filtered to those with callback times)
 * @returns {{ subject: string, body: string, bodyPreview: string }}
 */
export function generateCallbackNotificationContent(student, configs) {
  const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'your student';
  const parentGreeting = student.parent_first_name
    ? `Dear ${student.parent_first_name},`
    : 'Dear Parent/Guardian,';

  const callbackWindows = (configs || [])
    .filter((c) => c.callback_start_time && c.callback_end_time);

  let windowLines = '';
  if (callbackWindows.length > 0) {
    windowLines = callbackWindows
      .map((c) => `  - ${c.audition_date}: ${formatTime(c.callback_start_time)} – ${formatTime(c.callback_end_time)}`)
      .join('\n');
  } else {
    windowLines = '  - Callback times will be announced soon.';
  }

  const subject = 'Callback Invitation — BATB Auditions';

  const body = [
    parentGreeting,
    '',
    `Congratulations! ${studentName} has been invited to callbacks for the BATB auditions.`,
    '',
    'Callback Schedule:',
    windowLines,
    '',
    'Please ensure your student arrives on time. No sign-up is required — just attend during the scheduled window.',
    '',
    'If you have any questions, please contact the audition team.',
    '',
    'Thank you,',
    'BATB Audition Team',
  ].join('\n');

  const bodyPreview = body.length > 200 ? body.slice(0, 200) + '…' : body;

  return { subject, body, bodyPreview };
}

/**
 * Validate that a student has the required parent_email for notification.
 * @param {object|null} student - { parent_email }
 * @returns {{ valid: boolean, reason: string|null }}
 */
export function validateNotificationRecipient(student) {
  if (!student) {
    return { valid: false, reason: 'Student not found.' };
  }
  if (!student.parent_email || !student.parent_email.trim()) {
    return { valid: false, reason: 'No parent email on file.' };
  }
  return { valid: true, reason: null };
}
