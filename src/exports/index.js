/**
 * Exports module — PDF packs and CSV generation (staff-only).
 * All export functions verify staff auth before executing.
 * No public share links are ever generated.
 */
import { getAuthState } from '../auth.js';
import {
  canExport, buildCsvString, groupDanceRosterBySessions, groupVocalRosterBySlots,
  danceRosterToCsvData, vocalRosterToCsvData, callbacksToCsvData,
} from '../domain/exports.js';
import { fetchDanceRoster, fetchDanceWindowsFromConfig } from '../adapters/danceSessions.js';
import { fetchVocalRoster, fetchAllVocalSlots } from '../adapters/vocalBookings.js';
import { fetchAllStudentsForCallbacks } from '../adapters/callbacks.js';
import { fetchStudentForStaff } from '../adapters/students.js';
import { fetchEvaluationsForStudent } from '../adapters/evaluations.js';
import { getSignedPhotoUrl } from '../adapters/storage.js';
import { downloadCsv } from './csvExport.js';
import {
  generateDanceSessionPdf, generateVocalSlotPdf, generateFullTrackPdf,
  downloadPdf, loadImageAsDataUrl,
} from './pdfExport.js';

/**
 * Fetch enriched student details (photo + evaluations) for a set of student IDs.
 * @param {string[]} studentIds
 * @returns {Promise<Map<string, { student, photoDataUrl, evaluations }>>}
 */
async function fetchStudentDetailsMap(studentIds) {
  const unique = [...new Set(studentIds)];
  const map = new Map();

  await Promise.all(unique.map(async (id) => {
    const [studentResult, evalsResult] = await Promise.all([
      fetchStudentForStaff(id),
      fetchEvaluationsForStudent(id),
    ]);

    const student = studentResult.data;
    let photoDataUrl = null;
    if (student?.photo_storage_path) {
      const { url } = await getSignedPhotoUrl(student.photo_storage_path);
      if (url) {
        photoDataUrl = await loadImageAsDataUrl(url);
      }
    }

    map.set(id, {
      student,
      photoDataUrl,
      evaluations: evalsResult.data || [],
    });
  }));

  return map;
}

/** Guard: throws if not staff. */
function assertStaff() {
  const { role } = getAuthState();
  const { allowed, reason } = canExport(role);
  if (!allowed) throw new Error(reason);
}

// --- CSV Exports ---

export async function exportDanceRosterCsv() {
  assertStaff();
  const { data: roster } = await fetchDanceRoster();
  const { headers, rows } = danceRosterToCsvData(roster || []);
  const csv = buildCsvString(headers, rows);
  return downloadCsv(csv, 'dance-roster.csv');
}

export async function exportVocalRosterCsv() {
  assertStaff();
  const { data: roster } = await fetchVocalRoster();
  const { headers, rows } = vocalRosterToCsvData(roster || []);
  const csv = buildCsvString(headers, rows);
  return downloadCsv(csv, 'vocal-roster.csv');
}

export async function exportCallbacksCsv() {
  assertStaff();
  const { data: students } = await fetchAllStudentsForCallbacks();
  const { headers, rows } = callbacksToCsvData(students || []);
  const csv = buildCsvString(headers, rows);
  return downloadCsv(csv, 'callbacks-roster.csv');
}

// --- PDF Exports ---

export async function exportDanceSessionPdf() {
  assertStaff();
  const [{ data: roster }, { data: sessions }] = await Promise.all([
    fetchDanceRoster(),
    fetchDanceWindowsFromConfig(),
  ]);
  const grouped = groupDanceRosterBySessions(roster || [], sessions || []);
  const studentIds = (roster || []).map((r) => r.students?.id).filter(Boolean);
  const detailsMap = await fetchStudentDetailsMap(studentIds);
  const doc = generateDanceSessionPdf(grouped, detailsMap);
  downloadPdf(doc, 'dance-session-pack.pdf');
}

export async function exportVocalSlotPdf() {
  assertStaff();
  const [{ data: roster }, { data: slots }] = await Promise.all([
    fetchVocalRoster(),
    fetchAllVocalSlots(),
  ]);
  const grouped = groupVocalRosterBySlots(roster || [], slots || []);
  const studentIds = (roster || []).map((r) => r.students?.id).filter(Boolean);
  const detailsMap = await fetchStudentDetailsMap(studentIds);
  const doc = generateVocalSlotPdf(grouped, detailsMap);
  downloadPdf(doc, 'vocal-slot-pack.pdf');
}

export async function exportFullTrackPdf() {
  assertStaff();
  const [{ data: students }, { data: danceRoster }, { data: vocalRoster }] =
    await Promise.all([
      fetchAllStudentsForCallbacks(),
      fetchDanceRoster(),
      fetchVocalRoster(),
    ]);
  const allStudents = students || [];
  const studentIds = allStudents.map((s) => s.id);
  const detailsMap = await fetchStudentDetailsMap(studentIds);
  const doc = generateFullTrackPdf(allStudents, danceRoster || [], vocalRoster || [], detailsMap);
  downloadPdf(doc, 'full-audition-pack.pdf');
}
