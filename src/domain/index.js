/**
 * Domain module — pure business rules and validation logic.
 *
 * All domain functions must be stateless and free of side effects.
 * No imports from adapters, UI, or Supabase here.
 *
 * Submodules:
 * - roles (role parsing, route guards)
 * - contracts (version rules)
 * - registration (gating logic)
 * - scheduling (window validation, lock time constants)
 * - danceSignup (eligibility, lock time, capacity)
 * - vocalBooking (eligibility, lock time, capacity, slot generation)
 * - callbacks (invite gating, notification templates)
 * - studentProfile (profile assembly, evaluation validation)
 */
export * from './danceSignup.js';
export * from './vocalBooking.js';
export * from './callbacks.js';
export * from './studentProfile.js';
