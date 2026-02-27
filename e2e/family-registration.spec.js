import { test, expect } from '@playwright/test';
import { loginAsFamily } from './helpers/setupMocks.js';
import { ACTIVE_CONTRACT, STUDENT_BELLE, STUDENT_INCOMPLETE } from './helpers/mockData.js';

test.describe('Family Registration Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFamily(page, {
      students: [],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [],
    });
  });

  test('shows step 1 (student info) for new registration', async ({ page }) => {
    await page.goto('/#/family/register');
    // Wizard progress should show step 1
    await expect(page.locator('.wizard-progress')).toBeVisible();
    await expect(page.locator('#reg-first-name')).toBeVisible();
    await expect(page.locator('#reg-last-name')).toBeVisible();
    await expect(page.locator('#reg-grade')).toBeVisible();
  });

  test('validates required fields on step 1', async ({ page }) => {
    await page.goto('/#/family/register');
    // Fill partial info — leave first name empty
    await page.locator('#reg-last-name').fill('LeGrand');
    await page.locator('#reg-grade').fill('11');
    // Try clicking submit button (the button click triggers validation)
    await page.locator('#student-form button[type="submit"]').click();
    // Should show validation error or stay on step 1
    await expect(page.locator('#reg-first-name')).toBeVisible();
  });

  test('submits step 1 and advances to step 2', async ({ page }) => {
    await page.goto('/#/family/register');

    await page.locator('#reg-first-name').fill('Gaston');
    await page.locator('#reg-last-name').fill('LeGrand');
    await page.locator('#reg-grade').fill('11');
    await page.locator('#student-form button[type="submit"]').click();

    // Should advance to step 2 (parent info)
    await expect(page.locator('#reg-parent-first')).toBeVisible();
  });

  test('submits step 2 and advances to step 3 (song)', async ({ page }) => {
    await page.goto('/#/family/register');

    // Step 1
    await page.locator('#reg-first-name').fill('Gaston');
    await page.locator('#reg-last-name').fill('LeGrand');
    await page.locator('#reg-grade').fill('11');
    await page.locator('#student-form button[type="submit"]').click();

    // Step 2
    await expect(page.locator('#reg-parent-first')).toBeVisible();
    await page.locator('#reg-parent-first').fill('Lefou');
    await page.locator('#reg-parent-last').fill('LeGrand');
    await page.locator('#reg-parent-email').fill('lefou@example.com');
    await page.locator('#reg-parent-phone').fill('555-9999');
    await page.locator('#parent-form button[type="submit"]').click();

    // Should advance to step 3 (song)
    await expect(page.locator('#song-form')).toBeVisible();
  });

  test('can reach review step', async ({ page }) => {
    await page.goto('/#/family/register');

    // Step 1
    await page.locator('#reg-first-name').fill('Gaston');
    await page.locator('#reg-last-name').fill('LeGrand');
    await page.locator('#reg-grade').fill('11');
    await page.locator('#student-form button[type="submit"]').click();

    // Step 2
    await expect(page.locator('#reg-parent-first')).toBeVisible();
    await page.locator('#reg-parent-first').fill('Lefou');
    await page.locator('#reg-parent-last').fill('LeGrand');
    await page.locator('#reg-parent-email').fill('lefou@example.com');
    await page.locator('#reg-parent-phone').fill('555-9999');
    await page.locator('#parent-form button[type="submit"]').click();

    // Step 3 — audition song
    await expect(page.locator('#song-form')).toBeVisible();
    await page.locator('#song-form button[type="submit"]').click();

    // Step 4 — photo upload
    await expect(page.locator('#photo-form')).toBeVisible();
    await expect(page.locator('#reg-photo')).toBeVisible();
  });

  test('add another student starts a blank student form', async ({ page }) => {
    await loginAsFamily(page, {
      students: [STUDENT_BELLE, STUDENT_INCOMPLETE],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [],
    });
    await page.goto('/#/family/register');

    await expect(page.locator('#reg-first-name')).toHaveValue('Belle');
    await page.locator('#add-student-btn').click();
    await expect(page.locator('#reg-first-name')).toHaveValue('');
    await expect(page.locator('#reg-last-name')).toHaveValue('');
    await expect(page.locator('#reg-grade')).toHaveValue('');
  });

  test('second student parent step pre-fills parent info from existing sibling', async ({ page }) => {
    await loginAsFamily(page, {
      students: [STUDENT_BELLE],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [],
    });
    await page.goto('/#/family/register');

    await page.locator('#add-student-btn').click();
    await expect(page.locator('#reg-first-name')).toHaveValue('');
    await expect(page.locator('#reg-last-name')).toHaveValue('');
    await page.locator('#reg-first-name').fill('Chip');
    await page.locator('#reg-last-name').fill('French');
    await page.locator('#reg-grade').fill('6');
    await page.locator('#student-form button[type="submit"]').click();

    await expect(page.locator('#reg-parent-first')).toBeVisible();
    await expect(page.locator('#reg-parent-first')).toHaveValue('Maurice');
    await expect(page.locator('#reg-parent-last')).toHaveValue('French');
    await expect(page.locator('#reg-parent-email')).toHaveValue('parent@example.com');
    await expect(page.locator('#reg-parent-phone')).toHaveValue('555-0123');
  });

  test('can clear selected student registration from registration page', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await loginAsFamily(page, {
      students: [STUDENT_BELLE, STUDENT_INCOMPLETE],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [],
    });
    await page.goto('/#/family/register');

    await expect(page.locator('#student-select')).toBeVisible();
    await expect(page.locator('#student-select')).toHaveValue(STUDENT_BELLE.id);

    await page.locator('#clear-registration-btn').click();

    await expect(page.locator('#student-select')).toHaveCount(0);
    await expect(page.locator('#reg-first-name')).toHaveValue(STUDENT_INCOMPLETE.first_name);
  });
});
