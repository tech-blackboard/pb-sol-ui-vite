import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SponsorshipForm from '../../../../features/sponsorships/components/SponsorshipForm'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import sponsorshipsReducer from '../../../../store/slices/sponsorships/sponsorships.slice'

jest.mock('../../../../services/sourcedb', () => ({ listWebsites: jest.fn() }))
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }))

import { listWebsites } from '../../../../services/sourcedb'
import toast from 'react-hot-toast'

const createMockStore = () => configureStore({ reducer: { sponsorships: sponsorshipsReducer } })

describe('SponsorshipForm', () => {
    const mockOnClose = jest.fn()
    const mockOnSuccess = jest.fn()

    beforeAll(() => {
        Element.prototype.scrollTo = jest.fn()
    })

    beforeEach(() => {
        jest.clearAllMocks()
            ; (listWebsites as jest.Mock).mockResolvedValue([{ id: 1, name: 'Test Conf' }])
    })

    const renderForm = (props = {}) => {
        const store = createMockStore()
        return render(<Provider store={store}><SponsorshipForm onClose={mockOnClose} onSuccess={mockOnSuccess} {...props} /></Provider>)
    }

    it('renders the form', async () => {
        renderForm()
        expect(await screen.findByText('Add Sponsorship Inquiry')).toBeInTheDocument()
    })

    it('loads websites', async () => {
        renderForm()
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())
    })

    it('shows validation errors on empty submit', async () => {
        renderForm()
        await screen.findByText('Add Sponsorship Inquiry')
        fireEvent.click(screen.getByText('Submit Now'))
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please fill all required fields'))
    })

    it('successfully submits the form', async () => {
        const store = createMockStore()
        const mockDispatch = jest.fn().mockResolvedValue({
            type: 'sponsorships/create/fulfilled'
        })
        const hooks = await import('../../../../store/hooks')
        jest.spyOn(hooks, 'useAppDispatch').mockReturnValue(mockDispatch)

        render(
            <Provider store={store}>
                <SponsorshipForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
            </Provider>
        )

        fireEvent.change(screen.getByLabelText('Name*'), { target: { value: 'Jane Doe' } })
        fireEvent.change(screen.getByLabelText('Email*'), { target: { value: 'jane@test.com' } })
        fireEvent.change(screen.getByLabelText('Phone*'), { target: { value: '0987654321' } })
        fireEvent.change(screen.getByLabelText('Country*'), { target: { value: 'India' } })
        fireEvent.change(screen.getByLabelText('Organization / Institution*'), { target: { value: 'Test Org' } })

        await waitFor(() => expect(listWebsites).toHaveBeenCalled())
        fireEvent.change(screen.getByLabelText('Website / Conference*'), { target: { value: '1' } })

        fireEvent.click(screen.getByText('Submit Now'))

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Sponsorship inquiry added successfully')
            expect(mockOnSuccess).toHaveBeenCalled()
            expect(mockOnClose).toHaveBeenCalled()
        })
    })

    it('handles submission error', async () => {
        const errorMessage = 'Failed to add'
        const mockDispatch = jest.fn().mockResolvedValue({
            type: 'sponsorships/create/rejected',
            payload: errorMessage
        })
        const hooks = await import('../../../../store/hooks')
        jest.spyOn(hooks, 'useAppDispatch').mockReturnValue(mockDispatch)

        renderForm()

        fireEvent.change(screen.getByLabelText('Name*'), { target: { value: 'Jane Doe' } })
        fireEvent.change(screen.getByLabelText('Email*'), { target: { value: 'jane@test.com' } })
        fireEvent.change(screen.getByLabelText('Phone*'), { target: { value: '0987654321' } })
        fireEvent.change(screen.getByLabelText('Country*'), { target: { value: 'India' } })
        fireEvent.change(screen.getByLabelText('Organization / Institution*'), { target: { value: 'Test Org' } })
        fireEvent.change(screen.getByLabelText('Website / Conference*'), { target: { value: '1' } })

        fireEvent.click(screen.getByText('Submit Now'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(errorMessage)
            expect(screen.getByText(errorMessage)).toBeInTheDocument() // Via AlertBanner
        })
    })

    it('calls onClose when cancel clicked', async () => {
        renderForm()
        await screen.findByText('Add Sponsorship Inquiry')
        fireEvent.click(screen.getByText('Cancel'))
        expect(mockOnClose).toHaveBeenCalled()
    })
})
