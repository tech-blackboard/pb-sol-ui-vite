import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AbstractsPage from '../../../../features/abstracts/pages/AbstractsPage'
import { useAppDispatch, useAppSelector } from '../../../../store/hooks'
import {
    fetchAbstracts,
    updateStatusThunk,
    sendInvoiceThunk,
    sendPaymentReceiptThunk,
    sendPaymentReminderThunk,
} from '../../../../store/slices/abstracts/abstracts.thunks'
import {
    setPage,
    setPageSize,
    setSelected,
    clearSelected,
    setModalStatus,
    closeInvoiceModal,
    closePaymentReceiptModal,
    closePaymentReminderModal,
} from '../../../../store/slices/abstracts/abstracts.slice'
import toast from 'react-hot-toast'
import type { AbstractItem } from '../../../../services/abstracts'
import type { AbstractRecord } from '../../../../features/abstracts/types'

/* --------------------------------------------------
   MOCKS
-------------------------------------------------- */

jest.mock('../../../../store/hooks', () => ({
    useAppDispatch: jest.fn(),
    useAppSelector: jest.fn(),
}))

jest.mock('../../../../store/slices/abstracts/abstracts.thunks', () => ({
    fetchAbstracts: jest.fn(),
    updateStatusThunk: Object.assign(jest.fn(), {
        fulfilled: { match: jest.fn() },
    }),
    sendInvoiceThunk: Object.assign(jest.fn(), {
        fulfilled: { match: jest.fn() },
    }),
    sendPaymentReceiptThunk: Object.assign(jest.fn(), {
        fulfilled: { match: jest.fn() },
    }),
    sendPaymentReminderThunk: Object.assign(jest.fn(), {
        fulfilled: { match: jest.fn() },
    }),
}))

jest.mock('../../../../store/slices/abstracts/abstracts.slice', () => ({
    setPage: jest.fn(),
    setPageSize: jest.fn(),
    setSelected: jest.fn(),
    clearSelected: jest.fn(),
    setModalStatus: jest.fn(),
    closeInvoiceModal: jest.fn(),
    closePaymentReceiptModal: jest.fn(),
    closePaymentReminderModal: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
    },
}))

// Mock child components to isolate AbstractsPage logic
jest.mock('../../../../features/abstracts/components/AbstractHeader', () => ({
    __esModule: true,
    default: () => <div data-testid="abstract-header">Header</div>
}))

interface AbstractTableProps {
    rawRows: AbstractItem[]
    onView: (item: AbstractItem) => void
}

jest.mock('../../../../features/abstracts/components/AbstractTable', () => ({
    __esModule: true,
    default: (props: AbstractTableProps) => (
        <div data-testid="abstract-table">
            Table
            <button onClick={() => props.onView(props.rawRows[0])}>View First</button>
        </div>
    )
}))

interface AbstractPaginationProps {
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
}

jest.mock('../../../../features/abstracts/components/AbstractPagination', () => ({
    __esModule: true,
    default: (props: AbstractPaginationProps) => (
        <div data-testid="abstract-pagination">
            Pagination
            <button onClick={() => props.onPageChange(2)}>Next Page</button>
            <button onClick={() => props.onPageSizeChange(20)}>Change Size</button>
        </div>
    )
}))

interface AbstractDetailsModalProps {
    onClose: () => void
    onStatusChange: (status: string) => void
    onUpdate: () => void
}

jest.mock('../../../../features/abstracts/components/AbstractDetailsModal', () => ({
    __esModule: true,
    default: (props: AbstractDetailsModalProps) => (
        <div data-testid="abstract-details-modal">
            Modal
            <button onClick={props.onClose}>Close</button>
            <button onClick={() => props.onStatusChange('Accepted')}>Change Status</button>
            <button onClick={props.onUpdate}>Update</button>
        </div>
    )
}))

interface FormProps {
    onClose: () => void
    onSubmit: (data: Record<string, unknown>) => void
}

jest.mock('../../../../components/InvoiceForm', () => ({
    __esModule: true,
    InvoiceForm: (props: FormProps) => (
        <div data-testid="invoice-form">
            Invoice Form
            <button onClick={props.onClose}>Close</button>
            <button onClick={() => props.onSubmit({ amount: 100 })}>Submit Invoice</button>
        </div>
    )
}))

jest.mock('../../../../components/PaymentReceipt', () => ({
    __esModule: true,
    PaymentReceiptForm: (props: FormProps) => (
        <div data-testid="payment-receipt-form">
            Payment Receipt Form
            <button onClick={props.onClose}>Close</button>
            <button onClick={() => props.onSubmit({ amount: 100 })}>Submit Receipt</button>
        </div>
    )
}))

jest.mock('../../../../components/PaymentReminderModal', () => ({
    __esModule: true,
    PaymentReminderModal: (props: FormProps) => (
        <div data-testid="payment-reminder-modal">
            Payment Reminder Modal
            <button onClick={props.onClose}>Close</button>
            <button onClick={() => props.onSubmit({ amount: 100 })}>Submit Reminder</button>
        </div>
    )
}))


/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */

const mockAbstractItem: AbstractItem = {
    id: '1',
    name: 'Test Abstract',
    status: { id: 1, actionType: 'Under Review' },
} as unknown as AbstractItem

const mockAbstractRecord: AbstractRecord = {
    id: '1',
    name: 'Test Abstract',
    status: 'Under Review',
    email: 'test@example.com',
    isEmailSent: false,
}

const mockState = {
    abstracts: {
        items: [mockAbstractRecord],
        rawItems: [mockAbstractItem],
        loading: false,
        page: 1,
        pageSize: 10,
        total: 1,
        error: null,
        invoiceModal: { open: false, abstractId: null, abstractName: '' },
        paymentReceiptModal: { open: false, abstractId: null, abstractName: '' },
        paymentReminderModal: { open: false, abstractId: null, abstractName: '' },
        actionLoading: { status: false, invoice: false, receipt: false, reminder: false, confirmation: false },
        appliedFilters: { onlyDeleted: 'false' },
        draftFilters: { onlyDeleted: 'false' },
    },
    auth: {
        user: { name: 'Test User', role: 'User', permissions: ['export:excel'] },
        token: 'fake-token',
        loading: false,
        error: null,
    }
}

/* --------------------------------------------------
   TEST SUITE
-------------------------------------------------- */

describe('AbstractsPage', () => {
    const dispatchMock = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (useAppDispatch as jest.Mock).mockReturnValue(dispatchMock)
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(mockState))

            // Setup thunk matchers
            ; (updateStatusThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(true)
            ; (sendInvoiceThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(true)
            ; (sendPaymentReceiptThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(true)
            ; (sendPaymentReminderThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(true)

        dispatchMock.mockResolvedValue({ type: 'fulfilled', payload: {} })
    })

    test('renders main layout components', () => {
        render(<AbstractsPage />)
        expect(screen.getByTestId('abstract-header')).toBeInTheDocument()
        expect(screen.getByTestId('abstract-table')).toBeInTheDocument()
        expect(screen.getByTestId('abstract-pagination')).toBeInTheDocument()
    })

    test('dispatches fetchAbstracts on mount', () => {
        render(<AbstractsPage />)
        expect(fetchAbstracts).toHaveBeenCalled()
    })

    test('handles table view actions', () => {
        render(<AbstractsPage />)

        fireEvent.click(screen.getByText('View First'))
        expect(setSelected).toHaveBeenCalledWith(mockAbstractItem)
    })

    test('handles pagination actions', () => {
        render(<AbstractsPage />)

        fireEvent.click(screen.getByText('Next Page'))
        expect(setPage).toHaveBeenCalledWith(2)

        fireEvent.click(screen.getByText('Change Size'))
        expect(setPageSize).toHaveBeenCalledWith(20)
    })

    test('renders DetailsModal when item is selected', () => {
        const stateWithSelected = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                selected: mockAbstractItem,
                modalStatus: 'Under Review',
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithSelected))

        render(<AbstractsPage />)
        expect(screen.getByTestId('abstract-details-modal')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Close'))
        expect(clearSelected).toHaveBeenCalled()

        fireEvent.click(screen.getByText('Change Status'))
        expect(setModalStatus).toHaveBeenCalledWith('Accepted')
    })

    test('handles handleUpdateStatus in DetailsModal', async () => {
        // Mocking selectors for internal handleUpdateStatus check
        const stateSelectedAndAccepted = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                selected: mockAbstractItem,
                modalStatus: 'Accepted',
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateSelectedAndAccepted))

        render(<AbstractsPage />)

        fireEvent.click(screen.getByText('Update'))

        await waitFor(() => {
            expect(updateStatusThunk).toHaveBeenCalled()
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Status updated'))
        })
    })

    test('handles handleUpdateStatus failure in DetailsModal', async () => {
        // Mocking selectors for internal handleUpdateStatus check
        const stateSelectedAndAccepted = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                selected: mockAbstractItem,
                modalStatus: 'Accepted',
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateSelectedAndAccepted))
            ; (updateStatusThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(false)

        // First dispatch is fetchAbstracts on mount
        dispatchMock.mockResolvedValueOnce({ type: 'fetch/fulfilled', payload: [] })
        
        // Second dispatch is the updateStatusThunk
        dispatchMock.mockResolvedValueOnce({
            type: 'rejected',
            payload: undefined, // undefined to trigger fallback "Failed to update status"
        })

        render(<AbstractsPage />)

        fireEvent.click(screen.getByText('Update'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to update status')
        })
    })

    test('shows WhatsApp success toast when whatsappSent is true', async () => {
        const stateSelectedAndAccepted = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                selected: mockAbstractItem,
                modalStatus: 'Accepted',
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateSelectedAndAccepted))

        // First call is fetchAbstracts on mount, second is updateStatusThunk
        dispatchMock.mockResolvedValueOnce({ type: 'fetch/fulfilled', payload: [] })
        dispatchMock.mockResolvedValueOnce({
            type: 'fulfilled',
            payload: { whatsappSent: true }
        })

        render(<AbstractsPage />)

        fireEvent.click(screen.getByText('Update'))

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                expect.stringContaining('WhatsApp message sent successfully'),
                expect.objectContaining({ icon: '📱' })
            )
        })
    })

    test('renders and handles InvoiceForm', async () => {
        const stateWithInvoice = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                invoiceModal: { open: true, abstractId: '1', abstractName: 'Test' },
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithInvoice))

        render(<AbstractsPage />)
        expect(screen.getByTestId('invoice-form')).toBeInTheDocument()

        // 1. sendInvoiceThunk, 2. updateStatusThunk
        dispatchMock.mockResolvedValueOnce({ type: 'fulfilled', payload: {} })
        dispatchMock.mockResolvedValueOnce({
            type: 'fulfilled',
            payload: { updatedAbstract: { email: 'test@example.com' } }
        })

        fireEvent.click(screen.getByText('Submit Invoice'))

        await waitFor(() => {
            expect(sendInvoiceThunk).toHaveBeenCalled()
            expect(updateStatusThunk).toHaveBeenCalled()
            expect(closeInvoiceModal).toHaveBeenCalled()
            // Wait for the setTimeout in the then block
            expect(toast.success).toHaveBeenCalledWith('Status updated to Sent Invoice')
        })
    })

    test('renders and handles InvoiceForm but updateStatus fails', async () => {
        const stateWithInvoice = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                invoiceModal: { open: true, abstractId: '1', abstractName: 'Test' },
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithInvoice))

        render(<AbstractsPage />)
        expect(screen.getByTestId('invoice-form')).toBeInTheDocument()

        // 1. sendInvoiceThunk (success), 2. updateStatusThunk (fail)
        dispatchMock.mockResolvedValueOnce({ type: 'fulfilled', payload: {} })
        dispatchMock.mockResolvedValueOnce({ type: 'rejected', payload: {} })
        
        // Mock matching
        ; (sendInvoiceThunk.fulfilled.match as unknown as jest.Mock).mockReturnValueOnce(true)
        ; (updateStatusThunk.fulfilled.match as unknown as jest.Mock).mockReturnValueOnce(false)

        fireEvent.click(screen.getByText('Submit Invoice'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Invoice sent, but status update failed')
            expect(closeInvoiceModal).toHaveBeenCalled()
        })
    })

    test('renders and handles PaymentReceiptForm', async () => {
        const stateWithReceipt = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                paymentReceiptModal: { open: true, abstractId: '1', abstractName: 'Test' },
                actionLoading: { ...mockState.abstracts.actionLoading, receipt: false }
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithReceipt))

        render(<AbstractsPage />)
        expect(screen.getByTestId('payment-receipt-form')).toBeInTheDocument()

        // Mock payload for success toast
        dispatchMock.mockResolvedValueOnce({
            type: 'fulfilled',
            payload: { receiptResult: { message: 'Receipt sent' } }
        })

        fireEvent.click(screen.getByText('Submit Receipt'))

        await waitFor(() => {
            expect(sendPaymentReceiptThunk).toHaveBeenCalled()
            expect(closePaymentReceiptModal).toHaveBeenCalled()
            expect(toast.success).toHaveBeenCalledWith('Receipt sent')
            // Wait for the setTimeout in the then block
            expect(toast.success).toHaveBeenCalledWith('Status updated to Registered')
        })
    })

    test('renders and handles PaymentReminderModal', async () => {
        const stateWithReminder = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                paymentReminderModal: { open: true, abstractId: '1', abstractName: 'Test' },
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithReminder))

        render(<AbstractsPage />)
        expect(screen.getByTestId('payment-reminder-modal')).toBeInTheDocument()

        dispatchMock.mockResolvedValueOnce({
            type: 'fulfilled',
            payload: { message: 'Reminder sent' }
        })

        fireEvent.click(screen.getByText('Submit Reminder'))

        await waitFor(() => {
            expect(sendPaymentReminderThunk).toHaveBeenCalled()
            expect(closePaymentReminderModal).toHaveBeenCalled()
            expect(toast.success).toHaveBeenCalledWith('Reminder sent')
        })
    })

    test('handles PaymentReminderModal with whatsapp success toast', async () => {
        const itemWithWPhone = { ...mockAbstractItem, id: '1', wphone: '9876543210' }
        const stateWithReminder = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                items: [itemWithWPhone],
                paymentReminderModal: { open: true, abstractId: '1', abstractName: 'Test' },
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithReminder))

        render(<AbstractsPage />)
        expect(screen.getByTestId('payment-reminder-modal')).toBeInTheDocument()

        dispatchMock.mockResolvedValueOnce({
            type: 'fulfilled',
            payload: { message: 'Reminder sent', whatsappSent: true }
        })

        fireEvent.click(screen.getByText('Submit Reminder'))

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                expect.stringContaining('WhatsApp message sent successfully to 9876543210'),
                expect.objectContaining({ icon: '📱' })
            )
        })
    })

    test('handles handleInvoiceSubmit failure', async () => {
        const stateWithInvoice = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                invoiceModal: { open: true, abstractId: '1', abstractName: 'Test' },
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithInvoice))
            ; (sendInvoiceThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(false)
        dispatchMock.mockResolvedValueOnce({
            type: 'rejected',
            payload: undefined,
        })

        render(<AbstractsPage />)

        fireEvent.click(screen.getByText('Submit Invoice'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to send invoice') // hit fallback line 100
        })
    })

    test('ignores handleInvoiceSubmit if no abstractId', async () => {
        const stateWithInvoice = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                invoiceModal: { open: true, abstractId: null, abstractName: 'Test' },
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithInvoice))

        render(<AbstractsPage />)
        fireEvent.click(screen.getByText('Submit Invoice'))
        expect(sendInvoiceThunk).not.toHaveBeenCalled()
    })

    test('handles handlePaymentReceiptSubmit failure', async () => {
        const stateWithReceipt = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                paymentReceiptModal: { open: true, abstractId: '1', abstractName: 'Test' },
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithReceipt))
            ; (sendPaymentReceiptThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(false)
        dispatchMock.mockResolvedValueOnce({
            type: 'rejected',
            payload: undefined,
        })
        render(<AbstractsPage />)

        fireEvent.click(screen.getByText('Submit Receipt'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to send payment receipt') // hit fallback line 141
        })
    })

    test('ignores handlePaymentReceiptSubmit if no abstractId', async () => {
        const stateWithReceipt = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                paymentReceiptModal: { open: true, abstractId: null, abstractName: 'Test' },
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithReceipt))

        render(<AbstractsPage />)
        fireEvent.click(screen.getByText('Submit Receipt'))
        expect(sendPaymentReceiptThunk).not.toHaveBeenCalled()
    })

    test('handles handlePaymentReminderSubmit failure', async () => {
        const stateWithReminder = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                paymentReminderModal: { open: true, abstractId: '1', abstractName: 'Test' },
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithReminder))
            ; (sendPaymentReminderThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(false)
        dispatchMock.mockResolvedValueOnce({
            type: 'rejected',
            payload: undefined,
        })

        render(<AbstractsPage />)

        fireEvent.click(screen.getByText('Submit Reminder'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to send payment reminder') // hit fallback line 173
        })
    })

    test('ignores handlePaymentReminderSubmit if no abstractId', async () => {
        const stateWithReminder = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                paymentReminderModal: { open: true, abstractId: null, abstractName: 'Test' },
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithReminder))

        render(<AbstractsPage />)
        fireEvent.click(screen.getByText('Submit Reminder'))
        expect(sendPaymentReminderThunk).not.toHaveBeenCalled()
    })

    test('handles PaymentReminderModal with whatsapp success toast fallback phone', async () => {
        const itemWithPhone = { ...mockAbstractItem, id: '1', phone: '1112223333' }
        const stateWithReminder = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                items: [itemWithPhone],
                paymentReminderModal: { open: true, abstractId: '1', abstractName: 'Test' },
            }
        }
            ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithReminder))

        render(<AbstractsPage />)

        dispatchMock.mockResolvedValueOnce({
            type: 'fulfilled',
            payload: { message: 'Reminder sent', whatsappSent: true }
        })

        fireEvent.click(screen.getByText('Submit Reminder'))

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                expect.stringContaining('WhatsApp message sent successfully to 1112223333'), // line 164 fallback
                expect.objectContaining({ icon: '📱' })
            )
        })
    })

    test('handleUpdateStatus returns early if no viewItem (line 57)', () => {
        const stateNoSelected = {
            ...mockState,
            abstracts: { ...mockState.abstracts, selected: null }
        }
        ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateNoSelected))
        
        render(<AbstractsPage />)
        // Since modal is not rendered when viewItem is null (line 200), we can't trigger handleUpdateStatus easily via UI.
        // However, if we assume it could be called, the guard would catch it.
        // To be thorough, let's verify selected=null case means handleUpdateStatus is not reachable.
        expect(screen.queryByTestId('abstract-details-modal')).not.toBeInTheDocument()
    })

    test('handleUpdateStatus returns early if same status', () => {
        const stateSameStatus = {
            ...mockState,
            abstracts: { 
                ...mockState.abstracts, 
                selected: mockAbstractItem,
                modalStatus: 'Under Review'
            }
        }
        ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateSameStatus))
        
        render(<AbstractsPage />)
        fireEvent.click(screen.getByText('Update'))
        expect(updateStatusThunk).not.toHaveBeenCalled()
    })

    test('handles thunk errors with non-string payloads', async () => {
        const stateSelectedAndAccepted = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                selected: mockAbstractItem,
                modalStatus: 'Accepted',
            }
        }
        ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateSelectedAndAccepted))
        ; (updateStatusThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(false)
        
        dispatchMock.mockResolvedValueOnce({ type: 'fetch/fulfilled', payload: [] })
        dispatchMock.mockResolvedValueOnce({
            type: 'rejected',
            payload: { some: 'object' },
        })

        render(<AbstractsPage />)
        fireEvent.click(screen.getByText('Update'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to update status')
        })
    })

    test('handles WhatsApp toast when abstract is missing in items', async () => {
        const stateNoItems = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                items: [],
                paymentReminderModal: { open: true, abstractId: '1', abstractName: 'Test' },
            }
        }
        ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateNoItems))

        render(<AbstractsPage />)
        
        dispatchMock.mockResolvedValueOnce({
            type: 'fulfilled',
            payload: { message: 'Reminder sent', whatsappSent: true }
        })

        fireEvent.click(screen.getByText('Submit Reminder'))

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                expect.stringContaining('WhatsApp message sent successfully to '),
                expect.objectContaining({ icon: '📱' })
            )
        })
    })

    test('handleUpdateStatus returns early if no modalStatus (line 57)', () => {
        const stateNoModalStatus = {
            ...mockState,
            abstracts: { 
                ...mockState.abstracts, 
                selected: mockAbstractItem,
                modalStatus: null 
            }
        }
        ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateNoModalStatus))
        
        render(<AbstractsPage />)
        // Similar to viewItem=null, the modal won't render if any of the three are null (line 200)
        expect(screen.queryByTestId('abstract-details-modal')).not.toBeInTheDocument()
    })

    test('handleUpdateStatus covers error string payload (line 83)', async () => {
        const stateSelectedAndAccepted = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                selected: mockAbstractItem,
                modalStatus: 'Accepted',
            }
        }
        ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateSelectedAndAccepted))
        
        dispatchMock.mockResolvedValueOnce({ type: 'fetch/fulfilled', payload: [] }) // mount
        dispatchMock.mockResolvedValueOnce({
            type: 'rejected',
            payload: 'Server Error String',
        })
        ;(updateStatusThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(false)

        render(<AbstractsPage />)
        fireEvent.click(screen.getByText('Update'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Server Error String')
        })
    })

    test('handleUpdateStatus covers phone fallback chain (line 76)', async () => {
        const itemWithPhoneOnly = { ...mockAbstractItem, wphone: null, phone: '5556667777' }
        const stateWithPhone = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                selected: itemWithPhoneOnly,
                modalStatus: 'Accepted',
            }
        }
        ; (useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithPhone))
        
        dispatchMock.mockResolvedValueOnce({ type: 'fetch/fulfilled', payload: [] })
        dispatchMock.mockResolvedValueOnce({
            type: 'fulfilled',
            payload: { whatsappSent: true }
        })
        ;(updateStatusThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(true)

        render(<AbstractsPage />)
        fireEvent.click(screen.getByText('Update'))

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                expect.stringContaining('successfully to 5556667777'),
                expect.any(Object)
            )
        })
    })

    test('covers viewItem.status string fallback (line 60)', async () => {
        const itemWithStringStatus = { ...mockAbstractItem, id: '99', status: 'Accepted' } as unknown as AbstractItem
        const stateWithStringStatus = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                items: [{ ...mockAbstractRecord, id: '99' }],
                selected: itemWithStringStatus,
                modalStatus: 'Rejected', // different so it proceeds to update
            }
        }
        ;(useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateWithStringStatus))
        
        dispatchMock.mockResolvedValueOnce({ type: 'fetch/fulfilled', payload: [] })
        dispatchMock.mockResolvedValueOnce({
            type: 'fulfilled',
            payload: { whatsappSent: false }
        })
        ;(updateStatusThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(true)

        render(<AbstractsPage />)
        fireEvent.click(screen.getByText('Update'))

        await waitFor(() => {
            expect(updateStatusThunk).toHaveBeenCalled()
        })
    })

    test('covers string payloads for invoice, receipt, reminder rejections (lines 100, 141, 173)', async () => {
        const stateForModals = {
            ...mockState,
            abstracts: {
                ...mockState.abstracts,
                invoiceModal: { open: true, abstractId: '1', abstractName: 'Test' },
                paymentReceiptModal: { open: true, abstractId: '1', abstractName: 'Test' },
                paymentReminderModal: { open: true, abstractId: '1', abstractName: 'Test' },
            }
        }
        ;(useAppSelector as jest.Mock).mockImplementation((selectorFn) => selectorFn(stateForModals))
        
        // Mock matchers to false
        ;(sendInvoiceThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(false)
        ;(sendPaymentReceiptThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(false)
        ;(sendPaymentReminderThunk.fulfilled.match as unknown as jest.Mock).mockReturnValue(false)
        
        render(<AbstractsPage />)

        // 1. Invoice
        dispatchMock.mockResolvedValueOnce({ type: 'rejected', payload: 'Invoice String Error' })
        fireEvent.click(screen.getByText('Submit Invoice'))
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Invoice String Error'))

        // 2. Receipt
        dispatchMock.mockResolvedValueOnce({ type: 'rejected', payload: 'Receipt String Error' })
        fireEvent.click(screen.getByText('Submit Receipt'))
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Receipt String Error'))

        // 3. Reminder
        dispatchMock.mockResolvedValueOnce({ type: 'rejected', payload: 'Reminder String Error' })
        fireEvent.click(screen.getByText('Submit Reminder'))
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Reminder String Error'))
    })
})
