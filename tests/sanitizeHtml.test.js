import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { isHtmlContent, renderContractText } from '../src/ui/sanitizeHtml.js';

// ── Unit tests ──

describe('isHtmlContent', () => {
  it('returns false for plain text', () => {
    expect(isHtmlContent('This is a plain text contract.')).toBe(false);
  });

  it('returns false for empty/null input', () => {
    expect(isHtmlContent('')).toBe(false);
    expect(isHtmlContent(null)).toBe(false);
    expect(isHtmlContent(undefined)).toBe(false);
  });

  it('returns true for HTML with tags', () => {
    expect(isHtmlContent('<p>Hello</p>')).toBe(true);
    expect(isHtmlContent('<h1>Title</h1><p>Body</p>')).toBe(true);
  });

  it('returns true for simple inline tags', () => {
    expect(isHtmlContent('Some <strong>bold</strong> text')).toBe(true);
  });
});

describe('renderContractText', () => {
  it('wraps plain text in a pre-wrap div with escaping', () => {
    const result = renderContractText('Hello "world" & friends\nLine 2');
    expect(result).toContain('white-space:pre-wrap');
    expect(result).toContain('&amp;');
  });

  it('returns sanitized HTML for HTML content', () => {
    const result = renderContractText('<p>Hello <strong>world</strong></p>');
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
    expect(result).not.toContain('white-space:pre-wrap');
  });

  it('strips dangerous tags from HTML', () => {
    const result = renderContractText('<p>OK</p><script>alert("xss")</script>');
    expect(result).toContain('<p>OK</p>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  it('strips event handler attributes', () => {
    const result = renderContractText('<p onclick="alert(1)">Click</p>');
    expect(result).not.toContain('onclick');
  });

  it('returns empty string for null/empty', () => {
    expect(renderContractText('')).toBe('');
    expect(renderContractText(null)).toBe('');
  });
});

// ── Structural tests ──

describe('structural: rich text contract integration', () => {
  it('adminContracts.js imports Quill', () => {
    const src = fs.readFileSync('src/pages/adminContracts.js', 'utf8');
    expect(src).toContain("from 'quill'");
  });

  it('adminContracts.js uses renderContractText for preview', () => {
    const src = fs.readFileSync('src/pages/adminContracts.js', 'utf8');
    expect(src).toContain('renderContractText');
  });

  it('familyContract.js imports renderContractText', () => {
    const src = fs.readFileSync('src/pages/familyContract.js', 'utf8');
    expect(src).toContain('renderContractText');
  });

  it('familyRegistration.js imports renderContractText', () => {
    const src = fs.readFileSync('src/pages/familyRegistration.js', 'utf8');
    expect(src).toContain('renderContractText');
  });

  it('familyContract.js uses renderContractText for text_snapshot display', () => {
    const src = fs.readFileSync('src/pages/familyContract.js', 'utf8');
    expect(src).toContain('renderContractText(activeContract.text_snapshot)');
  });

  it('familyRegistration.js uses renderContractText for text_snapshot display', () => {
    const src = fs.readFileSync('src/pages/familyRegistration.js', 'utf8');
    expect(src).toContain('renderContractText(activeContract.text_snapshot)');
  });
});
