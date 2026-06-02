import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Globally intercept all API calls to inject the approved x-device-id header
    await page.route('**/api/**', async (route, request) => {
      const headers = {
        ...request.headers(),
        'x-device-id': '06534fb58f1405a89b63ec9b7d01bf03',
      };

      if (request.url().includes('/api/auth/login')) {
        const payload = JSON.parse(request.postData() || '{}');
        payload.deviceId = '06534fb58f1405a89b63ec9b7d01bf03';
        await route.continue({
          headers,
          postData: JSON.stringify(payload),
        });
      } else {
        await route.continue({ headers });
      }
    });

    // Navigate to homepage and log in
    await page.goto('/');
    await page.fill('#email', 'merugup.media1@gmail.com');
    await page.fill('#password', 'Welcome#6557');
    await page.click('button[type="submit"]');

    // Confirm landing on Dashboard
    await expect(page.locator('h1')).toHaveText(/dashboard/i, { timeout: 15000 });
  });

  test('should display all stats cards/buttons with numeric metrics', async ({ page }) => {
    const statsCards = [
      'Total Abstracts',
      'Under Review',
      'Accepted',
      'Out of Scope',
      'Rejected',
      'Invoiced',
      'Registered',
      'Deleted',
    ];

    for (const card of statsCards) {
      const locator = page.locator(`button:has-text("${card}")`);
      await expect(locator).toBeVisible();
      // Verify card text has some metric number associated (e.g. "Total Abstracts 5" or "Total Abstracts 0")
      const text = await locator.innerText();
      expect(text).toMatch(/\d+/);
    }
  });

  test('should display recent abstracts table with correct header columns', async ({ page }) => {
    // Check that "Recent Abstracts" is present
    await expect(page.locator('text=Recent Abstracts')).toBeVisible();

    // Verify correct column headers exist
    const expectedHeaders = ['Website', 'Name', 'Email', 'Country', 'Submitted On', 'Status'];
    for (const header of expectedHeaders) {
      const headerLocator = page.locator(`th:has-text("${header}")`).or(page.locator(`[role="columnheader"]:has-text("${header}")`));
      await expect(headerLocator.first()).toBeVisible();
    }
  });

  test('should toggle filters dropdown when clicking Filters button', async ({ page }) => {
    // Find filters button and click
    const filtersBtn = page.locator('button:has-text("Filters")');
    await expect(filtersBtn).toBeVisible();
    await filtersBtn.click();

    // Once clicked, the filter drawer should be open and the dropdowns should be visible
    const websiteSelect = page.locator('select');
    await expect(websiteSelect).toBeVisible();

    // Close filters drawer using the close button
    const closeBtn = page.locator('button[aria-label="Close filters"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // The filter drawer components should no longer be visible
    await expect(websiteSelect).not.toBeVisible();
  });

  test('should select a website, set dates, and apply filters', async ({ page }) => {
    // Open the filter drawer
    const filtersBtn = page.locator('button:has-text("Filters")');
    await filtersBtn.click();

    // Verify website select dropdown is visible
    const websiteSelect = page.locator('select');
    await expect(websiteSelect).toBeVisible();

    // Choose the first website if available in dropdown
    const count = await websiteSelect.locator('option').count();
    if (count > 1) {
      await websiteSelect.selectOption({ index: 1 });
    }

    // Set From Date and To Date
    const fromDateInput = page.locator('input[type="date"]').first();
    const toDateInput = page.locator('input[type="date"]').last();
    await expect(fromDateInput).toBeVisible();
    await expect(toDateInput).toBeVisible();

    await fromDateInput.fill('2026-01-01');
    await toDateInput.fill('2026-12-31');

    // Click Apply filters
    const applyBtn = page.locator('button:has-text("Apply")');
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // The drawer should close
    await expect(websiteSelect).not.toBeVisible();
  });

  test('should reset filters to default empty values', async ({ page }) => {
    // Open filter drawer
    const filtersBtn = page.locator('button:has-text("Filters")');
    await filtersBtn.click();

    // Fill inputs
    const fromDateInput = page.locator('input[type="date"]').first();
    await fromDateInput.fill('2026-05-01');

    // Click Reset button
    const resetBtn = page.locator('button:has-text("Reset")');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Verify date is cleared (reset sets input to empty string)
    await expect(fromDateInput).toHaveValue('');
  });

});
