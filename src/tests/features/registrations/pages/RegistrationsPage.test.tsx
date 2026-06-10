import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegistrationsPage from '../../../../features/registrations/pages/RegistrationsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import registrationsReducer from '../../../../store/slices/registrations/registrations.slice'
import type { RegistrationsState } from '../../../../store/slices/registrations/registrations.types'
import type { RegistrationItem } from '../../../../services/registrations'

// Header
jest.mock('../../../../components/SectionHeader', () => ({
  __esModule: true,
    default: ({ error, onClearError }: { error: string | null, onClearError: () => void }) => (
    <div data-testid="header">
      {error && (
        <>
          <span>{error}</span>
          <button aria-label="Close error" onClick={onClearError}>
            Close
          </button>
        </>
      )}
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
    default: ({ item, onClose }: { item: RegistrationItem | null, onClose: () => void }) => (
    <div data-testid="modal">
      {item?.name}
      <button aria-label="Close modal" onClick={onClose}>Close</button>
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

jest.mock('../../../../store/slices/registrations/registrations.thunks', () => {
  const makeThunk = (type: string) =>
    Object.assign(jest.fn(() => ({ type: `${type}/noop` })), {
      pending: { type: `${type}/pending` },
      fulfilled: { type: `${type}/fulfilled` },
      rejected: { type: `${type}/rejected` },
      typePrefix: type,
    })

  return {
    fetchRegistrations: makeThunk('registrations/fetchRegistrations'),
    deleteRegistrationThunk: makeThunk('registrations/deleteRegistration'),
    createRegistrationThunk: makeThunk('registrations/createRegistration'),
    updateRegistrationThunk: makeThunk('registrations/updateRegistration'),
  }
})

import { fetchRegistrations } from '../../../../store/slices/registrations/registrations.thunks'

const makeStore = (initial: Partial<RegistrationsState> = {}) =>
  configureStore({
    reducer: { registrations: registrationsReducer },
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
})
