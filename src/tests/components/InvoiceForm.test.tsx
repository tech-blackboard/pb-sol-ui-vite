import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { InvoiceForm } from '../../components/InvoiceForm'

describe('InvoiceForm', () => {
  const onClose = jest.fn()
  const onSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderForm = () =>
    render(
      <InvoiceForm
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        abstractName="Test Abstract"
      />
    )

  test('renders invoice modal correctly', () => {
    renderForm()

    expect(screen.getByText('Generate Invoice')).toBeInTheDocument()
    expect(screen.getByText('For: Test Abstract')).toBeInTheDocument()
    expect(screen.getByText(/Interested in/i)).toBeInTheDocument()
  })

  test('shows validation errors when preview clicked without required fields', async () => {
    renderForm()

    fireEvent.click(screen.getByText('Preview Invoice'))

    await waitFor(() => {
      expect(screen.getByText('Please select an option')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Registration fee is required and must be greater than 0'
        )
      ).toBeInTheDocument()
    })
  })

  test('shows validation errors for invalid quantities (mocked boundaries)', async () => {
    renderForm()
    
    const quantityInput = screen.getByLabelText(/Number of participants/i)
    const previewBtn = screen.getByText('Preview Invoice')

    // Test quantity <= 0
    let mathMaxSpy = jest.spyOn(Math, 'max').mockReturnValueOnce(-1)
    fireEvent.change(quantityInput, { target: { value: '-1' } })
    mathMaxSpy.mockRestore()
    
    fireEvent.click(previewBtn)
    expect(await screen.findByText('Number of participants is required and must be at least 1')).toBeInTheDocument()

    // Test non-integer
    mathMaxSpy = jest.spyOn(Math, 'max').mockReturnValueOnce(1.5)
    fireEvent.change(quantityInput, { target: { value: '1.5' } })
    mathMaxSpy.mockRestore()
    
    fireEvent.click(previewBtn)
    expect(await screen.findByText('Number of participants must be a whole number')).toBeInTheDocument()

    // Test > 100
    mathMaxSpy = jest.spyOn(Math, 'max').mockReturnValueOnce(101)
    fireEvent.change(quantityInput, { target: { value: '101' } })
    mathMaxSpy.mockRestore()
    
    fireEvent.click(previewBtn)
    expect(await screen.findByText('Number of participants cannot exceed 100')).toBeInTheDocument()
    
    // Clear error
    fireEvent.change(quantityInput, { target: { value: '1' } })
    expect(screen.queryByText('Number of participants cannot exceed 100')).not.toBeInTheDocument()
  })

  test('shows validation errors for empty accommodation dates', async () => {
    renderForm()
    
    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))
    fireEvent.click(screen.getByText('Preview Invoice'))
    
    expect(await screen.findByText('Check-in date is required')).toBeInTheDocument()
    expect(await screen.findByText('Check-out date is required')).toBeInTheDocument()
  })

  test('updates registration fee when interested option is selected', async () => {
    renderForm()

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'Oral Presenter (In-Person)' },
    })

    const regFeeInput = screen.getByLabelText(/Registration Fee/i)
    fireEvent.change(regFeeInput, { target: { value: '699' } })

    expect(regFeeInput).toHaveValue(699)
  })

  test('accommodation flow calculates nights and fees correctly', async () => {
    renderForm()

    // Interested In
    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'Listener (In-Person)' },
    })

    // Registration Fee
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), {
      target: { value: '799' },
    })

    // Participants
    fireEvent.change(screen.getByLabelText(/Number of participants/i), {
      target: { value: '2' },
    })

    // Enable accommodation
    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))

    // Select occupancy
    fireEvent.click(screen.getByLabelText('Single Occupancy'))

    // Dates
    fireEvent.change(screen.getByLabelText(/Check In/i), {
      target: { value: '2025-01-01' },
    })

    fireEvent.change(screen.getByLabelText(/Check Out/i), {
      target: { value: '2025-01-04' },
    })

    // Nights auto-calculated
    expect(await screen.findByDisplayValue('3')).toBeInTheDocument()

    // Price per night
    fireEvent.change(screen.getByLabelText(/Price per Night/i), {
      target: { value: '100' },
    })

    fireEvent.click(screen.getByText('Preview Invoice'))

    expect(await screen.findByText('Preview Details')).toBeInTheDocument()
    expect(screen.getByText('Single Occupancy')).toBeInTheDocument()
    expect(screen.getByText('$ 100')).toBeInTheDocument()
  })

  test('submits invoice with accommodation and internet handling fee', async () => {
    renderForm()

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'Listener (In-Person)' },
    })

    fireEvent.change(screen.getByLabelText(/Registration Fee/i), {
      target: { value: '799' },
    })

    fireEvent.change(screen.getByLabelText(/Number of participants/i), {
      target: { value: '1' },
    })

    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))
    fireEvent.click(screen.getByLabelText('Single Occupancy'))

    fireEvent.change(screen.getByLabelText(/Check In/i), {
      target: { value: '2025-01-01' },
    })

    fireEvent.change(screen.getByLabelText(/Check Out/i), {
      target: { value: '2025-01-03' },
    })

    fireEvent.change(screen.getByLabelText(/Price per Night/i), {
      target: { value: '200' },
    })

    fireEvent.click(screen.getByText('Preview Invoice'))
    fireEvent.click(await screen.findByText('Send Invoice'))
    fireEvent.click(await screen.findByText('Confirm & Send'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    const submittedData = onSubmit.mock.calls[0][0]

    expect(submittedData.orderItems.length).toBeGreaterThan(1)
    expect(submittedData.invoiceAmount).toBeGreaterThan(0)
    expect(submittedData.internetHandlingFees).toBeDefined()
    expect(submittedData.occupancyType).toBe('Single Occupancy')
    expect(submittedData.numberOfNights).toBe(2)
  })

  test('button shows loading state when isLoading is true', async () => {
    const { rerender } = render(
      <InvoiceForm
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        abstractName="Test Abstract"
      />
    )

    // Fill valid fields
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Listener (In-Person)' } })
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), { target: { value: '799' } })
    fireEvent.change(screen.getByLabelText(/Number of participants/i), { target: { value: '1' } })

    // Open preview
    fireEvent.click(screen.getByText('Preview Invoice'))

    // Rerender with isLoading=true
    rerender(
      <InvoiceForm
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        abstractName="Test Abstract"
        isLoading={true}
      />
    )

    expect(await screen.findByText('Sending...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sending/i })).toBeDisabled()
  })

  test('cancel button resets form and closes modal', () => {
    renderForm()
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  test('resets accommodation fields when checkbox is unchecked', () => {
    renderForm()

    // Enable accommodation
    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))
    fireEvent.click(screen.getByLabelText('Double Occupancy'))
    fireEvent.change(screen.getByLabelText(/Check In/i), { target: { value: '2025-01-01' } })

    // Uncheck
    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))

    // Re-check to verify reset
    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))
    expect(screen.getByLabelText('Single Occupancy')).toBeChecked()
    expect(screen.getByLabelText(/Check In/i)).toHaveValue('')
  })

  test('handles occupancy change and resets fields', () => {
    renderForm()

    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))
    fireEvent.change(screen.getByLabelText(/Check In/i), { target: { value: '2025-01-01' } })

    fireEvent.click(screen.getByLabelText('Triple Occupancy'))
    expect(screen.getByLabelText(/Check In/i)).toHaveValue('')
  })

  test('validation fails for invalid accommodation dates', async () => {
    renderForm()

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Listener (In-Person)' } })
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), { target: { value: '799' } })

    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))
    fireEvent.change(screen.getByLabelText(/Check In/i), { target: { value: '2025-01-05' } })
    fireEvent.change(screen.getByLabelText(/Check Out/i), { target: { value: '2025-01-01' } })

    fireEvent.click(screen.getByText('Preview Invoice'))

    expect(await screen.findByText('Check-out must be after check-in date')).toBeInTheDocument()
  })

  test('clears registration and accommodation fee errors on change', async () => {
    renderForm()
    
    // Check looking for accommodation to trigger those errors too
    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))
    
    // Set invalid inputs directly or hit preview to trigger "must be greater than 0"
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText(/Price per Night/i), { target: { value: '0' } })
    
    fireEvent.click(screen.getByText('Preview Invoice'))
    
    expect(await screen.findByText('Registration fee is required and must be greater than 0')).toBeInTheDocument()
    expect(await screen.findByText('Accommodation fee is required and must be greater than 0')).toBeInTheDocument()
    
    // Now trigger changes
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText(/Price per Night/i), { target: { value: '100' } })
    
    expect(screen.queryByText('Registration fee is required and must be greater than 0')).not.toBeInTheDocument()
    expect(screen.queryByText('Accommodation fee is required and must be greater than 0')).not.toBeInTheDocument()
  })

  test('can close preview modal', async () => {
    renderForm()
    
    // Fill required
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Listener (In-Person)' } })
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), { target: { value: '799' } })
    
    fireEvent.click(screen.getByText('Preview Invoice'))
    expect(await screen.findByText('Preview Details')).toBeInTheDocument()
    
    // The close button has aria-label="Close" and Back to Form has text
    // We can just click the Back to Form button or close icon
    const backBtn = screen.getByText('Back to Form')
    fireEvent.click(backBtn)
    
    expect(screen.queryByText('Preview Details')).not.toBeInTheDocument()
  })

  test('can cancel confirmation modal', async () => {
    renderForm()
    
    // Fill required
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Listener (In-Person)' } })
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), { target: { value: '799' } })
    
    // Open preview
    fireEvent.click(screen.getByText('Preview Invoice'))
    
    // Click Send to open confirmation
    fireEvent.click(await screen.findByText('Send Invoice'))
    
    // Now modal is open
    expect(await screen.findByText('Confirm Invoice Submission')).toBeInTheDocument()
    
    // Cancel confirmation (Cancel button inside confirm modal)
    // The modal has a Cancel and Confirm & Send button
    const confirmCancelBtn = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(confirmCancelBtn)
    
    // Should go back to preview 
    expect(screen.queryByText('Confirm Invoice Submission')).not.toBeInTheDocument()
    // Still in preview
    expect(screen.getByText('Preview Details')).toBeInTheDocument()
  })

  test('validates quantity boundaries (auto-correction)', async () => {
    renderForm()
    
    // Fill required
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Listener (In-Person)' } })
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), { target: { value: '799' } })

    const qtyInput = screen.getByPlaceholderText('Enter number of participants (1-100)')

    // 1. Quantity <= 0 should auto-correct to 1
    fireEvent.change(qtyInput, { target: { value: '0' } })
    expect(qtyInput).toHaveValue(1)

    // 2. Quantity not integer should auto-correct via parseInt
    fireEvent.change(qtyInput, { target: { value: '1.5' } })
    expect(qtyInput).toHaveValue(1)

    // 3. Quantity > 100 should auto-correct to 100
    fireEvent.change(qtyInput, { target: { value: '101' } })
    expect(qtyInput).toHaveValue(100)
  })

  test('shows loading state during confirmation', async () => {
    // Render with isLoading=false first to go through the flow
    const { rerender } = render(<InvoiceForm isOpen={true} onClose={onClose} onSubmit={onSubmit} isLoading={false} />)

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Listener (In-Person)' } })
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), { target: { value: '799' } })
    
    fireEvent.click(screen.getByText('Preview Invoice'))
    
    fireEvent.click(await screen.findByText('Send Invoice'))

    expect(await screen.findByText('Confirm Invoice Submission')).toBeInTheDocument()
    
    // Now trigger loading
    rerender(<InvoiceForm isOpen={true} onClose={onClose} onSubmit={onSubmit} isLoading={true} />)
    
    // Verify the buttons in the main view or preview are disabled if we were there, but the "Sending..." text appears in the confirm button inside the preview modal
    // Actually, in the code, the Preview Footer has "Send Invoice" button which changes to "Sending..."
    // Wait, the "Confirm & Send" button is in the showConfirmModal popup!
    // Let's check the code: showConfirmModal has "Confirm & Send". 
    // Wait, the button in Preview is "Sending..." when isLoading=true.
    // The Preview Footer has a button doing `onClick={handleConfirmClick}`. It shows 'Sending...' and a spinner when isLoading={true}.
    // But 'handleConfirmClick' opens the confirm modal!
    
    const sendingButton = await screen.findByText('Sending...')
    expect(sendingButton).toBeInTheDocument()
    expect(sendingButton).toBeDisabled()
  })
})
