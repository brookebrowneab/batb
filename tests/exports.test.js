import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildCsvString,
  danceRosterToCsvData,
  vocalRosterToCsvData,
  callbacksToCsvData,
  groupDanceRosterBySessions,
  groupVocalRosterBySlots,
  canExport,
  pdfFooterText,
} from '../src/domain/exports.js';

const root = process.cwd();

// --- canExport ---

describe('canExport', () => {
  it('allows admin', () => {
    expect(canExport('admin')).toEqual({ allowed: true, reason: null });
  });

  it('allows director', () => {
    expect(canExport('director')).toEqual({ allowed: true, reason: null });
  });

  it('blocks family role', () => {
    const result = canExport('family');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('staff');
  });

  it('blocks null role', () => {
    expect(canExport(null).allowed).toBe(false);
  });

  it('blocks undefined role', () => {
    expect(canExport(undefined).allowed).toBe(false);
  });
});

// --- buildCsvString ---

describe('buildCsvString', () => {
  it('starts with UTF-8 BOM', () => {
    const csv = buildCsvString(['A'], [['1']]);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
  });

  it('generates header row and data rows', () => {
    const csv = buildCsvString(['Name', 'Grade'], [['Jane', '10'], ['Bob', '11']]);
    const lines = csv.replace('\uFEFF', '').split('\r\n');
    expect(lines[0]).toBe('Name,Grade');
    expect(lines[1]).toBe('Jane,10');
    expect(lines[2]).toBe('Bob,11');
  });

  it('escapes fields with commas', () => {
    const csv = buildCsvString(['A'], [['hello, world']]);
    expect(csv).toContain('"hello, world"');
  });

  it('escapes fields with double quotes', () => {
    const csv = buildCsvString(['A'], [['say "hi"']]);
    expect(csv).toContain('"say ""hi"""');
  });

  it('escapes fields with newlines', () => {
    const csv = buildCsvString(['A'], [['line1\nline2']]);
    expect(csv).toContain('"line1\nline2"');
  });

  it('handles null and undefined values', () => {
    const csv = buildCsvString(['A', 'B'], [[null, undefined]]);
    const lines = csv.replace('\uFEFF', '').split('\r\n');
    expect(lines[1]).toBe(',');
  });

  it('returns header only for empty rows', () => {
    const csv = buildCsvString(['A'], []);
    const lines = csv.replace('\uFEFF', '').trim().split('\r\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('A');
  });
});

// --- danceRosterToCsvData ---

describe('danceRosterToCsvData', () => {
  it('returns correct headers', () => {
    const { headers } = danceRosterToCsvData([]);
    expect(headers).toContain('Student First Name');
    expect(headers).toContain('Session Date');
    expect(headers).toContain('Session Label');
  });

  it('maps roster data to rows', () => {
    const roster = [{
      students: { first_name: 'Jane', last_name: 'Doe', grade: '10' },
      dance_sessions: { audition_date: '2026-05-01', start_time: '09:00', end_time: '10:00', label: 'Group A' },
    }];
    const { rows } = danceRosterToCsvData(roster);
    expect(rows).toHaveLength(1);
    expect(rows[0][0]).toBe('Jane');
    expect(rows[0][1]).toBe('Doe');
    expect(rows[0][3]).toBe('2026-05-01');
  });

  it('handles null students gracefully', () => {
    const roster = [{ students: null, dance_sessions: null }];
    const { rows } = danceRosterToCsvData(roster);
    expect(rows[0][0]).toBe('');
  });
});

// --- vocalRosterToCsvData ---

describe('vocalRosterToCsvData', () => {
  it('returns correct headers', () => {
    const { headers } = vocalRosterToCsvData([]);
    expect(headers).toContain('Student First Name');
    expect(headers).toContain('Slot Date');
  });

  it('maps roster data to rows', () => {
    const roster = [{
      students: { first_name: 'Bob', last_name: 'Smith', grade: '11' },
      audition_slots: { audition_date: '2026-05-02', start_time: '14:00', end_time: '14:15' },
    }];
    const { rows } = vocalRosterToCsvData(roster);
    expect(rows[0][0]).toBe('Bob');
    expect(rows[0][3]).toBe('2026-05-02');
  });
});

// --- callbacksToCsvData ---

describe('callbacksToCsvData', () => {
  it('returns correct headers', () => {
    const { headers } = callbacksToCsvData([]);
    expect(headers).toContain('Callback Invited');
    expect(headers).toContain('Registration Complete');
    expect(headers).toContain('Parent 2 Email');
    expect(headers).toContain('Parent 2 First Name');
    expect(headers).toContain('Student Email');
    expect(headers).toContain('Sings Own Song');
    expect(headers).toContain('Song Name');
  });

  it('maps callback_invited boolean to Yes/No', () => {
    const students = [
      { first_name: 'A', callback_invited: true, registration_complete: false },
      { first_name: 'B', callback_invited: false, registration_complete: true },
    ];
    const { rows } = callbacksToCsvData(students);
    expect(rows[0][3]).toBe('Yes');
    expect(rows[0][4]).toBe('No');
    expect(rows[1][3]).toBe('No');
    expect(rows[1][4]).toBe('Yes');
  });

  it('maps sings_own_disney_song boolean to Yes/No', () => {
    const students = [
      { first_name: 'A', sings_own_disney_song: true, song_name: 'Let It Go' },
      { first_name: 'B', sings_own_disney_song: false },
    ];
    const { rows } = callbacksToCsvData(students);
    expect(rows[0][10]).toBe('Yes');
    expect(rows[0][11]).toBe('Let It Go');
    expect(rows[1][10]).toBe('No');
    expect(rows[1][11]).toBe('');
  });
});

// --- groupDanceRosterBySessions ---

describe('groupDanceRosterBySessions', () => {
  it('groups roster entries by session', () => {
    const sessions = [{ id: 's1' }, { id: 's2' }];
    const roster = [
      { dance_session_id: 's1', students: { id: 'a', first_name: 'A' } },
      { dance_session_id: 's1', students: { id: 'b', first_name: 'B' } },
      { dance_session_id: 's2', students: { id: 'c', first_name: 'C' } },
    ];
    const grouped = groupDanceRosterBySessions(roster, sessions);
    expect(grouped).toHaveLength(2);
    expect(grouped[0].students).toHaveLength(2);
    expect(grouped[1].students).toHaveLength(1);
  });

  it('returns empty students for sessions with no signups', () => {
    const sessions = [{ id: 's1' }];
    const grouped = groupDanceRosterBySessions([], sessions);
    expect(grouped[0].students).toHaveLength(0);
  });

  it('filters out null students', () => {
    const sessions = [{ id: 's1' }];
    const roster = [{ dance_session_id: 's1', students: null }];
    const grouped = groupDanceRosterBySessions(roster, sessions);
    expect(grouped[0].students).toHaveLength(0);
  });
});

// --- groupVocalRosterBySlots ---

describe('groupVocalRosterBySlots', () => {
  it('groups roster entries by slot', () => {
    const slots = [{ id: 'v1' }, { id: 'v2' }];
    const roster = [
      { audition_slot_id: 'v1', students: { id: 'a' } },
      { audition_slot_id: 'v2', students: { id: 'b' } },
    ];
    const grouped = groupVocalRosterBySlots(roster, slots);
    expect(grouped).toHaveLength(2);
    expect(grouped[0].students).toHaveLength(1);
    expect(grouped[1].students).toHaveLength(1);
  });
});

// --- pdfFooterText ---

describe('pdfFooterText', () => {
  it('contains "Staff Only"', () => {
    expect(pdfFooterText()).toContain('Staff Only');
  });

  it('contains "Do Not Distribute"', () => {
    expect(pdfFooterText()).toContain('Do Not Distribute');
  });

  it('contains "Generated"', () => {
    expect(pdfFooterText()).toContain('Generated');
  });
});

// --- Structural / Authorization Tests ---

describe('Export authorization (structural)', () => {
  const orchestration = readFileSync(join(root, 'src/exports/index.js'), 'utf-8');
  const pdfExport = readFileSync(join(root, 'src/exports/pdfExport.js'), 'utf-8');
  const csvExport = readFileSync(join(root, 'src/exports/csvExport.js'), 'utf-8');

  it('orchestration imports canExport from domain', () => {
    expect(orchestration).toContain('canExport');
    expect(orchestration).toContain("from '../domain/exports.js'");
  });

  it('every exported async function calls assertStaff()', () => {
    const exportFunctions = orchestration.match(/export async function \w+/g) || [];
    expect(exportFunctions.length).toBeGreaterThanOrEqual(6);
    for (const fn of exportFunctions) {
      const fnStart = orchestration.indexOf(fn);
      const fnBody = orchestration.slice(fnStart, orchestration.indexOf('export async function', fnStart + 1) || undefined);
      expect(fnBody).toContain('assertStaff()');
    }
  });

  it('pdfExport checks canExport before generating', () => {
    expect(pdfExport).toContain('canExport');
  });

  it('csvExport checks canExport before downloading', () => {
    expect(csvExport).toContain('canExport');
  });

  it('no public share URL generation in any export file', () => {
    const files = [orchestration, pdfExport, csvExport];
    for (const content of files) {
      expect(content).not.toContain('getPublicUrl');
      expect(content).not.toContain('publicUrl');
      expect(content).not.toContain('shareLink');
      expect(content).not.toContain('share_link');
    }
  });
});

describe('Photo retrieval security (structural)', () => {
  const orchestration = readFileSync(join(root, 'src/exports/index.js'), 'utf-8');
  const pdfExport = readFileSync(join(root, 'src/exports/pdfExport.js'), 'utf-8');

  it('photos are fetched via getSignedPhotoUrl only', () => {
    expect(orchestration).toContain('getSignedPhotoUrl');
    expect(orchestration).not.toContain('getPublicUrl');
  });

  it('pdfExport loads images via fetch and readAsDataURL', () => {
    expect(pdfExport).toContain('loadImageAsDataUrl');
    expect(pdfExport).toContain('readAsDataURL');
  });
});

describe('Export buttons on roster pages (structural)', () => {
  const danceRoster = readFileSync(join(root, 'src/pages/staffDanceRoster.js'), 'utf-8');
  const vocalRoster = readFileSync(join(root, 'src/pages/staffVocalRoster.js'), 'utf-8');
  const callbacksPage = readFileSync(join(root, 'src/pages/staffCallbacks.js'), 'utf-8');

  it('dance roster imports export functions', () => {
    expect(danceRoster).toContain('exportDanceSessionPdf');
    expect(danceRoster).toContain('exportDanceRosterCsv');
    expect(danceRoster).toContain("from '../exports/index.js'");
  });

  it('vocal roster imports export functions', () => {
    expect(vocalRoster).toContain('exportVocalSlotPdf');
    expect(vocalRoster).toContain('exportVocalRosterCsv');
    expect(vocalRoster).toContain("from '../exports/index.js'");
  });

  it('callbacks page imports export functions', () => {
    expect(callbacksPage).toContain('exportFullTrackPdf');
    expect(callbacksPage).toContain('exportCallbacksCsv');
    expect(callbacksPage).toContain("from '../exports/index.js'");
  });

  it('dance roster has PDF and CSV export buttons', () => {
    expect(danceRoster).toContain('export-dance-pdf-btn');
    expect(danceRoster).toContain('export-dance-csv-btn');
  });

  it('vocal roster has PDF and CSV export buttons', () => {
    expect(vocalRoster).toContain('export-vocal-pdf-btn');
    expect(vocalRoster).toContain('export-vocal-csv-btn');
  });

  it('callbacks page has PDF and CSV export buttons', () => {
    expect(callbacksPage).toContain('export-callbacks-pdf-btn');
    expect(callbacksPage).toContain('export-callbacks-csv-btn');
  });
});

describe('Domain exports purity (structural)', () => {
  const domainExports = readFileSync(join(root, 'src/domain/exports.js'), 'utf-8');
  const domainIndex = readFileSync(join(root, 'src/domain/index.js'), 'utf-8');

  it('domain/exports.js does not import from adapters', () => {
    expect(domainExports).not.toContain("from '../adapters/");
    expect(domainExports).not.toContain('supabase');
  });

  it('domain/exports.js does not import jspdf', () => {
    expect(domainExports).not.toContain('jspdf');
  });

  it('domain index re-exports exports module', () => {
    expect(domainIndex).toContain('exports');
  });
});

describe('No family export routes (structural)', () => {
  const mainJs = readFileSync(join(root, 'src/main.js'), 'utf-8');

  it('main.js does not expose export routes under /family', () => {
    expect(mainJs).not.toContain("'/family/export");
  });

  it('no family page imports from exports', () => {
    const familyPages = [
      'familyDashboard.js', 'familyLogin.js', 'familyContract.js',
      'familyRegistration.js', 'familySchedule.js', 'familyDanceSignup.js', 'familyVocalBooking.js',
    ];
    for (const page of familyPages) {
      const content = readFileSync(join(root, 'src/pages', page), 'utf-8');
      expect(content).not.toContain("from '../exports/");
    }
  });
});
