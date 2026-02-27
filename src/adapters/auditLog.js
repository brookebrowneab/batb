/**
 * Audit log adapter — Supabase operations for admin audit trail.
 */
import { supabase } from './supabase.js';

/**
 * Log an admin audit entry via RPC.
 * @param {string} action - e.g. 'create_config', 'update_config'
 * @param {string} tableName - e.g. 'audition_window_config'
 * @param {string} recordId - UUID of affected record
 * @param {object} details - contextual info (JSONB)
 * @returns {Promise<{data: string|null, error: Error|null}>}
 */
export async function logAuditEntry(action, tableName, recordId, details = {}) {
  const { data: userData } = await supabase.auth.getUser();
  const actorId = userData?.user?.id;
  if (!actorId) return { data: null, error: { message: 'Not authenticated.' } };

  const { data, error } = await supabase.rpc('log_admin_audit', {
    p_action: action,
    p_actor_id: actorId,
    p_table_name: tableName,
    p_record_id: recordId,
    p_details: details,
  });
  return { data, error };
}

/**
 * Fetch recent audit log entries (staff only).
 * @param {number} limit - max entries to return (default 100)
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchAuditLog(limit = 100) {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
}
