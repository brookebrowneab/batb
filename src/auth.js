/**
 * Auth state manager — bridges Supabase auth adapter with UI.
 *
 * Maintains current session and role. Notifies listeners on change.
 * This is the single source of truth for "who is logged in and what role".
 */
import { getSession, onAuthStateChange, fetchStaffProfile } from './adapters/auth.js';
import { parseRole, ROLES } from './domain/roles.js';

let currentSession = null;
let currentRole = ROLES.FAMILY;
let currentStaffProfile = null;
const listeners = new Set();

export function getAuthState() {
  return {
    session: currentSession,
    role: currentRole,
    staffProfile: currentStaffProfile,
    user: currentSession?.user || null,
  };
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  const state = getAuthState();
  listeners.forEach((fn) => fn(state));
}

async function resolveRole(userId) {
  if (!userId) {
    currentRole = ROLES.FAMILY;
    currentStaffProfile = null;
    return;
  }
  const { profile } = await fetchStaffProfile(userId);
  currentStaffProfile = profile;
  currentRole = parseRole(profile);
}

export async function initAuth() {
  const { session } = await getSession();
  currentSession = session;
  await resolveRole(session?.user?.id);
  notify();

  onAuthStateChange(async (_event, session) => {
    currentSession = session;
    await resolveRole(session?.user?.id);
    notify();
  });
}
