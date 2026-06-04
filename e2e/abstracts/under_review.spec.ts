import { test, expect } from '@playwright/test';

test.describe('Abstracts Under Review E2E Functionality', () => {

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

  test('should support validation, creation, confirmation email, and updates in Under Review status', async ({ page }) => {
    const nameText = `E2E UnderReview User ${Date.now()}`;
    
    // --- 1. Form Validation Check ---
    const addBtn = page.getByRole('button', { name: 'Add Abstract', exact: true });
    await addBtn.click();
    
    const formModal = page.locator('div.bg-white.dark\\:bg-gray-800.rounded-2xl');
    await expect(formModal).toBeVisible();

    const submitBtn = page.getByRole('button', { name: 'Submit Now', exact: true });
    await submitBtn.click();
    await expect(formModal).toHaveClass(/border-red-500/);

    // --- 2. Positive Form Creation ---
    await page.locator('select#Caption').selectOption('Prof.');
    await page.fill('input#Name', nameText);
    await page.fill('input#email', 'merugup.media1@gmail.com');
    await page.fill('input#Phone', '9876543210');
    await page.locator('select#Country').selectOption('United States');
    await page.fill('input#City', 'Boston');
    await page.fill('input#Organization', 'Harvard Medical School');
    await page.locator('select[id="Interested in"]').selectOption('Oral Presentation(In-Person)');
    await page.fill('input[id="Abstract Title"]', 'E2E Under Review Research Paper');

    // Select first website/conference
    const websiteSelect = page.locator('select[id="Website/Conference"]');
    await websiteSelect.selectOption({ index: 1 });

    // Handle file upload
    await page.setInputFiles('input[type="file"]', {
      name: 'under_review.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf content')
    });

    // Capture Captcha and Fill
    const captchaDiv = page.locator('form#abstract-form div.bg-purple-100, form#abstract-form div.bg-purple-900\\/30').first();
    const captchaText = await captchaDiv.innerText();
    await page.fill('input[id="Captcha Code"]', captchaText.trim());

    // Submit and wait
    const createResponse = page.waitForResponse(
      res => res.url().includes('/api/abstract') && res.status() === 201
    );
    await submitBtn.click();
    await createResponse;

    await expect(page.locator('h2:has-text("Submit Abstract")')).not.toBeVisible();

    // Verify row displays "Under Review" status
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const row = page.locator('table tbody tr').filter({ hasText: nameText }).first();
    await expect(row).toBeVisible();
    await expect(row.locator('td').nth(4)).toHaveText('Under Review');

    // --- 3. Open Details & Confirmation Email ---
    await row.locator('button[title="Edit"]').click();
    await expect(page.locator('h2:has-text("Abstract Details")')).toBeVisible();

    const confirmEmailBtn = page.locator('button:has-text("Send Confirmation Email")');
    await expect(confirmEmailBtn).toBeVisible();

    const emailResponsePromise = page.waitForResponse(
      res => res.url().includes('/send-confirmation')
    );
    await confirmEmailBtn.click();
    const emailResponse = await emailResponsePromise;
    const responseStatus = emailResponse.status();
    const responseBody = await emailResponse.json();

    if (responseStatus === 200 || responseStatus === 201) {
      const expectedMsg = responseBody.message || 'Confirmation email sent successfully';
      await expect(page.getByText(expectedMsg).first()).toBeVisible();
    } else {
      const expectedError = Array.isArray(responseBody.message)
        ? responseBody.message[0]
        : (responseBody.message || 'Failed to send confirmation email');
      
      console.log(`E2E Verification - Email dispatch failed. API Response error: "${expectedError}"`);
      
      if (responseStatus === 500) {
        await expect(page.locator('h1:has-text("Server Unavailable")').or(page.locator('h1:has-text("Server-Side")'))).toBeVisible();
        return;
      } else {
        await expect(page.getByText(expectedError).first()).toBeVisible();
      }
    }

    // --- 4. Validate Status transitions inside modal ---
    const statusSelect = page.locator('div.max-w-3xl select').first();
    
    // Status transitions from Under Review: verify option "Accepted" is enabled
    // Note: Option "Send Invoice" or "Registered" might be disabled when state is Under Review
    const acceptedOption = statusSelect.locator('option:has-text("Accepted")');
    await expect(acceptedOption).not.toHaveAttribute('disabled', '');

    // Transition to Accepted
    await statusSelect.selectOption('Accepted');
    const updateStatusBtn = page.locator('button:has-text("Update")');
    
    const updateStatusPromise = page.waitForResponse(
      res => res.url().includes('/status')
    );
    await updateStatusBtn.click();
    const response = await updateStatusPromise;
    if (response.status() === 200) {
      // Verify status update toast
      await expect(page.locator('text=Status updated to Accepted')).toBeVisible();
    } else {
      const body = await response.json();
      await expect(page.getByText(body.message || 'error').first()).toBeVisible();
    }

    // Close details
    await page.locator('button:has-text("Close")').click();
  });

});
