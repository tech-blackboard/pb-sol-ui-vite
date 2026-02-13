import { render, screen, fireEvent } from '@testing-library/react'
import AccRegistrationsPage from '../../../../features/accRegistrations/pages/AccRegistrationsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import accRegistrationsReducer, { fetchAccRegistrations } from '../../../../store/slices/accRegistrations/accRegistrations.slice'
import type { AccRegistrationsState } from '../../../../store/slices/accRegistrations/accRegistrations.slice'
import type { AccRegistrationItem } from '../../../../services/accRegistrations'
import { useAppDispatch, useAppSelector } from '../../../../store/hooks'
// Mock child components
jest.mock('../../../../features/accRegistrations/components/AccRegistrationTable', () => ({
    __esModule: true,
    default: ({ rows, loading, onView }: { rows: AccRegistrationItem[], loading: boolean, onView?: (item: AccRegistrationItem) => void }) => (
        <div data-testid="acc-table">
            {loading && <div>Loading...</div>}
            {rows.map((row) => (
                <div key={row.id} onClick={() => onView?.(row)}>
                    {row.name}
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
    default: ({ open, onClose }: { open: boolean, onClose: () => void }) => open ? (
        <div data-testid="filters-drawer">
            Filters Drawer
            <button onClick={onClose}>Close Filters</button>
        </div>
    ) : null,
}))

jest.mock('../../../../features/accRegistrations/components/AccommodationForm', () => ({
    __esModule: true,
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="add-form">
            Add Form
            <button onClick={onClose}>Close Form</button>
        </div>
    ),
}))

jest.mock('../../../../store/hooks', () => ({
    useAppDispatch: jest.fn(),
    useAppSelector: jest.fn(),
}))

const createMockStore = (initialState: Partial<AccRegistrationsState> = {}) => {
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
    };

    return configureStore({
        reducer: {
            accRegistrations: accRegistrationsReducer,
        },
        preloadedState: {
            accRegistrations: {
                ...defaultState,
                ...initialState,
            },
        },
    })
}


describe('AccRegistrationsPage', () => {
    const dispatchMock = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (useAppDispatch as jest.Mock).mockReturnValue(dispatchMock)
            ; (useAppSelector as jest.Mock).mockImplementation((selector) => selector(createMockStore().getState()))
    })

    it('renders all components', () => {
        const store = createMockStore()
        render(<Provider store={store}><AccRegistrationsPage /></Provider>)
        expect(screen.getByTestId('section-header')).toBeInTheDocument()
        expect(screen.getByTestId('acc-table')).toBeInTheDocument()
        expect(screen.getByTestId('pagination')).toBeInTheDocument()
    })

    it('fetches data on mount', () => {
        const store = createMockStore()
        render(<Provider store={store}><AccRegistrationsPage /></Provider>)
        expect(fetchAccRegistrations).toHaveBeenCalledWith({
            filters: {},
            page: 1,
            limit: 10
        })
    })

    it('shows loading state', () => {
        const store = createMockStore({ loading: true })
        render(<Provider store={store}><AccRegistrationsPage /></Provider>)
        expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('shows error and can clear it', () => {
        const store = createMockStore({ error: 'Page Error' })
        render(<Provider store={store}><AccRegistrationsPage /></Provider>)
        expect(screen.getByText('Page Error')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Clear'))
        expect(store.getState().accRegistrations.error).toBeNull()
    })

    it('opens add form modal', () => {
        const store = createMockStore()
        render(<Provider store={store}><AccRegistrationsPage /></Provider>)

        fireEvent.click(screen.getByText('Add'))
        expect(screen.getByTestId('add-form')).toBeInTheDocument()
    })

    it('opens filter drawer', () => {
        const store = createMockStore()
        render(<Provider store={store}><AccRegistrationsPage /></Provider>)

        fireEvent.click(screen.getByText('Filter'))
        expect(screen.getByTestId('filters-drawer')).toBeInTheDocument()
    })

    it('sets selected item from table', () => {
        const store = createMockStore({
            items: [{ id: 1, name: 'Guest 1' }]
        })
        render(<Provider store={store}><AccRegistrationsPage /></Provider>)

        fireEvent.click(screen.getByText('Guest 1'))
        expect(store.getState().accRegistrations.selected).toEqual({ id: 1, name: 'Guest 1' })
    })

    it('closes details modal', () => {
        const store = createMockStore({
            selected: { id: 1, name: 'Guest 1' }
        })
        render(<Provider store={store}><AccRegistrationsPage /></Provider>)

        fireEvent.click(screen.getByText('Close Detail'))
        expect(store.getState().accRegistrations.selected).toBeNull()
    })

    it('changes page via pagination', () => {
        const store = createMockStore({ page: 1, total: 20 })
        render(<Provider store={store}><AccRegistrationsPage /></Provider>)

        fireEvent.click(screen.getByText('Next Page'))
        expect(store.getState().accRegistrations.page).toBe(2)
    })
})
