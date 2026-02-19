import { render, screen, fireEvent } from '@testing-library/react'
import ContactDetailsModal from '../../../../features/contacts/components/ContactDetailsModal'
import '@testing-library/jest-dom'

jest.mock('../../../../utils/utils', () => ({ formatDate: jest.fn(() => '2024-01-01 12:00 PM') }))

describe('ContactDetailsModal', () => {
    const mockOnClose = jest.fn()
    const mockItem = { id: 1, name: 'John', email: 'john@test.com', phone: '1234567890', country: 'USA', message: 'Test', now: '2024-01-01', website: { id: 1, name: 'Test' } }

    beforeEach(() => jest.clearAllMocks())

    it('returns null when item is null', () => {
        const { container } = render(<ContactDetailsModal item={null} onClose={mockOnClose} />)
        expect(container.firstChild).toBeNull()
    })

    it('renders modal', () => {
        render(<ContactDetailsModal item={mockItem} onClose={mockOnClose} />)
        expect(screen.getByText('Contact Request Details')).toBeInTheDocument()
    })

    it('calls onClose', () => {
        render(<ContactDetailsModal item={mockItem} onClose={mockOnClose} />)
        fireEvent.click(screen.getByLabelText('Close'))
        expect(mockOnClose).toHaveBeenCalled()
    })
})
