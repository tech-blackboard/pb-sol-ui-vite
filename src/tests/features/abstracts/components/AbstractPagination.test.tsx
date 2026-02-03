import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AbstractPagination from '../../../../features/abstracts/components/AbstractPagination'
describe('AbstractPagination', () => {
  const defaultProps = {
    page: 1,
    pageSize: 10,
    total: 100,
    totalPages: 10,
    rowsOnPage: 10,
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('does not render when total is 0', () => {
    const { container } = render(
      <AbstractPagination {...defaultProps} total={0} />
    )

    expect(container).toBeEmptyDOMElement()
  })

  test('renders showing range text correctly', () => {
    render(<AbstractPagination {...defaultProps} />)

    expect(
      screen.getByText('Showing 1–10 of 100')
    ).toBeInTheDocument()
  })

  test('calls onPageSizeChange when page size changes', () => {
    render(<AbstractPagination {...defaultProps} />)

    fireEvent.change(screen.getByDisplayValue('10'), {
      target: { value: '25' },
    })

    expect(defaultProps.onPageSizeChange).toHaveBeenCalledWith(25)
  })

  test('disables prev and first buttons on first page', () => {
    render(<AbstractPagination {...defaultProps} page={1} />)

    expect(screen.getByText('«')).toBeDisabled()
    expect(screen.getByText('Prev')).toBeDisabled()
  })

  test('disables next and last buttons on last page', () => {
    render(
      <AbstractPagination
        {...defaultProps}
        page={10}
        totalPages={10}
      />
    )

    expect(screen.getByText('Next')).toBeDisabled()
    expect(screen.getByText('»')).toBeDisabled()
  })

  test('calls onPageChange with correct page numbers', () => {
    render(<AbstractPagination {...defaultProps} page={5} />)

    fireEvent.click(screen.getByText('«'))
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1)

    fireEvent.click(screen.getByText('Prev'))
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(4)

    fireEvent.click(screen.getByText('Next'))
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(6)

    fireEvent.click(screen.getByText('»'))
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(10)
  })

  test('renders current page info', () => {
    render(<AbstractPagination {...defaultProps} page={3} />)

    expect(
      screen.getByText('Page 3 / 10')
    ).toBeInTheDocument()
  })
})
