/**
 * CSV export — triggers browser download of a CSV string.
 */
import { getAuthState } from '../auth.js';
import { canExport } from '../domain/exports.js';

/**
 * Download a CSV string as a file.
 * @param {string} csvContent - full CSV string including BOM
 * @param {string} filename - download filename
 * @returns {{ error: string|null }}
 */
export function downloadCsv(csvContent, filename) {
  const { role } = getAuthState();
  const { allowed, reason } = canExport(role);
  if (!allowed) return { error: reason };

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { error: null };
}
