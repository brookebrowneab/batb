import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  assembleProfileSummary,
  validateEvaluationInput,
} from '../src/domain/studentProfile.js';

const root = process.cwd();

// --- assembleProfileSummary ---

describe('assembleProfileSummary', () => {
  const fullStudent = {
    id: 'stu-1',
    first_name: 'Jane',
    last_name: 'Doe',
    grade: '10',
    photo_storage_path: 'abc/photo.jpg',
    parent_first_name: 'Mary',
    parent_last_name: 'Doe',
    parent_email: 'mary@example.com',
    parent_phone: '555-1234',
    callback_invited: true,
    registration_complete: true,
  };

  it('assembles a full profile with all fields populated', () => {
    const dance = { id: 'd1', dance_sessions: { audition_date: '2026-05-01' } };
    const vocal = { id: 'v1', audition_slots: { start_time: '10:00' } };
    const evals = [{ id: 'e1', notes: 'Great' }];

    const result = assembleProfileSummary(fullStudent, dance, vocal, evals);
    expect(result.student).toEqual(fullStudent);
    expect(result.dance).toEqual(dance);
    expect(result.vocal).toEqual(vocal);
    expect(result.callbackInvited).toBe(true);
    expect(result.evaluations).toHaveLength(1);
    expect(result.missingFields).toHaveLength(0);
  });

  it('returns null student and error for null input', () => {
    const result = assembleProfileSummary(null, null, null, []);
    expect(result.student).toBeNull();
    expect(result.missingFields).toContain('Student not found');
  });

  it('identifies missing fields', () => {
    const partial = { id: 'stu-2', first_name: 'Alex' };
    const result = assembleProfileSummary(partial, null, null, []);
    expect(result.missingFields).toContain('last_name');
    expect(result.missingFields).toContain('grade');
    expect(result.missingFields).toContain('photo');
    expect(result.missingFields).toContain('parent_email');
    expect(result.missingFields).not.toContain('first_name');
  });

  it('sets callbackInvited false when not invited', () => {
    const student = { ...fullStudent, callback_invited: false };
    const result = assembleProfileSummary(student, null, null, []);
    expect(result.callbackInvited).toBe(false);
  });

  it('handles null dance and vocal gracefully', () => {
    const result = assembleProfileSummary(fullStudent, null, null, []);
    expect(result.dance).toBeNull();
    expect(result.vocal).toBeNull();
  });

  it('handles null evaluations gracefully', () => {
    const result = assembleProfileSummary(fullStudent, null, null, null);
    expect(result.evaluations).toEqual([]);
  });
});

// --- validateEvaluationInput ---

describe('validateEvaluationInput', () => {
  it('accepts valid notes and track', () => {
    const result = validateEvaluationInput('Great performance', 'dance');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects empty notes', () => {
    const result = validateEvaluationInput('', 'dance');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('empty');
  });

  it('rejects whitespace-only notes', () => {
    const result = validateEvaluationInput('   ', 'vocal');
    expect(result.valid).toBe(false);
  });

  it('rejects null notes', () => {
    const result = validateEvaluationInput(null, 'general');
    expect(result.valid).toBe(false);
  });

  it('rejects invalid track', () => {
    const result = validateEvaluationInput('Good job', 'singing');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Track');
  });

  it('rejects null track', () => {
    const result = validateEvaluationInput('Good job', null);
    expect(result.valid).toBe(false);
  });

  it('accepts all valid tracks', () => {
    for (const track of ['dance', 'vocal', 'callbacks', 'general']) {
      const result = validateEvaluationInput('Notes', track);
      expect(result.valid).toBe(true);
    }
  });

  it('returns multiple errors when both fields invalid', () => {
    const result = validateEvaluationInput('', 'invalid');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// --- Structural Tests ---

describe('Structural: student profile', () => {
  const mainJs = readFileSync(join(root, 'src/main.js'), 'utf-8');
  const routerJs = readFileSync(join(root, 'src/router.js'), 'utf-8');
  const profilePage = readFileSync(join(root, 'src/pages/staffStudentProfile.js'), 'utf-8');
  const danceRoster = readFileSync(join(root, 'src/pages/staffDanceRoster.js'), 'utf-8');
  const vocalRoster = readFileSync(join(root, 'src/pages/staffVocalRoster.js'), 'utf-8');
  const callbacksPage = readFileSync(join(root, 'src/pages/staffCallbacks.js'), 'utf-8');
  const migration = readFileSync(join(root, 'supabase/migrations/00011_student_evaluations.sql'), 'utf-8');
  const domainIndex = readFileSync(join(root, 'src/domain/index.js'), 'utf-8');

  it('profile page is registered under /staff prefix', () => {
    expect(mainJs).toContain("'/staff/student-profile'");
    expect(mainJs).toContain('renderStaffStudentProfile');
  });

  it('no family student-profile route exists', () => {
    expect(mainJs).not.toContain("'/family/student-profile'");
  });

  it('router strips query params before matching', () => {
    expect(routerJs).toContain(".split('?')");
  });

  it('router exports getQueryParams helper', () => {
    expect(routerJs).toContain('export function getQueryParams');
  });

  it('profile page uses getQueryParams to read student ID', () => {
    expect(profilePage).toContain('getQueryParams');
    expect(profilePage).toContain('params.id');
  });

  it('profile page imports escapeHtml from shared utility', () => {
    expect(profilePage).toContain("from '../ui/escapeHtml.js'");
  });

  it('profile page imports getSignedPhotoUrl', () => {
    expect(profilePage).toContain('getSignedPhotoUrl');
  });

  it('profile page imports evaluation adapter functions', () => {
    expect(profilePage).toContain('fetchEvaluationsForStudent');
    expect(profilePage).toContain('createEvaluation');
    expect(profilePage).toContain('updateEvaluation');
  });

  it('dance roster has clickable student names linking to profile', () => {
    expect(danceRoster).toContain('staff/student-profile?id=');
  });

  it('vocal roster has clickable student names linking to profile', () => {
    expect(vocalRoster).toContain('staff/student-profile?id=');
  });

  it('callbacks page has clickable student names linking to profile', () => {
    expect(callbacksPage).toContain('staff/student-profile?id=');
  });

  it('dance roster has date filter', () => {
    expect(danceRoster).toContain('dance-date-filter');
  });

  it('vocal roster has date filter', () => {
    expect(vocalRoster).toContain('vocal-date-filter');
  });

  it('migration creates student_evaluations table', () => {
    expect(migration).toContain('create table');
    expect(migration).toContain('student_evaluations');
  });

  it('migration has staff SELECT policy', () => {
    expect(migration).toContain('Staff can read all evaluations');
  });

  it('migration enforces staff_user_id = auth.uid() on INSERT', () => {
    expect(migration).toContain('staff_user_id = auth.uid()');
    expect(migration).toContain('for insert');
  });

  it('migration enforces staff_user_id = auth.uid() on UPDATE', () => {
    // UPDATE policy should also check staff_user_id = auth.uid()
    const updatePolicyRegex = /for update[\s\S]*?staff_user_id\s*=\s*auth\.uid\(\)/;
    expect(migration).toMatch(updatePolicyRegex);
  });

  it('migration restricts DELETE to admin only', () => {
    expect(migration).toContain("role = 'admin'");
    expect(migration).toContain('for delete');
  });

  it('migration has track check constraint', () => {
    expect(migration).toContain("'dance'");
    expect(migration).toContain("'vocal'");
    expect(migration).toContain("'callbacks'");
    expect(migration).toContain("'general'");
  });

  it('domain index re-exports studentProfile', () => {
    expect(domainIndex).toContain('studentProfile');
  });
});
