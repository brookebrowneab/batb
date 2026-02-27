/**
 * Evaluations adapter — Supabase operations for student evaluation notes.
 */
import { supabase } from './supabase.js';

/**
 * Fetch all evaluations for a student, with staff profile joins.
 * @param {string} studentId
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchEvaluationsForStudent(studentId) {
  const { data, error } = await supabase
    .from('student_evaluations')
    .select('*, staff_profiles:staff_user_id(id, display_name, role)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

/**
 * Create a new evaluation note.
 * @param {string} studentId
 * @param {string} staffUserId
 * @param {string} track - 'dance'|'vocal'|'callbacks'|'general'
 * @param {string} notes
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function createEvaluation(studentId, staffUserId, track, notes) {
  const { data, error } = await supabase
    .from('student_evaluations')
    .insert({
      student_id: studentId,
      staff_user_id: staffUserId,
      track,
      notes,
    })
    .select()
    .single();
  return { data, error };
}

/**
 * Update an existing evaluation note (staff can only update own via RLS).
 * @param {string} evaluationId
 * @param {string} notes
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function updateEvaluation(evaluationId, notes) {
  const { data, error } = await supabase
    .from('student_evaluations')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', evaluationId)
    .select()
    .single();
  return { data, error };
}

/**
 * Delete an evaluation (admin only via RLS).
 * @param {string} evaluationId
 * @returns {Promise<{data: null, error: Error|null}>}
 */
export async function deleteEvaluation(evaluationId) {
  const { data, error } = await supabase
    .from('student_evaluations')
    .delete()
    .eq('id', evaluationId);
  return { data, error };
}
