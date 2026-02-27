/**
 * Role parsing and route guard logic — pure functions, no side effects.
 *
 * Role detection uses a staff_profiles table lookup (not JWT claims).
 * If a user has a staff_profiles row, their role is 'admin' or 'director'.
 * If no staff_profiles row exists, the user is a 'family' user.
 */

export const ROLES = {
  FAMILY: 'family',
  DIRECTOR: 'director',
  ADMIN: 'admin',
};

/**
 * Derive the effective role from a staff profile (or lack thereof).
 * @param {object|null} staffProfile - row from staff_profiles, or null
 * @returns {string} one of ROLES values
 */
export function parseRole(staffProfile) {
  if (!staffProfile) return ROLES.FAMILY;
  const role = staffProfile.role;
  if (role === ROLES.ADMIN) return ROLES.ADMIN;
  if (role === ROLES.DIRECTOR) return ROLES.DIRECTOR;
  return ROLES.FAMILY;
}

/**
 * @param {string} role
 * @returns {boolean}
 */
export function isStaff(role) {
  return role === ROLES.ADMIN || role === ROLES.DIRECTOR;
}

/**
 * @param {string} role
 * @returns {boolean}
 */
export function isAdmin(role) {
  return role === ROLES.ADMIN;
}

/**
 * @param {string} role
 * @returns {boolean}
 */
export function isDirector(role) {
  return role === ROLES.DIRECTOR;
}

/**
 * Route access rules. Returns true if the role is allowed to access the route.
 *
 * Route prefixes:
 *   /family/*  — any authenticated user (family, director, admin)
 *   /staff/*   — director or admin
 *   /admin/*   — admin only
 *   everything else — public (unauthenticated ok)
 *
 * @param {string} path - the route path
 * @param {object|null} session - Supabase session (null = unauthenticated)
 * @param {string} role - one of ROLES values
 * @returns {{ allowed: boolean, redirect: string|null }}
 */
export function canAccessRoute(path, session, role) {
  // Login pages are always public
  if (path === '/family/login' || path === '/staff/login') {
    return { allowed: true, redirect: null };
  }

  // Family routes require any authenticated session
  if (path.startsWith('/family')) {
    if (!session) return { allowed: false, redirect: '/family/login' };
    return { allowed: true, redirect: null };
  }

  // Staff routes require director or admin
  if (path.startsWith('/staff')) {
    if (!session) return { allowed: false, redirect: '/staff/login' };
    if (!isStaff(role)) return { allowed: false, redirect: '/' };
    return { allowed: true, redirect: null };
  }

  // Admin routes require admin
  if (path.startsWith('/admin')) {
    if (!session) return { allowed: false, redirect: '/staff/login' };
    if (!isAdmin(role)) return { allowed: false, redirect: '/' };
    return { allowed: true, redirect: null };
  }

  // Public routes
  return { allowed: true, redirect: null };
}
