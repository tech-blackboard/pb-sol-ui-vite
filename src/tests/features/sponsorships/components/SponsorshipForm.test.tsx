import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SponsorshipForm from '../../../../features/sponsorships/components/SponsorshipForm'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import sponsorshipsReducer, {
  createSponsorshipThunk,
} from '../../../../store/slices/sponsorships/sponsorships.slice'

jest.mock('../../../../services/sourcedb', () => ({
  listWebsites: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

import { listWebsites, type SourceWebsite } from '../../../../services/sourcedb'
import toast from 'react-hot-toast'

const createMockStore = () =>
  configureStore({
    reducer: { sponsorships: sponsorshipsReducer },
  })

describe('SponsorshipForm', () => {
  const mockOnClose = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeAll(() => {
    Element.prototype.scrollTo = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(listWebsites as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Test Conf' },
    ])
  })

  const renderForm = () => {
    const store = createMockStore()
    return render(
      <Provider store={store}>
        <SponsorshipForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </Provider>
    )
  }

  const fillForm = async () => {
    fireEvent.change(screen.getByPlaceholderText('Enter Name'), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByPlaceholderText('Enter Email'), { target: { value: 'jane@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Enter Phone'), { target: { value: '1234567890' } })
    fireEvent.change(screen.getByLabelText(/Country\*/i), { target: { value: 'India' } })
    fireEvent.change(screen.getByPlaceholderText('Enter Organization / Institution'), { target: { value: 'Test Org' } })
    await waitFor(() => expect(listWebsites).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText(/Website \/ Conference\*/i), { target: { value: '1' } })
  }

  it('renders the form', async () => {
    renderForm()
    expect(
      await screen.findByText('Add Sponsorship Inquiry')
    ).toBeInTheDocument()
  })

  it('loads websites', async () => {
    renderForm()
    await waitFor(() => expect(listWebsites).toHaveBeenCalled())
  })

  it('shows validation errors on empty submit', async () => {
    renderForm()
    await screen.findByText('Add Sponsorship Inquiry')

    fireEvent.click(screen.getByText('Submit Now'))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Please fill all required fields'
      )
    )
  })

  it('successfully submits the form', async () => {
    const store = createMockStore()

    const mockDispatch = jest.fn().mockResolvedValue({
      type: 'sponsorships/create/fulfilled',
    })

    const hooks = await import('../../../../store/hooks')
    jest.spyOn(hooks, 'useAppDispatch').mockReturnValue(mockDispatch)

    render(
      <Provider store={store}>
        <SponsorshipForm
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      </Provider>
    )

    await fillForm()

    fireEvent.click(screen.getByText('Submit Now'))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Sponsorship inquiry added successfully'
      )
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('handles submission error', async () => {
    const errorMessage = 'Server rejected sponsorship'

    const mockDispatch = jest.fn().mockResolvedValue({
      type: 'sponsorships/create/rejected',
      payload: errorMessage,
    })

    const hooks = await import('../../../../store/hooks')
    jest.spyOn(hooks, 'useAppDispatch').mockReturnValue(mockDispatch)

    const originalMatch = createSponsorshipThunk.fulfilled.match;
    // @ts-expect-error - overriding match for testing
    createSponsorshipThunk.fulfilled.match = () => false;

    renderForm()
    await fillForm()

    fireEvent.click(screen.getByText('Submit Now'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage)
    })

    expect(await screen.findByText(errorMessage)).toBeInTheDocument()
    
    // Restore
    createSponsorshipThunk.fulfilled.match = originalMatch;
  })

  it('shows error toast when listWebsites fails to load', async () => {
    ;(listWebsites as jest.Mock).mockRejectedValueOnce(new Error('Network'))
    renderForm()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load website options'))
  })

  it('clears field-level error when user edits an invalid field', async () => {
    renderForm()
    await screen.findByText('Add Sponsorship Inquiry')

    // Trigger validation to set errors
    fireEvent.click(screen.getByText('Submit Now'))
    await waitFor(() => expect(screen.getByText('Name is required')).toBeInTheDocument())

    // Editing the name field should clear its field-level error
    fireEvent.change(screen.getByPlaceholderText('Enter Name'), { target: { value: 'Alice' } })
    await waitFor(() => expect(screen.queryByText('Name is required')).not.toBeInTheDocument())
  })

  it('shows generic error toast when dispatch throws', async () => {
    const mockDispatch = jest.fn().mockRejectedValue(new Error('Unexpected crash'))
    const hooks = await import('../../../../store/hooks')
    jest.spyOn(hooks, 'useAppDispatch').mockReturnValue(mockDispatch)

    renderForm()
    await screen.findByText('Add Sponsorship Inquiry')

    await fillForm()

    fireEvent.click(screen.getByText('Submit Now'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('An error occurred'))
  })

  it('validates invalid email format', async () => {
    renderForm()
    await screen.findByText('Add Sponsorship Inquiry')

    await fillForm()
    
    // Override email with invalid one
    fireEvent.change(screen.getByPlaceholderText('Enter Email'), { target: { value: 'invalid@email' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Submit Now/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument()
    })
  })

  it('handles component unmount before website loading completes', async () => {
    let resolveWebsites: (value: SourceWebsite[]) => void
    ;(listWebsites as jest.Mock).mockReturnValue(new Promise((resolve) => { resolveWebsites = resolve as (value: SourceWebsite[]) => void }))

    const { unmount } = renderForm()
    unmount()

    // @ts-expect-error - calling resolver after unmount
    resolveWebsites([{ id: 1, name: 'Web' }])
    await waitFor(() => expect(listWebsites).toHaveBeenCalled())
    // Ensure no errors/success occurred after unmount
    expect(toast.error).not.toHaveBeenCalled()
  })
})
