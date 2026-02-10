import { render, screen, fireEvent } from '@testing-library/react'
import RegistrationTable from '../../../../features/registrations/components/RegistrationTable'
import '@testing-library/jest-dom'
import type { PresentationType } from '../../../../features/abstracts/types'

// Mock the formatDate util
jest.mock('../../../../utils/utils', () => ({
    formatDate: jest.fn(() => '2024-01-01'),
}))

describe('RegistrationTable', () => {
    const mockOnRetry = jest.fn()
    const mockOnView = jest.fn()

    const mockRegistrations = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john@test.com',
            aemail: 'john.alt@test.com',
            phone: '1234567890',
            wphone: '0987654321',
            institution: 'Test University',
            country: 'USA',
            presentation: 'Oral' as PresentationType,
            participants: '1',
            regtype: 'Full',
            accomm: 'Single',
            checkin: '2024-01-01',
            checkout: '2024-01-05',
            nights: '4',
            accmvalue: '400',
            acmpng: 'None',
            acc_price: '400',
            tot_price: '900',
            transaction_id: 'TXN123',
            status_flag: 1,
            now: '2024-01-01',
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
                error={null}
                onRetry={mockOnRetry}
                onView={mockOnView}
            />
        )

        expect(screen.getByText('Loading registrations...')).toBeInTheDocument()
    })

    it('renders error state with retry button', () => {
        render(
            <RegistrationTable
                rows={[]}
                loading={false}
                error="Failed to load data"
                onRetry={mockOnRetry}
                onView={mockOnView}
            />
        )

        expect(screen.getByText('Failed to load data')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', () => {
        render(
            <RegistrationTable
                rows={[]}
                loading={false}
                error="Failed to load data"
                onRetry={mockOnRetry}
                onView={mockOnView}
            />
        )

        fireEvent.click(screen.getByText('Retry'))
        expect(mockOnRetry).toHaveBeenCalledTimes(1)
    })

    it('renders empty state when no rows', () => {
        render(
            <RegistrationTable
                rows={[]}
                loading={false}
                error={null}
                onRetry={mockOnRetry}
                onView={mockOnView}
            />
        )

        expect(screen.getByText('No registrations found')).toBeInTheDocument()
    })

    it('renders table with registration data', () => {
        render(
            <RegistrationTable
                rows={mockRegistrations}
                loading={false}
                error={null}
                onRetry={mockOnRetry}
                onView={mockOnView}
            />
        )

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@test.com')).toBeInTheDocument()
        expect(screen.getByText('Test University')).toBeInTheDocument()
        expect(screen.getByText('Test Conference')).toBeInTheDocument()
    })

    it('renders email as clickable mailto link', () => {
        render(
            <RegistrationTable
                rows={mockRegistrations}
                loading={false}
                error={null}
                onRetry={mockOnRetry}
                onView={mockOnView}
            />
        )

        const emailLink = screen.getByText('john@test.com')
        expect(emailLink.tagName).toBe('A')
        expect(emailLink).toHaveAttribute('href', 'mailto:john@test.com')
    })

    it('calls onView when view button is clicked', () => {
        render(
            <RegistrationTable
                rows={mockRegistrations}
                loading={false}
                error={null}
                onRetry={mockOnRetry}
                onView={mockOnView}
            />
        )

        const viewButton = screen.getByTitle('View Details')
        fireEvent.click(viewButton)
        expect(mockOnView).toHaveBeenCalledWith(mockRegistrations[0])
    })

    it('renders price fields with correct formatting', () => {
        render(
            <RegistrationTable
                rows={mockRegistrations}
                loading={false}
                error={null}
                onRetry={mockOnRetry}
                onView={mockOnView}
            />
        )

        expect(screen.getByText('$400')).toBeInTheDocument()
        expect(screen.getByText('$900')).toBeInTheDocument()
    })

    it('renders fallback values for missing optional fields', () => {
        const incompleteData = [{
            ...mockRegistrations[0],
            aemail: undefined,
            wphone: undefined,
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
        }]

        render(
            <RegistrationTable
                rows={incompleteData}
                loading={false}
                error={null}
                onRetry={mockOnRetry}
                onView={mockOnView}
            />
        )

        // Check that em-dashes are rendered for null values
        const cells = screen.getAllByText('—')
        expect(cells.length).toBeGreaterThan(0)
    })

    it('renders all table headers', () => {
        render(
            <RegistrationTable
                rows={[]}
                loading={false}
                error={null}
                onRetry={mockOnRetry}
                onView={mockOnView}
            />
        )

        expect(screen.getByText('Website Name')).toBeInTheDocument()
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByText('Email')).toBeInTheDocument()
        expect(screen.getByText('Aemail')).toBeInTheDocument()
        expect(screen.getByText('Phone')).toBeInTheDocument()
        expect(screen.getByText('Country')).toBeInTheDocument()
        expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('renders multiple rows correctly', () => {
        const multipleRows = [
            { ...mockRegistrations[0], id: 1, name: 'User 1', email: 'user1@test.com' },
            { ...mockRegistrations[0], id: 2, name: 'User 2', email: 'user2@test.com' },
            { ...mockRegistrations[0], id: 3, name: 'User 3', email: 'user3@test.com' },
        ]

        render(
            <RegistrationTable
                rows={multipleRows}
                loading={false}
                error={null}
                onRetry={mockOnRetry}
                onView={mockOnView}
            />
        )

        expect(screen.getByText('User 1')).toBeInTheDocument()
        expect(screen.getByText('User 2')).toBeInTheDocument()
        expect(screen.getByText('User 3')).toBeInTheDocument()
    })
})
