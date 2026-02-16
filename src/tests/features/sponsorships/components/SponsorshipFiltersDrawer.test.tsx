import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SponsorshipFiltersDrawer from '../../../../features/sponsorships/components/SponsorshipFiltersDrawer'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import sponsorshipsReducer from '../../../../store/slices/sponsorships/sponsorships.slice'

jest.mock('../../../../services/sourcedb', () => ({ listWebsites: jest.fn() }))
import { listWebsites } from '../../../../services/sourcedb'

const createMockStore = (draftFilters = {}) => configureStore({
    reducer: { sponsorships: sponsorshipsReducer },
    preloadedState: { sponsorships: { items: [], loading: false, error: null, page: 1, pageSize: 10, total: 0, appliedFilters: {}, draftFilters, selected: null } },
})

describe('SponsorshipFiltersDrawer', () => {
    const mockOnClose = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (listWebsites as jest.Mock).mockResolvedValue([{ id: 1, name: 'Conference A' }])
    })

    it('returns null when not open', () => {
        const store = createMockStore()
        const { container } = render(<Provider store={store}><SponsorshipFiltersDrawer open={false} onClose={mockOnClose} /></Provider>)
        expect(container.firstChild).toBeNull()
    })

    it('renders drawer', async () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

        await waitFor(() => {
            expect(screen.getByText('Sponsorship Filters')).toBeInTheDocument()
        })
    })

    it('calls onClose', async () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

        await waitFor(() => {
            expect(screen.getByText('Sponsorship Filters')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('✕'))
        expect(mockOnClose).toHaveBeenCalled()
    })
})
