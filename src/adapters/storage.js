/**
 * Storage adapter — Supabase Storage operations for student photos.
 *
 * Photos are stored in the private 'student-photos' bucket.
 * Path convention: {family_auth_uid}/{uuid}.{ext}
 * Never use predictable student names in paths.
 */
import { supabase } from './supabase.js';

const BUCKET = 'student-photos';

/**
 * Generate a UUID-based storage path for a photo.
 * @param {string} userId - auth.uid() of the family user
 * @param {string} fileName - original file name (used only for extension)
 * @returns {string} storage path
 */
export function generatePhotoPath(userId, fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const uuid = crypto.randomUUID();
  return `${userId}/${uuid}.${ext}`;
}

/**
 * Upload a photo to private storage.
 * @param {string} path - storage path from generatePhotoPath
 * @param {File} file - the file to upload
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function uploadPhoto(path, file) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });
  return { data, error };
}

/**
 * Get a signed URL for a photo (time-limited access).
 * @param {string} path - storage path
 * @param {number} expiresIn - seconds until URL expires (default 300 = 5 min)
 * @returns {Promise<{url: string|null, error: Error|null}>}
 */
export async function getSignedPhotoUrl(path, expiresIn = 300) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  return { url: data?.signedUrl || null, error };
}

/**
 * Delete a photo from storage.
 * @param {string} path - storage path
 * @returns {Promise<{error: Error|null}>}
 */
export async function deletePhoto(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return { error };
}
