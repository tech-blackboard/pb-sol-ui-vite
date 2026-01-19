import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { AbstractRecord } from '../../../../features/abstracts/types'
import AbstractDetailsModal from '../../../../features/abstracts/components/AbstractDetailsModal'


/* -------------------- mocks -------------------- */

jest.mock('../../../../store/hooks', () => ({
    useAppDispatch: () => jest.fn(),
    useAppSelector: jest.fn(),
}))

jest.mock('../../../../store/slices/abstracts/abstracts.selectors', () => ({
    selectActionLoading: jest.fn(),
}))

jest.mock('../../../../store/slices/abstracts/abstracts.thunks', () => ({
    sendConfirmationEmailThunk: Object.assign(
        jest.fn(() => ({ type: 'fulfilled', payload: { message: 'Email sent' } })),
        {
            fulfilled: { match: () => true },
        }
    ),
}))

jest.mock('react-hot-toast', () => ({
    success: jest.fn(),
    error: jest.fn(),
}))

/* -------------------- helpers -------------------- */

const mockItem = {
    id: '1',
    status: 'Under Review',
    isEmailSent: false,
    website: { name: 'Test Site', link: 'https://example.com/' },
    user: { id: 'u1', firstname: 'Creator', lastname: 'Doe', roles: ['Admin'] },
} as unknown as import('../../../../services/abstracts').AbstractItem

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
        const { useAppSelector } = jest.requireMock('../../../../store/hooks')
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

    it('does not render when item is null', () => {
        const { container } = render(
            <AbstractDetailsModal
                item={null}
                record={mockRecord}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )

        expect(container.firstChild).toBeNull()
    })

    it('does not render when record is null', () => {
        const { container } = render(
            <AbstractDetailsModal
                item={mockItem}
                record={null}
                modalStatus="Under Review"
                onClose={onClose}
                onUpdate={onUpdate}
                onStatusChange={onStatusChange}
            />
        )

        expect(container.firstChild).toBeNull()
    })
})
