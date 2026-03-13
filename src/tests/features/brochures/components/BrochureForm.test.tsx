import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BrochureForm from '../../../../features/brochures/components/BrochureForm'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import brochuresReducer from '../../../../store/slices/brochures/brochures.slice'

jest.mock('../../../../services/sourcedb', () => ({
    listWebsites: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('../../../../store/hooks', () => ({
    useAppDispatch: jest.fn(),
    useAppSelector: jest.fn(),
}))

jest.mock('../../../../store/slices/brochures/brochures.slice', () => {
    const actual = jest.requireActual('../../../../store/slices/brochures/brochures.slice')
    return {
        ...actual,
        createBrochureThunk: Object.assign(jest.fn(), {
            fulfilled: { match: (action: any) => action.type === 'brochures/create/fulfilled' },
            rejected: { match: (action: any) => action.type === 'brochures/create/rejected' },
        }),
    }
})

import { listWebsites, type SourceWebsite } from '../../../../services/sourcedb'
import toast from 'react-hot-toast'

const createMockStore = () => configureStore({
    reducer: { brochures: brochuresReducer },
})

describe('BrochureForm', () => {
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
        return render(
            <Provider store={store}>
                <BrochureForm onClose={mockOnClose} onSuccess={mockOnSuccess} {...props} />
            </Provider>
        )
    }

    it('renders the form', async () => {
        renderForm()
        expect(await screen.findByText('Request Brochure')).toBeInTheDocument()
    })

    it('loads websites', async () => {
        renderForm()
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())
    })

    it('shows validation errors on empty submit', async () => {
        renderForm()
        await screen.findByText('Request Brochure')
        fireEvent.click(screen.getByText('Submit Now'))
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please fill all required fields correctly'))
    })

    it('calls onClose when cancel clicked', async () => {
        renderForm()
        await screen.findByText('Request Brochure')
        fireEvent.click(screen.getByText('Cancel'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('updates form fields', async () => {
        renderForm()
        await screen.findByText('Request Brochure')

        const nameInput = screen.getByLabelText('Name')
        fireEvent.change(nameInput, { target: { value: 'John' } })
        expect((nameInput as HTMLInputElement).value).toBe('John')
    })

    it('successfully submits the form', async () => {
        const mockDispatch = jest.fn().mockResolvedValue({
            type: 'brochures/create/fulfilled',
            payload: {}
        })
        const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
        useAppDispatch.mockReturnValue(mockDispatch)

        renderForm()
        await screen.findByText('Request Brochure')
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())

        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John Doe' } })
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
        fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '1234567890' } })
        fireEvent.change(screen.getByLabelText('Select Country'), { target: { value: 'United States' } })
        fireEvent.change(screen.getByLabelText('Website/Conference*'), { target: { value: '1' } })
        fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'Help' } })

        fireEvent.click(screen.getByText('Submit Now'))

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Brochure request submitted successfully')
            expect(mockOnSuccess).toHaveBeenCalled()
            expect(mockOnClose).toHaveBeenCalled()
        })
    })

    it('handles submission error with payload', async () => {
        const mockDispatch = jest.fn().mockResolvedValue({
            type: 'brochures/create/rejected',
            payload: 'Server Error'
        })
        const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
        useAppDispatch.mockReturnValue(mockDispatch)

        renderForm()
        await screen.findByText('Request Brochure')
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())
        
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } })
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
        fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '1234567890' } })
        fireEvent.change(screen.getByLabelText('Select Country'), { target: { value: 'United States' } })
        fireEvent.change(screen.getByLabelText('Website/Conference*'), { target: { value: '1' } })
        fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'Help' } })

        fireEvent.click(screen.getByText('Submit Now'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Server Error')
        })
    })

    it('handles submission error with default message', async () => {
        const mockDispatch = jest.fn().mockResolvedValue({
            type: 'brochures/create/rejected',
            payload: null
        })
        const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
        useAppDispatch.mockReturnValue(mockDispatch)

        renderForm()
        await screen.findByText('Request Brochure')
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())
        
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } })
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
        fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '1234567890' } })
        fireEvent.change(screen.getByLabelText('Select Country'), { target: { value: 'United States' } })
        fireEvent.change(screen.getByLabelText('Website/Conference*'), { target: { value: '1' } })
        fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'Help' } })

        fireEvent.click(screen.getByText('Submit Now'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to submit brochure request')
        })
    })

    it('handles unexpected catch block error', async () => {
        const mockDispatch = jest.fn().mockImplementation(() => { throw new Error('Unexpected') })
        const { useAppDispatch } = jest.requireMock('../../../../store/hooks')
        useAppDispatch.mockReturnValue(mockDispatch)

        renderForm()
        await screen.findByText('Request Brochure')
        await waitFor(() => expect(listWebsites).toHaveBeenCalled())

        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } })
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@test.com' } })
        fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '1234567890' } })
        fireEvent.change(screen.getByLabelText('Select Country'), { target: { value: 'United States' } })
        fireEvent.change(screen.getByLabelText('Website/Conference*'), { target: { value: '1' } })
        fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'Help' } })

        fireEvent.click(screen.getByText('Submit Now'))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('An error occurred')
        })
    })

    it('clears error on field change', async () => {
        renderForm()
        fireEvent.click(screen.getByText('Submit Now'))
        expect(await screen.findByText('Name is required')).toBeInTheDocument()
        
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } })
        expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })

    it('handles website load error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        ;(listWebsites as jest.Mock).mockRejectedValue(new Error())
        renderForm()
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to load website options')
        })
        consoleSpy.mockRestore()
    })

    it('handles unmounting during load', async () => {
        let resolveWs!: (value: SourceWebsite[]) => void
        const p = new Promise<SourceWebsite[]>(r => resolveWs = r)
        ;(listWebsites as jest.Mock).mockReturnValue(p)
        const { unmount } = renderForm()
        unmount()
        resolveWs([])
        await new Promise(r => setTimeout(r, 0))
    })
})
