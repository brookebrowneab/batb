/**
 * Contract domain logic — pure functions, no side effects.
 *
 * Handles contract version selection and validation rules.
 */

/**
 * Find the active contract from a list of contracts.
 * @param {Array<{id: string, version_number: number, is_active: boolean}>} contracts
 * @returns {object|null} the active contract, or null if none
 */
export function getActiveContract(contracts) {
  if (!contracts || contracts.length === 0) return null;
  return contracts.find((c) => c.is_active) || null;
}

/**
 * Get the next version number for a new contract.
 * @param {Array<{version_number: number}>} contracts
 * @returns {number}
 */
export function getNextVersionNumber(contracts) {
  if (!contracts || contracts.length === 0) return 1;
  const max = Math.max(...contracts.map((c) => c.version_number));
  return max + 1;
}

/**
 * Check if a student has accepted a specific contract version.
 * @param {Array<{contract_id: string}>} acceptances - acceptances for a student
 * @param {string} contractId
 * @returns {boolean}
 */
export function hasAcceptedContract(acceptances, contractId) {
  if (!acceptances || !contractId) return false;
  return acceptances.some((a) => a.contract_id === contractId);
}

/**
 * Validate acceptance input (both signatures must be non-empty strings).
 * @param {string} studentSignature
 * @param {string} parentSignature
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAcceptanceInput(studentSignature, parentSignature) {
  const errors = [];
  if (!studentSignature || studentSignature.trim().length === 0) {
    errors.push('Student typed signature is required.');
  }
  if (!parentSignature || parentSignature.trim().length === 0) {
    errors.push('Parent typed signature is required.');
  }
  return { valid: errors.length === 0, errors };
}
