import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  checkDanceEligibility,
  isDanceLocked,
  checkSessionCapacity,
  validateDanceSignupInput,
} from '../src/domain/danceSignup.js';

// --- checkDanceEligibility ---

describe('checkDanceEligibility', () => {
  it('returns ineligible for null student', () => {
    const result = checkDanceEligibility(null);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('not found');
  });

  it('returns ineligible when registration_complete is false', () => {
    const result = checkDanceEligibility({ registration_complete: false });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('Registration');
  });

  it('returns ineligible when registration_complete is undefined', () => {
    const result = checkDanceEligibility({});
    expect(result.eligible).toBe(false);
  });

  it('returns eligible when registration_complete is true', () => {
    const result = checkDanceEligibility({ registration_complete: true });
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeNull();
  });
});

// --- isDanceLocked ---

describe('isDanceLocked', () => {
  it('returns false when before 2:00 PM on audition day', () => {
    const now = new Date('2026-05-01T13:59:00');
    expect(isDanceLocked('2026-05-01', now)).toBe(false);
  });

  it('returns true when at exactly 2:00 PM on audition day', () => {
    const now = new Date('2026-05-01T14:00:00');
    expect(isDanceLocked('2026-05-01', now)).toBe(true);
  });

  it('returns true when after 2:00 PM on audition day', () => {
    const now = new Date('2026-05-01T15:30:00');
    expect(isDanceLocked('2026-05-01', now)).toBe(true);
  });

  it('returns false for null audition date', () => {
    expect(isDanceLocked(null, new Date())).toBe(false);
  });

  it('returns false for empty string audition date', () => {
    expect(isDanceLocked('', new Date())).toBe(false);
  });

  it('returns false when now is day before audition', () => {
    const now = new Date('2026-04-30T23:59:00');
    expect(isDanceLocked('2026-05-01', now)).toBe(false);
  });

  it('returns true when now is day after audition (past lock)', () => {
    const now = new Date('2026-05-02T08:00:00');
    expect(isDanceLocked('2026-05-01', now)).toBe(true);
  });
});

// --- checkSessionCapacity ---

describe('checkSessionCapacity', () => {
  it('returns available=true when capacity is null (unlimited)', () => {
    const result = checkSessionCapacity({ capacity: null }, 100);
    expect(result.available).toBe(true);
    expect(result.spotsLeft).toBeNull();
  });

  it('returns available=true when capacity is undefined (unlimited)', () => {
    const result = checkSessionCapacity({}, 50);
    expect(result.available).toBe(true);
    expect(result.spotsLeft).toBeNull();
  });

  it('returns available=true when under capacity', () => {
    const result = checkSessionCapacity({ capacity: 30 }, 25);
    expect(result.available).toBe(true);
    expect(result.spotsLeft).toBe(5);
  });

  it('returns available=false when at capacity', () => {
    const result = checkSessionCapacity({ capacity: 30 }, 30);
    expect(result.available).toBe(false);
    expect(result.spotsLeft).toBe(0);
  });

  it('returns available=false when over capacity', () => {
    const result = checkSessionCapacity({ capacity: 30 }, 31);
    expect(result.available).toBe(false);
    expect(result.spotsLeft).toBe(0);
  });

  it('returns available=false for null session', () => {
    const result = checkSessionCapacity(null, 0);
    expect(result.available).toBe(false);
  });

  it('handles capacity of 1', () => {
    expect(checkSessionCapacity({ capacity: 1 }, 0).available).toBe(true);
    expect(checkSessionCapacity({ capacity: 1 }, 1).available).toBe(false);
  });
});

// --- validateDanceSignupInput ---

describe('validateDanceSignupInput', () => {
  it('returns valid when both IDs provided', () => {
    const result = validateDanceSignupInput('student-1', 'session-1');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid when studentId is missing', () => {
    const result = validateDanceSignupInput(null, 'session-1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Student is required.');
  });

  it('returns invalid when studentId is empty string', () => {
    const result = validateDanceSignupInput('', 'session-1');
    expect(result.valid).toBe(false);
  });

  it('returns invalid when danceSessionId is missing', () => {
    const result = validateDanceSignupInput('student-1', null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Dance session selection is required.');
  });

  it('returns both errors when both are missing', () => {
    const result = validateDanceSignupInput(null, null);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});

// --- Structural / authorization tests ---

describe('Dance sign-up authorization (structural)', () => {
  it('family dance page is under /family route prefix', () => {
    const mainContent = readFileSync(
      join(process.cwd(), 'src', 'main.js'),
      'utf-8',
    );
    expect(mainContent).toContain("'/family/dance'");
  });

  it('staff dance roster is under /staff route prefix', () => {
    const mainContent = readFileSync(
      join(process.cwd(), 'src', 'main.js'),
      'utf-8',
    );
    expect(mainContent).toContain("'/staff/dance-roster'");
  });

  it('dance adapter reads assignment windows from scheduling config', () => {
    const adapterContent = readFileSync(
      join(process.cwd(), 'src', 'adapters', 'danceSessions.js'),
      'utf-8',
    );
    expect(adapterContent).toContain("from('audition_window_config')");
    expect(adapterContent).toContain('fetchAssignedDanceRoster');
  });
});

describe('Dance assignment model (structural)', () => {
  it('family dance page is assignment-based and no longer renders booking controls', () => {
    const page = readFileSync(
      join(process.cwd(), 'src', 'pages', 'familyDanceSignup.js'),
      'utf-8',
    );
    expect(page).toContain('required for all students');
    expect(page).not.toContain('confirm-booking-btn');
    expect(page).not.toContain('cancel-btn');
  });

  it('staff dance roster no longer exposes generate or admin override actions', () => {
    const page = readFileSync(
      join(process.cwd(), 'src', 'pages', 'staffDanceRoster.js'),
      'utf-8',
    );
    expect(page).not.toContain('generate-sessions-btn');
    expect(page).not.toContain('Admin Override');
    expect(page).toContain('auto-assigned from scheduling config');
  });
});
