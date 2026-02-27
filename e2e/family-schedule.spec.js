import { test, expect } from '@playwright/test';
import { loginAsFamily } from './helpers/setupMocks.js';
import {
  STUDENT_BELLE,
  STUDENT_CALLBACK,
  ACTIVE_CONTRACT,
  BELLE_ACCEPTANCE,
  DANCE_SESSION_A,
  VOCAL_SLOT_1,
  BELLE_DANCE_SIGNUP,
  BELLE_VOCAL_BOOKING,
  CONFIG_1,
} from './helpers/mockData.js';

test.describe('Family Schedule', () => {
  test('shows booked auditions', async ({ page }) => {
    await loginAsFamily(page, {
      students: [STUDENT_BELLE],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [BELLE_ACCEPTANCE],
      danceSessions: [DANCE_SESSION_A],
      danceSignups: [BELLE_DANCE_SIGNUP],
      vocalSlots: [VOCAL_SLOT_1],
      vocalBookings: [BELLE_VOCAL_BOOKING],
      configs: [CONFIG_1],
    });
    await page.goto('/#/family/schedule');

    // Should show dance and vocal bookings
    await expect(page.getByText(/dance/i).first()).toBeVisible();
    await expect(page.getByText(/vocal/i).first()).toBeVisible();
  });

  test('shows callback banner when student is invited', async ({ page }) => {
    const callbackAcceptance = {
      ...BELLE_ACCEPTANCE,
      student_id: STUDENT_CALLBACK.id,
    };
    await loginAsFamily(page, {
      students: [STUDENT_CALLBACK],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [callbackAcceptance],
      configs: [CONFIG_1],
    });
    await page.goto('/#/family/schedule');

    // Should show callback invitation banner
    await expect(page.getByText(/callback/i).first()).toBeVisible();
  });

  test('shows empty state when nothing is booked', async ({ page }) => {
    await loginAsFamily(page, {
      students: [STUDENT_BELLE],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [BELLE_ACCEPTANCE],
      configs: [],
    });
    await page.goto('/#/family/schedule');

    // Should show "no auditions" or similar message
    await expect(page.getByText(/no audition|schedule/i).first()).toBeVisible();
  });
});
