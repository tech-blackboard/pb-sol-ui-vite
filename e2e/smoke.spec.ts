import { test, expect } from '@playwright/test';

test.describe('App Smoke Test', () => {
  test('should load the page and have the correct title', async ({ page }) => {
    // Go to the base URL (Vite dev server)
    await page.goto('/');

    // Expect the title to contain "pb-sol-apt"
    await expect(page).toHaveTitle(/pb-sol-apt/i);
  });
});
