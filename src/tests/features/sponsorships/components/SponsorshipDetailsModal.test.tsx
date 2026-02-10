import { render, screen, fireEvent } from '@testing-library/react'
import SponsorshipDetailsModal from '../../../../features/sponsorships/components/SponsorshipDetailsModal'
import '@testing-library/jest-dom'

jest.mock('../../../../utils/utils', () => ({ formatDate: jest.fn(() => '2024-01-01 12:00 PM') }))

describe('SponsorshipDetailsModal', () => {
    const mockOnClose = jest.fn()
    const mockItem = { id: 1, name: 'John', email: 'john@test.com', phone: '1234567890', organization: 'Test Org', country: 'USA', message: 'Test', now: '2024-01-01', website: { id: 1, name: 'Test' } }

    beforeEach(() => jest.clearAllMocks())

    it('returns null when item is null', () => {
        const { container } = render(<SponsorshipDetailsModal item={null} onClose={mockOnClose} />)
        expect(container.firstChild).toBeNull()
    })

    it('renders modal', () => {
        render(<SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />)
        expect(screen.getByText('Sponsorship Inquiry Details')).toBeInTheDocument()
    })

    it('calls onClose', () => {
        render(<SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />)
        fireEvent.click(screen.getByLabelText('Close'))
        expect(mockOnClose).toHaveBeenCalled()
    })
})
