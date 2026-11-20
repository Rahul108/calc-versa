import { test, expect } from '@playwright/test';

test('signed-out visitors are sent to the login page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await expect(page.getByLabel(/username or email/i)).toHaveValue('');
});
