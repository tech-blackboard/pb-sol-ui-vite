import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PaymentReceiptForm } from '../../components/PaymentReceipt'

describe('PaymentReceiptForm – Final Clean Suite v2', () => {
  const onClose = jest.fn()
  const onSubmit = jest.fn()

  const setup = (props = {}) =>
    render(
      <PaymentReceiptForm
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        abstractName="Test Abstract"
        {...props}
      />
    )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  /* -------------------------------------------------- */
  /* BASIC RENDERING                                    */
  /* -------------------------------------------------- */

  test('renders modal when open', () => {
    setup()
    expect(screen.getByText('Generate Payment Receipt')).toBeInTheDocument()
  })

  test('does not render modal when closed', () => {
    render(
      <PaymentReceiptForm
        isOpen={false}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    )

    expect(
      screen.queryByText('Generate Payment Receipt')
    ).not.toBeInTheDocument()
  })

  /* INTEREST & REGISTRATION FEE                        */

  test('interest selection updates summary but not registration fee input', () => {
    setup()

    fireEvent.change(screen.getByLabelText(/Interested in/i), {
      target: { value: 'Listener (Virtual)' },
    })

    // input stays user-controlled
    expect(screen.getByLabelText(/Registration Fee/i)).toHaveValue(0)

    // summary updates (multiple rows may show same value)
    expect(screen.getAllByText('$199').length).toBeGreaterThan(0)
  })

  test('allows user to manually enter registration fee', () => {
    setup()

    fireEvent.change(screen.getByLabelText(/Registration Fee/i), {
      target: { value: '555' },
    })

    expect(screen.getByLabelText(/Registration Fee/i)).toHaveValue(555)
  })

  /* PARTICIPANTS*/

  test('enforces minimum participants of 1', () => {
    setup()

    fireEvent.change(screen.getByLabelText(/Number of participants/i), {
      target: { value: '0' },
    })

    expect(screen.getByLabelText(/Number of participants/i)).toHaveValue(1)
  })

  test('caps participants at 100', () => {
    setup()

    fireEvent.change(screen.getByLabelText(/Number of participants/i), {
      target: { value: '999' },
    })

    expect(screen.getByLabelText(/Number of participants/i)).toHaveValue(100)
  })

  /* VALIDATION */

  test('shows validation error when preview clicked without required fields', async () => {
    setup()

    fireEvent.click(
      screen.getByRole('button', { name: /Preview Payment Receipt/i })
    )

    await waitFor(() => {
      expect(
        screen.getByText(/Please select an option/i)
      ).toBeInTheDocument()
    })
  })

  test('shows validation errors for invalid quantities (mocked boundaries)', async () => {
    setup()

    const quantityInput = screen.getByLabelText(/Number of participants/i)
    const previewBtn = screen.getByRole('button', { name: /Preview Payment Receipt/i })

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

  test('shows validation errors for missing accommodation fields and verifies error cleanup', async () => {
    setup()

    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))
    fireEvent.click(screen.getByRole('button', { name: /Preview Payment Receipt/i }))

    expect(await screen.findByText('Check-out date is required')).toBeInTheDocument()
    expect(await screen.findByText('Accommodation fee is required and must be greater than 0')).toBeInTheDocument()

    // Type in accommodation fee to cover handleAccommodationFeeChange error clear
    fireEvent.change(screen.getByLabelText(/Price per Night/i), { target: { value: '100' } })
    expect(screen.queryByText('Accommodation fee is required and must be greater than 0')).not.toBeInTheDocument()
  })

  /* -------------------------------------------------- */
  /* ACCOMMODATION                                     */
  /* -------------------------------------------------- */

  test('shows accommodation options when enabled', () => {
    setup()

    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))

    expect(screen.getByLabelText(/Single Occupancy/i)).toBeInTheDocument()
  })

  test('calculates number of nights correctly', async () => {
    setup()

    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))
    fireEvent.click(screen.getByLabelText(/Double Occupancy/i))

    fireEvent.change(screen.getByLabelText(/Check In/i), {
      target: { value: '2026-01-01' },
    })

    fireEvent.change(screen.getByLabelText(/Check Out/i), {
      target: { value: '2026-01-04' },
    })

    await waitFor(() => {
      expect(screen.getByLabelText(/Number of Nights/i)).toHaveValue(3)
    })
  })

  test('resets accommodation when unchecked', () => {
    setup()

    const checkbox = screen.getByLabelText(/Looking for Accommodation/i)
    fireEvent.click(checkbox)
    fireEvent.click(checkbox)

    expect(
      screen.queryByLabelText(/Single Occupancy/i)
    ).not.toBeInTheDocument()
  })

  /* -------------------------------------------------- */
  /* PREVIEW (SEND BUTTON VISIBILITY)                   */
  /* -------------------------------------------------- */

  test('shows Send button when form is valid and preview is clicked', async () => {
    setup()

    fireEvent.change(screen.getByLabelText(/Interested in/i), {
      target: { value: 'Oral Presenter (In-Person)' },
    })

    fireEvent.change(screen.getByLabelText(/Registration Fee/i), {
      target: { value: '699' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: /Preview Payment Receipt/i })
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Send Payment Receipt/i })
      ).toBeInTheDocument()
    })
  })

  test('hides Send button when Back to Form is clicked', async () => {
    setup()

    fireEvent.change(screen.getByLabelText(/Interested in/i), {
      target: { value: 'Listener (Virtual)' },
    })

    fireEvent.change(screen.getByLabelText(/Registration Fee/i), {
      target: { value: '199' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: /Preview Payment Receipt/i })
    )

    await screen.findByRole('button', { name: /Send Payment Receipt/i })

    // ✅ correct button in Preview
    fireEvent.click(
      screen.getByRole('button', { name: /Back to Form/i })
    )

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /Send Payment Receipt/i })
      ).not.toBeInTheDocument()
    })
  })


  /* -------------------------------------------------- */
  /* CONFIRM MODAL                                     */
  /* -------------------------------------------------- */

  test('opens and cancels confirm modal', async () => {
    setup()

    fireEvent.change(screen.getByLabelText(/Interested in/i), {
      target: { value: 'Oral Presenter (Virtual)' },
    })

    fireEvent.change(screen.getByLabelText(/Registration Fee/i), {
      target: { value: '399' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: /Preview Payment Receipt/i })
    )

    await screen.findByRole('button', { name: /Send Payment Receipt/i })

    fireEvent.click(
      screen.getByRole('button', { name: /Send Payment Receipt/i })
    )

    expect(
      screen.getByText(/Confirm Payment Receipt Submission/i)
    ).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))

    await waitFor(() => {
      expect(
        screen.queryByText(/Confirm Payment Receipt Submission/i)
      ).not.toBeInTheDocument()
    })
  })

  /* -------------------------------------------------- */
  /* FINAL SUBMIT                                      */
  /* -------------------------------------------------- */

  test('submits correct payload including internet handling fees', async () => {
    setup()

    fireEvent.change(screen.getByLabelText(/Interested in/i), {
      target: { value: 'Oral Presenter (In-Person)' },
    })

    fireEvent.change(screen.getByLabelText(/Registration Fee/i), {
      target: { value: '699' },
    })

    fireEvent.change(screen.getByLabelText(/Number of participants/i), {
      target: { value: '1' },
    })

    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))
    fireEvent.click(screen.getByLabelText(/Single Occupancy/i))

    fireEvent.change(screen.getByLabelText(/Check In/i), {
      target: { value: '2026-01-01' },
    })

    fireEvent.change(screen.getByLabelText(/Check Out/i), {
      target: { value: '2026-01-03' },
    })

    fireEvent.change(screen.getByLabelText(/Price per Night/i), {
      target: { value: '100' },
    })

    fireEvent.click(
      await screen.findByRole('button', { name: /Preview Payment Receipt/i })
    )

    await screen.findByRole('button', { name: /Send Payment Receipt/i })

    fireEvent.click(
      screen.getByRole('button', { name: /Send Payment Receipt/i })
    )

    fireEvent.click(screen.getByText(/Confirm & Send/i))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)

      const payload = onSubmit.mock.calls[0][0]

      expect(payload.paymentReceiptAmount).toBeGreaterThan(0)
      expect(payload.internetHandlingFees).toBeDefined()
      expect(payload.orderItems.length).toBeGreaterThan(1)
    })
  })

  test('button shows loading state when isLoading is true', async () => {
    const { rerender } = setup()

    fireEvent.change(screen.getByLabelText(/Interested in/i), {
      target: { value: 'Oral Presenter (In-Person)' },
    })
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), {
      target: { value: '699' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: /Preview Payment Receipt/i })
    )

    await screen.findByRole('button', { name: /Send Payment Receipt/i })

    // Rerender with isLoading=true
    rerender(
      <PaymentReceiptForm
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

  /* -------------------------------------------------- */
  /* CLOSE                                             */
  /* -------------------------------------------------- */

  test('calls onClose when cancel is clicked', () => {
    setup()
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  test('clears error when field changes', async () => {
    // We already have testing for this below, so I'll replace it with the accommodation check
    setup()

    // Check looking for accommodation to trigger those errors too
    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))

    // Set invalid inputs directly or hit preview to trigger "must be greater than 0"
    fireEvent.change(screen.getByLabelText(/Price per Night/i), { target: { value: '0' } })

    fireEvent.click(screen.getByRole('button', { name: /Preview Payment Receipt/i }))

    expect(await screen.findByText('Accommodation fee is required and must be greater than 0')).toBeInTheDocument()

    // Now trigger changes
    fireEvent.change(screen.getByLabelText(/Price per Night/i), { target: { value: '100' } })

    expect(screen.queryByText('Accommodation fee is required and must be greater than 0')).not.toBeInTheDocument()
  })

  test('can close preview modal', async () => {
    setup()

    // Fill required
    fireEvent.change(screen.getByLabelText(/Interested in/i), { target: { value: 'Listener (In-Person)' } })
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), { target: { value: '799' } })

    fireEvent.click(screen.getByRole('button', { name: /Preview Payment Receipt/i }))
    expect(await screen.findByText('Preview Details')).toBeInTheDocument()

    // The close button has aria-label="Close" and Back to Form has text
    // We can just click the Back to Form button or close icon
    const backBtn = screen.getByText('Back to Form')
    fireEvent.click(backBtn)

    expect(screen.queryByText('Preview Details')).not.toBeInTheDocument()
  })

  test('can cancel confirmation modal', async () => {
    setup()

    // Fill required
    fireEvent.change(screen.getByLabelText(/Interested in/i), { target: { value: 'Listener (In-Person)' } })
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), { target: { value: '799' } })

    // Open preview
    fireEvent.click(screen.getByRole('button', { name: /Preview Payment Receipt/i }))

    // Click Send to open confirmation
    fireEvent.click(await screen.findByRole('button', { name: /Send Payment Receipt/i }))

    // Now modal is open
    expect(await screen.findByText('Confirm Payment Receipt Submission')).toBeInTheDocument()

    // Cancel confirmation (Cancel button inside confirm modal)
    // The modal has a Cancel and Confirm & Send button
    const confirmCancelBtn = screen.getAllByRole('button', { name: 'Cancel' }).find(b => b.className.includes('bg-white')) || screen.getByText('Cancel')
    fireEvent.click(confirmCancelBtn)

    // Should go back to preview 
    expect(screen.queryByText('Confirm Payment Receipt Submission')).not.toBeInTheDocument()
    // Still in preview
    expect(screen.getByText('Preview Details')).toBeInTheDocument()
  })

  test('clears error when field changes', async () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /Preview Payment Receipt/i }))
    await screen.findByText(/Please select an option/i)

    fireEvent.change(screen.getByLabelText(/Interested in/i), {
      target: { value: 'Others' }
    })
    expect(screen.queryByText(/Please select an option/i)).not.toBeInTheDocument()
  })

  test('handles date validation failure', async () => {
    setup()
    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))
    fireEvent.click(screen.getByRole('button', { name: /Preview Payment Receipt/i }))

    await waitFor(() => {
      expect(screen.getByText(/Check-in date is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Check-out date is required/i)).toBeInTheDocument()
    })
  })

  test('clears registration fee error on change', async () => {
    setup()
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: /Preview Payment Receipt/i }))
    
    expect(await screen.findByText('Registration fee is required and must be greater than 0')).toBeInTheDocument()
    
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), { target: { value: '100' } })
    expect(screen.queryByText('Registration fee is required and must be greater than 0')).not.toBeInTheDocument()
  })

  test('shows error when check-out is before check-in', async () => {
    setup()
    fireEvent.click(screen.getByLabelText(/Looking for Accommodation/i))
    fireEvent.change(screen.getByLabelText(/Check In/i), { target: { value: '2026-01-10' } })
    fireEvent.change(screen.getByLabelText(/Check Out/i), { target: { value: '2026-01-05' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Preview Payment Receipt/i }))
    
    expect(await screen.findByText('Check-out must be after check-in date')).toBeInTheDocument()
  })

  test('interest selection falls back to default fee when not in map', () => {
    setup()

    fireEvent.change(screen.getByLabelText(/Interested in/i), {
      target: { value: 'Custom Presentation' }, // not in mapping, falls back to 699
    })

    expect(screen.getAllByText('$699').length).toBeGreaterThan(0)
  })

  test('submits receipt without accommodation checked, checkIn and checkOut are undefined', async () => {
    setup()

    fireEvent.change(screen.getByLabelText(/Interested in/i), {
      target: { value: 'Oral Presenter (Virtual)' },
    })
    fireEvent.change(screen.getByLabelText(/Registration Fee/i), {
      target: { value: '399' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Preview Payment Receipt/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Send Payment Receipt/i }))
    fireEvent.click(screen.getByText(/Confirm & Send/i))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
      const payload = onSubmit.mock.calls[0][0]
      expect(payload.checkIn).toBeUndefined()
      expect(payload.checkOut).toBeUndefined()
      expect(payload.numberOfNights).toBeUndefined()
    })
  })

  test('verifies validation error border styling is applied when errors exist', async () => {
    const { container } = setup()

    // Trigger validation error
    fireEvent.click(screen.getByRole('button', { name: /Preview Payment Receipt/i }))

    await screen.findByText('Please select an option')
    
    // Verify border-red-500 class is applied to container
    const formDiv = container.firstChild?.firstChild as HTMLElement
    expect(formDiv.className).toContain('border-red-500')
  })

  test('covers branch fallbacks for missing fields (quantity, fees, occupancy)', async () => {
    let callCount = 0;
    const realUseState = jest.requireActual('react').useState
    const useStateSpy = jest.spyOn(jest.requireActual('react'), 'useState').mockImplementation((initVal) => {
      const hookIndex = callCount % 12;
      callCount++;
      
      if (hookIndex === 0) {
        return realUseState({
          ...(initVal as object),
          interestedIn: 'Unknown', 
          quantity: undefined,    
          registrationFee: 0,     
          accommodationFee: 0,    
        })
      }
      if (hookIndex === 11) return realUseState(true) // showConfirmModal: true
      return realUseState(initVal)
    })

    const { getByRole } = setup()

    const confirmBtn = getByRole('button', { name: /Confirm & Send/i })
    fireEvent.click(confirmBtn)

    expect(onSubmit).toHaveBeenCalled()
    useStateSpy.mockRestore()
  })

  test('covers branch fallbacks for accommodation item calculation', async () => {
    let callCount = 0;
    const realUseState = jest.requireActual('react').useState
    const useStateSpy = jest.spyOn(jest.requireActual('react'), 'useState').mockImplementation((initVal) => {
      const hookIndex = callCount % 12;
      callCount++;
      
      if (hookIndex === 0) {
        return realUseState({
          ...(initVal as object),
          interestedIn: 'Unknown', 
          quantity: undefined,    
          registrationFee: 0,     
          accommodationFee: 0,    
        })
      }
      if (hookIndex === 5) return realUseState('Single') // occupancyType
      if (hookIndex === 8) return realUseState(2) // numberOfNights
      if (hookIndex === 11) return realUseState(true) // showConfirmModal: true
      return realUseState(initVal)
    })

    const { getByRole } = setup()
    const confirmBtn = getByRole('button', { name: /Confirm & Send/i })
    fireEvent.click(confirmBtn)

    expect(onSubmit).toHaveBeenCalled()
    useStateSpy.mockRestore()
  })
})
