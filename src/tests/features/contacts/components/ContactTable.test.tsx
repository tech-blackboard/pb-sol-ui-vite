import { render, screen, fireEvent } from '@testing-library/react'
import ContactTable from '../../../../features/contacts/components/ContactTable'
import '@testing-library/jest-dom'

jest.mock('../../../../utils/utils', () => ({ formatDate: jest.fn(() => '2024-01-01') }))

describe('ContactTable', () => {
    const mockOnRetry = jest.fn()
    const mockOnView = jest.fn()
    const mockData = [{ id: 1, name: 'John', email: 'john@test.com', phone: '1234567890', country: 'USA', message: 'Test', now: '2024-01-01', website: { id: 1, name: 'Test' } }]

    beforeEach(() => jest.clearAllMocks())

    it('renders loading', () => {
        render(<ContactTable rows={[]} loading={true} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('Loading contact requests...')).toBeInTheDocument()
    })

    it('renders error', () => {
        render(<ContactTable rows={[]} loading={false} error="Failed" onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    it('renders empty', () => {
        render(<ContactTable rows={[]} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('No requests found')).toBeInTheDocument()
    })

    it('renders data', () => {
        render(<ContactTable rows={mockData} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        expect(screen.getByText('John')).toBeInTheDocument()
    })

    it('calls onView', () => {
        render(<ContactTable rows={mockData} loading={false} error={null} onRetry={mockOnRetry} onView={mockOnView} />)
        fireEvent.click(screen.getByTitle('View Details'))
        expect(mockOnView).toHaveBeenCalled()
    })
})
