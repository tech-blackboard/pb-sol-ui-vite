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

  /* -------------------------------------------------- */
  /* INTEREST & REGISTRATION FEE                        */
  /* -------------------------------------------------- */

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

  /* -------------------------------------------------- */
  /* PARTICIPANTS                                      */
  /* -------------------------------------------------- */

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

  /* -------------------------------------------------- */
  /* VALIDATION                                        */
  /* -------------------------------------------------- */

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

  /* -------------------------------------------------- */
  /* CLOSE                                             */
  /* -------------------------------------------------- */

  test('calls onClose when cancel is clicked', () => {
    setup()

    fireEvent.click(screen.getByText('Cancel'))

    expect(onClose).toHaveBeenCalled()
  })
})
