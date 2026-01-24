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

  test('cancel button resets form and closes modal', () => {
    renderForm()

    fireEvent.click(screen.getByText('Cancel'))

    expect(onClose).toHaveBeenCalled()
  })
})
