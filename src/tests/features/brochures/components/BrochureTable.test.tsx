import { render, screen, fireEvent } from '@testing-library/react'
import BrochureTable from '../../../../features/brochures/components/BrochureTable'
import '@testing-library/jest-dom'

jest.mock('../../../../utils/utils', () => ({
    formatDate: jest.fn(() => '2024-01-01'),
}))

describe('BrochureTable', () => {
    const mockOnRetry = jest.fn()
    const mockOnView = jest.fn()

    const mockData = [{
        id: 1,
        name: 'John Doe',
        email: 'john@test.com',
        phone: '1234567890',
        country: 'USA',
        message: 'Please send brochure',
        now: '2024-01-01',
        website: { id: 1, name: 'Test Conf' },
    }]

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders loading state', () => {
        render(<BrochureTable rows={[]} loading={true} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('Loading brochure requests...')).toBeInTheDocument()
    })

    it('renders error state', () => {
        render(<BrochureTable rows={[]} loading={false} error="Failed to load" onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('Failed to load')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('calls onRetry', () => {
        render(<BrochureTable rows={[]} loading={false} error="Error" onRetry={mockOnRetry} onView={mockOnView} />)
        fireEvent.click(screen.getByText('Retry'))
        expect(mockOnRetry).toHaveBeenCalled()
    })

    it('renders empty state', () => {
        render(<BrochureTable rows={[]} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('No requests found')).toBeInTheDocument()
    })

    it('renders data rows', () => {
        render(<BrochureTable rows={mockData} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@test.com')).toBeInTheDocument()
    })

    it('renders email as mailto link', () => {
        render(<BrochureTable rows={mockData} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        const emailLink = screen.getByText('john@test.com')
        expect(emailLink).toHaveAttribute('href', 'mailto:john@test.com')
    })

    it('calls onView', () => {
        render(<BrochureTable rows={mockData} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        fireEvent.click(screen.getByTitle('View Details'))
        expect(mockOnView).toHaveBeenCalledWith(mockData[0])
    })
})
