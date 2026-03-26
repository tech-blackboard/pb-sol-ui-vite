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

  beforeAll(() => {
    Element.prototype.scrollTo = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the AbstractForm modal', async () => {
    (listWebsites as jest.Mock).mockResolvedValue([])

    render(<AbstractForm onClose={onClose} />)

    expect(await screen.findByText('Submit Abstract')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    (listWebsites as jest.Mock).mockResolvedValue([])

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
    (listWebsites as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Test Conference' },
    ])

    render(<AbstractForm onClose={onClose} />)

    expect(await screen.findByText('Test Conference')).toBeInTheDocument()
  })

  it('submits form successfully with file upload', async () => {
    (listWebsites as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Test Conference' },
    ])

    ;(createAbstractWithFormDataFileUpload as jest.Mock).mockResolvedValue({})

    render(<AbstractForm onClose={onClose} onSuccess={onSuccess} />)
    await screen.findByText('Submit Abstract')

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Dr.' } })
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'john@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Phone'), { target: { value: '1234567890' } })
    fireEvent.change(screen.getByPlaceholderText('Hyderabad'), { target: { value: 'Hyderabad' } })
    fireEvent.change(screen.getByPlaceholderText('Organization'), { target: { value: 'Test Org' } })

    fireEvent.change(screen.getAllByRole('combobox')[2], { target: { value: 'India' } })
    fireEvent.change(screen.getAllByRole('combobox')[3], { target: { value: 'Oral Presentation(In-Person)' } })
    fireEvent.change(screen.getByPlaceholderText('Abstract Title*'), { target: { value: 'My Abstract' } })
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '1' } })

    const fileInput = document.querySelector('input[type="file"]')!
    fireEvent.change(fileInput, {
      target: { files: [new File(['test'], 'a.pdf')] },
    })

    const captcha = document.querySelector('.font-mono')!.textContent!
    fireEvent.change(screen.getByPlaceholderText('Enter captcha'), {
      target: { value: captcha },
    })

    fireEvent.click(screen.getByRole('button', { name: /submit now/i }))

    await waitFor(() => {
      expect(createAbstractWithFormDataFileUpload).toHaveBeenCalledTimes(1)
      expect(toast.success).toHaveBeenCalledWith('Abstract submitted successfully!')
      expect(onSuccess).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })

it('shows validation error for invalid email', async () => {
  (listWebsites as jest.Mock).mockResolvedValue([
    { id: 1, name: 'Test Conference' },
  ])

  render(<AbstractForm onClose={onClose} />)
  await screen.findByText('Submit Abstract')

  const selects = screen.getAllByRole('combobox')

  // ✅ Caption
  fireEvent.change(selects[0], { target: { value: 'Dr.' } })

  // ✅ Name
  fireEvent.change(screen.getByPlaceholderText('Name'), {
    target: { value: 'John Doe' },
  })

  // ❌ INVALID EMAIL
  fireEvent.change(screen.getByPlaceholderText('john@example.com'), {
    target: { value: 'bad-email' },
  })

  // ✅ Phone
  fireEvent.change(screen.getByPlaceholderText('Phone'), {
    target: { value: '9999999999' },
  })

  // ✅ City
  fireEvent.change(screen.getByPlaceholderText('Hyderabad'), {
    target: { value: 'Hyderabad' },
  })

  // ✅ Organization
  fireEvent.change(screen.getByPlaceholderText('Organization'), {
    target: { value: 'Org' },
  })

  // ✅ Website
  fireEvent.change(selects[1], { target: { value: '1' } })

  // ✅ Country
  fireEvent.change(selects[2], { target: { value: 'India' } })

  // ✅ Interested In
  fireEvent.change(selects[3], {
    target: { value: 'Oral Presentation(In-Person)' },
  })

  // ✅ Title
  fireEvent.change(screen.getByPlaceholderText('Abstract Title*'), {
    target: { value: 'My Title' },
  })

  // ✅ File
  const fileInput = document.querySelector('input[type="file"]')!
  fireEvent.change(fileInput, {
    target: { files: [new File(['test'], 'test.pdf')] },
  })

  // ✅ Captcha
  const captcha = document.querySelector('.font-mono')!.textContent!
  fireEvent.change(screen.getByPlaceholderText('Enter captcha'), {
    target: { value: captcha },
  })

fireEvent.submit(document.getElementById('abstract-form')!)

  // ✅ Assert error
  const alerts = await screen.findAllByRole('alert')
  const emailError = alerts.find(el =>
    el.textContent?.includes('Invalid email format')
  )

  expect(emailError).toBeTruthy()
})

 it('handles submission failure', async () => {
  (listWebsites as jest.Mock).mockResolvedValue([{ id: 1, name: 'Web' }])

  ;(createAbstractWithFormDataFileUpload as jest.Mock).mockRejectedValue({
    response: { data: { message: 'Server Error' } },
  })

  render(<AbstractForm onClose={onClose} websiteId={1} />)
  await screen.findByText('Web')

  // Fill EVERYTHING valid

  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Dr.' } })
  fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'John' } })
  fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'john@test.com' } })
  fireEvent.change(screen.getByPlaceholderText('Phone'), { target: { value: '1234567890' } })
  fireEvent.change(screen.getByPlaceholderText('Hyderabad'), { target: { value: 'City' } })
  fireEvent.change(screen.getByPlaceholderText('Organization'), { target: { value: 'Org' } })

  fireEvent.change(screen.getAllByRole('combobox')[2], { target: { value: 'India' } })
  fireEvent.change(screen.getAllByRole('combobox')[3], {
    target: { value: 'Oral Presentation(In-Person)' },
  })

  fireEvent.change(screen.getByPlaceholderText('Abstract Title*'), {
    target: { value: 'Title' },
  })

  const fileInput = document.querySelector('input[type="file"]')!
  fireEvent.change(fileInput, { target: { files: [new File(['a'], 'a.pdf')] } })

  const captcha = document.querySelector('.font-mono')!.textContent!
  fireEvent.change(screen.getByPlaceholderText('Enter captcha'), {
    target: { value: captcha },
  })
  fireEvent.change(screen.getAllByRole('combobox')[1], {
  target: { value: '1' },
})


fireEvent.submit(document.getElementById('abstract-form')!)

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Server Error', { duration: 5000 })
  })
})

it('handles website loading failure', async () => {
    (listWebsites as jest.Mock).mockRejectedValue(new Error('API Down'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<AbstractForm onClose={onClose} />)

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load website options')
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load websites:', expect.any(Error))
    })
    consoleSpy.mockRestore()
})

it('clears validation errors when field values change', async () => {
    (listWebsites as jest.Mock).mockResolvedValue([])
    render(<AbstractForm onClose={onClose} />)
    
    // Trigger errors
    fireEvent.click(screen.getByRole('button', { name: /submit now/i }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()

    // Clear error
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'John' } })
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument()

    // Trigger file error
    expect(await screen.findByText('Please upload a file')).toBeInTheDocument()
    const fileInput = document.querySelector('input[type="file"]')!
    fireEvent.change(fileInput, { target: { files: [new File(['a'], 'a.pdf')] } })
    expect(screen.queryByText('Please upload a file')).not.toBeInTheDocument()
})

it('handles network error with specific message', async () => {
    (listWebsites as jest.Mock).mockResolvedValue([{ id: 1, name: 'Web' }])
    ;(createAbstractWithFormDataFileUpload as jest.Mock).mockRejectedValue({
        code: 'ERR_NETWORK',
        message: 'Network Error'
    })

    render(<AbstractForm onClose={onClose} websiteId={1} />)
    await screen.findByText('Web')

    // Fill minimum required fields (skipping full fill for brevity, using existing test pattern)
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'john@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Phone'), { target: { value: '1234567890' } })
    fireEvent.change(screen.getByPlaceholderText('Hyderabad'), { target: { value: 'City' } })
    fireEvent.change(screen.getByPlaceholderText('Organization'), { target: { value: 'Org' } })
    fireEvent.change(screen.getAllByRole('combobox')[2], { target: { value: 'India' } })
    fireEvent.change(screen.getAllByRole('combobox')[3], { target: { value: 'Oral Presentation(In-Person)' } })
    fireEvent.change(screen.getByPlaceholderText('Abstract Title*'), { target: { value: 'Title' } })
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '1' } })
    
    const fileInput = document.querySelector('input[type="file"]')!
    fireEvent.change(fileInput, { target: { files: [new File(['a'], 'a.pdf')] } })
    
    const captcha = document.querySelector('.font-mono')!.textContent!
    fireEvent.change(screen.getByPlaceholderText('Enter captcha'), { target: { value: captcha } })

    fireEvent.submit(document.getElementById('abstract-form')!)

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
            expect.stringContaining('Server connection error'),
            expect.any(Object)
        )
    })
})
})