import { test, expect } from '@playwright/test';

// The reference smoke: the SPA boots and the users slice drives its schema-form.
// Validation is client-side (zod), so this passes without the API running; the
// same build serves this over HTTP in the browser and over IPC under Tauri.
test('users slice boots and validates the form', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();

  // The form is gated behind the header's "new user" action command.
  await page.getByRole('button', { name: 'new user' }).click();

  // Submitting empty surfaces the zod rule on the matching field.
  await page.getByRole('button', { name: 'Add user' }).click();
  await expect(page.locator('[data-error-for="name"]')).toContainText('Name is required');

  // Valid input clears the error.
  await page.locator('#name').fill('Ada Lovelace');
  await page.locator('#email').fill('ada@example.io');
  await page.getByRole('button', { name: 'Add user' }).click();
  await expect(page.locator('[data-error-for="name"]')).toHaveCount(0);
});
