/**
 * Dance sessions adapter — Supabase operations for dance sessions and sign-ups.
 */
import { supabase } from './supabase.js';

/**
 * Fetch all dance sessions ordered by date and start time.
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchAllDanceSessions() {
  const { data, error } = await supabase
    .from('dance_sessions')
    .select('*')
    .order('audition_date', { ascending: true })
    .order('start_time', { ascending: true });
  return { data: data || [], error };
}

/**
 * Generate dance sessions from audition window config.
 * Creates one session per config row that has dance times configured.
 * Skips dates that already have a session at the same start time.
 * @param {string} staffUserId
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function generateDanceSessionsFromConfig(staffUserId) {
  // Fetch configs that have dance windows set
  const { data: configs, error: fetchError } = await supabase
    .from('audition_window_config')
    .select('audition_date, dance_start_time, dance_end_time')
    .not('dance_start_time', 'is', null)
    .not('dance_end_time', 'is', null)
    .order('audition_date', { ascending: true });

  if (fetchError) return { data: null, error: fetchError };
  if (!configs || configs.length === 0) return { data: [], error: null };

  // Fetch existing sessions to avoid duplicates
  const { data: existing } = await supabase
    .from('dance_sessions')
    .select('audition_date, start_time');

  const existingKeys = new Set(
    (existing || []).map((s) => `${s.audition_date}_${s.start_time}`),
  );

  const toInsert = configs
    .filter((c) => !existingKeys.has(`${c.audition_date}_${c.dance_start_time}`))
    .map((c) => ({
      audition_date: c.audition_date,
      start_time: c.dance_start_time,
      end_time: c.dance_end_time,
      created_by_staff_user_id: staffUserId,
    }));

  if (toInsert.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from('dance_sessions')
    .insert(toInsert)
    .select();
  return { data: data || [], error };
}

/**
 * Create a single dance session manually (staff).
 * @param {object} session
 * @param {string} staffUserId
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function createDanceSession(session, staffUserId) {
  const { data, error } = await supabase
    .from('dance_sessions')
    .insert({
      audition_date: session.audition_date,
      start_time: session.start_time,
      end_time: session.end_time,
      capacity: session.capacity || null,
      label: session.label || null,
      created_by_staff_user_id: staffUserId,
    })
    .select()
    .single();
  return { data, error };
}

/**
 * Delete a dance session (admin only via RLS).
 * @param {string} sessionId
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteDanceSession(sessionId) {
  const { error } = await supabase
    .from('dance_sessions')
    .delete()
    .eq('id', sessionId);
  return { error };
}

/**
 * Fetch the dance sign-up for a specific student, with joined session data.
 * @param {string} studentId
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function fetchDanceSignupForStudent(studentId) {
  const { data, error } = await supabase
    .from('dance_signups')
    .select('*, dance_sessions(*)')
    .eq('student_id', studentId)
    .maybeSingle();
  return { data, error };
}

/**
 * Sign up for or change a dance session (family use, via RPC).
 * @param {string} studentId
 * @param {string} danceSessionId
 * @returns {Promise<{data: string|null, error: Error|null}>}
 */
export async function upsertDanceSignup(studentId, danceSessionId) {
  const { data, error } = await supabase.rpc('upsert_dance_signup', {
    p_student_id: studentId,
    p_dance_session_id: danceSessionId,
  });
  return { data, error };
}

/**
 * Cancel a dance sign-up (family use, via RPC).
 * @param {string} studentId
 * @returns {Promise<{data: null, error: Error|null}>}
 */
export async function cancelDanceSignup(studentId) {
  const { data, error } = await supabase.rpc('delete_dance_signup', {
    p_student_id: studentId,
  });
  return { data, error };
}

/**
 * Admin override: assign or change a student's dance session (no lock check).
 * @param {string} studentId
 * @param {string} danceSessionId
 * @returns {Promise<{data: string|null, error: Error|null}>}
 */
export async function adminUpdateDanceSignup(studentId, danceSessionId) {
  const { data, error } = await supabase.rpc('admin_update_dance_signup', {
    p_student_id: studentId,
    p_dance_session_id: danceSessionId,
  });
  return { data, error };
}

/**
 * Fetch all dance sign-ups with student and session data (staff roster view).
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchDanceRoster() {
  const { data, error } = await supabase
    .from('dance_signups')
    .select(
      `
      id,
      student_id,
      dance_session_id,
      created_at,
      students(id, first_name, last_name, grade),
      dance_sessions(id, audition_date, start_time, end_time, label)
    `,
    )
    .order('created_at', { ascending: true });
  return { data: data || [], error };
}

/**
 * Fetch sign-up counts per dance session (for capacity display).
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchSignupCountsBySession() {
  const { data, error } = await supabase
    .from('dance_signups')
    .select('dance_session_id');
  if (error) return { data: null, error };
  const counts = {};
  (data || []).forEach((row) => {
    counts[row.dance_session_id] = (counts[row.dance_session_id] || 0) + 1;
  });
  return { data: counts, error: null };
}
