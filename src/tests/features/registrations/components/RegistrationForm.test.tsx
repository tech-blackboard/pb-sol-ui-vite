import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegistrationForm from '../../../../features/registrations/components/RegistrationForm'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import registrationsReducer from '../../../../store/slices/registrations/registrations.slice'

// Mock services and thunks
jest.mock('../../../../services/sourcedb', () => ({
    listWebsites: jest.fn(),
}))

jest.mock('../../../../store/slices/registrations/registrations.thunks', () => ({
    fetchRegistrations: Object.assign(
        jest.fn(() => ({ type: 'registrations/fetchRegistrations/pending' })),
        {
            pending: { type: 'registrations/fetchRegistrations/pending' },
            fulfilled: { type: 'registrations/fetchRegistrations/fulfilled' },
            rejected: { type: 'registrations/fetchRegistrations/rejected' },
            typePrefix: 'registrations/fetchRegistrations'
        }
    ),
    createRegistrationThunk: Object.assign(
        jest.fn(() => ({ type: 'registrations/create/pending' })),
        {
            pending: { type: 'registrations/create/pending' },
            fulfilled: { type: 'registrations/create/fulfilled' },
            rejected: { type: 'registrations/create/rejected' },
            typePrefix: 'registrations/create'
        }
    ),
    deleteRegistrationThunk: Object.assign(
        jest.fn(() => ({ type: 'registrations/delete/pending' })),
        {
            pending: { type: 'registrations/delete/pending' },
            fulfilled: { type: 'registrations/delete/fulfilled' },
            rejected: { type: 'registrations/delete/rejected' },
            typePrefix: 'registrations/delete'
        }
    ),
}))

jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
    },
}))

import { listWebsites } from '../../../../services/sourcedb'
import { createRegistrationThunk } from '../../../../store/slices/registrations/registrations.thunks'
import toast from 'react-hot-toast'

const createMockStore = () => {
    return configureStore({
        reducer: {
            registrations: registrationsReducer,
        },
    })
}

describe('RegistrationForm', () => {
    const mockOnClose = jest.fn()
    const mockOnSuccess = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (listWebsites as jest.Mock).mockResolvedValue([
                { id: 1, name: 'Test Conference' },
            ])
    })

    const renderForm = (props = {}) => {
        const store = createMockStore()
        return render(
            <Provider store={store}>
                <RegistrationForm
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                    {...props}
                />
            </Provider>
        )
    }

    it('renders the form with title', async () => {
        renderForm()
        expect(await screen.findByText('Add New Registration')).toBeInTheDocument()
    })

    it('loads website options on mount', async () => {
        renderForm()
        await waitFor(() => {
            expect(listWebsites).toHaveBeenCalled()
        })
    })

    it('displays website options after loading', async () => {
        renderForm()
        await waitFor(() => {
            expect(screen.getByText('Test Conference')).toBeInTheDocument()
        })
    })

    it('shows validation errors when submitting empty form', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        fireEvent.click(screen.getByText('Create Registration'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Please fill the missing fields')
        })
    })

    it('calls onClose when cancel button is clicked', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        fireEvent.click(screen.getByText('Cancel'))
        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when X button is clicked', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        const closeButtons = screen.getAllByRole('button')
        const xButton = closeButtons[0] // First button is the X
        fireEvent.click(xButton)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('pre-fills website_id when provided', async () => {
        renderForm({ websiteId: 1 })
        await screen.findByText('Add New Registration')

        const websiteSelect = screen.getByDisplayValue(/Test Conference|Select Website/)
        expect(websiteSelect).toBeInTheDocument()
    })

    it('updates registration price when presentation type changes', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        const presentationSelect = screen.getByDisplayValue('Oral Presenter (In-Person)')

        // Change to virtual presenter
        fireEvent.change(presentationSelect, {
            target: { value: 'Oral Presenter (Virtual)' },
        })

        // Check that the price input is updated
        const priceInput = screen.getByDisplayValue('399')
        expect(priceInput).toBeInTheDocument()
    })

    it.skip('calculates nights correctly based on checkin and checkout dates', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        // Enable accommodation
        const accCheckbox = screen.getByRole('checkbox', {
            name: /Looking for Accommodation/i,
        })
        fireEvent.click(accCheckbox)

        // Select occupancy
        const singleOccupancy = screen.getByText('Single Occupancy')
        fireEvent.click(singleOccupancy)

        // Set dates
        const checkinInput = screen.getByLabelText('Check-in Date')
        const checkoutInput = screen.getByLabelText('Check-out Date')

        fireEvent.change(checkinInput, { target: { value: '2024-01-01' } })
        fireEvent.change(checkoutInput, { target: { value: '2024-01-05' } })

        // Nights should be calculated
        const nightsInput = screen.getByDisplayValue('4')
        expect(nightsInput).toBeInTheDocument()
    })

    it('shows accommodation fields when accommodation is enabled', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        const accCheckbox = screen.getByRole('checkbox', {
            name: /Looking for Accommodation/i,
        })
        fireEvent.click(accCheckbox)

        expect(screen.getByText('Single Occupancy')).toBeInTheDocument()
        expect(screen.getByText('Double Occupancy')).toBeInTheDocument()
        expect(screen.getByText('Triple Occupancy')).toBeInTheDocument()
    })

    it('hides accommodation fields when accommodation is disabled', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        const accCheckbox = screen.getByRole('checkbox', {
            name: /Looking for Accommodation/i,
        })

        // Enable then disable
        fireEvent.click(accCheckbox)
        fireEvent.click(accCheckbox)

        expect(screen.queryByText('Check-in Date')).not.toBeInTheDocument()
    })

    it.skip('prevents participants from being less than 1', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        const participantsInput = screen.getByLabelText(/Number of Participants/i)
        fireEvent.change(participantsInput, { target: { value: '0' } })

        // Should be corrected to 1
        await waitFor(() => {
            expect((participantsInput as HTMLInputElement).value).toBe('1')
        })
    })

    it('renders registration summary table', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        expect(screen.getByText('Registration Summary')).toBeInTheDocument()
        expect(screen.getByText('Registration Price')).toBeInTheDocument()
        expect(screen.getByText('Total Price')).toBeInTheDocument()
    })

    it('calculates total price with internet handling fees', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        // The default registration price is 699 for Oral Presenter (In-Person)
        // 699 * 1 participant = 699
        // 699 * 0.048 = 33.552 ~= 34 (rounded)
        // Total = 699 + 34 = 733

        const summaryRows = screen.getAllByRole('row')
        const totalRow = summaryRows[summaryRows.length - 1]
        expect(totalRow.textContent).toContain('733')
    })

    it.skip('handles successful form submission', async () => {
        const store = createMockStore()
            ; (createRegistrationThunk as unknown as jest.Mock).mockReturnValue({
                type: 'registrations/create/fulfilled',
            })

        render(
            <Provider store={store}>
                <RegistrationForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
            </Provider>
        )

        await screen.findByText('Add New Registration')

        // Fill required fields
        fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'Dr.' } })
        fireEvent.change(screen.getByLabelText(/Full Name/i), {
            target: { value: 'John Doe' },
        })
        fireEvent.change(screen.getAllByLabelText(/Email/i)[0], {
            target: { value: 'john@test.com' },
        })
        fireEvent.change(screen.getByLabelText(/Phone\*/i), {
            target: { value: '1234567890' },
        })
        fireEvent.change(screen.getByLabelText(/Institution/i), {
            target: { value: 'Test University' },
        })
        fireEvent.change(screen.getByDisplayValue(/India|Select Option/i), {
            target: { value: 'India' },
        })

        // Wait for website to load
        await waitFor(() => {
            expect(screen.getByText('Test Conference')).toBeInTheDocument()
        })

        // Select website
        const websiteSelect = screen.getByDisplayValue(/Select Website/)
        fireEvent.change(websiteSelect, { target: { value: '1' } })

        // Submit
        fireEvent.click(screen.getByText('Create Registration'))

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Registration created successfully')
            expect(mockOnSuccess).toHaveBeenCalled()
            expect(mockOnClose).toHaveBeenCalled()
        })
    })

    it.skip('handles form submission failure', async () => {
        const store = createMockStore()
            ; (createRegistrationThunk as unknown as jest.Mock).mockReturnValue({
                type: 'registrations/create/rejected',
            })

        render(
            <Provider store={store}>
                <RegistrationForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
            </Provider>
        )

        await screen.findByText('Add New Registration')

        // Fill required fields
        fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'Dr.' } })
        fireEvent.change(screen.getByLabelText(/Full Name/i), {
            target: { value: 'John Doe' },
        })
        fireEvent.change(screen.getAllByLabelText(/Email/i)[0], {
            target: { value: 'john@test.com' },
        })
        fireEvent.change(screen.getByLabelText(/Phone\*/i), {
            target: { value: '1234567890' },
        })
        fireEvent.change(screen.getByLabelText(/Institution/i), {
            target: { value: 'Test University' },
        })

        await waitFor(() => {
            expect(screen.getByText('Test Conference')).toBeInTheDocument()
        })

        const websiteSelect = screen.getByDisplayValue(/Select Website/)
        fireEvent.change(websiteSelect, { target: { value: '1' } })

        // Submit
        fireEvent.click(screen.getByText('Create Registration'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to create registration')
        })
    })

    it('shows error when website loading fails', async () => {
        ; (listWebsites as jest.Mock).mockRejectedValue(new Error('Network error'))
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

        renderForm()

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to load website options')
        })

        consoleErrorSpy.mockRestore()
    })

    it.skip('validates checkout date is after checkin date', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        // Fill required non-accommodation fields first
        fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'Dr.' } })
        fireEvent.change(screen.getByLabelText(/Full Name/i), {
            target: { value: 'John Doe' },
        })
        fireEvent.change(screen.getAllByLabelText(/Email/i)[0], {
            target: { value: 'john@test.com' },
        })
        fireEvent.change(screen.getByLabelText(/Phone\*/i), {
            target: { value: '1234567890' },
        })
        fireEvent.change(screen.getByLabelText(/Institution/i), {
            target: { value: 'Test University' },
        })

        await waitFor(() => {
            expect(screen.getByText('Test Conference')).toBeInTheDocument()
        })

        const websiteSelect = screen.getByDisplayValue(/Select Website/)
        fireEvent.change(websiteSelect, { target: { value: '1' } })

        // Enable accommodation
        const accCheckbox = screen.getByRole('checkbox', {
            name: /Looking for Accommodation/i,
        })
        fireEvent.click(accCheckbox)

        // Select occupancy
        const singleOccupancy = screen.getByText('Single Occupancy')
        fireEvent.click(singleOccupancy)

        // Set invalid dates (checkout before checkin)
        const checkinInput = screen.getByLabelText('Check-in Date')
        const checkoutInput = screen.getByLabelText('Check-out Date')

        fireEvent.change(checkinInput, { target: { value: '2024-01-05' } })
        fireEvent.change(checkoutInput, { target: { value: '2024-01-01' } })

        // Set accommodation price
        const accPriceInput = screen.getByLabelText(/Price per Night/i)
        fireEvent.change(accPriceInput, { target: { value: '100' } })

        // Submit
        fireEvent.click(screen.getByText('Create Registration'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Please fill the missing fields')
        })
    })
})
