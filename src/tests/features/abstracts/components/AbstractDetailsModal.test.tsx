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
    updateAbstractThunk: Object.assign(
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
        loading: jest.fn(() => 'test-toast-id'),
        dismiss: jest.fn(),
    }
}))

import toast from 'react-hot-toast'

jest.mock('../../../../services/upload', () => ({
    uploadService: {
        getSignedUrl: jest.fn(),
    }
}))

/* -------------------- helpers -------------------- */

const mockItem: AbstractItem = {
    id: '1',
    status: { id: 1, actionType: 'Under Review' },
    isEmailSent: false,
    website: { id: 1, name: 'Test Site', link: 'https://example.com/' },
    user: { id: 'u1', firstname: 'Creator', lastname: 'Doe', roles: [{ id: 1, name: 'Admin' }] },
}

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

    it('enters edit mode, updates all fields, and saves', async () => {
        const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
        const dispatch = jest.fn().mockResolvedValue({
            type: 'abstracts/updateAbstract/fulfilled',
            meta: { requestStatus: 'fulfilled' },
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
        
        fireEvent.click(screen.getByText('✎ Edit'))
        expect(screen.getByText('Save Changes')).toBeInTheDocument()

        // Update all textboxes
        const textboxes = screen.getAllByRole('textbox')
        textboxes.forEach(tb => fireEvent.change(tb, { target: { value: 'New text' } }))
        
        // Update combobox (Interested)
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'Others' } })
        
        // Update file
        const fileInput = document.querySelector('input[type="file"]')
        if (fileInput) {
            const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' })
            fireEvent.change(fileInput, { target: { files: [file] } })
        }
        
        fireEvent.click(screen.getByText('Save Changes'))
        await waitFor(() => {
            expect(dispatch).toHaveBeenCalled()
            expect(toast.success).toHaveBeenCalledWith('Abstract updated successfully')
        })
    })

    it('handles edit save failure', async () => {
        const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
        const dispatch = jest.fn().mockResolvedValue({
            type: 'abstracts/updateAbstract/rejected',
            meta: { requestStatus: 'rejected' },
            payload: 'Server error'
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
        
        fireEvent.click(screen.getByText('✎ Edit'))
        fireEvent.click(screen.getByText('Save Changes'))
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Server error')
        })
    })

    it('handles edit save unexpected crash (catch block)', async () => {
        const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
        const dispatch = jest.fn().mockRejectedValue(new Error('Network error'))
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
        
        fireEvent.click(screen.getByText('✎ Edit'))
        fireEvent.click(screen.getByText('Save Changes'))
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('An error occurred while updating')
        })
    })

    it('cancels edit mode', () => {
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
        
        fireEvent.click(screen.getByText('✎ Edit'))
        fireEvent.click(screen.getByText('Cancel'))
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument()
        expect(screen.getByText('✎ Edit')).toBeInTheDocument()
    })

    it('views file by generating signed url', async () => {
        const { uploadService } = jest.requireMock('../../../../services/upload')
        uploadService.getSignedUrl.mockResolvedValue('https://secure-url.com/file.pdf')
        const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
        
        const recordWithS3 = { ...mockRecord, fileS3Url: 'https://s3.amazonaws.com/uploads/file.pdf' }
        const itemWithFile = { ...mockItem, file: 'uploads/file.pdf' }
        
        render(
            <AbstractDetailsModal
                item={itemWithFile}
                record={recordWithS3}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )
        
        fireEvent.click(screen.getByText('file.pdf'))
        
        await waitFor(() => {
            expect(uploadService.getSignedUrl).toHaveBeenCalled()
            expect(openSpy).toHaveBeenCalledWith('https://secure-url.com/file.pdf', '_blank', 'noopener,noreferrer')
        })
        openSpy.mockRestore()
    })

    it('renders true actionLoading states', () => {
        // Simulate actionLoading=true states visually to get full branch coverage
        const { useAppSelector } = jest.requireMock('../../../../store/hooks')
        useAppSelector.mockReturnValue({
            confirmation: true,
            invoice: true,
            reminder: true,
            receipt: true,
        })

        const loadingItem = { 
            ...mockItem, 
            status: { id: 5, actionType: 'Sent Invoice' } 
        }
        
        render(
            <AbstractDetailsModal
                item={loadingItem}
                record={mockRecord}
                modalStatus="Sent Invoice"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )

        const loadingBtns = screen.getAllByText('Sending...')
        expect(loadingBtns.length).toBeGreaterThan(1)
        loadingBtns.forEach(btn => expect(btn).toBeDisabled())
    })

    it('handles view file error', async () => {
        const { uploadService } = jest.requireMock('../../../../services/upload')
        uploadService.getSignedUrl.mockRejectedValue(new Error('API fail'))
        
        const recordWithS3 = { ...mockRecord, fileS3Url: 'https://s3.amazonaws.com/uploads/error.pdf' }
        const itemWithFile = { ...mockItem, file: 'uploads/error.pdf' }
        
        render(
            <AbstractDetailsModal
                item={itemWithFile}
                record={recordWithS3}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )
        
        fireEvent.click(screen.getByText('error.pdf'))
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to get secure access to the file', expect.anything())
        })
    })

    it('dispatches openPaymentReminderModal when Payment Reminder is clicked', () => {
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

        fireEvent.click(screen.getByText('Payment Reminder'))
        expect(dispatch).toHaveBeenCalled()
    })

    it('dispatches openPaymentReceiptModal when Payment Receipt is clicked', () => {
        const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
        const dispatch = jest.fn()
        useAppDispatch.mockReturnValue(dispatch)

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
        expect(dispatch).toHaveBeenCalled()
    })

    it('returns null if item or record is missing', () => {
        const { container } = render(
            <AbstractDetailsModal
                item={null}
                record={null}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )
        expect(container).toBeEmptyDOMElement()
    })

    it('handleViewFile returns early if no fileS3Url', async () => {
        const { uploadService } = jest.requireMock('../../../../services/upload')
        render(
            <AbstractDetailsModal
                item={{ ...mockItem, file: 'test.pdf' }}
                record={{ ...mockRecord, fileS3Url: undefined }}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )
        fireEvent.click(screen.getByText('test.pdf'))
        expect(uploadService.getSignedUrl).not.toHaveBeenCalled()
    })

    it('handles file IIFE fallbacks', () => {
        const itemNested = { 
            ...mockItem, 
            file: 'nested/file.pdf', 
            website: { id: 1, name: 'Site', link: '' } 
        }
        render(
            <AbstractDetailsModal
                item={itemNested}
                record={mockRecord}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )
        const link = screen.getByText('file.pdf')
        expect(link).toHaveAttribute('href', 'uploads/nested/file.pdf')
    })

    it('renders fallback for missing website name', () => {
        render(
            <AbstractDetailsModal
                item={{ ...mockItem, website: undefined }}
                record={mockRecord}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )
        expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })

    it('shows Updating... when actionLoading.status is true', () => {
        const { useAppSelector } = jest.requireMock('../../../../store/hooks')
        useAppSelector.mockReturnValue({
            status: true,
            confirmation: false,
            invoice: false,
            reminder: false,
            receipt: false,
        })
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
        expect(screen.getByText('Updating...')).toBeInTheDocument()
    })

    it('handles confirmation email success with fallback message', async () => {
        const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
        const dispatch = jest.fn().mockResolvedValue({
            type: 'abstracts/sendConfirmationEmail/fulfilled',
            meta: { requestStatus: 'fulfilled' },
            payload: {} 
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
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Confirmation email sent successfully!')
        })
    })

    it('triggers onChange for SelectField and FileField', async () => {
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
        
        fireEvent.click(screen.getByText('✎ Edit'))
        await screen.findByLabelText('Name')

        const select = screen.getByLabelText('Interested')
        fireEvent.change(select, { target: { value: 'Others' } })
        
        const fileInput = screen.getByLabelText('Upload New File')
        const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' })
        fireEvent.change(fileInput, { target: { files: [file] } })
        
        expect(screen.getByDisplayValue('Others')).toBeInTheDocument()
    })
})
