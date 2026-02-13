import { render, screen, fireEvent } from '@testing-library/react'
import RegistrationTable from '../../../../features/registrations/components/RegistrationTable'
import '@testing-library/jest-dom'
import type { RegistrationItem } from '../../../../services/registrations'

// Mock the formatDate util
jest.mock('../../../../utils/utils', () => ({
    formatDate: jest.fn(() => '2024-01-01'),
}))

describe('RegistrationTable', () => {
    const mockOnView = jest.fn()

    const mockRegistrations: RegistrationItem[] = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john@test.com',
            aemail: 'john.alt@test.com',
            phone: '1234567890',
            wphone: '0987654321',
            institution: 'Test University',
            country: 'USA',
            presentation: 'Oral',
            participants: '15',
            regtype: 'Full',
            accomm: 'Single',
            checkin: '2024-02-01',
            checkout: '2024-02-05',
            nights: '4',
            accmvalue: '400',
            acmpng: 'None',
            acc_price: '400',
            tot_price: '900',
            transaction_id: 'TXN123',
            status_flag: 123,
            now: '2024-02-10',
            website: { id: 1, name: 'Test Conference' },
        },
    ]

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders loading state', () => {
        render(
            <RegistrationTable
                rows={[]}
                loading={true}
                onView={mockOnView}
            />
        )

        expect(screen.getByText('Loading registrations...')).toBeInTheDocument()
    })

    it('renders empty state when no rows', () => {
        render(
            <RegistrationTable
                rows={[]}
                loading={false}
                onView={mockOnView}
            />
        )

        expect(screen.getByText('No registrations found')).toBeInTheDocument()
    })

    it('renders table with registration data and all fields', () => {
        render(
            <RegistrationTable
                rows={mockRegistrations}
                loading={false}
                onView={mockOnView}
            />
        )

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@test.com')).toBeInTheDocument()
        expect(screen.getByText('john.alt@test.com')).toBeInTheDocument()
        expect(screen.getByText('1234567890')).toBeInTheDocument()
        expect(screen.getByText('0987654321')).toBeInTheDocument()
        expect(screen.getByText('Test University')).toBeInTheDocument()
        expect(screen.getByText('USA')).toBeInTheDocument()
        expect(screen.getByText('Oral')).toBeInTheDocument()
        expect(screen.getByText('15')).toBeInTheDocument() // participants
        expect(screen.getByText('Full')).toBeInTheDocument()
        expect(screen.getByText('Single')).toBeInTheDocument()

        // Use getAllByText for dates if they are mocked to the same value, 
        // or just ensure they are unique. Since formatDate is mocked to '2024-01-01', 
        // they will all be '2024-01-01'.
        const dates = screen.getAllByText('2024-01-01')
        expect(dates.length).toBeGreaterThanOrEqual(2) // checkin, now

        expect(screen.getByText('4')).toBeInTheDocument() // nights
        expect(screen.getByText('400')).toBeInTheDocument() // accmvalue
        expect(screen.getByText('None')).toBeInTheDocument() // acmpng
        expect(screen.getByText('$400')).toBeInTheDocument()
        expect(screen.getByText('$900')).toBeInTheDocument()
        expect(screen.getByText('TXN123')).toBeInTheDocument()
        expect(screen.getByText('123')).toBeInTheDocument() // status_flag
        expect(screen.getByText('Test Conference')).toBeInTheDocument()
    })

    it('calls onView when view button is clicked', () => {
        render(
            <RegistrationTable
                rows={mockRegistrations}
                loading={false}
                onView={mockOnView}
            />
        )

        const viewButton = screen.getByTitle('View Details')
        fireEvent.click(viewButton)
        expect(mockOnView).toHaveBeenCalledWith(mockRegistrations[0])
    })

    it('renders fallback values for missing optional fields', () => {
        const incompleteData: RegistrationItem[] = [{
            id: 1,
            name: 'Jane Doe',
            email: 'jane@test.com',
            phone: '000',
        } as unknown as RegistrationItem]

        render(
            <RegistrationTable
                rows={incompleteData}
                loading={false}
                onView={mockOnView}
            />
        )

        const dashes = screen.getAllByText('—')
        expect(dashes.length).toBeGreaterThan(0)
    })
})
