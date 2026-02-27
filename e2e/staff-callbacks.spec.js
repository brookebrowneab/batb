import { test, expect } from '@playwright/test';
import { loginAsStaff } from './helpers/setupMocks.js';
import {
  STUDENT_BELLE,
  STUDENT_CALLBACK,
  CONFIG_1,
  NOTIFICATION_1,
} from './helpers/mockData.js';

test.describe('Staff Callbacks', () => {
  test('shows student list with invite status', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE, STUDENT_CALLBACK],
      configs: [CONFIG_1],
      notificationSends: [],
    });
    await page.goto('/#/staff/callbacks');

    await expect(page.getByText('Belle')).toBeVisible();
    await expect(page.getByText('Lumiere')).toBeVisible();
  });

  test('shows invite/uninvite toggle buttons', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE, STUDENT_CALLBACK],
      configs: [CONFIG_1],
      notificationSends: [],
    });
    await page.goto('/#/staff/callbacks');

    // Belle is not invited → should have "Invite" button
    // Lumiere is invited → should have "Uninvite" button
    await expect(page.locator('.invite-toggle-btn').first()).toBeVisible();
  });

  test('can invite a student', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      configs: [CONFIG_1],
      notificationSends: [],
    });
    await page.goto('/#/staff/callbacks');

    const inviteBtn = page.locator('.invite-toggle-btn[data-invited="false"]').first();
    await inviteBtn.click();

    // Should show success message
    await expect(page.locator('#callback-msg')).toContainText(/invited/i);
  });

  test('checkbox select-all works', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE, STUDENT_CALLBACK],
      configs: [CONFIG_1],
      notificationSends: [],
    });
    await page.goto('/#/staff/callbacks');

    // Wait for the student table to load
    await expect(page.locator('.data-table').first()).toBeVisible();

    const selectAll = page.locator('#select-all-cb');
    await selectAll.check();

    // Bulk action bar should appear
    await expect(page.locator('.bulk-action-bar')).toBeVisible();
    await expect(page.getByText(/2 selected/)).toBeVisible();
  });

  test('shows notification history', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      configs: [CONFIG_1],
      notificationSends: [NOTIFICATION_1],
    });
    await page.goto('/#/staff/callbacks');

    await expect(page.getByText('Notification History')).toBeVisible();
    await expect(page.getByText('parent@example.com')).toBeVisible();
  });

  test('shows callback windows from configs', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      configs: [CONFIG_1],
      notificationSends: [],
    });
    await page.goto('/#/staff/callbacks');

    await expect(page.getByText('Callback Windows')).toBeVisible();
  });

  test('export buttons exist', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      configs: [CONFIG_1],
      notificationSends: [],
    });
    await page.goto('/#/staff/callbacks');

    await expect(page.locator('#export-callbacks-pdf-btn')).toBeVisible();
    await expect(page.locator('#export-callbacks-csv-btn')).toBeVisible();
  });
});
