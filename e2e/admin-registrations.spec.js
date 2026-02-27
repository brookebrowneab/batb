import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/setupMocks.js';
import { STUDENT_BELLE, STUDENT_INCOMPLETE } from './helpers/mockData.js';

const ROLE_BELLE = { id: 'role-belle', name: 'Belle', display_order: 1 };
const ROLE_BEAST = { id: 'role-beast', name: 'Beast', display_order: 2 };

function withRolePrefs(student, prefs) {
  return {
    ...student,
    student_role_preferences: prefs.map((pref, idx) => ({
      id: `pref-${student.id}-${idx}`,
      audition_role_id: pref.roleId,
      rank_order: pref.rank,
      audition_roles: pref.role,
    })),
  };
}

test.describe('Admin Registrations', () => {
  test('shows all student registrations with filter controls', async ({ page }) => {
    await loginAsAdmin(page, {
      students: [
        withRolePrefs(STUDENT_BELLE, [{ roleId: ROLE_BELLE.id, rank: 1, role: ROLE_BELLE }]),
        withRolePrefs(STUDENT_INCOMPLETE, [{ roleId: ROLE_BEAST.id, rank: 1, role: ROLE_BEAST }]),
      ],
      auditionRoles: [ROLE_BELLE, ROLE_BEAST],
    });

    await page.goto('/#/admin/registrations');

    await expect(page.getByRole('heading', { name: 'Student Registrations' })).toBeVisible();
    await expect(page.locator('#registration-filter-grade')).toBeVisible();
    await expect(page.locator('#registration-filter-role')).toBeVisible();
    await expect(page.getByText('Belle French')).toBeVisible();
    await expect(page.getByText('Chip French')).toBeVisible();
  });

  test('filters by grade and role, and opens student detail page', async ({ page }) => {
    await loginAsAdmin(page, {
      students: [
        withRolePrefs(STUDENT_BELLE, [{ roleId: ROLE_BELLE.id, rank: 1, role: ROLE_BELLE }]),
        withRolePrefs(STUDENT_INCOMPLETE, [{ roleId: ROLE_BEAST.id, rank: 1, role: ROLE_BEAST }]),
      ],
      auditionRoles: [ROLE_BELLE, ROLE_BEAST],
    });

    await page.goto('/#/admin/registrations');

    await page.locator('#registration-filter-grade').selectOption('10');
    await expect(page.getByText('Belle French')).toBeVisible();
    await expect(page.getByText('Chip French')).not.toBeVisible();

    await page.locator('#registration-clear-filters').click();
    await page.locator('#registration-filter-role').selectOption(ROLE_BEAST.id);
    await expect(page.getByText('Chip French')).toBeVisible();
    await expect(page.locator(`[data-registration-student-link="${STUDENT_BELLE.id}"]`)).toHaveCount(0);

    await page.locator(`[data-registration-student-link="${STUDENT_INCOMPLETE.id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#\\/staff\\/student-profile\\?id=${STUDENT_INCOMPLETE.id}$`));
    await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();
  });

  test('admin can delete a registration from the table', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await loginAsAdmin(page, {
      students: [
        withRolePrefs(STUDENT_BELLE, [{ roleId: ROLE_BELLE.id, rank: 1, role: ROLE_BELLE }]),
        withRolePrefs(STUDENT_INCOMPLETE, [{ roleId: ROLE_BEAST.id, rank: 1, role: ROLE_BEAST }]),
      ],
      auditionRoles: [ROLE_BELLE, ROLE_BEAST],
    });

    await page.goto('/#/admin/registrations');
    await expect(page.getByText('Belle French')).toBeVisible();
    await expect(page.getByText('Chip French')).toBeVisible();

    await page.locator(`.delete-registration-btn[data-student-id="${STUDENT_BELLE.id}"]`).click();

    await expect(page.locator(`[data-registration-student-link="${STUDENT_BELLE.id}"]`)).toHaveCount(0);
    await expect(page.getByText('Chip French')).toBeVisible();
    await expect(page.locator('#registrations-msg')).toContainText('Deleted registration for Belle French.');
  });
});
