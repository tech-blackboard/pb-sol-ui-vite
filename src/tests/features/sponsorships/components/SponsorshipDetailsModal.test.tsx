import { render, screen, fireEvent } from '@testing-library/react'
import SponsorshipDetailsModal from '../../../../features/sponsorships/components/SponsorshipDetailsModal'
import '@testing-library/jest-dom'
import type { SponsorshipItem } from '../../../../services/sponsorships'

jest.mock('../../../../utils/utils', () => ({ formatDate: jest.fn(() => '2024-01-01 12:00 PM') }))

describe('SponsorshipDetailsModal', () => {
    const mockOnClose = jest.fn()
    const mockItem = { id: 1, name: 'John', email: 'john@test.com', phone: '1234567890', organization: 'Test Org', country: 'USA', message: 'Test Message', now: '2024-01-01', website: { id: 1, name: 'Test Conf' } }

    beforeEach(() => jest.clearAllMocks())

    it('returns null when item is null', () => {
        const { container } = render(<SponsorshipDetailsModal item={null} onClose={mockOnClose} />)
        expect(container.firstChild).toBeNull()
    })

    it('renders modal with all fields', () => {
        render(<SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />)

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
        render(<SponsorshipDetailsModal item={minimalItem as unknown as SponsorshipItem} onClose={mockOnClose} />)

        const fallbacks = screen.getAllByText('—')
        expect(fallbacks.length).toBeGreaterThan(0)
        expect(screen.getByText('No additional message provided.')).toBeInTheDocument()
    })

    it('calls onClose when close icon clicked', () => {
        render(<SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />)
        fireEvent.click(screen.getByLabelText('Close'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('calls onClose when close button clicked', () => {
        render(<SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />)
        fireEvent.click(screen.getByText('Close'))
        expect(mockOnClose).toHaveBeenCalled()
    })
})
