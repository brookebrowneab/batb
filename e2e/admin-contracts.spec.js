import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/setupMocks.js';
import { ACTIVE_CONTRACT, INACTIVE_CONTRACT } from './helpers/mockData.js';

test.describe('Admin Contract Management', () => {
  test('shows contract version list', async ({ page }) => {
    await loginAsAdmin(page, {
      contracts: [ACTIVE_CONTRACT, INACTIVE_CONTRACT],
    });
    await page.goto('/#/admin/contracts');

    await expect(page.getByText('v1')).toBeVisible();
    await expect(page.getByText('v2')).toBeVisible();
    // Active badge
    await expect(page.locator('.badge.active').first()).toBeVisible();
  });

  test('shows empty state when no contracts exist', async ({ page }) => {
    await loginAsAdmin(page, { contracts: [] });
    await page.goto('/#/admin/contracts');

    await expect(page.getByText(/no contract versions/i)).toBeVisible();
  });

  test('shows create form with rich text editor', async ({ page }) => {
    await loginAsAdmin(page, { contracts: [] });
    await page.goto('/#/admin/contracts');

    await expect(page.locator('#create-contract-form')).toBeVisible();
    // Quill editor should be mounted
    await expect(page.locator('#quill-editor')).toBeVisible();
  });

  test('can preview a contract', async ({ page }) => {
    await loginAsAdmin(page, {
      contracts: [ACTIVE_CONTRACT, INACTIVE_CONTRACT],
    });
    await page.goto('/#/admin/contracts');

    await page.locator(`[data-preview="${ACTIVE_CONTRACT.id}"]`).click();
    // Preview should show contract text
    await expect(page.locator('#contract-preview')).toContainText('Show Agreement');
  });

  test('inactive contract shows Set Active button', async ({ page }) => {
    await loginAsAdmin(page, {
      contracts: [ACTIVE_CONTRACT, INACTIVE_CONTRACT],
    });
    await page.goto('/#/admin/contracts');

    await expect(page.locator(`[data-activate="${INACTIVE_CONTRACT.id}"]`)).toBeVisible();
  });
});
