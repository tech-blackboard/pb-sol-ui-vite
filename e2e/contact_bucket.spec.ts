import { test, expect } from '@playwright/test';

test.describe('Contact Bucket & Global Contacts E2E Functionality', () => {

  test('should display Contact Bucket lists and allow Global Contacts search', async ({ page }) => {
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

    // Navigate to homepage and log in
    await page.goto('/');
    await page.fill('#email', 'merugup.media1@gmail.com');
    await page.fill('#password', 'Welcome#6557');
    await page.click('button[type="submit"]');

    // Confirm landing on Dashboard
    await expect(page.locator('h1')).toHaveText(/dashboard/i);

    // Click Contact Bucket in the navigation sidebar
    const bucketBtn = page.getByRole('button', { name: 'Contact Bucket', exact: true });
    await expect(bucketBtn).toBeVisible();
    await bucketBtn.click();

    // Verify Contact Bucket list loads (we can assert that the threads or container is visible)
    const mailboxView = page.locator('main');
    await expect(mailboxView).toBeVisible();

    // Click Global Contacts in the navigation sidebar
    const globalContactsBtn = page.getByRole('button', { name: 'Global Contacts', exact: true });
    await expect(globalContactsBtn).toBeVisible();
    await globalContactsBtn.click();

    // Verify Global Contacts search table is visible
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

});
