import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AccRegistrationFiltersDrawer from '../../../../features/accRegistrations/components/AccRegistrationFiltersDrawer'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import accRegistrationsReducer from '../../../../store/slices/accRegistrations/accRegistrations.slice'

jest.mock('../../../../services/sourcedb', () => ({ listWebsites: jest.fn() }))
import { listWebsites } from '../../../../services/sourcedb'

const createMockStore = (draftFilters = {}) => configureStore({
    reducer: { accRegistrations: accRegistrationsReducer },
    preloadedState: { accRegistrations: { items: [], loading: false, error: null, page: 1, pageSize: 10, total: 0, appliedFilters: {}, draftFilters, selected: null } },
})

describe('AccRegistrationFiltersDrawer', () => {
    const mockOnClose = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (listWebsites as jest.Mock).mockResolvedValue([{ id: 1, name: 'Conference A' }])
    })

    it('returns null when not open', () => {
        const store = createMockStore()
        const { container } = render(<Provider store={store}><AccRegistrationFiltersDrawer open={false} onClose={mockOnClose} /></Provider>)
        expect(container.firstChild).toBeNull()
    })

    it('renders drawer', () => {
        const store = createMockStore()
        render(<Provider store={store}><AccRegistrationFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        expect(screen.getByText('Accommodation Registration Filters')).toBeInTheDocument()
    })

    it('calls onClose', () => {
        const store = createMockStore()
        render(<Provider store={store}><AccRegistrationFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.click(screen.getByText('✕'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('dispatches updateDraftFilter on keyword change', () => {
        const store = createMockStore()
        const spy = jest.spyOn(store, 'dispatch')
        render(<Provider store={store}><AccRegistrationFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

        const input = screen.getByPlaceholderText('Keyword search...')
        fireEvent.change(input, { target: { value: 'test' } })

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'accRegistrations/updateDraftFilter',
            payload: { key: 'search', value: 'test' }
        }))
    })

    it('dispatches updateDraftFilter on website change', async () => {
        const store = createMockStore()
        const spy = jest.spyOn(store, 'dispatch')
        render(<Provider store={store}><AccRegistrationFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

        await waitFor(() => expect(listWebsites).toHaveBeenCalled())

        const select = screen.getByDisplayValue('Website')
        fireEvent.change(select, { target: { value: '1' } })

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'accRegistrations/updateDraftFilter',
            payload: { key: 'website_id', value: 1 }
        }))
    })

    it('dispatches resetFilters when Reset button clicked', () => {
        const store = createMockStore()
        const spy = jest.spyOn(store, 'dispatch')
        render(<Provider store={store}><AccRegistrationFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

        fireEvent.click(screen.getByText('Reset'))
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'accRegistrations/resetFilters'
        }))
    })

    it('dispatches applyFilters and calls onClose when Apply button clicked', () => {
        const store = createMockStore()
        const spy = jest.spyOn(store, 'dispatch')
        render(<Provider store={store}><AccRegistrationFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

        fireEvent.click(screen.getByText('Apply'))
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'accRegistrations/applyFilters'
        }))
        expect(mockOnClose).toHaveBeenCalled()
    })
})
