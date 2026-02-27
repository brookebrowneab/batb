import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  checkVocalEligibility,
  isVocalLocked,
  checkSlotCapacity,
  validateVocalBookingInput,
  generateSlotTimes,
  VOCAL_SLOT_CAPACITY,
  VOCAL_SLOT_DURATION,
} from '../src/domain/vocalBooking.js';

// --- checkVocalEligibility ---

describe('checkVocalEligibility', () => {
  it('returns ineligible for null student', () => {
    const result = checkVocalEligibility(null);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('not found');
  });

  it('returns ineligible when registration_complete is false', () => {
    const result = checkVocalEligibility({ registration_complete: false });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('Registration');
  });

  it('returns ineligible when registration_complete is undefined', () => {
    const result = checkVocalEligibility({});
    expect(result.eligible).toBe(false);
  });

  it('returns eligible when registration_complete is true', () => {
    const result = checkVocalEligibility({ registration_complete: true });
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeNull();
  });
});

// --- isVocalLocked ---

describe('isVocalLocked', () => {
  it('returns false when before 2:00 PM on audition day', () => {
    const now = new Date('2026-05-01T13:59:00');
    expect(isVocalLocked('2026-05-01', now)).toBe(false);
  });

  it('returns true when at exactly 2:00 PM on audition day', () => {
    const now = new Date('2026-05-01T14:00:00');
    expect(isVocalLocked('2026-05-01', now)).toBe(true);
  });

  it('returns true when after 2:00 PM on audition day', () => {
    const now = new Date('2026-05-01T15:30:00');
    expect(isVocalLocked('2026-05-01', now)).toBe(true);
  });

  it('returns false for null audition date', () => {
    expect(isVocalLocked(null, new Date())).toBe(false);
  });

  it('returns false for empty string audition date', () => {
    expect(isVocalLocked('', new Date())).toBe(false);
  });

  it('returns false when now is day before audition', () => {
    const now = new Date('2026-04-30T23:59:00');
    expect(isVocalLocked('2026-05-01', now)).toBe(false);
  });

  it('returns true when now is day after audition (past lock)', () => {
    const now = new Date('2026-05-02T08:00:00');
    expect(isVocalLocked('2026-05-01', now)).toBe(true);
  });
});

// --- checkSlotCapacity ---

describe('checkSlotCapacity', () => {
  it('exports capacity constant of 7', () => {
    expect(VOCAL_SLOT_CAPACITY).toBe(7);
  });

  it('returns available=true when no bookings', () => {
    const result = checkSlotCapacity(0);
    expect(result.available).toBe(true);
    expect(result.spotsLeft).toBe(7);
  });

  it('returns available=true when under capacity', () => {
    const result = checkSlotCapacity(5);
    expect(result.available).toBe(true);
    expect(result.spotsLeft).toBe(2);
  });

  it('returns available=true when 6 of 7 booked', () => {
    const result = checkSlotCapacity(6);
    expect(result.available).toBe(true);
    expect(result.spotsLeft).toBe(1);
  });

  it('returns available=false when at capacity (7)', () => {
    const result = checkSlotCapacity(7);
    expect(result.available).toBe(false);
    expect(result.spotsLeft).toBe(0);
  });

  it('returns available=false when over capacity', () => {
    const result = checkSlotCapacity(8);
    expect(result.available).toBe(false);
    expect(result.spotsLeft).toBe(0);
  });

  it('accepts custom maxCapacity', () => {
    const result = checkSlotCapacity(3, 5);
    expect(result.available).toBe(true);
    expect(result.spotsLeft).toBe(2);
  });
});

// --- validateVocalBookingInput ---

describe('validateVocalBookingInput', () => {
  it('returns valid when both IDs provided', () => {
    const result = validateVocalBookingInput('student-1', 'slot-1');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid when studentId is missing', () => {
    const result = validateVocalBookingInput(null, 'slot-1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Student is required.');
  });

  it('returns invalid when studentId is empty string', () => {
    const result = validateVocalBookingInput('', 'slot-1');
    expect(result.valid).toBe(false);
  });

  it('returns invalid when slotId is missing', () => {
    const result = validateVocalBookingInput('student-1', null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Vocal slot selection is required.');
  });

  it('returns both errors when both are missing', () => {
    const result = validateVocalBookingInput(null, null);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});

// --- generateSlotTimes ---

describe('generateSlotTimes', () => {
  it('exports slot duration constant of 15', () => {
    expect(VOCAL_SLOT_DURATION).toBe(15);
  });

  it('generates correct number of slots for a 2-hour window', () => {
    const slots = generateSlotTimes('13:00', '15:00');
    expect(slots).toHaveLength(8); // 120 min / 15 min = 8
  });

  it('generates correct start/end times', () => {
    const slots = generateSlotTimes('09:00', '10:00');
    expect(slots).toEqual([
      { start: '09:00', end: '09:15' },
      { start: '09:15', end: '09:30' },
      { start: '09:30', end: '09:45' },
      { start: '09:45', end: '10:00' },
    ]);
  });

  it('handles non-divisible windows (drops partial slot)', () => {
    // 50 minutes / 15 = 3 full slots (45 min), 5 min remainder dropped
    const slots = generateSlotTimes('14:00', '14:50');
    expect(slots).toHaveLength(3);
    expect(slots[2]).toEqual({ start: '14:30', end: '14:45' });
  });

  it('returns empty array for null inputs', () => {
    expect(generateSlotTimes(null, '15:00')).toEqual([]);
    expect(generateSlotTimes('13:00', null)).toEqual([]);
    expect(generateSlotTimes(null, null)).toEqual([]);
  });

  it('returns empty array when start >= end', () => {
    expect(generateSlotTimes('15:00', '13:00')).toEqual([]);
    expect(generateSlotTimes('14:00', '14:00')).toEqual([]);
  });

  it('returns empty array for zero or negative duration', () => {
    expect(generateSlotTimes('13:00', '15:00', 0)).toEqual([]);
    expect(generateSlotTimes('13:00', '15:00', -5)).toEqual([]);
  });

  it('handles window exactly equal to one slot', () => {
    const slots = generateSlotTimes('10:00', '10:15');
    expect(slots).toHaveLength(1);
    expect(slots[0]).toEqual({ start: '10:00', end: '10:15' });
  });

  it('handles window smaller than one slot', () => {
    const slots = generateSlotTimes('10:00', '10:10');
    expect(slots).toHaveLength(0);
  });

  it('handles custom duration', () => {
    const slots = generateSlotTimes('13:00', '14:00', 20);
    expect(slots).toHaveLength(3); // 60 / 20 = 3
  });

  it('generates correct zero-padded times', () => {
    const slots = generateSlotTimes('08:00', '08:30');
    expect(slots[0].start).toBe('08:00');
    expect(slots[0].end).toBe('08:15');
    expect(slots[1].start).toBe('08:15');
    expect(slots[1].end).toBe('08:30');
  });
});

// --- Structural / authorization tests ---

describe('Vocal booking authorization (structural)', () => {
  it('family vocal page is under /family route prefix', () => {
    const mainContent = readFileSync(
      join(process.cwd(), 'src', 'main.js'),
      'utf-8',
    );
    expect(mainContent).toContain("'/family/vocal'");
  });

  it('staff vocal roster is under /staff route prefix', () => {
    const mainContent = readFileSync(
      join(process.cwd(), 'src', 'main.js'),
      'utf-8',
    );
    expect(mainContent).toContain("'/staff/vocal-roster'");
  });

  it('vocal bookings use RPC pattern (not direct table insert)', () => {
    const adapterContent = readFileSync(
      join(process.cwd(), 'src', 'adapters', 'vocalBookings.js'),
      'utf-8',
    );
    expect(adapterContent).toContain("rpc('book_vocal_slot'");
    expect(adapterContent).toContain("rpc('reschedule_vocal_slot'");
    expect(adapterContent).toContain("rpc('cancel_vocal_booking'");
    expect(adapterContent).toContain("rpc('admin_override_vocal_booking'");
  });
});

describe('Vocal transactional safety (structural)', () => {
  const migration = readFileSync(
    join(process.cwd(), 'supabase', 'migrations', '00009_vocal_slots_and_bookings.sql'),
    'utf-8',
  );

  it('booking RPC uses SELECT FOR UPDATE for concurrency safety', () => {
    expect(migration).toContain('for update');
  });

  it('capacity check enforces maximum of 7', () => {
    expect(migration).toContain('>= 7');
  });

  it('lock time check uses 14:00', () => {
    expect(migration).toContain('14:00:00');
  });

  it('uniqueness constraint exists (one booking per student)', () => {
    expect(migration).toContain('vocal_bookings_student_idx');
    expect(migration).toContain('(student_id)');
  });

  it('reschedule RPC exists for atomic move', () => {
    expect(migration).toContain('reschedule_vocal_slot');
  });

  it('admin override RPC exists without lock time check', () => {
    const adminFnStart = migration.indexOf('admin_override_vocal_booking');
    const adminFnBody = migration.slice(adminFnStart);
    expect(adminFnBody).toContain("role = 'admin'");
  });

  it('booking RPC checks registration_complete', () => {
    expect(migration).toContain('registration_complete');
  });

  it('booking RPC rejects students who already have a booking', () => {
    expect(migration).toContain('Use reschedule to change slots');
  });
});
