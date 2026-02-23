import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { AbstractRecord, AbstractStatus } from '../../../../features/abstracts/types'
import type { AbstractItem } from '../../../../services/abstracts'
import AbstractDetailsModal from '../../../../features/abstracts/components/AbstractDetailsModal'


/* -------------------- mocks -------------------- */

jest.mock('../../../../store/hooks', () => ({
    useAppDispatch: jest.fn(),
    useAppSelector: jest.fn(),
}))

jest.mock('../../../../store/slices/abstracts/abstracts.selectors', () => ({
    selectActionLoading: jest.fn(),
}))

jest.mock('../../../../store/slices/abstracts/abstracts.thunks', () => ({
    sendConfirmationEmailThunk: Object.assign(
        jest.fn(),
        {
            fulfilled: {
                match: (action: { type?: string; meta?: { requestStatus?: string } }) => action.type?.endsWith('/fulfilled') || action.meta?.requestStatus === 'fulfilled'
            },
        }
    ),
}))

jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
    }
}))

import toast from 'react-hot-toast'

jest.mock('../../../../store/slices/abstracts/abstracts.slice', () => ({
  openInvoiceModal: jest.fn((payload) => ({ type: 'invoice', payload })),
  openPaymentReminderModal: jest.fn((payload) => ({
    type: 'reminder',
    payload,
  })),
  openPaymentReceiptModal: jest.fn((payload) => ({
    type: 'receipt',
    payload,
  })),
}))

/* -------------------- helpers -------------------- */

const mockItem = {
    id: '1',
    status: { id: 1, actionType: 'Under Review' },
    isEmailSent: false,
    website: { name: 'Test Site', link: 'https://example.com/' },
    user: { id: 'u1', firstname: 'Creator', lastname: 'Doe', roles: [{ id: 1, name: 'Admin' }] },
} as AbstractItem

const mockRecord: AbstractRecord = {
    id: '1',
    name: 'John Doe',
    email: 'john@test.com',
    status: 'Under Review',
    isEmailSent: false,
}

/* -------------------- tests -------------------- */

describe('AbstractDetailsModal', () => {
    const onClose = jest.fn()
    const onUpdate = jest.fn()
    const onStatusChange = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        const { useAppSelector, useAppDispatch } = jest.requireMock('../../../../store/hooks')
        useAppDispatch.mockReturnValue(jest.fn())
        useAppSelector.mockReturnValue({
            status: false,
            confirmation: false,
            invoice: false,
            reminder: false,
            receipt: false,
        })
    })

    it('renders modal with details', () => {
        render(
            <AbstractDetailsModal
                item={mockItem}
                record={mockRecord}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )

        expect(screen.getByText('Abstract Details')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getAllByText('Under Review')[0]).toBeInTheDocument()
        expect(screen.getByText('Send Confirmation Email')).toBeInTheDocument()
    })

    it('calls onClose when Close button is clicked', () => {
        render(
            <AbstractDetailsModal
                item={mockItem}
                record={mockRecord}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )

        fireEvent.click(screen.getByText('Close'))
        expect(onClose).toHaveBeenCalled()
    })

    it('calls onUpdate when Update button is clicked', () => {
        render(
            <AbstractDetailsModal
                item={mockItem}
                record={mockRecord}
                modalStatus="Accepted"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )

        fireEvent.click(screen.getByText('Update'))
        expect(onUpdate).toHaveBeenCalled()
    })

    it('calls sendConfirmationEmailThunk when confirmation button is clicked', async () => {
        const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
        const dispatch = jest.fn().mockResolvedValue({
            type: 'abstracts/sendConfirmationEmail/fulfilled',
            meta: { requestStatus: 'fulfilled' },
            payload: { message: 'ok' }
        })
        useAppDispatch.mockReturnValue(dispatch)

        render(
            <AbstractDetailsModal
                item={mockItem}
                record={mockRecord}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )

        fireEvent.click(screen.getByText('Send Confirmation Email'))
        expect(dispatch).toHaveBeenCalled()
    })

    it('renders invoice buttons when status is Sent Invoice', () => {
        render(
            <AbstractDetailsModal
                item={mockItem}
                record={mockRecord}
                modalStatus="Sent Invoice"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )

        expect(screen.getByText('Invoice')).toBeInTheDocument()
        expect(screen.getByText('Payment Reminder')).toBeInTheDocument()
    })

    it('renders payment receipt button when status is Registered', () => {
        render(
            <AbstractDetailsModal
                item={mockItem}
                record={mockRecord}
                modalStatus="Registered"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )

        expect(screen.getByText('Payment Receipt')).toBeInTheDocument()
    })

    it('updates status via select', () => {
        render(
            <AbstractDetailsModal
                item={mockItem}
                record={mockRecord}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )

        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'Accepted' } })
        expect(onStatusChange).toHaveBeenCalledWith('Accepted')
    })

    it('renders file link if file exists', () => {
        const itemWithFile = { ...mockItem, file: 'uploads/test.pdf' }
        render(
            <AbstractDetailsModal
                item={itemWithFile}
                record={mockRecord}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )

        const fileLink = screen.getByText('test.pdf')
        expect(fileLink).toBeInTheDocument()
        expect(fileLink).toHaveAttribute('href', 'https://example.com/uploads/test.pdf')
    })

    it('renders terminal statuses (Rejected, Out of Scope, Deleted)', () => {
        const statuses: AbstractStatus[] = ['Rejected', 'Out of Scope', 'Deleted']

        statuses.forEach(status => {
            render(
                <AbstractDetailsModal
                    item={{ ...mockItem, status: { id: 0, actionType: status } }}
                    record={{ ...mockRecord, status: status as AbstractStatus }}
                    modalStatus={status}
                    onClose={onClose}
                    onUpdate={onUpdate}
                    onStatusChange={onStatusChange}
                />
            )
            expect(screen.getAllByText(status)[0]).toBeInTheDocument()
        })
    })

    it('handles confirmation email failure', async () => {
        const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
        const dispatch = jest.fn().mockResolvedValue({ type: 'abstracts/sendConfirmationEmail/rejected', meta: { requestStatus: 'rejected' } })
        useAppDispatch.mockReturnValue(dispatch)

        render(
            <AbstractDetailsModal
                item={mockItem}
                record={mockRecord}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )

        fireEvent.click(screen.getByText('Send Confirmation Email'))
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to send confirmation email')
        })
    })

    it('dispatches openInvoiceModal when Invoice button is clicked', () => {
        const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
        const dispatch = jest.fn()
        useAppDispatch.mockReturnValue(dispatch)

        render(
            <AbstractDetailsModal
                item={mockItem}
                record={mockRecord}
                modalStatus="Sent Invoice"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )

        fireEvent.click(screen.getByText('Invoice'))
        expect(dispatch).toHaveBeenCalled()
    })

    it('dispatches openPaymentReminderModal with correct payload', () => {
  const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
  const dispatch = jest.fn()
  useAppDispatch.mockReturnValue(dispatch)

  const { openPaymentReminderModal } = jest.requireMock(
    '../../../../store/slices/abstracts/abstracts.slice'
  )

  render(
    <AbstractDetailsModal
      item={mockItem}
      record={mockRecord}
      modalStatus="Sent Invoice"
      onClose={onClose}
      onUpdate={onUpdate}
      onStatusChange={onStatusChange}
    />
  )

  fireEvent.click(screen.getByText('Payment Reminder'))

  expect(openPaymentReminderModal).toHaveBeenCalledWith({
    id: '1',
    name: 'John Doe',
  })

  expect(dispatch).toHaveBeenCalledWith({
    type: 'reminder',
    payload: { id: '1', name: 'John Doe' },
  })
})

it('dispatches openPaymentReceiptModal with correct payload', () => {
  const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
  const dispatch = jest.fn()
  useAppDispatch.mockReturnValue(dispatch)

  const { openPaymentReceiptModal } = jest.requireMock(
    '../../../../store/slices/abstracts/abstracts.slice'
  )

  render(
    <AbstractDetailsModal
      item={mockItem}
      record={mockRecord}
      modalStatus="Registered"
      onClose={onClose}
      onUpdate={onUpdate}
      onStatusChange={onStatusChange}
    />
  )

  fireEvent.click(screen.getByText('Payment Receipt'))

  expect(openPaymentReceiptModal).toHaveBeenCalledWith({
    id: '1',
    name: 'John Doe',
  })

  expect(dispatch).toHaveBeenCalledWith({
    type: 'receipt',
    payload: { id: '1', name: 'John Doe' },
  })
})


})
