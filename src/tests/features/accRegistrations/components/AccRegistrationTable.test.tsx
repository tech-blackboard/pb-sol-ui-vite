import { render, screen, fireEvent } from '@testing-library/react'
import AccRegistrationTable from '../../../../features/accRegistrations/components/AccRegistrationTable'
import '@testing-library/jest-dom'
import type { AccRegistrationItem } from '../../../../services/accRegistrations'

jest.mock('../../../../utils/utils', () => ({
    formatDate: jest.fn(() => '2024-01-01'),
}))

describe('AccRegistrationTable', () => {
    const mockOnView = jest.fn()

    const mockData: AccRegistrationItem[] = [{
        id: 1,
        name: 'John Doe',
        caption: 'Dr.',
        email: 'john@test.com',
        aemail: 'john.alt@test.com',
        phone: '1234567890',
        wphone: '9876543210',
        institution: 'Test University',
        country: 'USA',
        presentation: 'Oral',
        participants: '18',
        regtype: 'Full',
        accomm: '200',
        checkin: '2024-03-01',
        checkout: '2024-03-05',
        nights: '4',
        accm: '800',
        acmpng: '0',
        acc_pr: '200',
        tot_price: '840',
        transaction_id: 'TXN123',
        status_flag: '1',
        alt_text: 'Earlybird',
        now: '2024-03-10',
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
                onView={mockOnView}
            />
        )
        expect(screen.getByText('Loading accommodation registrations...')).toBeInTheDocument()
    })

    it('renders empty state', () => {
        render(<AccRegistrationTable rows={[]} loading={false} onView={mockOnView} />)
        expect(screen.getByText('No records found')).toBeInTheDocument()
    })

    it('renders data rows and all fields', () => {
        render(<AccRegistrationTable rows={mockData} loading={false} onView={mockOnView} />)

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Dr.')).toBeInTheDocument()
        expect(screen.getByText('john@test.com')).toBeInTheDocument()
        expect(screen.getByText('john.alt@test.com')).toBeInTheDocument()
        expect(screen.getByText('1234567890')).toBeInTheDocument()
        expect(screen.getByText('9876543210')).toBeInTheDocument()
        expect(screen.getByText('Test University')).toBeInTheDocument()
        expect(screen.getByText('USA')).toBeInTheDocument()
        expect(screen.getByText('Oral')).toBeInTheDocument()
        expect(screen.getByText('18')).toBeInTheDocument()
        expect(screen.getByText('Full')).toBeInTheDocument()
        expect(screen.getByText('200')).toBeInTheDocument()
        expect(screen.getByText('800')).toBeInTheDocument()
        expect(screen.getByText('0')).toBeInTheDocument()
        expect(screen.getByText('$200')).toBeInTheDocument()
        expect(screen.getByText('$840')).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('Earlybird')).toBeInTheDocument()
    })

    it('calls onView when view button clicked', () => {
        render(<AccRegistrationTable rows={mockData} loading={false} onView={mockOnView} />)
        fireEvent.click(screen.getByTitle('View Details'))
        expect(mockOnView).toHaveBeenCalledWith(mockData[0])
    })

    it('renders fallback values for missing optional fields', () => {
        const incompleteData: AccRegistrationItem[] = [{
            id: 1,
            name: 'Jane Doe',
            email: 'jane@test.com',
            phone: '000',
            // Missing many fields
        } as unknown as AccRegistrationItem]

        render(<AccRegistrationTable rows={incompleteData} loading={false} onView={mockOnView} />)

        // Count em-dashes or check specific fallbacks
        const dashes = screen.getAllByText('—')
        expect(dashes.length).toBeGreaterThan(0)
    })
})
