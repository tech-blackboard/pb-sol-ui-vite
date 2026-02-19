import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegistrationForm from '../../../../features/registrations/components/RegistrationForm'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import registrationsReducer from '../../../../store/slices/registrations/registrations.slice'

// Mock services
jest.mock('../../../../services/sourcedb', () => ({
  listWebsites: jest.fn(),
}))

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

import { listWebsites } from '../../../../services/sourcedb'
import { createRegistrationThunk } from '../../../../store/slices/registrations/registrations.thunks'
import toast from 'react-hot-toast'
import type { RegistrationItem } from '../../../../services/registrations'
import type { RegistrationRecord } from '../../../../features/abstracts/types'

const createMockStore = () =>
  configureStore({
    reducer: { registrations: registrationsReducer },
  })

describe('RegistrationForm', () => {
  const mockOnClose = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeAll(() => {
    Element.prototype.scrollTo = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(listWebsites as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Test Conference' },
    ])
  })

  const renderForm = (store = createMockStore()) =>
    render(
      <Provider store={store}>
        <RegistrationForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </Provider>
    )

  // ---------------- HELPERS ----------------

  const fillRequiredFields = async () => {
    fireEvent.change(screen.getByLabelText(/caption/i), {
      target: { value: 'Dr.' },
    })

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' },
    })

    fireEvent.change(screen.getAllByLabelText(/email/i)[0], {
      target: { value: 'john@test.com' },
    })

    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: '1234567890' },
    })

    fireEvent.change(screen.getByLabelText(/institution/i), {
      target: { value: 'Test University' },
    })

    fireEvent.change(screen.getByLabelText(/country/i), {
      target: { value: 'India' },
    })

    await screen.findByText('Test Conference')

    const websiteSelect = screen.getByRole('combobox', {
      name: /website/i,
    })
    fireEvent.change(websiteSelect, { target: { value: '1' } })
  }

  const fakeRegistration: RegistrationItem = {
    id: 1,
    name: 'John Doe',
    email: 'john@test.com',
    phone: '1234567890',
  } as RegistrationItem

  // ---------------- BASIC TESTS ----------------

  it('renders form title', async () => {
    renderForm()
    expect(await screen.findByText('Add New Registration')).toBeInTheDocument()
  })

  it('shows validation error on empty submit', async () => {
    renderForm()
    await screen.findByText('Add New Registration')

    fireEvent.click(screen.getByText('Create Registration'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please fill the missing fields')
    })
  })

  // ---------------- SUCCESS ----------------

  it('handles successful form submission', async () => {
    const store = createMockStore()

    store.dispatch = jest.fn().mockResolvedValue(
      createRegistrationThunk.fulfilled(
        fakeRegistration,
        'reqId',
        {} as RegistrationRecord
      )
    )

    renderForm(store)
    await screen.findByText('Add New Registration')

    await fillRequiredFields()

    fireEvent.click(screen.getByText('Create Registration'))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Registration created successfully'
      )
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  // ---------------- FAILURE ----------------

  it('handles form submission failure', async () => {
    const store = createMockStore()

    store.dispatch = jest.fn().mockResolvedValue(
      createRegistrationThunk.rejected(
        new Error('fail'),
        'reqId',
        {} as RegistrationRecord,
        'Failed to create registration'
      )
    )

    renderForm(store)
    await screen.findByText('Add New Registration')

    await fillRequiredFields()

    fireEvent.click(screen.getByText('Create Registration'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to create registration'
      )
    })
  })

  // ---------------- DATE VALIDATION ----------------

  it('validates checkout > checkin', async () => {
    renderForm()
    await screen.findByText('Add New Registration')

    await fillRequiredFields()

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /looking for accommodation/i,
      })
    )

    fireEvent.click(screen.getByText('Single Occupancy'))

    fireEvent.change(screen.getByLabelText('Check-in Date'), {
      target: { value: '2024-01-05' },
    })

    fireEvent.change(screen.getByLabelText('Check-out Date'), {
      target: { value: '2024-01-01' },
    })

    fireEvent.change(screen.getByLabelText(/price per night/i), {
      target: { value: '100' },
    })

    fireEvent.click(screen.getByText('Create Registration'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please fill the missing fields'
      )
    })
  })
})
