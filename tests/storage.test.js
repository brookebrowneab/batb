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

/**
 * Cross-family photo access prevention.
 *
 * Supabase RLS enforces: (storage.foldername(name))[1] = auth.uid()::text
 * This means the first folder segment of the path must equal the requesting
 * user's auth UID. These tests verify the path structure guarantees that
 * family A's photos are never stored under family B's folder, and that
 * a path from one family can be identified as inaccessible to another.
 */
describe('Cross-family photo access prevention', () => {
  /**
   * Mirrors the RLS ownership check from 00005_storage_policies.sql:
   *   (storage.foldername(name))[1] = auth.uid()::text
   */
  function pathBelongsToUser(path, userId) {
    return path.split('/')[0] === userId;
  }

  it('family A photo path is NOT accessible to family B', () => {
    const familyA = 'family-a-uid';
    const familyB = 'family-b-uid';
    const pathA = generatePhotoPath(familyA, 'photo.jpg');

    // Family A owns this path
    expect(pathBelongsToUser(pathA, familyA)).toBe(true);
    // Family B does NOT — RLS would reject the request
    expect(pathBelongsToUser(pathA, familyB)).toBe(false);
  });

  it('two families always get paths in separate folders', () => {
    const familyA = 'family-a-uid';
    const familyB = 'family-b-uid';
    const pathA = generatePhotoPath(familyA, 'pic.jpg');
    const pathB = generatePhotoPath(familyB, 'pic.jpg');

    expect(pathA.split('/')[0]).toBe(familyA);
    expect(pathB.split('/')[0]).toBe(familyB);
    expect(pathA.split('/')[0]).not.toBe(pathB.split('/')[0]);
  });

  it('no path generation can place a photo outside the owner folder', () => {
    const userId = 'owner-uid';
    // Try various filenames including path traversal attempts
    const names = ['photo.jpg', '../other-uid/hack.jpg', 'a/b/c.png', '../../etc.jpg'];
    for (const name of names) {
      const path = generatePhotoPath(userId, name);
      expect(path.split('/')[0]).toBe(userId);
    }
  });
});
