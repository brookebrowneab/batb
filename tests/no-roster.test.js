import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Structural test: verify no public roster endpoints or pages exist.
 *
 * Families accessing their OWN students via RLS-protected adapters is allowed.
 * What must NOT exist: public roster routes, staff roster pages without auth,
 * or any /roster or /students route registered in the router.
 */

function getAllSourceFiles(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      getAllSourceFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('No public roster access', () => {
  it('no source file exposes a /roster or /students route', () => {
    const srcDir = join(process.cwd(), 'src');
    const files = getAllSourceFiles(srcDir);

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      // No public roster route should be registered
      expect(content).not.toMatch(/['"]\/roster['"]/);
      expect(content).not.toMatch(/['"]\/students['"]/);
    }
  });

  it('students adapter only allows family-scoped queries (ownership filter present)', () => {
    const adapterPath = join(process.cwd(), 'src', 'adapters', 'students.js');
    const content = readFileSync(adapterPath, 'utf-8');

    // The fetchStudentsByFamily function must filter by family_account_id
    expect(content).toMatch(/family_account_id/);
    // There must not be an unfiltered "fetch all students" function
    expect(content).not.toMatch(/fetchAllStudents/);
  });
});
