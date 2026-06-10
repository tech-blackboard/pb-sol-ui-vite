import { render, screen, fireEvent } from '@testing-library/react'
import BrochuresPage from '../../../../features/brochures/pages/BrochuresPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import brochuresReducer from '../../../../store/slices/brochures/brochures.slice'
import type { BrochureItem } from '../../../../services/brochures'

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
  default: ({ item, onClose }: { item: BrochureItem | null, onClose: () => void }) => (
    <div data-testid="details-modal">
        {item?.name}
        <button onClick={onClose}>Close Details</button>
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
    default: ({ onFilterClick, onAddClick, error, onClearError }: { onFilterClick: () => void, onAddClick: () => void, error: string | null, onClearError: () => void }) => (
        <div data-testid="section-header">
            <button onClick={onFilterClick}>Open Filters</button>
            <button onClick={onAddClick}>Open Form</button>
            {error && <div onClick={onClearError}>{error}</div>}
        </div>
    )
}))

/* ---------------- STORE ---------------- */

const createMockStore = (initialState = {}) =>
  configureStore({
    reducer: { brochures: brochuresReducer },
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
    },
  })

describe('BrochuresPage', () => {
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
})
