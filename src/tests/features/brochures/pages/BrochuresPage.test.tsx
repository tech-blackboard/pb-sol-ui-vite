import { render, screen } from '@testing-library/react'
import BrochuresPage from '../../../../features/brochures/pages/BrochuresPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import brochuresReducer, { fetchBrochures } from '../../../../store/slices/brochures/brochures.slice'
import type { BrochureItem } from '../../../../services/brochures'

jest.mock('../../../../features/brochures/components/BrochureTable', () => ({
    __esModule: true,
    default: ({ rows, loading }: { rows: BrochureItem[], loading: boolean }) => (
        <div data-testid="brochure-table">{loading ? 'Loading...' : rows.map((r) => <div key={r.id}>{r.name}</div>)}</div>
    ),
}))

jest.mock('../../../../features/brochures/components/BrochureDetailsModal', () => ({
    __esModule: true,

    default: ({ item }: { item: BrochureItem | null }) => <div data-testid="details-modal">{item?.name}</div>,
}))

jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
    __esModule: true,
    default: () => <div data-testid="pagination">Pagination</div>,
}))

jest.mock('../../../../store/slices/brochures/brochures.slice', () => {
    const actual = jest.requireActual('../../../../store/slices/brochures/brochures.slice')
    return {
        __esModule: true,
        ...actual,
        fetchBrochures: Object.assign(
            jest.fn(() => ({ type: 'brochures/fetch/pending' })),
            actual.fetchBrochures
        ),
    }
})


const createMockStore = (initialState = {}) => configureStore({
    reducer: { brochures: brochuresReducer },
    preloadedState: {
        brochures: {
            items: [],
            loading: false,
            error: null,
            page: 1,
            pageSize: 10,
            total: 0,
            appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' as const },
            draftFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' as const },
            selected: null,
            ...initialState,
        },
    },
})

describe('BrochuresPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders child components', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <BrochuresPage />
            </Provider>
        )
        expect(screen.getByTestId('brochure-table')).toBeInTheDocument()
        expect(screen.getByTestId('pagination')).toBeInTheDocument()
    })

    it('fetches brochures on mount', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <BrochuresPage />
            </Provider>
        )
        expect(fetchBrochures).toHaveBeenCalled()
    })

    it('displays items', () => {
        const store = createMockStore({ items: [{ id: 1, name: 'John Doe' }] })
        render(
            <Provider store={store}>
                <BrochuresPage />
            </Provider>
        )
        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('does not render modal when no item selected', () => {
        const store = createMockStore({ selected: null })
        render(
            <Provider store={store}>
                <BrochuresPage />
            </Provider>
        )
        expect(screen.queryByTestId('details-modal')).not.toBeInTheDocument()
    })

    it('renders modal when item selected', () => {
        const store = createMockStore({ selected: { id: 1, name: 'John' } })
        render(
            <Provider store={store}>
                <BrochuresPage />
            </Provider>
        )
        expect(screen.getByTestId('details-modal')).toBeInTheDocument()
    })
})
