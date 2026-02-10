import { render, screen } from '@testing-library/react'
import AccRegistrationsPage from '../../../../features/accRegistrations/pages/AccRegistrationsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import accRegistrationsReducer, { fetchAccRegistrations } from '../../../../store/slices/accRegistrations/accRegistrations.slice'

jest.mock('../../../../features/accRegistrations/components/AccRegistrationTable', () => ({
    __esModule: true,
    default: () => <div data-testid="acc-table">Table</div>,
}))
jest.mock('../../../../features/accRegistrations/components/AccRegistrationDetailsModal', () => ({
    __esModule: true,
    default: () => <div data-testid="details-modal">Modal</div>,
}))
jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
    __esModule: true,
    default: () => <div data-testid="pagination">Pagination</div>,
}))
jest.mock('../../../../store/slices/accRegistrations/accRegistrations.slice', () => {
    const actual = jest.requireActual('../../../../store/slices/accRegistrations/accRegistrations.slice')
    return {
        ...actual,
        fetchAccRegistrations: jest.fn(() => ({ type: 'accRegistrations/fetch/pending' })),
    }
})



const createMockStore = (initialState = {}) => configureStore({
    reducer: { accRegistrations: accRegistrationsReducer },
    preloadedState: {
        accRegistrations: {
            items: [],
            loading: false,
            error: null,
            page: 1,
            pageSize: 10,
            total: 0,
            appliedFilters: {},
            draftFilters: {},
            selected: null,
            ...initialState,
        },
    },
})

describe('AccRegistrationsPage', () => {
    beforeEach(() => jest.clearAllMocks())

    it('renders child components', () => {
        const store = createMockStore()
        render(<Provider store={store}><AccRegistrationsPage /></Provider>)
        expect(screen.getByTestId('acc-table')).toBeInTheDocument()
    })

    it('fetches data on mount', () => {
        const store = createMockStore()
        render(<Provider store={store}><AccRegistrationsPage /></Provider>)
        expect(fetchAccRegistrations).toHaveBeenCalled()
    })

    it('does not render modal when no item selected', () => {
        const store = createMockStore({ selected: null })
        render(<Provider store={store}><AccRegistrationsPage /></Provider>)
        expect(screen.queryByTestId('details-modal')).not.toBeInTheDocument()
    })

    it('renders modal when item selected', () => {
        const store = createMockStore({ selected: { id: 1 } })
        render(<Provider store={store}><AccRegistrationsPage /></Provider>)
        expect(screen.getByTestId('details-modal')).toBeInTheDocument()
    })
})
