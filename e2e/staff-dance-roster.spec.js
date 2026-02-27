import { test, expect } from '@playwright/test';
import { loginAsStaff } from './helpers/setupMocks.js';
import {
  STUDENT_BELLE,
  CONFIG_1,
} from './helpers/mockData.js';

test.describe('Staff Dance Roster', () => {
  test('shows dance windows table', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      configs: [CONFIG_1],
    });
    await page.goto('/#/staff/dance-roster');

    await expect(page.getByText('Dance Window').first()).toBeVisible();
    await expect(page.getByText('Assigned Students').first()).toBeVisible();
  });

  test('shows attendees by dance window', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      configs: [CONFIG_1],
    });
    await page.goto('/#/staff/dance-roster');

    // Belle should appear in attendees
    await expect(page.getByText('Belle')).toBeVisible();
  });

  test('shows empty state when no sessions exist', async ({ page }) => {
    await loginAsStaff(page, { students: [STUDENT_BELLE], configs: [] });
    await page.goto('/#/staff/dance-roster');

    await expect(page.getByText(/No dance windows configured/i)).toBeVisible();
  });

  test('shows assignment-based messaging', async ({ page }) => {
    await loginAsStaff(page, { students: [STUDENT_BELLE], configs: [CONFIG_1] });
    await page.goto('/#/staff/dance-roster');

    await expect(page.getByText(/auto-assigned from scheduling config/i)).toBeVisible();
  });

  test('export PDF button exists', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      configs: [CONFIG_1],
    });
    await page.goto('/#/staff/dance-roster');

    await expect(page.locator('#export-dance-pdf-btn')).toBeVisible();
    await expect(page.locator('#export-dance-csv-btn')).toBeVisible();
  });

  test('date filter dropdown works', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      configs: [CONFIG_1],
    });
    await page.goto('/#/staff/dance-roster');

    const filter = page.locator('#dance-date-filter');
    await expect(filter).toBeVisible();
    // Should have "All dates" option
    await expect(filter.locator('option').first()).toContainText('All dates');
  });

  test('does not show admin override section', async ({ page }) => {
    await loginAsStaff(page, { students: [STUDENT_BELLE], configs: [CONFIG_1] });
    await page.goto('/#/staff/dance-roster');

    await expect(page.getByText('Admin Override')).toHaveCount(0);
  });
});
