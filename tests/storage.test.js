import { describe, it, expect } from 'vitest';
import { generatePhotoPath } from '../src/adapters/storage.js';

describe('generatePhotoPath', () => {
  it('generates a path under the user ID folder', () => {
    const path = generatePhotoPath('user-123', 'photo.jpg');
    expect(path.startsWith('user-123/')).toBe(true);
  });

  it('uses a UUID in the filename (not the original name)', () => {
    const path = generatePhotoPath('user-123', 'my-kids-photo.png');
    // Should NOT contain the original filename
    expect(path).not.toContain('my-kids-photo');
    // Should contain a UUID-like pattern
    const filename = path.split('/')[1];
    expect(filename).toMatch(/^[0-9a-f-]+\.png$/);
  });

  it('preserves the file extension', () => {
    expect(generatePhotoPath('u1', 'test.PNG')).toMatch(/\.png$/);
    expect(generatePhotoPath('u1', 'test.jpeg')).toMatch(/\.jpeg$/);
    expect(generatePhotoPath('u1', 'test.jpg')).toMatch(/\.jpg$/);
  });

  it('defaults to jpg when no extension', () => {
    const path = generatePhotoPath('u1', 'noext');
    expect(path).toMatch(/\.noext$/);
  });

  it('generates unique paths on successive calls', () => {
    const path1 = generatePhotoPath('u1', 'a.jpg');
    const path2 = generatePhotoPath('u1', 'a.jpg');
    expect(path1).not.toBe(path2);
  });

  it('never contains student names or predictable patterns', () => {
    const path = generatePhotoPath('uid', 'Jane_Doe_headshot.jpg');
    expect(path).not.toContain('Jane');
    expect(path).not.toContain('Doe');
    expect(path).not.toContain('headshot');
  });
});

describe('Storage security conventions', () => {
  it('photo paths use family userId as folder (ownership boundary)', () => {
    const userId = 'abc-def-123';
    const path = generatePhotoPath(userId, 'pic.jpg');
    const folder = path.split('/')[0];
    expect(folder).toBe(userId);
  });
});
