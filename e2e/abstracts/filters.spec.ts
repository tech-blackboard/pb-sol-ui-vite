import { test, expect, type Page } from '@playwright/test';

test.describe('Abstracts Filters and Sorting E2E Functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept to add device ID bypass
    await page.route('**/api/**', async (route, request) => {
      const url = request.url();
      const headers = {
        ...request.headers(),
        'x-device-id': '06534fb58f1405a89b63ec9b7d01bf03',
      };

      if (url.includes('/api/auth/login')) {
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

    // Log in with Admin user
    await page.goto('/');
    await page.fill('#email', 'techblackboard@gmail.com');
    await page.fill('#password', 'Welcome#6557');
    await page.click('button[type="submit"]');

    // Wait until logged in
    await expect(page.locator('h1')).toHaveText(/dashboard/i, { timeout: 15000 });

    // Navigate to Website Form Entries -> Abstracts
    const abstractsBtn = page.getByRole('button', { name: 'Abstracts', exact: true });
    if (!(await abstractsBtn.isVisible())) {
      const parentMenu = page.getByRole('button', { name: 'Website Form Entries' });
      await parentMenu.click();
    }
    await abstractsBtn.click();

    // Verify Abstracts page is loaded
    await expect(page.locator('h2').first()).toHaveText(/Conferences/i, { timeout: 15000 });
  });

  test.describe('Filter Scenarios with Real API', () => {

    // Helper functions
    const openDrawer = async (page: Page) => {
      const filtersBtn = page.locator('button[aria-label="Open filters"]');
      await filtersBtn.click();
      await expect(page.locator('h3:has-text("Filters")')).toBeVisible();
    };

    const apply = async (page: Page) => {
      const searchPromise = page.waitForResponse(res => res.url().includes('/api/abstract/search') && res.status() === 200);
      await page.locator('button:has-text("Apply")').click();
      await searchPromise;
      await expect(page.locator('text=Loading...')).not.toBeVisible();
    };

    const reset = async (page: Page) => {
      const resetSearchPromise = page.waitForResponse(res => res.url().includes('/api/abstract/search') && res.status() === 200);
      await page.locator('button:has-text("Reset")').click();
      await resetSearchPromise;
      await page.locator('button:has-text("✕")').click();
      await expect(page.locator('h3:has-text("Filters")')).not.toBeVisible();
    };

    test('should filter by keyword search alone and verify reset', async ({ page }) => {
      await expect(page.locator('text=Loading...')).not.toBeVisible();
      const initialCount = await page.locator('table tbody tr').count();
      const firstRow = page.locator('table tbody tr').first();
      const targetName = await firstRow.locator('td').nth(2).innerText();

      await openDrawer(page);
      await page.locator('input[placeholder="Keyword search..."]').fill(targetName.split(' ')[0]);
      await apply(page);
      
      const currentCount = await page.locator('table tbody tr').count();
      expect(currentCount).toBeGreaterThan(0);
      await expect(page.locator('table tbody tr').first()).toContainText(targetName.split(' ')[0]);

      // Reset & verify all abstracts are displayed
      await openDrawer(page);
      await reset(page);
      await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
    });

    test('should filter by name alone and verify reset', async ({ page }) => {
      await expect(page.locator('text=Loading...')).not.toBeVisible();
      const initialCount = await page.locator('table tbody tr').count();
      const firstRow = page.locator('table tbody tr').first();
      const targetName = await firstRow.locator('td').nth(2).innerText();

      await openDrawer(page);
      await page.locator('input[placeholder="Name"]').fill(targetName);
      await apply(page);
      
      const currentCount = await page.locator('table tbody tr').count();
      expect(currentCount).toBeGreaterThan(0);
      await expect(page.locator('table tbody tr').first().locator('td').nth(2)).toContainText(targetName);

      // Reset & verify all abstracts are displayed
      await openDrawer(page);
      await reset(page);
      await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
    });

    test('should filter by email alone and verify reset', async ({ page }) => {
      await expect(page.locator('text=Loading...')).not.toBeVisible();
      const initialCount = await page.locator('table tbody tr').count();
      const firstRow = page.locator('table tbody tr').first();
      const targetEmail = await firstRow.locator('td').nth(3).innerText();

      await openDrawer(page);
      await page.locator('input[placeholder="Email"]').fill(targetEmail);
      await apply(page);
      
      const currentCount = await page.locator('table tbody tr').count();
      expect(currentCount).toBeGreaterThan(0);
      await expect(page.locator('table tbody tr').first().locator('td').nth(3)).toContainText(targetEmail);

      // Reset & verify all abstracts are displayed
      await openDrawer(page);
      await reset(page);
      await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
    });

    test('should filter by organization alone and verify reset', async ({ page }) => {
      await expect(page.locator('text=Loading...')).not.toBeVisible();
      const initialCount = await page.locator('table tbody tr').count();
      const firstRow = page.locator('table tbody tr').first();
      const targetOrg = await firstRow.locator('td').nth(11).innerText();

      if (targetOrg && targetOrg.trim() !== '—') {
        await openDrawer(page);
        await page.locator('input[placeholder="Organization"]').fill(targetOrg);
        await apply(page);
        
        const currentCount = await page.locator('table tbody tr').count();
        expect(currentCount).toBeGreaterThan(0);
        await expect(page.locator('table tbody tr').first().locator('td').nth(11)).toContainText(targetOrg);

        // Reset & verify all abstracts are displayed
        await openDrawer(page);
        await reset(page);
        await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
      }
    });

    test('should filter by country alone and verify reset', async ({ page }) => {
      await expect(page.locator('text=Loading...')).not.toBeVisible();
      const initialCount = await page.locator('table tbody tr').count();
      const firstRow = page.locator('table tbody tr').first();
      const targetCountry = await firstRow.locator('td').nth(10).innerText();

      if (targetCountry && targetCountry.trim() !== '—') {
        await openDrawer(page);
        await page.locator('input[placeholder="Country"]').fill(targetCountry);
        await apply(page);
        
        const currentCount = await page.locator('table tbody tr').count();
        expect(currentCount).toBeGreaterThan(0);
        await expect(page.locator('table tbody tr').first().locator('td').nth(10)).toContainText(targetCountry);

        // Reset & verify all abstracts are displayed
        await openDrawer(page);
        await reset(page);
        await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
      }
    });

    test('should filter by title alone and verify reset', async ({ page }) => {
      await expect(page.locator('text=Loading...')).not.toBeVisible();
      const initialCount = await page.locator('table tbody tr').count();
      const firstRow = page.locator('table tbody tr').first();
      const targetTitle = await firstRow.locator('td').nth(12).innerText();

      if (targetTitle && targetTitle.trim() !== '—') {
        await openDrawer(page);
        await page.locator('input[placeholder="Title"]').fill(targetTitle);
        await apply(page);
        
        const currentCount = await page.locator('table tbody tr').count();
        expect(currentCount).toBeGreaterThan(0);
        await expect(page.locator('table tbody tr').first().locator('td').nth(12)).toContainText(targetTitle);

        // Reset & verify all abstracts are displayed
        await openDrawer(page);
        await reset(page);
        await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
      }
    });

    test('should filter by status dropdown alone and verify reset', async ({ page }) => {
      await expect(page.locator('text=Loading...')).not.toBeVisible();
      const initialCount = await page.locator('table tbody tr').count();
      const firstRow = page.locator('table tbody tr').first();
      const targetStatus = await firstRow.locator('td').nth(4).innerText();

      await openDrawer(page);
      // Status options mapping
      const statusMap: Record<string, string> = {
        'Under Review': '1',
        'Accepted': '2',
        'Out of Scope': '3',
        'Rejected': '4',
        'Sent Invoice': '5',
        'Registered': '6',
        'Deleted': '7'
      };

      const optionValue = statusMap[targetStatus.trim()] || '1';
      await page.locator('select').first().selectOption({ value: optionValue });
      await apply(page);
      
      const currentCount = await page.locator('table tbody tr').count();
      expect(currentCount).toBeGreaterThan(0);
      await expect(page.locator('table tbody tr').first().locator('td').nth(4)).toContainText(targetStatus);

      // Reset & verify all abstracts are displayed
      await openDrawer(page);
      await reset(page);
      await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
    });

    test('should filter by website/conference alone and verify reset', async ({ page }) => {
      await expect(page.locator('text=Loading...')).not.toBeVisible();
      const initialCount = await page.locator('table tbody tr').count();
      const firstRow = page.locator('table tbody tr').first();
      const targetWebsite = await firstRow.locator('td').nth(1).innerText();

      await openDrawer(page);
      // Select the first non-empty option from the website select dropdown
      const websiteSelect = page.locator('select').nth(1);
      await websiteSelect.selectOption({ index: 1 });
      await apply(page);
      
      const currentCount = await page.locator('table tbody tr').count();
      expect(currentCount).toBeGreaterThan(0);
      // Verify first row website cell is not empty
      const websiteCellText = await page.locator('table tbody tr').first().locator('td').nth(1).innerText();
      expect(websiteCellText).toBeTruthy();

      // Reset & verify all abstracts are displayed
      await openDrawer(page);
      await reset(page);
      await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
    });

    test('should filter by email sent status alone and verify reset', async ({ page }) => {
      await expect(page.locator('text=Loading...')).not.toBeVisible();
      const initialCount = await page.locator('table tbody tr').count();
      const firstRow = page.locator('table tbody tr').first();
      const targetEmailSent = await firstRow.locator('td').nth(5).innerText(); // 'Yes' or 'No'

      await openDrawer(page);
      const optionValue = targetEmailSent.toLowerCase() === 'yes' ? 'true' : 'false';
      await page.locator('select').nth(4).selectOption({ value: optionValue });
      await apply(page);
      
      const currentCount = await page.locator('table tbody tr').count();
      expect(currentCount).toBeGreaterThan(0);
      await expect(page.locator('table tbody tr').first().locator('td').nth(5)).toContainText(targetEmailSent);

      // Reset & verify all abstracts are displayed
      await openDrawer(page);
      await reset(page);
      await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
    });

    test('should apply sorting options and verify reset', async ({ page }) => {
      await expect(page.locator('text=Loading...')).not.toBeVisible();
      const initialCount = await page.locator('table tbody tr').count();

      // 1. Sort by name ASC
      await openDrawer(page);
      await page.locator('select').nth(2).selectOption('name'); // Sort by name
      await page.locator('select').nth(3).selectOption('ASC'); // ASC
      await apply(page);

      // Verify page still contains items
      expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);

      // 2. Sort by time DESC (Default behavior)
      await openDrawer(page);
      await page.locator('select').nth(2).selectOption('now'); // Sort by time
      await page.locator('select').nth(3).selectOption('DESC'); // DESC
      await apply(page);

      // Reset & verify count
      await openDrawer(page);
      await reset(page);
      await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
    });

    test('should apply combined filters when all fields are filled at once and verify reset', async ({ page }) => {
      await expect(page.locator('text=Loading...')).not.toBeVisible();
      const initialCount = await page.locator('table tbody tr').count();
      expect(initialCount).toBeGreaterThan(0);

      // Read target values from first row
      const firstRow = page.locator('table tbody tr').first();
      const targetName = await firstRow.locator('td').nth(2).innerText();
      const targetEmail = await firstRow.locator('td').nth(3).innerText();
      const targetOrg = await firstRow.locator('td').nth(11).innerText();
      const targetCountry = await firstRow.locator('td').nth(10).innerText();
      const targetTitle = await firstRow.locator('td').nth(12).innerText();

      await openDrawer(page);
      await page.locator('input[placeholder="Name"]').fill(targetName);
      await page.locator('input[placeholder="Email"]').fill(targetEmail);
      if (targetOrg && targetOrg.trim() !== '—') {
        await page.locator('input[placeholder="Organization"]').fill(targetOrg);
      }
      if (targetCountry && targetCountry.trim() !== '—') {
        await page.locator('input[placeholder="Country"]').fill(targetCountry);
      }
      if (targetTitle && targetTitle.trim() !== '—') {
        await page.locator('input[placeholder="Title"]').fill(targetTitle);
      }

      await apply(page);
      const filteredCount = await page.locator('table tbody tr').count();
      expect(filteredCount).toBeGreaterThan(0);

      // Reset
      await openDrawer(page);
      await reset(page);

      // Verify all records are back
      await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
    });
  });

});
