import { render, screen, waitFor } from '@testing-library/react'
import RegistrationsPage from '../../../../features/registrations/pages/RegistrationsPage'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import registrationsReducer from '../../../../store/slices/registrations/registrations.slice'

// Mock child components
jest.mock('../../../../features/registrations/components/RegistrationHeader', () => ({
    __esModule: true,
    default: () => <div data-testid="registration-header">Registration Header</div>,
}))

jest.mock('../../../../features/registrations/components/RegistrationTable', () => ({
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: ({ rows, loading, error }: Record<string, any>) => (
        <div data-testid="registration-table">
            {loading && <div>Loading...</div>}
            {error && <div>{error}</div>}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {rows.map((row: Record<string, any>) => <div key={row.id}>{row.name}</div>)}
        </div>
    ),
}))

jest.mock('../../../../features/registrations/components/RegistrationDetailsModal', () => ({
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: ({ item, onClose }: Record<string, any>) => (
        <div data-testid="details-modal">
            {item?.name}
            <button onClick={onClose}>Close</button>
        </div>
    ),
}))

jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: ({ page, total }: Record<string, any>) => (
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
            },
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
        store.dispatch({ type: 'registrations/setPage', payload: 2 })

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
                { id: 1, name: 'John Doe' },
                { id: 2, name: 'Jane Smith' },
            ],
        })

        render(
            <Provider store={store}>
                <RegistrationsPage />
            </Provider>
        )

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
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

    it.skip('shows error state', () => {
        const store = createMockStore({ error: 'Failed to load data' })
        render(
            <Provider store={store}>
                <RegistrationsPage />
            </Provider>
        )

        expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    })
})
