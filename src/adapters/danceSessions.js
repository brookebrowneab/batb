/**
 * Dance scheduling adapter — config-driven dance assignments.
 */
import { supabase } from './supabase.js';

async function fetchDanceWindowsFromConfigInternal() {
  const { data, error } = await supabase
    .from('audition_window_config')
    .select('id, audition_date, dance_start_time, dance_end_time')
    .not('dance_start_time', 'is', null)
    .not('dance_end_time', 'is', null)
    .order('audition_date', { ascending: true });

  const windows = (data || []).map((row) => ({
    id: row.id,
    audition_date: row.audition_date,
    start_time: row.dance_start_time,
    end_time: row.dance_end_time,
    label: null,
  }));

  return { data: windows, error };
}

/**
 * Fetch dance windows derived from scheduling config.
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchDanceWindowsFromConfig() {
  return fetchDanceWindowsFromConfigInternal();
}

/**
 * Fetch assigned dance roster.
 * Every registration-complete student is assigned to each configured dance window.
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchAssignedDanceRoster() {
  const [{ data: windows, error: windowsError }, studentsResult] = await Promise.all([
    fetchDanceWindowsFromConfigInternal(),
    supabase
      .from('students')
      .select('id, first_name, last_name, grade, registration_complete')
      .eq('registration_complete', true)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true }),
  ]);

  if (windowsError) return { data: [], error: windowsError };
  if (studentsResult.error) return { data: [], error: studentsResult.error };

  const roster = [];
  for (const window of windows || []) {
    for (const student of studentsResult.data || []) {
      roster.push({
        id: `${student.id}_${window.id}`,
        student_id: student.id,
        dance_window_id: window.id,
        students: student,
        dance_window: window,
      });
    }
  }

  return { data: roster, error: null };
}

/**
 * Compatibility alias used by exports.
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchDanceRoster() {
  return fetchAssignedDanceRoster();
}
