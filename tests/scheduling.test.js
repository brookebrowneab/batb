import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  validateTimeWindow,
  validateWindowConfig,
  formatTime,
  LOCK_TIME_DISPLAY,
  LOCK_TIME_HOUR,
} from '../src/domain/scheduling.js';

// --- validateTimeWindow ---

describe('validateTimeWindow', () => {
  it('returns no errors when both times are empty (window not configured)', () => {
    expect(validateTimeWindow(null, null, 'Dance')).toEqual([]);
    expect(validateTimeWindow('', '', 'Dance')).toEqual([]);
  });

  it('returns error when start is set but end is missing', () => {
    const errors = validateTimeWindow('09:00', null, 'Dance');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('end time is required');
  });

  it('returns error when end is set but start is missing', () => {
    const errors = validateTimeWindow(null, '12:00', 'Vocal');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('start time is required');
  });

  it('returns error when start >= end', () => {
    expect(validateTimeWindow('14:00', '14:00', 'Dance')).toHaveLength(1);
    expect(validateTimeWindow('15:00', '14:00', 'Dance')).toHaveLength(1);
  });

  it('returns no errors when start < end', () => {
    expect(validateTimeWindow('09:00', '12:00', 'Dance')).toEqual([]);
    expect(validateTimeWindow('13:00', '17:00', 'Vocal')).toEqual([]);
  });
});

// --- validateWindowConfig ---

describe('validateWindowConfig', () => {
  it('returns invalid when audition_date is missing', () => {
    const result = validateWindowConfig({ audition_date: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Audition date is required.');
  });

  it('returns valid for a date-only config (no windows)', () => {
    const result = validateWindowConfig({ audition_date: '2026-05-01' });
    expect(result.valid).toBe(true);
  });

  it('returns valid for a fully configured date', () => {
    const result = validateWindowConfig({
      audition_date: '2026-05-01',
      dance_start_time: '09:00',
      dance_end_time: '11:00',
      vocal_start_time: '13:00',
      vocal_end_time: '17:00',
      callback_start_time: '18:00',
      callback_end_time: '20:00',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns all errors when multiple windows are invalid', () => {
    const result = validateWindowConfig({
      audition_date: '2026-05-01',
      dance_start_time: '12:00',
      dance_end_time: '10:00',
      vocal_start_time: '17:00',
      vocal_end_time: '13:00',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('validates each window independently', () => {
    const result = validateWindowConfig({
      audition_date: '2026-05-01',
      dance_start_time: '09:00',
      dance_end_time: '11:00',
      vocal_start_time: '17:00',
      vocal_end_time: '13:00', // invalid
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Vocal');
  });
});

// --- formatTime ---

describe('formatTime', () => {
  it('returns dash for null', () => {
    expect(formatTime(null)).toBe('—');
  });

  it('formats morning time', () => {
    expect(formatTime('09:30')).toBe('9:30 AM');
  });

  it('formats afternoon time', () => {
    expect(formatTime('14:00')).toBe('2:00 PM');
  });

  it('formats noon', () => {
    expect(formatTime('12:00')).toBe('12:00 PM');
  });

  it('formats midnight', () => {
    expect(formatTime('00:00')).toBe('12:00 AM');
  });
});

// --- Lock time constants ---

describe('Lock time policy', () => {
  it('lock time display is human-readable', () => {
    expect(LOCK_TIME_DISPLAY).toContain('2:00 PM');
  });

  it('lock time hour is 14 (2 PM in 24hr)', () => {
    expect(LOCK_TIME_HOUR).toBe(14);
  });
});

// --- Authorization structural checks ---

describe('Scheduling authorization (structural)', () => {
  it('staff scheduling page is only accessible under /staff route prefix', () => {
    // The staff scheduling route is /staff/scheduling which requires staff role
    // per the canAccessRoute guard (tested in roles.test.js).
    // This test verifies the route path convention is correct.
    const mainContent = readFileSync(
      join(process.cwd(), 'src', 'main.js'),
      'utf-8',
    );
    expect(mainContent).toContain("'/staff/scheduling'");
    // Family schedule view is under /family (requires auth, not staff)
    expect(mainContent).toContain("'/family/schedule'");
  });
});
