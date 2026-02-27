import { describe, it, expect } from 'vitest';
import {
  ROLES,
  parseRole,
  isStaff,
  isAdmin,
  isDirector,
  canAccessRoute,
} from '../src/domain/roles.js';

// --- parseRole ---

describe('parseRole', () => {
  it('returns FAMILY when staffProfile is null', () => {
    expect(parseRole(null)).toBe(ROLES.FAMILY);
  });

  it('returns FAMILY when staffProfile is undefined', () => {
    expect(parseRole(undefined)).toBe(ROLES.FAMILY);
  });

  it('returns ADMIN when profile role is admin', () => {
    expect(parseRole({ role: 'admin' })).toBe(ROLES.ADMIN);
  });

  it('returns DIRECTOR when profile role is director', () => {
    expect(parseRole({ role: 'director' })).toBe(ROLES.DIRECTOR);
  });

  it('returns FAMILY for unrecognized role string', () => {
    expect(parseRole({ role: 'unknown' })).toBe(ROLES.FAMILY);
  });
});

// --- isStaff / isAdmin / isDirector ---

describe('role check helpers', () => {
  it('isStaff is true for admin', () => {
    expect(isStaff(ROLES.ADMIN)).toBe(true);
  });

  it('isStaff is true for director', () => {
    expect(isStaff(ROLES.DIRECTOR)).toBe(true);
  });

  it('isStaff is false for family', () => {
    expect(isStaff(ROLES.FAMILY)).toBe(false);
  });

  it('isAdmin is true only for admin', () => {
    expect(isAdmin(ROLES.ADMIN)).toBe(true);
    expect(isAdmin(ROLES.DIRECTOR)).toBe(false);
    expect(isAdmin(ROLES.FAMILY)).toBe(false);
  });

  it('isDirector is true only for director', () => {
    expect(isDirector(ROLES.DIRECTOR)).toBe(true);
    expect(isDirector(ROLES.ADMIN)).toBe(false);
    expect(isDirector(ROLES.FAMILY)).toBe(false);
  });
});

// --- canAccessRoute ---

const mockSession = { user: { id: '123', email: 'test@example.com' } };

describe('canAccessRoute', () => {
  // Public routes
  it('allows unauthenticated access to /', () => {
    const result = canAccessRoute('/', null, ROLES.FAMILY);
    expect(result.allowed).toBe(true);
  });

  it('allows unauthenticated access to /family/login', () => {
    const result = canAccessRoute('/family/login', null, ROLES.FAMILY);
    expect(result.allowed).toBe(true);
    expect(result.redirect).toBe(null);
  });

  it('allows unauthenticated access to /staff/login', () => {
    const result = canAccessRoute('/staff/login', null, ROLES.FAMILY);
    expect(result.allowed).toBe(true);
    expect(result.redirect).toBe(null);
  });

  // Family routes
  it('allows authenticated family to access /family', () => {
    const result = canAccessRoute('/family', mockSession, ROLES.FAMILY);
    expect(result.allowed).toBe(true);
  });

  it('blocks unauthenticated from /family', () => {
    const result = canAccessRoute('/family', null, ROLES.FAMILY);
    expect(result.allowed).toBe(false);
    expect(result.redirect).toBe('/family/login');
  });

  it('allows staff to access /family (staff are also authenticated)', () => {
    const result = canAccessRoute('/family', mockSession, ROLES.ADMIN);
    expect(result.allowed).toBe(true);
  });

  // Staff routes
  it('allows director to access /staff', () => {
    const result = canAccessRoute('/staff', mockSession, ROLES.DIRECTOR);
    expect(result.allowed).toBe(true);
  });

  it('allows admin to access /staff', () => {
    const result = canAccessRoute('/staff', mockSession, ROLES.ADMIN);
    expect(result.allowed).toBe(true);
  });

  it('blocks family user from /staff', () => {
    const result = canAccessRoute('/staff', mockSession, ROLES.FAMILY);
    expect(result.allowed).toBe(false);
    expect(result.redirect).toBe('/');
  });

  it('blocks unauthenticated from /staff', () => {
    const result = canAccessRoute('/staff', null, ROLES.FAMILY);
    expect(result.allowed).toBe(false);
    expect(result.redirect).toBe('/staff/login');
  });

  // Admin routes
  it('allows admin to access /admin', () => {
    const result = canAccessRoute('/admin', mockSession, ROLES.ADMIN);
    expect(result.allowed).toBe(true);
  });

  it('blocks director from /admin', () => {
    const result = canAccessRoute('/admin', mockSession, ROLES.DIRECTOR);
    expect(result.allowed).toBe(false);
    expect(result.redirect).toBe('/');
  });

  it('blocks family from /admin', () => {
    const result = canAccessRoute('/admin', mockSession, ROLES.FAMILY);
    expect(result.allowed).toBe(false);
    expect(result.redirect).toBe('/');
  });

  it('blocks unauthenticated from /admin', () => {
    const result = canAccessRoute('/admin', null, ROLES.FAMILY);
    expect(result.allowed).toBe(false);
    expect(result.redirect).toBe('/staff/login');
  });
});
