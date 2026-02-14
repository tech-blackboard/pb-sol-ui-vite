import { render, screen } from '@testing-library/react'
import BrochuresPage from '../../../../features/brochures/pages/BrochuresPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import brochuresReducer from '../../../../store/slices/brochures/brochures.slice'
import type { BrochureItem } from '../../../../services/brochures'

/* ---------------- MOCK UI ONLY ---------------- */

jest.mock('../../../../features/brochures/components/BrochureTable', () => ({
  __esModule: true,
  default: ({ rows }: { rows: BrochureItem[] }) => (
    <div data-testid="brochure-table">
      {rows.map((r) => (
        <div key={r.id}>{r.name}</div>
      ))}
    </div>
  ),
}))

jest.mock('../../../../features/brochures/components/BrochureDetailsModal', () => ({
  __esModule: true,
  default: ({ item }: { item: BrochureItem | null }) => (
    <div data-testid="details-modal">{item?.name}</div>
  ),
}))

jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
  __esModule: true,
  default: () => <div data-testid="pagination">Pagination</div>,
}))

/* ---------------- STORE ---------------- */

const createMockStore = (initialState = {}) =>
  configureStore({
    reducer: { brochures: brochuresReducer },
    preloadedState: {
      brochures: {
        items: [],
        loading: false,
        error: null,
        page: 1,
        pageSize: 10,
        total: 0,
        appliedFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' as const },
        draftFilters: { search: '', sortBy: 'now', sortOrder: 'DESC' as const },
        selected: null,
        ...initialState,
      },
    },
  })

describe('BrochuresPage', () => {
  it('renders child components', () => {
    const store = createMockStore()

    render(
      <Provider store={store}>
        <BrochuresPage />
      </Provider>
    )

    expect(screen.getByTestId('brochure-table')).toBeInTheDocument()
    expect(screen.getByTestId('pagination')).toBeInTheDocument()
  })

  it('displays items', () => {
    const store = createMockStore({
      items: [{ id: 1, name: 'John Doe' }],
    })

    render(
      <Provider store={store}>
        <BrochuresPage />
      </Provider>
    )

    expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
  })

  it('renders modal when selected exists', () => {
    const store = createMockStore({
      selected: { id: 1, name: 'John' },
    })

    render(
      <Provider store={store}>
        <BrochuresPage />
      </Provider>
    )

    expect(screen.getByTestId('details-modal')).toBeInTheDocument()
  })
})
