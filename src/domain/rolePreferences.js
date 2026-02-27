/**
 * Role preferences and vocal day assignment domain logic — pure functions.
 */

import { formatDate, formatTime } from './scheduling.js';

/**
 * Check if vocal mode is day_assignment.
 * @param {object|null} settings - { vocal_mode: string }
 * @returns {boolean}
 */
export function isDayAssignmentMode(settings) {
  return settings?.vocal_mode === 'day_assignment';
}

/**
 * Check if vocal mode is timeslot.
 * @param {object|null} settings - { vocal_mode: string }
 * @returns {boolean}
 */
export function isTimeslotMode(settings) {
  return !settings || settings.vocal_mode === 'timeslot';
}

/**
 * Validate a set of role preferences.
 * @param {Array<{roleId: string, rank: number}>} preferences
 * @param {Array<{id: string}>} availableRoles
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRolePreferences(preferences, availableRoles) {
  const errors = [];
  if (!Array.isArray(preferences) || preferences.length === 0) {
    return { valid: true, errors: [] }; // empty is valid (optional)
  }

  const roleIds = new Set(availableRoles.map((r) => r.id));
  const usedRanks = new Set();
  const usedRoles = new Set();

  for (const pref of preferences) {
    if (!pref.roleId || !roleIds.has(pref.roleId)) {
      errors.push(`Invalid role selection.`);
    }
    if (usedRoles.has(pref.roleId)) {
      errors.push(`Duplicate role selected.`);
    }
    usedRoles.add(pref.roleId);

    if (!Number.isInteger(pref.rank) || pref.rank < 1) {
      errors.push(`Rank must be a positive integer.`);
    }
    if (usedRanks.has(pref.rank)) {
      errors.push(`Duplicate rank: ${pref.rank}. Each role must have a unique rank.`);
    }
    usedRanks.add(pref.rank);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Sort preferences by rank_order ascending.
 * @param {Array<{rank_order: number}>} preferences
 * @returns {Array}
 */
export function sortPreferencesByRank(preferences) {
  return [...preferences].sort((a, b) => a.rank_order - b.rank_order);
}

/**
 * Group students by their #1 role preference.
 * Students with no preferences go into an "Unassigned" group.
 * @param {Array} students - each with role_preferences array
 * @param {Array} roles - all audition roles
 * @returns {Map<string, {role: object|null, students: Array}>}
 */
export function groupStudentsByTopRole(students, roles) {
  const groups = new Map();
  const roleMap = new Map(roles.map((r) => [r.id, r]));

  // Initialize a group for each role + unassigned
  for (const role of roles) {
    groups.set(role.id, { role, students: [] });
  }
  groups.set('__none__', { role: null, students: [] });

  for (const student of students) {
    const prefs = student.role_preferences || [];
    const sorted = sortPreferencesByRank(prefs);
    const topPref = sorted[0];

    if (topPref && roleMap.has(topPref.audition_role_id)) {
      groups.get(topPref.audition_role_id).students.push(student);
    } else {
      groups.get('__none__').students.push(student);
    }
  }

  return groups;
}

/**
 * Group students by assigned audition date.
 * Students without assignments go into an "Unassigned" group.
 * @param {Array} students - each with day_assignment object or null
 * @param {Array} configs - audition_window_config rows
 * @returns {Map<string, {date: string|null, students: Array}>}
 */
export function groupStudentsByAssignedDate(students, configs) {
  const groups = new Map();

  // Initialize a group for each config date + unassigned
  for (const config of configs) {
    groups.set(config.audition_date, { date: config.audition_date, students: [] });
  }
  groups.set('__unassigned__', { date: null, students: [] });

  for (const student of students) {
    const assignment = student.day_assignment;
    if (assignment && groups.has(assignment.audition_date)) {
      groups.get(assignment.audition_date).students.push(student);
    } else {
      groups.get('__unassigned__').students.push(student);
    }
  }

  return groups;
}

/**
 * Generate day assignment notification email content.
 * @param {object} student
 * @param {string} assignedDate - YYYY-MM-DD
 * @param {Array} configs - audition_window_config rows
 * @returns {{ subject: string, body: string, bodyPreview: string }}
 */
export function generateDayAssignmentNotificationContent(student, assignedDate, configs) {
  const config = configs.find((c) => c.audition_date === assignedDate);
  const dateDisplay = formatDate(assignedDate);
  const vocalTime = config?.vocal_start_time && config?.vocal_end_time
    ? `${formatTime(config.vocal_start_time)} – ${formatTime(config.vocal_end_time)}`
    : 'TBD';

  const parentName = student.parent_first_name || 'Parent/Guardian';
  const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'your student';

  const subject = 'Vocal Audition Day Assignment — BATB Auditions';
  const body = [
    `Dear ${parentName},`,
    '',
    `${studentName} has been assigned to the following vocal audition day:`,
    '',
    `Date: ${dateDisplay}`,
    `Time: ${vocalTime}`,
    '',
    'Please arrive at least 15 minutes early. If you have any questions, contact the production team.',
    '',
    'Break a leg!',
    'Beauty and the Beast Auditions Team',
  ].join('\n');

  const bodyPreview = body.length > 200 ? body.slice(0, 200) + '…' : body;

  return { subject, body, bodyPreview };
}
