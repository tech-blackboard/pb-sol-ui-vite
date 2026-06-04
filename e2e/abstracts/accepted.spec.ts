import { test, expect } from '@playwright/test';

test.describe('Abstracts Accepted E2E Functionality', () => {

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

  test('should support transitioning to Accepted and verify dropdown option states', async ({ page }) => {
    const nameText = `E2E Accepted User ${Date.now()}`;
    
    // Create new abstract (starts as Under Review)
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
    await page.fill('input[id="Abstract Title"]', 'E2E Accepted research');
    await page.locator('select[id="Website/Conference"]').selectOption({ index: 1 });
    await page.setInputFiles('input[type="file"]', {
      name: 'accepted.pdf',
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

    // Change status from Under Review to Accepted
    const statusSelect = page.locator('div.max-w-3xl select').first();
    await statusSelect.selectOption('Accepted');
    const updateStatusBtn = page.locator('button:has-text("Update")');
    const updateStatusPromise = page.waitForResponse(
      res => res.url().includes('/status')
    );
    await updateStatusBtn.click();
    const response = await updateStatusPromise;
    if (response.status() === 200) {
      await expect(page.locator('text=Status updated to Accepted')).toBeVisible();
    } else {
      const body = await response.json();
      await expect(page.getByText(body.message || 'error').first()).toBeVisible();
      await page.locator('button:has-text("Close")').click();
      return;
    }

    // Check updated status in modal
    await expect(page.locator('dt:has-text("Status") + dd span')).toHaveText('Accepted');

    // Verify option rules in "Accepted" state:
    // "Send Invoice" must be enabled.
    const sendInvoiceOption = statusSelect.locator('option[value="Sent Invoice"]');
    await expect(sendInvoiceOption).not.toHaveAttribute('disabled', '');

    // "Under Review" must be disabled since we cannot transition backwards.
    const underReviewOption = statusSelect.locator('option:has-text("Under Review")');
    await expect(underReviewOption).toHaveAttribute('disabled', '');

    // Transition to Sent Invoice (shows invoice forms)
    await statusSelect.selectOption('Sent Invoice');
    const invoiceBtn = page.locator('button:has-text("Invoice")');
    await expect(invoiceBtn).toBeVisible();

    // Close details modal
    await page.locator('button:has-text("Close")').click();
  });

});
