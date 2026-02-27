/**
 * Vocal bookings adapter — Supabase operations for vocal slots and bookings.
 */
import { supabase } from './supabase.js';
import { generateSlotTimes } from '../domain/vocalBooking.js';

/**
 * Fetch all vocal slots ordered by date and start time.
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchAllVocalSlots() {
  const { data, error } = await supabase
    .from('audition_slots')
    .select('*')
    .order('audition_date', { ascending: true })
    .order('start_time', { ascending: true });
  return { data: data || [], error };
}

/**
 * Generate 15-minute vocal slots from audition window config.
 * Creates slots for each config row that has vocal times configured.
 * Skips slots that already exist (by date + start_time unique index).
 * @param {string} staffUserId
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function generateVocalSlotsFromConfig(staffUserId) {
  // Fetch configs that have vocal windows set
  const { data: configs, error: fetchError } = await supabase
    .from('audition_window_config')
    .select('audition_date, vocal_start_time, vocal_end_time')
    .not('vocal_start_time', 'is', null)
    .not('vocal_end_time', 'is', null)
    .order('audition_date', { ascending: true });

  if (fetchError) return { data: null, error: fetchError };
  if (!configs || configs.length === 0) return { data: [], error: null };

  // Fetch existing slots to avoid duplicates
  const { data: existing } = await supabase
    .from('audition_slots')
    .select('audition_date, start_time');

  const existingKeys = new Set(
    (existing || []).map((s) => `${s.audition_date}_${s.start_time}`),
  );

  // Generate 15-minute slots for each config
  const toInsert = [];
  for (const config of configs) {
    const slotTimes = generateSlotTimes(config.vocal_start_time, config.vocal_end_time);
    for (const slot of slotTimes) {
      const key = `${config.audition_date}_${slot.start}`;
      if (!existingKeys.has(key)) {
        toInsert.push({
          audition_date: config.audition_date,
          start_time: slot.start,
          end_time: slot.end,
          created_by_staff_user_id: staffUserId,
        });
      }
    }
  }

  if (toInsert.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from('audition_slots')
    .insert(toInsert)
    .select();
  return { data: data || [], error };
}

/**
 * Delete a vocal slot (admin only via RLS).
 * @param {string} slotId
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteVocalSlot(slotId) {
  const { error } = await supabase
    .from('audition_slots')
    .delete()
    .eq('id', slotId);
  return { error };
}

/**
 * Fetch the vocal booking for a specific student, with joined slot data.
 * @param {string} studentId
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function fetchVocalBookingForStudent(studentId) {
  const { data, error } = await supabase
    .from('vocal_bookings')
    .select('*, audition_slots(*)')
    .eq('student_id', studentId)
    .maybeSingle();
  return { data, error };
}

/**
 * Book a vocal slot (family use, via RPC).
 * @param {string} studentId
 * @param {string} slotId
 * @returns {Promise<{data: string|null, error: Error|null}>}
 */
export async function bookVocalSlot(studentId, slotId) {
  const { data, error } = await supabase.rpc('book_vocal_slot', {
    p_student_id: studentId,
    p_slot_id: slotId,
  });
  return { data, error };
}

/**
 * Reschedule a vocal booking atomically (family use, via RPC).
 * @param {string} studentId
 * @param {string} newSlotId
 * @returns {Promise<{data: string|null, error: Error|null}>}
 */
export async function rescheduleVocalSlot(studentId, newSlotId) {
  const { data, error } = await supabase.rpc('reschedule_vocal_slot', {
    p_student_id: studentId,
    p_new_slot_id: newSlotId,
  });
  return { data, error };
}

/**
 * Cancel a vocal booking (family use, via RPC).
 * @param {string} studentId
 * @returns {Promise<{data: null, error: Error|null}>}
 */
export async function cancelVocalBooking(studentId) {
  const { data, error } = await supabase.rpc('cancel_vocal_booking', {
    p_student_id: studentId,
  });
  return { data, error };
}

/**
 * Admin override: assign or change a student's vocal slot (no lock/capacity check).
 * @param {string} studentId
 * @param {string} slotId
 * @returns {Promise<{data: string|null, error: Error|null}>}
 */
export async function adminOverrideVocalBooking(studentId, slotId) {
  const { data, error } = await supabase.rpc('admin_override_vocal_booking', {
    p_student_id: studentId,
    p_slot_id: slotId,
  });
  return { data, error };
}

/**
 * Fetch all vocal bookings with student and slot data (staff roster view).
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchVocalRoster() {
  const { data, error } = await supabase
    .from('vocal_bookings')
    .select(
      `
      id,
      student_id,
      audition_slot_id,
      created_at,
      students(id, first_name, last_name, grade),
      audition_slots(id, audition_date, start_time, end_time)
    `,
    )
    .order('created_at', { ascending: true });
  return { data: data || [], error };
}

/**
 * Fetch booking counts per vocal slot (for capacity display).
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchBookingCountsBySlot() {
  const { data, error } = await supabase
    .from('vocal_bookings')
    .select('audition_slot_id');
  if (error) return { data: null, error };
  const counts = {};
  (data || []).forEach((row) => {
    counts[row.audition_slot_id] = (counts[row.audition_slot_id] || 0) + 1;
  });
  return { data: counts, error: null };
}
