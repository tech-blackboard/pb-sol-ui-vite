import { render, screen, fireEvent } from '@testing-library/react'
import BrochureTable from '../../../../features/brochures/components/BrochureTable'
import '@testing-library/jest-dom'
import type { BrochureItem } from '../../../../services/brochures'

jest.mock('../../../../utils/utils', () => ({
    formatDate: jest.fn(() => '2024-01-01'),
}))

describe('BrochureTable', () => {
    const mockOnView = jest.fn()

    const mockData: BrochureItem[] = [{
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
        render(<BrochureTable rows={[]} loading={true} onView={mockOnView} />)
        expect(screen.getByText('Loading brochure requests...')).toBeInTheDocument()
    })

    it('renders empty state', () => {
        render(<BrochureTable rows={[]} loading={false} onView={mockOnView} />)
        expect(screen.getByText('No requests found')).toBeInTheDocument()
    })

    it('renders data rows and all fields', () => {
        render(<BrochureTable rows={mockData} loading={false} onView={mockOnView} />)
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@test.com')).toBeInTheDocument()
        expect(screen.getByText('1234567890')).toBeInTheDocument()
        expect(screen.getByText('USA')).toBeInTheDocument()
        expect(screen.getByText('Please send brochure')).toBeInTheDocument()
        expect(screen.getByText('2024-01-01')).toBeInTheDocument()
        expect(screen.getByText('Test Conf')).toBeInTheDocument()
    })

    it('calls onView when view button clicked', () => {
        render(<BrochureTable rows={mockData} loading={false} onView={mockOnView} />)
        fireEvent.click(screen.getByTitle('View Details'))
        expect(mockOnView).toHaveBeenCalledWith(mockData[0])
    })

    it('renders fallback values for missing optional fields', () => {
        const incompleteData: BrochureItem[] = [{
            id: 1,
            name: 'Jane Doe',
            email: 'jane@test.com',
            phone: '000',
        } as unknown as BrochureItem]

        render(<BrochureTable rows={incompleteData} loading={false} onView={mockOnView} />)
        const dashes = screen.getAllByText('—')
        expect(dashes.length).toBeGreaterThan(0)
    })

    it('calls onRestore when restore button clicked and confirm is true', () => {
        jest.spyOn(window, 'confirm').mockReturnValue(true)
        const mockRestore = jest.fn()
        const deletedData = [{ ...mockData[0], deletedAt: '2024-01-01' }]
        render(<BrochureTable rows={deletedData} loading={false} onView={mockOnView} onRestore={mockRestore} />)
        
        fireEvent.click(screen.getByTitle('Restore'))
        expect(mockRestore).toHaveBeenCalled()
        ;(window.confirm as jest.Mock).mockRestore()
    })

    it('does not call onRestore when confirm is false', () => {
        jest.spyOn(window, 'confirm').mockReturnValue(false)
        const mockRestore = jest.fn()
        const deletedData = [{ ...mockData[0], deletedAt: '2024-01-01' }]
        render(<BrochureTable rows={deletedData} loading={false} onView={mockOnView} onRestore={mockRestore} />)
        
        fireEvent.click(screen.getByTitle('Restore'))
        expect(mockRestore).not.toHaveBeenCalled()
        ;(window.confirm as jest.Mock).mockRestore()
    })
})
