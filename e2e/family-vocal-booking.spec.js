import { test, expect } from '@playwright/test';
import { loginAsFamily } from './helpers/setupMocks.js';
import {
  STUDENT_BELLE,
  ACTIVE_CONTRACT,
  BELLE_ACCEPTANCE,
  VOCAL_SLOT_1,
  VOCAL_SLOT_2,
  BELLE_VOCAL_BOOKING,
} from './helpers/mockData.js';

const baseOpts = {
  students: [STUDENT_BELLE],
  contracts: [ACTIVE_CONTRACT],
  contractAcceptances: [BELLE_ACCEPTANCE],
  configs: [{ id: 'cfg-1', audition_date: '2027-06-16', dance_start_time: null, dance_end_time: null, vocal_start_time: '09:00:00', vocal_end_time: '10:00:00', callback_start_time: null, callback_end_time: null }],
};

test.describe('Family Vocal Booking', () => {
  test('shows available vocal slots', async ({ page }) => {
    await loginAsFamily(page, {
      ...baseOpts,
      vocalSlots: [VOCAL_SLOT_1, VOCAL_SLOT_2],
      vocalBookings: [],
    });
    await page.goto('/#/family/vocal');

    // Time format is "9:00 AM", "9:15 AM"
    await expect(page.getByText(/9:00 AM/).first()).toBeVisible();
    await expect(page.getByText(/9:15 AM/).first()).toBeVisible();
  });

  test('select-then-confirm booking flow', async ({ page }) => {
    await loginAsFamily(page, {
      ...baseOpts,
      vocalSlots: [VOCAL_SLOT_1, VOCAL_SLOT_2],
      vocalBookings: [],
    });
    await page.goto('/#/family/vocal');

    // Click book on a slot
    const bookBtn = page.locator('.book-btn').first();
    await bookBtn.click();

    // Confirm footer should appear
    await expect(page.locator('.booking-footer')).toBeVisible();

    // Click confirm — directly books (no dialog)
    await page.locator('.confirm-booking-btn').click();

    // Success
    await expect(page.getByText(/booked|success/i).first()).toBeVisible();
  });

  test('shows current booking with cancel option', async ({ page }) => {
    await loginAsFamily(page, {
      ...baseOpts,
      vocalSlots: [VOCAL_SLOT_1, VOCAL_SLOT_2],
      vocalBookings: [BELLE_VOCAL_BOOKING],
    });
    await page.goto('/#/family/vocal');

    // Cancel button visible for booked slot
    await expect(page.locator('.cancel-btn').first()).toBeVisible();
  });

  test('cancel booking with confirmation', async ({ page }) => {
    await loginAsFamily(page, {
      ...baseOpts,
      vocalSlots: [VOCAL_SLOT_1, VOCAL_SLOT_2],
      vocalBookings: [BELLE_VOCAL_BOOKING],
    });
    await page.goto('/#/family/vocal');

    await page.locator('.cancel-btn').first().click();
    await expect(page.locator('.confirm-dialog')).toBeVisible();
    await page.locator('[data-action="confirm"]').click();
    await expect(page.getByText(/cancel|removed/i)).toBeVisible();
  });
});
