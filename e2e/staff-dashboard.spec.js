import { test, expect } from '@playwright/test';
import { loginAsStaff, loginAsAdmin } from './helpers/setupMocks.js';

test.describe('Staff Dashboard', () => {
  test('shows welcome message and quick actions', async ({ page }) => {
    await loginAsStaff(page);
    await page.goto('/#/staff');

    await expect(page.getByRole('heading', { name: /Stage Manager/ })).toBeVisible();
    // Quick action links
    await expect(page.locator('a[href="#/staff/scheduling"]').first()).toBeVisible();
    await expect(page.locator('a[href="#/staff/dance-roster"]').first()).toBeVisible();
    await expect(page.locator('a[href="#/staff/vocal-roster"]').first()).toBeVisible();
    await expect(page.locator('a[href="#/staff/callbacks"]').first()).toBeVisible();
  });

  test('navigates to scheduling page', async ({ page }) => {
    await loginAsStaff(page);
    await page.goto('/#/staff');

    await page.locator('.quick-actions a[href="#/staff/scheduling"]').click();
    await expect(page).toHaveURL(/#\/staff\/scheduling$/);
  });
});

test.describe('Admin Dashboard', () => {
  test('shows admin quick actions including contracts', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/#/admin');

    await expect(page.getByText('Show Director').first()).toBeVisible();
    await expect(page.locator('a[href="#/admin/contracts"]').first()).toBeVisible();
    await expect(page.locator('a[href="#/admin/registrations"]').first()).toBeVisible();
    await expect(page.locator('a[href="#/staff/dance-roster"]').first()).toBeVisible();
  });
});
