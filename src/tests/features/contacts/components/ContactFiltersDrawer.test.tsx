import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import '@testing-library/jest-dom'

import ContactFiltersDrawer from '../../../../features/contacts/components/ContactFiltersDrawer'
import ContactsPage from '../../../../features/contacts/pages/ContactsPage'
import contactsReducer from '../../../../store/slices/contacts/contacts.slice'
import type { ContactsState } from '../../../../store/slices/contacts/contacts.slice'
import { listWebsites } from '../../../../services/sourcedb'

// Mock services
jest.mock('../../../../services/sourcedb', () => ({
    listWebsites: jest.fn(),
}))

// Mock pure presentation components for ContactsPage level testing
interface SectionHeaderProps {
    onClearError: () => void;
}
jest.mock('../../../../components/SectionHeader', () => ({ onClearError }: SectionHeaderProps) => (
    <div data-testid="section-header">
        <button onClick={onClearError}>Clear Error</button>
    </div>
))

interface PaginationProps {
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}
jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({ onPageChange, onPageSizeChange }: PaginationProps) => (
    <div data-testid="pagination">
        <button onClick={() => onPageChange(2)}>Page 2</button>
        <button onClick={() => onPageSizeChange(25)}>Size 25</button>
    </div>
))
jest.mock('../../../../features/contacts/components/ContactTable', () => () => <div data-testid="contact-table" />)
jest.mock('../../../../features/contacts/components/ContactForm', () => () => <div data-testid="contact-form" />)
jest.mock('../../../../features/contacts/components/ContactDetailsModal', () => () => <div data-testid="details-modal" />)

interface RootState {
    contacts: ContactsState;
}

const createMockStore = (initialStatePartial: Partial<ContactsState> = {}) => configureStore({
    reducer: { contacts: contactsReducer },
    preloadedState: {
        contacts: {
            items: [],
            loading: false,
            error: 'Initial Error',
            page: 1,
            pageSize: 10,
            total: 20,
            appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' as const },
            draftFilters: {
                search: '',
                name: '',
                email: '',
                phone: '',
                country: '',
                website_id: undefined,
                sortBy: 'now',
                sortOrder: 'DESC' as const
            },
            selected: null,
            ...initialStatePartial
        }
    }
})

describe('Contact Feature Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (listWebsites as jest.Mock).mockResolvedValue([{ id: 1, name: 'Conference A' }])
    })

    describe('ContactsPage Integration dispatches', () => {
        it('dispatches clearError when SectionHeader onClearError is triggered', () => {
            const store = createMockStore({ error: 'Some error' })
            render(<Provider store={store}><ContactsPage /></Provider>)

            fireEvent.click(screen.getByText('Clear Error'))
            expect((store.getState() as RootState).contacts.error).toBeNull()
        })

        it('dispatches setPage when pagination onPageChange is triggered', () => {
            const store = createMockStore()
            render(<Provider store={store}><ContactsPage /></Provider>)

            fireEvent.click(screen.getByText('Page 2'))
            expect((store.getState() as RootState).contacts.page).toBe(2)
        })

        it('dispatches setPageSize when pagination onPageSizeChange is triggered', () => {
            const store = createMockStore()
            render(<Provider store={store}><ContactsPage /></Provider>)

            fireEvent.click(screen.getByText('Size 25'))
            expect((store.getState() as RootState).contacts.pageSize).toBe(25)
        })
    })

    describe('ContactFiltersDrawer Component dispatches', () => {
        const mockOnClose = jest.fn()

        it('returns null when not open', () => {
            const store = createMockStore()
            const { container } = render(<Provider store={store}><ContactFiltersDrawer open={false} onClose={mockOnClose} /></Provider>)
            expect(container.firstChild).toBeNull()
        })

        it('renders drawer and all inputs', () => {
            const store = createMockStore()
            render(<Provider store={store}><ContactFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)
            expect(screen.getByText('Contact Filters')).toBeInTheDocument()
            expect(screen.getByPlaceholderText('Keyword search...')).toBeInTheDocument()
        })

        it('calls onClose when overlay or close button clicked', () => {
            const store = createMockStore()
            const { container } = render(<Provider store={store}><ContactFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

            fireEvent.click(screen.getByText('✕'))
            expect(mockOnClose).toHaveBeenCalledTimes(1)

            const overlay = container.querySelector('.fixed .absolute.inset-0.bg-black\\/40')
            if (overlay) fireEvent.click(overlay)
            expect(mockOnClose).toHaveBeenCalledTimes(2)
        })

        it('dispatches updateDraftFilter for all text inputs', () => {
            const store = createMockStore()
            render(<Provider store={store}><ContactFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

            fireEvent.change(screen.getByPlaceholderText('Keyword search...'), { target: { value: 'key' } })
            fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'John' } })
            fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'john@test.com' } })
            fireEvent.change(screen.getByPlaceholderText('Phone'), { target: { value: '123' } })
            fireEvent.change(screen.getByPlaceholderText('Country'), { target: { value: 'USA' } })

            const state = (store.getState() as RootState).contacts.draftFilters
            expect(state.search).toBe('key')
            expect(state.name).toBe('John')
            expect(state.email).toBe('john@test.com')
            expect(state.phone).toBe('123')
            expect(state.country).toBe('USA')
        })

        it('handles website selection changes', async () => {
            const store = createMockStore()
            render(<Provider store={store}><ContactFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

            await waitFor(() => expect(screen.getByText('Conference A')).toBeInTheDocument())

            const select = screen.getByRole('combobox', { name: /website select/i })
            fireEvent.change(select, { target: { value: '1' } })
            expect((store.getState() as RootState).contacts.draftFilters.website_id).toBe(1)

            fireEvent.change(select, { target: { value: '' } })
            expect((store.getState() as RootState).contacts.draftFilters.website_id).toBeUndefined()
        })

        it('dispatches updateDraftFilter when sort fields change', () => {
            const store = createMockStore()
            render(<Provider store={store}><ContactFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

            fireEvent.change(screen.getByDisplayValue('Sort by time'), { target: { value: 'name' } })
            fireEvent.change(screen.getByDisplayValue('DESC'), { target: { value: 'ASC' } })

            const state = (store.getState() as RootState).contacts.draftFilters
            expect(state.sortBy).toBe('name')
            expect(state.sortOrder).toBe('ASC')
        })

        it('dispatches resetFilters when Reset is clicked', () => {
            const store = createMockStore({
                draftFilters: {
                    search: 'something',
                    sortBy: 'now',
                    sortOrder: 'DESC'
                }
            })
            render(<Provider store={store}><ContactFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

            fireEvent.click(screen.getByText('Reset'))
            expect((store.getState() as RootState).contacts.draftFilters.search).toBe('')
        })

        it('dispatches applyFilters and closes when Apply is clicked', () => {
            const store = createMockStore()
            render(<Provider store={store}><ContactFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

            fireEvent.click(screen.getByText('Apply'))
            expect(mockOnClose).toHaveBeenCalled()
        })

        it('handles website loading failure gracefully', async () => {
            ; (listWebsites as jest.Mock).mockRejectedValue(new Error('Fail'))
            const store = createMockStore()
            render(<Provider store={store}><ContactFiltersDrawer open={true} onClose={mockOnClose} /></Provider>)

            await waitFor(() => expect(listWebsites).toHaveBeenCalled())
            expect(screen.getByText('Website')).toBeInTheDocument()
        })
    })
})
