import { render, screen, fireEvent } from '@testing-library/react'
import AccRegistrationDetailsModal from '../../../../features/accRegistrations/components/AccRegistrationDetailsModal'
import '@testing-library/jest-dom'
import type { AccRegistrationItem } from '../../../../services/accRegistrations'

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

    it('renders modal with all fields', () => {
        const fullItem = {
            id: 1,
            caption: 'Mr.',
            name: 'John Doe',
            email: 'john@test.com',
            aemail: 'alt@test.com',
            phone: '111',
            wphone: '222',
            institution: 'Inst',
            country: 'USA',
            presentation: 'Oral',
            participants: '2',
            regtype: 'Full',
            now: '2024-01-01',
            status_flag: 'Paid',
            accomm: '100',
            checkin: '2024-01-01',
            checkout: '2024-01-05',
            nights: '4',
            accm: '400',
            acmpng: '0',
            acc_pr: '100',
            tot_price: '420',
            transaction_id: 'TX123',
            alt_text: 'Some info',
            message: 'Hello!',
            website: { id: 1, name: 'Test Conf' }
        }
        render(<AccRegistrationDetailsModal item={fullItem} onClose={mockOnClose} />)

        expect(screen.getByText('Mr. John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@test.com')).toBeInTheDocument()
        expect(screen.getByText('alt@test.com')).toBeInTheDocument()
        expect(screen.getByText('111')).toBeInTheDocument()
        expect(screen.getByText('Oral')).toBeInTheDocument()
        expect(screen.getByText('Paid')).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument()
        expect(screen.getByText('400')).toBeInTheDocument()
        expect(screen.getByText('$100')).toBeInTheDocument()
        expect(screen.getByText('$420')).toBeInTheDocument()
        expect(screen.getByText('TX123')).toBeInTheDocument()
        expect(screen.getByText('Hello!')).toBeInTheDocument()
    })

    it('renders fallback values for missing fields', () => {
        const minimalItem = { id: 1, name: 'John' }
        render(<AccRegistrationDetailsModal item={minimalItem as AccRegistrationItem} onClose={mockOnClose} />)

        const fallbacks = screen.getAllByText('—')
        expect(fallbacks.length).toBeGreaterThan(0)
        expect(screen.getByText('No additional message provided.')).toBeInTheDocument()
    })

    it('calls onClose when close icon clicked', () => {
        render(<AccRegistrationDetailsModal item={mockItem as AccRegistrationItem} onClose={mockOnClose} />)
        fireEvent.click(screen.getByLabelText('Close'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('calls onClose when close button clicked', () => {
        render(<AccRegistrationDetailsModal item={mockItem as AccRegistrationItem} onClose={mockOnClose} />)
        fireEvent.click(screen.getByText('Close'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('calls onEdit when edit button is clicked', () => {
        const onEdit = jest.fn()
        render(<AccRegistrationDetailsModal item={mockItem as AccRegistrationItem} onClose={mockOnClose} onEdit={onEdit} />)

        fireEvent.click(screen.getByText('Edit'))
        expect(onEdit).toHaveBeenCalledWith(mockItem)
    })

    it('calls onDelete when delete button is clicked and confirmed', () => {
        const onDelete = jest.fn()
        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
        render(<AccRegistrationDetailsModal item={mockItem as AccRegistrationItem} onClose={mockOnClose} onDelete={onDelete} />)

        fireEvent.click(screen.getByText('Delete'))
        expect(confirmSpy).toHaveBeenCalled()
        expect(onDelete).toHaveBeenCalledWith(mockItem)
        confirmSpy.mockRestore()
    })

    it('does not call onDelete when delete button is clicked and cancelled', () => {
        const onDelete = jest.fn()
        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)
        render(<AccRegistrationDetailsModal item={mockItem as AccRegistrationItem} onClose={mockOnClose} onDelete={onDelete} />)

        fireEvent.click(screen.getByText('Delete'))
        expect(confirmSpy).toHaveBeenCalled()
        expect(onDelete).not.toHaveBeenCalled()
        confirmSpy.mockRestore()
    })
})
