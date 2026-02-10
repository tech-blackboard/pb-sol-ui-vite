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

    it.skip('shows validation errors on empty submit', async () => {
        renderForm()
        await screen.findByText('Add New Accommodation')
        fireEvent.click(screen.getByText('Create'))
        await waitFor(() => expect(toast.error).toHaveBeenCalled())
    })

    it('calls onClose when cancel clicked', async () => {
        renderForm()
        await screen.findByText('Add New Accommodation')
        fireEvent.click(screen.getByText('Cancel'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it.skip('calculates nights from dates', async () => {
        renderForm()
        await screen.findByText('Add New Accommodation')

        const checkinInput = screen.getByLabelText('Check-in Date')
        const checkoutInput = screen.getByLabelText('Check-out Date')

        fireEvent.change(checkinInput, { target: { value: '2024-01-01' } })
        fireEvent.change(checkoutInput, { target: { value: '2024-01-05' } })

        const nightsInput = screen.getByDisplayValue('4')
        expect(nightsInput).toBeInTheDocument()
    })
})
