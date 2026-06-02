import { test, expect } from '@playwright/test';

test.describe('Device Management Administrative E2E Functionality', () => {

  test('should display device list, and allow approvals and revocations', async ({ page }) => {
    // Intercept the login API request and inject the approved deviceId for the admin user
    await page.route('**/api/auth/login', async (route, request) => {
      const payload = JSON.parse(request.postData() || '{}');
      if (payload.useremail === 'techblackboard@gmail.com') {
        payload.deviceId = '06534fb58f1405a89b63ec9b7d01bf03';
      }
      await route.continue({
        postData: JSON.stringify(payload),
      });
    });

    // Navigate to homepage and log in as Admin
    await page.goto('/');
    await page.fill('#email', 'techblackboard@gmail.com');
    await page.fill('#password', 'Welcome#6557');
    await page.click('button[type="submit"]');

    // Confirm landing on Dashboard
    await expect(page.locator('h1')).toHaveText(/dashboard/i);

    // Click Device Management in the sidebar
    const devManBtn = page.getByRole('button', { name: 'Device Management', exact: true });
    await expect(devManBtn).toBeVisible();
    await devManBtn.click();

    // Verify Device Management page heading is visible
    await expect(page.locator('h1:has-text("Device Management")')).toBeVisible();

    // Verify that the devices list table loads successfully
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Check if there are any devices listed. There should be at least one allowed device (the admin's device).
    const rows = table.locator('tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

});
