/**
 * Email validation domain logic — blocks student email domains.
 *
 * No side effects, no Supabase imports.
 */

const BLOCKED_DOMAINS = ['students.k12.dc.us'];

/**
 * Check if an email belongs to a blocked domain (exact match or subdomain).
 * @param {string} email
 * @returns {boolean}
 */
export function isBlockedEmailDomain(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1].toLowerCase();
  return BLOCKED_DOMAINS.some(
    (blocked) => domain === blocked || domain.endsWith('.' + blocked),
  );
}

/**
 * Validate an email for login/signup — checks format and blocked domains.
 * @param {string} email
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateLoginEmail(email) {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return { valid: false, error: 'Email address is required.' };
  }
  const trimmed = email.trim();
  if (!trimmed.includes('@')) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (isBlockedEmailDomain(trimmed)) {
    return { valid: false, error: 'Student email addresses cannot be used. Please use a parent or guardian email.' };
  }
  return { valid: true, error: null };
}
