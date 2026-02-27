/**
 * Auth adapter — wraps Supabase Auth operations.
 *
 * Provides: magic link sign-in (families), email/password sign-in (staff),
 * sign-out, session listening, and staff profile fetch for role detection.
 */
import { supabase } from './supabase.js';

function getAuthRedirectUrl() {
  const configured = import.meta.env.VITE_AUTH_REDIRECT_URL;
  if (configured) return configured;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/#/family`;
  }
  return undefined;
}

/**
 * Send a magic link to a family user's email.
 * @param {string} email
 * @returns {Promise<{error: Error|null}>}
 */
export async function signInWithMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });
  return { error };
}

/**
 * Sign in staff with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

/**
 * Create a new account with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function signUpWithPassword(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });
  return { data, error };
}

/**
 * Sign out the current user.
 * @returns {Promise<{error: Error|null}>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current session synchronously from cache.
 * @returns {Promise<{session: object|null}>}
 */
export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { session };
}

/**
 * Subscribe to auth state changes.
 * @param {function} callback - (event, session) => void
 * @returns {{ unsubscribe: function }}
 */
export function onAuthStateChange(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);
  return { unsubscribe: () => subscription.unsubscribe() };
}

/**
 * Fetch the staff profile for the current user (if one exists).
 * Returns null if the user is not staff.
 * @param {string} userId - auth.users.id
 * @returns {Promise<{profile: object|null, error: Error|null}>}
 */
export async function fetchStaffProfile(userId) {
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('id, role, display_name, email')
    .eq('id', userId)
    .maybeSingle();
  return { profile: data, error };
}
