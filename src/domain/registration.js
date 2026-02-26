/**
 * Registration completeness evaluator — pure functions, no side effects.
 *
 * Registration is complete only when ALL of the following are true:
 * 1. Required student fields are filled (first_name, last_name, grade)
 * 2. Required parent fields are filled (parent_first_name, parent_last_name, parent_email, parent_phone)
 * 3. Photo has been uploaded (photo_storage_path is non-empty)
 * 4. A contract acceptance exists for the active contract version,
 *    with both student and parent typed signatures
 */

function filled(val) {
  return Boolean(val && typeof val === 'string' && val.trim());
}

/**
 * Check if all required student fields are present.
 * @param {object} student
 * @returns {boolean}
 */
export function hasRequiredStudentFields(student) {
  if (!student) return false;
  return filled(student.first_name) && filled(student.last_name) && filled(student.grade);
}

/**
 * Check if all required parent/guardian fields are present.
 * @param {object} student
 * @returns {boolean}
 */
export function hasRequiredParentFields(student) {
  if (!student) return false;
  return (
    filled(student.parent_first_name) &&
    filled(student.parent_last_name) &&
    filled(student.parent_email) &&
    filled(student.parent_phone)
  );
}

/**
 * Check if the student has an uploaded photo.
 * @param {object} student
 * @returns {boolean}
 */
export function hasPhoto(student) {
  if (!student) return false;
  return filled(student.photo_storage_path);
}

/**
 * Check if a valid contract acceptance exists for the active contract.
 * @param {Array<{contract_id: string, student_typed_signature: string, parent_typed_signature: string}>} acceptances
 * @param {string|null} activeContractId
 * @returns {boolean}
 */
export function hasValidAcceptance(acceptances, activeContractId) {
  if (!acceptances || !activeContractId) return false;
  return acceptances.some(
    (a) =>
      a.contract_id === activeContractId &&
      filled(a.student_typed_signature) &&
      filled(a.parent_typed_signature),
  );
}

/**
 * Evaluate full registration completeness.
 * @param {object} student - student record
 * @param {Array} acceptances - contract acceptances for this student
 * @param {string|null} activeContractId - id of the currently active contract
 * @returns {{ complete: boolean, missing: string[] }}
 */
export function evaluateRegistration(student, acceptances, activeContractId) {
  const missing = [];

  if (!hasRequiredStudentFields(student)) {
    missing.push('Required student information (name, grade)');
  }
  if (!hasRequiredParentFields(student)) {
    missing.push('Parent/guardian information');
  }
  if (!hasPhoto(student)) {
    missing.push('Student photo');
  }
  if (!hasValidAcceptance(acceptances, activeContractId)) {
    missing.push('Contract signature (student and parent)');
  }

  return { complete: missing.length === 0, missing };
}
