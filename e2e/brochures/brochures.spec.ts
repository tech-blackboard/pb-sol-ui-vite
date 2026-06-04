import { test, expect } from '@playwright/test';

test.describe('Website Brochures E2E Functionality', () => {

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

    const brochuresBtn = page.getByRole('button', { name: 'Brochures', exact: true });
    await expect(brochuresBtn).toBeVisible();
    await brochuresBtn.click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should validate required fields on Brochure Form', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: 'Add Brochure', exact: true });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const submitBtn = page.getByRole('button', { name: 'Submit Now', exact: true });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Phone is required')).toBeVisible();
    await expect(page.locator('text=Country is required')).toBeVisible();
    await expect(page.locator('text=Website is required')).toBeVisible();
    await expect(page.locator('text=Message is required')).toBeVisible();
  });

  test('should successfully submit Brochure Request and view details', async ({ page }) => {
    const testName = 'E2E Brochure ' + Date.now();
    const testEmail = 'brochure_' + Date.now() + '@example.com';

    const addBtn = page.getByRole('button', { name: 'Add Brochure', exact: true });
    await addBtn.click();

    await page.fill('input#name', testName);
    await page.fill('input#email', testEmail);
    await page.fill('input#phone', '1234567890');
    await page.locator('select#country').selectOption('Canada');
    await page.locator('select#website-select').selectOption({ index: 1 });
    await page.fill('textarea#message-input', 'Please send me the conference brochure details.');

    const submitBtn = page.getByRole('button', { name: 'Submit Now', exact: true });
    await submitBtn.click();

    await expect(page.locator('text=Brochure request submitted successfully')).toBeVisible();

    // Find the first row view button
    const firstRowViewBtn = page.locator('button[title="View Details"]').first();
    await expect(firstRowViewBtn).toBeVisible();
    await firstRowViewBtn.click();

    await expect(page.locator('h2:has-text("Brochure Request Details")')).toBeVisible();
    await expect(page.locator('dt:text-is("Full Name") + dd')).toHaveText(testName);
    await expect(page.locator('dt:text-is("Email") + dd')).toHaveText(testEmail);
    await expect(page.locator('dt:text-is("Phone") + dd')).toHaveText('1234567890');
    await expect(page.locator('dt:text-is("Country") + dd')).toHaveText('Canada');
    await expect(page.locator('h3:has-text("Message") + div')).toHaveText('Please send me the conference brochure details.');

    const closeBtn = page.locator('button:has-text("Close")');
    await closeBtn.click();
  });

  test('should verify brochure filter drawer inputs, combined filters, sorting, and reset button', async ({ page }) => {
    // 1. Initial count
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const initialCount = await page.locator('table tbody tr').count();

    // 2. Open filters drawer
    const filterBtn = page.locator('button[aria-label="Open filters"]');
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();
    await expect(page.locator('h3:has-text("Brochure Filters")')).toBeVisible();

    // 3. Test individual field filtering (Name field)
    await page.fill('input[placeholder="Name"]', 'E2E Brochure');
    
    // Intercept search API call
    const searchPromise = page.waitForResponse(res => res.url().includes('/api/brochure/search') && res.status() === 200);
    await page.locator('button:has-text("Apply")').click();
    await searchPromise;
    await expect(page.locator('text=Loading...')).not.toBeVisible();

    // Reset filters
    await filterBtn.click();
    const resetPromise = page.waitForResponse(res => res.url().includes('/api/brochure/search') && res.status() === 200);
    await page.locator('button:has-text("Reset")').click();
    await resetPromise;
    await page.locator('button:has-text("✕")').click();
    await expect(page.locator('table tbody tr')).toHaveCount(initialCount);

    // 4. Test Website Dropdown selection filter
    await filterBtn.click();
    const websiteSelect = page.locator('select').first();
    await websiteSelect.selectOption({ index: 1 });
    const webPromise = page.waitForResponse(res => res.url().includes('/api/brochure/search') && res.status() === 200);
    await page.locator('button:has-text("Apply")').click();
    await webPromise;

    // Reset
    await filterBtn.click();
    const resetPromise2 = page.waitForResponse(res => res.url().includes('/api/brochure/search') && res.status() === 200);
    await page.locator('button:has-text("Reset")').click();
    await resetPromise2;
    await page.locator('button:has-text("✕")').click();

    // 5. Test sorting by name ASC
    await filterBtn.click();
    await page.locator('select').nth(1).selectOption('name'); // Sort by name
    await page.locator('select').nth(2).selectOption('ASC'); // ASC
    const sortPromise = page.waitForResponse(res => res.url().includes('/api/brochure/search') && res.status() === 200);
    await page.locator('button:has-text("Apply")').click();
    await sortPromise;
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);

    // Reset
    await filterBtn.click();
    const resetPromise3 = page.waitForResponse(res => res.url().includes('/api/brochure/search') && res.status() === 200);
    await page.locator('button:has-text("Reset")').click();
    await resetPromise3;
    await page.locator('button:has-text("✕")').click();

    // 6. Test combined/all-filled filters at once
    await filterBtn.click();
    await page.fill('input[placeholder="Keyword search..."]', 'E2E');
    await page.fill('input[placeholder="Name"]', 'E2E');
    await page.fill('input[placeholder="Email"]', '@');
    await page.fill('input[placeholder="Phone"]', '1');
    await page.fill('input[placeholder="Country"]', 'Canada');
    const combinedPromise = page.waitForResponse(res => res.url().includes('/api/brochure/search') && res.status() === 200);
    await page.locator('button:has-text("Apply")').click();
    await combinedPromise;

    // Reset to default
    await filterBtn.click();
    const resetPromise4 = page.waitForResponse(res => res.url().includes('/api/brochure/search') && res.status() === 200);
    await page.locator('button:has-text("Reset")').click();
    await resetPromise4;
    await page.locator('button:has-text("✕")').click();
    await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
  });

});
