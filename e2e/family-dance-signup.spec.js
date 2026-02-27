import { test, expect } from '@playwright/test';
import { loginAsFamily } from './helpers/setupMocks.js';
import {
  STUDENT_BELLE,
  ACTIVE_CONTRACT,
  BELLE_ACCEPTANCE,
  CONFIG_1,
} from './helpers/mockData.js';

const baseOpts = {
  students: [STUDENT_BELLE],
  contracts: [ACTIVE_CONTRACT],
  contractAcceptances: [BELLE_ACCEPTANCE],
};

test.describe('Family Dance Schedule', () => {
  test('shows assigned dance windows as required', async ({ page }) => {
    await loginAsFamily(page, {
      ...baseOpts,
      configs: [CONFIG_1],
    });
    await page.goto('/#/family/dance');

    await expect(page.getByRole('heading', { name: /Dance Audition Schedule/i })).toBeVisible();
    await expect(page.getByText(/required/i).first()).toBeVisible();
    await expect(page.getByText('Belle French')).toBeVisible();
    await expect(page.getByText(/Assigned Dance Windows/i)).toBeVisible();
  });

  test('shows pending state when dance day is not configured', async ({ page }) => {
    await loginAsFamily(page, {
      ...baseOpts,
      configs: [],
    });
    await page.goto('/#/family/dance');

    await expect(page.getByText(/has not been posted yet/i)).toBeVisible();
  });

  test('shows empty state when no students exist', async ({ page }) => {
    await loginAsFamily(page, {
      students: [],
      contracts: [ACTIVE_CONTRACT],
      configs: [CONFIG_1],
    });
    await page.goto('/#/family/dance');

    await expect(page.getByText(/No students registered yet/i)).toBeVisible();
  });
});
