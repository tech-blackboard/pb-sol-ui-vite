import { render, screen, fireEvent } from '@testing-library/react'
import RegistrationDetailsModal from '../../../../features/registrations/components/RegistrationDetailsModal'
import '@testing-library/jest-dom'
import type { PresentationType } from '../../../../features/abstracts/types'

// Mock the formatDate util
jest.mock('../../../../utils/utils', () => ({
    formatDate: jest.fn(() => '2024-01-01 12:00 PM'),
}))

describe('RegistrationDetailsModal', () => {
    const mockOnClose = jest.fn()

    const mockItem = {
        id: 9876,
        name: 'John Doe',
        email: 'john@test.com',
        aemail: 'john.alt@test.com',
        phone: '1234567890',
        wphone: '0987654321',
        institution: 'Test University',
        country: 'USA',
        presentation: 'Oral' as PresentationType,
        participants: '15',
        regtype: 'Full Conference',
        accomm: 'Single Room',
        checkin: '2024-01-01',
        checkout: '2024-01-05',
        nights: '4',
        accmvalue: 'Standard',
        acmpng: 'None',
        acc_price: '400',
        tot_price: '900',
        transaction_id: 'TXN123456',
        status_flag: 123,
        now: '2024-01-01T10:00:00Z',
        message: 'Looking forward to the conference!',
        website: { id: 1, name: 'Test Conference 2024' },
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns null when item is null', () => {
        const { container } = render(
            <RegistrationDetailsModal item={null} onClose={mockOnClose} />
        )
        expect(container.firstChild).toBeNull()
    })

    it('renders modal with registration details', () => {
        render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

        expect(screen.getByText('Registration Details')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@test.com')).toBeInTheDocument()
        expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
        render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

        const closeButton = screen.getByLabelText('Close')
        fireEvent.click(closeButton)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when footer close button is clicked', () => {
        render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

        const closeButtons = screen.getAllByText('Close')
        fireEvent.click(closeButtons[closeButtons.length - 1])
        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('renders email as clickable mailto link', () => {
        render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

        const emailLink = screen.getByText('john@test.com')
        expect(emailLink.tagName).toBe('A')
        expect(emailLink).toHaveAttribute('href', 'mailto:john@test.com')
    })

    it('displays all basic information fields', () => {
        render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

        expect(screen.getByText('Test Conference 2024')).toBeInTheDocument()
        expect(screen.getByText('john.alt@test.com')).toBeInTheDocument()
        expect(screen.getByText('1234567890')).toBeInTheDocument()
        expect(screen.getByText('0987654321')).toBeInTheDocument()
        expect(screen.getByText('USA')).toBeInTheDocument()
    })

    it('displays registration and date information', () => {
        render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

        expect(screen.getByText('Oral')).toBeInTheDocument()
        expect(screen.getByText('15')).toBeInTheDocument()
        expect(screen.getByText('Full Conference')).toBeInTheDocument()
        expect(screen.getByText('123')).toBeInTheDocument()
    })

    it('displays accommodation and payment information', () => {
        render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

        expect(screen.getByText('Single Room')).toBeInTheDocument()
        expect(screen.getByText('2024-01-01')).toBeInTheDocument()
        expect(screen.getByText('2024-01-05')).toBeInTheDocument()
        expect(screen.getByText('4')).toBeInTheDocument()
        expect(screen.getByText('$400')).toBeInTheDocument()
        expect(screen.getByText('$900')).toBeInTheDocument()
        expect(screen.getByText('TXN123456')).toBeInTheDocument()
    })

    it('displays message section', () => {
        render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

        expect(screen.getByText('Looking forward to the conference!')).toBeInTheDocument()
    })

    it('displays default message when no message provided', () => {
        const itemWithoutMessage = { ...mockItem, message: undefined }
        render(<RegistrationDetailsModal item={itemWithoutMessage} onClose={mockOnClose} />)

        expect(screen.getByText('No additional message provided.')).toBeInTheDocument()
    })

    it('renders fallback values for missing optional fields', () => {
        const incompleteItem = {
            ...mockItem,
            aemail: undefined,
            wphone: undefined,
            institution: '',
            country: '',
            presentation: 'Oral' as PresentationType,
            participants: '',
            regtype: '',
            accomm: '',
            checkin: undefined,
            checkout: undefined,
            nights: undefined,
            accmvalue: undefined,
            acmpng: undefined,
            acc_price: undefined,
            tot_price: undefined,
            transaction_id: undefined,
            status_flag: undefined,
            now: undefined,
            website: undefined,
        }

        render(<RegistrationDetailsModal item={incompleteItem} onClose={mockOnClose} />)

        // Check that em-dashes are rendered for null values
        const dashes = screen.getAllByText('—')
        expect(dashes.length).toBeGreaterThan(0)
    })

    it('renders status flag with badge styling', () => {
        render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

        const statusBadge = screen.getByText('1')
        expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('formats the date using formatDate utility', () => {
        render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

        const formatDate = jest.requireMock('../../../../utils/utils').formatDate
        expect(formatDate).toHaveBeenCalledWith(mockItem.now)
    })
})
