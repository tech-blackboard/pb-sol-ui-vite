import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AbstractRow from '../../../../features/abstracts/components/AbstractRow'
import { formatDate } from '../../../../utils/utils'
import type { AbstractRecord } from '../../../../features/abstracts/types'
import type { AbstractItem } from '../../../../services/abstracts'

jest.mock('../../../../utils/utils', () => ({
  formatDate: jest.fn(() => '01 Jan 2025'),
}))

jest.mock('../../../../services/upload', () => ({
  uploadService: {
    getSignedUrl: jest.fn(),
  },
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(() => 'test-toast-id'),
  },
}))

import toast from 'react-hot-toast'
import { uploadService } from '../../../../services/upload'

const baseRecord: AbstractRecord = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  altEmail: undefined,
  phone: undefined,
  file: undefined,
  fileS3Url: undefined,
  status: 'Accepted',
  isEmailSent: true,
}

const baseRaw: AbstractItem = {
  id: '1',
  website: {
    id: 1,
    name: 'Test Website',
    link: 'https://example.com/',
  },
  wphone: '1234567890',
  city: 'Mumbai',
  country: 'India',
  organization: 'Test University',
  title: 'Test Title',
  message: 'Test Message',
  intrested: 'Oral',
  now: '2025-01-01',
}

describe('AbstractRow – full branch & function coverage', () => {
  const onView = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  /* ---------------- basic rendering ---------------- */
  test('renders all basic fields correctly', () => {
    render(
      <table>
        <tbody>
          <AbstractRow record={baseRecord} raw={baseRaw} onView={onView} />
        </tbody>
      </table>
    )

    expect(screen.getByText('Test Website')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Mumbai')).toBeInTheDocument()
    expect(screen.getByText('India')).toBeInTheDocument()
    expect(screen.getByText('Test University')).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Message')).toBeInTheDocument()
    expect(screen.getByText('Oral')).toBeInTheDocument()
  })

  /* ---------------- email sent branch ---------------- */
  test('renders Email Sent = Yes', () => {
    render(
      <table>
        <tbody>
          <AbstractRow record={baseRecord} raw={baseRaw} onView={onView} />
        </tbody>
      </table>
    )

    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  test('renders Email Sent = No', () => {
    render(
      <table>
        <tbody>
          <AbstractRow
            record={{ ...baseRecord, isEmailSent: false }}
            raw={baseRaw}
            onView={onView}
          />
        </tbody>
      </table>
    )

    expect(screen.getByText('No')).toBeInTheDocument()
  })

  /* ---------------- status class branches ---------------- */
  test.each([
    'Accepted',
    'Under Review',
    'Rejected',
    'Out of Scope',
    'Registered',
  ])('renders status badge for %s', (status) => {
    render(
      <table>
        <tbody>
          <AbstractRow
            record={{ ...baseRecord, status: status as AbstractRecord['status'] }}
            raw={baseRaw}
            onView={onView}
          />
        </tbody>
      </table>
    )

    expect(screen.getByText(status)).toBeInTheDocument()
  })

  /* ---------------- file link branches ---------------- */
  test('renders absolute file link', () => {
    render(
      <table>
        <tbody>
          <AbstractRow
            record={{
              ...baseRecord,
              file: 'https://files.com/test.pdf',
            }}
            raw={baseRaw}
            onView={onView}
          />
        </tbody>
      </table>
    )

    const link = screen.getByText('test.pdf')
    expect(link).toHaveAttribute('href', 'https://files.com/test.pdf')
  })

  test('renders relative file link with uploads prefix', () => {
    render(
      <table>
        <tbody>
          <AbstractRow
            record={{ ...baseRecord, file: 'test.pdf' }}
            raw={baseRaw}
            onView={onView}
          />
        </tbody>
      </table>
    )

    const link = screen.getByText('test.pdf')
    expect(link).toHaveAttribute(
      'href',
      'https://example.com/uploads/test.pdf'
    )
  })

  test('renders relative uploads path without duplication', () => {
    render(
      <table>
        <tbody>
          <AbstractRow
            record={{ ...baseRecord, file: 'uploads/test.pdf' }}
            raw={baseRaw}
            onView={onView}
          />
        </tbody>
      </table>
    )

    const link = screen.getByText('test.pdf')
    expect(link).toHaveAttribute(
      'href',
      'https://example.com/uploads/test.pdf'
    )
  })

  test('fileS3Url overrides computed href', () => {
    render(
      <table>
        <tbody>
          <AbstractRow
            record={{
              ...baseRecord,
              file: 'test.pdf',
              fileS3Url: 'https://s3.aws.com/file.pdf',
            }}
            raw={baseRaw}
            onView={onView}
          />
        </tbody>
      </table>
    )

    const link = screen.getByText('test.pdf')
    expect(link).toHaveAttribute(
      'href',
      'https://s3.aws.com/file.pdf'
    )
  })

  test('renders dash when no file', () => {
    render(
      <table>
        <tbody>
          <AbstractRow record={baseRecord} raw={baseRaw} onView={onView} />
        </tbody>
      </table>
    )

    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  /* ---------------- date branch ---------------- */
  test('formats date when raw.now exists', () => {
    render(
      <table>
        <tbody>
          <AbstractRow record={baseRecord} raw={baseRaw} onView={onView} />
        </tbody>
      </table>
    )

    expect(formatDate).toHaveBeenCalledWith('2025-01-01')
    expect(screen.getByText('01 Jan 2025')).toBeInTheDocument()
  })

  test('renders dash when no date', () => {
    render(
      <table>
        <tbody>
          <AbstractRow
            record={baseRecord}
            raw={{ ...baseRaw, now: undefined }}
            onView={onView}
          />
        </tbody>
      </table>
    )

    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  /* ---------------- onView action ---------------- */
  test('clicking Edit button calls onView', () => {
    render(
      <table>
        <tbody>
          <AbstractRow record={baseRecord} raw={baseRaw} onView={onView} />
        </tbody>
      </table>
    )

    fireEvent.click(screen.getByLabelText('Edit'))
    expect(onView).toHaveBeenCalled()
  })

  /* ---------------- missing raw branches ---------------- */
  test('handles missing raw data gracefully', () => {
    render(
      <table>
        <tbody>
          <AbstractRow record={baseRecord} raw={null} onView={onView} />
        </tbody>
      </table>
    )

    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  /* ---------------- handleViewFile action ---------------- */
  describe('handleViewFile', () => {
    let windowOpenSpy: jest.SpyInstance
    let mockNewTab: Window

    beforeEach(() => {
      mockNewTab = {
        close: jest.fn(),
        location: { href: '' },
      } as unknown as Window
      windowOpenSpy = jest.spyOn(window, 'open').mockReturnValue(mockNewTab)
    })

    afterEach(() => {
      windowOpenSpy.mockRestore()
    })

    test('downloads file successfully', async () => {
      ; (uploadService.getSignedUrl as jest.Mock).mockResolvedValue('https://secure-url.com/file.pdf')

      render(
        <table>
          <tbody>
            <AbstractRow record={{ ...baseRecord, fileS3Url: 's3://bucket/file.pdf', file: 'file.pdf' }} raw={baseRaw} onView={onView} />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByText('file.pdf'))

      // wait for async handleViewFile completion
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(windowOpenSpy).toHaveBeenCalledWith('', '_blank')
      expect(uploadService.getSignedUrl).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Secure link generated', { id: 'test-toast-id' })
      expect(mockNewTab.location.href).toBe('https://secure-url.com/file.pdf')
    })

    test('shows error if popup is blocked', async () => {
      windowOpenSpy.mockReturnValue(null) // Mock blocked popup

      render(
        <table>
          <tbody>
            <AbstractRow record={{ ...baseRecord, fileS3Url: 's3://bucket/file.pdf', file: 'file.pdf' }} raw={baseRaw} onView={onView} />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByText('file.pdf'))

      expect(toast.error).toHaveBeenCalledWith('Popup blocked — please allow popups for this site')
      expect(uploadService.getSignedUrl).not.toHaveBeenCalled()
    })

    test('shows error and closes tab if signed url is empty', async () => {
      ; (uploadService.getSignedUrl as jest.Mock).mockResolvedValue(null)

      render(
        <table>
          <tbody>
            <AbstractRow record={{ ...baseRecord, fileS3Url: 's3://bucket/file.pdf', file: 'file.pdf' }} raw={baseRaw} onView={onView} />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByText('file.pdf'))

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockNewTab.close).toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith('Could not generate file link — please try again', { id: 'test-toast-id' })
    })

    test('shows error and closes tab if API fails (catch block)', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
        ; (uploadService.getSignedUrl as jest.Mock).mockRejectedValue(new Error('API failure'))

      render(
        <table>
          <tbody>
            <AbstractRow record={{ ...baseRecord, fileS3Url: 's3://bucket/file.pdf', file: 'file.pdf' }} raw={baseRaw} onView={onView} />
          </tbody>
        </table>
      )

      fireEvent.click(screen.getByText('file.pdf'))

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockNewTab.close).toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith('Failed to get secure access to the file', { id: 'test-toast-id' })

      consoleErrorSpy.mockRestore()
    })
  })

  test('renders Deleted status styling', () => {
    render(
      <table>
        <tbody>
          <AbstractRow
            record={{ ...baseRecord, status: 'Deleted' }}
            raw={baseRaw}
            onView={onView}
          />
        </tbody>
      </table>
    )
    expect(screen.getByText('Deleted')).toHaveClass('bg-gray-100', 'text-red-700')
  })

  test('handleViewFile returns early if no fileS3Url', () => {
    render(
      <table>
        <tbody>
          <AbstractRow
            record={{ ...baseRecord, file: 'test.pdf', fileS3Url: undefined }}
            raw={baseRaw}
            onView={onView}
          />
        </tbody>
      </table>
    )
    fireEvent.click(screen.getByText('test.pdf'))
    expect(uploadService.getSignedUrl).not.toHaveBeenCalled()
  });

  test('handleViewFile returns early if fileS3Url becomes undefined before click', () => {
    const record = { ...baseRecord, file: 'test.pdf', fileS3Url: 's3://bucket/test.pdf' };
    render(
      <table>
        <tbody>
          <AbstractRow
            record={record}
            raw={baseRaw}
            onView={onView}
          />
        </tbody>
      </table>
    )
    
    // Mutate the prop reference directly to make it undefined before firing the click event
    ;(record as AbstractRecord & { fileS3Url: string | undefined }).fileS3Url = undefined
    
    fireEvent.click(screen.getByText('test.pdf'))
    
    expect(uploadService.getSignedUrl).not.toHaveBeenCalled()
  })

  test('renders relative file name fallback when split returns empty string', () => {
    render(
      <table>
        <tbody>
          <AbstractRow
            record={{
              ...baseRecord,
              file: '/',
            }}
            raw={baseRaw}
            onView={onView}
          />
        </tbody>
      </table>
    )
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})

