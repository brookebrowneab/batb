import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/setupMocks.js';

test.describe('Staff Role Config', () => {
  test('can switch vocal audition mode when settings row does not exist yet', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await loginAsAdmin(page, {
      auditionSettings: [],
      auditionRoles: [],
    });
    await page.goto('/#/staff/roles');

    await page.locator('input[name="vocal-mode"][value="day_assignment"]').check();
    await expect(page.locator('input[name="vocal-mode"][value="day_assignment"]')).toBeChecked();

    await page.locator('input[name="vocal-mode"][value="timeslot"]').check();
    await expect(page.locator('input[name="vocal-mode"][value="timeslot"]')).toBeChecked();

    expect(pageErrors).toEqual([]);
  });
});
