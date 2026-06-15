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

import { listWebsites, type SourceWebsite } from '../../../../services/sourcedb'
import type { AccRegistrationItem } from '../../../../services/accRegistrations'
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

    it('handles submission error with default message', async () => {
        const mockDispatch = jest.fn().mockResolvedValue({
            type: 'accRegistrations/create/rejected',
            payload: null, // No payload should trigger default message
        })

        const hooks = await import('../../../../store/hooks')
        jest.spyOn(hooks, 'useAppDispatch').mockReturnValue(mockDispatch)

        renderForm()
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())

        // Valid data
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
            expect(toast.error).toHaveBeenCalledWith('Failed to create registration')
        })
    })

    it('handles unmounting during website load', async () => {
        let resolveWebsites: (value: SourceWebsite[]) => void
        const websitePromise = new Promise<SourceWebsite[]>((resolve) => {
            resolveWebsites = resolve
        })
        ;(listWebsites as jest.Mock).mockReturnValue(websitePromise)

        const { unmount } = renderForm()
        unmount()
        
        // Resolve after unmount
        resolveWebsites!([{ id: 1, name: 'Test' }])
        
        // Should not throw and should have returned early (covering line 88)
        await new Promise(r => setTimeout(r, 0))
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

    it('handles website loading error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
        ;(listWebsites as jest.Mock).mockRejectedValue(new Error('API Error'))
        
        renderForm()
        
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to load websites:', expect.any(Error))
            expect(toast.error).toHaveBeenCalledWith('Failed to load website options')
        })
        consoleSpy.mockRestore()
    })

    it('clears validation error when field value changes', async () => {
        renderForm()
        await screen.findByText('Add New Accommodation')
        
        // Trigger validation error
        fireEvent.click(screen.getByText('Add Accommodation'))
        expect(await screen.findByText('Name is required')).toBeInTheDocument()
        
        // Change value to clear error
        const nameInput = screen.getByLabelText('Full Name*')
        fireEvent.change(nameInput, { target: { value: 'John' } })
        
        expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })

    it('handles unexpected error during submission', async () => {
        const hooks = await import('../../../../store/hooks')
        const mockDispatch = jest.fn().mockImplementation(() => {
            throw new Error('Unexpected Error')
        })
        const spy = jest.spyOn(hooks, 'useAppDispatch').mockReturnValue(mockDispatch)

        renderForm()
        
        // Wait for websites to load to avoid state updates after test
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())

        // Valid data
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
            expect(toast.error).toHaveBeenCalledWith('An error occurred')
        })
        spy.mockRestore()
    })

    it('captures WhatsApp number correctly', async () => {
        renderForm()
        await screen.findByText('Add New Accommodation')

        const wphoneInput = screen.getByLabelText('WhatsApp Number')
        fireEvent.change(wphoneInput, { target: { value: '9876543210' } })

        expect(wphoneInput).toHaveValue('9876543210')
    })

    describe('Edit Mode', () => {
        const mockEditData = {
            id: 'A123',
            caption: 'Dr.',
            name: 'Jane Doe',
            email: 'jane@test.com',
            aemail: '',
            phone: '1112223333',
            wphone: '',
            institution: 'Test Univ',
            country: 'USA',
            website: { id: 1, name: 'Test Conf' },
            website_id: 1,
            accomm: '150',
            accm: 'Single Occupancy',
            checkin: '2024-01-15',
            checkout: '2024-01-20',
            acc_pr: 150,
            tot_price: 750,
        }

        it('pre-fills data and shows ID/Website in edit mode (lines 97-114, 304-313)', async () => {
            renderForm({ editData: mockEditData })
            await screen.findByText('Edit Accommodation')

            // Verify read-only sections
            expect(screen.getByText('A123')).toBeInTheDocument()
            expect(screen.getByText('Test Conf')).toBeInTheDocument()

            // Verify pre-filled inputs
            expect(screen.getByLabelText('Full Name*')).toHaveValue('Jane Doe')
            expect(screen.getByLabelText('Price per Night ($)*')).toHaveValue(150)
            
            // Checkin parsed to YYYY-MM-DD
            expect(screen.getByLabelText('Check-in Date')).toHaveValue('2024-01-15')
            // Checkout parsed from ISO
            expect(screen.getByLabelText('Check-out Date')).toHaveValue('2024-01-20')
        })

        it('parses various date formats defensively (MM/DD/YYYY and ISO)', async () => {
            const { unmount } = renderForm({ 
                editData: { 
                    ...mockEditData, 
                    checkin: '02/15/2024', // MM/DD/YYYY
                    checkout: '2024-03-10T12:00:00Z', // ISO with T
                } 
            })
            await screen.findByText('Edit Accommodation')
            expect(screen.getByLabelText('Check-in Date')).toHaveValue('2024-02-15')
            expect(screen.getByLabelText('Check-out Date')).toHaveValue('2024-03-10')
            unmount()
        })

        it('parses various date formats defensively (fallback Date and invalid)', async () => {
            // Test Date parsing fallback
            renderForm({ 
                editData: { 
                    ...mockEditData, 
                    checkin: 'Jan 1 2024', // Fallback Date parsing
                    checkout: 'invalid-date', // Unparsable
                } 
            })
            await screen.findByText('Edit Accommodation')
            expect(screen.getByLabelText('Check-in Date')).toHaveValue('2024-01-01')
            // Invalid date will fail to parse and become an empty string since input type="date"
            expect(screen.getByLabelText('Check-out Date')).toHaveValue('')
        })

        it('successfully updates an existing registration', async () => {
            const { updateAccRegistrationThunk } = await import('../../../../store/slices/accRegistrations/accRegistrations.slice')
            // Mock update thunk dispatch result using actual action creator
            const mockDispatch = jest.fn().mockResolvedValue(
                updateAccRegistrationThunk.fulfilled({} as unknown as AccRegistrationItem, 'requestId', { id: 'A123', data: {} })
            )
            const hooks = await import('../../../../store/hooks')
            jest.spyOn(hooks, 'useAppDispatch').mockReturnValue(mockDispatch)
            
            renderForm({ editData: mockEditData })
            await screen.findByText('Edit Accommodation')

            fireEvent.click(screen.getByText('Update Accommodation'))

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('Accommodation Registration updated successfully')
                expect(mockOnSuccess).toHaveBeenCalled()
                expect(mockOnClose).toHaveBeenCalled()
            })
        })

        it('handles update failure with payload message', async () => {
            const { updateAccRegistrationThunk } = await import('../../../../store/slices/accRegistrations/accRegistrations.slice')
            const mockDispatch = jest.fn().mockResolvedValue(
                updateAccRegistrationThunk.rejected(null, 'requestId', { id: 'A123', data: {} }, 'Update failed from server')
            )
            const hooks = await import('../../../../store/hooks')
            jest.spyOn(hooks, 'useAppDispatch').mockReturnValue(mockDispatch)

            renderForm({ editData: mockEditData })
            await screen.findByText('Edit Accommodation')

            fireEvent.click(screen.getByText('Update Accommodation'))

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Update failed from server')
            })
        })

        it('handles update failure with fallback message', async () => {
            const { updateAccRegistrationThunk } = await import('../../../../store/slices/accRegistrations/accRegistrations.slice')
            const mockDispatch = jest.fn().mockResolvedValue(
                updateAccRegistrationThunk.rejected(null, 'requestId', { id: 'A123', data: {} }, undefined)
            )
            const hooks = await import('../../../../store/hooks')
            jest.spyOn(hooks, 'useAppDispatch').mockReturnValue(mockDispatch)

            renderForm({ editData: mockEditData })
            await screen.findByText('Edit Accommodation')

            fireEvent.click(screen.getByText('Update Accommodation'))

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to update accommodation registration')
            })
        })
    })
})