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
        await waitFor(() => { expect(screen.getByText('Sponsorship Filters')).toBeInTheDocument() })
    })

    it('calls onClose via ✕ button', async () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        await waitFor(() => { expect(screen.getByText('Sponsorship Filters')).toBeInTheDocument() })
        fireEvent.click(screen.getByText('✕'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('calls onClose via backdrop click', () => {
        const store = createMockStore()
        const { container } = render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.click(container.querySelector('.bg-black\\/40')!)
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('loads and displays website options', async () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        await waitFor(() => expect(screen.getByText('Conference A')).toBeInTheDocument())
    })

    it('dispatches resetFilters on Reset click', () => {
        const store = createMockStore()
        const spy = jest.spyOn(store, 'dispatch')
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.click(screen.getByText('Reset'))
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: expect.stringContaining('reset') }))
    })

    it('dispatches applyFilters and calls onClose on Apply click', () => {
        const store = createMockStore()
        const spy = jest.spyOn(store, 'dispatch')
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.click(screen.getByText('Apply'))
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: expect.stringContaining('apply') }))
        expect(mockOnClose).toHaveBeenCalled()
    })

    // ── uncovered branches (lines 114-120, 140-144, 156-160, 188-189) ──────────

    it('dispatches updateDraftFilter for phone input (line ~88)', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.change(screen.getByPlaceholderText('Phone'), { target: { value: '555-9999' } })
        expect(store.getState().sponsorships.draftFilters.phone).toBe('555-9999')
    })

    it('dispatches updateDraftFilter for organization input (line ~96)', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.change(screen.getByPlaceholderText('Organization'), { target: { value: 'ACME Corp' } })
        expect(store.getState().sponsorships.draftFilters.organization).toBe('ACME Corp')
    })

    it('dispatches updateDraftFilter for country input (line ~104)', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.change(screen.getByPlaceholderText('Country'), { target: { value: 'Germany' } })
        expect(store.getState().sponsorships.draftFilters.country).toBe('Germany')
    })

    it('selects a website from the dropdown (lines 114-120)', async () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        await waitFor(() => expect(screen.getByText('Conference A')).toBeInTheDocument())
        fireEvent.change(screen.getByDisplayValue(/Website|Loading/), { target: { value: '1' } })
        expect(store.getState().sponsorships.draftFilters.website_id).toBe(1)
    })

    it('clears website_id when empty string selected (lines 117-119)', async () => {
        const store = createMockStore({ website_id: 1 })
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        await waitFor(() => expect(screen.getByText('Conference A')).toBeInTheDocument())
        fireEvent.change(screen.getByDisplayValue(/Conference A|Website/), { target: { value: '' } })
        expect(store.getState().sponsorships.draftFilters.website_id).toBeUndefined()
    })

    it('changes sortBy select (lines 140-144)', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.change(screen.getByDisplayValue('Sort by time'), { target: { value: 'name' } })
        expect(store.getState().sponsorships.draftFilters.sortBy).toBe('name')
    })

    it('changes sortOrder select (lines 156-160)', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.change(screen.getByDisplayValue('DESC'), { target: { value: 'ASC' } })
        expect(store.getState().sponsorships.draftFilters.sortOrder).toBe('ASC')
    })

    it('dispatches updateDraftFilter for search input (line 64)', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.change(screen.getByPlaceholderText('Keyword search...'), { target: { value: 'query' } })
        expect(store.getState().sponsorships.draftFilters.search).toBe('query')
    })

    it('dispatches updateDraftFilter for name input (line 72)', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Bob' } })
        expect(store.getState().sponsorships.draftFilters.name).toBe('Bob')
    })

    it('dispatches updateDraftFilter for email input (line 80)', () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'bob@test.com' } })
        expect(store.getState().sponsorships.draftFilters.email).toBe('bob@test.com')
    })
})
