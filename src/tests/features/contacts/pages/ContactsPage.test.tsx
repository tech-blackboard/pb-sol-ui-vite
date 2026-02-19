import { render, screen } from '@testing-library/react'
import ContactsPage from '../../../../features/contacts/pages/ContactsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import contactsReducer from '../../../../store/slices/contacts/contacts.slice'

jest.mock('../../../../features/contacts/components/ContactTable', () => ({
    __esModule: true,
    default: () => <div data-testid="contact-table">Table</div>,
}))
jest.mock('../../../../features/contacts/components/ContactDetailsModal', () => ({
    __esModule: true,
    default: () => <div data-testid="details-modal">Modal</div>,
}))
jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
    __esModule: true,
    default: () => <div data-testid="pagination">Pagination</div>,
}))
jest.mock('../../../../store/slices/contacts/contacts.slice', () => {
    const actual = jest.requireActual('../../../../store/slices/contacts/contacts.slice')
    return {
        __esModule: true,
        ...actual,
        fetchContacts: Object.assign(
            jest.fn(() => ({ type: 'contacts/fetch/pending' })),
            actual.fetchContacts
        )
    }
})

import { fetchContacts } from '../../../../store/slices/contacts/contacts.slice'

const createMockStore = (initialState = {}) => configureStore({
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
            ...initialState
        }
    },
})

describe('ContactsPage', () => {
    beforeEach(() => jest.clearAllMocks())

    it('renders child components', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactsPage /></Provider>)
        expect(screen.getByTestId('contact-table')).toBeInTheDocument()
    })

    it('fetches data on mount', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactsPage /></Provider>)
        expect(fetchContacts).toHaveBeenCalled()
    })

    it('does not render modal when no item selected', () => {
        const store = createMockStore({ selected: null })
        render(<Provider store={store}><ContactsPage /></Provider>)
        expect(screen.queryByTestId('details-modal')).not.toBeInTheDocument()
    })

    it('renders modal when item selected', () => {
        const store = createMockStore({ selected: { id: 1 } })
        render(<Provider store={store}><ContactsPage /></Provider>)
        expect(screen.getByTestId('details-modal')).toBeInTheDocument()
    })
})
