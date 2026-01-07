import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AbstractRow from '../../../../features/abstracts/components/AbstractRow'
import { formatDate } from '../../../../utils/utils'

jest.mock('../../../../utils/utils', () => ({
  formatDate: jest.fn(() => '01 Jan 2025'),
}))

const baseRecord = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  altEmail: null,
  phone: null,
  file: undefined,
  fileS3Url: undefined,
  status: 'Accepted',
  isEmailSent: true,
}

const baseRaw = {
  website: {
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
          <AbstractRow record={baseRecord as any} raw={baseRaw} onView={onView} />
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
          <AbstractRow record={baseRecord as any} raw={baseRaw} onView={onView} />
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
            record={{ ...baseRecord, isEmailSent: false } as any}
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
            record={{ ...baseRecord, status } as any}
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
            } as any}
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
            record={{ ...baseRecord, file: 'test.pdf' } as any}
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
            record={{ ...baseRecord, file: 'uploads/test.pdf' } as any}
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
            } as any}
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
          <AbstractRow record={baseRecord as any} raw={baseRaw} onView={onView} />
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
          <AbstractRow record={baseRecord as any} raw={baseRaw} onView={onView} />
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
            record={baseRecord as any}
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
          <AbstractRow record={baseRecord as any} raw={baseRaw} onView={onView} />
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
          <AbstractRow record={baseRecord as any} raw={null} onView={onView} />
        </tbody>
      </table>
    )

    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
