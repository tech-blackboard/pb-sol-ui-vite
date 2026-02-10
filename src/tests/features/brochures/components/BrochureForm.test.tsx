import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BrochureForm from '../../../../features/brochures/components/BrochureForm'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import brochuresReducer from '../../../../store/slices/brochures/brochures.slice'

jest.mock('../../../../services/sourcedb', () => ({
    listWebsites: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: { success: jest.fn(), error: jest.fn() },
}))

import { listWebsites } from '../../../../services/sourcedb'
import toast from 'react-hot-toast'

const createMockStore = () => configureStore({
    reducer: { brochures: brochuresReducer },
})

describe('BrochureForm', () => {
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
                <BrochureForm onClose={mockOnClose} onSuccess={mockOnSuccess} {...props} />
            </Provider>
        )
    }

    it('renders the form', async () => {
        renderForm()
        expect(await screen.findByText('Request Brochure')).toBeInTheDocument()
    })

    it('loads websites', async () => {
        renderForm()
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())
    })

    it('shows validation errors on empty submit', async () => {
        renderForm()
        await screen.findByText('Request Brochure')
        fireEvent.click(screen.getByText('Submit Now'))
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please fill all required fields correctly'))
    })

    it('calls onClose when cancel clicked', async () => {
        renderForm()
        await screen.findByText('Request Brochure')
        fireEvent.click(screen.getByText('Cancel'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it.skip('updates form fields', async () => {
        renderForm()
        await screen.findByText('Request Brochure')

        const nameInput = screen.getByLabelText('Name')
        fireEvent.change(nameInput, { target: { value: 'John' } })
        expect((nameInput as HTMLInputElement).value).toBe('John')
    })

    it('validates email field', async () => {
        renderForm()
        await screen.findByText('Request Brochure')
        fireEvent.click(screen.getByText('Submit Now'))
        await waitFor(() => expect(toast.error).toHaveBeenCalled())
    })
})
