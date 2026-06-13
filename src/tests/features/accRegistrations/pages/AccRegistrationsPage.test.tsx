import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AccRegistrationsPage from '../../../../features/accRegistrations/pages/AccRegistrationsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import accRegistrationsReducer from '../../../../store/slices/accRegistrations/accRegistrations.slice'
import type { AccRegistrationsState } from '../../../../store/slices/accRegistrations/accRegistrations.slice'
import type { AccRegistrationItem } from '../../../../services/accRegistrations'
import authReducer from '../../../../store/slices/authSlice'
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}))

jest.mock('../../../../services/accRegistrations', () => ({
  searchAccRegistrations: jest.fn().mockImplementation(() => Promise.resolve({ items: [], total: 0 })),
}))

jest.mock('../../../../features/accRegistrations/components/AccRegistrationTable', () => ({
  __esModule: true,
  default: ({ rows, loading, onView }: { rows: AccRegistrationItem[], loading: boolean, onView?: (item: AccRegistrationItem) => void }) => (
    <div data-testid="acc-table">
      {loading && <div>Loading...</div>}
      {rows.map((r: AccRegistrationItem) => (
        <div key={r.id} onClick={() => onView?.(r)}>
          {r.name}
        </div>
      ))}
    </div>
  ),
}))

jest.mock('../../../../features/accRegistrations/components/AccRegistrationDetailsModal', () => ({
  __esModule: true,
  default: ({ item, onClose, onEdit, onDelete }: { item: AccRegistrationItem | null, onClose: () => void, onEdit?: (item: AccRegistrationItem) => void, onDelete?: (item: AccRegistrationItem) => void }) => (
    <div data-testid="details-modal">
      {item?.name}
      <button onClick={onClose}>Close Detail</button>
      {onEdit && <button onClick={() => onEdit(item!)}>Edit Details</button>}
      {onDelete && <button onClick={() => onDelete(item!)}>Delete Details</button>}
    </div>
  ),
}))

jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
  __esModule: true,
  default: ({ page, total, onPageChange }: { page: number, total: number, onPageChange: (page: number) => void }) => (
    <div data-testid="pagination">
      Page {page} of {total}
      <button onClick={() => onPageChange(page + 1)}>Next Page</button>
    </div>
  ),
}))

jest.mock('../../../../components/SectionHeader', () => ({
  __esModule: true,
  default: ({ title, onAddClick, onFilterClick, error, onClearError, onExportClick }: {
    title: string
    onAddClick?: () => void
    onFilterClick: () => void
    error?: string | null
    onClearError?: () => void
    onExportClick?: () => void
  }) => (
    <div data-testid="section-header">
      {title}
      <button onClick={onAddClick}>Add</button>
      <button onClick={onFilterClick}>Filter</button>
      {error && (
        <div>
          {error}
          <button onClick={onClearError}>Clear</button>
        </div>
      )}
      {onExportClick && <button onClick={onExportClick}>Export Excel</button>}
    </div>
  ),
}))

jest.mock('../../../../features/accRegistrations/components/AccRegistrationFiltersDrawer', () => ({
  __esModule: true,
  default: ({ open, onClose }: { open: boolean, onClose: () => void }) =>
    open ? (
      <div data-testid="filters-drawer">
        Filters
        <button onClick={onClose}>Close Filters</button>
      </div>
    ) : null,
}))

jest.mock('../../../../features/accRegistrations/components/AccommodationForm', () => ({
  __esModule: true,
  default: ({ onClose, onSuccess }: { onClose: () => void, onSuccess?: () => void }) => (
    <div data-testid="add-form">
      Add Form
      <button onClick={onClose}>Close Form</button>
      <button onClick={() => onSuccess?.()}>Trigger Success</button>
    </div>
  ),
}))

jest.mock('../../../../store/slices/accRegistrations/accRegistrations.slice', () => {
  const actual = jest.requireActual('../../../../store/slices/accRegistrations/accRegistrations.slice')
  return {
    __esModule: true,
    ...actual,
    deleteAccRegistrationThunk: Object.assign(
      jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue({})
      })),
      {
        fulfilled: { match: () => true }
      }
    ),
  }
})

import { searchAccRegistrations } from '../../../../services/accRegistrations'
import * as XLSX from 'xlsx'


const createMockStore = (initial: Partial<AccRegistrationsState> = {}) => {
  const defaultState: AccRegistrationsState = {
    items: [],
    loading: false,
    editLoading: false,
    error: null,
    page: 1,
    pageSize: 10,
    total: 0,
    appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' },
    draftFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' },
    selected: null,
  }

  return configureStore({
    reducer: {
      accRegistrations: accRegistrationsReducer,
      auth: authReducer,
    },
    preloadedState: {
      accRegistrations: { ...defaultState, ...initial },
      auth: {
        user: { name: 'Test User', role: 'User', permissions: ['export:excel'] },
        token: 'fake-token',
        loading: false,
        error: null,
      },
    },
  })
}

describe('AccRegistrationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders basic layout', () => {
    const store = createMockStore()
    render(
      <Provider store={store}>
        <AccRegistrationsPage />
      </Provider>
    )
    expect(screen.getByTestId('section-header')).toBeInTheDocument()
    expect(screen.getByTestId('acc-table')).toBeInTheDocument()
    expect(screen.getByTestId('pagination')).toBeInTheDocument()
  })

  it('dispatches fetch on mount', () => {
    const store = createMockStore()
    const spy = jest.spyOn(store, 'dispatch')
    render(
      <Provider store={store}>
        <AccRegistrationsPage />
      </Provider>
    )

    expect(spy).toHaveBeenCalled()
  })

  it('shows loading state', () => {
    const store = createMockStore({ loading: true })
    render(
      <Provider store={store}>
        <AccRegistrationsPage />
      </Provider>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('opens add modal', () => {
    const store = createMockStore()
    render(
      <Provider store={store}>
        <AccRegistrationsPage />
      </Provider>
    )

    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByTestId('add-form')).toBeInTheDocument()
  })

  it('opens filter drawer', () => {
    const store = createMockStore()
    render(
      <Provider store={store}>
        <AccRegistrationsPage />
      </Provider>
    )

    fireEvent.click(screen.getByText('Filter'))
    expect(screen.getByTestId('filters-drawer')).toBeInTheDocument()
  })

  it('selects row', async () => {
    const store = createMockStore({
      items: [{ id: 1, name: 'Guest 1' }],
    })
    render(
      <Provider store={store}>
        <AccRegistrationsPage />
      </Provider>
    )
    fireEvent.click(screen.getByText('Guest 1'))

    await waitFor(() => {
      expect(store.getState().accRegistrations.selected).toEqual({
        id: 1,
        name: 'Guest 1',
      })
    })
  })
  it('refetches registrations when accommodation is added successfully', async () => {
    const store = createMockStore()
    const spy = jest.spyOn(store, 'dispatch')
    render(
      <Provider store={store}>
        <AccRegistrationsPage />
      </Provider>
    )

    // Open add modal
    fireEvent.click(screen.getByText('Add'))
    
    // Click button to trigger onSuccess (mocked)
    fireEvent.click(screen.getByText('Trigger Success'))

    await waitFor(() => {
        // Should fetch again (dispatches the thunk function)
        expect(spy).toHaveBeenCalledWith(expect.any(Function))
    })
  })

  it('closes filter drawer', () => {
    const store = createMockStore()
    render(
      <Provider store={store}>
        <AccRegistrationsPage />
      </Provider>
    )

    // Open the drawer first
    fireEvent.click(screen.getByText('Filter'))
    expect(screen.getByTestId('filters-drawer')).toBeInTheDocument()

    // Close the drawer
    fireEvent.click(screen.getByText('Close Filters'))
    expect(screen.queryByTestId('filters-drawer')).not.toBeInTheDocument()
  })

  it('closes details modal', async () => {
    const store = createMockStore({
      items: [{ id: 2, name: 'Guest 2' }],
    })
    render(
      <Provider store={store}>
        <AccRegistrationsPage />
      </Provider>
    )

    // Open the details modal by clicking a row
    fireEvent.click(screen.getByText('Guest 2'))
    await waitFor(() => expect(screen.getByTestId('details-modal')).toBeInTheDocument())

    // Close the details modal
    fireEvent.click(screen.getByText('Close Detail'))
    await waitFor(() => {
      expect(store.getState().accRegistrations.selected).toBeNull()
    })
    expect(screen.queryByTestId('details-modal')).not.toBeInTheDocument()
  })

  it('closes add form', () => {
    const store = createMockStore()
    render(
      <Provider store={store}>
        <AccRegistrationsPage />
      </Provider>
    )

    // Open the add form
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByTestId('add-form')).toBeInTheDocument()

    // Close the add form
    fireEvent.click(screen.getByText('Close Form'))
    expect(screen.queryByTestId('add-form')).not.toBeInTheDocument()
  })

  it('shows and clears an error', async () => {
    const store = createMockStore({ error: 'Something went wrong' })
    render(
      <Provider store={store}>
        <AccRegistrationsPage />
      </Provider>
    )

    // Error text is rendered by the SectionHeader mock
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Clicking Clear dispatches clearError, nullifying the error
    fireEvent.click(screen.getByText('Clear'))
    await waitFor(() => {
      expect(store.getState().accRegistrations.error).toBeNull()
    })
  })

  it('triggers onDelete callback and handles success', async () => {
    const item = { id: 1, name: 'Item 1', deletedAt: null } as AccRegistrationItem
    const store = createMockStore({ selected: item })
    const dispatchSpy = jest.spyOn(store, 'dispatch') as jest.SpyInstance
    render(<Provider store={store}><AccRegistrationsPage /></Provider>)
    
    expect(screen.getByTestId('details-modal')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Delete Details'))
    
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Function)) // delete thunk called
  })

  it('handles Excel export successfully', async () => {
    const store = createMockStore()
    ;(searchAccRegistrations as jest.Mock).mockResolvedValue({
      items: [{ id: 1, name: 'Item 1', email: 'a@b.com', website: { name: 'Site' } }],
    })
    
    render(<Provider store={store}><AccRegistrationsPage /></Provider>)
    
    const exportBtn = screen.getByText('Export Excel')
    fireEvent.click(exportBtn)
    
    await waitFor(() => {
      expect(searchAccRegistrations).toHaveBeenCalled()
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
      expect(XLSX.writeFile).toHaveBeenCalled()
    })
  })

  it('handles Excel export failure when search returns empty', async () => {
    const store = createMockStore()
    ;(searchAccRegistrations as jest.Mock).mockResolvedValue({
      items: [],
    })
    
    render(<Provider store={store}><AccRegistrationsPage /></Provider>)
    
    const exportBtn = screen.getByText('Export Excel')
    fireEvent.click(exportBtn)
    
    await waitFor(() => {
      expect(searchAccRegistrations).toHaveBeenCalled()
      expect(XLSX.writeFile).not.toHaveBeenCalled()
    })
  })
})
