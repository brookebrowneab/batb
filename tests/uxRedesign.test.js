import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

function readSrc(relPath) {
  return readFileSync(join(root, relPath), 'utf-8');
}

// --- Phase 0: Design System Foundation ---

describe('Google Fonts (structural)', () => {
  const html = readSrc('index.html');

  it('preconnects to Google Fonts', () => {
    expect(html).toContain('fonts.googleapis.com');
    expect(html).toContain('fonts.gstatic.com');
  });

  it('loads DM Serif Display font', () => {
    expect(html).toContain('DM+Serif+Display');
  });

  it('loads Inter font', () => {
    expect(html).toContain('Inter');
  });
});

describe('CSS design tokens (structural)', () => {
  const css = readSrc('src/ui/styles.css');

  it('defines color-primary token', () => {
    expect(css).toContain('--color-primary');
  });

  it('defines color-accent (gold) token', () => {
    expect(css).toContain('--color-accent');
  });

  it('defines color-burgundy token', () => {
    expect(css).toContain('--color-burgundy');
  });

  it('defines color-bg (cream) token', () => {
    expect(css).toContain('--color-bg');
  });

  it('defines font-display token', () => {
    expect(css).toContain('--font-display');
    expect(css).toContain('DM Serif Display');
  });

  it('defines font-body token', () => {
    expect(css).toContain('--font-body');
    expect(css).toContain('Inter');
  });

  it('has mobile-first responsive breakpoint', () => {
    expect(css).toContain('@media (max-width: 768px)');
  });

  it('has touch target media query', () => {
    expect(css).toContain('@media (pointer: coarse)');
  });
});

// --- Phase 0: Icons ---

describe('Icons module (structural)', () => {
  const icons = readSrc('src/ui/icons.js');

  it('exports ICONS object', () => {
    expect(icons).toContain('export const ICONS');
  });

  it('contains core icons', () => {
    expect(icons).toContain('rose');
    expect(icons).toContain('theater');
    expect(icons).toContain('dance');
    expect(icons).toContain('vocal');
    expect(icons).toContain('callback');
  });
});

// --- Phase 1: Components ---

describe('UI components module (structural)', () => {
  const components = readSrc('src/ui/components.js');

  it('exports buildButton', () => {
    expect(components).toContain('export function buildButton');
  });

  it('exports buildStatusBadge', () => {
    expect(components).toContain('export function buildStatusBadge');
  });

  it('exports buildCapacityBar', () => {
    expect(components).toContain('export function buildCapacityBar');
  });

  it('exports buildWizardProgress', () => {
    expect(components).toContain('export function buildWizardProgress');
  });

  it('exports showConfirmDialog', () => {
    expect(components).toContain('export function showConfirmDialog');
  });

  it('exports buildSlideOver', () => {
    expect(components).toContain('export function buildSlideOver');
  });

  it('exports buildEnchantedBanner', () => {
    expect(components).toContain('export function buildEnchantedBanner');
  });

  it('exports buildAvatar', () => {
    expect(components).toContain('export function buildAvatar');
  });

  it('exports buildStatCard', () => {
    expect(components).toContain('export function buildStatCard');
  });

  it('exports buildSearchableSelect', () => {
    expect(components).toContain('export function buildSearchableSelect');
  });
});

// --- Phase 1: Layouts ---

describe('Layouts module (structural)', () => {
  const layouts = readSrc('src/ui/layouts.js');

  it('exports buildFamilyLayout', () => {
    expect(layouts).toContain('export function buildFamilyLayout');
  });

  it('exports buildStaffLayout', () => {
    expect(layouts).toContain('export function buildStaffLayout');
  });

  it('exports buildPublicLayout', () => {
    expect(layouts).toContain('export function buildPublicLayout');
  });

  it('contains route-content element for router', () => {
    expect(layouts).toContain('route-content');
  });
});

// --- Phase 1: Main layout integration ---

describe('Main.js layout integration (structural)', () => {
  const main = readSrc('src/main.js');

  it('imports layout builders', () => {
    expect(main).toContain("from './ui/layouts.js'");
  });

  it('preserves all route registrations', () => {
    expect(main).toContain("addRoute('/'");
    expect(main).toContain("addRoute('/family/login'");
    expect(main).toContain("addRoute('/staff/login'");
    expect(main).toContain("addRoute('/family'");
    expect(main).toContain("addRoute('/staff'");
  });
});

// --- All pages still use escapeHtml ---

describe('Pages with user data import escapeHtml (structural)', () => {
  const pagesWithUserData = [
    'familyDashboard.js', 'familyRegistration.js', 'familyContract.js',
    'familyDanceSignup.js', 'familyVocalBooking.js',
    'staffDashboard.js', 'adminDashboard.js',
    'staffDanceRoster.js', 'staffVocalRoster.js',
    'staffCallbacks.js', 'staffStudentProfile.js',
  ];

  pagesWithUserData.forEach((page) => {
    it(`${page} imports escapeHtml`, () => {
      const src = readSrc(`src/pages/${page}`);
      expect(src).toContain('escapeHtml');
    });
  });
});

// --- CSS class preservation ---

describe('CSS preserves required class names (structural)', () => {
  const css = readSrc('src/ui/styles.css');
  const requiredClasses = [
    '.page', '.login-form', '.data-table', '.badge',
    '.btn-small', '.session-card', '.student-card',
    '.success-box', '.warning-box', '.locked-notice',
    '.placeholder-notice', '.form-message', '.home-actions',
    '.contract-text', '.student-selector', '.link-btn',
    '.table-responsive', '.form-section', '.photo-preview',
    '.btn-secondary',
  ];

  requiredClasses.forEach((cls) => {
    it(`defines ${cls}`, () => {
      expect(css).toContain(cls);
    });
  });
});

describe('CSS defines new design system classes (structural)', () => {
  const css = readSrc('src/ui/styles.css');
  const newClasses = [
    '.btn-primary', '.btn-accent', '.btn-ghost',
    '.card', '.enchanted-banner',
    '.status-badge--complete', '.status-badge--pending',
    '.capacity-bar', '.hero-section', '.wizard-progress',
    '.slide-over', '.bottom-tabs', '.sidebar', '.top-bar',
    '.confirm-dialog', '.avatar', '.quick-actions',
    '.stat-card', '.bulk-action-bar', '.login-card',
  ];

  newClasses.forEach((cls) => {
    it(`defines ${cls}`, () => {
      expect(css).toContain(cls);
    });
  });
});
