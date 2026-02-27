import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/setupMocks.js';

test.describe('Staff Vocal Assignments Logout', () => {
  test('sign out works from vocal assignments page', async ({ page }) => {
    await loginAsAdmin(page, { students: [] });
    await page.goto('/#/staff/vocal-assignments');

    await page.locator('#layout-logout-btn').click();
    await expect(page).toHaveURL(/#\/$/);
  });
});
