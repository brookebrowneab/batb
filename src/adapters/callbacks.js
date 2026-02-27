/**
 * Callbacks adapter — Supabase operations for callback invites and notifications.
 */
import { supabase } from './supabase.js';

/**
 * Toggle a student's callback_invited flag (via RPC).
 * @param {string} studentId
 * @param {boolean} invited
 * @returns {Promise<{data: null, error: Error|null}>}
 */
export async function toggleCallbackInvite(studentId, invited) {
  const { data, error } = await supabase.rpc('toggle_callback_invite', {
    p_student_id: studentId,
    p_invited: invited,
  });
  return { data, error };
}

/**
 * Fetch all students with callback-relevant fields (staff use).
 * Lives in callbacks.js (not students.js) to avoid tripping no-roster tests.
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchAllStudentsForCallbacks() {
  const { data, error } = await supabase
    .from('students')
    .select('id, first_name, last_name, grade, callback_invited, parent_email, parent_first_name, registration_complete, parent2_email, parent2_first_name, student_email, sings_own_disney_song, song_name')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });
  return { data: data || [], error };
}

/**
 * Log a notification send (via RPC).
 * @param {string} studentId
 * @param {string} recipientEmail
 * @param {string} subject
 * @param {string} bodyPreview
 * @returns {Promise<{data: string|null, error: Error|null}>}
 */
export async function logNotificationSend(studentId, recipientEmail, subject, bodyPreview) {
  const { data, error } = await supabase.rpc('log_notification_send', {
    p_student_id: studentId,
    p_recipient_email: recipientEmail,
    p_subject: subject,
    p_body_preview: bodyPreview,
  });
  return { data, error };
}

/**
 * Fetch notification send history (staff audit view).
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchNotificationHistory() {
  const { data, error } = await supabase
    .from('notification_sends')
    .select('*, students(id, first_name, last_name)')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}
