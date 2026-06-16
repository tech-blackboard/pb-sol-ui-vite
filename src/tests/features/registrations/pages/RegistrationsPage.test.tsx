import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegistrationsPage from '../../../../features/registrations/pages/RegistrationsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import registrationsReducer from '../../../../store/slices/registrations/registrations.slice'
import type { RegistrationsState } from '../../../../store/slices/registrations/registrations.types'
import type { RegistrationItem } from '../../../../services/registrations'
import authReducer from '../../../../store/slices/authSlice'

jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}))

jest.mock('../../../../services/registrations', () => ({
  searchRegistrations: jest.fn(),
}))

// Header
jest.mock('../../../../features/registrations/components/RegistrationHeader', () => ({
  __esModule: true,
  default: ({ error, onClearError, onExportClick, onToggleDeleted }: {
    error?: string | null
    onClearError?: () => void
    onExportClick?: () => void
    onToggleDeleted?: () => void
  }) => (
    <div data-testid="header">
      {error && (
        <>
          <span>{error}</span>
          <button aria-label="Close error" onClick={onClearError}>
            Close
          </button>
        </>
      )}
      {onExportClick && <button onClick={onExportClick}>Export Excel</button>}
      {onToggleDeleted && <button onClick={onToggleDeleted}>Toggle Deleted</button>}
    </div>
  ),
}))

// Table (match REAL props)
jest.mock('../../../../features/registrations/components/RegistrationTable', () => ({
  __esModule: true,
  default: ({ rows, loading, onView }: { rows: RegistrationItem[], loading: boolean, error: string | null, onView: (item: RegistrationItem) => void }) => (
    <div data-testid="table">
      {loading && <div>Loading...</div>}
      {rows.map((r) => (
        <div key={r.id} onClick={() => onView(r)}>
          {r.name}
        </div>
      ))}
    </div>
  ),
}))

// Modal
jest.mock('../../../../features/registrations/components/RegistrationDetailsModal', () => ({
  __esModule: true,
  default: ({ item, onClose, onEdit, onDelete }: { item: RegistrationItem | null, onClose: () => void, onEdit?: (item: RegistrationItem) => void, onDelete?: (item: RegistrationItem) => void }) => (
    <div data-testid="modal">
      {item?.name}
      <button aria-label="Close modal" onClick={onClose}>Close</button>
      {onEdit && <button onClick={() => onEdit(item!)}>Edit Details</button>}
      {onDelete && <button onClick={() => onDelete(item!)}>Delete Details</button>}
    </div>
  ),
}))

// Pagination
jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
  __esModule: true,
  default: ({ onPageChange, onPageSizeChange }: { onPageChange: (p: number) => void, onPageSizeChange: (s: number) => void }) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(2)}>Page 2</button>
      <button onClick={() => onPageSizeChange(25)}>Size 25</button>
    </div>
  ),
}))

jest.mock('../../../../features/registrations/components/RegistrationForm', () => ({
  __esModule: true,
  default: ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => (
    <div data-testid="registration-form">
      <button onClick={onClose}>Close Form</button>
      <button onClick={onSuccess}>Success Form</button>
    </div>
  ),
}))

jest.mock('../../../../store/slices/registrations/registrations.thunks', () => {
  const makeThunk = (type: string) =>
    Object.assign(jest.fn(() => ({ type: `${type}/noop` })), {
      pending: { type: `${type}/pending` },
      fulfilled: { type: `${type}/fulfilled` },
      rejected: { type: `${type}/rejected` },
      typePrefix: type,
      unwrap: () => jest.fn().mockResolvedValue({})
    })

  return {
    fetchRegistrations: makeThunk('registrations/fetchRegistrations'),
    deleteRegistrationThunk: Object.assign(
      // Return a real thunk function so dispatchSpy sees expect.any(Function)
      // The thunk middleware returns what the inner function returns.
      jest.fn(() => () => {
        const p = Promise.resolve();
        (p as unknown as { unwrap: () => Promise<unknown> }).unwrap = () => Promise.resolve({});
        return p;
      }),
      {
        pending: { type: 'registrations/delete/pending' },
        fulfilled: { type: 'registrations/delete/fulfilled', match: () => true },
        rejected: { type: 'registrations/delete/rejected' },
      }
    ),
    createRegistrationThunk: makeThunk('registrations/createRegistration'),
    updateRegistrationThunk: makeThunk('registrations/updateRegistration'),
  }
})

import { fetchRegistrations } from '../../../../store/slices/registrations/registrations.thunks'
import { searchRegistrations } from '../../../../services/registrations'
import * as XLSX from 'xlsx'

const makeStore = (initial: Partial<RegistrationsState> = {}) =>
  configureStore({
    reducer: {
      registrations: registrationsReducer,
      auth: authReducer,
    },
    preloadedState: {
      registrations: {
        items: [],
        rawItems: [],
        loading: false,
        error: null,
        page: 1,
        pageSize: 10,
        total: 0,
        appliedFilters: {},
        draftFilters: {},
        selected: null,
        ...initial,
      } as RegistrationsState,
      auth: {
        user: { name: 'Test User', role: 'User', permissions: ['export:excel'] },
        token: 'fake-token',
        loading: false,
        error: null,
      },
    },
  })

describe('RegistrationsPage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders base layout', () => {
    const store = makeStore()
    render(
      <Provider store={store}>
        <RegistrationsPage />
      </Provider>
    )

    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('table')).toBeInTheDocument()
    expect(screen.getByTestId('pagination')).toBeInTheDocument()
  })

  it('dispatches fetch on mount', () => {
    const store = makeStore()
    render(
      <Provider store={store}>
        <RegistrationsPage />
      </Provider>
    )

    expect(fetchRegistrations).toHaveBeenCalledWith({
      filters: {},
      page: 1,
      limit: 10,
    })
  })

  it('shows loading state', () => {
    const store = makeStore({ loading: true })

    render(
      <Provider store={store}>
        <RegistrationsPage />
      </Provider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders items', () => {
    const store = makeStore({
      items: [
        { id: 1, name: 'John' } as RegistrationItem,
        { id: 2, name: 'Jane' } as RegistrationItem,
      ],
    })

    render(
      <Provider store={store}>
        <RegistrationsPage />
      </Provider>
    )

    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Jane')).toBeInTheDocument()
  })

  it('renders error and clears it', async () => {
    const store = makeStore({ error: 'Failed to load data' })

    render(
      <Provider store={store}>
        <RegistrationsPage />
      </Provider>
    )

    expect(screen.getByText('Failed to load data')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Close error'))

    await waitFor(() => {
      expect(store.getState().registrations.error).toBeNull()
    })
  })

  it('opens modal when row clicked', () => {
    const store = makeStore({
      items: [{ id: 1, name: 'Clickable' } as RegistrationItem],
    })

    render(
      <Provider store={store}>
        <RegistrationsPage />
      </Provider>
    )

    fireEvent.click(screen.getByText('Clickable'))

    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })

  it('dispatches clearSelected when modal onClose is called', async () => {
    const store = makeStore({
      items: [{ id: 1, name: 'Closeable' } as RegistrationItem],
    })

    render(
      <Provider store={store}>
        <RegistrationsPage />
      </Provider>
    )

    fireEvent.click(screen.getByText('Closeable'))
    expect(screen.getByTestId('modal')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Close modal'))

    await waitFor(() => {
      expect(store.getState().registrations.selected).toBeNull()
    })
  })

  it('does not render modal when no item is selected (line 43)', () => {
    const store = makeStore({ selected: null })
    render(
      <Provider store={store}>
        <RegistrationsPage />
      </Provider>
    )

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  it('dispatches setPage when pagination page changes', () => {
    const store = makeStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    render(
      <Provider store={store}>
        <RegistrationsPage />
      </Provider>
    )

    dispatchSpy.mockClear()
    fireEvent.click(screen.getByText('Page 2'))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'registrations/setPage' }))
  })

  it('dispatches setPageSize when pagination size changes', () => {
    const store = makeStore()
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    render(
      <Provider store={store}>
        <RegistrationsPage />
      </Provider>
    )

    dispatchSpy.mockClear()
    fireEvent.click(screen.getByText('Size 25'))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'registrations/setPageSize' }))
  })

  it('triggers onDelete callback and handles success', async () => {
    const item = { id: 1, name: 'Item 1', deletedAt: null } as RegistrationItem
    const store = makeStore({ selected: item })
    const dispatchSpy = jest.spyOn(store, 'dispatch') as jest.SpyInstance
    
    // Make sure the thunk unwrap resolves successfully
    const thunks = await import('../../../../store/slices/registrations/registrations.thunks');
    (thunks.deleteRegistrationThunk as unknown as jest.Mock).mockReturnValueOnce(
      () => {
        const p = Promise.resolve();
        (p as unknown as { unwrap: () => Promise<unknown> }).unwrap = () => Promise.resolve({});
        return p;
      }
    );

    render(<Provider store={store}><RegistrationsPage /></Provider>)
    
    expect(screen.getByTestId('modal')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Delete Details'))
    
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Function))
      expect(store.getState().registrations.selected).toBeNull()
    })
  })

  it('handles Excel export successfully', async () => {
    const store = makeStore()
    ;(searchRegistrations as jest.Mock).mockResolvedValue({
      items: [
        { id: 1, name: 'Item 1', email: 'a@b.com', website: { name: 'Site' }, now: '2023-01-01' },
        { id: 2 }
      ],
    })
    
    render(<Provider store={store}><RegistrationsPage /></Provider>)
    
    const exportBtn = screen.getByText('Export Excel')
    fireEvent.click(exportBtn)
    
    await waitFor(() => {
      expect(searchRegistrations).toHaveBeenCalled()
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
      expect(XLSX.writeFile).toHaveBeenCalled()
    })
  })

  it('handles Excel export failure when search returns empty', async () => {
    const store = makeStore()
    ;(searchRegistrations as jest.Mock).mockResolvedValue({
      items: [],
    })
    
    render(<Provider store={store}><RegistrationsPage /></Provider>)
    
    const exportBtn = screen.getByText('Export Excel')
    fireEvent.click(exportBtn)
    
    await waitFor(() => {
      expect(searchRegistrations).toHaveBeenCalled()
      expect(XLSX.writeFile).not.toHaveBeenCalled()
    })
  })

  it('handles Excel export exception (catch block)', async () => {
    const store = makeStore()
    ;(searchRegistrations as jest.Mock).mockRejectedValue(new Error('API Error'))
    
    render(<Provider store={store}><RegistrationsPage /></Provider>)
    
    const exportBtn = screen.getByText('Export Excel')
    fireEvent.click(exportBtn)
    
    await waitFor(() => {
      expect(searchRegistrations).toHaveBeenCalled()
    })
  })

  it('triggers onToggleDeleted properly (lines 92-94)', () => {
    const store = makeStore({ appliedFilters: { onlyDeleted: 'true' } })
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    render(<Provider store={store}><RegistrationsPage /></Provider>)
    
    fireEvent.click(screen.getByText('Toggle Deleted'))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'registrations/updateDraftFilter' }))
  })

  it('triggers onEdit properly, showing the form (lines 124-125, 141-148)', async () => {
    const store = makeStore({
      items: [{ id: 1, name: 'EditMe', deletedAt: null } as RegistrationItem],
      selected: { id: 1, name: 'EditMe', deletedAt: null } as RegistrationItem
    })
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    render(<Provider store={store}><RegistrationsPage /></Provider>)
    
    fireEvent.click(screen.getByText('Edit Details'))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'registrations/clearSelected' }))
    
    expect(screen.getByTestId('registration-form')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Success Form'))
    await waitFor(() => {
        expect(screen.queryByTestId('registration-form')).not.toBeInTheDocument()
    })
  })

  it('handles onClose on RegistrationForm', () => {
    const store = makeStore({
      selected: { id: 1, name: 'EditMe', deletedAt: null } as RegistrationItem
    })
    render(<Provider store={store}><RegistrationsPage /></Provider>)
    
    fireEvent.click(screen.getByText('Edit Details'))
    expect(screen.getByTestId('registration-form')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Close Form'))
    expect(screen.queryByTestId('registration-form')).not.toBeInTheDocument()
  })

  it('handles delete error gracefully (lines 132-133)', async () => {
    const store = makeStore({
      selected: { id: 1, name: 'DeleteMe', deletedAt: null } as RegistrationItem
    })
    
    const thunks = await import('../../../../store/slices/registrations/registrations.thunks');
    (thunks.deleteRegistrationThunk as unknown as jest.Mock).mockReturnValueOnce(
      () => {
        const p = Promise.resolve();
        (p as unknown as { unwrap: () => Promise<unknown> }).unwrap = () => Promise.reject('Delete error text');
        return p;
      }
    );
    
    render(<Provider store={store}><RegistrationsPage /></Provider>)
    
    fireEvent.click(screen.getByText('Delete Details'))
    
    await waitFor(() => {
      expect(thunks.deleteRegistrationThunk).toHaveBeenCalled()
    })
  })

  it('triggers onToggleDeleted properly to false', () => {
    const store = makeStore({ appliedFilters: { onlyDeleted: 'true' }, draftFilters: { onlyDeleted: 'true' } })
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    render(<Provider store={store}><RegistrationsPage /></Provider>)
    
    fireEvent.click(screen.getByText('Toggle Deleted'))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'registrations/updateDraftFilter', payload: { key: 'onlyDeleted', value: 'false' } }))
  })

  it('triggers onToggleDeleted properly to true', () => {
    const store = makeStore({ appliedFilters: { onlyDeleted: 'false' }, draftFilters: { onlyDeleted: 'false' } })
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    render(<Provider store={store}><RegistrationsPage /></Provider>)
    
    fireEvent.click(screen.getByText('Toggle Deleted'))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'registrations/updateDraftFilter', payload: { key: 'onlyDeleted', value: 'true' } }))
  })

  it('handles delete error with Error object', async () => {
    const store = makeStore({
      selected: { id: 1, name: 'DeleteMeObj', deletedAt: null } as RegistrationItem
    })
    
    const thunks = await import('../../../../store/slices/registrations/registrations.thunks');
    (thunks.deleteRegistrationThunk as unknown as jest.Mock).mockReturnValueOnce(
      () => {
        const p = Promise.resolve();
        (p as unknown as { unwrap: () => Promise<unknown> }).unwrap = () => Promise.reject(new Error('Object Error'));
        return p;
      }
    );
    
    render(<Provider store={store}><RegistrationsPage /></Provider>)
    
    fireEvent.click(screen.getByText('Delete Details'))
    
    await waitFor(() => {
      expect(thunks.deleteRegistrationThunk).toHaveBeenCalled()
    })
  })

  it('renders with selected.deletedAt to cover onDelete undefined', () => {
    const item = { id: 1, name: 'DeletedItem', deletedAt: '2023-01-01' } as RegistrationItem
    const store = makeStore({ selected: item })
    render(<Provider store={store}><RegistrationsPage /></Provider>)
    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })

  it('handles Excel export with completely empty item', async () => {
    const store = makeStore()
    ;(searchRegistrations as jest.Mock).mockResolvedValue({ items: [{ id: 2 }] })
    render(<Provider store={store}><RegistrationsPage /></Provider>)
    fireEvent.click(screen.getByText('Export Excel'))
    await waitFor(() => expect(searchRegistrations).toHaveBeenCalled())
  })
})
