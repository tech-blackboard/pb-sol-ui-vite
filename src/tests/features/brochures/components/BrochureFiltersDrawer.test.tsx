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

    it('dispatches updateDraftFilter on all inputs', () => {
        const store = createMockStore()
        const dispatchSpy = jest.spyOn(store, 'dispatch')
        render(
            <Provider store={store}>
                <BrochureFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )
        
        const inputs = [
            { placeholder: 'Keyword search...', key: 'search' },
            { placeholder: 'Name', key: 'name' },
            { placeholder: 'Email', key: 'email' },
            { placeholder: 'Phone', key: 'phone' },
            { placeholder: 'Country', key: 'country' },
        ]

        inputs.forEach(({ placeholder, key }) => {
            fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value: 'test' } })
            expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
                type: 'brochures/updateDraftFilter',
                payload: { key, value: 'test' }
            }))
        })
    })

    it('dispatches updateDraftFilter on website change', async () => {
        const store = createMockStore()
        const dispatchSpy = jest.spyOn(store, 'dispatch')
        render(
            <Provider store={store}>
                <BrochureFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())

        const select = screen.getByDisplayValue('Website')
        
        // Valid change
        fireEvent.change(select, { target: { value: '1' } })
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'brochures/updateDraftFilter',
            payload: { key: 'website_id', value: 1 }
        }))

        // Empty change
        fireEvent.change(select, { target: { value: '' } })
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'brochures/updateDraftFilter',
            payload: { key: 'website_id', value: undefined }
        }))
    })

    it('dispatches updateDraftFilter on sort change', () => {
        const store = createMockStore()
        const dispatchSpy = jest.spyOn(store, 'dispatch')
        render(
            <Provider store={store}>
                <BrochureFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )
        
        fireEvent.change(screen.getByDisplayValue('Sort by time'), { target: { value: 'name' } })
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'brochures/updateDraftFilter',
            payload: { key: 'sortBy', value: 'name' }
        }))

        fireEvent.change(screen.getByDisplayValue('DESC'), { target: { value: 'ASC' } })
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'brochures/updateDraftFilter',
            payload: { key: 'sortOrder', value: 'ASC' }
        }))
    })

    it('dispatches resetFilters', () => {
        const store = createMockStore()
        const dispatchSpy = jest.spyOn(store, 'dispatch')
        render(
            <Provider store={store}>
                <BrochureFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )
        fireEvent.click(screen.getByText('Reset'))
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'brochures/resetFilters'
        }))
    })

    it('dispatches applyFilters and closes', () => {
        const store = createMockStore()
        const dispatchSpy = jest.spyOn(store, 'dispatch')
        render(
            <Provider store={store}>
                <BrochureFiltersDrawer open={true} onClose={mockOnClose} />
            </Provider>
        )
        fireEvent.click(screen.getByText('Apply'))
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
            type: 'brochures/applyFilters'
        }))
        expect(mockOnClose).toHaveBeenCalled()
    })
})
