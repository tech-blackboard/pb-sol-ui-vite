import { render, screen, fireEvent } from '@testing-library/react'
import SponsorshipTable from '../../../../features/sponsorships/components/SponsorshipTable'
import '@testing-library/jest-dom'
import type { SponsorshipItem } from '../../../../services/sponsorships'

jest.mock('../../../../utils/utils', () => ({ formatDate: jest.fn(() => '2024-01-01') }))

describe('SponsorshipTable', () => {
    const mockOnView = jest.fn()
    const mockData: SponsorshipItem[] = [{
        id: 1,
        name: 'John Doe',
        email: 'john@test.com',
        phone: '1234567890',
        organization: 'Test Org',
        country: 'USA',
        message: 'Interested in sponsoring',
        now: '2024-01-01',
        website: { id: 1, name: 'TestConf' }
    }]

    beforeEach(() => jest.clearAllMocks())

    it('renders loading state', () => {
        render(<SponsorshipTable rows={[]} loading={true} onView={mockOnView} />)
        expect(screen.getByText('Loading sponsorship inquiries...')).toBeInTheDocument()
    })

    it('renders empty state', () => {
        render(<SponsorshipTable rows={[]} loading={false} onView={mockOnView} />)
        expect(screen.getByText('No records found')).toBeInTheDocument()
    })

    it('renders data rows and all fields', () => {
        render(<SponsorshipTable rows={mockData} loading={false} onView={mockOnView} />)
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@test.com')).toBeInTheDocument()
        expect(screen.getByText('1234567890')).toBeInTheDocument()
        expect(screen.getByText('Test Org')).toBeInTheDocument()
        expect(screen.getByText('USA')).toBeInTheDocument()
        expect(screen.getByText('Interested in sponsoring')).toBeInTheDocument()
        expect(screen.getByText('2024-01-01')).toBeInTheDocument()
        expect(screen.getByText('TestConf')).toBeInTheDocument()
    })

    it('calls onView when view button clicked', () => {
        render(<SponsorshipTable rows={mockData} loading={false} onView={mockOnView} />)
        fireEvent.click(screen.getByTitle('View Details'))
        expect(mockOnView).toHaveBeenCalledWith(mockData[0])
    })

    it('renders fallback values for missing optional fields', () => {
        const incompleteData: SponsorshipItem[] = [{
            id: 1,
            name: 'Jane Doe',
            email: 'jane@test.com',
            phone: '000',
        } as unknown as SponsorshipItem]

        render(<SponsorshipTable rows={incompleteData} loading={false} onView={mockOnView} />)
        const dashes = screen.getAllByText('—')
        expect(dashes.length).toBeGreaterThan(0)
    })
})
