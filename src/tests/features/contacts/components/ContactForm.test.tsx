import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ContactForm from '../../../../features/contacts/components/ContactForm'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import contactsReducer, { createContactThunk } from '../../../../store/slices/contacts/contacts.slice'
import * as hooks from '../../../../store/hooks'
import { listWebsites } from '../../../../services/sourcedb'
import toast from 'react-hot-toast'

jest.mock('../../../../services/sourcedb', () => ({ listWebsites: jest.fn() }))
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }))
jest.mock('../../../../store/hooks', () => ({
    ...jest.requireActual('../../../../store/hooks'),
    useAppDispatch: jest.fn(),
}))

const createMockStore = () => configureStore({ reducer: { contacts: contactsReducer } })

describe('ContactForm', () => {
    const mockOnClose = jest.fn()
    const mockOnSuccess = jest.fn()
    const mockDispatch = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        ;(listWebsites as jest.Mock).mockResolvedValue([{ id: 1, name: 'Test Conf' }])
        ;(hooks.useAppDispatch as jest.Mock).mockReturnValue(mockDispatch)
        // Mock scrollTo for JSDOM
        Element.prototype.scrollTo = jest.fn()
    })

    const renderForm = (props = {}) => {
        const store = createMockStore()
        return { store, ...render(<Provider store={store}><ContactForm onClose={mockOnClose} onSuccess={mockOnSuccess} {...props} /></Provider>) }
    }

    it('renders the form', async () => {
        renderForm()
        expect(await screen.findByText('Add New Contact')).toBeInTheDocument()
    })

    it('loads websites', async () => {
        renderForm()
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())
    })

    it('shows toast error if listWebsites fails', async () => {
        ;(listWebsites as jest.Mock).mockRejectedValue(new Error('API Fail'))
        renderForm()
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load website options'))
    })

    it('shows validation errors on empty submit', async () => {
        renderForm()
        await screen.findByText('Add New Contact')
        fireEvent.click(screen.getByText('Submit Now'))
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please fill all required fields correctly'))
    })

    it('clears error when input changes', async () => {
        renderForm()
        await screen.findByText('Add New Contact')
        fireEvent.click(screen.getByText('Submit Now'))
        
        const nameInput = screen.getByLabelText(/Name/i)
        expect(await screen.findByText('Name is required')).toBeInTheDocument()
        
        fireEvent.change(nameInput, { target: { value: 'John' } })
        expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })

    it('calls onClose when cancel clicked', async () => {
        renderForm()
        await screen.findByText('Add New Contact')
        fireEvent.click(screen.getByText('Cancel'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('submits successfully and calls callbacks', async () => {
        renderForm()
        await screen.findByText('Add New Contact')
        await screen.findByText('Test Conf')

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John' } })
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@test.com' } })
        fireEvent.change(screen.getByLabelText(/Country/i), { target: { value: 'United States' } })
        fireEvent.change(screen.getByLabelText(/Website/i), { target: { value: '1' } })

        // Return an action that createContactThunk.fulfilled.match will recognize
        mockDispatch.mockResolvedValue({ 
            type: createContactThunk.fulfilled.type,
            meta: { requestStatus: 'fulfilled' },
            payload: {}
        })

        fireEvent.click(screen.getByText('Submit Now'))

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Contact added successfully')
            expect(mockOnSuccess).toHaveBeenCalled()
            expect(mockOnClose).toHaveBeenCalled()
        })
    })

    it('shows error banner when thunk rejects', async () => {
        renderForm()
        await screen.findByText('Add New Contact')
        await screen.findByText('Test Conf')

        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John' } })
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@test.com' } })
        fireEvent.change(screen.getByLabelText(/Country/i), { target: { value: 'United States' } })
        fireEvent.change(screen.getByLabelText(/Website/i), { target: { value: '1' } })

        // Return an action that createContactThunk.fulfilled.match will NOT recognize
        mockDispatch.mockResolvedValue({ 
            type: createContactThunk.rejected.type,
            meta: { requestStatus: 'rejected' },
            payload: 'Server Error'
        })

        fireEvent.click(screen.getByText('Submit Now'))

        expect(await screen.findByText('Server Error')).toBeInTheDocument()
        expect(toast.error).toHaveBeenCalledWith('Server Error')
        
        fireEvent.click(screen.getByLabelText('Close alert'))
        expect(screen.queryByText('Server Error')).not.toBeInTheDocument()
    })

    it('shows generic catch-all error toast', async () => {
        renderForm()
        await screen.findByText('Add New Contact')
        await screen.findByText('Test Conf')
        
        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John' } })
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@test.com' } })
        fireEvent.change(screen.getByLabelText(/Country/i), { target: { value: 'United States' } })
        fireEvent.change(screen.getByLabelText(/Website/i), { target: { value: '1' } })

        mockDispatch.mockImplementation(() => {
            throw new Error('Unknown')
        })

        fireEvent.click(screen.getByText('Submit Now'))
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('An error occurred'))
    })
})
