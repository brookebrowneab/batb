import { supabase } from './supabase.js';

/**
 * Send a real email via Supabase Edge Function.
 * This keeps provider API keys off the frontend.
 * @param {object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} params.text
 * @param {string|null} [params.html]
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function sendNotificationEmail({ to, subject, text, html = null }) {
  const { data, error } = await supabase.functions.invoke('send-notification-email', {
    body: { to, subject, text, html },
  });
  return { data, error };
}

/**
 * Trigger registration-completion schedule email for a family-owned student.
 * The edge function computes schedule tokens, auto-assigns vocal day by role mapping,
 * and sends the email via Resend.
 * @param {string} studentId
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function sendRegistrationScheduleEmail(studentId) {
  const { data, error } = await supabase.functions.invoke('send-registration-schedule-email', {
    body: { studentId },
  });
  return { data, error };
}
