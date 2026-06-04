import { test, expect } from '@playwright/test';

test.describe('Abstracts Edit Form E2E Functionality', () => {
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

  test('should discard modifications when Cancel is clicked', async ({ page }) => {
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const firstRowEditBtn = page.locator('table tbody tr button[title="Edit"]').first();
    await expect(firstRowEditBtn).toBeVisible();
    await firstRowEditBtn.click();

    // Verify details modal is open
    await expect(page.locator('h2:has-text("Abstract Details")')).toBeVisible();

    // Get original name
    const originalName = await page.locator('dt').filter({ hasText: /^Name$/ }).locator('+ dd').innerText();

    // Click ✎ Edit
    const editBtn = page.locator('button:has-text("✎ Edit")');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Fill some new values
    const nameInput = page.locator('input#name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Temp Cancel Name');

    // Click Cancel
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Verify detail values remain original
    await expect(page.locator('dt').filter({ hasText: /^Name$/ }).locator('+ dd')).toHaveText(originalName);

    // Close details modal
    await page.locator('button:has-text("Close")').click();
    await expect(page.locator('h2:has-text("Abstract Details")')).not.toBeVisible();
  });

  test('should successfully edit all form inputs and save modifications', async ({ page }) => {
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const firstRowEditBtn = page.locator('table tbody tr button[title="Edit"]').first();
    await expect(firstRowEditBtn).toBeVisible();
    await firstRowEditBtn.click();

    // Verify details modal is open
    await expect(page.locator('h2:has-text("Abstract Details")')).toBeVisible();

    // Click ✎ Edit
    const editBtn = page.locator('button:has-text("✎ Edit")');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Edit all text/textarea/select inputs
    const uniqueName = `E2E Editor ${Date.now()}`;
    await page.locator('input#name').fill(uniqueName);
    await page.locator('input#email').fill('merugup.media1@gmail.com');
    await page.locator('input#alternate-email').fill('alt.email@gmail.com');
    await page.locator('input#phone').fill('+1234567890');
    await page.locator('input#whatsapp').fill('+9876543210');
    await page.locator('input#city').fill('San Francisco');
    await page.locator('input#country').fill('United States');
    await page.locator('input#organization').fill('Tech Blackboard Inc');
    await page.locator('input#title').fill('Advanced AI Research in E2E Testing');
    await page.locator('textarea#message').fill('This is a complete mock message for E2E validation.');
    await page.locator('select#interested').selectOption('Oral Presentation(Virtual)');

    // Upload an updated document
    await page.setInputFiles('input#upload-new-file', {
      name: 'updated_presentation.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock updated pdf content')
    });

    // Click Save Changes and wait for response
    const saveBtn = page.locator('button:has-text("Save Changes")');
    const updatePromise = page.waitForResponse(
      res => res.url().includes('/api/abstract/') && res.status() === 200
    );
    await saveBtn.click();
    await updatePromise;

    // Verify success toast
    const successToast = page.locator('text=Abstract updated successfully');
    await expect(successToast).toBeVisible();

    // Verify all detail values are updated in read-only mode using exact matching
    await expect(page.locator('dt').filter({ hasText: /^Name$/ }).locator('+ dd')).toHaveText(uniqueName);
    await expect(page.locator('dt').filter({ hasText: /^Email$/ }).locator('+ dd')).toContainText('merugup.media1@gmail.com');
    await expect(page.locator('dt').filter({ hasText: /^Alternate Email$/ }).locator('+ dd')).toHaveText('alt.email@gmail.com');
    await expect(page.locator('dt').filter({ hasText: /^Phone$/ }).locator('+ dd')).toHaveText('+1234567890');
    await expect(page.locator('dt').filter({ hasText: /^WhatsApp$/ }).locator('+ dd')).toHaveText('+9876543210');
    await expect(page.locator('dt').filter({ hasText: /^City$/ }).locator('+ dd')).toHaveText('San Francisco');
    await expect(page.locator('dt').filter({ hasText: /^Country$/ }).locator('+ dd')).toHaveText('United States');
    await expect(page.locator('dt').filter({ hasText: /^Organization$/ }).locator('+ dd')).toHaveText('Tech Blackboard Inc');
    await expect(page.locator('dt').filter({ hasText: /^Title$/ }).locator('+ dd')).toHaveText('Advanced AI Research in E2E Testing');
    await expect(page.locator('dt').filter({ hasText: /^Message$/ }).locator('+ dd')).toHaveText('This is a complete mock message for E2E validation.');
    await expect(page.locator('dt').filter({ hasText: /^Interested$/ }).locator('+ dd')).toHaveText('Oral Presentation(Virtual)');

    // Close details modal
    await page.locator('button:has-text("Close")').click();
    await expect(page.locator('h2:has-text("Abstract Details")')).not.toBeVisible();
  });

  test('should successfully edit a single field and save it while preserving other fields', async ({ page }) => {
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const firstRowEditBtn = page.locator('table tbody tr button[title="Edit"]').first();
    await expect(firstRowEditBtn).toBeVisible();
    await firstRowEditBtn.click();

    // Verify details modal is open
    await expect(page.locator('h2:has-text("Abstract Details")')).toBeVisible();

    // Get original details that we won't edit
    const originalEmail = await page.locator('dt').filter({ hasText: /^Email$/ }).locator('+ dd').innerText();
    const originalCity = await page.locator('dt').filter({ hasText: /^City$/ }).locator('+ dd').innerText();

    // Click ✎ Edit
    const editBtn = page.locator('button:has-text("✎ Edit")');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Edit only name field
    const uniqueName = `E2E Single Edit ${Date.now()}`;
    await page.locator('input#name').fill(uniqueName);

    // Click Save Changes and wait for response
    const saveBtn = page.locator('button:has-text("Save Changes")');
    const updatePromise = page.waitForResponse(
      res => res.url().includes('/api/abstract/') && res.status() === 200
    );
    await saveBtn.click();
    await updatePromise;

    // Verify success toast
    const successToast = page.locator('text=Abstract updated successfully');
    await expect(successToast).toBeVisible();

    // Verify name updated, but other fields preserved
    await expect(page.locator('dt').filter({ hasText: /^Name$/ }).locator('+ dd')).toHaveText(uniqueName);
    await expect(page.locator('dt').filter({ hasText: /^Email$/ }).locator('+ dd')).toHaveText(originalEmail);
    await expect(page.locator('dt').filter({ hasText: /^City$/ }).locator('+ dd')).toHaveText(originalCity);

    // Close details modal
    await page.locator('button:has-text("Close")').click();
    await expect(page.locator('h2:has-text("Abstract Details")')).not.toBeVisible();
  });

  test('should handle API validation failure (400 error) during update and display error toast', async ({ page }) => {
    // Intercept PUT /api/abstract/:id and mock a 400 validation error
    await page.route('**/api/abstract/*', async (route, request) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Validation edit failure' }),
        });
      } else {
        await route.continue();
      }
    });

    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const firstRowEditBtn = page.locator('table tbody tr button[title="Edit"]').first();
    await expect(firstRowEditBtn).toBeVisible();
    await firstRowEditBtn.click();

    // Verify details modal is open
    await expect(page.locator('h2:has-text("Abstract Details")')).toBeVisible();

    // Click ✎ Edit
    const editBtn = page.locator('button:has-text("✎ Edit")');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Change field
    await page.locator('input#name').fill('QA Error Target');

    // Click Save Changes
    const saveBtn = page.locator('button:has-text("Save Changes")');
    await saveBtn.click({ force: true });

    // Verify error toast displays validation edit failure message
    const errorToast = page.locator('text=Validation edit failure');
    await expect(errorToast).toBeVisible();

    // Verify edit mode is still active and detail modal stays open
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('h2:has-text("Abstract Details")')).toBeVisible();

    // Clean up: click cancel and close modal
    await page.locator('button:has-text("Cancel")').click();
    await page.locator('button:has-text("Close")').click();
  });

  test('should redirect to Server Issue page on 500 Internal Server Error during update', async ({ page }) => {
    // Intercept PUT /api/abstract/:id and mock a 500 server error
    await page.route('**/api/abstract/*', async (route, request) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const firstRowEditBtn = page.locator('table tbody tr button[title="Edit"]').first();
    await expect(firstRowEditBtn).toBeVisible();
    await firstRowEditBtn.click();

    // Click ✎ Edit
    const editBtn = page.locator('button:has-text("✎ Edit")');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Change field
    await page.locator('input#name').fill('QA Server Error Target');

    // Click Save Changes
    const saveBtn = page.locator('button:has-text("Save Changes")');
    await saveBtn.click({ force: true });

    // Verify Server Unavailable (Server-Side) page displays
    await expect(page.locator('text=Server-Side')).toBeVisible({ timeout: 15000 });
  });

  test('should redirect to Server Unavailable page on network connection drop during update', async ({ page }) => {
    // Intercept PUT /api/abstract/:id and mock network drop
    await page.route('**/api/abstract/*', async (route, request) => {
      if (route.request().method() === 'PUT') {
        await route.abort('connectionrefused');
      } else {
        await route.continue();
      }
    });

    await expect(page.locator('text=Loading...')).not.toBeVisible();
    const firstRowEditBtn = page.locator('table tbody tr button[title="Edit"]').first();
    await expect(firstRowEditBtn).toBeVisible();
    await firstRowEditBtn.click();

    // Click ✎ Edit
    const editBtn = page.locator('button:has-text("✎ Edit")');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Change field
    await page.locator('input#name').fill('QA Network Drop Target');

    // Click Save Changes
    const saveBtn = page.locator('button:has-text("Save Changes")');
    await saveBtn.click({ force: true });

    // Verify Server Unavailable (No Internet Connection) page displays
    await expect(page.locator('text=No Internet Connection')).toBeVisible({ timeout: 15000 });
  });

});

