import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import RegistrationsPage from '../../../../features/registrations/pages/RegistrationsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import registrationsReducer from '../../../../store/slices/registrations/registrations.slice'
import type { RegistrationsState } from '../../../../store/slices/registrations/registrations.types'
import type { RegistrationItem } from '../../../../services/registrations'

// Mock child components
jest.mock('../../../../features/registrations/components/RegistrationHeader', () => ({
    __esModule: true,
    default: ({ error, onClearError }: { error: string | null, onClearError: () => void }) => (
        <div data-testid="registration-header">
            Registration Header
            {error && (
                <div>
                    <span>{error}</span>
                    <button onClick={onClearError}>Clear Error</button>
                </div>
            )}
        </div>
    ),
}))

jest.mock('../../../../features/registrations/components/RegistrationTable', () => ({
    __esModule: true,
    default: ({ rows, loading, error, onView }: { rows: RegistrationItem[], loading: boolean, error: string | null, onView: (item: RegistrationItem) => void }) => (
        <div data-testid="registration-table">
            {loading && <div>Loading...</div>}
            {error && <div>{error}</div>}
            {rows.map((row) => (
                <div key={row.id} onClick={() => onView?.(row)}>
                    {row.name}
                </div>
            ))}
        </div>
    ),
}))

jest.mock('../../../../features/registrations/components/RegistrationDetailsModal', () => ({
    __esModule: true,
    default: ({ item, onClose }: { item: RegistrationItem | null, onClose: () => void }) => (
        <div data-testid="details-modal">
            {item?.name}
            <button onClick={onClose}>Close</button>
        </div>
    ),
}))

jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
    __esModule: true,
    default: ({ page, total }: { page: number, total: number }) => (
        <div data-testid="pagination">Page {page} of {total}</div>
    ),
}))

jest.mock('../../../../store/slices/registrations/registrations.thunks', () => ({
    fetchRegistrations: Object.assign(
        jest.fn(() => ({ type: 'registrations/fetchRegistrations/pending' })),
        {
            pending: { type: 'registrations/fetchRegistrations/pending' },
            fulfilled: { type: 'registrations/fetchRegistrations/fulfilled' },
            rejected: { type: 'registrations/fetchRegistrations/rejected' },
            typePrefix: 'registrations/fetchRegistrations'
        }
    ),
    deleteRegistrationThunk: Object.assign(
        jest.fn(() => ({ type: 'registrations/deleteRegistration/pending' })),
        {
            pending: { type: 'registrations/deleteRegistration/pending' },
            fulfilled: { type: 'registrations/deleteRegistration/fulfilled' },
            rejected: { type: 'registrations/deleteRegistration/rejected' },
            typePrefix: 'registrations/deleteRegistration'
        }
    ),
    createRegistrationThunk: Object.assign(
        jest.fn(() => ({ type: 'registrations/createRegistration/pending' })),
        {
            pending: { type: 'registrations/createRegistration/pending' },
            fulfilled: { type: 'registrations/createRegistration/fulfilled' },
            rejected: { type: 'registrations/createRegistration/rejected' },
            typePrefix: 'registrations/createRegistration'
        }
    ),
}))

import { fetchRegistrations } from '../../../../store/slices/registrations/registrations.thunks'

const createMockStore = (initialState = {}) => {
    return configureStore({
        reducer: {
            registrations: registrationsReducer,
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
                ...initialState,
            } as unknown as RegistrationsState,
        },
    })
}

describe('RegistrationsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders all child components', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <RegistrationsPage />
            </Provider>
        )

        expect(screen.getByTestId('registration-header')).toBeInTheDocument()
        expect(screen.getByTestId('registration-table')).toBeInTheDocument()
        expect(screen.getByTestId('pagination')).toBeInTheDocument()
    })

    it('fetches registrations on mount', () => {
        const store = createMockStore()
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

    it('refetches when page changes', async () => {
        const store = createMockStore({ page: 1 })
        const { rerender } = render(
            <Provider store={store}>
                <RegistrationsPage />
            </Provider>
        )

        // Change page
        await act(async () => {
            store.dispatch({ type: 'registrations/setPage', payload: 2 })
        })

        rerender(
            <Provider store={store}>
                <RegistrationsPage />
            </Provider>
        )

        await waitFor(() => {
            expect(fetchRegistrations).toHaveBeenCalledTimes(2)
        })
    })

    it('displays registration items', () => {
        const store = createMockStore({
            items: [
                { id: 101, name: 'Unique John' },
                { id: 102, name: 'Unique Jane' },
            ],
        })

        render(
            <Provider store={store}>
                <RegistrationsPage />
            </Provider>
        )

        expect(screen.getByText('Unique John')).toBeInTheDocument()
        expect(screen.getByText('Unique Jane')).toBeInTheDocument()
    })

    it('does not render details modal when no item selected', () => {
        const store = createMockStore({ selected: null })
        render(
            <Provider store={store}>
                <RegistrationsPage />
            </Provider>
        )

        expect(screen.queryByTestId('details-modal')).not.toBeInTheDocument()
    })

    it('renders details modal when item is selected', () => {
        const store = createMockStore({
            selected: { id: 1, name: 'John Doe' },
        })

        render(
            <Provider store={store}>
                <RegistrationsPage />
            </Provider>
        )

        expect(screen.getByTestId('details-modal')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('passes correct props to pagination component', () => {
        const store = createMockStore({
            page: 2,
            pageSize: 20,
            total: 100,
        })

        render(
            <Provider store={store}>
                <RegistrationsPage />
            </Provider>
        )

        expect(screen.getByTestId('pagination')).toBeInTheDocument()
    })

    it('shows loading state', () => {
        const store = createMockStore({ loading: true })
        render(
            <Provider store={store}>
                <RegistrationsPage />
            </Provider>
        )

        expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('shows error state', () => {
        const store = createMockStore({ error: 'Failed to load data' })
        render(
            <Provider store={store}>
                <RegistrationsPage />
            </Provider>
        )

        expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    })

    it('sets selected item when table row is clicked', async () => {
        const store = createMockStore({
            items: [{ id: 101, name: 'Selectable John' }],
        })
        render(
            <Provider store={store}>
                <RegistrationsPage />
            </Provider>
        )

        fireEvent.click(screen.getByText('Selectable John'))

        expect(store.getState().registrations.selected).toEqual({ id: 101, name: 'Selectable John' })
    })

    it('clears error when requested', () => {
        const store = createMockStore({ error: 'Some error' })
        render(
            <Provider store={store}>
                <RegistrationsPage />
            </Provider>
        )

        fireEvent.click(screen.getByLabelText('Close alert'))
        expect(store.getState().registrations.error).toBeNull()
    })
})
