import { test, expect } from '@playwright/test';
import { loginAsStaff, loginAsAdmin } from './helpers/setupMocks.js';
import {
  VOCAL_SLOT_1,
  VOCAL_SLOT_2,
  BELLE_VOCAL_BOOKING,
  CONFIG_1,
  STUDENT_BELLE,
} from './helpers/mockData.js';

test.describe('Staff Vocal Roster', () => {
  test('shows vocal slots table', async ({ page }) => {
    await loginAsStaff(page, {
      vocalSlots: [VOCAL_SLOT_1, VOCAL_SLOT_2],
      vocalBookings: [BELLE_VOCAL_BOOKING],
      configs: [CONFIG_1],
    });
    await page.goto('/#/staff/vocal-roster');

    // Should show time slots
    await expect(page.getByText(/9:00/).first()).toBeVisible();
  });

  test('shows attendees by slot', async ({ page }) => {
    await loginAsStaff(page, {
      vocalSlots: [VOCAL_SLOT_1],
      vocalBookings: [BELLE_VOCAL_BOOKING],
      configs: [CONFIG_1],
    });
    await page.goto('/#/staff/vocal-roster');

    await expect(page.getByText('Belle')).toBeVisible();
  });

  test('shows empty state when no slots exist', async ({ page }) => {
    await loginAsStaff(page, { vocalSlots: [], vocalBookings: [] });
    await page.goto('/#/staff/vocal-roster');

    await expect(page.getByText(/no vocal slots/i)).toBeVisible();
  });

  test('generate slots button exists', async ({ page }) => {
    await loginAsStaff(page, { vocalSlots: [] });
    await page.goto('/#/staff/vocal-roster');

    await expect(page.locator('#generate-slots-btn')).toBeVisible();
  });

  test('export buttons exist', async ({ page }) => {
    await loginAsStaff(page, {
      vocalSlots: [VOCAL_SLOT_1],
      vocalBookings: [],
    });
    await page.goto('/#/staff/vocal-roster');

    await expect(page.locator('#export-vocal-pdf-btn')).toBeVisible();
    await expect(page.locator('#export-vocal-csv-btn')).toBeVisible();
  });

  test('admin sees override section', async ({ page }) => {
    await loginAsAdmin(page, {
      vocalSlots: [VOCAL_SLOT_1],
      vocalBookings: [],
    });
    await page.goto('/#/staff/vocal-roster');

    await expect(page.getByText('Admin Override')).toBeVisible();
    await expect(page.locator('#vocal-override-student-id')).toBeVisible();
  });

  test('admin can delete a slot that has a booked student', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await loginAsAdmin(page, {
      vocalSlots: [VOCAL_SLOT_1],
      vocalBookings: [BELLE_VOCAL_BOOKING],
      configs: [CONFIG_1],
    });
    await page.goto('/#/staff/vocal-roster');

    await page.locator('.delete-slot-btn').first().click();
    await expect(page.locator('.delete-slot-btn')).toHaveCount(0);
    await expect(page.locator('#vocal-roster-msg')).toContainText('Slot deleted.');
  });

  test('admin can bulk delete selected slots', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await loginAsAdmin(page, {
      vocalSlots: [VOCAL_SLOT_1, VOCAL_SLOT_2],
      vocalBookings: [],
      configs: [CONFIG_1],
    });
    await page.goto('/#/staff/vocal-roster');

    await page.locator('#select-all-slots-cb').check();
    await page.locator('#bulk-delete-slots-btn').click();

    await expect(page.locator('.delete-slot-btn')).toHaveCount(0);
    await expect(page.locator('#vocal-roster-msg')).toContainText('Deleted 2 slot(s).');
  });

  test('admin override uses day assignment controls when day mode is active', async ({ page }) => {
    await loginAsAdmin(page, {
      vocalSlots: [VOCAL_SLOT_1],
      vocalBookings: [],
      configs: [CONFIG_1],
      auditionSettings: [{ id: 'as-1', vocal_mode: 'day_assignment' }],
      vocalDayAssignments: [
        {
          id: 'vda-1',
          student_id: STUDENT_BELLE.id,
          audition_date: CONFIG_1.audition_date,
          students: STUDENT_BELLE,
        },
      ],
    });
    await page.goto('/#/staff/vocal-roster');

    await expect(page.getByText('Students by Vocal Day')).toBeVisible();
    await expect(page.locator('#generate-slots-btn')).toHaveCount(0);
    await expect(page.getByText(/Belle/)).toBeVisible();
    await expect(page.locator('#vocal-override-day')).toBeVisible();
    await expect(page.locator('#vocal-override-slot')).toHaveCount(0);
    await expect(page.locator('#vocal-override-btn')).toContainText('Assign Day');
  });
});
