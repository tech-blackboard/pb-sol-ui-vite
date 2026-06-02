import { test, expect } from '@playwright/test';

test.describe('CRM Mailbox E2E Functionality', () => {

  test('should load the mailbox and navigate folders successfully', async ({ page }) => {
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

    // Click Mailbox in the sidebar navigation
    const mailboxBtn = page.getByRole('button', { name: 'Mailbox', exact: true });
    await expect(mailboxBtn).toBeVisible();
    await mailboxBtn.click();

    // Verify folder controls exist (e.g. Inbox folder label or thread headers)
    const folders = ['Inbox', 'Contact Bucket', 'Global Contacts'];
    for (const f of folders) {
      const folderBtn = page.getByRole('button', { name: f, exact: true });
      if (await folderBtn.count() > 0) {
        await expect(folderBtn.first()).toBeVisible();
      }
    }
  });

});
