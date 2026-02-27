/**
 * Escapes HTML special characters in a string to prevent XSS
 * when inserting user-provided data into innerHTML.
 *
 * @param {string} text — raw text to escape
 * @returns {string} HTML-safe string
 */
export function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}
