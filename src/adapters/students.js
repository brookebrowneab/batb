/**
 * Students adapter — Supabase operations for student records.
 */
import { supabase } from './supabase.js';

/**
 * Fetch students belonging to the current family user.
 * @param {string} familyAccountId - auth.uid()
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchStudentsByFamily(familyAccountId) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('family_account_id', familyAccountId)
    .order('created_at', { ascending: true });
  return { data: data || [], error };
}

/**
 * Create a new student record for a family.
 * @param {object} params
 * @param {string} params.familyAccountId
 * @param {string} params.firstName
 * @param {string} params.lastName
 * @param {string} params.grade
 * @param {string} params.createdByUserId
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function createStudent({ familyAccountId, firstName, lastName, grade, createdByUserId }) {
  const { data, error } = await supabase
    .from('students')
    .insert({
      family_account_id: familyAccountId,
      first_name: firstName,
      last_name: lastName,
      grade: grade,
      created_by_user_id: createdByUserId,
      updated_by_user_id: createdByUserId,
    })
    .select()
    .single();
  return { data, error };
}

/**
 * Update a student record.
 * @param {string} studentId
 * @param {object} fields - partial update fields
 * @param {string} updatedByUserId
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function updateStudent(studentId, fields, updatedByUserId) {
  const { data, error } = await supabase
    .from('students')
    .update({
      ...fields,
      updated_by_user_id: updatedByUserId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId)
    .select()
    .single();
  return { data, error };
}
