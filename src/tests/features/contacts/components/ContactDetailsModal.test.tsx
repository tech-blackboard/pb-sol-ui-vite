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
})
