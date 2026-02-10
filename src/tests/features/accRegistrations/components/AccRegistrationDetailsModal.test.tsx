import { render, screen, fireEvent } from '@testing-library/react'
import AccRegistrationDetailsModal from '../../../../features/accRegistrations/components/AccRegistrationDetailsModal'
import '@testing-library/jest-dom'

jest.mock('../../../../utils/utils', () => ({
    formatDate: jest.fn(() => '2024-01-01 12:00 PM'),
}))

describe('AccRegistrationDetailsModal', () => {
    const mockOnClose = jest.fn()
    const mockItem = { id: 1, name: 'John', email: 'john@test.com', phone: '1234567890', country: 'USA', now: '2024-01-01', website: { id: 1, name: 'Test Conf' } }

    beforeEach(() => jest.clearAllMocks())

    it('returns null when item is null', () => {
        const { container } = render(<AccRegistrationDetailsModal item={null} onClose={mockOnClose} />)
        expect(container.firstChild).toBeNull()
    })

    it('renders modal', () => {
        render(<AccRegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)
        const accommodationDetailElements = screen.getAllByText('Accommodation Details')
        expect(accommodationDetailElements).toHaveLength(2) // Header and section title
        expect(screen.getByText('John')).toBeInTheDocument()
    })

    it('calls onClose', () => {
        render(<AccRegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)
        fireEvent.click(screen.getByLabelText('Close'))
        expect(mockOnClose).toHaveBeenCalled()
    })
})
