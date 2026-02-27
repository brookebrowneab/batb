import { test, expect } from '@playwright/test';
import { loginAsFamily } from './helpers/setupMocks.js';
import {
  STUDENT_BELLE,
  ACTIVE_CONTRACT,
  BELLE_ACCEPTANCE,
} from './helpers/mockData.js';

test.describe('Family Contract Signing', () => {
  test('shows contract text and signing form', async ({ page }) => {
    await loginAsFamily(page, {
      students: [STUDENT_BELLE],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [],
    });
    await page.goto('/#/family/contract');

    // Contract text should be visible
    await expect(page.getByText('Show Agreement')).toBeVisible();
    await expect(page.getByText(/I agree to participate/)).toBeVisible();

    // Signing form should appear for Belle
    await expect(page.getByText('Belle French')).toBeVisible();
  });

  test('checkbox enables signature inputs and submit', async ({ page }) => {
    await loginAsFamily(page, {
      students: [STUDENT_BELLE],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [],
    });
    await page.goto('/#/family/contract');

    // Find the student signature input
    const studentSig = page.locator(`#student-sig-${STUDENT_BELLE.id}`);
    const parentSig = page.locator(`#parent-sig-${STUDENT_BELLE.id}`);

    // Signature fields should exist
    await expect(studentSig).toBeVisible();

    // Check the agreement checkbox
    await page.locator('.agree-checkbox').first().check();

    // Fill signatures
    await studentSig.fill('Belle French');
    await parentSig.fill('Maurice French');

    // Submit button should be enabled and click
    const submitBtn = page.locator('.signing-form button[type="submit"]').first();
    await submitBtn.click();

    // Should show success
    await expect(page.getByText(/signed|success|complete/i).first()).toBeVisible();
  });

  test('shows already signed status when contract is accepted', async ({ page }) => {
    await loginAsFamily(page, {
      students: [STUDENT_BELLE],
      contracts: [ACTIVE_CONTRACT],
      contractAcceptances: [BELLE_ACCEPTANCE],
    });
    await page.goto('/#/family/contract');

    // Should show signed/complete indication
    await expect(page.getByText(/signed|complete/i).first()).toBeVisible();
  });
});
