/**
 * PDF export — generates audition pack PDFs using jspdf.
 */
import { jsPDF } from 'jspdf';
import { getAuthState } from '../auth.js';
import { canExport, pdfFooterText } from '../domain/exports.js';
import { formatTime } from '../domain/scheduling.js';

const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const FOOTER_Y = PAGE_HEIGHT - 10;
const PHOTO_SIZE = 30;

/**
 * Load an image URL as a base64 data URL for embedding in PDF.
 * Returns null if loading fails (graceful degradation).
 * @param {string} url - signed URL
 * @returns {Promise<string|null>}
 */
export async function loadImageAsDataUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Add header and footer to the current PDF page.
 */
function addHeaderFooter(doc, title) {
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(`BATB Audition Pack — ${title}`, MARGIN, MARGIN + 5);
  doc.setDrawColor(0);
  doc.line(MARGIN, MARGIN + 8, PAGE_WIDTH - MARGIN, MARGIN + 8);

  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(128);
  doc.text(pdfFooterText(), MARGIN, FOOTER_Y);
  doc.setTextColor(0);
}

/**
 * Render a single student block on the PDF.
 * @returns {number} new Y position after the block
 */
function renderStudentBlock(doc, student, options) {
  const { photoDataUrl, participation, evaluations, title } = options;
  let y = options.startY;

  const extraLines = (student.parent2_first_name || student.parent2_email ? 6 : 0) + (student.sings_own_disney_song ? 6 : 0);
  const estHeight = 35 + 20 + extraLines + (participation ? 10 : 0)
    + Math.max(evaluations.length * 8, 5) + 25 + 10;

  if (y + estHeight > FOOTER_Y - 10) {
    doc.addPage();
    addHeaderFooter(doc, title);
    y = MARGIN + 15;
  }

  const infoX = MARGIN + (photoDataUrl ? PHOTO_SIZE + 5 : 0);
  if (photoDataUrl) {
    try {
      doc.addImage(photoDataUrl, 'JPEG', MARGIN, y, PHOTO_SIZE, PHOTO_SIZE);
    } catch {
      // Photo failed to embed; continue without
    }
  }

  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(`${student.first_name || ''} ${student.last_name || ''}`, infoX, y + 5);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(`Grade: ${student.grade || 'N/A'}`, infoX, y + 11);

  if (student.parent_first_name || student.parent_email) {
    const parentLine = `Parent: ${student.parent_first_name || ''} ${student.parent_last_name || ''} | ${student.parent_email || ''} | ${student.parent_phone || ''}`;
    doc.text(parentLine, infoX, y + 17);
  }

  let extraY = 0;
  if (student.parent2_first_name || student.parent2_email) {
    const parent2Line = `Parent 2: ${student.parent2_first_name || ''} ${student.parent2_last_name || ''} | ${student.parent2_email || ''} | ${student.parent2_phone || ''}`;
    doc.text(parent2Line, infoX, y + 23 + extraY);
    extraY += 6;
  }
  if (student.sings_own_disney_song) {
    doc.text(`Song: ${student.song_name || 'N/A'}`, infoX, y + 23 + extraY);
    extraY += 6;
  }

  y += Math.max(PHOTO_SIZE + 2, 22 + extraY);

  if (participation) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.text(`${participation.label}: ${participation.detail}`, MARGIN, y);
    y += 6;
  }

  if (evaluations.length > 0) {
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Evaluation Notes:', MARGIN, y);
    y += 5;
    doc.setFont(undefined, 'normal');
    for (const ev of evaluations) {
      const line = `[${ev.track}] ${ev.notes} — ${ev.staffName}`;
      const splitLines = doc.splitTextToSize(line, CONTENT_WIDTH);
      doc.text(splitLines, MARGIN, y);
      y += splitLines.length * 4;
    }
  }

  y += 3;
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('Notes:', MARGIN, y);
  y += 4;
  doc.setFont(undefined, 'normal');
  for (let i = 0; i < 3; i++) {
    doc.setDrawColor(200);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 6;
  }

  y += 3;
  doc.setDrawColor(180);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  doc.setLineDashPattern([], 0);
  y += 5;

  return y;
}

/**
 * Format evaluations for PDF display.
 */
function formatEvals(evaluations, trackFilter) {
  return (evaluations || [])
    .filter((e) => !trackFilter || e.track === trackFilter || e.track === 'general')
    .map((e) => ({
      track: e.track,
      notes: e.notes,
      staffName: e.staff_profiles?.display_name || 'Staff',
    }));
}

/**
 * Generate a dance session PDF pack.
 */
export function generateDanceSessionPdf(groupedData, studentDetails) {
  const { role } = getAuthState();
  const { allowed } = canExport(role);
  if (!allowed) throw new Error('Not authorized');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const title = 'Dance Sessions';
  let firstPage = true;

  for (const group of groupedData) {
    if (!firstPage) doc.addPage();
    firstPage = false;
    addHeaderFooter(doc, title);

    let y = MARGIN + 15;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    const startTime = group.session.start_time || group.session.dance_start_time;
    const endTime = group.session.end_time || group.session.dance_end_time;
    const sessionLabel = group.session.label
      || `${formatTime(startTime)} – ${formatTime(endTime)}`;
    doc.text(`${group.session.audition_date} — ${sessionLabel}`, MARGIN, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`${group.students.length} student(s)`, MARGIN, y);
    y += 8;

    for (const student of group.students) {
      const details = studentDetails.get(student.id) || {};
      y = renderStudentBlock(doc, details.student || student, {
        photoDataUrl: details.photoDataUrl || null,
        participation: {
          label: 'Dance Session',
          detail: `${group.session.audition_date} ${sessionLabel}`,
        },
        evaluations: formatEvals(details.evaluations, 'dance'),
        startY: y,
        title,
      });
    }
  }

  return doc;
}

/**
 * Generate a vocal slot PDF pack.
 */
export function generateVocalSlotPdf(groupedData, studentDetails) {
  const { role } = getAuthState();
  const { allowed } = canExport(role);
  if (!allowed) throw new Error('Not authorized');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const title = 'Vocal Slots';
  let firstPage = true;

  for (const group of groupedData) {
    if (!firstPage) doc.addPage();
    firstPage = false;
    addHeaderFooter(doc, title);

    let y = MARGIN + 15;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    const slotLabel = `${formatTime(group.slot.start_time)} – ${formatTime(group.slot.end_time)}`;
    doc.text(`${group.slot.audition_date} — ${slotLabel}`, MARGIN, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`${group.students.length} student(s)`, MARGIN, y);
    y += 8;

    for (const student of group.students) {
      const details = studentDetails.get(student.id) || {};
      y = renderStudentBlock(doc, details.student || student, {
        photoDataUrl: details.photoDataUrl || null,
        participation: {
          label: 'Vocal Slot',
          detail: `${group.slot.audition_date} ${slotLabel}`,
        },
        evaluations: formatEvals(details.evaluations, 'vocal'),
        startY: y,
        title,
      });
    }
  }

  return doc;
}

/**
 * Generate a full track PDF pack (all students, all tracks).
 */
export function generateFullTrackPdf(allStudents, danceRoster, vocalRoster, studentDetails) {
  const { role } = getAuthState();
  const { allowed } = canExport(role);
  if (!allowed) throw new Error('Not authorized');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const title = 'Full Audition Pack';
  addHeaderFooter(doc, title);
  let y = MARGIN + 15;
  let firstStudent = true;

  const danceByStudent = new Map();
  for (const r of danceRoster) {
    const studentId = r.students?.id;
    if (!studentId) continue;
    if (danceByStudent.has(studentId)) continue; // Keep first assigned dance window for summary line.
    danceByStudent.set(studentId, r.dance_window || r.dance_sessions || null);
  }
  const vocalByStudent = new Map();
  for (const r of vocalRoster) {
    if (r.students?.id) vocalByStudent.set(r.students.id, r.audition_slots);
  }

  for (const student of allStudents) {
    if (!firstStudent && y > FOOTER_Y - 80) {
      doc.addPage();
      addHeaderFooter(doc, title);
      y = MARGIN + 15;
    }
    firstStudent = false;

    const details = studentDetails.get(student.id) || {};
    const dance = danceByStudent.get(student.id);
    const vocal = vocalByStudent.get(student.id);

    const parts = [];
    if (dance) {
      const label = dance.label || `${formatTime(dance.start_time)}-${formatTime(dance.end_time)}`;
      parts.push(`Dance: ${dance.audition_date} ${label}`);
    }
    if (vocal) {
      parts.push(`Vocal: ${vocal.audition_date} ${formatTime(vocal.start_time)}-${formatTime(vocal.end_time)}`);
    }
    if (student.callback_invited) {
      parts.push('Callbacks: Invited');
    }

    y = renderStudentBlock(doc, details.student || student, {
      photoDataUrl: details.photoDataUrl || null,
      participation: parts.length > 0 ? { label: 'Tracks', detail: parts.join(' | ') } : null,
      evaluations: formatEvals(details.evaluations, null),
      startY: y,
      title,
    });
  }

  return doc;
}

/**
 * Trigger download of a jsPDF document.
 */
export function downloadPdf(doc, filename) {
  doc.save(filename);
}
