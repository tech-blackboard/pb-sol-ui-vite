import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AccommodationForm from '../../../../features/accRegistrations/components/AccommodationForm'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import accRegistrationsReducer from '../../../../store/slices/accRegistrations/accRegistrations.slice'

jest.mock('../../../../services/sourcedb', () => ({
    listWebsites: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
    },
}))

import { listWebsites } from '../../../../services/sourcedb'
import toast from 'react-hot-toast'

const createMockStore = () => configureStore({
    reducer: { accRegistrations: accRegistrationsReducer },
})

describe('AccommodationForm', () => {
    const mockOnClose = jest.fn()
    const mockOnSuccess = jest.fn()

    beforeAll(() => {
        Element.prototype.scrollTo = jest.fn()
    })

    beforeEach(() => {
        jest.clearAllMocks()
            ; (listWebsites as jest.Mock).mockResolvedValue([{ id: 1, name: 'Test Conf' }])
    })

    const renderForm = (props = {}) => {
        const store = createMockStore()
        return render(
            <Provider store={store}>
                <AccommodationForm onClose={mockOnClose} onSuccess={mockOnSuccess} {...props} />
            </Provider>
        )
    }

    it('renders the form', async () => {
        renderForm()
        expect(await screen.findByText('Add New Accommodation')).toBeInTheDocument()
    })

    it('loads websites', async () => {
        renderForm()
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())
    })

    it('shows validation errors on empty submit', async () => {
        renderForm()
        await screen.findByText('Add New Accommodation')
        fireEvent.click(screen.getByText('Add Accommodation'))
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please fill the missing fields correctly'))
    })

    it('calculates nights from dates', async () => {
        renderForm()
        await screen.findByText('Add New Accommodation')

        const checkinInput = screen.getByLabelText('Check-in Date')
        const checkoutInput = screen.getByLabelText('Check-out Date')

        fireEvent.change(checkinInput, { target: { value: '2024-01-01' } })
        fireEvent.change(checkoutInput, { target: { value: '2024-01-05' } })

        const nightsInput = screen.getByLabelText('Nights')
        expect(nightsInput).toHaveValue(4)
    })

    it('calculates total price correctly', async () => {
        renderForm()
        await screen.findByText('Add New Accommodation')

        fireEvent.change(screen.getByLabelText('Check-in Date'), { target: { value: '2024-01-01' } })
        fireEvent.change(screen.getByLabelText('Check-out Date'), { target: { value: '2024-01-03' } }) // 2 nights
        fireEvent.change(screen.getByLabelText('Price per Night ($)*'), { target: { value: '100' } })

        // 2 nights * $100 = $200
        // Fees: 200 * 0.048 = 9.6 -> round to 10
        // Total: 210
        expect(screen.getByText('$200')).toBeInTheDocument() // Total Accommodation Value
        expect(screen.getByText('$10')).toBeInTheDocument()  // Internet Handling Fees
        expect(screen.getByText('$210')).toBeInTheDocument() // Total Accommodation Price
    })

    it('successfully submits the form', async () => {
        const mockDispatch = jest.fn().mockResolvedValue({
            type: 'accRegistrations/create/fulfilled',
            payload: {}
        })

        const hooks = await import('../../../../store/hooks')
        jest.spyOn(hooks, 'useAppDispatch').mockReturnValue(mockDispatch)

        renderForm()

        fireEvent.change(screen.getByLabelText('Caption*'), { target: { value: 'Mr.' } })
        fireEvent.click(screen.getByRole('radio', { name: 'Single Occupancy' }))
        fireEvent.change(screen.getByLabelText('Full Name*'), { target: { value: 'John Doe' } })
        fireEvent.change(screen.getByLabelText('Email*'), { target: { value: 'john@test.com' } })
        fireEvent.change(screen.getByLabelText('Phone*'), { target: { value: '1234567890' } })

        await waitFor(() => expect(listWebsites).toHaveBeenCalled())

        fireEvent.change(screen.getByLabelText('Website/Conference*'), { target: { value: '1' } })
        fireEvent.change(screen.getByLabelText('Check-in Date'), { target: { value: '2024-01-01' } })
        fireEvent.change(screen.getByLabelText('Check-out Date'), { target: { value: '2024-01-02' } })
        fireEvent.change(screen.getByLabelText('Price per Night ($)*'), { target: { value: '100' } })

        fireEvent.click(screen.getByText('Add Accommodation'))

        await waitFor(() => {
            // The thunk is called with the payload
            // Note: Since it's a thunk, we might need to check the actual call to the service or mock the thunk differently.
            // But for now, ensuring the toast and flow is enough as per current test structure.
            expect(toast.success).toHaveBeenCalledWith(
                'Accommodation Registration created successfully'
            )
            expect(mockOnSuccess).toHaveBeenCalled()
            expect(mockOnClose).toHaveBeenCalled()
        })
    })

    it('handles submission error', async () => {
        const errorMessage = 'Failed to create registration'

        const mockDispatch = jest.fn().mockResolvedValue({
            type: 'accRegistrations/create/rejected',
            payload: errorMessage,
        })

        const hooks = await import('../../../../store/hooks')
        jest.spyOn(hooks, 'useAppDispatch').mockReturnValue(mockDispatch)

        renderForm()

        // WAIT FOR WEBSITES
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())

        // VALID DATA
        fireEvent.change(screen.getByLabelText('Caption*'), { target: { value: 'Mr.' } })
        fireEvent.click(screen.getByRole('radio', { name: 'Single Occupancy' }))
        fireEvent.change(screen.getByLabelText('Full Name*'), { target: { value: 'John Doe' } })
        fireEvent.change(screen.getByLabelText('Email*'), { target: { value: 'john@test.com' } })
        fireEvent.change(screen.getByLabelText('Phone*'), { target: { value: '1234567890' } })
        fireEvent.change(screen.getByLabelText('Website/Conference*'), { target: { value: '1' } })
        fireEvent.change(screen.getByLabelText('Check-in Date'), { target: { value: '2024-01-01' } })
        fireEvent.change(screen.getByLabelText('Check-out Date'), { target: { value: '2024-01-02' } })
        fireEvent.change(screen.getByLabelText('Price per Night ($)*'), { target: { value: '100' } })

        fireEvent.click(screen.getByText('Add Accommodation'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(errorMessage)
        })
    })

    it('shows error if occupancy type is missing', async () => {
        renderForm()
        await screen.findByText('Add New Accommodation')

        // Fill other fields but leave occupancy
        fireEvent.change(screen.getByLabelText('Caption*'), { target: { value: 'Mr.' } })
        fireEvent.change(screen.getByLabelText('Full Name*'), { target: { value: 'John Doe' } })
        fireEvent.change(screen.getByLabelText('Email*'), { target: { value: 'john@test.com' } })
        fireEvent.change(screen.getByLabelText('Phone*'), { target: { value: '1234567890' } })

        fireEvent.click(screen.getByText('Add Accommodation'))

        await waitFor(() => {
            expect(screen.getByText('Occupancy type is required')).toBeInTheDocument()
        })
    })

    it('validates that checkout date is after checkin date', async () => {
        renderForm()
        await screen.findByText('Add New Accommodation')

        const checkinInput = screen.getByLabelText('Check-in Date')
        const checkoutInput = screen.getByLabelText('Check-out Date')

        fireEvent.change(checkinInput, { target: { value: '2024-01-10' } })
        fireEvent.change(checkoutInput, { target: { value: '2024-01-05' } }) // Earlier than checkin

        fireEvent.click(screen.getByText('Add Accommodation'))

        await waitFor(() => {
            expect(screen.getByText('Check-out must be after check-in date')).toBeInTheDocument()
        })
    })

    it('captures WhatsApp number correctly', async () => {
        renderForm()
        await screen.findByText('Add New Accommodation')

        const wphoneInput = screen.getByLabelText('WhatsApp Number')
        fireEvent.change(wphoneInput, { target: { value: '9876543210' } })

        expect(wphoneInput).toHaveValue('9876543210')
    })
})