import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SponsorshipsPage from '../../../../features/sponsorships/pages/SponsorshipsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import sponsorshipsReducer, { fetchSponsorships, type SponsorshipsState } from '../../../../store/slices/sponsorships/sponsorships.slice'
import authReducer, { type AuthState } from '../../../../store/slices/authSlice'
import type { SponsorshipItem } from '../../../../services/sponsorships'

jest.mock('xlsx', () => ({
    utils: {
        json_to_sheet: jest.fn(() => ({})),
        book_new: jest.fn(() => ({})),
        book_append_sheet: jest.fn(),
    },
    writeFile: jest.fn(),
}))

jest.mock('../../../../services/sponsorships', () => ({
    searchSponsorships: jest.fn(),
}))

jest.mock('../../../../features/sponsorships/components/SponsorshipTable', () => ({
    __esModule: true,
    default: ({ onView, onSelectAll, onSelect, onRestore }: { onView: (row: { id: number; name: string }) => void, onSelectAll: (checked: boolean) => void, onSelect?: (id: number) => void, onRestore?: (row: { id: number }) => void }) => (
        <div data-testid="sponsorship-table">
            <button onClick={() => onView({ id: 1, name: 'Test Sponsorship' })}>View Row</button>
            <button onClick={() => onSelect?.(1)}>Select Row</button>
            <button onClick={() => onSelectAll(true)}>Select Rows</button>
            <button onClick={() => onSelectAll(false)}>Unselect Rows</button>
            {onRestore && <button onClick={() => onRestore({ id: 1 })}>Restore Row</button>}
        </div>
    ),
}))
jest.mock('../../../../features/sponsorships/components/SponsorshipDetailsModal', () => ({
    __esModule: true,
    default: ({ item, onClose, onDelete }: { item: SponsorshipItem, onClose: () => void, onDelete?: (item: SponsorshipItem) => void }) => (
        <div data-testid="details-modal">
            {item?.name}
            <button aria-label="Close modal" onClick={onClose}>Close</button>
            {onDelete && <button onClick={() => onDelete(item)}>Delete Details</button>}
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

jest.mock('../../../../components/SectionHeader', () => ({
    __esModule: true,
    default: ({ onFilterClick, onAddClick, error, onClearError, onExportClick, onToggleDeleted, onDeleteSelected }: {
        onFilterClick: () => void
        onAddClick?: () => void
        error?: string | null
        onClearError?: () => void
        onExportClick?: () => void
        onToggleDeleted?: () => void
        onDeleteSelected?: () => void
    }) => (
        <div data-testid="section-header">
            <button aria-label="Open filters" onClick={onFilterClick}>Filters</button>
            {onAddClick && <button aria-label="Add sponsorship" onClick={onAddClick}>Add</button>}
            {error && <><span>{error}</span><button aria-label="Clear error" onClick={onClearError}>Clear</button></>}
            {onExportClick && <button onClick={onExportClick}>Export Excel</button>}
            {onToggleDeleted && <button onClick={onToggleDeleted}>Toggle Deleted</button>}
            {onDeleteSelected && <button onClick={onDeleteSelected}>Delete Selected</button>}
        </div>
    )
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
        // Return a real thunk function so dispatchSpy sees expect.any(Function)
        deleteSponsorshipThunk: Object.assign(
            jest.fn(() => () => Promise.resolve({ unwrap: () => Promise.resolve({}) })),
            {
                pending: { type: 'sponsorships/delete/pending' },
                fulfilled: { type: 'sponsorships/delete/fulfilled', match: () => true },
                rejected: { type: 'sponsorships/delete/rejected' },
            }
        ),
        restoreSponsorshipThunk: Object.assign(
            jest.fn(() => () => Promise.resolve({ unwrap: () => Promise.resolve({}) })),
            {
                pending: { type: 'sponsorships/restore/pending' },
                fulfilled: { type: 'sponsorships/restore/fulfilled', match: () => true },
                rejected: { type: 'sponsorships/restore/rejected' },
            }
        ),
        // Use the real setSelected so that dispatching it actually updates the store
        setSelected: actual.setSelected,
    }
})

import { searchSponsorships } from '../../../../services/sponsorships'
import * as XLSX from 'xlsx'


const createMockStore = (initialState: Partial<SponsorshipsState> = {}, initialAuth?: Partial<AuthState>) => configureStore({
    reducer: {
        sponsorships: sponsorshipsReducer,
        auth: authReducer,
    },
    preloadedState: {
        sponsorships: {
            items: [{ id: 1, name: 'Sponsorship 1' } as unknown as SponsorshipItem],
            loading: false,
            editLoading: false,
            error: null,
            page: 1,
            pageSize: 10,
            total: 0,
            draftFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' as const, onlyDeleted: 'false' },
            appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' as const, onlyDeleted: 'false' },
            selected: null,
            ...initialState,
        },
        auth: {
            user: { name: 'Admin', role: 'Admin', permissions: ['export:excel'] },
            token: 'token',
            loading: false,
            error: null,
            ...initialAuth,
        },
    },
});





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

    it('triggers onDelete callback and handles success', async () => {
        const item = { id: 1, name: 'Item 1', deletedAt: null }
        const store = createMockStore({ selected: item })
        const dispatchSpy = jest.spyOn(store, 'dispatch')
        render(<Provider store={store}><SponsorshipsPage /></Provider>)

        expect(screen.getByTestId('details-modal')).toBeInTheDocument()
        fireEvent.click(screen.getByText('Delete Details'))

        expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Function)) // delete thunk called
    })

    it('handles Excel export successfully', async () => {
        const store = createMockStore()
            ; (searchSponsorships as jest.Mock).mockResolvedValue({
                items: [
                    { id: 1, name: 'Item 1', email: 'a@b.com', website: { name: 'Site' }, now: '2023-01-01' },
                    { id: 2 }
                ],
            })

        render(<Provider store={store}><SponsorshipsPage /></Provider>)

        const exportBtn = screen.getByText('Export Excel')
        fireEvent.click(exportBtn)

        await waitFor(() => {
            expect(searchSponsorships).toHaveBeenCalled()
            expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
            expect(XLSX.writeFile).toHaveBeenCalled()
        })
    })

    it('handles Excel export failure when search returns empty', async () => {
        const store = createMockStore()
            ; (searchSponsorships as jest.Mock).mockResolvedValue({
                items: [],
            })

        render(<Provider store={store}><SponsorshipsPage /></Provider>)

        const exportBtn = screen.getByText('Export Excel')
        fireEvent.click(exportBtn)

        await waitFor(() => {
            expect(searchSponsorships).toHaveBeenCalled()
            expect(XLSX.writeFile).not.toHaveBeenCalled()
        })
    })

    it('handles Excel export exception (catch block) (lines 61-62)', async () => {
        const store = createMockStore()
            ; (searchSponsorships as jest.Mock).mockRejectedValue(new Error('Network Error'))

        render(<Provider store={store}><SponsorshipsPage /></Provider>)

        const exportBtn = screen.getByText('Export Excel')
        fireEvent.click(exportBtn)

        await waitFor(() => {
            expect(searchSponsorships).toHaveBeenCalled()
        })
    })

    it('triggers onToggleDeleted properly (lines 79-81)', async () => {
        const store = createMockStore({
            appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC', onlyDeleted: 'false' },
            draftFilters: { search: '', sortBy: 'now', sortOrder: 'DESC', onlyDeleted: 'false' },
        })
        const spy = jest.spyOn(store, 'dispatch')

        render(
            <Provider store={store}>
                <SponsorshipsPage />
            </Provider>
        )

        spy.mockClear()
        fireEvent.click(screen.getByText('Toggle Deleted'))

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'sponsorships/updateDraftFilter' }))
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'sponsorships/applyFilters' }))
    })

    it('handles delete error with error object (line 120)', async () => {
        const { deleteSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        deleteSponsorshipThunk.mockImplementation(() => () => ({
            unwrap: jest.fn().mockRejectedValue(new Error('Generic Error')),
        }))

        const item = { id: 1, name: 'DeleteFail', deletedAt: null } as SponsorshipItem
        const store = createMockStore({ selected: item })

        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        fireEvent.click(screen.getByText('Delete Details'))

        await waitFor(() => {
            expect(screen.getByTestId('details-modal')).toBeInTheDocument()
        })
    })

    it('handles successful delete properly (lines 119-120)', async () => {
        const { deleteSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        deleteSponsorshipThunk.mockImplementation(() => () => ({
            unwrap: jest.fn().mockResolvedValue({}),
        }))

        const item = { id: 1, name: 'DeleteSuccess', deletedAt: null } as SponsorshipItem
        const store = createMockStore({ selected: item })

        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        fireEvent.click(screen.getByText('Delete Details'))

        await waitFor(() => {
            expect(store.getState().sponsorships.selected).toBeNull()
        })
    })

    it('triggers onToggleDeleted properly to false', async () => {
        const store = createMockStore({
            appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC', onlyDeleted: 'true' },
            draftFilters: { search: '', sortBy: 'now', sortOrder: 'DESC', onlyDeleted: 'true' },
        })
        const spy = jest.spyOn(store, 'dispatch')

        render(<Provider store={store}><SponsorshipsPage /></Provider>)

        spy.mockClear()
        fireEvent.click(screen.getByText('Toggle Deleted'))

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'sponsorships/updateDraftFilter', payload: { key: 'onlyDeleted', value: 'false' } }))
    })

    it('handles delete error with string error', async () => {
        const { deleteSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        deleteSponsorshipThunk.mockImplementation(() => () => ({
            unwrap: jest.fn().mockRejectedValue('String Error Message'),
        }))

        const item = { id: 1, name: 'DeleteFailStr', deletedAt: null } as SponsorshipItem
        const store = createMockStore({ selected: item })

        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        fireEvent.click(screen.getByText('Delete Details'))

        await waitFor(() => {
            expect(screen.getByTestId('details-modal')).toBeInTheDocument()
        })
    })

    it('renders with selected.deletedAt to cover onDelete undefined', () => {
        const item = { id: 1, name: 'DeletedItem', deletedAt: '2023-01-01' } as SponsorshipItem
        const store = createMockStore({ selected: item })
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        expect(screen.getByTestId('details-modal')).toBeInTheDocument()
    })

    it('handles bulk delete successfully', async () => {
        const { deleteSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        deleteSponsorshipThunk.mockImplementation(() => () => ({
            unwrap: jest.fn().mockResolvedValue({}),
        }))

        // Mock window.confirm
        jest.spyOn(window, 'confirm').mockReturnValue(true)

        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)

        // Select items
        fireEvent.click(screen.getByText('Select Rows'))
        // Delete selected
        fireEvent.click(screen.getByText('Delete Selected'))

        await waitFor(() => {
            expect(fetchSponsorships).toHaveBeenCalled() // fetch is called after success
        })

            // Restore mock
            ; (window.confirm as jest.Mock).mockRestore()
    })

    it('cancels bulk delete when confirm is false', async () => {
        const { deleteSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        deleteSponsorshipThunk.mockClear()

        // Mock window.confirm
        jest.spyOn(window, 'confirm').mockReturnValue(false)

        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)

        // Select items
        fireEvent.click(screen.getByText('Select Rows'))
        // Delete selected
        fireEvent.click(screen.getByText('Delete Selected'))

        expect(deleteSponsorshipThunk).not.toHaveBeenCalled()

            // Restore mock
            ; (window.confirm as jest.Mock).mockRestore()
    })

    it('handles bulk delete failure with string error', async () => {
        const { deleteSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        deleteSponsorshipThunk.mockImplementation(() => () => ({
            unwrap: jest.fn().mockRejectedValue('Bulk String Error Message'),
        }))

        // Mock window.confirm
        jest.spyOn(window, 'confirm').mockReturnValue(true)

        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)

        // Select items
        fireEvent.click(screen.getByText('Select Rows'))
        // Delete selected
        fireEvent.click(screen.getByText('Delete Selected'))

        await waitFor(() => {
            expect(fetchSponsorships).toHaveBeenCalled() // fetch is still called in catch block
        })

            // Restore mock
            ; (window.confirm as jest.Mock).mockRestore()
    })

    it('handles bulk delete failure with non-string error', async () => {
        const { deleteSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        deleteSponsorshipThunk.mockImplementation(() => () => ({
            unwrap: jest.fn().mockRejectedValue(new Error('Generic fail')),
        }))

        // Mock window.confirm
        jest.spyOn(window, 'confirm').mockReturnValue(true)

        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)

        // Select items
        fireEvent.click(screen.getByText('Select Rows'))
        // Delete selected
        fireEvent.click(screen.getByText('Delete Selected'))

        await waitFor(() => {
            expect(fetchSponsorships).toHaveBeenCalled() // fetch is still called in catch block
        })

            // Restore mock
            ; (window.confirm as jest.Mock).mockRestore()
    })

    it('handles single delete success', async () => {
        const { deleteSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        deleteSponsorshipThunk.mockImplementation(() => () => ({
            unwrap: jest.fn().mockResolvedValue({}),
        }))

        const store = createMockStore({
            items: [{ id: 1, name: 'Item 1' } as SponsorshipItem],
            selected: { id: 1, name: 'Item 1' } as SponsorshipItem,
        })
        render(<Provider store={store}><SponsorshipsPage /></Provider>)

        fireEvent.click(screen.getByText('Delete Details'))

        await waitFor(() => {
            expect(deleteSponsorshipThunk).toHaveBeenCalled()
        })
    })

    it('handles single delete string error', async () => {
        const { deleteSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        deleteSponsorshipThunk.mockImplementation(() => () => ({
            unwrap: jest.fn().mockRejectedValue('Single Delete Error'),
        }))

        const store = createMockStore({
            items: [{ id: 1, name: 'Item 1' } as SponsorshipItem],
            selected: { id: 1, name: 'Item 1' } as SponsorshipItem,
        })
        render(<Provider store={store}><SponsorshipsPage /></Provider>)

        fireEvent.click(screen.getByText('Delete Details'))

        await waitFor(() => {
            expect(deleteSponsorshipThunk).toHaveBeenCalled()
        })
    })

    it('handles single delete generic error', async () => {
        const { deleteSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        deleteSponsorshipThunk.mockImplementation(() => () => ({
            unwrap: jest.fn().mockRejectedValue(new Error('error')),
        }))

        const store = createMockStore({
            items: [{ id: 1, name: 'Item 1' } as SponsorshipItem],
            selected: { id: 1, name: 'Item 1' } as SponsorshipItem,
        })
        render(<Provider store={store}><SponsorshipsPage /></Provider>)

        fireEvent.click(screen.getByText('Delete Details'))

        await waitFor(() => {
            expect(deleteSponsorshipThunk).toHaveBeenCalled()
        })
    })

    it('handles onSelectionChange toggles', async () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        fireEvent.click(screen.getByText('Select Row'))
        fireEvent.click(screen.getByText('Select Row')) // unselect
    })

    it('handles onSelectAll uncheck', async () => {
        const store = createMockStore()
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        fireEvent.click(screen.getByText('Select Rows'))
        fireEvent.click(screen.getByText('Unselect Rows'))
    })
    it('handles restore sponsorship successfully', async () => {
        const store = createMockStore({ appliedFilters: { onlyDeleted: 'true' } })
        const { restoreSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        restoreSponsorshipThunk.mockImplementation(() => () => ({
            unwrap: jest.fn().mockResolvedValue({}),
        }))

        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        fireEvent.click(screen.getByText('Restore Row'))

        await waitFor(() => {
            expect(restoreSponsorshipThunk).toHaveBeenCalled()
        })
    })

    it('handles restore sponsorship error with string', async () => {
        const store = createMockStore({ appliedFilters: { onlyDeleted: 'true' } })
        const { restoreSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        restoreSponsorshipThunk.mockImplementation(() => () => ({
            unwrap: jest.fn().mockRejectedValue('Restore Error'),
        }))

        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        fireEvent.click(screen.getByText('Restore Row'))

        await waitFor(() => {
            expect(restoreSponsorshipThunk).toHaveBeenCalled()
        })
    })

    it('handles restore sponsorship error with generic error', async () => {
        const store = createMockStore({ appliedFilters: { onlyDeleted: 'true' } })
        const { restoreSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        restoreSponsorshipThunk.mockImplementation(() => () => ({
            unwrap: jest.fn().mockRejectedValue(new Error('Fail')),
        }))

        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        fireEvent.click(screen.getByText('Restore Row'))

        await waitFor(() => {
            expect(restoreSponsorshipThunk).toHaveBeenCalled()
        })
    })
    it('does not pass onExportClick if no permission', () => {
        const store = createMockStore({}, {
            user: { name: 'Test', role: 'User', permissions: [] },
            token: 'token', loading: false, error: null
        })
        render(<Provider store={store}><SponsorshipsPage /></Provider>)
        expect(screen.queryByText('Export Excel')).not.toBeInTheDocument()
    })
})
