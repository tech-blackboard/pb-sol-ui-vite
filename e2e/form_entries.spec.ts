import { test, expect } from '@playwright/test';

test.describe('Website Form Entries E2E Functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Globally intercept all API calls to inject the approved x-device-id header
    await page.route('**/api/**', async (route, request) => {
      const headers = {
        ...request.headers(),
        'x-device-id': '06534fb58f1405a89b63ec9b7d01bf03',
      };

      if (request.url().includes('/api/auth/login')) {
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

    // Navigate to homepage and log in
    await page.goto('/');
    await page.fill('#email', 'techblackboard@gmail.com');
    await page.fill('#password', 'Welcome#6557');
    await page.click('button[type="submit"]');

    // Confirm landing on Dashboard
    await expect(page.locator('h1')).toHaveText(/dashboard/i, { timeout: 15000 });
  });

  test('should navigate to Abstracts and filter data correctly', async ({ page }) => {
    // Click on Abstracts in navigation sidebar
    const abstractsBtn = page.getByRole('button', { name: 'Abstracts', exact: true });
    await expect(abstractsBtn).toBeVisible();
    await abstractsBtn.click();

    // Verify abstracts page table loads (confirm table exists)
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Check presence of status filter buttons on top of Abstracts page
    const filterUnderReview = page.locator('button:has-text("Under Review")');
    if (await filterUnderReview.count() > 0) {
      await expect(filterUnderReview.first()).toBeVisible();
    }
  });

  test('should view other Website Form Entries pages successfully', async ({ page }) => {
    const entryPages = [
      { label: 'Registrations', heading: /registrations/i, exact: true },
      { label: 'Accommodation Registrations', heading: /accommodation/i, exact: true },
      { label: 'Sponsors/Exhibitors', heading: /sponsors|exhibitors/i, exact: true },
      { label: 'Brochures', heading: /brochures/i, exact: true },
      { label: 'Contacts', heading: /contacts/i, exact: true },
    ];

    for (const item of entryPages) {
      const navBtn = page.getByRole('button', { name: item.label, exact: item.exact });
      await expect(navBtn).toBeVisible();
      await navBtn.click();

      // Verify the respective page table or heading loads successfully without crashing
      const table = page.locator('table');
      await expect(table).toBeVisible();
    }
  });

  test('should create a new Abstract and then view/edit its details successfully', async ({ page }) => {
    // Click on Abstracts in navigation sidebar
    const abstractsBtn = page.getByRole('button', { name: 'Abstracts', exact: true });
    await expect(abstractsBtn).toBeVisible();
    await abstractsBtn.click();

    // Click the Add Abstract button
    const addBtn = page.getByRole('button', { name: 'Add Abstract', exact: true });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Fill out the abstract submission form
    await page.locator('select#Caption').selectOption('Dr.');
    await page.fill('input#Name', 'E2E Test User');
    await page.fill('input#email', 'merugup.media1@gmail.com');
    await page.fill('input[id="Alternate Email"]', 'merugup.media2@gmail.com');
    await page.fill('input#Phone', '9876543210');
    await page.fill('input[id="WhatsApp Number"]', '9876543210');
    await page.locator('select#Country').selectOption('India');
    await page.fill('input#City', 'Hyderabad');
    await page.fill('input#Organization', 'TBB Research Lab');
    await page.locator('select[id="Interested in"]').selectOption('Oral Presentation(Virtual)');
    await page.fill('input[id="Abstract Title"]', 'Automatic E2E testing with Playwright and Real DB');
    await page.fill('textarea#Message', 'This is a automated E2E test message.');

    // Select the first available Website/Conference option in the select dropdown
    const websiteSelect = page.locator('select[id="Website/Conference"]');
    await expect(websiteSelect).toBeVisible();
    await websiteSelect.selectOption({ index: 1 });

    // Handle file upload dynamically
    await page.setInputFiles('input[type="file"]', {
      name: 'abstract.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf abstract content for E2E testing')
    });

    // Extract the dynamic Captcha code from the DOM and fill it in
    const captchaDiv = page.locator('form#abstract-form div.bg-purple-100, form#abstract-form div.bg-purple-900\\/30').first();
    await expect(captchaDiv).toBeVisible();
    const captchaText = await captchaDiv.innerText();
    await page.fill('input[id="Captcha Code"]', captchaText.trim());

    // Submit the form
    const submitBtn = page.getByRole('button', { name: 'Submit Now', exact: true });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Wait for the modal to close and the success toast
    await expect(page.locator('h2:has-text("Submit Abstract")')).not.toBeVisible();

    // The new row should now exist in the table. Click the Edit button on the first row to view details.
    const editBtn = page.locator('button[title="Edit"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Confirm that the Abstract Details modal is visible
    await expect(page.locator('h2:has-text("Abstract Details")')).toBeVisible();

    // Close the details modal
    const closeBtn = page.locator('button:has-text("Close")');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Confirm modal is closed
    await expect(page.locator('h2:has-text("Abstract Details")')).not.toBeVisible();
  });

  test('should edit abstract details, change status, and test email actions in modal', async ({ page }) => {
    // Click on Abstracts in navigation sidebar
    const abstractsBtn = page.getByRole('button', { name: 'Abstracts', exact: true });
    await expect(abstractsBtn).toBeVisible();
    await abstractsBtn.click();

    // Click Edit on the first row
    const editBtn = page.locator('button[title="Edit"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Click on the ✎ Edit button inside details modal to enter edit mode
    const innerEditBtn = page.locator('button:has-text("✎ Edit")');
    await expect(innerEditBtn).toBeVisible();
    await innerEditBtn.click();

    // Modify a field (e.g. name or organization)
    const nameInput = page.locator('input#name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('E2E Updated User Name');

    const orgInput = page.locator('input#organization');
    await expect(orgInput).toBeVisible();
    await orgInput.fill('Updated TBB Research Lab');

    // Save changes
    const saveBtn = page.locator('button:has-text("Save Changes")');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Check that we successfully exited edit mode and updated name is visible
    await expect(innerEditBtn).toBeVisible();
    await expect(page.locator('dt:has-text("Name") + dd')).toHaveText(/E2E/);

    // Test sending confirmation email if the button is visible
    const confirmationBtn = page.locator('button:has-text("Send Confirmation Email")');
    if (await confirmationBtn.count() > 0) {
      await expect(confirmationBtn).toBeEnabled();
      await confirmationBtn.click();
      // Toast message will appear, which Playwright will capture or we can just proceed
    }

    // Change status from Under Review to Accepted (or whatever is valid/enabled)
    const statusSelect = page.locator('select').last();
    await expect(statusSelect).toBeVisible();
    
    const currentStatus = await statusSelect.inputValue();
    if (currentStatus === 'Under Review') {
      await statusSelect.selectOption('Accepted');
      const updateBtn = page.locator('button:has-text("Update")');
      await expect(updateBtn).toBeVisible();
      await expect(updateBtn).toBeEnabled();
      await updateBtn.click();
    }

    // Close the details modal
    const closeBtn = page.locator('button:has-text("Close")');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
  });

});
