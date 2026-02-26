import { describe, it, expect } from 'vitest';

// Import the router module to verify it loads correctly
import { addRoute, currentPath, navigate } from '../src/router.js';

describe('Router module', () => {
  it('exports required functions', () => {
    expect(typeof addRoute).toBe('function');
    expect(typeof currentPath).toBe('function');
    expect(typeof navigate).toBe('function');
  });

  it('currentPath returns "/" when no hash is set', () => {
    // In test environment, window.location.hash is empty
    const path = currentPath();
    expect(path).toBe('/');
  });
});

describe('Test runner sanity check', () => {
  it('runs a trivial assertion', () => {
    expect(1 + 1).toBe(2);
  });
});
