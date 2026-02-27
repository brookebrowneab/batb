import { test, expect } from '@playwright/test';
import { loginAsStaff } from './helpers/setupMocks.js';
import { CONFIG_1 } from './helpers/mockData.js';

test.describe('Staff Scheduling', () => {
  test('shows config table with existing dates', async ({ page }) => {
    await loginAsStaff(page, { configs: [CONFIG_1] });
    await page.goto('/#/staff/scheduling');

    // Table should show the config date
    await expect(page.locator('.data-table')).toBeVisible();
    await expect(page.getByText(/Jun 15/)).toBeVisible();
  });

  test('shows empty state when no configs exist', async ({ page }) => {
    await loginAsStaff(page, { configs: [] });
    await page.goto('/#/staff/scheduling');

    await expect(page.getByText(/no audition dates/i)).toBeVisible();
  });

  test('shows add form with date and time fields', async ({ page }) => {
    await loginAsStaff(page, { configs: [] });
    await page.goto('/#/staff/scheduling');

    await expect(page.locator('#config-form')).toBeVisible();
    await expect(page.locator('#cfg-date')).toBeVisible();
    await expect(page.locator('#cfg-dance-start')).toBeVisible();
    await expect(page.locator('#cfg-dance-end')).toBeVisible();
    await expect(page.locator('#cfg-vocal-start')).toBeVisible();
    await expect(page.locator('#cfg-vocal-end')).toBeVisible();
  });

  test('can submit new audition date config', async ({ page }) => {
    await loginAsStaff(page, { configs: [] });
    await page.goto('/#/staff/scheduling');

    await page.locator('#cfg-date').fill('2025-07-01');
    await page.locator('#cfg-dance-start').fill('09:00');
    await page.locator('#cfg-dance-end').fill('12:00');
    await page.locator('#config-form button[type="submit"]').click();

    // Should show success message
    await expect(page.locator('#config-form-msg')).toContainText(/added|success/i);
  });

  test('can click edit on existing config', async ({ page }) => {
    await loginAsStaff(page, { configs: [CONFIG_1] });
    await page.goto('/#/staff/scheduling');

    await page.locator(`[data-edit="${CONFIG_1.id}"]`).click();
    // Form should switch to edit mode
    await expect(page.getByText(/edit/i).first()).toBeVisible();
  });
});
