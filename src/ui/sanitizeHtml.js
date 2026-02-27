import DOMPurify from 'dompurify';
import { escapeHtml } from './escapeHtml.js';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'pre', 'code',
  'span', 'div',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'style'];

/**
 * Sanitize HTML using DOMPurify with a restricted tag allowlist.
 * @param {string} html
 * @returns {string} sanitized HTML
 */
export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Detect whether a string contains HTML tags (vs legacy plain text).
 * @param {string} text
 * @returns {boolean}
 */
export function isHtmlContent(text) {
  if (!text || typeof text !== 'string') return false;
  return /<[a-z][\s\S]*>/i.test(text);
}

/**
 * Render contract text — auto-detects HTML vs plain text for backwards compat.
 * HTML contracts: sanitize and render.
 * Plain text contracts: escape and wrap in pre-formatted div.
 * @param {string} textSnapshot
 * @returns {string} safe HTML string
 */
export function renderContractText(textSnapshot) {
  if (!textSnapshot) return '';
  if (isHtmlContent(textSnapshot)) {
    return sanitizeHtml(textSnapshot);
  }
  return `<div style="white-space:pre-wrap">${escapeHtml(textSnapshot)}</div>`;
}
