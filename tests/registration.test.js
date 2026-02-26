import { describe, it, expect } from 'vitest';
import {
  hasRequiredStudentFields,
  hasRequiredParentFields,
  hasPhoto,
  hasValidAcceptance,
  evaluateRegistration,
} from '../src/domain/registration.js';

// --- hasRequiredStudentFields ---

describe('hasRequiredStudentFields', () => {
  it('returns false for null student', () => {
    expect(hasRequiredStudentFields(null)).toBe(false);
  });

  it('returns false when first_name is missing', () => {
    expect(hasRequiredStudentFields({ last_name: 'Doe', grade: '5' })).toBe(false);
  });

  it('returns false when last_name is missing', () => {
    expect(hasRequiredStudentFields({ first_name: 'Jane', grade: '5' })).toBe(false);
  });

  it('returns false when grade is missing', () => {
    expect(hasRequiredStudentFields({ first_name: 'Jane', last_name: 'Doe' })).toBe(false);
  });

  it('returns false when a field is whitespace only', () => {
    expect(hasRequiredStudentFields({ first_name: '  ', last_name: 'Doe', grade: '5' })).toBe(
      false,
    );
  });

  it('returns true when all required fields present', () => {
    expect(hasRequiredStudentFields({ first_name: 'Jane', last_name: 'Doe', grade: '5' })).toBe(
      true,
    );
  });
});

// --- hasRequiredParentFields ---

describe('hasRequiredParentFields', () => {
  it('returns false for null student', () => {
    expect(hasRequiredParentFields(null)).toBe(false);
  });

  it('returns false when parent_first_name is missing', () => {
    expect(
      hasRequiredParentFields({
        parent_last_name: 'Doe',
        parent_email: 'a@b.com',
        parent_phone: '555',
      }),
    ).toBe(false);
  });

  it('returns false when parent_email is missing', () => {
    expect(
      hasRequiredParentFields({
        parent_first_name: 'John',
        parent_last_name: 'Doe',
        parent_phone: '555',
      }),
    ).toBe(false);
  });

  it('returns false when parent_phone is missing', () => {
    expect(
      hasRequiredParentFields({
        parent_first_name: 'John',
        parent_last_name: 'Doe',
        parent_email: 'a@b.com',
      }),
    ).toBe(false);
  });

  it('returns true when all parent fields present', () => {
    expect(
      hasRequiredParentFields({
        parent_first_name: 'John',
        parent_last_name: 'Doe',
        parent_email: 'john@example.com',
        parent_phone: '555-1234',
      }),
    ).toBe(true);
  });
});

// --- hasPhoto ---

describe('hasPhoto', () => {
  it('returns false for null student', () => {
    expect(hasPhoto(null)).toBe(false);
  });

  it('returns false when photo_storage_path is missing', () => {
    expect(hasPhoto({ first_name: 'Jane' })).toBe(false);
  });

  it('returns false when photo_storage_path is empty string', () => {
    expect(hasPhoto({ photo_storage_path: '' })).toBe(false);
  });

  it('returns true when photo_storage_path is set', () => {
    expect(hasPhoto({ photo_storage_path: 'photos/abc-123.jpg' })).toBe(true);
  });
});

// --- hasValidAcceptance ---

describe('hasValidAcceptance', () => {
  it('returns false for null acceptances', () => {
    expect(hasValidAcceptance(null, 'c1')).toBe(false);
  });

  it('returns false for null activeContractId', () => {
    expect(
      hasValidAcceptance(
        [
          {
            contract_id: 'c1',
            student_typed_signature: 'A',
            parent_typed_signature: 'B',
          },
        ],
        null,
      ),
    ).toBe(false);
  });

  it('returns false when no matching acceptance', () => {
    const acceptances = [
      { contract_id: 'c1', student_typed_signature: 'A', parent_typed_signature: 'B' },
    ];
    expect(hasValidAcceptance(acceptances, 'c2')).toBe(false);
  });

  it('returns false when matching acceptance has empty student signature', () => {
    const acceptances = [
      { contract_id: 'c1', student_typed_signature: '', parent_typed_signature: 'B' },
    ];
    expect(hasValidAcceptance(acceptances, 'c1')).toBe(false);
  });

  it('returns false when matching acceptance has empty parent signature', () => {
    const acceptances = [
      { contract_id: 'c1', student_typed_signature: 'A', parent_typed_signature: '' },
    ];
    expect(hasValidAcceptance(acceptances, 'c1')).toBe(false);
  });

  it('returns true when matching acceptance has both signatures', () => {
    const acceptances = [
      { contract_id: 'c1', student_typed_signature: 'A', parent_typed_signature: 'B' },
    ];
    expect(hasValidAcceptance(acceptances, 'c1')).toBe(true);
  });
});

// --- evaluateRegistration (integration of all checks) ---

describe('evaluateRegistration', () => {
  const completeStudent = {
    first_name: 'Jane',
    last_name: 'Doe',
    grade: '5',
    parent_first_name: 'John',
    parent_last_name: 'Doe',
    parent_email: 'john@example.com',
    parent_phone: '555-1234',
    photo_storage_path: 'uid123/abc-uuid.jpg',
  };

  const validAcceptance = {
    contract_id: 'active-contract',
    student_typed_signature: 'Jane Doe',
    parent_typed_signature: 'John Doe',
  };

  it('returns complete when all requirements met', () => {
    const result = evaluateRegistration(completeStudent, [validAcceptance], 'active-contract');
    expect(result.complete).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('returns incomplete when student fields missing', () => {
    const student = { ...completeStudent, first_name: '' };
    const result = evaluateRegistration(student, [validAcceptance], 'active-contract');
    expect(result.complete).toBe(false);
    expect(result.missing).toContain('Required student information (name, grade)');
  });

  it('returns incomplete when parent fields missing', () => {
    const student = { ...completeStudent, parent_email: '' };
    const result = evaluateRegistration(student, [validAcceptance], 'active-contract');
    expect(result.complete).toBe(false);
    expect(result.missing).toContain('Parent/guardian information');
  });

  it('returns incomplete when photo missing', () => {
    const student = { ...completeStudent, photo_storage_path: '' };
    const result = evaluateRegistration(student, [validAcceptance], 'active-contract');
    expect(result.complete).toBe(false);
    expect(result.missing).toContain('Student photo');
  });

  it('returns incomplete when contract acceptance missing', () => {
    const result = evaluateRegistration(completeStudent, [], 'active-contract');
    expect(result.complete).toBe(false);
    expect(result.missing).toContain('Contract signature (student and parent)');
  });

  it('returns incomplete when acceptance is for wrong contract version', () => {
    const oldAcceptance = { ...validAcceptance, contract_id: 'old-contract' };
    const result = evaluateRegistration(completeStudent, [oldAcceptance], 'active-contract');
    expect(result.complete).toBe(false);
  });

  it('returns all four missing items when nothing is done', () => {
    const emptyStudent = {};
    const result = evaluateRegistration(emptyStudent, [], 'active-contract');
    expect(result.complete).toBe(false);
    expect(result.missing).toHaveLength(4);
  });

  it('returns incomplete when no active contract exists', () => {
    const result = evaluateRegistration(completeStudent, [validAcceptance], null);
    expect(result.complete).toBe(false);
  });

  it('prior acceptance for old version does not satisfy new active version', () => {
    const oldAcceptance = { ...validAcceptance, contract_id: 'v1' };
    const newAcceptance = { ...validAcceptance, contract_id: 'v2' };
    const result1 = evaluateRegistration(completeStudent, [oldAcceptance], 'v2');
    expect(result1.complete).toBe(false);

    const result2 = evaluateRegistration(completeStudent, [oldAcceptance, newAcceptance], 'v2');
    expect(result2.complete).toBe(true);
  });
});
