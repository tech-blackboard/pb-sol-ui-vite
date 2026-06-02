import { test, expect } from '@playwright/test';

test.describe('Real Data E2E - Authentication Flow', () => {

  test('should display validation error on failed login credentials', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Fill in invalid credentials
    await page.fill('#email', 'nonexistent_user@gmail.com');
    await page.fill('#password', 'WrongPassword123');

    // Click submit
    await page.click('button[type="submit"]');

    // Assert that the invalid credentials error message is visible
    const errorBlock = page.locator('text=Invalid credentials');
    await expect(errorBlock).toBeVisible();
  });

  test('should log in successfully as regular user and NOT display admin controls', async ({ page }) => {
    // Intercept the login API request and inject the approved deviceId for this user
    await page.route('**/api/auth/login', async (route, request) => {
      const payload = JSON.parse(request.postData() || '{}');
      if (payload.useremail === 'merugup.media1@gmail.com') {
        payload.deviceId = '06534fb58f1405a89b63ec9b7d01bf03';
      }
      await route.continue({
        postData: JSON.stringify(payload),
      });
    });

    // Navigate to homepage
    await page.goto('/');

    // Fill in credentials for regular user
    await page.fill('#email', 'merugup.media1@gmail.com');
    await page.fill('#password', 'Welcome#6557');

    // Click submit
    await page.click('button[type="submit"]');

    // land on the Dashboard successfully!
    await expect(page.locator('h1')).toHaveText(/dashboard/i);

    // Verify that the "Device Management" admin link is NOT visible for regular user
    const deviceManagmentLink = page.locator('button:has-text("Device Management")');
    await expect(deviceManagmentLink).not.toBeVisible();
  });

  test('should log in successfully as admin user and DISPLAY admin controls', async ({ page }) => {
    // Intercept the login API request and inject the approved deviceId for this admin user
    await page.route('**/api/auth/login', async (route, request) => {
      const payload = JSON.parse(request.postData() || '{}');
      if (payload.useremail === 'techblackboard@gmail.com') {
        payload.deviceId = '06534fb58f1405a89b63ec9b7d01bf03';
      }
      await route.continue({
        postData: JSON.stringify(payload),
      });
    });

    // Navigate to homepage
    await page.goto('/');

    // Fill in credentials for admin user
    await page.fill('#email', 'techblackboard@gmail.com');
    await page.fill('#password', 'Welcome#6557');

    // Click submit
    await page.click('button[type="submit"]');

    // land on the Dashboard successfully!
    await expect(page.locator('h1')).toHaveText(/dashboard/i);

    // Verify that the "Device Management" admin link is visible for admin user
    const deviceManagmentLink = page.locator('button:has-text("Device Management")');
    await expect(deviceManagmentLink).toBeVisible();
  });

});
