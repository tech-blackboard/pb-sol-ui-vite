import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegistrationHeader from '../../../../features/registrations/components/RegistrationHeader'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import registrationsReducer from '../../../../store/slices/registrations/registrations.slice'

// Mock child components
jest.mock('../../../../features/registrations/components/RegistrationFiltersDrawer', () => ({
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: ({ open, onClose }: Record<string, any>) => (
        open ? <div data-testid="filters-drawer"><button onClick={onClose}>Close Filters</button></div> : null
    ),
}))

jest.mock('../../../../features/registrations/components/RegistrationForm', () => ({
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: ({ onClose, onSuccess }: Record<string, any>) => (
        <div data-testid="registration-form">
            <button onClick={onClose}>Cancel</button>
            <button onClick={onSuccess}>Submit</button>
        </div>
    ),
}))

jest.mock('../../../../components/SectionHeader', () => ({
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: ({ title, onAddClick, onFilterClick, addButtonText }: Record<string, any>) => (
        <div data-testid="section-header">
            <h2>{title}</h2>
            {onAddClick && <button onClick={onAddClick}>{addButtonText}</button>}
            <button onClick={onFilterClick}>Filters</button>
        </div>
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

describe('RegistrationHeader', () => {
    it('renders the header with title', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <RegistrationHeader />
            </Provider>
        )

        expect(screen.getByText('All Conferences — Registrations')).toBeInTheDocument()
    })

    it('opens registration form when add button is clicked', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <RegistrationHeader />
            </Provider>
        )

        fireEvent.click(screen.getByText('Add Registration'))
        expect(screen.getByTestId('registration-form')).toBeInTheDocument()
    })

    it('closes registration form when cancel is clicked', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <RegistrationHeader />
            </Provider>
        )

        fireEvent.click(screen.getByText('Add Registration'))
        expect(screen.getByTestId('registration-form')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Cancel'))
        expect(screen.queryByTestId('registration-form')).not.toBeInTheDocument()
    })

    it('opens filters drawer when filters button is clicked', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <RegistrationHeader />
            </Provider>
        )

        fireEvent.click(screen.getByText('Filters'))
        expect(screen.getByTestId('filters-drawer')).toBeInTheDocument()
    })

    it('closes filters drawer when close is clicked', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <RegistrationHeader />
            </Provider>
        )

        fireEvent.click(screen.getByText('Filters'))
        expect(screen.getByTestId('filters-drawer')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Close Filters'))
        expect(screen.queryByTestId('filters-drawer')).not.toBeInTheDocument()
    })

    it('handles form submission success', async () => {
        const store = createMockStore()
        const fetchRegistrations = jest.requireMock('../../../../store/slices/registrations/registrations.thunks').fetchRegistrations

        render(
            <Provider store={store}>
                <RegistrationHeader />
            </Provider>
        )

        fireEvent.click(screen.getByText('Add Registration'))
        fireEvent.click(screen.getByText('Submit'))

        await waitFor(() => {
            expect(screen.queryByTestId('registration-form')).not.toBeInTheDocument()
        })

        expect(fetchRegistrations).toHaveBeenCalled()
    })

    it('does not render form or drawer initially', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <RegistrationHeader />
            </Provider>
        )

        expect(screen.queryByTestId('registration-form')).not.toBeInTheDocument()
        expect(screen.queryByTestId('filters-drawer')).not.toBeInTheDocument()
    })
})
