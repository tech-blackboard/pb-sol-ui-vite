import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ContactForm from '../../../../features/contacts/components/ContactForm'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import contactsReducer from '../../../../store/slices/contacts/contacts.slice'

jest.mock('../../../../services/sourcedb', () => ({ listWebsites: jest.fn() }))
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }))

import { listWebsites } from '../../../../services/sourcedb'
import toast from 'react-hot-toast'

const createMockStore = () => configureStore({ reducer: { contacts: contactsReducer } })

describe('ContactForm', () => {
    const mockOnClose = jest.fn()
    const mockOnSuccess = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (listWebsites as jest.Mock).mockResolvedValue([{ id: 1, name: 'Test Conf' }])

        // Mock scrollTo for JSDOM
        Element.prototype.scrollTo = jest.fn()
    })

    const renderForm = (props = {}) => {
        const store = createMockStore()
        return render(<Provider store={store}><ContactForm onClose={mockOnClose} onSuccess={mockOnSuccess} {...props} /></Provider>)
    }

    it('renders the form', async () => {
        renderForm()
        expect(await screen.findByText('Add New Contact')).toBeInTheDocument()
    })

    it('loads websites', async () => {
        renderForm()
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())
    })

    it('shows validation errors on empty submit', async () => {
        renderForm()
        await screen.findByText('Add New Contact')
        fireEvent.click(screen.getByText('Submit Now'))
        await waitFor(() => expect(toast.error).toHaveBeenCalled())
    })

    it('calls onClose when cancel clicked', async () => {
        renderForm()
        await screen.findByText('Add New Contact')
        fireEvent.click(screen.getByText('Cancel'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('shows error for invalid email format', async () => {
        renderForm()
        await screen.findByText('Add New Contact')
        await screen.findByText('Test Conf')

        fireEvent.change(screen.getByLabelText(/Name/i), {
            target: { value: 'John' }
        })

        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: 'invalid-email' }
        })

        fireEvent.change(screen.getByLabelText(/Country/i), {
            target: { value: 'United States' }
        })

        fireEvent.change(
            screen.getByLabelText(/Website/i),
            { target: { value: '1' } }
        )

        const form = screen.getByText('Submit Now').closest('form')
        fireEvent.submit(form!)

        expect(await screen.findByText(/Invalid email format/i))
            .toBeInTheDocument()
    })

})
