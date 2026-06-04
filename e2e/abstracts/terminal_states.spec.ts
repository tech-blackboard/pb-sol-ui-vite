import { test, expect } from '@playwright/test';

test.describe('Abstracts Terminal States E2E Functionality', () => {

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

  test('should support transitioning to Out of Scope, Rejected, and Deleted status and enforce dropdown restrictions', async ({ page }) => {
    const nameText = `E2E Terminal User ${Date.now()}`;
    
    // Create new abstract
    const addBtn = page.getByRole('button', { name: 'Add Abstract', exact: true });
    await addBtn.click();
    
    await page.locator('select#Caption').selectOption('Prof.');
    await page.fill('input#Name', nameText);
    await page.fill('input#email', 'merugup.media1@gmail.com');
    await page.fill('input#Phone', '9876543210');
    await page.locator('select#Country').selectOption('India');
    await page.fill('input#City', 'Chennai');
    await page.fill('input#Organization', 'IIT Madras');
    await page.locator('select[id="Interested in"]').selectOption('Oral Presentation(In-Person)');
    await page.fill('input[id="Abstract Title"]', 'E2E Terminal test research');
    await page.locator('select[id="Website/Conference"]').selectOption({ index: 1 });
    await page.setInputFiles('input[type="file"]', {
      name: 'terminal.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf content')
    });

    const captchaDiv = page.locator('form#abstract-form div.bg-purple-100, form#abstract-form div.bg-purple-900\\/30').first();
    const captchaText = await captchaDiv.innerText();
    await page.fill('input[id="Captcha Code"]', captchaText.trim());

    const submitBtn = page.getByRole('button', { name: 'Submit Now', exact: true });
    const createResponse = page.waitForResponse(
      res => res.url().includes('/api/abstract') && res.status() === 201
    );
    await submitBtn.click();
    await createResponse;

    await expect(page.locator('h2:has-text("Submit Abstract")')).not.toBeVisible();

    // Open details
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const row = page.locator('table tbody tr').filter({ hasText: nameText }).first();
    await expect(row).toBeVisible();
    await row.locator('button[title="Edit"]').click();

    // Change status from Under Review to Out of Scope
    const statusSelect = page.locator('select').filter({ hasText: 'Under Review' }).first();
    await statusSelect.selectOption('Out of Scope');
    const updateStatusBtn = page.locator('button:has-text("Update")');
    let updateStatusResponse = page.waitForResponse(
      res => res.url().includes('/status') && res.status() === 200
    );
    await updateStatusBtn.click();
    await updateStatusResponse;

    // Verify status update success toast
    await expect(page.locator('text=Status updated to Out of Scope')).toBeVisible();
    await expect(page.locator('dt:has-text("Status") + dd span')).toHaveText('Out of Scope');

    // Verify dropdown values: since status is Out of Scope (which is terminal), option "Accepted" should be disabled
    const acceptedOption = statusSelect.locator('option:has-text("Accepted")');
    await expect(acceptedOption).toHaveAttribute('disabled', '');

    // Under Review option should also be disabled
    const underReviewOption = statusSelect.locator('option:has-text("Under Review")');
    await expect(underReviewOption).toHaveAttribute('disabled', '');

    // Close details
    await page.locator('button:has-text("Close")').click();

    // 2. Create another abstract and transition to Rejected
    const nameText2 = `E2E Terminal User 2 ${Date.now()}`;
    const addBtn2 = page.getByRole('button', { name: 'Add Abstract', exact: true });
    await addBtn2.click();
    
    await page.locator('select#Caption').selectOption('Prof.');
    await page.fill('input#Name', nameText2);
    await page.fill('input#email', 'merugup.media1@gmail.com');
    await page.fill('input#Phone', '9876543210');
    await page.locator('select#Country').selectOption('India');
    await page.fill('input#City', 'Chennai');
    await page.fill('input#Organization', 'IIT Madras');
    await page.locator('select[id="Interested in"]').selectOption('Oral Presentation(In-Person)');
    await page.fill('input[id="Abstract Title"]', 'E2E Terminal 2 test research');
    await page.locator('select[id="Website/Conference"]').selectOption({ index: 1 });
    await page.setInputFiles('input[type="file"]', {
      name: 'terminal_2.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf content 2')
    });

    const captchaDiv2 = page.locator('form#abstract-form div.bg-purple-100, form#abstract-form div.bg-purple-900\\/30').first();
    const captchaText2 = await captchaDiv2.innerText();
    await page.fill('input[id="Captcha Code"]', captchaText2.trim());

    const submitBtn2 = page.getByRole('button', { name: 'Submit Now', exact: true });
    const createResponse2 = page.waitForResponse(
      res => res.url().includes('/api/abstract') && res.status() === 201
    );
    await submitBtn2.click();
    await createResponse2;

    await expect(page.locator('h2:has-text("Submit Abstract")')).not.toBeVisible();

    // Open details for the second abstract
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const row2 = page.locator('table tbody tr').filter({ hasText: nameText2 }).first();
    await expect(row2).toBeVisible();
    await row2.locator('button[title="Edit"]').click();

    // Transition to Rejected
    const statusSelect2 = page.locator('select').filter({ hasText: 'Under Review' }).first();
    await statusSelect2.selectOption('Rejected');
    const updateStatusBtn2 = page.locator('button:has-text("Update")');
    updateStatusResponse = page.waitForResponse(
      res => res.url().includes('/status') && res.status() === 200
    );
    await updateStatusBtn2.click();
    await updateStatusResponse;
    await expect(page.locator('text=Status updated to Rejected')).toBeVisible();

    // Close details
    await page.locator('button:has-text("Close")').click();

    // 3. Create another abstract and transition to Deleted
    const nameText3 = `E2E Terminal User 3 ${Date.now()}`;
    const addBtn3 = page.getByRole('button', { name: 'Add Abstract', exact: true });
    await addBtn3.click();
    
    await page.locator('select#Caption').selectOption('Prof.');
    await page.fill('input#Name', nameText3);
    await page.fill('input#email', 'merugup.media1@gmail.com');
    await page.fill('input#Phone', '9876543210');
    await page.locator('select#Country').selectOption('India');
    await page.fill('input#City', 'Chennai');
    await page.fill('input#Organization', 'IIT Madras');
    await page.locator('select[id="Interested in"]').selectOption('Oral Presentation(In-Person)');
    await page.fill('input[id="Abstract Title"]', 'E2E Terminal 3 test research');
    await page.locator('select[id="Website/Conference"]').selectOption({ index: 1 });
    await page.setInputFiles('input[type="file"]', {
      name: 'terminal_3.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf content 3')
    });

    const captchaDiv3 = page.locator('form#abstract-form div.bg-purple-100, form#abstract-form div.bg-purple-900\\/30').first();
    const captchaText3 = await captchaDiv3.innerText();
    await page.fill('input[id="Captcha Code"]', captchaText3.trim());

    const submitBtn3 = page.getByRole('button', { name: 'Submit Now', exact: true });
    const createResponse3 = page.waitForResponse(
      res => res.url().includes('/api/abstract') && res.status() === 201
    );
    await submitBtn3.click();
    await createResponse3;

    await expect(page.locator('h2:has-text("Submit Abstract")')).not.toBeVisible();

    // Open details for the third abstract
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const row3 = page.locator('table tbody tr').filter({ hasText: nameText3 }).first();
    await expect(row3).toBeVisible();
    await row3.locator('button[title="Edit"]').click();

    // Transition to Deleted
    const statusSelect3 = page.locator('select').filter({ hasText: 'Under Review' }).first();
    await statusSelect3.selectOption('Deleted');
    const updateStatusBtn3 = page.locator('button:has-text("Update")');
    const updateStatusResponse3 = page.waitForResponse(
      res => res.url().includes('/status') && res.status() === 200
    );
    await updateStatusBtn3.click();
    await updateStatusResponse3;
    await expect(page.locator('text=Status updated to Deleted')).toBeVisible();

    // Close details
    await page.locator('button:has-text("Close")').click();
  });

});
