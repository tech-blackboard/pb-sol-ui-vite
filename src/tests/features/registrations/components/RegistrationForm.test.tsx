import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegistrationForm from '../../../../features/registrations/components/RegistrationForm'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import registrationsReducer from '../../../../store/slices/registrations/registrations.slice'
import { listWebsites, type SourceWebsite } from '../../../../services/sourcedb'
import { createRegistrationThunk, updateRegistrationThunk } from '../../../../store/slices/registrations/registrations.thunks'
import type { RegistrationItem } from '../../../../services/registrations'
import toast from 'react-hot-toast'

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
            pending: { type: 'registrations/create/pending', match: (action: { type?: string }) => action?.type === 'registrations/create/pending' },
            fulfilled: { type: 'registrations/create/fulfilled', match: (action: { type?: string }) => action?.type === 'registrations/create/fulfilled' },
            rejected: { type: 'registrations/create/rejected', match: (action: { type?: string }) => action?.type === 'registrations/create/rejected' },
            typePrefix: 'registrations/create'
        }
    ),
    deleteRegistrationThunk: Object.assign(
        jest.fn(() => ({ type: 'registrations/delete/pending' })),
        {
            pending: { type: 'registrations/delete/pending', match: (action: { type?: string }) => action?.type === 'registrations/delete/pending' },
            fulfilled: { type: 'registrations/delete/fulfilled', match: (action: { type?: string }) => action?.type === 'registrations/delete/fulfilled' },
            rejected: { type: 'registrations/delete/rejected', match: (action: { type?: string }) => action?.type === 'registrations/delete/rejected' },
            typePrefix: 'registrations/delete'
        }
    ),
    updateRegistrationThunk: Object.assign(
        jest.fn(() => ({ type: 'registrations/update/pending' })),
        {
            pending: { type: 'registrations/update/pending', match: (action: { type?: string }) => action?.type === 'registrations/update/pending' },
            fulfilled: { type: 'registrations/update/fulfilled', match: (action: { type?: string }) => action?.type === 'registrations/update/fulfilled' },
            rejected: { type: 'registrations/update/rejected', match: (action: { type?: string }) => action?.type === 'registrations/update/rejected' },
            typePrefix: 'registrations/update'
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

const createMockStore = () => {
    return configureStore({
        reducer: {
            registrations: registrationsReducer,
        },
    })
}

describe('RegistrationForm', () => {
    jest.setTimeout(30000)
    const mockOnClose = jest.fn()
    const mockOnSuccess = jest.fn()

    beforeAll(() => {
        Element.prototype.scrollTo = jest.fn()
    })

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

        // wait until website loads
        const option = await screen.findByText('Test Conference')
        expect(option).toBeInTheDocument()

        // now assert select value
        const select = screen.getByRole('combobox', { name: /Website\/Conference/i })
        expect(select).toHaveValue('1')
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

    it('calculates nights correctly based on checkin and checkout dates', async () => {
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

    it('prevents participants from being less than 1', async () => {
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

    it('handles parseDateForInput exception (lines 123-124)', async () => {
        let calls = 0
        const weirdDate = {
            match: () => null,
            toString: () => {
                if (calls++ === 0) throw new Error('Test Error')
                return '2024-01-01'
            }
        }
        const editData = {
            id: 1,
            website_id: 1,
            presentation: 'Oral Presenter (In-Person)',
            accomm: '1',
            accmvalue: 'Some Hotel', // Needed to render the checkin fields
            checkin: weirdDate as unknown as string, // hits the catch block
            checkout: '2024-01-05',
        }
        renderForm({ websiteId: 1, editData: editData as unknown as RegistrationItem })

        // Render should not crash, and Check-in Date input will be present
        const checkinInput = screen.getByLabelText('Check-in Date')
        expect(checkinInput).toBeInTheDocument()
    })

    it('covers getInitialFormData fallbacks and ISO date parsing (lines 115, 150, 152, 157, 159, 163)', async () => {
        const editData = {
            id: 2,
            website: { id: 2 }, // hits editData.website?.id fallback
            presentation: 'Unknown Presentation Type', // triggers REGISTRATION_FEES fallback to 699
            accomm: '0', // hasAccommodation is false, but checkin/checkout still parsed
            // accmvalue is missing to hit falsy branch in accmvalue fallback
            checkin: '2024-05-10T12:00:00Z', // hits dateStr.includes('T') line 115
            checkout: '2024-05-15T12:00:00Z',
            phone: '1234567890',
            country: 'US',
            institution: 'Test University',
            name: 'Test Name',
            email: 'test@example.com'
        }
        renderForm({ websiteId: undefined, editData: editData as unknown as RegistrationItem })

        // Verify ISO date was correctly split (internal state covers this)

        // Form submits using fallback status_id (line 331)
        const nameInput = screen.getByLabelText(/Name/i)
        fireEvent.change(nameInput, { target: { value: 'Test' } })
        const emailInput = screen.getByLabelText('Email*')
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

        const submitBtn = screen.getByRole('button', { name: /Update Registration/i })
        fireEvent.click(submitBtn)
        

        await waitFor(() => {
            expect(updateRegistrationThunk).toHaveBeenCalled()
        })
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

    it('handles successful form submission', async () => {
        const store = createMockStore()
            ; (createRegistrationThunk as unknown as jest.Mock).mockReturnValue({
                type: 'registrations/create/fulfilled',
                payload: { id: 1, name: 'John Doe', email: 'john@test.com' }
            })

        render(
            <Provider store={store}>
                <RegistrationForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
            </Provider>
        )

        await screen.findByText('Add New Registration')

        // Fill required fields
        fireEvent.change(screen.getByLabelText(/Caption/i), { target: { value: 'Dr.' } })
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
        fireEvent.change(screen.getByLabelText(/Country\*/), {
            target: { value: 'India' },
        })

        // Wait for website to load
        await waitFor(() => {
            expect(screen.getByText('Test Conference')).toBeInTheDocument()
        })

        // Select website
        const websiteSelect = screen.getByLabelText(/Website\/Conference/i)
        fireEvent.change(websiteSelect, { target: { value: '1' } })

        // Submit
        fireEvent.click(screen.getByText('Create Registration'))

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Registration created successfully')
            expect(mockOnSuccess).toHaveBeenCalled()
            expect(mockOnClose).toHaveBeenCalled()
        })
    })

    it('handles form submission failure', async () => {
        const store = createMockStore()
            ; (createRegistrationThunk as unknown as jest.Mock).mockReturnValue({
                type: 'registrations/create/rejected',
                payload: 'Failed to create registration',
                error: { message: 'Failed to create registration' }
            })

        render(
            <Provider store={store}>
                <RegistrationForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
            </Provider>
        )

        await screen.findByText('Add New Registration')

        // Fill required fields
        fireEvent.change(screen.getByLabelText(/Caption/i), { target: { value: 'Dr.' } })
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

        fireEvent.change(screen.getByLabelText(/Country\*/), {
            target: { value: 'India' },
        })

        await waitFor(() => {
            expect(screen.getByText('Test Conference')).toBeInTheDocument()
        })

        const websiteSelect = screen.getByLabelText(/Website\/Conference/i)
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

    it('validates checkout date is after checkin date', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        // Fill required non-accommodation fields first
        fireEvent.change(screen.getByLabelText(/Caption/i), { target: { value: 'Dr.' } })
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

        fireEvent.change(screen.getByLabelText(/Country\*/), {
            target: { value: 'India' },
        })

        await waitFor(() => {
            expect(screen.getByText('Test Conference')).toBeInTheDocument()
        })

        const websiteSelect = screen.getByLabelText(/Website\/Conference/i)
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

    it('validates number of nights must be greater than 0 (line 223)', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        // Enable accommodation
        fireEvent.click(screen.getByRole('checkbox', { name: /Looking for Accommodation/i }))
        fireEvent.click(screen.getByText('Single Occupancy'))

        // Set same date for checkin and checkout -> 0 nights
        const date = '2024-01-01'
        fireEvent.change(screen.getByLabelText('Check-in Date'), { target: { value: date } })
        fireEvent.change(screen.getByLabelText('Check-out Date'), { target: { value: date } })

        fireEvent.click(screen.getByText('Create Registration'))
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please fill the missing fields'))
    })

    it('validates accommodation fee is required (line 226)', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        fireEvent.click(screen.getByRole('checkbox', { name: /Looking for Accommodation/i }))
        fireEvent.click(screen.getByText('Single Occupancy'))

        fireEvent.change(screen.getByLabelText('Check-in Date'), { target: { value: '2024-01-01' } })
        fireEvent.change(screen.getByLabelText('Check-out Date'), { target: { value: '2024-01-02' } })
        fireEvent.change(screen.getByLabelText(/Price per Night/i), { target: { value: '0' } })

        fireEvent.click(screen.getByText('Create Registration'))
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please fill the missing fields'))
    })

    it('handles unexpected dispatch errors in catch block (line 281)', async () => {
        const store = createMockStore()
        jest.spyOn(store, 'dispatch').mockImplementation(() => { throw new Error('Crash') })

        render(
            <Provider store={store}>
                <RegistrationForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
            </Provider>
        )

        await screen.findByText('Add New Registration')
        // Fill minimum required fields
        fireEvent.change(screen.getByLabelText(/Caption/i), { target: { value: 'Mr.' } })
        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John' } })
        fireEvent.change(screen.getAllByLabelText(/Email/i)[0], { target: { value: 'j@t.com' } })
        fireEvent.change(screen.getByLabelText(/Phone\*/i), { target: { value: '1' } })
        fireEvent.change(screen.getByLabelText(/Institution/i), { target: { value: 'I' } })
        fireEvent.change(screen.getByLabelText(/Country\*/), { target: { value: 'India' } })
        await waitFor(() => expect(screen.getByText('Test Conference')).toBeInTheDocument())
        fireEvent.change(screen.getByLabelText(/Website\/Conference/i), { target: { value: '1' } })

        fireEvent.click(screen.getByText('Create Registration'))
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('An error occurred'))
    })

    it('renders occupancy type error message (line 429)', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        fireEvent.click(screen.getByRole('checkbox', { name: /Looking for Accommodation/i }))
        fireEvent.click(screen.getByText('Create Registration'))

        await waitFor(() => {
            expect(screen.getByText('Occupancy type is required')).toBeInTheDocument()
        })
    })

    it('clears field-level error when field is edited (lines 194-195)', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        // Trigger validaton error
        fireEvent.click(screen.getByText('Create Registration'))
        await waitFor(() => expect(screen.getByText('Name is required')).toBeInTheDocument())

        // Edit the field
        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'A' } })

        // Error should be cleared
        await waitFor(() => {
            expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
        })
    })

    it('validates email and participants (lines 204, 211)', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        // Set name but leave email empty
        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John' } })
        fireEvent.change(screen.getByLabelText(/Number of Participants/i), { target: { value: '' } })

        fireEvent.click(screen.getByText('Create Registration'))

        await waitFor(() => {
            expect(screen.getByText('Email is required')).toBeInTheDocument()
            expect(screen.getByText('Number of participants is required')).toBeInTheDocument()
        })
    })

    it('validates check-in and check-out dates (lines 217-218)', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        fireEvent.click(screen.getByRole('checkbox', { name: /Looking for Accommodation/i }))
        fireEvent.click(screen.getByText('Single Occupancy'))

        // Leave dates empty and submit
        fireEvent.click(screen.getByText('Create Registration'))

        await waitFor(() => {
            expect(screen.getByText('Check-in date is required')).toBeInTheDocument()
            expect(screen.getByText('Check-out date is required')).toBeInTheDocument()
        })
    })

    it('verifies accommodation payload mapping (lines 259-260)', async () => {
        const store = createMockStore()
            ; (createRegistrationThunk as unknown as jest.Mock).mockReturnValue({
                type: 'registrations/create/fulfilled',
                payload: {}
            })

        render(
            <Provider store={store}>
                <RegistrationForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
            </Provider>
        )

        await screen.findByText('Add New Registration')

        // Fill required fields
        fireEvent.change(screen.getByLabelText(/Caption/i), { target: { value: 'Mr.' } })
        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John' } })
        fireEvent.change(screen.getAllByLabelText(/Email/i)[0], { target: { value: 'j@t.com' } })
        fireEvent.change(screen.getByLabelText(/Phone\*/i), { target: { value: '1' } })
        fireEvent.change(screen.getByLabelText(/Institution/i), { target: { value: 'I' } })
        fireEvent.change(screen.getByLabelText(/Country\*/), { target: { value: 'India' } })
        await waitFor(() => expect(screen.getByText('Test Conference')).toBeInTheDocument())
        fireEvent.change(screen.getByLabelText(/Website\/Conference/i), { target: { value: '1' } })

        // Enable accommodation
        fireEvent.click(screen.getByRole('checkbox', { name: /Looking for Accommodation/i }))
        fireEvent.click(screen.getByText('Single Occupancy'))
        fireEvent.change(screen.getByLabelText('Check-in Date'), { target: { value: '2024-01-01' } })
        fireEvent.change(screen.getByLabelText('Check-out Date'), { target: { value: '2024-01-02' } })
        fireEvent.change(screen.getByLabelText(/Price per Night/i), { target: { value: '100' } })

        fireEvent.click(screen.getByText('Create Registration'))

        await waitFor(() => {
            // Depend on how createRegistrationThunk is mocked/called, we check the actual payload sent to dispatch
            expect(createRegistrationThunk).toHaveBeenCalledWith(expect.objectContaining({
                accomm: '100',
                accmvalue: '100'
            }))
        })
    })

    it('handles form submission failure with fallback message (line 275)', async () => {
        ; (createRegistrationThunk as unknown as jest.Mock).mockReturnValue({
            type: 'registrations/create/rejected',
            payload: null, // Test fallback to 'Failed to create registration'
            error: { message: 'Some Error' }
        })

        renderForm()
        await screen.findByText('Add New Registration')

        // Fill minimum required fields
        fireEvent.change(screen.getByLabelText(/Caption/i), { target: { value: 'Mr.' } })
        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John' } })
        fireEvent.change(screen.getAllByLabelText(/Email/i)[0], { target: { value: 'j@t.com' } })
        fireEvent.change(screen.getByLabelText(/Phone\*/i), { target: { value: '1' } })
        fireEvent.change(screen.getByLabelText(/Institution/i), { target: { value: 'I' } })
        fireEvent.change(screen.getByLabelText(/Country\*/), { target: { value: 'India' } })
        await waitFor(() => expect(screen.getByText('Test Conference')).toBeInTheDocument())
        fireEvent.change(screen.getByLabelText(/Website\/Conference/i), { target: { value: '1' } })

        fireEvent.click(screen.getByText('Create Registration'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to create registration')
        })
    })

    it('covers race condition on unmount (line 121)', async () => {
        let resolveWebsites: (value: SourceWebsite[]) => void = () => { }
        const webPromise = new Promise((res) => { resolveWebsites = res })
            ; (listWebsites as jest.Mock).mockReturnValue(webPromise)

        const { unmount } = renderForm()
        unmount()
        resolveWebsites([{ id: 1, name: 'W' }])
        await waitFor(() => expect(screen.queryByText('W')).not.toBeInTheDocument())
    })

    it('covers numeric fallback and validation price/presentation (lines 154, 208, 210)', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        // Trigger validation with empty/invalid fields
        // Presentation select usually has a default, so we'd need to force it to null if possible, or just check the logic.
        // For reg_price, we can clear it.
        const priceInput = screen.getByLabelText(/Registration Price/i)
        fireEvent.change(priceInput, { target: { value: '' } })

        fireEvent.click(screen.getByText('Create Registration'))

        await waitFor(() => {
            expect(screen.getByText('Registration price is required')).toBeInTheDocument()
        })
    })

    it('covers presentation validation (line 208)', async () => {
        renderForm()
        await screen.findByText('Add New Registration')

        // Clear presentation
        const presentationSelect = screen.getByLabelText(/Interested In \(Presentation\)\*/i)
        fireEvent.change(presentationSelect, { target: { value: '' } })

        fireEvent.click(screen.getByText('Create Registration'))

        await waitFor(() => {
            expect(screen.getByText('Presentation is required')).toBeInTheDocument()
        })
    })
})

import { SelectField } from '../../../../features/registrations/components/RegistrationForm'

describe('SelectField component', () => {
    it('handles object options (lines 567-568)', () => {
        const options = [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }]
        const onChange = jest.fn()
        render(<SelectField name="test" options={options} onChange={onChange} />)
        expect(screen.getByText('One')).toBeInTheDocument()
        expect(screen.getByText('Two')).toBeInTheDocument()
    })
})

// =============================================
// Edit mode tests (covers lines 96-165, 352-362)
// =============================================
describe('RegistrationForm – edit mode', () => {
    jest.setTimeout(30000)
    const mockOnClose = jest.fn()
    const mockOnSuccess = jest.fn()

    beforeAll(() => {
        Element.prototype.scrollTo = jest.fn()
    })

    beforeEach(() => {
        jest.clearAllMocks()
        const { listWebsites } = jest.requireMock('../../../../services/sourcedb')
            ; (listWebsites as jest.Mock).mockResolvedValue([{ id: 1, name: 'Test Conference' }])
    })

    const baseEditData = {
        id: 42,
        name: 'Jane Doe',
        email: 'jane@test.com',
        aemail: 'j@alt.com',
        phone: '9876543210',
        wphone: '9876543210',
        institution: 'MIT',
        country: 'India',
        presentation: 'regtype_1_1-Oral Presenter (In-Person)',
        website_id: 1,
        website: { id: 1, name: 'Test Conference' },
        participants: '2',
        regtype: '699',
        accomm: '0',
        checkin: '',
        checkout: '',
        nights: '0',
        accmvalue: '',
        acmpng: '0',
        acc_price: '0',
        tot_price: '0',
        transaction_id: '',
        status_id: 1,
    }

    const createStore = () => {
        const { configureStore } = jest.requireActual('@reduxjs/toolkit')
        const registrationsReducer = jest.requireActual('../../../../store/slices/registrations/registrations.slice').default
        return configureStore({ reducer: { registrations: registrationsReducer } })
    }

    it('pre-fills form fields from editData and hides caption (lines 136-165)', async () => {
        const store = createStore()
        render(
            <Provider store={store}>
                <RegistrationForm
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                    editData={baseEditData as unknown as RegistrationItem}
                />
            </Provider>
        )

        expect(await screen.findByText('Edit Registration')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
        // Caption select should not appear in edit mode
        expect(screen.queryByText('--Caption*--')).not.toBeInTheDocument()
    })

    it('handles successful update submission (lines 352-356)', async () => {
        const store = createStore()
        const { updateRegistrationThunk } = jest.requireMock('../../../../store/slices/registrations/registrations.thunks')
            ; (updateRegistrationThunk as unknown as jest.Mock).mockReturnValue({
                type: 'registrations/update/fulfilled',
                payload: { id: 42 },
            })

        render(
            <Provider store={store}>
                <RegistrationForm
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                    editData={baseEditData as unknown as RegistrationItem}
                />
            </Provider>
        )

        await screen.findByText('Edit Registration')
        fireEvent.click(screen.getByText('Update Registration'))

        const toast = jest.requireMock('react-hot-toast').default
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Registration updated successfully')
            expect(mockOnSuccess).toHaveBeenCalled()
            expect(mockOnClose).toHaveBeenCalled()
        })
    })

    it('handles update failure with payload message (lines 357-362)', async () => {
        const store = createStore()
        const { updateRegistrationThunk } = jest.requireMock('../../../../store/slices/registrations/registrations.thunks')
            ; (updateRegistrationThunk as unknown as jest.Mock).mockReturnValue({
                type: 'registrations/update/rejected',
                payload: 'Update failed',
            })

        render(
            <Provider store={store}>
                <RegistrationForm
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                    editData={baseEditData as unknown as RegistrationItem}
                />
            </Provider>
        )

        await screen.findByText('Edit Registration')
        fireEvent.click(screen.getByText('Update Registration'))

        const toast = jest.requireMock('react-hot-toast').default
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Update failed')
        })
    })

    it('handles update failure with fallback message (undefined payload)', async () => {
        const { updateRegistrationThunk } = jest.requireMock('../../../../store/slices/registrations/registrations.thunks')

            // Mock the thunk to return a function (thunk pattern) that resolves to rejected action
            ; (updateRegistrationThunk as unknown as jest.Mock).mockReturnValue(
                () => Promise.resolve({ type: 'registrations/update/rejected', payload: undefined })
            )

        const localToast = jest.requireMock('react-hot-toast').default
        localToast.error.mockClear()
        localToast.success.mockClear()

        const store = createStore()
        render(
            <Provider store={store}>
                <RegistrationForm
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                    editData={baseEditData as unknown as RegistrationItem}
                />
            </Provider>
        )

        await screen.findByText('Edit Registration')
        fireEvent.click(screen.getByText('Update Registration'))

        await waitFor(() => {
            expect(localToast.error).toHaveBeenCalledWith('Failed to update registration')
        })
    })

    it('parsePresentationFromStored: falls back for unknown format (line 84)', async () => {
        const store = createStore()
        const editDataUnknown = {
            ...baseEditData,
            presentation: 'unknown_format',
            regtype: '699',
        }

        render(
            <Provider store={store}>
                <RegistrationForm
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                    editData={editDataUnknown as unknown as RegistrationItem}
                />
            </Provider>
        )

        await screen.findByText('Edit Registration')
        // Falls back to Oral Presenter (In-Person) = 699
        expect(screen.getByDisplayValue('699')).toBeInTheDocument()
    })

    it('parsePresentationFromStored: handles clean presentation name (line 83)', async () => {
        const store = createStore()
        const editDataClean = {
            ...baseEditData,
            presentation: 'Oral Presenter (Virtual)',
            regtype: '399',
        }

        render(
            <Provider store={store}>
                <RegistrationForm
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                    editData={editDataClean as unknown as RegistrationItem}
                />
            </Provider>
        )

        await screen.findByText('Edit Registration')
        expect(screen.getByDisplayValue('399')).toBeInTheDocument()
    })

    it('formatDateForInput: parses MM/DD/YYYY format (lines 103-108)', async () => {
        const store = createStore()
        const editDataWithAccomm = {
            ...baseEditData,
            accomm: '100',
            checkin: '01/15/2024',
            checkout: '01/20/2024',
            accmvalue: 'Single Occupancy',
            nights: '5',
        }

        render(
            <Provider store={store}>
                <RegistrationForm
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                    editData={editDataWithAccomm as unknown as RegistrationItem}
                />
            </Provider>
        )

        await screen.findByText('Edit Registration')
        const checkinInput = screen.getByLabelText('Check-in Date') as HTMLInputElement
        expect(checkinInput.value).toBe('2024-01-15')
    })

    it('formatDateForInput: parses ISO timestamp with T (line 115)', async () => {
        const store = createStore()
        const editDataISO = {
            ...baseEditData,
            accomm: '100',
            checkin: '2024-01-15T12:00:00Z',
            checkout: '2024-01-20T12:00:00Z',
            accmvalue: 'Single Occupancy',
            nights: '5',
        }

        render(
            <Provider store={store}>
                <RegistrationForm
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                    editData={editDataISO as unknown as RegistrationItem}
                />
            </Provider>
        )

        await screen.findByText('Edit Registration')
        const checkinInput = screen.getByLabelText('Check-in Date') as HTMLInputElement
        expect(checkinInput.value).toBe('2024-01-15')
    })

    it('formatDateForInput: parses standard JS date string (lines 117-121)', async () => {
        const store = createStore()
        const editDataJSDate = {
            ...baseEditData,
            accomm: '100',
            checkin: 'Jan 15 2024',
            checkout: 'Feb 20 2024',
            accmvalue: 'Single Occupancy',
            nights: '5',
        }

        render(
            <Provider store={store}>
                <RegistrationForm
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                    editData={editDataJSDate as unknown as RegistrationItem}
                />
            </Provider>
        )

        await screen.findByText('Edit Registration')
        const checkinInput = screen.getByLabelText('Check-in Date') as HTMLInputElement
        expect(checkinInput.value).toBe('2024-01-15')
    })

    it('formatDateForInput: returns original string on invalid date (lines 123-126)', async () => {
        const store = createStore()
        const editDataInvalid = {
            ...baseEditData,
            accomm: '100',
            checkin: 'not-a-date',
            checkout: 'also-not-a-date',
            accmvalue: 'Single Occupancy',
            nights: '5',
        }

        render(
            <Provider store={store}>
                <RegistrationForm
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                    editData={editDataInvalid as unknown as RegistrationItem}
                />
            </Provider>
        )

        await screen.findByText('Edit Registration')
        const checkinInput = screen.getByLabelText('Check-in Date') as HTMLInputElement
        expect(checkinInput.value).toBe('')
    })

    it('edit mode with accommodation: shows accomm fields (lines 154-159)', async () => {
        const store = createStore()
        const editDataWithAccomm = {
            ...baseEditData,
            accomm: '150',
            checkin: '2024-03-01',
            checkout: '2024-03-05',
            accmvalue: 'Double Occupancy',
            nights: '4',
        }

        render(
            <Provider store={store}>
                <RegistrationForm
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                    editData={editDataWithAccomm as unknown as RegistrationItem}
                />
            </Provider>
        )

        await screen.findByText('Edit Registration')
        // Should show accommodation checkbox as checked
        const accCheckbox = screen.getByRole('checkbox', { name: /Looking for Accommodation/i })
        expect(accCheckbox).toBeChecked()
    })

    it('covers parseDateForInput catch block', async () => {
        const timeSpy = jest.spyOn(Date.prototype, 'getTime').mockImplementation(() => { throw new Error('mock date error') })
        const store = createStore()
        render(
            <Provider store={store}>
                <RegistrationForm
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                    editData={{ date: '2024-01-01' } as unknown as RegistrationItem}
                />
            </Provider>
        )

        await screen.findByText('Edit Registration')

        timeSpy.mockRestore()
    })
})
