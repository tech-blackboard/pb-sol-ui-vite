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
        // Wait for the loading state to finish in the UI
        await waitFor(() => expect(screen.queryByText('Loading websites…')).not.toBeInTheDocument())

        const select = screen.getByDisplayValue('Website')
        fireEvent.change(select, { target: { value: '1' } })

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'accRegistrations/updateDraftFilter',
            payload: { key: 'website_id', value: 1 }
        }))

        // Test empty value (line 127)
        fireEvent.change(select, { target: { value: '' } })
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'accRegistrations/updateDraftFilter',
            payload: { key: 'website_id', value: undefined }
        }))
    })

    it('dispatches updateDraftFilter for all text inputs', () => {
        const store = createMockStore()
        const spy = jest.spyOn(store, 'dispatch')
        render(<Provider store={store}><AccRegistrationFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

        const inputs = [
            { placeholder: 'Name', key: 'name' },
            { placeholder: 'Email', key: 'email' },
            { placeholder: 'Phone', key: 'phone' },
            { placeholder: 'Institution', key: 'institution' },
            { placeholder: 'Country', key: 'country' },
            { placeholder: 'Status Flag', key: 'status_flag' },
        ]

        inputs.forEach(({ placeholder, key }) => {
            const input = screen.getByPlaceholderText(placeholder)
            fireEvent.change(input, { target: { value: 'test-value' } })
            expect(spy).toHaveBeenCalledWith(expect.objectContaining({
                type: 'accRegistrations/updateDraftFilter',
                payload: { key, value: 'test-value' }
            }))
        })
    })

    it('dispatches updateDraftFilter on sort changes', () => {
        const store = createMockStore()
        const spy = jest.spyOn(store, 'dispatch')
        render(<Provider store={store}><AccRegistrationFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

        const sortBySelect = screen.getByDisplayValue('Sort by time')
        fireEvent.change(sortBySelect, { target: { value: 'name' } })
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'accRegistrations/updateDraftFilter',
            payload: { key: 'sortBy', value: 'name' }
        }))

        const sortOrderSelect = screen.getByDisplayValue('DESC')
        fireEvent.change(sortOrderSelect, { target: { value: 'ASC' } })
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'accRegistrations/updateDraftFilter',
            payload: { key: 'sortOrder', value: 'ASC' }
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
