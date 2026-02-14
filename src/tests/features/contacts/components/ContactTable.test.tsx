import { render, screen, fireEvent } from '@testing-library/react'
import ContactTable from '../../../../features/contacts/components/ContactTable'
import '@testing-library/jest-dom'
import type { ContactItem } from '../../../../services/contacts'

jest.mock('../../../../utils/utils', () => ({ formatDate: jest.fn(() => '2024-01-01') }))

describe('ContactTable', () => {
    const mockOnView = jest.fn()
    const mockData: ContactItem[] = [{
        id: 1,
        name: 'John Doe',
        email: 'john@test.com',
        phone: '1234567890',
        country: 'USA',
        message: 'Test Message',
        now: '2024-01-01',
        website: { id: 1, name: 'Test Website' }
    }]

    beforeEach(() => jest.clearAllMocks())

    it('renders loading state', () => {
        render(<ContactTable rows={[]} loading={true} onView={mockOnView} />)
        expect(screen.getByText('Loading contact requests...')).toBeInTheDocument()
    })

    it('renders empty state', () => {
        render(<ContactTable rows={[]} loading={false} onView={mockOnView} />)
        expect(screen.getByText('No requests found')).toBeInTheDocument()
    })

    it('renders data rows and all fields', () => {
        render(<ContactTable rows={mockData} loading={false} onView={mockOnView} />)
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@test.com')).toBeInTheDocument()
        expect(screen.getByText('1234567890')).toBeInTheDocument()
        expect(screen.getByText('USA')).toBeInTheDocument()
        expect(screen.getByText('Test Message')).toBeInTheDocument()
        expect(screen.getByText('2024-01-01')).toBeInTheDocument()
        expect(screen.getByText('Test Website')).toBeInTheDocument()
    })

    it('calls onView when view button clicked', () => {
        render(<ContactTable rows={mockData} loading={false} onView={mockOnView} />)
        fireEvent.click(screen.getByTitle('View Details'))
        expect(mockOnView).toHaveBeenCalledWith(mockData[0])
    })

    it('renders fallback values for missing optional fields', () => {
        const incompleteData: ContactItem[] = [{
            id: 1,
            name: 'Jane Doe',
            email: 'jane@test.com',
            phone: '000',
        } as unknown as ContactItem]

        render(<ContactTable rows={incompleteData} loading={false} onView={mockOnView} />)
        const dashes = screen.getAllByText('—')
        expect(dashes.length).toBeGreaterThan(0)
    })
})
