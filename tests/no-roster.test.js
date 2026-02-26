import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Integration-conceptual test: verify no roster/student-list endpoints or
 * pages exist at this milestone. This is a structural check — the codebase
 * must not expose any roster data without staff auth, and at M1 no roster
 * endpoints should exist at all.
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

describe('No roster access (M1)', () => {
  it('no source file contains a "students" table query', () => {
    const srcDir = join(process.cwd(), 'src');
    const files = getAllSourceFiles(srcDir);

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      // Check for Supabase .from('students') queries — none should exist yet
      expect(content).not.toMatch(/\.from\(['"]students['"]\)/);
    }
  });

  it('no source file exposes a roster route or page', () => {
    const srcDir = join(process.cwd(), 'src');
    const files = getAllSourceFiles(srcDir);

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      // No roster route should be registered
      expect(content).not.toMatch(/['"]\/roster['"]/);
      expect(content).not.toMatch(/['"]\/students['"]/);
    }
  });
});
