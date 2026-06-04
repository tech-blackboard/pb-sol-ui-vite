import { test, expect } from '@playwright/test';

test.describe('Website Registrations E2E Functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept all API calls to inject the approved x-device-id header
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
    await page.fill('#email', 'techblackboard@gmail.com');
    await page.fill('#password', 'Welcome#6557');
    await page.click('button[type="submit"]');

    // Confirm landing on Dashboard
    await expect(page.locator('h1')).toHaveText(/dashboard/i, { timeout: 15000 });

    // Navigate to Registrations page
    const registrationsBtn = page.getByRole('button', { name: 'Registrations', exact: true });
    await expect(registrationsBtn).toBeVisible();
    await registrationsBtn.click();

    // Confirm table loaded
    await expect(page.locator('table')).toBeVisible();
  });

  test('should validate required fields when submitting an empty registration form', async ({ page }) => {
    // Click Add Registration button
    const addBtn = page.getByRole('button', { name: 'Add Registration', exact: true });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Click submit immediately on the blank form
    const submitBtn = page.getByRole('button', { name: 'Create Registration', exact: true });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Assert validation error messages appear
    await expect(page.locator('text=Caption is required')).toBeVisible();
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Phone is required')).toBeVisible();
    await expect(page.locator('text=Country is required')).toBeVisible();
    await expect(page.locator('text=Institution is required')).toBeVisible();
    await expect(page.locator('text=Website is required')).toBeVisible();
  });

  test('should validate accommodation edge cases (checkout <= checkin, missing fields)', async ({ page }) => {
    // Click Add Registration button
    const addBtn = page.getByRole('button', { name: 'Add Registration', exact: true });
    await addBtn.click();

    // Toggle accommodation
    const accCheckbox = page.locator('#accomm-checkbox');
    await expect(accCheckbox).toBeVisible();
    await accCheckbox.check();

    // Submit with missing occupancy
    const submitBtn = page.getByRole('button', { name: 'Create Registration', exact: true });
    await submitBtn.click();
    await expect(page.locator('text=Occupancy type is required')).toBeVisible();

    // Select occupancy
    await page.locator('input[name="occupancy"][value="Single Occupancy"]').click();

    // Checkout same or before checkin date check
    await page.fill('input#checkin', '2026-06-10');
    await page.fill('input#checkout', '2026-06-10');

    await submitBtn.click();
    await expect(page.locator('text=Check-out must be after check-in date')).toBeVisible();

    // Verify nights <= 0 or missing accommodation fee validation
    await page.fill('input#checkout', '2026-06-12'); // 2 nights
    await submitBtn.click();
    await expect(page.locator('text=Accommodation fee is required')).toBeVisible();
  });

  test('should calculate summary correctly and submit a registration with accommodation successfully', async ({ page }) => {
    const testName = 'E2E Reg Accomm ' + Date.now();
    const testEmail = 'reg_accomm_' + Date.now() + '@example.com';

    // Click Add Registration button
    const addBtn = page.getByRole('button', { name: 'Add Registration', exact: true });
    await addBtn.click();

    // Fill personal info
    await page.locator('select#caption-select').selectOption('Dr.');
    await page.fill('input#name', testName);
    await page.fill('input#email', testEmail);
    await page.fill('input#aemail', 'alt_' + testEmail);
    await page.fill('input#phone', '9876543211');
    await page.fill('input#wphone', '9876543212');
    await page.fill('input#institution', 'TBB Registration Org');
    await page.locator('select#country').selectOption('India');
    await page.locator('select#presentation').selectOption('Oral Presenter (In-Person)'); // price 699

    // Select website
    const websiteSelect = page.locator('select#website-select');
    await expect(websiteSelect).toBeVisible();
    await websiteSelect.selectOption({ index: 1 });

    // Verify default reg price is set to 699
    await expect(page.locator('input#reg_price')).toHaveValue('699');
    await page.fill('input#participants', '2'); // Subtotal: 699 * 2 = 1398

    // Toggle accommodation
    const accCheckbox = page.locator('#accomm-checkbox');
    await accCheckbox.check();
    await page.locator('input[name="occupancy"][value="Double Occupancy"]').click();

    // Dates checkin & checkout
    await page.fill('input#checkin', '2026-06-10');
    await page.fill('input#checkout', '2026-06-15'); // 5 nights

    // Price per night
    await page.fill('input#acc_price', '150'); // Accommodation Total: 150 * 5 = 750

    // Calculations verify:
    // Subtotal = 1398 + 750 = 2148
    // Fees = 2148 * 0.048 = 103
    // Total = 2148 + 103 = 2251
    await expect(page.locator('form table >> text=$2251')).toBeVisible();

    // Submit
    const submitBtn = page.getByRole('button', { name: 'Create Registration', exact: true });
    await submitBtn.click();

    // Assert success toast
    await expect(page.locator('text=Registration created successfully')).toBeVisible();

    // Locate the newly created registration in the table and verify view details modal content
    const firstRowViewBtn = page.locator('button[title="View Details"]').first();
    await expect(firstRowViewBtn).toBeVisible();
    await firstRowViewBtn.click();

    // Assert details inside the modal
    await expect(page.locator('h2:has-text("Registration Details")')).toBeVisible();
    await expect(page.locator('dt:text-is("Full Name") + dd')).toHaveText(testName);
    await expect(page.locator('dt:text-is("Email") + dd')).toHaveText(testEmail);
    await expect(page.locator('dt:text-is("Alt Email") + dd')).toHaveText('alt_' + testEmail);
    await expect(page.locator('dt:text-is("Phone") + dd')).toHaveText('9876543211');
    await expect(page.locator('dt:text-is("Work Phone") + dd')).toHaveText('9876543212');
    await expect(page.locator('dt:text-is("Institution") + dd')).toHaveText('TBB Registration Org');
    await expect(page.locator('dt:text-is("Country") + dd')).toHaveText('India');
    await expect(page.locator('dt:text-is("Participants") + dd')).toHaveText('2');
    await expect(page.locator('dt:text-is("Total Price") + dd')).toHaveText('$2251');

    // Close the details modal
    const closeBtn = page.locator('button:has-text("Close")');
    await closeBtn.click();
    await expect(page.locator('h2:has-text("Registration Details")')).not.toBeVisible();
  });

  test('should verify registration filter drawer inputs, combined filters, sorting, and reset button', async ({ page }) => {
    // 1. Initial count
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const initialCount = await page.locator('table tbody tr').count();

    // 2. Open filters drawer
    const filterBtn = page.locator('button[aria-label="Open filters"]');
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();
    await expect(page.locator('h3:has-text("Registration Filters")')).toBeVisible();

    // 3. Test individual field filtering (Name field)
    await page.fill('input[placeholder="Name"]', 'E2E Reg Accomm');
    
    // Intercept search API call to wait for it
    const searchPromise = page.waitForResponse(res => res.url().includes('/api/registrations/search') && res.status() === 200);
    await page.locator('button:has-text("Apply")').click();
    await searchPromise;
    await expect(page.locator('text=Loading...')).not.toBeVisible();

    // Reset filters
    await filterBtn.click();
    const resetPromise = page.waitForResponse(res => res.url().includes('/api/registrations/search') && res.status() === 200);
    await page.locator('button:has-text("Reset")').click();
    await resetPromise;
    await page.locator('button:has-text("✕")').click();
    await expect(page.locator('table tbody tr')).toHaveCount(initialCount);

    // 4. Test Website Dropdown selection filter
    await filterBtn.click();
    const websiteSelect = page.locator('select').first();
    await websiteSelect.selectOption({ index: 1 });
    const webPromise = page.waitForResponse(res => res.url().includes('/api/registrations/search') && res.status() === 200);
    await page.locator('button:has-text("Apply")').click();
    await webPromise;

    // Reset
    await filterBtn.click();
    const resetPromise2 = page.waitForResponse(res => res.url().includes('/api/registrations/search') && res.status() === 200);
    await page.locator('button:has-text("Reset")').click();
    await resetPromise2;
    await page.locator('button:has-text("✕")').click();

    // 5. Test sorting by name ASC
    await filterBtn.click();
    await page.locator('select').nth(1).selectOption('name'); // Sort by name
    await page.locator('select').nth(2).selectOption('ASC'); // ASC
    const sortPromise = page.waitForResponse(res => res.url().includes('/api/registrations/search') && res.status() === 200);
    await page.locator('button:has-text("Apply")').click();
    await sortPromise;
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);

    // Reset
    await filterBtn.click();
    const resetPromise3 = page.waitForResponse(res => res.url().includes('/api/registrations/search') && res.status() === 200);
    await page.locator('button:has-text("Reset")').click();
    await resetPromise3;
    await page.locator('button:has-text("✕")').click();

    // 6. Test combined/all-filled filters at once
    await filterBtn.click();
    await page.fill('input[placeholder="Keyword search..."]', 'E2E');
    await page.fill('input[placeholder="Name"]', 'E2E');
    await page.fill('input[placeholder="Email"]', '@');
    await page.fill('input[placeholder="Phone"]', '9');
    await page.fill('input[placeholder="Country"]', 'India');
    await page.fill('input[placeholder="Institution"]', 'TBB');
    await page.fill('input[placeholder="Presentation"]', 'Oral');
    await page.fill('input[placeholder="Status Flag"]', '1');
    const combinedPromise = page.waitForResponse(res => res.url().includes('/api/registrations/search') && res.status() === 200);
    await page.locator('button:has-text("Apply")').click();
    await combinedPromise;

    // Reset to default
    await filterBtn.click();
    const resetPromise4 = page.waitForResponse(res => res.url().includes('/api/registrations/search') && res.status() === 200);
    await page.locator('button:has-text("Reset")').click();
    await resetPromise4;
    await page.locator('button:has-text("✕")').click();
    await expect(page.locator('table tbody tr')).toHaveCount(initialCount);
  });

});
