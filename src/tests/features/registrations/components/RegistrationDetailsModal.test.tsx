import { render, screen, fireEvent } from '@testing-library/react'
import RegistrationDetailsModal from '../../../../features/registrations/components/RegistrationDetailsModal'
import '@testing-library/jest-dom'
import type { PresentationType } from '../../../../features/abstracts/types'

// Mock date formatter
jest.mock('../../../../utils/utils', () => ({
  formatDate: jest.fn(() => '2024-01-01 12:00 PM'),
}))

describe('RegistrationDetailsModal', () => {
  const mockOnClose = jest.fn()

  const mockItem = {
    id: 9876,
    name: 'John Doe',
    email: 'john@test.com',
    aemail: 'john.alt@test.com',
    phone: '1234567890',
    wphone: '0987654321',
    institution: 'Test University',
    country: 'USA',
    presentation: 'Oral' as PresentationType,
    participants: '15',
    regtype: 'Full Conference',
    accomm: 'Single Room',
    checkin: '2024-01-01',
    checkout: '2024-01-05',
    nights: '4',
    accmvalue: 'Standard',
    acmpng: 'None',
    acc_price: '400',
    tot_price: '900',
    transaction_id: 'TXN123456',
    status_flag: 123,
    now: '2024-01-01T10:00:00Z',
    message: 'Looking forward to the conference!',
    website: { id: 1, name: 'Test Conference 2024' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns null when item is null', () => {
    const { container } = render(
      <RegistrationDetailsModal item={null} onClose={mockOnClose} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal with registration details', () => {
    render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

    expect(screen.getByText('Registration Details')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@test.com')).toBeInTheDocument()
    expect(screen.getByText('Test University')).toBeInTheDocument()
  })

  it('calls onClose when header close button clicked', () => {
    render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

    fireEvent.click(screen.getByLabelText('Close'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when footer close button clicked', () => {
    render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

    const buttons = screen.getAllByText('Close')
    fireEvent.click(buttons[buttons.length - 1])
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('renders email as mailto link', () => {
    render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

    const emailLink = screen.getByText('john@test.com')
    expect(emailLink.tagName).toBe('A')
    expect(emailLink).toHaveAttribute('href', 'mailto:john@test.com')
  })

  it('displays all basic info fields', () => {
    render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

    expect(screen.getByText('Test Conference 2024')).toBeInTheDocument()
    expect(screen.getByText('john.alt@test.com')).toBeInTheDocument()
    expect(screen.getByText('1234567890')).toBeInTheDocument()
    expect(screen.getByText('0987654321')).toBeInTheDocument()
    expect(screen.getByText('USA')).toBeInTheDocument()
  })

  it('displays registration & date info', () => {
    render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

    expect(screen.getByText('Oral')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('Full Conference')).toBeInTheDocument()
    expect(screen.getByText('123')).toBeInTheDocument() // status flag
  })

  it('displays accommodation & payment info', () => {
    render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

    expect(screen.getByText('Single Room')).toBeInTheDocument()
    expect(screen.getByText('2024-01-01')).toBeInTheDocument()
    expect(screen.getByText('2024-01-05')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('$400')).toBeInTheDocument()
    expect(screen.getByText('$900')).toBeInTheDocument()
    expect(screen.getByText('TXN123456')).toBeInTheDocument()
  })

  it('displays message', () => {
    render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

    expect(
      screen.getByText('Looking forward to the conference!')
    ).toBeInTheDocument()
  })

  it('shows default message if none provided', () => {
    render(
      <RegistrationDetailsModal
        item={{ ...mockItem, message: undefined }}
        onClose={mockOnClose}
      />
    )

    expect(
      screen.getByText('No additional message provided.')
    ).toBeInTheDocument()
  })

  it('renders fallback dashes for missing fields', () => {
    render(
      <RegistrationDetailsModal
        item={{ ...mockItem, website: undefined, aemail: undefined }}
        onClose={mockOnClose}
      />
    )

    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('renders status flag badge', () => {
    render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

    // Find badge by its text content
    const badge = screen.getByText('123')

    // Ensure it is actually the badge
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('rounded-full')
  })


  it('formats date using util', () => {
    render(<RegistrationDetailsModal item={mockItem} onClose={mockOnClose} />)

    const { formatDate } = jest.requireMock('../../../../utils/utils')
    expect(formatDate).toHaveBeenCalledWith(mockItem.now)
  })

  // ── uncovered branch coverage (lines 47–84) ────────────────────────────────

  it('shows "—" when acc_price is absent', () => {
    render(<RegistrationDetailsModal item={{ ...mockItem, acc_price: undefined }} onClose={mockOnClose} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('shows "—" when tot_price is absent', () => {
    render(<RegistrationDetailsModal item={{ ...mockItem, tot_price: undefined }} onClose={mockOnClose} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('shows "—" when transaction_id is absent', () => {
    render(<RegistrationDetailsModal item={{ ...mockItem, transaction_id: undefined }} onClose={mockOnClose} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('shows "—" for Submitted On when now is absent', () => {
    render(<RegistrationDetailsModal item={{ ...mockItem, now: undefined }} onClose={mockOnClose} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('shows "—" when status_flag is absent', () => {
    render(<RegistrationDetailsModal item={{ ...mockItem, status_flag: undefined }} onClose={mockOnClose} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('renders fallback dashes for other basic optional fields', () => {
    const minimalItem = {
      id: 1,
      name: 'Test',
      email: 'test@test.com',
      institution: undefined,
      website: undefined,
      phone: undefined,
      wphone: undefined,
      country: undefined,
      presentation: undefined,
      participants: undefined,
      regtype: undefined,
      accomm: undefined,
      checkin: undefined,
      checkout: undefined,
      nights: undefined,
      accmvalue: undefined,
      acmpng: undefined
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<RegistrationDetailsModal item={minimalItem as any} onClose={mockOnClose} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(5)
  })
})
