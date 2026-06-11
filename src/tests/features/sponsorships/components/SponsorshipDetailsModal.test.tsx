import { render, screen, fireEvent } from '@testing-library/react'
import SponsorshipDetailsModal from '../../../../features/sponsorships/components/SponsorshipDetailsModal'
import '@testing-library/jest-dom'
import type { SponsorshipItem } from '../../../../services/sponsorships'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import sponsorshipsReducer from '../../../../store/slices/sponsorships/sponsorships.slice'

const store = configureStore({
    reducer: { sponsorships: sponsorshipsReducer },
    preloadedState: {
        sponsorships: {
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

jest.mock('../../../../utils/utils', () => ({ formatDate: jest.fn(() => '2024-01-01 12:00 PM') }))

describe('SponsorshipDetailsModal', () => {
    const mockOnClose = jest.fn()
    const mockItem = { id: 1, name: 'John', email: 'john@test.com', phone: '1234567890', organization: 'Test Org', country: 'USA', message: 'Test Message', now: '2024-01-01', website: { id: 1, name: 'Test Conf' } }

    beforeEach(() => jest.clearAllMocks())

    it('returns null when item is null', () => {
        const { container } = render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={null} onClose={mockOnClose} />
            </Provider>
        )
        expect(container.firstChild).toBeNull()
    })

    it('renders modal with all fields', () => {
        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )

        expect(screen.getByText('John')).toBeInTheDocument()
        expect(screen.getByText('john@test.com')).toBeInTheDocument()
        expect(screen.getByText('1234567890')).toBeInTheDocument()
        expect(screen.getByText('Test Org')).toBeInTheDocument()
        expect(screen.getByText('USA')).toBeInTheDocument()
        expect(screen.getByText('Test Message')).toBeInTheDocument() // Message
        expect(screen.getByText('2024-01-01 12:00 PM')).toBeInTheDocument()
    })

    it('renders fallback values for missing fields', () => {
        const minimalItem = { id: 1, name: 'John' }
        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={minimalItem as unknown as SponsorshipItem} onClose={mockOnClose} />
            </Provider>
        )

        const fallbacks = screen.getAllByText('—')
        expect(fallbacks.length).toBeGreaterThan(0)
        expect(screen.getByText('No additional message provided.')).toBeInTheDocument()
    })

    it('calls onClose when close icon clicked', () => {
        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )
        fireEvent.click(screen.getByLabelText('Close'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('calls onClose when close button clicked', () => {
        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )
        fireEvent.click(screen.getByText('Close'))
        expect(mockOnClose).toHaveBeenCalled()
    })
})
