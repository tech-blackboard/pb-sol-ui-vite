import { render, screen, fireEvent } from '@testing-library/react'
import SponsorshipTable from '../../../../features/sponsorships/components/SponsorshipTable'
import '@testing-library/jest-dom'

jest.mock('../../../../utils/utils', () => ({ formatDate: jest.fn(() => '2024-01-01') }))

describe('SponsorshipTable', () => {
    const mockOnRetry = jest.fn()
    const mockOnView = jest.fn()
    const mockData = [{ id: 1, name: 'John', email: 'john@test.com', phone: '1234567890', organization: 'Test Org', country: 'USA', message: 'Test', now: '2024-01-01', website: { id: 1, name: 'TestConf' } }]

    beforeEach(() => jest.clearAllMocks())

    it('renders loading', () => {
        render(<SponsorshipTable rows={[]} loading={true} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('Loading sponsorship inquiries...')).toBeInTheDocument()
    })

    it('renders error', () => {
        render(<SponsorshipTable rows={[]} loading={false} error="Failed" onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    it('renders empty', () => {
        render(<SponsorshipTable rows={[]} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('No records found')).toBeInTheDocument()
    })

    it('renders data', () => {
        render(<SponsorshipTable rows={mockData} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('John')).toBeInTheDocument()
    })

    it('calls onView', () => {
        render(<SponsorshipTable rows={mockData} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        fireEvent.click(screen.getByTitle('View Details'))
        expect(mockOnView).toHaveBeenCalled()
    })
})
