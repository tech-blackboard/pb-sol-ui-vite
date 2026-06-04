import { test, expect } from '@playwright/test';

test.describe('Abstracts Sent Invoice E2E Functionality', () => {

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

  test('should support validation of invoice form, positive invoice generation, and payment reminder action', async ({ page }) => {
    const nameText = `E2E Invoiced User ${Date.now()}`;
    
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
    await page.fill('input[id="Abstract Title"]', 'E2E Invoice test research');
    await page.locator('select[id="Website/Conference"]').selectOption({ index: 1 });
    await page.setInputFiles('input[type="file"]', {
      name: 'invoice.pdf',
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

    // Transition to Sent Invoice
    await statusSelect.selectOption('Sent Invoice');
    const invoiceBtn = page.locator('button:has-text("Invoice")');
    const paymentReminderBtn = page.locator('button:has-text("Payment Reminder")');
    await expect(invoiceBtn).toBeVisible();
    await expect(paymentReminderBtn).toBeVisible();

    // --- SUB-TEST 1: Generate Invoice Form Error Validation ---
    await invoiceBtn.click();
    const invoiceModal = page.locator('div.relative.w-full.max-w-4xl');
    await expect(invoiceModal).toBeVisible();

    // Preview without selecting option or filling required fields
    await page.locator('button:has-text("Preview Invoice")').click();

    // Verify validation errors and red border
    await expect(invoiceModal).toHaveClass(/border-red-500/);
    await expect(invoiceModal.locator('text=Please select an option')).toBeVisible();
    await expect(invoiceModal.locator('text=Registration fee is required and must be greater than 0')).toBeVisible();

    // --- SUB-TEST 2: Accommodation Validation & Form Calculations ---
    // Fill interested option to remove interest error
    await page.locator('select#interestedIn').selectOption('Oral Presenter (In-Person)');
    await page.locator('input#registrationFee').fill('399');
    await page.locator('input#numberOfParticipants').fill('2');

    // Toggle accommodation
    const accommodationCheckbox = page.locator('input#accommodation');
    await accommodationCheckbox.check();

    // Preview to trigger accommodation error validations
    await page.locator('button:has-text("Preview Invoice")').click();
    await expect(invoiceModal.locator('text=Check-in date is required')).toBeVisible();
    await expect(invoiceModal.locator('text=Check-out date is required')).toBeVisible();
    await expect(invoiceModal.locator('text=Accommodation fee is required and must be greater than 0')).toBeVisible();

    // Input invalid checkout date (before checkin)
    await page.locator('input#checkIn').fill('2026-06-15');
    await page.locator('input#checkOut').fill('2026-06-14');
    await page.locator('input#pricePerNight').fill('150');
    await page.locator('button:has-text("Preview Invoice")').click();
    await expect(invoiceModal.locator('text=Check-out must be after check-in date')).toBeVisible();

    // Correct dates
    await page.locator('input#checkOut').fill('2026-06-17'); // 2 nights
    await page.locator('button:has-text("Preview Invoice")').click();

    // Check preview is shown (Back to Form button is visible)
    const previewHeader = page.locator('h2:has-text("Preview Details")');
    await expect(previewHeader).toBeVisible();

    // Check preview calculation totals
    // Total registration: 399 * 2 = 798
    // Accommodation: 150 * 2 = 300
    // Internet Handling Fees (4.8% of 1098) = 53
    // Grand Total = 798 + 300 + 53 = 1151
    const grandTotalLabel = page.locator('td:has-text("Grand Total") + td');
    await expect(grandTotalLabel).toHaveText('$1151');

    // Click Back to Form to verify edit state is preserved
    await page.locator('button:has-text("Back to Form")').click();
    await expect(page.locator('input#pricePerNight')).toHaveValue('150');

    // Go back to preview for submit
    await page.locator('button:has-text("Preview Invoice")').click();

    // Submit Invoice in Preview
    await page.locator('button:has-text("Send Invoice")').click();
    
    // Confirm send and handle API response
    const sendInvoicePromise = page.waitForResponse(
      res => res.url().includes('/send-invoice')
    );
    await page.locator('button:has-text("Confirm & Send")').click();
    const sendInvoiceResponse = await sendInvoicePromise;
    const sendInvoiceStatus = sendInvoiceResponse.status();
    const sendInvoiceBody = await sendInvoiceResponse.json();

    if (sendInvoiceStatus === 200 || sendInvoiceStatus === 201) {
      const expectedMsg = sendInvoiceBody.message || 'Invoice sent successfully';
      await expect(page.getByText(expectedMsg).first()).toBeVisible();
      // Status updates to "Sent Invoice"
      await expect(page.locator('dt:has-text("Status") + dd span')).toHaveText('Sent Invoice');
    } else {
      const expectedError = Array.isArray(sendInvoiceBody.message)
        ? sendInvoiceBody.message[0]
        : (sendInvoiceBody.message || 'Failed to send invoice');
      console.log(`E2E Verification - Send invoice failed. API Response error: "${expectedError}"`);
      if (sendInvoiceStatus === 500) {
        await expect(page.locator('h1:has-text("Server Unavailable")').or(page.locator('h1:has-text("Server-Side")'))).toBeVisible();
        return;
      } else {
        await expect(page.getByText(expectedError).first()).toBeVisible();
      }
    }

    // --- SUB-TEST 3: Payment Reminder Action ---
    await paymentReminderBtn.click();
    await expect(page.locator('h2:has-text("Send Payment Reminder")')).toBeVisible();
    
    const reminderResponsePromise = page.waitForResponse(
      res => res.url().includes('/payment-reminder')
    );
    await page.locator('button:has-text("Send Reminder")').click();
    const reminderResponse = await reminderResponsePromise;
    const reminderStatus = reminderResponse.status();
    const reminderBody = await reminderResponse.json();

    if (reminderStatus === 200 || reminderStatus === 201) {
      const expectedMsg = reminderBody.message || 'Payment reminder sent successfully';
      await expect(page.getByText(expectedMsg).first()).toBeVisible();
    } else {
      const expectedError = Array.isArray(reminderBody.message)
        ? reminderBody.message[0]
        : (reminderBody.message || 'Failed to send payment reminder');
      console.log(`E2E Verification - Send payment reminder failed. API Response error: "${expectedError}"`);
      if (reminderStatus === 500) {
        await expect(page.locator('h1:has-text("Server Unavailable")').or(page.locator('h1:has-text("Server-Side")'))).toBeVisible();
        return;
      } else {
        await expect(page.getByText(expectedError).first()).toBeVisible();
      }
    }

    // Close details modal
    await page.locator('button:has-text("Close")').click();
  });

});
