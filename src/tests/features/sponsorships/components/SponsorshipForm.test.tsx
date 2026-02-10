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
        await waitFor(() => expect(toast.error).toHaveBeenCalled())
    })

    it('calls onClose when cancel clicked', async () => {
        renderForm()
        await screen.findByText('Add Sponsorship Inquiry')
        fireEvent.click(screen.getByText('Cancel'))
        expect(mockOnClose).toHaveBeenCalled()
    })
})
