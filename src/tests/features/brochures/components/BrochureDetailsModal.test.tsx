import { render, screen, fireEvent } from '@testing-library/react'
import BrochureDetailsModal from '../../../../features/brochures/components/BrochureDetailsModal'
import '@testing-library/jest-dom'
import type { BrochureItem } from '../../../../services/brochures'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import brochuresReducer from '../../../../store/slices/brochures/brochures.slice'

const store = configureStore({
    reducer: { brochures: brochuresReducer },
    preloadedState: {
        brochures: {
            editLoading: false,
            items: [],
            loading: false,
            error: null,
            page: 1,
            pageSize: 10,
            total: 0,
            appliedFilters: {},
            draftFilters: {},
            selected: null,
        }
    }
})

jest.mock('../../../../utils/utils', () => ({
    formatDate: jest.fn(() => '2024-01-01 12:00 PM'),
}))

describe('BrochureDetailsModal', () => {
    const mockOnClose = jest.fn()
    const mockItem = {
        id: 1,
        name: 'John Doe',
        email: 'john@test.com',
        phone: '1234567890',
        country: 'USA',
        message: 'Please send brochure',
        now: '2024-01-01',
        website: { id: 1, name: 'Test Conference' },
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns null when item is null', () => {
        const { container } = render(
            <Provider store={store}>
                <BrochureDetailsModal item={null} onClose={mockOnClose} />
            </Provider>
        )
        expect(container.firstChild).toBeNull()
    })

    it('renders modal with data', () => {
        render(
            <Provider store={store}>
                <BrochureDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )
        expect(screen.getByText('Brochure Request Details')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('calls onClose', () => {
        render(
            <Provider store={store}>
                <BrochureDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )
        fireEvent.click(screen.getByLabelText('Close'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('renders email as mailto link', () => {
        render(
            <Provider store={store}>
                <BrochureDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )
        const emailLink = screen.getByText('john@test.com')
        expect(emailLink).toHaveAttribute('href', 'mailto:john@test.com')
    })

    it('displays message', () => {
        render(
            <Provider store={store}>
                <BrochureDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )
        expect(screen.getByText('Please send brochure')).toBeInTheDocument()
    })

    it('renders placeholder for missing optional fields', () => {
        const minimalItem = {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@test.com',
            phone: null,
            country: undefined,
            message: '',
            now: null,
            website: null,
        } as unknown as BrochureItem
        render(
            <Provider store={store}>
                <BrochureDetailsModal item={minimalItem} onClose={mockOnClose} />
            </Provider>
        )
        
        const placeholders = screen.getAllByText('—')
        expect(placeholders.length).toBeGreaterThanOrEqual(4)
        expect(screen.getByText('No additional message provided.')).toBeInTheDocument()
    })
})
