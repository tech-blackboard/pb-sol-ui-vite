import { render, screen, fireEvent } from '@testing-library/react'
import ContactsPage from '../../../../features/contacts/pages/ContactsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import contactsReducer from '../../../../store/slices/contacts/contacts.slice'
import type { ContactsState } from '../../../../store/slices/contacts/contacts.slice'
import type { ContactItem } from '../../../../services/contacts'

interface TableProps {
    onView: (item: Partial<ContactItem>) => void
}

interface ModalProps {
    onClose: () => void
}

interface DrawerProps {
    onClose: () => void
}

interface FormProps {
    onClose: () => void
    onSuccess: () => void
}

// Mock components
jest.mock('../../../../features/contacts/components/ContactTable', () => ({
    __esModule: true,
    default: ({ onView }: TableProps) => (
        <div data-testid="contact-table">
            <button onClick={() => onView({ id: 1 })}>View Row</button>
        </div>
    ),
}))
jest.mock('../../../../features/contacts/components/ContactDetailsModal', () => ({
    __esModule: true,
    default: ({ onClose }: ModalProps) => (
        <div data-testid="details-modal">
            <button onClick={onClose}>Close Modal</button>
        </div>
    ),
}))
jest.mock('../../../../features/contacts/components/ContactFiltersDrawer', () => ({
    __esModule: true,
    default: ({ onClose }: DrawerProps) => (
        <div data-testid="filters-drawer">
            <button onClick={onClose}>Close Drawer</button>
        </div>
    ),
}))
jest.mock('../../../../features/contacts/components/ContactForm', () => ({
    __esModule: true,
    default: ({ onClose, onSuccess }: FormProps) => (
        <div data-testid="contact-form">
            <button onClick={onClose}>Close Form</button>
            <button onClick={() => { onSuccess(); onClose(); }}>Success Form</button>
        </div>
    ),
}))
jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
    __esModule: true,
    default: () => <div data-testid="pagination">Pagination</div>,
}))

// Mock thunks and slice actions
jest.mock('../../../../store/slices/contacts/contacts.slice', () => {
    const actual = jest.requireActual('../../../../store/slices/contacts/contacts.slice')
    return {
        __esModule: true,
        ...actual,
        fetchContacts: jest.fn(() => ({ type: 'contacts/fetch/pending' })),
        setSelected: jest.fn(() => ({ type: 'contacts/setSelected' })),
        setPage: jest.fn(() => ({ type: 'contacts/setPage' })),
        setPageSize: jest.fn(() => ({ type: 'contacts/setPageSize' })),
        clearSelected: jest.fn(() => ({ type: 'contacts/clearSelected' })),
        clearError: jest.fn(() => ({ type: 'contacts/clearError' })),
    }
})

import { fetchContacts, setSelected } from '../../../../store/slices/contacts/contacts.slice'



const createMockStore = (initialStatePartial: Partial<ContactsState> = {}) => configureStore({
    reducer: { contacts: contactsReducer },
    preloadedState: {
        contacts: {
            items: [],
            loading: false,
            error: null,
            page: 1,
            pageSize: 10,
            total: 0,
            appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' as const },
            draftFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' as const },
            selected: null,
            ...initialStatePartial
        }
    }
})

describe('ContactsPage', () => {
    beforeEach(() => jest.clearAllMocks())

    it('renders child components', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactsPage /></Provider>)
        expect(screen.getByTestId('pagination')).toBeInTheDocument()
        expect(screen.getByTestId('contact-table')).toBeInTheDocument()
    })

    it('fetches data on mount', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactsPage /></Provider>)
        expect(fetchContacts).toHaveBeenCalled()
    })

    it('opens and closes filters drawer', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactsPage /></Provider>)
        
        fireEvent.click(screen.getByText('Filters'))
        expect(screen.getByTestId('filters-drawer')).toBeInTheDocument()
        
        fireEvent.click(screen.getByText('Close Drawer'))
        expect(screen.queryByTestId('filters-drawer')).not.toBeInTheDocument()
    })

    it('opens and closes contact form, refetches on success', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactsPage /></Provider>)
        
        fireEvent.click(screen.getByText('Add Contact'))
        expect(screen.getByTestId('contact-form')).toBeInTheDocument()
        
        fireEvent.click(screen.getByText('Success Form'))
        expect(fetchContacts).toHaveBeenCalledTimes(2) // mount + success
        expect(screen.queryByTestId('contact-form')).not.toBeInTheDocument()
    })

    it('dispatches setSelected when table row viewed', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactsPage /></Provider>)
        
        fireEvent.click(screen.getByText('View Row'))
        expect(setSelected).toHaveBeenCalled()
    })

    it('renders and closes details modal when item selected', () => {
        const mockItem = { id: 1, name: 'Test' } as ContactItem
        const store = createMockStore({ selected: mockItem })
        render(<Provider store={store}><ContactsPage /></Provider>)
        
        expect(screen.getByTestId('details-modal')).toBeInTheDocument()
        fireEvent.click(screen.getByText('Close Modal'))
    })
})
