import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SponsorshipsPage from '../../../../features/sponsorships/pages/SponsorshipsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import sponsorshipsReducer, { fetchSponsorships } from '../../../../store/slices/sponsorships/sponsorships.slice'

jest.mock('../../../../features/sponsorships/components/SponsorshipTable', () => ({
    __esModule: true,
    default: ({ onView }: { onView: (row: { id: number; name: string }) => void }) => (
        <div data-testid="sponsorship-table">
            <button onClick={() => onView({ id: 1, name: 'Test Sponsorship' })}>View Row</button>
        </div>
    ),
}))
jest.mock('../../../../features/sponsorships/components/SponsorshipDetailsModal', () => ({
    __esModule: true,
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="details-modal">
            <button aria-label="Close modal" onClick={onClose}>Close</button>
        </div>
    ),
}))
jest.mock('../../../../features/sponsorships/components/SponsorshipFiltersDrawer', () => ({
    __esModule: true,
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="filters-drawer">
            <button aria-label="Close filters" onClick={onClose}>Close Filters</button>
        </div>
    ),
}))
jest.mock('../../../../features/sponsorships/components/SponsorshipForm', () => ({
    __esModule: true,
    default: ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => (
        <div data-testid="sponsorship-form">
            <button aria-label="Close form" onClick={onClose}>Close Form</button>
            <button aria-label="Submit form" onClick={onSuccess}>Submit</button>
        </div>
    ),
}))

interface SectionHeaderProps {
    onFilterClick: () => void;
    onAddClick: () => void;
    error: string | null;
    onClearError: () => void;
}
jest.mock('../../../../components/SectionHeader', () => ({
    __esModule: true,
    default: ({ onFilterClick, onAddClick, error, onClearError }: SectionHeaderProps) => (
        <div data-testid="section-header">
            <button aria-label="Open filters" onClick={onFilterClick}>Filters</button>
            <button aria-label="Add sponsorship" onClick={onAddClick}>Add</button>
            {error && <><span>{error}</span><button aria-label="Clear error" onClick={onClearError}>Clear</button></>}
        </div>
    ),
}))
jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
    __esModule: true,
    default: () => <div data-testid="pagination">Pagination</div>,
}))
jest.mock('../../../../store/slices/sponsorships/sponsorships.slice', () => {
    const actual = jest.requireActual('../../../../store/slices/sponsorships/sponsorships.slice')
    return {
        __esModule: true,
        ...actual,
        fetchSponsorships: Object.assign(
            jest.fn(() => ({ type: 'sponsorships/fetch/pending' })),
            actual.fetchSponsorships
        ),
    }
})


const createMockStore = (initialState = {}) => configureStore({
    reducer: { sponsorships: sponsorshipsReducer },
    preloadedState: {
        sponsorships: {
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

    // ── uncovered branches (lines 33-36, 43, 65-68) ──────────────────────────

    it('opens filters drawer when filter button clicked (line 33-36)', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        fireEvent.click(screen.getByLabelText('Open filters'))
        expect(screen.getByTestId('filters-drawer')).toBeInTheDocument()
    })

    it('closes filters drawer when its onClose is called (line 35)', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        fireEvent.click(screen.getByLabelText('Open filters'))
        expect(screen.getByTestId('filters-drawer')).toBeInTheDocument()
        fireEvent.click(screen.getByLabelText('Close filters'))
        expect(screen.queryByTestId('filters-drawer')).not.toBeInTheDocument()
    })

    it('opens add form when add button clicked (line 64-68)', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        fireEvent.click(screen.getByLabelText('Add sponsorship'))
        expect(screen.getByTestId('sponsorship-form')).toBeInTheDocument()
    })

    it('closes add form when its onClose is called (line 65)', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        fireEvent.click(screen.getByLabelText('Add sponsorship'))
        fireEvent.click(screen.getByLabelText('Close form'))
        expect(screen.queryByTestId('sponsorship-form')).not.toBeInTheDocument()
    })

    it('selects item via onView and clears via modal onClose (line 43, 60)', async () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        fireEvent.click(screen.getByText('View Row'))
        expect(screen.getByTestId('details-modal')).toBeInTheDocument()
        fireEvent.click(screen.getByLabelText('Close modal'))
        await waitFor(() => expect(screen.queryByTestId('details-modal')).not.toBeInTheDocument())
    })

    it('shows error and clears it (line 29, onClearError)', async () => {
        const store = createMockStore({ error: 'Load failed' })
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        expect(screen.getByText('Load failed')).toBeInTheDocument()
        fireEvent.click(screen.getByLabelText('Clear error'))
        await waitFor(() => expect(store.getState().sponsorships.error).toBeNull())
    })

    it('refreshes data on SponsorshipForm success (line 67)', async () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        
        // Open form
        fireEvent.click(screen.getByLabelText('Add sponsorship'))
        
        // Success
        fireEvent.click(screen.getByLabelText('Submit form'))
        
        await waitFor(() => {
            expect(fetchSponsorships).toHaveBeenCalledTimes(2) // mount + success
        })
    })
})
