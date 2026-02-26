import { describe, it, expect } from 'vitest';
import {
  getActiveContract,
  getNextVersionNumber,
  hasAcceptedContract,
  validateAcceptanceInput,
} from '../src/domain/contracts.js';

describe('getActiveContract', () => {
  it('returns null for empty array', () => {
    expect(getActiveContract([])).toBe(null);
  });

  it('returns null for null input', () => {
    expect(getActiveContract(null)).toBe(null);
  });

  it('returns null when no contract is active', () => {
    const contracts = [
      { id: 'a', version_number: 1, is_active: false },
      { id: 'b', version_number: 2, is_active: false },
    ];
    expect(getActiveContract(contracts)).toBe(null);
  });

  it('returns the active contract', () => {
    const contracts = [
      { id: 'a', version_number: 1, is_active: false },
      { id: 'b', version_number: 2, is_active: true },
    ];
    expect(getActiveContract(contracts)).toEqual({ id: 'b', version_number: 2, is_active: true });
  });

  it('returns the first active if multiple exist (should not happen per constraints)', () => {
    const contracts = [
      { id: 'a', version_number: 1, is_active: true },
      { id: 'b', version_number: 2, is_active: true },
    ];
    expect(getActiveContract(contracts).id).toBe('a');
  });
});

describe('getNextVersionNumber', () => {
  it('returns 1 for empty array', () => {
    expect(getNextVersionNumber([])).toBe(1);
  });

  it('returns 1 for null', () => {
    expect(getNextVersionNumber(null)).toBe(1);
  });

  it('returns max + 1', () => {
    const contracts = [{ version_number: 1 }, { version_number: 3 }, { version_number: 2 }];
    expect(getNextVersionNumber(contracts)).toBe(4);
  });
});

describe('hasAcceptedContract', () => {
  it('returns false for null acceptances', () => {
    expect(hasAcceptedContract(null, 'contract-1')).toBe(false);
  });

  it('returns false for null contractId', () => {
    expect(hasAcceptedContract([{ contract_id: 'c1' }], null)).toBe(false);
  });

  it('returns false when no matching acceptance', () => {
    const acceptances = [{ contract_id: 'c1' }, { contract_id: 'c2' }];
    expect(hasAcceptedContract(acceptances, 'c3')).toBe(false);
  });

  it('returns true when matching acceptance exists', () => {
    const acceptances = [{ contract_id: 'c1' }, { contract_id: 'c2' }];
    expect(hasAcceptedContract(acceptances, 'c2')).toBe(true);
  });

  it('preserves prior acceptances (both c1 and c2 remain)', () => {
    const acceptances = [{ contract_id: 'c1' }, { contract_id: 'c2' }];
    expect(hasAcceptedContract(acceptances, 'c1')).toBe(true);
    expect(hasAcceptedContract(acceptances, 'c2')).toBe(true);
  });
});

describe('validateAcceptanceInput', () => {
  it('returns valid when both signatures provided', () => {
    const result = validateAcceptanceInput('John Student', 'Jane Parent');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid when student signature is empty', () => {
    const result = validateAcceptanceInput('', 'Jane Parent');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Student typed signature is required.');
  });

  it('returns invalid when parent signature is empty', () => {
    const result = validateAcceptanceInput('John Student', '');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Parent typed signature is required.');
  });

  it('returns invalid when both signatures missing', () => {
    const result = validateAcceptanceInput('', '');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('trims whitespace-only input as invalid', () => {
    const result = validateAcceptanceInput('   ', '   ');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});
