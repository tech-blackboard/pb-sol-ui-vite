import { render, screen, fireEvent } from '@testing-library/react'
import SectionHeader from '../../components/SectionHeader'
import '@testing-library/jest-dom'

describe('SectionHeader', () => {
    const mockOnFilterClick = jest.fn()
    const mockOnAddClick = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders with title and filter button', () => {
        render(
            <SectionHeader
                title="Test Section"
                onFilterClick={mockOnFilterClick}
            />
        )

        expect(screen.getByText('Test Section')).toBeInTheDocument()
        expect(screen.getByLabelText('Open filters')).toBeInTheDocument()
    })

    it('renders without add button when onAddClick is not provided', () => {
        render(
            <SectionHeader
                title="Test Section"
                onFilterClick={mockOnFilterClick}
            />
        )

        expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument()
    })

    it('renders with add button when onAddClick is provided', () => {
        render(
            <SectionHeader
                title="Test Section"
                onFilterClick={mockOnFilterClick}
                onAddClick={mockOnAddClick}
            />
        )

        const addButtons = screen.getAllByRole('button')
        const addButton = addButtons.find(btn => btn.textContent?.includes('Add'))
        expect(addButton).toBeInTheDocument()
    })

    it('calls onFilterClick when filter button is clicked', () => {
        render(
            <SectionHeader
                title="Test Section"
                onFilterClick={mockOnFilterClick}
            />
        )

        fireEvent.click(screen.getByLabelText('Open filters'))
        expect(mockOnFilterClick).toHaveBeenCalledTimes(1)
    })

    it('calls onAddClick when add button is clicked', () => {
        render(
            <SectionHeader
                title="Test Section"
                onFilterClick={mockOnFilterClick}
                onAddClick={mockOnAddClick}
            />
        )

        const addButtons = screen.getAllByRole('button')
        const addButton = addButtons.find(btn => btn.textContent?.includes('Add'))
        fireEvent.click(addButton!)
        expect(mockOnAddClick).toHaveBeenCalledTimes(1)
    })

    it('renders with custom button text', () => {
        render(
            <SectionHeader
                title="Test Section"
                onFilterClick={mockOnFilterClick}
                onAddClick={mockOnAddClick}
                addButtonText="Create New"
                filterButtonText="Apply Filters"
            />
        )

        expect(screen.getByText('Create New')).toBeInTheDocument()
        expect(screen.getByText('Apply Filters')).toBeInTheDocument()
    })

    it('renders with custom mobile button text', () => {
        render(
            <SectionHeader
                title="Test Section"
                onFilterClick={mockOnFilterClick}
                onAddClick={mockOnAddClick}
                addMobileButtonText="New"
            />
        )

        expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('renders filter button with correct aria attributes', () => {
        render(
            <SectionHeader
                title="Test Section"
                onFilterClick={mockOnFilterClick}
            />
        )

        const filterButton = screen.getByLabelText('Open filters')
        expect(filterButton).toHaveAttribute('aria-label', 'Open filters')
        expect(filterButton).toHaveAttribute('title', 'Filters')
    })
})
