import { render, screen, fireEvent } from '@testing-library/react'
import ContactFiltersDrawer from '../../../../features/contacts/components/ContactFiltersDrawer'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import contactsReducer from '../../../../store/slices/contacts/contacts.slice'

jest.mock('../../../../services/sourcedb', () => ({ listWebsites: jest.fn() }))
import { listWebsites } from '../../../../services/sourcedb'

const createMockStore = (draftFilters = {}) => configureStore({
    reducer: { contacts: contactsReducer },
    preloadedState: { contacts: { items: [], loading: false, error: null, page: 1, pageSize: 10, total: 0, appliedFilters: {}, draftFilters, selected: null } },
})

describe('ContactFiltersDrawer', () => {
    const mockOnClose = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (listWebsites as jest.Mock).mockResolvedValue([{ id: 1, name: 'Conference A' }])
    })

    it('returns null when not open', () => {
        const store = createMockStore()
        const { container } = render(<Provider store={store}><ContactFiltersDrawer open={false} onClose={mockOnClose} /></Provider>)
        expect(container.firstChild).toBeNull()
    })

    it('renders drawer', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        expect(screen.getByText('Contact Filters')).toBeInTheDocument()
    })

    it('calls onClose', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
        fireEvent.click(screen.getByText('✕'))
        expect(mockOnClose).toHaveBeenCalled()
    })
})
