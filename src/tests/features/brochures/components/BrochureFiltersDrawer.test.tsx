import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BrochureFiltersDrawer from '../../../../features/brochures/components/BrochureFiltersDrawer'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import brochuresReducer from '../../../../store/slices/brochures/brochures.slice'

jest.mock('../../../../services/sourcedb', () => ({
    listWebsites: jest.fn(),
}))

import { listWebsites } from '../../../../services/sourcedb'

const createMockStore = (draftFilters = {}) => configureStore({
    reducer: { brochures: brochuresReducer },
    preloadedState: {
        brochures: {
            items: [],
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

describe('BrochureFiltersDrawer', () => {
    const mockOnClose = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (listWebsites as jest.Mock).mockResolvedValue([{ id: 1, name: 'Conference A' }])
    })

    it('returns null when not open', () => {
        const store = createMockStore()
        const { container } = render(
            <Provider store={store}>
                <BrochureFiltersDrawer open={false} onClose={mockOnClose} />
            </Provider>
        )
        expect(container.firstChild).toBeNull()
    })

    it('renders drawer when open', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <BrochureFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )
        expect(screen.getByText('Brochure Filters')).toBeInTheDocument()
    })

    it('calls onClose', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <BrochureFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )
        fireEvent.click(screen.getByText('✕'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('renders filter inputs', () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <BrochureFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )
        expect(screen.getByPlaceholderText('Keyword search...')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    })

    it('loads websites', async () => {
        const store = createMockStore()
        render(
            <Provider store={store}>
                <BrochureFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())
    })

    it('dispatches apply filters', () => {
        const store = createMockStore()
        const dispatchSpy = jest.spyOn(store, 'dispatch')
        render(
            <Provider store={store}>
                <BrochureFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )
        fireEvent.click(screen.getByText('Apply'))
        expect(dispatchSpy).toHaveBeenCalled()
        expect(mockOnClose).toHaveBeenCalled()
    })
})
