
jest.mock('../../services/abstracts', () => ({
  __esModule: true,
  getAbstractById: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
  },
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import toast from 'react-hot-toast'

import type { AbstractItem } from '../../services/abstracts'

import { PaymentReminderModal } from '../../components/PaymentReminderModal'
import { getAbstractById } from '../../services/abstracts'

const mockGetAbstractById = getAbstractById as jest.MockedFunction<
  typeof getAbstractById
>

describe('PaymentReminderModal', () => {
  const onClose = jest.fn()
  const onSubmit = jest.fn()

  const defaultProps = {
    isOpen: true,
    abstractId: '123',
    onClose,
    onSubmit,
    isLoading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    })
  })

  /* ---------------------------------- Render ---------------------------------- */

  it('does not render when closed', () => {
    render(<PaymentReminderModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Send Payment Reminder')).not.toBeInTheDocument()
  })

  it('renders modal when open', async () => {
    mockGetAbstractById.mockResolvedValue({ paymentLink: null } as unknown as AbstractItem)

    render(<PaymentReminderModal {...defaultProps} />)

    expect(await screen.findByText('Send Payment Reminder')).toBeInTheDocument()
  })

  /* ---------------------------------- Loading --------------------------------- */

  it('shows loading while fetching data', () => {
    mockGetAbstractById.mockImplementation(() => new Promise(() => { }))

    render(<PaymentReminderModal {...defaultProps} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  /* ------------------------- Existing payment link ---------------------------- */

  it('shows existing payment link when available', async () => {
    mockGetAbstractById.mockResolvedValue({
      paymentLink: 'https://pay.test/link',
    } as unknown as AbstractItem)

    render(<PaymentReminderModal {...defaultProps} />)

    expect(
      await screen.findByText('✅ Payment link already available')
    ).toBeInTheDocument()

    expect(screen.getByText('https://pay.test/link')).toBeInTheDocument()
  })

  it('copies payment link to clipboard', async () => {
    mockGetAbstractById.mockResolvedValue({
      paymentLink: 'https://pay.test/link',
    } as unknown as AbstractItem)

    render(<PaymentReminderModal {...defaultProps} />)

    const copyBtn = await screen.findByText('Copy link')
    fireEvent.click(copyBtn)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://pay.test/link'
    )
    expect(toast.success).toHaveBeenCalledWith('Payment link copied')
  })

  it('submits existing payment link', async () => {
    mockGetAbstractById.mockResolvedValue({
      paymentLink: 'https://pay.test/link',
    } as unknown as AbstractItem)

    render(<PaymentReminderModal {...defaultProps} />)

    // Wait until the button is enabled (data loaded)
    const sendBtn = await waitFor(() => {
      const btn = screen.getByText('Send Reminder')
      expect(btn).toBeEnabled()
      return btn
    })

    fireEvent.click(sendBtn)

    expect(onSubmit).toHaveBeenCalledWith({
      paymentLink: 'https://pay.test/link',
    })
  })


  /* -------------------------- No payment link case ----------------------------- */

  it('shows input when payment link is missing', async () => {
    mockGetAbstractById.mockResolvedValue({ paymentLink: null } as unknown as AbstractItem)

    render(<PaymentReminderModal {...defaultProps} />)

    expect(
      await screen.findByPlaceholderText('https://payment.example.com/...')
    ).toBeInTheDocument()
  })

  it('submits manually entered payment link', async () => {
    mockGetAbstractById.mockResolvedValue({ paymentLink: null } as unknown as AbstractItem)

    render(<PaymentReminderModal {...defaultProps} />)

    const input = await screen.findByPlaceholderText(
      'https://payment.example.com/...'
    )

    fireEvent.change(input, {
      target: { value: 'https://manual.link' },
    })

    fireEvent.click(screen.getByText('Send Reminder'))

    expect(onSubmit).toHaveBeenCalledWith({
      paymentLink: 'https://manual.link',
    })
  })

  /* ---------------------------------- Close ----------------------------------- */

  it('calls onClose when close button is clicked', async () => {
    mockGetAbstractById.mockResolvedValue({ paymentLink: null } as unknown as AbstractItem)

    render(<PaymentReminderModal {...defaultProps} />)

    fireEvent.click(await screen.findByLabelText('Close'))
    expect(onClose).toHaveBeenCalled()
  })

  /* --------------------------------- Disabled --------------------------------- */

  it('disables controls when loading', async () => {
    mockGetAbstractById.mockResolvedValue({ paymentLink: null } as unknown as AbstractItem)

    render(<PaymentReminderModal {...defaultProps} isLoading />)

    expect(await screen.findByText('Sending...')).toBeDisabled()
  })

  /* ---------------------------------- Error ----------------------------------- */

  it('handles API error gracefully', async () => {
    mockGetAbstractById.mockRejectedValue(new Error('API error'))
    jest.spyOn(console, 'error').mockImplementation(() => { })

    render(<PaymentReminderModal {...defaultProps} />)

    expect(
      await screen.findByText(
        'Payment link is not available, please send payment reminder'
      )
    ).toBeInTheDocument()
  })
})