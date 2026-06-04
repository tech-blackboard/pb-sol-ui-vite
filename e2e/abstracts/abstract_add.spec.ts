import { test, expect } from '@playwright/test';

test.describe('Abstracts Add Form E2E Functionality', () => {
  test.describe.configure({ mode: 'serial' });

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

  test('should open and close the Add Abstract modal successfully', async ({ page }) => {
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const addBtn = page.getByRole('button', { name: 'Add Abstract', exact: true });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Verify modal is open
    const modalHeading = page.locator('h2:has-text("Submit Abstract")');
    await expect(modalHeading).toBeVisible();

    // Close via close "✕" button
    const closeIcon = page.locator('button[aria-label="Close"]');
    await expect(closeIcon).toBeVisible();
    await closeIcon.click();
    await expect(modalHeading).not.toBeVisible();

    // Open again
    await addBtn.click();
    await expect(modalHeading).toBeVisible();

    // Close via "Cancel" button
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

  test('should validate required fields, email format, and incorrect captcha code', async ({ page }) => {
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const addBtn = page.getByRole('button', { name: 'Add Abstract', exact: true });
    await addBtn.click();

    // Disable HTML5 form validation dynamically in the DOM right at the start
    await page.locator('form#abstract-form').evaluate(form => form.setAttribute('novalidate', 'true'));

    const submitBtn = page.getByRole('button', { name: 'Submit Now', exact: true });
    await expect(submitBtn).toBeVisible();

    // 1. Submit empty form to trigger validations
    await submitBtn.dispatchEvent('click');
 
    // Verify error toast
    const errorToast = page.locator('text=Please fix all errors before submitting');
    await expect(errorToast).toBeVisible();
 
    // Verify validations in fields
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Phone is required')).toBeVisible();
    await expect(page.locator('text=Country is required')).toBeVisible();
    await expect(page.locator('text=City is required')).toBeVisible();
    await expect(page.locator('text=Organization is required')).toBeVisible();
    await expect(page.locator('text=Please select an option')).toBeVisible();
    await expect(page.locator('text=Abstract title is required')).toBeVisible();
    await expect(page.locator('text=Please select a website')).toBeVisible();
    await expect(page.locator('text=Please upload a file')).toBeVisible();
 
    // 2. Validate email format
    await page.fill('form#abstract-form input#email', 'invalid-email');
    // Clicking submit again to trigger format checks
    await submitBtn.dispatchEvent('click');
    await expect(page.locator('text=Invalid email format')).toBeVisible();
 
    // 3. Validate incorrect captcha
    await page.locator('select#Caption').selectOption('Prof.');
    await page.fill('input#Name', 'Captcha Tester');
    await page.fill('form#abstract-form input#email', 'test@example.com');
    await page.fill('input#Phone', '+123456789');
    await page.locator('select#Country').selectOption('Germany');
    await page.fill('input#City', 'Berlin');
    await page.fill('input#Organization', 'QA Labs');
    await page.locator('select[id="Interested in"]').selectOption('Oral Presentation(In-Person)');
    await page.fill('input[id="Abstract Title"]', 'Captcha Abstract');
    const websiteSelect = page.locator('select[id="Website/Conference"]');
    await websiteSelect.selectOption({ index: 1 });
    await page.setInputFiles('input[type="file"]', {
      name: 'author_abstract.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock raw abstract data')
    });
    await page.fill('input[placeholder="Enter captcha"]', 'WRONG1');
    await submitBtn.dispatchEvent('click');
 
    // Verify captcha does not match alert
    const captchaErrorText = page.locator('text=Captcha does not match');
    await expect(captchaErrorText).toBeVisible({ timeout: 10000 });
 
    // Clean up: Close modal
    await page.locator('button:has-text("Cancel")').click();
  });

  test('should successfully submit the form with all fields completed correctly', async ({ page }) => {
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const addBtn = page.getByRole('button', { name: 'Add Abstract', exact: true });
    await addBtn.click();

    const uniqueName = `E2E Add ${Date.now()}`;

    // Fill form fields
    await page.locator('select#Caption').selectOption('Prof.');
    await page.fill('input#Name', uniqueName);
    await page.fill('form#abstract-form input#email', 'new.author@gmail.com');
    await page.fill('input[id="Alternate Email"]', 'alt.author@gmail.com');
    await page.fill('input#Phone', '+9876543210');
    await page.fill('input[id="WhatsApp Number"]', '+9876543210');
    await page.locator('select#Country').selectOption('Germany');
    await page.fill('input#City', 'Berlin');
    await page.fill('input#Organization', 'University of Berlin');
    await page.locator('select[id="Interested in"]').selectOption('Oral Presentation(In-Person)');
    await page.fill('input[id="Abstract Title"]', 'Automated E2E Insertion Testing');
    await page.fill('textarea#Message', 'This is a message about automated testing of abstract creation.');

    // Select Website/Conference
    const websiteSelect = page.locator('select[id="Website/Conference"]');
    await websiteSelect.selectOption({ index: 1 });

    // File Upload
    await page.setInputFiles('input[type="file"]', {
      name: 'author_abstract.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock raw abstract insertion data')
    });

    // Extract captcha code dynamically
    const captchaDiv = page.locator('form#abstract-form div.bg-purple-100, form#abstract-form div.bg-purple-900\\/30').first();
    const captchaVal = await captchaDiv.innerText();
    await page.fill('input[placeholder="Enter captcha"]', captchaVal.trim());
 
    // Submit and verify API response + toast
    const submitBtn = page.getByRole('button', { name: 'Submit Now', exact: true });
    const createPromise = page.waitForResponse(
      res => res.url().includes('/api/abstract') && res.status() === 201
    );
    await submitBtn.click();
    await createPromise;

    // Verify success toast & modal close
    const successToast = page.locator('text=Abstract submitted successfully!');
    await expect(successToast).toBeVisible();
    await expect(page.locator('h2:has-text("Submit Abstract")')).not.toBeVisible();

    // Verify new row is visible in list table
    await expect(page.locator('table tbody tr').filter({ hasText: uniqueName }).first()).toBeVisible();
  });

  test('should handle API 400 validation failure during abstract submission', async ({ page }) => {
    // Intercept POST /api/abstract and mock a 400 validation error
    await page.route('**/api/abstract', async (route, request) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Database write failure' }),
        });
      } else {
        await route.continue();
      }
    });

    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const addBtn = page.getByRole('button', { name: 'Add Abstract', exact: true });
    await addBtn.click();

    // Fill form fields
    await page.locator('select#Caption').selectOption('Prof.');
    await page.fill('input#Name', 'QA Error User');
    await page.fill('form#abstract-form input#email', 'error.user@gmail.com');
    await page.fill('input#Phone', '+9876543210');
    await page.locator('select#Country').selectOption('Germany');
    await page.fill('input#City', 'Berlin');
    await page.fill('input#Organization', 'University of Berlin');
    await page.locator('select[id="Interested in"]').selectOption('Oral Presentation(In-Person)');
    await page.fill('input[id="Abstract Title"]', 'API Error Testing');

    const websiteSelect = page.locator('select[id="Website/Conference"]');
    await websiteSelect.selectOption({ index: 1 });

    await page.setInputFiles('input[type="file"]', {
      name: 'author_abstract.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock raw abstract data')
    });

    const captchaDiv = page.locator('form#abstract-form div.bg-purple-100, form#abstract-form div.bg-purple-900\\/30').first();
    const captchaVal = await captchaDiv.innerText();
    await page.fill('input[placeholder="Enter captcha"]', captchaVal.trim());
 
    // Submit
    const submitBtn = page.getByRole('button', { name: 'Submit Now', exact: true });
    await submitBtn.click();

    // Verify error banner contains error message
    await expect(page.locator('text=Database write failure').first()).toBeVisible();

    // Verify modal stays open
    await expect(page.locator('h2:has-text("Submit Abstract")')).toBeVisible();

    // Clean up: Close modal
    await page.locator('button:has-text("Cancel")').click();
  });

  test('should redirect to Server Unavailable page on network connection drop', async ({ page }) => {
    // Intercept POST /api/abstract and mock a connection failure (e.g. refused connection)
    await page.route('**/api/abstract', async (route, request) => {
      if (route.request().method() === 'POST') {
        await route.abort('connectionrefused');
      } else {
        await route.continue();
      }
    });

    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const addBtn = page.getByRole('button', { name: 'Add Abstract', exact: true });
    await addBtn.click();

    // Fill form fields
    await page.locator('select#Caption').selectOption('Prof.');
    await page.fill('input#Name', 'QA Network User');
    await page.fill('form#abstract-form input#email', 'network.user@gmail.com');
    await page.fill('input#Phone', '+9876543210');
    await page.locator('select#Country').selectOption('Germany');
    await page.fill('input#City', 'Berlin');
    await page.fill('input#Organization', 'University of Berlin');
    await page.locator('select[id="Interested in"]').selectOption('Oral Presentation(In-Person)');
    await page.fill('input[id="Abstract Title"]', 'Network Failure Testing');

    const websiteSelect = page.locator('select[id="Website/Conference"]');
    await websiteSelect.selectOption({ index: 1 });

    await page.setInputFiles('input[type="file"]', {
      name: 'author_abstract.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock raw abstract data')
    });

    const captchaDiv = page.locator('form#abstract-form div.bg-purple-100, form#abstract-form div.bg-purple-900\\/30').first();
    const captchaVal = await captchaDiv.innerText();
    await page.fill('input[placeholder="Enter captcha"]', captchaVal.trim());
 
    // Submit
    const submitBtn = page.getByRole('button', { name: 'Submit Now', exact: true });
    await submitBtn.click();

    // Verify global Server Unavailable full-page warning displays
    await expect(page.locator('h1')).toHaveText(/No Internet Connection|Server Unavailable/i, { timeout: 15000 });
  });

});
