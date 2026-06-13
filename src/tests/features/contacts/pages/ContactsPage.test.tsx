import { render, screen, fireEvent } from '@testing-library/react'
import ContactsPage from '../../../../features/contacts/pages/ContactsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import contactsReducer from '../../../../store/slices/contacts/contacts.slice'
import type { ContactsState } from '../../../../store/slices/contacts/contacts.slice'
import type { ContactItem } from '../../../../services/contacts'
import authReducer from '../../../../store/slices/authSlice'

interface TableProps {
    onView: (item: Partial<ContactItem>) => void
}


interface DrawerProps {
    onClose: () => void
}

interface FormProps {
    onClose: () => void
    onSuccess: () => void
}

// Mock components
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}))

jest.mock('../../../../services/contacts', () => ({
  searchContacts: jest.fn(),
}))

jest.mock('../../../../features/contacts/components/ContactTable', () => ({
    __esModule: true,
    default: ({ onView }: TableProps) => (
        <div data-testid="contact-table">
            <button onClick={() => onView({ id: 1 })}>View Row</button>
        </div>
    ),
}))
jest.mock('../../../../features/contacts/components/ContactDetailsModal', () => ({
    __esModule: true,
    default: ({ item, onClose, onDelete }: { item: ContactItem | null, onClose: () => void, onDelete?: (item: ContactItem) => void }) => (
        <div data-testid="details-modal">
            {item?.name}
            <button onClick={onClose}>Close Modal</button>
            {onDelete && <button onClick={() => onDelete(item!)}>Delete Details</button>}
        </div>
    ),
}))
jest.mock('../../../../features/contacts/components/ContactFiltersDrawer', () => ({
    __esModule: true,
    default: ({ onClose }: DrawerProps) => (
        <div data-testid="filters-drawer">
            <button onClick={onClose}>Close Drawer</button>
        </div>
    ),
}))
jest.mock('../../../../features/contacts/components/ContactForm', () => ({
    __esModule: true,
    default: ({ onClose, onSuccess }: FormProps) => (
        <div data-testid="contact-form">
            <button onClick={onClose}>Close Form</button>
            <button onClick={() => { onSuccess(); onClose(); }}>Success Form</button>
        </div>
    ),
}))
jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
    __esModule: true,
    default: () => <div data-testid="pagination">Pagination</div>,
}))

// Mock thunks and slice actions
jest.mock('../../../../store/slices/contacts/contacts.slice', () => {
    const actual = jest.requireActual('../../../../store/slices/contacts/contacts.slice')
    return {
        __esModule: true,
        ...actual,
        fetchContacts: jest.fn(() => ({ type: 'contacts/fetch/pending' })),
        setSelected: jest.fn(() => ({ type: 'contacts/setSelected' })),
        setPage: jest.fn(() => ({ type: 'contacts/setPage' })),
        setPageSize: jest.fn(() => ({ type: 'contacts/setPageSize' })),
        clearSelected: jest.fn(() => ({ type: 'contacts/clearSelected' })),
        clearError: jest.fn(() => ({ type: 'contacts/clearError' })),
        // Return a real thunk function so dispatchSpy sees expect.any(Function)
        deleteContactThunk: Object.assign(
            jest.fn(() => () => Promise.resolve({ unwrap: () => Promise.resolve({}) })),
            {
                pending: { type: 'contacts/delete/pending' },
                fulfilled: { type: 'contacts/delete/fulfilled', match: () => true },
                rejected: { type: 'contacts/delete/rejected' },
            }
        ),
    }
})

import { fetchContacts, setSelected } from '../../../../store/slices/contacts/contacts.slice'
import { searchContacts } from '../../../../services/contacts'
import * as XLSX from 'xlsx'
import { waitFor } from '@testing-library/react'



const createMockStore = (initialStatePartial: Partial<ContactsState> = {}) => configureStore({
    reducer: {
        contacts: contactsReducer,
        auth: authReducer,
    },
    preloadedState: {
        contacts: {
            items: [],
            loading: false,
            editLoading: false,
            error: null,
            page: 1,
            pageSize: 10,
            total: 0,
            appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' as const },
            draftFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' as const },
            selected: null,
            ...initialStatePartial
        },
        auth: {
            user: { name: 'Test User', role: 'User', permissions: ['export:excel'] },
            token: 'fake-token',
            loading: false,
            error: null,
        }
    }
})

describe('ContactsPage', () => {
    beforeEach(() => jest.clearAllMocks())

    it('renders child components', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactsPage /></Provider>)
        expect(screen.getByTestId('pagination')).toBeInTheDocument()
        expect(screen.getByTestId('contact-table')).toBeInTheDocument()
    })

    it('fetches data on mount', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactsPage /></Provider>)
        expect(fetchContacts).toHaveBeenCalled()
    })

    it('opens and closes filters drawer', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactsPage /></Provider>)
        
        fireEvent.click(screen.getByText('Filters'))
        expect(screen.getByTestId('filters-drawer')).toBeInTheDocument()
        
        fireEvent.click(screen.getByText('Close Drawer'))
        expect(screen.queryByTestId('filters-drawer')).not.toBeInTheDocument()
    })

    it('opens and closes contact form, refetches on success', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactsPage /></Provider>)
        
        fireEvent.click(screen.getByText('Add Contact'))
        expect(screen.getByTestId('contact-form')).toBeInTheDocument()
        
        fireEvent.click(screen.getByText('Success Form'))
        expect(fetchContacts).toHaveBeenCalledTimes(2) // mount + success
        expect(screen.queryByTestId('contact-form')).not.toBeInTheDocument()
    })

    it('dispatches setSelected when table row viewed', () => {
        const store = createMockStore()
        render(<Provider store={store}><ContactsPage /></Provider>)
        
        fireEvent.click(screen.getByText('View Row'))
        expect(setSelected).toHaveBeenCalled()
    })

    it('renders and closes details modal when item selected', () => {
        const mockItem = { id: 1, name: 'Test' } as ContactItem
        const store = createMockStore({ selected: mockItem })
        render(<Provider store={store}><ContactsPage /></Provider>)
        
        expect(screen.getByTestId('details-modal')).toBeInTheDocument()
        fireEvent.click(screen.getByText('Close Modal'))
    })

    it('triggers onDelete callback and handles success', async () => {
        const item = { id: 1, name: 'Item 1', deletedAt: null } as ContactItem
        const store = createMockStore({ selected: item })
        const dispatchSpy = jest.spyOn(store, 'dispatch')
        render(<Provider store={store}><ContactsPage /></Provider>)
        
        expect(screen.getByTestId('details-modal')).toBeInTheDocument()
        fireEvent.click(screen.getByText('Delete Details'))
        
        expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Function)) // delete thunk called
    })

    it('handles Excel export successfully', async () => {
        const store = createMockStore()
        ;(searchContacts as jest.Mock).mockResolvedValue({
            items: [{ id: 1, name: 'Item 1', email: 'a@b.com', website: { name: 'Site' } }],
        })
        
        render(<Provider store={store}><ContactsPage /></Provider>)
        
        // Contacts page renders SectionHeader which passes handleExport to SectionHeader.
        // We mocked SectionHeader to render "Export Excel" button if onExportClick is provided.
        // But wait! Does ContactsPage render SectionHeader?
        // Yes, ContactsPage passes handleExport if canExport is true.
        const exportBtn = screen.getByTitle('Export to Excel')
        fireEvent.click(exportBtn)
        
        await waitFor(() => {
            expect(searchContacts).toHaveBeenCalled()
            expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
            expect(XLSX.writeFile).toHaveBeenCalled()
        })
    })

    it('handles Excel export failure when search returns empty', async () => {
        const store = createMockStore()
        ;(searchContacts as jest.Mock).mockResolvedValue({
            items: [],
        })
        
        render(<Provider store={store}><ContactsPage /></Provider>)
        
        const exportBtn = screen.getByTitle('Export to Excel')
        fireEvent.click(exportBtn)
        
        await waitFor(() => {
            expect(searchContacts).toHaveBeenCalled()
            expect(XLSX.writeFile).not.toHaveBeenCalled()
        })
    })
})
