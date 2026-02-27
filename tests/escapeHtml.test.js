import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Since escapeHtml relies on document.createElement (DOM), we test structurally:
// verify that all pages rendering user data import and use the shared utility.

const pagesDir = join(process.cwd(), 'src', 'pages');

const pagesWithUserData = [
  'familyDashboard.js',
  'familyDanceSignup.js',
  'familyVocalBooking.js',
  'familyContract.js',
  'familyRegistration.js',
  'staffDanceRoster.js',
  'staffVocalRoster.js',
  'staffCallbacks.js',
  'staffStudentProfile.js',
  'adminDashboard.js',
  'staffDashboard.js',
];

describe('escapeHtml usage (structural)', () => {
  pagesWithUserData.forEach((filename) => {
    it(`${filename} imports escapeHtml from shared utility`, () => {
      const content = readFileSync(join(pagesDir, filename), 'utf-8');
      expect(content).toContain("import { escapeHtml } from '../ui/escapeHtml.js'");
    });
  });

  it('no page defines its own escapeHtml function', () => {
    pagesWithUserData.forEach((filename) => {
      const content = readFileSync(join(pagesDir, filename), 'utf-8');
      expect(content).not.toMatch(/function escapeHtml/);
    });
  });

  it('shared escapeHtml module exists', () => {
    const content = readFileSync(
      join(process.cwd(), 'src', 'ui', 'escapeHtml.js'),
      'utf-8',
    );
    expect(content).toContain('export function escapeHtml');
    expect(content).toContain('textContent');
  });
});

describe('escapeHtml coverage — roster pages escape student names', () => {
  it('staffDanceRoster escapes first_name, last_name, and grade', () => {
    const content = readFileSync(join(pagesDir, 'staffDanceRoster.js'), 'utf-8');
    expect(content).toContain('escapeHtml(st?.first_name');
    expect(content).toContain('escapeHtml(st?.last_name');
    expect(content).toContain('escapeHtml(st?.grade');
  });

  it('staffVocalRoster escapes first_name, last_name, and grade', () => {
    const content = readFileSync(join(pagesDir, 'staffVocalRoster.js'), 'utf-8');
    expect(content).toContain('escapeHtml(st?.first_name');
    expect(content).toContain('escapeHtml(st?.last_name');
    expect(content).toContain('escapeHtml(st?.grade');
  });

  it('familyDashboard escapes student names', () => {
    const content = readFileSync(join(pagesDir, 'familyDashboard.js'), 'utf-8');
    expect(content).toContain('escapeHtml(student.first_name');
    expect(content).toContain('escapeHtml(student.last_name');
  });
});
