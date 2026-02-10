import { render, screen, fireEvent } from '@testing-library/react'
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

    it('dispatches apply', () => {
        const store = createMockStore()
        const spy = jest.spyOn(store, 'dispatch')
        render(<Provider store={store}><AccRegistrationFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.click(screen.getByText('Apply'))
        expect(spy).toHaveBeenCalled()
    })
})
