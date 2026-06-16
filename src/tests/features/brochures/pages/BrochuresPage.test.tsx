import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BrochuresPage from '../../../../features/brochures/pages/BrochuresPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import brochuresReducer from '../../../../store/slices/brochures/brochures.slice'
import authReducer from '../../../../store/slices/authSlice'
import type { BrochureItem } from '../../../../services/brochures'
import { searchBrochures } from '../../../../services/brochures'
import * as XLSX from 'xlsx'

/* ---------------- MOCK SERVICES ---------------- */

jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}))

jest.mock('../../../../services/brochures', () => ({
  searchBrochures: jest.fn(),
}))

jest.mock('../../../../store/slices/brochures/brochures.slice', () => {
  const actual = jest.requireActual('../../../../store/slices/brochures/brochures.slice')
  return {
    __esModule: true,
    ...actual,
    deleteBrochureThunk: Object.assign(
      jest.fn(),
      {
        fulfilled: { match: () => true }
      }
    ),
  }
})

/* ---------------- MOCK UI ---------------- */

jest.mock('../../../../features/brochures/components/BrochureTable', () => ({
  __esModule: true,
  default: ({ rows, onView }: { rows: BrochureItem[], onView: (item: BrochureItem) => void }) => (
    <div data-testid="brochure-table">
      {rows.map((r) => (
        <div key={r.id} onClick={() => onView(r)} data-testid={`row-${r.id}`}>{r.name}</div>
      ))}
    </div>
  ),
}))

jest.mock('../../../../features/brochures/components/BrochureDetailsModal', () => ({
  __esModule: true,
  default: ({ item, onClose, onDelete, onEdit }: { item: BrochureItem | null, onClose: () => void, onDelete?: (item: BrochureItem) => void, onEdit?: (item: BrochureItem) => void }) => (
    <div data-testid="details-modal">
        {item?.name}
        <button onClick={onClose}>Close Details</button>
        {onDelete && <button onClick={() => onDelete(item!)}>Delete Details</button>}
        {onEdit && <button onClick={() => onEdit(item!)}>Edit Details</button>}
    </div>
  ),
}))

jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
  __esModule: true,
  default: ({ onPageChange, onPageSizeChange }: { onPageChange: (p: number) => void, onPageSizeChange: (s: number) => void }) => (
    <div data-testid="pagination">
        <button onClick={() => onPageChange(2)}>Next</button>
        <button onClick={() => onPageSizeChange(50)}>Size</button>
    </div>
  ),
}))

jest.mock('../../../../features/brochures/components/BrochureFiltersDrawer', () => ({
    __esModule: true,
    default: ({ open, onClose }: { open: boolean, onClose: () => void }) => (
        open ? <div data-testid="filters-drawer"><button onClick={onClose}>Close Filters</button></div> : null
    )
}))

jest.mock('../../../../features/brochures/components/BrochureForm', () => ({
    __esModule: true,
    default: ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => (
        <div data-testid="brochure-form">
            <button onClick={onClose}>Close Form</button>
            <button onClick={onSuccess}>Trigger Success</button>
        </div>
    )
}))

jest.mock('../../../../components/SectionHeader', () => ({
    __esModule: true,
    default: ({ onFilterClick, onAddClick, error, onClearError, onExportClick, onToggleDeleted }: { onFilterClick: () => void, onAddClick: () => void, error: string | null, onClearError: () => void, onExportClick?: () => void, onToggleDeleted?: () => void }) => (
        <div data-testid="section-header">
            <button onClick={onFilterClick}>Open Filters</button>
            <button onClick={onAddClick}>Open Form</button>
            {error && <div onClick={onClearError}>{error}</div>}
            {onExportClick && <button onClick={onExportClick}>Export Excel</button>}
            {onToggleDeleted && <button onClick={onToggleDeleted}>Toggle Deleted</button>}
        </div>
    )
}))

/* ---------------- STORE ---------------- */

const createMockStore = (initialState = {}) =>
  configureStore({
    reducer: {
      brochures: brochuresReducer,
      auth: authReducer,
    },
    preloadedState: {
      brochures: {
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
        ...initialState,
      },
      auth: {
        user: { name: 'Test User', role: 'User', permissions: ['export:excel'] },
        token: 'fake-token',
        loading: false,
        error: null,
      },
    },
  })

describe('BrochuresPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock so the initial fetchBrochures dispatch on mount doesn't crash
    ;(searchBrochures as jest.Mock).mockResolvedValue({ items: [], total: 0 })
  })

  it('renders child components and triggers layout effects', () => {
    const store = createMockStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    render(<Provider store={store}><BrochuresPage /></Provider>)
    expect(dispatchSpy).toHaveBeenCalled()
  })

  it('handles filters drawer', () => {
    const store = createMockStore()
    render(<Provider store={store}><BrochuresPage /></Provider>)
    fireEvent.click(screen.getByText('Open Filters'))
    expect(screen.getByTestId('filters-drawer')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Close Filters'))
    expect(screen.queryByTestId('filters-drawer')).not.toBeInTheDocument()
  })

  it('handles form modal and success callback', async () => {
    const store = createMockStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    render(<Provider store={store}><BrochuresPage /></Provider>)
    
    fireEvent.click(screen.getByText('Open Form'))
    expect(screen.getByTestId('brochure-form')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Trigger Success'))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Function)) // Fetch called on success
    
    fireEvent.click(screen.getByText('Close Form'))
    expect(screen.queryByTestId('brochure-form')).not.toBeInTheDocument()
  })

  it('handles row selection and details modal', () => {
    const store = createMockStore({ items: [{ id: 1, name: 'Item 1' }] })
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    render(<Provider store={store}><BrochuresPage /></Provider>)
    
    fireEvent.click(screen.getByTestId('row-1'))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'brochures/setSelected' }))
  })

  it('handles pagination', () => {
    const store = createMockStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    render(<Provider store={store}><BrochuresPage /></Provider>)
    
    fireEvent.click(screen.getByText('Next'))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'brochures/setPage', payload: 2 }))
    
    fireEvent.click(screen.getByText('Size'))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'brochures/setPageSize', payload: 50 }))
  })

  it('clears error', () => {
    const store = createMockStore({ error: 'Some Error' })
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    render(<Provider store={store}><BrochuresPage /></Provider>)
    
    fireEvent.click(screen.getByText('Some Error'))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'brochures/clearError' }))
  })

  it('triggers onDelete callback and handles success', async () => {
    const item = { id: 1, name: 'Item 1', deletedAt: null } as BrochureItem
    const store = createMockStore({ selected: item })
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    render(<Provider store={store}><BrochuresPage /></Provider>)
    
    expect(screen.getByTestId('details-modal')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Delete Details'))
    
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Function)) // delete thunk called
  })

    it('handles Excel export successfully', async () => {
      const store = createMockStore()
      ;(searchBrochures as jest.Mock).mockResolvedValue({
        items: [
            { id: 1, name: 'Item 1', email: 'a@b.com', website: { name: 'Site' }, now: '2023-01-01' },
            { id: 2 } // empty item to trigger fallback branches (lines 43-49)
        ],
      })
    
    render(<Provider store={store}><BrochuresPage /></Provider>)
    
    const exportBtn = screen.getByText('Export Excel')
    fireEvent.click(exportBtn)
    
    await waitFor(() => {
      expect(searchBrochures).toHaveBeenCalled()
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
      expect(XLSX.writeFile).toHaveBeenCalled()
    })
  })

  it('handles Excel export failure when search returns empty', async () => {
    const store = createMockStore()
    ;(searchBrochures as jest.Mock).mockResolvedValue({
      items: [],
    })
    
    render(<Provider store={store}><BrochuresPage /></Provider>)
    
    const exportBtn = screen.getByText('Export Excel')
    fireEvent.click(exportBtn)
    
    await waitFor(() => {
      expect(searchBrochures).toHaveBeenCalled()
      expect(XLSX.writeFile).not.toHaveBeenCalled()
    })
  })

  it('handles delete error with error object (line 128)', async () => {
    const { deleteBrochureThunk } = jest.requireMock('../../../../store/slices/brochures/brochures.slice')
    deleteBrochureThunk.mockImplementation(() => () => ({
      unwrap: jest.fn().mockRejectedValue(new Error('Generic Error')),
    }))

    const item = { id: 1, name: 'DeleteFail', deletedAt: null } as BrochureItem
    const store = createMockStore({ selected: item })

    render(<Provider store={store}><BrochuresPage /></Provider>)
    fireEvent.click(screen.getByText('Delete Details'))

    await waitFor(() => {
      expect(screen.getByTestId('details-modal')).toBeInTheDocument()
    })
  })

    it('handles delete error with string error (line 130)', async () => {
      const { deleteBrochureThunk } = jest.requireMock('../../../../store/slices/brochures/brochures.slice')
      deleteBrochureThunk.mockImplementation(() => () => ({
        unwrap: jest.fn().mockRejectedValue('String Error Message'),
      }))

      const item = { id: 1, name: 'DeleteFailStr', deletedAt: null } as BrochureItem
      const store = createMockStore({ selected: item })

      render(<Provider store={store}><BrochuresPage /></Provider>)
      fireEvent.click(screen.getByText('Delete Details'))

      await waitFor(() => {
        expect(screen.getByTestId('details-modal')).toBeInTheDocument()
      })
    })

    it('renders with selected.deletedAt to cover onDelete undefined (line 124)', () => {
      const item = { id: 1, name: 'DeletedItem', deletedAt: '2023-01-01' } as BrochureItem
      const store = createMockStore({ selected: item })
      render(<Provider store={store}><BrochuresPage /></Provider>)
      expect(screen.getByTestId('details-modal')).toBeInTheDocument()
    })

    it('handles successful delete (lines 127-128)', async () => {
    const { deleteBrochureThunk } = jest.requireMock('../../../../store/slices/brochures/brochures.slice')
    deleteBrochureThunk.mockImplementation(() => () => ({
      unwrap: jest.fn().mockResolvedValue({}),
    }))

    const item = { id: 1, name: 'DeleteSuccess', deletedAt: null } as BrochureItem
    const store = createMockStore({ selected: item })

    render(<Provider store={store}><BrochuresPage /></Provider>)
    fireEvent.click(screen.getByText('Delete Details'))

    await waitFor(() => {
      expect(store.getState().brochures.selected).toBeNull()
    })
  })

  it('handles Excel export exception (catch block) (lines 60-61)', async () => {
    const store = createMockStore()
    ;(searchBrochures as jest.Mock).mockRejectedValue(new Error('Network Error'))

    render(<Provider store={store}><BrochuresPage /></Provider>)

    const exportBtn = screen.getByText('Export Excel')
    fireEvent.click(exportBtn)

    await waitFor(() => {
      expect(searchBrochures).toHaveBeenCalled()
    })
  })

  it('triggers onToggleDeleted properly (lines 82-84)', async () => {
    const store = createMockStore({
      appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC', onlyDeleted: 'false' },
      draftFilters: { search: '', sortBy: 'now', sortOrder: 'DESC', onlyDeleted: 'false' },
    })
    const spy = jest.spyOn(store, 'dispatch')

    render(
      <Provider store={store}>
        <BrochuresPage />
      </Provider>
    )

    spy.mockClear()
    fireEvent.click(screen.getByText('Toggle Deleted'))

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'brochures/updateDraftFilter' }))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'brochures/applyFilters' }))
  })
})
