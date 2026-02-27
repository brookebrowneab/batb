import { test, expect } from '@playwright/test';
import { setupSupabaseMock, loginAsFamily, loginAsStaff } from './helpers/setupMocks.js';
import {
  FAMILY_USER,
  STAFF_USER,
  STAFF_PROFILE,
  ADMIN_USER,
  ADMIN_PROFILE,
} from './helpers/mockData.js';

test.describe('Home page', () => {
  test('renders hero section for unauthenticated users', async ({ page }) => {
    await setupSupabaseMock(page);
    await page.goto('/');
    await expect(page.getByText('Beauty and the Beast')).toBeVisible();
    await expect(page.getByText('Be our guest')).toBeVisible();
    await expect(page.getByRole('link', { name: /family login/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /staff login/i })).toBeVisible();
  });
});

test.describe('Family login', () => {
  test.beforeEach(async ({ page }) => {
    await setupSupabaseMock(page, { authUser: FAMILY_USER, staffProfiles: [] });
  });

  test('shows password login form by default', async ({ page }) => {
    await page.goto('/#/family/login');
    await expect(page.locator('#family-password-form')).toBeVisible();
    await expect(page.locator('#family-pw-email')).toBeVisible();
    await expect(page.locator('#family-pw-password')).toBeVisible();
  });

  test('can switch to signup form', async ({ page }) => {
    await page.goto('/#/family/login');
    await page.locator('#show-signup-toggle').click();
    await expect(page.locator('#family-signup-section')).toBeVisible();
    await expect(page.locator('#family-signup-email')).toBeVisible();
  });

  test('can switch to magic link form', async ({ page }) => {
    await page.goto('/#/family/login');
    await page.locator('#show-magic-toggle').click();
    await expect(page.locator('#family-magic-section')).toBeVisible();
    await expect(page.locator('#family-magic-email')).toBeVisible();
  });

  test('signs in with email and password', async ({ page }) => {
    await page.goto('/#/family/login');
    await page.locator('#family-pw-email').fill('parent@example.com');
    await page.locator('#family-pw-password').fill('password123');
    await page.locator('#family-password-form button[type="submit"]').click();
    // After login, should redirect to family dashboard
    await expect(page).toHaveURL(/#\/family$/);
  });

  test('shows error for blocked email domain', async ({ page }) => {
    await page.goto('/#/family/login');
    await page.locator('#family-pw-email').fill('student@students.k12.dc.us');
    await page.locator('#family-pw-password').fill('password123');
    await page.locator('#family-password-form button[type="submit"]').click();
    await expect(page.locator('#family-pw-msg')).toContainText(/student email/i);
  });
});

test.describe('Staff login', () => {
  test.beforeEach(async ({ page }) => {
    await setupSupabaseMock(page, { authUser: STAFF_USER, staffProfiles: [STAFF_PROFILE] });
  });

  test('shows staff login form', async ({ page }) => {
    await page.goto('/#/staff/login');
    await expect(page.locator('#staff-login-form')).toBeVisible();
    await expect(page.locator('#staff-email')).toBeVisible();
    await expect(page.locator('#staff-password')).toBeVisible();
  });

  test('signs in with staff credentials', async ({ page }) => {
    await page.goto('/#/staff/login');
    await page.locator('#staff-email').fill('staff@theater.org');
    await page.locator('#staff-password').fill('staffpass123');
    await page.locator('#staff-login-form button[type="submit"]').click();
    // After login, should redirect to staff dashboard
    await expect(page).toHaveURL(/#\/staff$/);
  });
});

test.describe('Route guards', () => {
  test('unauthenticated user cannot access family routes', async ({ page }) => {
    await setupSupabaseMock(page);
    await page.goto('/#/family');
    // Should be redirected to login
    await expect(page).toHaveURL(/#\/family\/login$/);
  });

  test('unauthenticated user cannot access staff routes', async ({ page }) => {
    await setupSupabaseMock(page);
    await page.goto('/#/staff');
    await expect(page).toHaveURL(/#\/staff\/login$/);
  });

  test('family user cannot access staff routes', async ({ page }) => {
    await loginAsFamily(page);
    await page.goto('/#/staff');
    // Family users should be redirected away from staff routes
    await expect(page).not.toHaveURL(/#\/staff$/);
  });

  test('staff user can access staff dashboard', async ({ page }) => {
    await loginAsStaff(page);
    await page.goto('/#/staff');
    await expect(page.getByRole('heading', { name: /Stage Manager/ })).toBeVisible();
  });
});
