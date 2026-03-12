import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AccRegistrationsPage from '../../../../features/accRegistrations/pages/AccRegistrationsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import accRegistrationsReducer from '../../../../store/slices/accRegistrations/accRegistrations.slice'
import type { AccRegistrationsState } from '../../../../store/slices/accRegistrations/accRegistrations.slice'
import type { AccRegistrationItem } from '../../../../services/accRegistrations'
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
    default: ({ item, onClose }: { item: AccRegistrationItem | null, onClose: () => void }) => (
    <div data-testid="details-modal">
      {item?.name}
      <button onClick={onClose}>Close Detail</button>
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
    default: ({ title, onAddClick, onFilterClick, error, onClearError }: { title: string, onAddClick: () => void, onFilterClick: () => void, error: string | null, onClearError: () => void }) => (
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


const createMockStore = (initial: Partial<AccRegistrationsState> = {}) => {
  const defaultState: AccRegistrationsState = {
    items: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: 10,
    total: 0,
    appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' },
    draftFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' },
    selected: null,
  }

  return configureStore({
    reducer: { accRegistrations: accRegistrationsReducer },
    preloadedState: {
      accRegistrations: { ...defaultState, ...initial },
    },
  })
}

describe('AccRegistrationsPage', () => {
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
})
