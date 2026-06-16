import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ContactDetailsModal from '../../../../features/contacts/components/ContactDetailsModal'
import type { ContactItem } from '../../../../services/contacts'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import contactsReducer from '../../../../store/slices/contacts/contacts.slice'

const store = configureStore({
    reducer: { contacts: contactsReducer },
    preloadedState: {
        contacts: {
            editLoading: false,
            items: [],
            loading: false,
            error: null,
            page: 1,
            pageSize: 10,
            total: 0,
            appliedFilters: {},
            draftFilters: {},
            selected: null,
        }
    }
})

jest.mock('../../../../utils/utils', () => ({ formatDate: jest.fn(() => '2024-01-01 12:00 PM') }))

describe('ContactDetailsModal', () => {
    const mockOnClose = jest.fn()
    const mockItem = { id: 1, name: 'John', email: 'john@test.com', phone: '1234567890', country: 'USA', message: 'Test', now: '2024-01-01', website: { id: 1, name: 'Test' } }

    beforeEach(() => jest.clearAllMocks())

    it('returns null when item is null', () => {
        const { container } = render(
            <Provider store={store}>
                <ContactDetailsModal item={null} onClose={mockOnClose} />
            </Provider>
        )
        expect(container.firstChild).toBeNull()
    })

    it('renders modal', () => {
        render(
            <Provider store={store}>
                <ContactDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )
        expect(screen.getByText('Contact Request Details')).toBeInTheDocument()
    })

    it('calls onClose', () => {
        render(
            <Provider store={store}>
                <ContactDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )
        fireEvent.click(screen.getByLabelText('Close'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('renders fallback values for missing optional fields', () => {
        const incompleteItem = {
            id: 2,
            name: 'Jane',
            email: 'jane@test.com',
        } as Partial<ContactItem> as ContactItem
        render(
            <Provider store={store}>
                <ContactDetailsModal item={incompleteItem} onClose={mockOnClose} />
            </Provider>
        )
        
        const fallbacks = screen.getAllByText('—')
        expect(fallbacks.length).toBe(4)
        expect(screen.getByText('No additional message provided.')).toBeInTheDocument()
    })

    it('enters edit mode, updates inputs and dropdown, and saves successfully', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch') as jest.SpyInstance
        const { updateContactThunk } = jest.requireMock('../../../../store/slices/contacts/contacts.slice')
        updateContactThunk.fulfilled = { match: () => true }
        dispatchSpy.mockResolvedValue({ type: 'contacts/update/fulfilled' })

        render(
            <Provider store={store}>
                <ContactDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )

        fireEvent.click(screen.getByText('✎ Edit'))
        expect(screen.getByText('Save Changes')).toBeInTheDocument()

        const nameInput = screen.getByLabelText('Full Name')
        fireEvent.change(nameInput, { target: { value: 'New Name' } })

        const emailInput = screen.getByLabelText('Email')
        fireEvent.change(emailInput, { target: { value: 'new@email.com' } })

        const phoneInput = screen.getByLabelText('Phone')
        fireEvent.change(phoneInput, { target: { value: '9876543210' } })

        const countrySelect = screen.getByLabelText('Country')
        fireEvent.change(countrySelect, { target: { value: 'India' } })

        const msgInput = screen.getByLabelText('Message')
        fireEvent.change(msgInput, { target: { value: 'Send it now' } })

        fireEvent.click(screen.getByText('Save Changes'))
        expect(dispatchSpy).toHaveBeenCalled()
    })

    it('handles edit save thunk rejected failure', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch') as jest.SpyInstance
        const { updateContactThunk } = jest.requireMock('../../../../store/slices/contacts/contacts.slice')
        updateContactThunk.fulfilled = { match: () => false }
        dispatchSpy.mockResolvedValue({ type: 'contacts/update/rejected', payload: 'Error payload' })

        render(
            <Provider store={store}>
                <ContactDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )

        fireEvent.click(screen.getByText('✎ Edit'))
        fireEvent.click(screen.getByText('Save Changes'))
        expect(dispatchSpy).toHaveBeenCalled()
    })

    it('handles edit save unexpected throw', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch') as jest.SpyInstance
        dispatchSpy.mockRejectedValue(new Error('Save crash'))

        render(
            <Provider store={store}>
                <ContactDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )

        fireEvent.click(screen.getByText('✎ Edit'))
        fireEvent.click(screen.getByText('Save Changes'))
        expect(dispatchSpy).toHaveBeenCalled()
    })

    it('cancels edit mode', () => {
        render(
            <Provider store={store}>
                <ContactDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )

        fireEvent.click(screen.getByText('✎ Edit'))
        fireEvent.click(screen.getByText('Cancel'))
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument()
    })

    it('triggers onDelete callback when delete confirmed', () => {
        const onDelete = jest.fn()
        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

        render(
            <Provider store={store}>
                <ContactDetailsModal item={mockItem} onClose={mockOnClose} onDelete={onDelete} />
            </Provider>
        )

        fireEvent.click(screen.getByText('Delete'))
        expect(confirmSpy).toHaveBeenCalled()
        expect(onDelete).toHaveBeenCalledWith(mockItem)
        confirmSpy.mockRestore()
    })

    it('does not trigger onDelete callback when delete cancelled', () => {
        const onDelete = jest.fn()
        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

        render(
            <Provider store={store}>
                <ContactDetailsModal item={mockItem} onClose={mockOnClose} onDelete={onDelete} />
            </Provider>
        )

        fireEvent.click(screen.getByText('Delete'))
        expect(confirmSpy).toHaveBeenCalled()
        expect(onDelete).not.toHaveBeenCalled()
        confirmSpy.mockRestore()
    })
})
