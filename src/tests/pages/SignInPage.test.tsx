import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SignInPage from '../../pages/SignInPage'

describe('SignInPage', () => {
    const mockOnSignIn = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
    })

    it('renders sign in form', () => {
        render(<SignInPage onSignIn={mockOnSignIn} />)
        expect(screen.getByRole('heading', { name: /Sign in/i })).toBeInTheDocument()
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument()
    })

    it('fills inputs from localStorage on mount', () => {
        localStorage.setItem('rememberedEmail', 'saved@example.com')
        localStorage.setItem('rememberedPassword', 'savedpass')
        localStorage.setItem('deviceFingerprint', 'saved-device')

        render(<SignInPage onSignIn={mockOnSignIn} />)

        expect(screen.getByLabelText(/Email/i)).toHaveValue('saved@example.com')
        expect(screen.getByLabelText(/Password/i)).toHaveValue('savedpass')
    })

    it('handles form submission and saves credentials if "Remember me" is checked', async () => {
        render(<SignInPage onSignIn={mockOnSignIn} />)

        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'user@example.com' } })
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } })

        // Remember me is checked by default
        fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

        await waitFor(() => {
            expect(mockOnSignIn).toHaveBeenCalledWith({
                useremail: 'user@example.com',
                userpassword: 'password123',
                deviceid: '',
                remember: true
            })
            expect(localStorage.getItem('rememberedEmail')).toBe('user@example.com')
            expect(localStorage.getItem('rememberedPassword')).toBe('password123')
        })
    })

    it('clears localStorage if "Remember me" is unchecked on submission', async () => {
        localStorage.setItem('rememberedEmail', 'old@example.com')
        localStorage.setItem('rememberedPassword', 'oldpass')
        render(<SignInPage onSignIn={mockOnSignIn} />)

        const checkbox = screen.getByLabelText(/Remember me/i) as HTMLInputElement
        // Wait for it to be checked (from initial state or useEffect)
        await waitFor(() => {
            expect(screen.getByLabelText(/Email/i)).toHaveValue('old@example.com')
            expect(checkbox).toBeChecked()
        })

        // Toggle
        fireEvent.click(checkbox)
        await waitFor(() => expect(checkbox.checked).toBe(false))

        fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

        await waitFor(() => {
            expect(mockOnSignIn).toHaveBeenCalled()
        })

        expect(localStorage.getItem('rememberedEmail')).toBeNull()
        expect(localStorage.getItem('rememberedPassword')).toBeNull()
    })

    it('shows error message if provided', () => {
        render(<SignInPage onSignIn={mockOnSignIn} error="Invalid credentials" />)
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })

    it('shows "Signing in..." and disables button when loading', () => {
        render(<SignInPage onSignIn={mockOnSignIn} isLoading={true} />)
        const button = screen.getByRole('button', { name: /Signing in/i })
        expect(button).toBeDisabled()
    })
})
