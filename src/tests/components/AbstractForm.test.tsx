import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AbstractForm from '../../components/AbstractForm'
import '@testing-library/jest-dom'

// ---------- MOCK SERVICES ----------
jest.mock('../../services/sourcedb', () => ({
  listWebsites: jest.fn(),
}))

jest.mock('../../services/abstracts', () => ({
  createAbstractWithFormDataFileUpload: jest.fn(),
}))

// ---------- MOCK TOAST ----------
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

import { listWebsites } from '../../services/sourcedb'
import { createAbstractWithFormDataFileUpload } from '../../services/abstracts'
import toast from 'react-hot-toast'

describe('AbstractForm', () => {
  const onClose = jest.fn()
  const onSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the AbstractForm modal', async () => {
    ;(listWebsites as jest.Mock).mockResolvedValue([])

    render(<AbstractForm onClose={onClose} />)

    expect(await screen.findByText('Submit Abstract')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    ;(listWebsites as jest.Mock).mockResolvedValue([])

    render(<AbstractForm onClose={onClose} />)

    await screen.findByText('Submit Abstract')

    fireEvent.click(screen.getByRole('button', { name: /submit now/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please fix all errors before submitting'
      )
    })

    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Please upload a file')).toBeInTheDocument()
  })

  it('loads website options from API', async () => {
    ;(listWebsites as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Test Conference' },
    ])

    render(<AbstractForm onClose={onClose} />)

    expect(await screen.findByText('Test Conference')).toBeInTheDocument()
  })

  it('submits form successfully with file upload', async () => {
    ;(listWebsites as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Test Conference' },
    ])

    ;(createAbstractWithFormDataFileUpload as jest.Mock).mockResolvedValue({})

    render(<AbstractForm onClose={onClose} onSuccess={onSuccess} />)

    // wait for useEffect
    await screen.findByText('Submit Abstract')

    // -------- Caption --------
    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'Dr.' },
    })

    // -------- Text inputs (placeholders are stable) --------
    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'John Doe' },
    })

    fireEvent.change(screen.getByPlaceholderText('john@example.com'), {
      target: { value: 'john@test.com' },
    })

    fireEvent.change(screen.getByPlaceholderText('Phone'), {
      target: { value: '1234567890' },
    })

    fireEvent.change(screen.getByPlaceholderText('Hyderabad'), {
      target: { value: 'Hyderabad' },
    })

    fireEvent.change(screen.getByPlaceholderText('Organization'), {
      target: { value: 'Test Org' },
    })

    // -------- Country (value MUST match option value) --------
    fireEvent.change(screen.getAllByRole('combobox')[2], {
      target: { value: 'India' },
    })

    // -------- Interested In --------
    fireEvent.change(screen.getAllByRole('combobox')[3], {
      target: { value: 'Oral Presentation(In-Person)' },
    })

    // -------- Abstract title --------
    fireEvent.change(screen.getByPlaceholderText('Abstract Title*'), {
      target: { value: 'My Abstract' },
    })

    // -------- Website --------
    fireEvent.change(screen.getAllByRole('combobox')[1], {
      target: { value: '1' },
    })

    // -------- File upload --------
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement

    fireEvent.change(fileInput, {
      target: {
        files: [new File(['test content'], 'abstract.pdf', { type: 'application/pdf' })],
      },
    })

    // -------- Captcha --------
    const captchaValue = document.querySelector('.font-mono')!.textContent!

    fireEvent.change(screen.getByPlaceholderText('Enter captcha'), {
      target: { value: captchaValue },
    })

    // -------- Submit --------
    fireEvent.click(screen.getByRole('button', { name: /submit now/i }))

    await waitFor(() => {
      expect(createAbstractWithFormDataFileUpload).toHaveBeenCalledTimes(1)
      expect(toast.success).toHaveBeenCalledWith(
        'Abstract submitted successfully!'
      )
      expect(onSuccess).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })
})
