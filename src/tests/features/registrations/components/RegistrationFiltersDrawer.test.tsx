import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegistrationFiltersDrawer from '../../../../features/registrations/components/RegistrationFiltersDrawer'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import registrationsReducer from '../../../../store/slices/registrations/registrations.slice'

// Mock services
jest.mock('../../../../services/sourcedb', () => ({
    listWebsites: jest.fn(),
}))

import { listWebsites } from '../../../../services/sourcedb'

const createMockStore = (draftFilters = {}) => {
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
                draftFilters,
                selected: null,
            },
        },
    })
}

describe('RegistrationFiltersDrawer', () => {
    const mockOnClose = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (listWebsites as jest.Mock).mockResolvedValue([
                { id: 1, name: 'Conference A' },
                { id: 2, name: 'Conference B' },
            ])
    })

    it('returns null when not open', () => {
        const store = createMockStore()
        const { container } = render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={false} onClose={mockOnClose} />
            </Provider>
        )
        expect(container.firstChild).toBeNull()
    })

    it('renders drawer when open', async () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )

        await waitFor(() => {
            expect(screen.getByText('Registration Filters')).toBeInTheDocument()
        })
    })

    it('calls onClose when close button is clicked', async () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )

        await waitFor(() => {
            expect(screen.getByText('Registration Filters')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('✕'))
        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when backdrop is clicked', () => {
        const store = createMockStore()
        const { container } = render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )

        const backdrop = container.querySelector('.bg-black\\/40')
        fireEvent.click(backdrop!)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('renders all filter input fields', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )

        expect(screen.getByPlaceholderText('Keyword search...')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Phone')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Country')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Institution')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Presentation')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Status Flag')).toBeInTheDocument()
    })

    it('loads and displays website options', async () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )

        await waitFor(() => {
            expect(listWebsites).toHaveBeenCalled()
        })

        await waitFor(() => {
            expect(screen.getByText('Conference A')).toBeInTheDocument()
            expect(screen.getByText('Conference B')).toBeInTheDocument()
        })
    })

    it('displays loading state for website dropdown', () => {
        const store = createMockStore()
            ; (listWebsites as jest.Mock).mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
            )

        render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )

        expect(screen.getByText('Loading websites…')).toBeInTheDocument()
    })

    it('updates filter values through Redux', () => {
        const store = createMockStore({ search: 'test', name: 'John' })
        render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )

        const searchInput = screen.getByPlaceholderText('Keyword search...') as HTMLInputElement
        const nameInput = screen.getByPlaceholderText('Name') as HTMLInputElement

        expect(searchInput.value).toBe('test')
        expect(nameInput.value).toBe('John')
    })

    it('dispatches updateDraftFilter on input change', () => {
        const store = createMockStore()
        const dispatchSpy = jest.spyOn(store, 'dispatch')

        render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )

        const emailInput = screen.getByPlaceholderText('Email')
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

        expect(dispatchSpy).toHaveBeenCalled()
    })

    it('renders sort options', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )

        expect(screen.getByText('Sort by time')).toBeInTheDocument()
        expect(screen.getByText('Sort by name')).toBeInTheDocument()
        expect(screen.getByText('DESC')).toBeInTheDocument()
        expect(screen.getByText('ASC')).toBeInTheDocument()
    })

    it('dispatches resetFilters when reset button is clicked', () => {
        const store = createMockStore()
        const dispatchSpy = jest.spyOn(store, 'dispatch')

        render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )

        fireEvent.click(screen.getByText('Reset'))
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: expect.stringContaining('reset') }))
    })

    it('dispatches applyFilters and closes when apply button is clicked', () => {
        const store = createMockStore()
        const dispatchSpy = jest.spyOn(store, 'dispatch')

        render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )

        fireEvent.click(screen.getByText('Apply'))
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: expect.stringContaining('apply') }))
        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not load websites when drawer is closed', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={false} onClose={mockOnClose} />
            </Provider>
        )

        expect(listWebsites).not.toHaveBeenCalled()
    })

    it('handles website selection', async () => {
        const store = createMockStore()
        const dispatchSpy = jest.spyOn(store, 'dispatch')

        render(
            <Provider store={store}>
                <RegistrationFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )

        await waitFor(() => {
            expect(screen.getByText('Conference A')).toBeInTheDocument()
        })

        const websiteSelect = screen.getByDisplayValue(/Website|Loading/)
        fireEvent.change(websiteSelect, { target: { value: '1' } })

        expect(dispatchSpy).toHaveBeenCalled()
    })
})
