import { test, expect } from '@playwright/test';
import { loginAsStaff } from './helpers/setupMocks.js';
import {
  STUDENT_BELLE,
  DANCE_SESSION_A,
  VOCAL_SLOT_1,
  BELLE_DANCE_SIGNUP,
  BELLE_VOCAL_BOOKING,
  EVAL_DANCE,
} from './helpers/mockData.js';

test.describe('Staff Student Profile', () => {
  test('shows student info and badges', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      danceSessions: [DANCE_SESSION_A],
      danceSignups: [BELLE_DANCE_SIGNUP],
      vocalSlots: [VOCAL_SLOT_1],
      vocalBookings: [BELLE_VOCAL_BOOKING],
      evaluations: [EVAL_DANCE],
    });
    await page.goto(`/#/staff/student-profile?id=${STUDENT_BELLE.id}`);

    await expect(page.getByText('Belle French')).toBeVisible();
    await expect(page.locator('p').filter({ hasText: 'Grade' }).first()).toContainText('10');
  });

  test('shows parent/guardian info', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      evaluations: [],
    });
    await page.goto(`/#/staff/student-profile?id=${STUDENT_BELLE.id}`);

    await expect(page.getByText('Maurice French')).toBeVisible();
    await expect(page.getByText('parent@example.com')).toBeVisible();
    await expect(page.getByText('555-0123')).toBeVisible();
  });

  test('shows participation summary', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      danceSessions: [DANCE_SESSION_A],
      danceSignups: [BELLE_DANCE_SIGNUP],
      vocalSlots: [VOCAL_SLOT_1],
      vocalBookings: [BELLE_VOCAL_BOOKING],
      evaluations: [],
    });
    await page.goto(`/#/staff/student-profile?id=${STUDENT_BELLE.id}`);

    // Should show dance and vocal participation
    await expect(page.getByText(/signed up|booked/i).first()).toBeVisible();
  });

  test('shows evaluation notes', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      evaluations: [EVAL_DANCE],
    });
    await page.goto(`/#/staff/student-profile?id=${STUDENT_BELLE.id}`);

    await expect(page.getByText('Great technique and stage presence.')).toBeVisible();
    // Staff name in eval table (not in layout header)
    await expect(page.locator('.data-table').getByText('Stage Manager')).toBeVisible();
  });

  test('shows add note form', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      evaluations: [],
    });
    await page.goto(`/#/staff/student-profile?id=${STUDENT_BELLE.id}`);

    await expect(page.locator('#eval-track')).toBeVisible();
    await expect(page.locator('#eval-notes')).toBeVisible();
    await expect(page.locator('#eval-submit-btn')).toBeVisible();
  });

  test('can add evaluation note', async ({ page }) => {
    await loginAsStaff(page, {
      students: [STUDENT_BELLE],
      evaluations: [],
    });
    await page.goto(`/#/staff/student-profile?id=${STUDENT_BELLE.id}`);

    await page.locator('#eval-track').selectOption('vocal');
    await page.locator('#eval-notes').fill('Excellent vocal range and projection.');
    await page.locator('#eval-submit-btn').click();

    // Should show success
    await expect(page.locator('#eval-msg')).toContainText(/added|success/i);
  });

  test('shows error when no student ID provided', async ({ page }) => {
    await loginAsStaff(page, { students: [] });
    await page.goto('/#/staff/student-profile');

    await expect(page.getByText(/no student id/i)).toBeVisible();
  });
});
