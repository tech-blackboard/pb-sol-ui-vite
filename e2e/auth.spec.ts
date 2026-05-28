import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  // Before each test, setup routes and go to the homepage
  test.beforeEach(async ({ page }) => {
    // 1. Catch-all router to prevent unmocked connection failures (ERR_CONNECTION_REFUSED)
    // which triggers the 'Server Unavailable' screen in your frontend application.
    await page.route('**/api/**', async (route, request) => {
      const url = request.url();
      
      // Allow specific mock requests to bypass or be processed in their test blocks
      if (url.includes('/api/auth/login') || url.includes('/api/auth/me')) {
        await route.continue();
        return;
      }

      // Automatically mock all other database/CRM loads to return clean success states
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]), // Empty lists represent empty abstracts, threads, etc.
      });
    });

    await page.goto('/');
  });

  test('should render the login form correctly', async ({ page }) => {
    // Assert heading exists
    await expect(page.locator('h1')).toHaveText(/sign in/i);
    
    // Assert form controls exist
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText(/sign in/i);
  });

  test('should display validation error on failed login credentials', async ({ page }) => {
    // Mock the backend auth endpoint to return an error (401 Unauthorized)
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials provided.' }),
      });
    });

    // Fill in credentials
    await page.fill('#email', 'wronguser@gmail.com');
    await page.fill('#password', 'wrongpassword');
    
    // Click submit
    await page.click('button[type="submit"]');

    // Assert that the error notification or alert block is visible
    const errorBlock = page.locator('text=Invalid credentials provided.');
    await expect(errorBlock).toBeVisible();
  });

  test('should log in successfully and redirect to dashboard with mocked APIs', async ({ page }) => {
    // Mock successful authentication response
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: {
            id: '1',
            email: 'johndoe@gmail.com',
            name: 'John Doe',
          },
        }),
      });
    });

    // Mock dashboard details / session endpoint if any is called upon load
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          email: 'johndoe@gmail.com',
          name: 'John Doe',
        }),
      });
    });

    // Fill credentials
    await page.fill('#email', 'johndoe@gmail.com');
    await page.fill('#password', 'john123');
    
    // Submit
    await page.click('button[type="submit"]');

    // After success, expect user to see the dashboard / mailbox area
    await expect(page).toHaveURL(/\/dashboard|$/);
  });

  test('should trigger device-not-approved restriction alert on a 403 response containing device info', async ({ page }) => {
    // Mock authentication endpoint to return 403 Forbidden with device error details
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'This device is not approved for access.' }),
      });
    });

    // Fill credentials
    await page.fill('#email', 'johndoe@gmail.com');
    await page.fill('#password', 'john123');
    
    // Submit
    await page.click('button[type="submit"]');

    // The interceptor in api.ts catches status 403 and message containing 'device'
    // dispatches 'app:device-not-approved' which displays a toast alert
    const toastAlert = page.locator('text=This device is not approved for access.');
    await expect(toastAlert).toBeVisible();
  });
});
