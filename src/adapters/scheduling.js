/**
 * Scheduling adapter — Supabase operations for audition window config.
 */
import { supabase } from './supabase.js';

/**
 * Fetch all audition window configs ordered by date.
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchAllConfigs() {
  const { data, error } = await supabase
    .from('audition_window_config')
    .select('*')
    .order('audition_date', { ascending: true });
  return { data: data || [], error };
}

/**
 * Create a new audition window config (staff only).
 * @param {object} config
 * @param {string} staffUserId
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function createConfig(config, staffUserId) {
  const { data, error } = await supabase
    .from('audition_window_config')
    .insert({
      audition_date: config.audition_date,
      dance_start_time: config.dance_start_time || null,
      dance_end_time: config.dance_end_time || null,
      vocal_start_time: config.vocal_start_time || null,
      vocal_end_time: config.vocal_end_time || null,
      callback_start_time: config.callback_start_time || null,
      callback_end_time: config.callback_end_time || null,
      created_by_staff_user_id: staffUserId,
      updated_by_staff_user_id: staffUserId,
    })
    .select()
    .single();
  return { data, error };
}

/**
 * Update an existing audition window config (staff only).
 * @param {string} configId
 * @param {object} fields
 * @param {string} staffUserId
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function updateConfig(configId, fields, staffUserId) {
  const { data, error } = await supabase
    .from('audition_window_config')
    .update({
      ...fields,
      updated_by_staff_user_id: staffUserId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', configId)
    .select()
    .single();
  return { data, error };
}

/**
 * Delete an audition window config (admin only).
 * @param {string} configId
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteConfig(configId) {
  const { error } = await supabase.from('audition_window_config').delete().eq('id', configId);
  return { error };
}
