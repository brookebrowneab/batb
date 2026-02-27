import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { isBlockedEmailDomain, validateLoginEmail } from '../src/domain/emailValidation.js';

// ── Unit tests ──

describe('isBlockedEmailDomain', () => {
  it('blocks students.k12.dc.us', () => {
    expect(isBlockedEmailDomain('kid@students.k12.dc.us')).toBe(true);
  });

  it('blocks subdomains of students.k12.dc.us', () => {
    expect(isBlockedEmailDomain('kid@east.students.k12.dc.us')).toBe(true);
  });

  it('allows normal email domains', () => {
    expect(isBlockedEmailDomain('parent@gmail.com')).toBe(false);
    expect(isBlockedEmailDomain('parent@outlook.com')).toBe(false);
  });

  it('allows k12.dc.us (staff/parent domain)', () => {
    expect(isBlockedEmailDomain('teacher@k12.dc.us')).toBe(false);
  });

  it('returns false for empty/invalid input', () => {
    expect(isBlockedEmailDomain('')).toBe(false);
    expect(isBlockedEmailDomain(null)).toBe(false);
    expect(isBlockedEmailDomain(undefined)).toBe(false);
    expect(isBlockedEmailDomain('not-an-email')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isBlockedEmailDomain('kid@STUDENTS.K12.DC.US')).toBe(true);
  });
});

describe('validateLoginEmail', () => {
  it('rejects empty email', () => {
    const result = validateLoginEmail('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects email without @', () => {
    const result = validateLoginEmail('notanemail');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('valid email');
  });

  it('rejects blocked student email', () => {
    const result = validateLoginEmail('kid@students.k12.dc.us');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Student email');
  });

  it('accepts valid parent email', () => {
    const result = validateLoginEmail('parent@gmail.com');
    expect(result.valid).toBe(true);
    expect(result.error).toBe(null);
  });

  it('trims whitespace before validating', () => {
    const result = validateLoginEmail('  parent@gmail.com  ');
    expect(result.valid).toBe(true);
  });
});

// ── Structural tests ──

describe('structural: email validation usage', () => {
  it('familyLogin.js imports validateLoginEmail', () => {
    const src = fs.readFileSync('src/pages/familyLogin.js', 'utf8');
    expect(src).toContain('validateLoginEmail');
  });

  it('staffLogin.js imports validateLoginEmail', () => {
    const src = fs.readFileSync('src/pages/staffLogin.js', 'utf8');
    expect(src).toContain('validateLoginEmail');
  });

  it('familyRegistration.js imports isBlockedEmailDomain', () => {
    const src = fs.readFileSync('src/pages/familyRegistration.js', 'utf8');
    expect(src).toContain('isBlockedEmailDomain');
  });

  it('domain/index.js re-exports emailValidation', () => {
    const src = fs.readFileSync('src/domain/index.js', 'utf8');
    expect(src).toContain('./emailValidation.js');
  });

  it('familyLogin.js has magic link, password sign-in, and create account sections', () => {
    const src = fs.readFileSync('src/pages/familyLogin.js', 'utf8');
    expect(src).toContain('family-magic-form');
    expect(src).toContain('family-password-form');
    expect(src).toContain('family-signup-form');
  });

  it('auth adapter exports signUpWithPassword', () => {
    const src = fs.readFileSync('src/adapters/auth.js', 'utf8');
    expect(src).toContain('export async function signUpWithPassword');
  });
});
