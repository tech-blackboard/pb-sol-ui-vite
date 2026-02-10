import { render, screen, fireEvent } from '@testing-library/react'
import AccRegistrationTable from '../../../../features/accRegistrations/components/AccRegistrationTable'
import '@testing-library/jest-dom'
import type { accRegistrationRecord, PresentationType } from '../../../../features/abstracts/types'

jest.mock('../../../../utils/utils', () => ({
    formatDate: jest.fn(() => '2024-01-01'),
}))

describe('AccRegistrationTable', () => {
    const mockOnRetry = jest.fn()
    const mockOnView = jest.fn()

    const mockData: accRegistrationRecord[] = [{
        id: 1,
        name: 'John Doe',
        caption: 'Dr.',
        email: 'john@test.com',
        aemail: 'john.alt@test.com',
        phone: '1234567890',
        wphone: '9876543210',
        institution: 'Test University',
        country: 'USA',
        presentation: 'Oral' as PresentationType,
        participants: '2',
        regtype: 'Full',
        accomm: 'Single Room',
        checkin: '2024-01-01',
        checkout: '2024-01-05',
        nights: '4',
        accm: 'Standard',
        acmpng: 'None',
        acc_pr: '400',
        tot_price: '900',
        transaction_id: 'TXN123',
        status_flag: 'confirmed',
        alt_text: 'Earlybird',
        now: '2024-01-01',
        website: { id: 1, name: 'Test Conf' },
    }]

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders loading state', () => {
        render(
            <AccRegistrationTable
                rows={[]}
                loading={true}
                error={null}
                onRetry={mockOnRetry}
                onView={mockOnView}
            />
        )
        expect(screen.getByText('Loading accommodation registrations...')).toBeInTheDocument()
    })

    it('renders error state', () => {
        render(
            <AccRegistrationTable
                rows={[]}
                loading={false}
                error="Failed to load"
                onRetry={mockOnRetry}
                onView={mockOnView}
            />
        )
        expect(screen.getByText('Failed to load')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('calls onRetry when retry is clicked', () => {
        render(<AccRegistrationTable rows={[]} loading={false} error="Error" onRetry={mockOnRetry} onView={mockOnView} />)
        fireEvent.click(screen.getByText('Retry'))
        expect(mockOnRetry).toHaveBeenCalled()
    })

    it('renders empty state', () => {
        render(<AccRegistrationTable rows={[]} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('No records found')).toBeInTheDocument()
    })

    it('renders data rows', () => {
        render(<AccRegistrationTable rows={mockData} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@test.com')).toBeInTheDocument()
    })

    it('renders email as mailto link', () => {
        render(<AccRegistrationTable rows={mockData} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        const emailLink = screen.getByText('john@test.com')
        expect(emailLink).toHaveAttribute('href', 'mailto:john@test.com')
    })

    it('calls onView when view button clicked', () => {
        render(<AccRegistrationTable rows={mockData} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        fireEvent.click(screen.getByTitle('View Details'))
        expect(mockOnView).toHaveBeenCalledWith(mockData[0])
    })

    it('renders caption with name', () => {
        render(<AccRegistrationTable rows={mockData} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('Dr.')).toBeInTheDocument()
    })

    it('renders price with dollar sign', () => {
        render(<AccRegistrationTable rows={mockData} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('$400')).toBeInTheDocument()
        expect(screen.getByText('$900')).toBeInTheDocument()
    })
})
