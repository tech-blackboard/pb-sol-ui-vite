import { render, screen } from '@testing-library/react'
import SponsorshipsPage from '../../../../features/sponsorships/pages/SponsorshipsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import sponsorshipsReducer, { fetchSponsorships } from '../../../../store/slices/sponsorships/sponsorships.slice'

jest.mock('../../../../features/sponsorships/components/SponsorshipTable', () => ({
    __esModule: true,
    default: () => <div data-testid="sponsorship-table">Table</div>,
}))
jest.mock('../../../../features/sponsorships/components/SponsorshipDetailsModal', () => ({
    __esModule: true,
    default: () => <div data-testid="details-modal">Modal</div>,
}))
jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
    __esModule: true,
    default: () => <div data-testid="pagination">Pagination</div>,
}))
jest.mock('../../../../store/slices/sponsorships/sponsorships.slice', () => {
    const actual = jest.requireActual('../../../../store/slices/sponsorships/sponsorships.slice')
    return {
        ...actual,
        fetchSponsorships: jest.fn(() => ({ type: 'sponsorships/fetch/pending' })),
    }
})


const createMockStore = (initialState = {}) => configureStore({
    reducer: { sponsorships: sponsorshipsReducer },
    preloadedState: { sponsorships: { items: [], loading: false, error: null, page: 1, pageSize: 10, total: 0, appliedFilters: {}, draftFilters: {}, selected: null, ...initialState } },
})

describe('SponsorshipsPage', () => {
    beforeEach(() => jest.clearAllMocks())

    it('renders child components', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        expect(screen.getByTestId('sponsorship-table')).toBeInTheDocument()
    })

    it('fetches data on mount', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        expect(fetchSponsorships).toHaveBeenCalled()
    })

    it('does not render modal when no item selected', () => {
        const store = createMockStore({ selected: null })
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        expect(screen.queryByTestId('details-modal')).not.toBeInTheDocument()
    })

    it('renders modal when item selected', () => {
        const store = createMockStore({ selected: { id: 1 } })
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        expect(screen.getByTestId('details-modal')).toBeInTheDocument()
    })
})
