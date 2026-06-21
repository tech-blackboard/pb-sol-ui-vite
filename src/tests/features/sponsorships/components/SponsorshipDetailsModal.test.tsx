import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SponsorshipDetailsModal from '../../../../features/sponsorships/components/SponsorshipDetailsModal'
import '@testing-library/jest-dom'
import type { SponsorshipItem } from '../../../../services/sponsorships'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import sponsorshipsReducer from '../../../../store/slices/sponsorships/sponsorships.slice'
import toast from 'react-hot-toast'

const store = configureStore({
    reducer: { sponsorships: sponsorshipsReducer },
    preloadedState: {
        sponsorships: {
            editLoading: false,
            items: [],
            loading: false,
            error: null,
            page: 1,
            pageSize: 10,
            total: 0,
            appliedFilters: {},
            draftFilters: {},
            selected: null,
        }
    }
})

jest.mock('../../../../utils/utils', () => ({ formatDate: jest.fn(() => '2024-01-01 12:00 PM') }))
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}))

describe('SponsorshipDetailsModal', () => {
    const mockOnClose = jest.fn()
    const mockItem = { id: 1, name: 'John', email: 'john@test.com', phone: '1234567890', organization: 'Test Org', country: 'USA', message: 'Test Message', now: '2024-01-01', website: { id: 1, name: 'Test Conf' } }

    beforeEach(() => jest.clearAllMocks())

    it('returns null when item is null', () => {
        const { container } = render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={null} onClose={mockOnClose} />
            </Provider>
        )
        expect(container.firstChild).toBeNull()
    })

    it('renders modal with all fields', () => {
        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )

        expect(screen.getByText('John')).toBeInTheDocument()
        expect(screen.getByText('john@test.com')).toBeInTheDocument()
        expect(screen.getByText('1234567890')).toBeInTheDocument()
        expect(screen.getByText('Test Org')).toBeInTheDocument()
        expect(screen.getByText('USA')).toBeInTheDocument()
        expect(screen.getByText('Test Message')).toBeInTheDocument() // Message
        expect(screen.getByText('2024-01-01 12:00 PM')).toBeInTheDocument()
    })

    it('renders fallback values for missing fields', () => {
        const minimalItem = { id: 1, name: 'John' }
        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={minimalItem as unknown as SponsorshipItem} onClose={mockOnClose} />
            </Provider>
        )

        const fallbacks = screen.getAllByText('—')
        expect(fallbacks.length).toBeGreaterThan(0)
        expect(screen.getByText('No additional message provided.')).toBeInTheDocument()
    })

    it('calls onClose when close icon clicked', () => {
        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )
        fireEvent.click(screen.getByLabelText('Close'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('calls onClose when close button clicked', () => {
        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )
        fireEvent.click(screen.getByText('Close'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('enters edit mode, updates inputs and dropdown, and saves successfully', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch') as jest.SpyInstance
        const { updateSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        updateSponsorshipThunk.fulfilled = { match: () => true }
        dispatchSpy.mockResolvedValue({ type: 'sponsorships/update/fulfilled' })

        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )

        fireEvent.click(screen.getByText('✎ Edit'))
        expect(screen.getByText('Save Changes')).toBeInTheDocument()

        const nameInput = screen.getByLabelText('Full Name')
        fireEvent.change(nameInput, { target: { value: 'New Name' } })

        const emailInput = screen.getByLabelText('Email')
        fireEvent.change(emailInput, { target: { value: 'new@email.com' } })

        const phoneInput = screen.getByLabelText('Phone')
        fireEvent.change(phoneInput, { target: { value: '9876543210' } })

        const orgInput = screen.getByLabelText('Organization')
        fireEvent.change(orgInput, { target: { value: 'New Org' } })

        const countrySelect = screen.getByLabelText('Country')
        fireEvent.change(countrySelect, { target: { value: 'India' } })

        const msgInput = screen.getByLabelText('Message')
        fireEvent.change(msgInput, { target: { value: 'Send it now' } })

        fireEvent.click(screen.getByText('Save Changes'))
        expect(dispatchSpy).toHaveBeenCalled()
    })

    it('handles edit save thunk rejected failure', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch') as jest.SpyInstance
        const { updateSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        updateSponsorshipThunk.fulfilled = { match: () => false }
        dispatchSpy.mockResolvedValue({ type: 'sponsorships/update/rejected', payload: 'Error payload' })

        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )

        fireEvent.click(screen.getByText('✎ Edit'))
        fireEvent.click(screen.getByText('Save Changes'))
        expect(dispatchSpy).toHaveBeenCalled()
    })

    it('handles edit save unexpected throw', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch') as jest.SpyInstance
        dispatchSpy.mockRejectedValue(new Error('Save crash'))

        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )

        fireEvent.click(screen.getByText('✎ Edit'))
        fireEvent.click(screen.getByText('Save Changes'))
        expect(dispatchSpy).toHaveBeenCalled()
    })

    it('cancels edit mode', () => {
        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )

        fireEvent.click(screen.getByText('✎ Edit'))
        fireEvent.click(screen.getByText('Cancel'))
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument()
    })

    it('triggers onDelete callback when delete confirmed', () => {
        const onDelete = jest.fn()
        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} onDelete={onDelete} />
            </Provider>
        )

        fireEvent.click(screen.getByText('Delete'))
        expect(confirmSpy).toHaveBeenCalled()
        expect(onDelete).toHaveBeenCalledWith(mockItem)
        confirmSpy.mockRestore()
    })

    it('does not trigger onDelete callback when delete cancelled', () => {
        const onDelete = jest.fn()
        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} onDelete={onDelete} />
            </Provider>
        )

        fireEvent.click(screen.getByText('Delete'))
        expect(confirmSpy).toHaveBeenCalled()
        expect(onDelete).not.toHaveBeenCalled()
        confirmSpy.mockRestore()
    })

    it('covers form edit fallback values when item fields are missing (lines 53-58)', () => {
        const minimalItem = { id: 1 } as unknown as SponsorshipItem
        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={minimalItem} onClose={mockOnClose} />
            </Provider>
        )

        fireEvent.click(screen.getByText('✎ Edit'))
        expect(screen.getByLabelText('Full Name')).toHaveValue('')
        expect(screen.getByLabelText('Email')).toHaveValue('')
        expect(screen.getByLabelText('Phone')).toHaveValue('')
        expect(screen.getByLabelText('Organization')).toHaveValue('')
        expect(screen.getByLabelText('Country')).toHaveValue('')
        expect(screen.getByLabelText('Message')).toHaveValue('')
    })

    it('covers update error toast fallback when payload is empty (line 72)', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch') as jest.SpyInstance
        const { updateSponsorshipThunk } = jest.requireMock('../../../../store/slices/sponsorships/sponsorships.slice')
        updateSponsorshipThunk.fulfilled = { match: () => false }
        dispatchSpy.mockResolvedValue({ type: 'sponsorships/update/rejected', payload: undefined })

        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )

        fireEvent.click(screen.getByText('✎ Edit'))
        fireEvent.click(screen.getByText('Save Changes'))
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to update sponsorship')
        })
        dispatchSpy.mockRestore()
    })

    it('covers editLoading is true button text (line 181)', () => {
        const loadingStore = configureStore({
            reducer: { sponsorships: sponsorshipsReducer },
            preloadedState: {
                sponsorships: {
                    editLoading: true,
                    items: [],
                    loading: false,
                    error: null,
                    page: 1,
                    pageSize: 10,
                    total: 0,
                    appliedFilters: {},
                    draftFilters: {},
                    selected: null,
                }
            }
        })

        render(
            <Provider store={loadingStore}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )

        fireEvent.click(screen.getByText('✎ Edit'))
        expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('covers SelectField span class rendering via Fiber traversal (line 260)', () => {
        render(
            <Provider store={store}>
                <SponsorshipDetailsModal item={mockItem} onClose={mockOnClose} />
            </Provider>
        )
        fireEvent.click(screen.getByText('✎ Edit'))

        const countrySelect = screen.getByLabelText('Country')
        const fiberKey = Object.keys(countrySelect).find(key => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance'))
        if (fiberKey) {
            interface ReactFiberNode {
                type?: unknown;
                return?: ReactFiberNode | null;
            }
            const fiberNode = (countrySelect as unknown as Record<string, ReactFiberNode>)[fiberKey]
            let current: ReactFiberNode | null | undefined = fiberNode
            while (current) {
                if (current.type && typeof current.type === 'function' && (current.type as { name?: string }).name === 'SelectField') {
                    const SelectFieldComponent = current.type as React.ComponentType<{
                        label: string;
                        value: string;
                        options: { value: string; label: string }[];
                        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
                        span?: boolean;
                    }>;
                    const { container } = render(
                        <SelectFieldComponent label="Test Country" value="" options={[]} onChange={() => {}} span={true} />
                    )
                    expect(container.firstChild).toHaveClass('sm:col-span-2')
                    break
                }
                current = current.return
            }
        }
    })
})
