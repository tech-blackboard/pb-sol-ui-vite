import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AbstractHeader from '../../../../features/abstracts/components/AbstractHeader'
import { fetchAbstracts } from '../../../../store/slices/abstracts/abstracts.thunks'
import { useAppDispatch, useAppSelector } from '../../../../store/hooks'

/* --------------------------------------------------
   MOCKS
-------------------------------------------------- */

// Mock redux hooks
jest.mock('../../../../store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}))

// Mock thunk
jest.mock('../../../../store/slices/abstracts/abstracts.thunks', () => ({
  fetchAbstracts: jest.fn(),
}))

// Mock child components
jest.mock('../../../../features/abstracts/components/AbstractFiltersDrawer.tsx', () => ({
  __esModule: true,
  default: (props: { onClose: () => void }) => (
    <div data-testid="filters-drawer">
      Filters Drawer
      <button onClick={props.onClose}>Close Filters</button>
    </div>
  ),
}))

jest.mock('../../../../components/AbstractForm.tsx', () => ({
  __esModule: true,
  default: (props: { onClose: () => void; onSuccess: () => void }) => (
    <div data-testid="abstract-form">
      Abstract Form
      <button onClick={props.onClose}>Close Form</button>
      <button onClick={props.onSuccess}>Success</button>
    </div>
  ),
}))

/* --------------------------------------------------
   TEST SUITE
-------------------------------------------------- */

describe('AbstractHeader', () => {
  const dispatchMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

      ; (useAppDispatch as jest.Mock).mockReturnValue(dispatchMock)

      ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) =>
        selectorFn({
          abstracts: {
            page: 1,
            pageSize: 10,
            appliedFilters: { status: 'Under Review' },
          },
        })
      )
  })

  test('renders header title', () => {
    render(<AbstractHeader />)
    expect(screen.getByText('All Conferences — Abstracts')).toBeInTheDocument()
  })

  test('does not dispatch fetchAbstracts on mount', () => {
    render(<AbstractHeader />)
    expect(fetchAbstracts).not.toHaveBeenCalled()
  })

  test('renders error message when error prop is provided', () => {
    const onClearError = jest.fn()
    render(<AbstractHeader error="Something went wrong" onClearError={onClearError} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  test('calls onClearError when error is closed', () => {
    const onClearError = jest.fn()
    render(<AbstractHeader error="Error" onClearError={onClearError} />)
    fireEvent.click(screen.getByLabelText('Close alert'))
    expect(onClearError).toHaveBeenCalled()
  })

  test('opens AbstractForm when clicking Add Abstract', () => {
    render(<AbstractHeader />)
    fireEvent.click(screen.getByText('Add Abstract'))
    expect(screen.getByTestId('abstract-form')).toBeInTheDocument()
  })

  test('closes AbstractForm and dispatches fetchAbstracts on success', () => {
    render(<AbstractHeader />)

    fireEvent.click(screen.getByText('Add Abstract'))
    fireEvent.click(screen.getByText('Success'))

    expect(screen.queryByTestId('abstract-form')).not.toBeInTheDocument()
    expect(fetchAbstracts).toHaveBeenCalledWith({
      filters: { status: 'Under Review' },
      page: 1,
      limit: 10,
    })
    expect(dispatchMock).toHaveBeenCalled()
  })

  test('opens Filters drawer when clicking Filters button', () => {
    render(<AbstractHeader />)
    fireEvent.click(screen.getByTitle('Filters'))
    expect(screen.getByTestId('filters-drawer')).toBeInTheDocument()
  })

  test('closes Filters drawer when onClose is called', () => {
    render(<AbstractHeader />)
    fireEvent.click(screen.getByTitle('Filters'))
    fireEvent.click(screen.getByText('Close Filters'))
    expect(screen.queryByTestId('filters-drawer')).not.toBeInTheDocument()
  })
})
