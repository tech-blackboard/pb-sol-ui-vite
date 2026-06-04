import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Functionality (Real DB)', () => {

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

  test('should display all 8 stats cards with numeric metrics', async ({ page }) => {
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
      const text = await locator.innerText();
      // Expect the label to contain a number (e.g. "Total Abstracts\n15" or "Total Abstracts 15")
      expect(text).toMatch(/\d+/);
    }
  });

  test('should apply active style when clicking stats cards and filter the table rows accordingly', async ({ page }) => {
    // Define mapping of status cards to their active background class and expected status text in table
    const cardConfigurations = [
      { label: 'Total Abstracts', activeClass: 'bg-blue-200', expectedStatus: null },
      { label: 'Under Review', activeClass: 'bg-orange-200', expectedStatus: 'Under Review' },
      { label: 'Accepted', activeClass: 'bg-green-200', expectedStatus: 'Accepted' },
      { label: 'Out of Scope', activeClass: 'bg-gray-200', expectedStatus: 'Out of Scope' },
      { label: 'Rejected', activeClass: 'bg-red-200', expectedStatus: 'Rejected' },
      { label: 'Invoiced', activeClass: 'bg-purple-200', expectedStatus: 'Invoiced' },
      { label: 'Registered', activeClass: 'bg-green-200', expectedStatus: 'Registered' },
      { label: 'Deleted', activeClass: 'bg-red-200', expectedStatus: 'Deleted' },
    ];

    for (const config of cardConfigurations) {
      const cardLocator = page.locator(`button:has-text("${config.label}")`);
      
      // Wait for API response to resolve after clicking
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/abstract/dashboard') && response.status() === 200
      );
      await cardLocator.click();
      await responsePromise;

      // Verify the card has the active style class
      await expect(cardLocator).toHaveClass(new RegExp(config.activeClass));

      // Wait for table loading to end
      await expect(page.locator('text=Loading...')).not.toBeVisible();

      // Check table contents if there are records
      if (config.expectedStatus) {
        const noRecordsLocator = page.locator('text=No recent records');
        const count = await noRecordsLocator.count();
        if (count === 0) {
          // If records exist, verify all status badges match the expected status
          const statusBadges = page.locator('table tbody tr td:last-child span');
          const badgeCount = await statusBadges.count();
          for (let i = 0; i < badgeCount; i++) {
            const badgeText = await statusBadges.nth(i).innerText();
            expect(badgeText).toBe(config.expectedStatus);
          }
        }
      }
    }
  });

  test('should toggle filters drawer and support applying/resetting filters with data verification', async ({ page }) => {
    // 1. Open the filter drawer
    const filtersBtn = page.locator('button:has-text("Filters")');
    await expect(filtersBtn).toBeVisible();
    await filtersBtn.click();

    // Verify website select dropdown is visible and contains options
    const websiteSelect = page.locator('select');
    await expect(websiteSelect).toBeVisible();

    // Let the options load
    await page.waitForTimeout(1000);

    const optionCount = await websiteSelect.locator('option').count();
    expect(optionCount).toBeGreaterThan(0);

    // Select a website if options are available
    let selectedWebsiteName = '';
    if (optionCount > 1) {
      await websiteSelect.selectOption({ index: 1 });
      selectedWebsiteName = await websiteSelect.locator('option').nth(1).innerText();
    }

    // Set From and To Dates (broad range to catch existing data)
    const fromDateInput = page.locator('input[type="date"]').first();
    const toDateInput = page.locator('input[type="date"]').last();
    await expect(fromDateInput).toBeVisible();
    await expect(toDateInput).toBeVisible();

    await fromDateInput.fill('2020-01-01');
    await toDateInput.fill('2030-12-31');

    // Click Apply filters
    const applyBtn = page.locator('button:has-text("Apply")');
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/abstract/dashboard') && response.status() === 200
    );
    await applyBtn.click();
    await responsePromise;

    // Verify the drawer is closed (select is no longer visible)
    await expect(websiteSelect).not.toBeVisible();

    // Verify the loaded table rows match the selected filters
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const noRecordsLocator = page.locator('text=No recent records');
    if (await noRecordsLocator.count() === 0) {
      const rows = page.locator('table tbody tr');
      const rowCount = await rows.count();
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        
        // 1st column: Website
        if (selectedWebsiteName) {
          const websiteCellText = await row.locator('td').nth(0).innerText();
          expect(websiteCellText.trim()).toBe(selectedWebsiteName.trim());
        }

        // 5th column: Submitted On
        const submittedOnText = await row.locator('td').nth(4).innerText();
        if (submittedOnText && submittedOnText !== '—') {
          const recordDate = new Date(submittedOnText);
          const fromDate = new Date('2020-01-01T00:00:00+05:30');
          const toDate = new Date('2030-12-31T23:59:59+05:30');
          expect(recordDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
          expect(recordDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
        }
      }
    }

    // 2. Re-open filters and verify Reset clears selections
    await filtersBtn.click();
    await expect(websiteSelect).toBeVisible();
    expect(await websiteSelect.inputValue()).not.toBe('');

    const resetBtn = page.locator('button:has-text("Reset")');
    const resetResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/abstract/dashboard') && response.status() === 200
    );
    await resetBtn.click();
    await resetResponsePromise;

    // Verify reset clears fields
    await expect(websiteSelect).toHaveValue('');
    await expect(fromDateInput).toHaveValue('');
    await expect(toDateInput).toHaveValue('');

    // Close the drawer using the close button
    const closeBtn = page.locator('button[aria-label="Close filters"]');
    await closeBtn.click();
    await expect(websiteSelect).not.toBeVisible();
  });

  test('should reload table and reset selected card when clicking Reload', async ({ page }) => {
    // Select a card (e.g. Under Review)
    const underReviewCard = page.locator('button:has-text("Under Review")');
    await underReviewCard.click();
    await expect(underReviewCard).toHaveClass(/bg-orange-200/);

    // Click Reload button
    const reloadBtn = page.locator('button:has-text("Reload")');
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/abstract/dashboard') && response.status() === 200
    );
    await reloadBtn.click();
    await responsePromise;

    // Verify selected card visual highlight is reset to Total Abstracts (no card has active class other than Total Abstracts)
    await expect(underReviewCard).not.toHaveClass(/bg-orange-200/);
    const totalAbstractsCard = page.locator('button:has-text("Total Abstracts")');
    await expect(totalAbstractsCard).toHaveClass(/bg-blue-200/);
  });

  test('should display correct table structure and format email links as mailto', async ({ page }) => {
    // Check that "Recent Abstracts" headers exist
    const expectedHeaders = ['Website', 'Name', 'Email', 'Country', 'Submitted On', 'Status'];
    for (const header of expectedHeaders) {
      const headerLocator = page.locator(`th:has-text("${header}")`);
      await expect(headerLocator).toBeVisible();
    }

    // Verify if there are data rows, email column has mailto links
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0 && !(await page.locator('text=No recent records').isVisible())) {
      const emailLinks = page.locator('table tbody tr td a[href^="mailto:"]');
      const emailCount = await emailLinks.count();
      expect(emailCount).toBeGreaterThan(0);
      
      // Verify href matches mailto format
      const href = await emailLinks.first().getAttribute('getAttribute');
      // Verify href matches mailto format
      const actualHref = await emailLinks.first().getAttribute('href');
      expect(actualHref).toMatch(/^mailto:.+@.+\..+/);
    }
  });

});
