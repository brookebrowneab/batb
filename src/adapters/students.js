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
export async function createStudent({ familyAccountId, firstName, lastName, grade, studentEmail, createdByUserId }) {
  const row = {
    family_account_id: familyAccountId,
    first_name: firstName,
    last_name: lastName,
    grade: grade,
    created_by_user_id: createdByUserId,
    updated_by_user_id: createdByUserId,
  };
  if (studentEmail) row.student_email = studentEmail;
  const { data, error } = await supabase
    .from('students')
    .insert(row)
    .select()
    .single();
  return { data, error };
}

/**
 * Fetch a single student by ID (staff use — staff RLS allows reading all students).
 * @param {string} studentId
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function fetchStudentForStaff(studentId) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
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

/**
 * Delete a student record (family can delete own student via RLS policy).
 * @param {string} studentId
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteStudent(studentId) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);
  return { error };
}

/**
 * Fetch all student registrations for admin/staff reporting.
 * Includes role preference rows so pages can filter by role.
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchRegistrationsForAdmin() {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id, first_name, last_name, grade, registration_complete,
      parent_first_name, parent_last_name, parent_email,
      callback_invited, created_at, updated_at,
      student_role_preferences(id, audition_role_id, rank_order, audition_roles(id, name))
    `)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  const students = (data || []).map((student) => ({
    ...student,
    role_preferences: student.student_role_preferences || [],
  }));

  return { data: students, error };
}
