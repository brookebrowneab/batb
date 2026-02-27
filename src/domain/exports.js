/**
 * Export domain logic — pure functions for data formatting.
 * No side effects, no Supabase imports, no PDF library imports.
 */

/**
 * Group dance roster entries by session.
 * @param {Array} roster - from fetchDanceRoster()
 * @param {Array} sessions - from fetchAllDanceSessions()
 * @returns {Array<{ session: object, students: Array<object> }>}
 */
export function groupDanceRosterBySessions(roster, sessions) {
  return sessions.map((session) => ({
    session,
    students: roster
      .filter((r) => r.dance_session_id === session.id)
      .map((r) => r.students)
      .filter(Boolean),
  }));
}

/**
 * Group vocal roster entries by slot.
 * @param {Array} roster - from fetchVocalRoster()
 * @param {Array} slots - from fetchAllVocalSlots()
 * @returns {Array<{ slot: object, students: Array<object> }>}
 */
export function groupVocalRosterBySlots(roster, slots) {
  return slots.map((slot) => ({
    slot,
    students: roster
      .filter((r) => r.audition_slot_id === slot.id)
      .map((r) => r.students)
      .filter(Boolean),
  }));
}

/**
 * Build CSV string from tabular data.
 * Includes UTF-8 BOM for Excel compatibility.
 * @param {Array<string>} headers
 * @param {Array<Array<string>>} rows
 * @returns {string}
 */
export function buildCsvString(headers, rows) {
  const BOM = '\uFEFF';
  const escapeCsvField = (field) => {
    const str = String(field ?? '');
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  const lines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ];
  return BOM + lines.join('\r\n') + '\r\n';
}

/**
 * Transform dance roster data into CSV rows.
 * @param {Array} roster - from fetchDanceRoster()
 * @returns {{ headers: string[], rows: string[][] }}
 */
export function danceRosterToCsvData(roster) {
  const headers = ['Student First Name', 'Student Last Name', 'Grade', 'Session Date', 'Session Time', 'Session Label'];
  const rows = roster.map((r) => [
    r.students?.first_name || '',
    r.students?.last_name || '',
    r.students?.grade || '',
    r.dance_sessions?.audition_date || '',
    r.dance_sessions ? `${r.dance_sessions.start_time} - ${r.dance_sessions.end_time}` : '',
    r.dance_sessions?.label || '',
  ]);
  return { headers, rows };
}

/**
 * Transform vocal roster data into CSV rows.
 * @param {Array} roster - from fetchVocalRoster()
 * @returns {{ headers: string[], rows: string[][] }}
 */
export function vocalRosterToCsvData(roster) {
  const headers = ['Student First Name', 'Student Last Name', 'Grade', 'Slot Date', 'Slot Time'];
  const rows = roster.map((r) => [
    r.students?.first_name || '',
    r.students?.last_name || '',
    r.students?.grade || '',
    r.audition_slots?.audition_date || '',
    r.audition_slots ? `${r.audition_slots.start_time} - ${r.audition_slots.end_time}` : '',
  ]);
  return { headers, rows };
}

/**
 * Transform callbacks data into CSV rows.
 * @param {Array} students - from fetchAllStudentsForCallbacks()
 * @returns {{ headers: string[], rows: string[][] }}
 */
export function callbacksToCsvData(students) {
  const headers = ['First Name', 'Last Name', 'Grade', 'Callback Invited', 'Registration Complete', 'Parent Email', 'Parent First Name'];
  const rows = students.map((s) => [
    s.first_name || '',
    s.last_name || '',
    s.grade || '',
    s.callback_invited ? 'Yes' : 'No',
    s.registration_complete ? 'Yes' : 'No',
    s.parent_email || '',
    s.parent_first_name || '',
  ]);
  return { headers, rows };
}

/**
 * Generate the PDF footer text.
 * @returns {string}
 */
export function pdfFooterText() {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  return `Generated ${date} — Staff Only — Do Not Distribute`;
}

/**
 * Validate that the caller has staff auth before export.
 * @param {string} role
 * @returns {{ allowed: boolean, reason: string|null }}
 */
export function canExport(role) {
  if (role === 'admin' || role === 'director') {
    return { allowed: true, reason: null };
  }
  return { allowed: false, reason: 'Exports are restricted to staff members.' };
}
