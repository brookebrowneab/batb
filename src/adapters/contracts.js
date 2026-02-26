/**
 * Contracts adapter — Supabase operations for contracts and acceptances.
 */
import { supabase } from './supabase.js';

/**
 * Fetch all contracts ordered by version number.
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchAllContracts() {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('version_number', { ascending: true });
  return { data: data || [], error };
}

/**
 * Fetch the currently active contract.
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function fetchActiveContract() {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();
  return { data, error };
}

/**
 * Create a new contract version (admin only).
 * @param {number} versionNumber
 * @param {string} textSnapshot
 * @param {string} staffUserId
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function createContract(versionNumber, textSnapshot, staffUserId) {
  const { data, error } = await supabase
    .from('contracts')
    .insert({
      version_number: versionNumber,
      text_snapshot: textSnapshot,
      is_active: false,
      created_by_staff_user_id: staffUserId,
    })
    .select()
    .single();
  return { data, error };
}

/**
 * Set a contract as active (admin only).
 * First deactivates all contracts, then activates the specified one.
 * @param {string} contractId
 * @returns {Promise<{error: Error|null}>}
 */
export async function setActiveContract(contractId) {
  // Deactivate all contracts first
  const { error: deactivateError } = await supabase
    .from('contracts')
    .update({ is_active: false })
    .eq('is_active', true);

  if (deactivateError) return { error: deactivateError };

  // Activate the target contract
  const { error: activateError } = await supabase
    .from('contracts')
    .update({ is_active: true })
    .eq('id', contractId);

  return { error: activateError };
}

/**
 * Fetch contract acceptances for a student.
 * @param {string} studentId
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchAcceptancesForStudent(studentId) {
  const { data, error } = await supabase
    .from('contract_acceptances')
    .select('*, contracts(version_number, text_snapshot)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true });
  return { data: data || [], error };
}

/**
 * Submit a contract acceptance (family user).
 * @param {object} params
 * @param {string} params.studentId
 * @param {string} params.contractId
 * @param {string} params.studentTypedSignature
 * @param {string} params.parentTypedSignature
 * @param {string} params.signedByUserId
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function submitAcceptance({
  studentId,
  contractId,
  studentTypedSignature,
  parentTypedSignature,
  signedByUserId,
}) {
  const { data, error } = await supabase
    .from('contract_acceptances')
    .insert({
      student_id: studentId,
      contract_id: contractId,
      student_typed_signature: studentTypedSignature,
      parent_typed_signature: parentTypedSignature,
      signed_by_user_id: signedByUserId,
    })
    .select()
    .single();
  return { data, error };
}
