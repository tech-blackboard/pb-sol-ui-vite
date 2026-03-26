import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ContactDetailsModal from '../../../../features/contacts/components/ContactDetailsModal'
import type { ContactItem } from '../../../../services/contacts'

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

    it('renders fallback values for missing optional fields', () => {
        const incompleteItem = {
            id: 2,
            name: 'Jane',
            email: 'jane@test.com',
        } as Partial<ContactItem> as ContactItem
        render(<ContactDetailsModal item={incompleteItem} onClose={mockOnClose} />)
        
        const fallbacks = screen.getAllByText('—')
        expect(fallbacks.length).toBe(4)
        expect(screen.getByText('No additional message provided.')).toBeInTheDocument()
    })
})
