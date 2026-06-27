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

    it('renders with trash styling when onlyDeleted is true or false', () => {
        const mockToggleDeleted = jest.fn()
        const { rerender } = render(
            <SectionHeader
                title="Test"
                onFilterClick={mockOnFilterClick}
                onToggleDeleted={mockToggleDeleted}
                onlyDeleted={true}
            />
        )
        const trashButton1 = screen.getByTitle('Viewing Deleted Records')
        expect(trashButton1).toHaveClass('border-red-500')
        fireEvent.click(trashButton1)
        expect(mockToggleDeleted).toHaveBeenCalled()

        rerender(
            <SectionHeader
                title="Test"
                onFilterClick={mockOnFilterClick}
                onToggleDeleted={mockToggleDeleted}
                onlyDeleted={false}
            />
        )
        const trashButton2 = screen.getByTitle('View Deleted Records')
        expect(trashButton2).toHaveClass('border-gray-300')
    })

    it('renders and disables export button based on isExporting', () => {
        const mockExportClick = jest.fn()
        const { rerender } = render(
            <SectionHeader
                title="Test"
                onFilterClick={mockOnFilterClick}
                onExportClick={mockExportClick}
                isExporting={false}
            />
        )
        const exportButton = screen.getByTitle('Export to Excel')
        expect(exportButton).toBeEnabled()
        fireEvent.click(exportButton)
        expect(mockExportClick).toHaveBeenCalled()

        rerender(
            <SectionHeader
                title="Test"
                onFilterClick={mockOnFilterClick}
                onExportClick={mockExportClick}
                isExporting={true}
            />
        )
        expect(screen.getByText('Exporting...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Exporting/ })).toBeDisabled()
    })

    it('renders delete selected and group mail buttons when selectedCount > 0 and callbacks are provided, and hides view trash', () => {
        const mockDeleteSelected = jest.fn()
        const mockGroupMailClick = jest.fn()
        const mockToggleDeleted = jest.fn()

        render(
            <SectionHeader
                title="Test Section"
                onFilterClick={mockOnFilterClick}
                onDeleteSelected={mockDeleteSelected}
                onGroupMailClick={mockGroupMailClick}
                onToggleDeleted={mockToggleDeleted}
                selectedCount={2}
            />
        )

        expect(screen.getByText('Delete Selected (2)')).toBeInTheDocument()
        
        const groupMailButton = screen.getByTitle('Group Mail')
        expect(groupMailButton).toBeInTheDocument()

        fireEvent.click(groupMailButton)
        expect(mockGroupMailClick).toHaveBeenCalledTimes(1)

        // View Trash should be hidden because selectedCount > 0
        expect(screen.queryByTitle('View Deleted Records')).not.toBeInTheDocument()
        expect(screen.queryByTitle('Viewing Deleted Records')).not.toBeInTheDocument()
    })
})
