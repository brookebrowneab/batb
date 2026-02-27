import { test, expect } from '@playwright/test';
import { loginAsFamily } from './helpers/setupMocks.js';
import {
  STUDENT_BELLE,
  STUDENT_INCOMPLETE,
  ACTIVE_CONTRACT,
  BELLE_ACCEPTANCE,
  BELLE_DANCE_SIGNUP,
  BELLE_VOCAL_BOOKING,
} from './helpers/mockData.js';

test.describe('Family Dashboard', () => {
  test('shows student cards for registered students', async ({ page }) => {
    await loginAsFamily(page, {
      students: [STUDENT_BELLE],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [BELLE_ACCEPTANCE],
      danceSignups: [BELLE_DANCE_SIGNUP],
      vocalBookings: [BELLE_VOCAL_BOOKING],
    });
    await page.goto('/#/family');

    await expect(page.getByText('Belle French')).toBeVisible();
    // Registration badge
    await expect(page.locator('.status-badge--complete').first()).toBeVisible();
  });

  test('shows What\'s Next banner directing to next action', async ({ page }) => {
    await loginAsFamily(page, {
      students: [STUDENT_INCOMPLETE],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [],
    });
    await page.goto('/#/family');

    // Should show a banner pointing to the next step
    await expect(page.locator('.enchanted-banner')).toBeVisible();
  });

  test('shows quick action links', async ({ page }) => {
    await loginAsFamily(page, {
      students: [STUDENT_BELLE],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [BELLE_ACCEPTANCE],
    });
    await page.goto('/#/family');

    await expect(page.locator('.quick-actions')).toBeVisible();
    // Has links to register, book, and schedule
    await expect(page.locator('a[href="#/family/register"]').first()).toBeVisible();
  });

  test('shows empty state when no students exist', async ({ page }) => {
    await loginAsFamily(page, {
      students: [],
      contracts: [ACTIVE_CONTRACT],
    });
    await page.goto('/#/family');

    // Should show CTA to register first student
    await expect(page.getByText(/register/i).first()).toBeVisible();
  });

  test('navigates to registration when clicking Register', async ({ page }) => {
    await loginAsFamily(page, {
      students: [STUDENT_BELLE],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [BELLE_ACCEPTANCE],
    });
    await page.goto('/#/family');

    await page.locator('.quick-actions a[href="#/family/register"]').click();
    await expect(page).toHaveURL(/#\/family\/register$/);
  });

  test('navigates to student-specific registration when clicking Edit registration', async ({ page }) => {
    await loginAsFamily(page, {
      students: [STUDENT_BELLE, STUDENT_INCOMPLETE],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [BELLE_ACCEPTANCE],
    });
    await page.goto('/#/family');

    await page.locator(`[data-edit-registration="${STUDENT_INCOMPLETE.id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#\\/family\\/register\\?studentId=${STUDENT_INCOMPLETE.id}$`));
    await expect(page.locator('#reg-first-name')).toHaveValue('Chip');
  });
});
