/**
 * Role preferences and vocal day assignment adapter — Supabase operations.
 */
import { supabase } from './supabase.js';

// ============================================================
// Audition Settings
// ============================================================

export async function fetchAuditionSettings() {
  const { data, error } = await supabase
    .from('audition_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  return { data, error };
}

export async function updateAuditionSettings(fields, staffUserId) {
  // Get the singleton row first
  const { data: existing } = await supabase
    .from('audition_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (!existing) {
    // Create if doesn't exist
    const { data, error } = await supabase
      .from('audition_settings')
      .insert({ ...fields, updated_by_staff_user_id: staffUserId })
      .select()
      .single();
    return { data, error };
  }

  const { data, error } = await supabase
    .from('audition_settings')
    .update({ ...fields, updated_by_staff_user_id: staffUserId, updated_at: new Date().toISOString() })
    .eq('id', existing.id)
    .select()
    .single();
  return { data, error };
}

// ============================================================
// Audition Roles
// ============================================================

export async function fetchAuditionRoles() {
  const { data, error } = await supabase
    .from('audition_roles')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });
  return { data: data || [], error };
}

export async function fetchRoleDayMappings() {
  const { data, error } = await supabase
    .from('vocal_role_day_mappings')
    .select('*');
  return { data: data || [], error };
}

export async function upsertRoleDayMapping(roleId, auditionDate, staffUserId) {
  const { data, error } = await supabase
    .from('vocal_role_day_mappings')
    .upsert({
      audition_role_id: roleId,
      audition_date: auditionDate,
      created_by_staff_user_id: staffUserId,
      updated_by_staff_user_id: staffUserId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'audition_role_id' })
    .select()
    .single();
  return { data, error };
}

export async function deleteRoleDayMapping(roleId) {
  const { error } = await supabase
    .from('vocal_role_day_mappings')
    .delete()
    .eq('audition_role_id', roleId);
  return { error };
}

export async function createAuditionRole(name, displayOrder, staffUserId) {
  const { data, error } = await supabase
    .from('audition_roles')
    .insert({
      name,
      display_order: displayOrder,
      created_by_staff_user_id: staffUserId,
      updated_by_staff_user_id: staffUserId,
    })
    .select()
    .single();
  return { data, error };
}

export async function updateAuditionRole(roleId, fields, staffUserId) {
  const { data, error } = await supabase
    .from('audition_roles')
    .update({ ...fields, updated_by_staff_user_id: staffUserId, updated_at: new Date().toISOString() })
    .eq('id', roleId)
    .select()
    .single();
  return { data, error };
}

export async function deleteAuditionRole(roleId) {
  const { error } = await supabase
    .from('audition_roles')
    .delete()
    .eq('id', roleId);
  return { error };
}

// ============================================================
// Student Role Preferences
// ============================================================

export async function fetchRolePreferencesForStudent(studentId) {
  const { data, error } = await supabase
    .from('student_role_preferences')
    .select('*, audition_roles(id, name)')
    .eq('student_id', studentId)
    .order('rank_order', { ascending: true });
  return { data: data || [], error };
}

/**
 * Save role preferences atomically: delete all existing, then insert new.
 * @param {string} studentId
 * @param {Array<{roleId: string, rank: number}>} preferences
 * @param {string} userId
 */
export async function saveRolePreferences(studentId, preferences, userId) {
  // Delete existing
  const { error: deleteError } = await supabase
    .from('student_role_preferences')
    .delete()
    .eq('student_id', studentId);

  if (deleteError) return { error: deleteError };

  if (preferences.length === 0) return { error: null };

  // Insert new
  const rows = preferences.map((p) => ({
    student_id: studentId,
    audition_role_id: p.roleId,
    rank_order: p.rank,
    created_by_user_id: userId,
    updated_by_user_id: userId,
  }));

  const { error } = await supabase
    .from('student_role_preferences')
    .insert(rows);
  return { error };
}

// ============================================================
// Staff Views
// ============================================================

export async function fetchAllStudentsWithPreferences() {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id, first_name, last_name, grade, parent_email, parent_first_name,
      registration_complete, callback_invited,
      parent2_email, parent2_first_name, student_email, sings_own_disney_song, song_name,
      student_role_preferences(id, audition_role_id, rank_order, audition_roles(id, name))
    `)
    .eq('registration_complete', true)
    .order('last_name', { ascending: true });

  // Normalize nested data
  const students = (data || []).map((s) => ({
    ...s,
    role_preferences: s.student_role_preferences || [],
  }));

  return { data: students, error };
}

export async function fetchAllVocalDayAssignments() {
  const { data, error } = await supabase
    .from('vocal_day_assignments')
    .select('*, students(id, first_name, last_name, grade, parent_email, parent_first_name, parent2_email, parent2_first_name, student_email, sings_own_disney_song, song_name)')
    .order('audition_date', { ascending: true });
  return { data: data || [], error };
}

// ============================================================
// Day Assignments (via RPC)
// ============================================================

export async function assignVocalDay(studentId, auditionDate) {
  const { data, error } = await supabase.rpc('assign_vocal_day', {
    p_student_id: studentId,
    p_audition_date: auditionDate,
  });
  return { data, error };
}

export async function unassignVocalDay(studentId) {
  const { data, error } = await supabase.rpc('unassign_vocal_day', {
    p_student_id: studentId,
  });
  return { data, error };
}

export async function autoAssignVocalDayForRegistration(studentId) {
  const { data, error } = await supabase.rpc('auto_assign_vocal_day_for_registration', {
    p_student_id: studentId,
  });
  return { data, error };
}

// ============================================================
// Family Views
// ============================================================

export async function fetchVocalDayAssignmentForStudent(studentId) {
  const { data, error } = await supabase
    .from('vocal_day_assignments')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();
  return { data, error };
}

// ============================================================
// Notifications
// ============================================================

export async function logDayAssignmentNotification(studentId, recipientEmail, subject, bodyPreview) {
  const { data, error } = await supabase.rpc('log_notification_send', {
    p_student_id: studentId,
    p_recipient_email: recipientEmail,
    p_subject: subject,
    p_body_preview: bodyPreview,
  });
  return { data, error };
}

// ============================================================
// Registration Schedule Email Template (admin)
// ============================================================

export async function fetchRegistrationEmailTemplate() {
  const { data, error } = await supabase
    .from('registration_email_templates')
    .select('*')
    .eq('template_key', 'registration_schedule')
    .maybeSingle();
  return { data, error };
}

export async function upsertRegistrationEmailTemplate(fields, staffUserId) {
  const payload = {
    template_key: 'registration_schedule',
    ...fields,
    updated_by_staff_user_id: staffUserId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('registration_email_templates')
    .upsert(payload, { onConflict: 'template_key' })
    .select()
    .single();
  return { data, error };
}
