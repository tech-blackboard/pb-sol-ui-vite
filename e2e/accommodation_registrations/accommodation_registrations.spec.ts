import { test, expect } from '@playwright/test';

test.describe('Website Accommodation Registrations E2E Functionality', () => {

  test.beforeEach(async ({ page }) => {
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

    await page.goto('/');
    await page.fill('#email', 'techblackboard@gmail.com');
    await page.fill('#password', 'Welcome#6557');
    await page.click('button[type="submit"]');
    await expect(page.locator('h1')).toHaveText(/dashboard/i, { timeout: 15000 });

    const accBtn = page.getByRole('button', { name: 'Accommodation Registrations', exact: true });
    await expect(accBtn).toBeVisible();
    await accBtn.click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should validate required fields on Accommodation Form', async ({ page }) => {
    const addBtn = page.locator('button:has-text("Add Accommodation")').first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const submitBtn = page.locator('form button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await expect(page.locator('text=Caption is required')).toBeVisible();
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Phone is required')).toBeVisible();
    await expect(page.locator('text=Website is required')).toBeVisible();
    await expect(page.locator('text=Occupancy type is required')).toBeVisible();
    await expect(page.locator('text=Accommodation price is required')).toBeVisible();
    await expect(page.locator('text=Check-in date is required')).toBeVisible();
    await expect(page.locator('text=Check-out date is required')).toBeVisible();
  });

  test('should validate check-out must be after check-in date range', async ({ page }) => {
    const addBtn = page.locator('button:has-text("Add Accommodation")').first();
    await addBtn.click();

    // Select occupancy
    await page.locator('input[name="occupancy"][value="Triple Occupancy"]').click();

    // Fill invalid date sequence
    await page.fill('input#checkin', '2026-07-20');
    await page.fill('input#checkout', '2026-07-19');

    const submitBtn = page.locator('form button[type="submit"]');
    await submitBtn.click();

    await expect(page.locator('text=Check-out must be after check-in date')).toBeVisible();
  });

  test('should successfully calculate total price and create accommodation registration', async ({ page }) => {
    const testName = 'E2E Accommodation ' + Date.now();
    const testEmail = 'accomm_reg_' + Date.now() + '@example.com';

    const addBtn = page.locator('button:has-text("Add Accommodation")').first();
    await addBtn.click();

    await page.locator('select#caption-select').selectOption('Prof.');
    await page.fill('input#name', testName);
    await page.fill('input#email', testEmail);
    await page.fill('input#aemail', 'alt_' + testEmail);
    await page.fill('input#phone', '7776665554');
    await page.fill('input#wphone', '7776665555');

    // Select website
    await page.locator('select#website-select').selectOption({ index: 1 });

    // Select occupancy
    await page.locator('input[name="occupancy"][value="Single Occupancy"]').click();

    // Valid checkin / checkout
    await page.fill('input#checkin', '2026-07-20');
    await page.fill('input#checkout', '2026-07-25'); // 5 nights

    // Price per Night
    await page.fill('input#accomm', '200'); // 200 * 5 = 1000 subtotal. fees = 48. total = 1048.

    // Verify calculated summary text
    await expect(page.locator('form table >> text=$1048')).toBeVisible();

    const submitBtn = page.locator('form button[type="submit"]');
    await submitBtn.click();

    await expect(page.locator('text=Accommodation Registration created successfully')).toBeVisible();

    // View details and verify correctness
    const firstRowViewBtn = page.locator('button[title="View Details"]').first();
    await expect(firstRowViewBtn).toBeVisible();
    await firstRowViewBtn.click();

    await expect(page.locator('h2:has-text("Accommodation Details")')).toBeVisible();
    await expect(page.locator('dt:text-is("Full Name") + dd')).toHaveText(testName);
    await expect(page.locator('dt:text-is("Email") + dd')).toHaveText(testEmail);
    await expect(page.locator('dt:text-is("Alt Email") + dd')).toHaveText('alt_' + testEmail);
    await expect(page.locator('dt:text-is("Phone") + dd')).toHaveText('7776665554');
    await expect(page.locator('dt:text-is("Work Phone") + dd')).toHaveText('7776665555');
    await expect(page.locator('dt:text-is("Nights") + dd')).toHaveText('5');
    await expect(page.locator('dt:text-is("Total Price") + dd')).toHaveText('$1048');

    const closeBtn = page.locator('button:has-text("Close")');
    await closeBtn.click();
  });

  test('should verify accommodation registration filter drawer inputs, combined filters, sorting, and reset button', async ({ page }) => {
    // 1. Initial count
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const initialCount = await page.locator('table tbody tr').count();

    // 2. Open filters drawer
    const filterBtn = page.locator('button[aria-label="Open filters"]');
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();
    await expect(page.locator('h3:has-text("Accommodation Registration Filters")')).toBeVisible();

    // 3. Test individual field filtering (Name field)
    await page.fill('input[placeholder="Name"]', 'E2E Accommodation');
    
    // Intercept search API call
    const searchPromise = page.waitForResponse(res => res.url().includes('/api/acc-registration/search') && res.status() === 200);
    await page.locator('button:has-text("Apply")').click();
    await searchPromise;
    await expect(page.locator('text=Loading...')).not.toBeVisible();

    // Reset filters
    await filterBtn.click();
    const resetPromise = page.waitForResponse(res => res.url().includes('/api/acc-registration/search') && res.status() === 200);
    await page.locator('button:has-text("Reset")').click();
    await resetPromise;
    await page.locator('button:has-text("✕")').click();
    await expect(page.locator('table tbody tr')).toHaveCount(initialCount);

    // 4. Test Website Dropdown selection filter
    await filterBtn.click();
    const websiteSelect = page.locator('select').first();
    await websiteSelect.selectOption({ index: 1 });
    const webPromise = page.waitForResponse(res => res.url().includes('/api/acc-registration/search') && res.status() === 200);
    await page.locator('button:has-text("Apply")').click();
    await webPromise;

    // Reset
    await filterBtn.click();
    const resetPromise2 = page.waitForResponse(res => res.url().includes('/api/acc-registration/search') && res.status() === 200);
    await page.locator('button:has-text("Reset")').click();
    await resetPromise2;
    await page.locator('button:has-text("✕")').click();

    // 5. Test sorting by name ASC
    await filterBtn.click();
    await page.locator('select').nth(1).selectOption('name'); // Sort by name
    await page.locator('select').nth(2).selectOption('ASC'); // ASC
    const sortPromise = page.waitForResponse(res => res.url().includes('/api/acc-registration/search') && res.status() === 200);
    await page.locator('button:has-text("Apply")').click();
    await sortPromise;
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);

    // Reset
    await filterBtn.click();
    const resetPromise3 = page.waitForResponse(res => res.url().includes('/api/acc-registration/search') && res.status() === 200);
    await page.locator('button:has-text("Reset")').click();
    await resetPromise3;
    await page.locator('button:has-text("✕")').click();

    // 6. Test combined/all-filled filters at once
    await filterBtn.click();
    await page.fill('input[placeholder="Keyword search..."]', 'E2E');
    await page.fill('input[placeholder="Name"]', 'E2E');
    await page.fill('input[placeholder="Email"]', '@');
    await page.fill('input[placeholder="Phone"]', '7');
    const combinedPromise = page.waitForResponse(res => res.url().includes('/api/acc-registration/search') && res.status() === 200);
    await page.locator('button:has-text("Apply")').click();
    await combinedPromise;

    // Reset to default
    await filterBtn.click();
    const resetPromise4 = page.waitForResponse(res => res.url().includes('/api/acc-registration/search') && res.status() === 200);
    await page.locator('button:has-text("Reset")').click();
    await resetPromise4;
    await page.locator('button:has-text("✕")').click();
    await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
  });

});
