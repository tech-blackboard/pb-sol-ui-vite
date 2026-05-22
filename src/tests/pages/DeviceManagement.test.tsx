import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import DeviceManagement from '../../pages/DeviceManagement'
import * as deviceService from '../../services/deviceService'
import toast from 'react-hot-toast'

jest.mock('../../services/deviceService')
jest.mock('react-hot-toast')

describe('DeviceManagement Page', () => {
    const mockDevices: deviceService.Device[] = [
        {
            id: '1',
            userId: 1,
            deviceId: 'dev-1-long-string-id',
            browser: 'Chrome',
            os: 'Windows',
            isAllowed: false,
            createdAt: '2023-01-01',
            user: { id: 1, useremail: 'user1@test.com', firstname: 'John', lastname: 'Doe' }
        },
        {
            id: '2',
            userId: 2,
            deviceId: 'dev-2-long-string-id',
            browser: 'Safari',
            os: 'macOS',
            isAllowed: true,
            createdAt: '2023-01-01',
            user: { id: 2, useremail: 'user2@test.com', firstname: 'Jane', lastname: 'Smith' }
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
            ; (deviceService.getAllDevices as jest.Mock).mockResolvedValue({
                data: mockDevices,
                pagination: { total: 2, totalPages: 1, page: 1, limit: 50 },
                success: true
            })
    })

    it('renders loading state initially', async () => {
        render(<DeviceManagement />)
        expect(screen.getByText(/Loading devices/i)).toBeInTheDocument()
        await waitFor(() => expect(screen.queryByText(/Loading devices/i)).not.toBeInTheDocument())
    })

    it('renders device list and user info', async () => {
        render(<DeviceManagement />)
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument()
            expect(screen.getByText('Jane Smith')).toBeInTheDocument()
            expect(screen.getByText('user1@test.com')).toBeInTheDocument()
            expect(screen.getByText('Pending')).toBeInTheDocument()
            expect(screen.getByText('Approved')).toBeInTheDocument()
        })
    })

    it('handles device approval', async () => {
        render(<DeviceManagement />)
        await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument())

        fireEvent.click(screen.getByText('Approve'))

        await waitFor(() => {
            expect(deviceService.approveDevice).toHaveBeenCalledWith('1')
            expect(toast.success).toHaveBeenCalledWith('Device approved successfully')
        })
    })

    it('handles device revocation', async () => {
        render(<DeviceManagement />)
        await waitFor(() => expect(screen.getByTitle('Revoke')).toBeInTheDocument())

        fireEvent.click(screen.getByTitle('Revoke'))

        await waitFor(() => {
            expect(deviceService.revokeDevice).toHaveBeenCalledWith('2')
            expect(toast.success).toHaveBeenCalledWith('Device revoked successfully')
        })
    })

    it('handles device deletion through confirmation modal', async () => {
        render(<DeviceManagement />)
        await waitFor(() => expect(screen.getAllByTitle('Delete')[0]).toBeInTheDocument())

        // Click delete button in row
        const deleteButtons = screen.getAllByTitle('Delete')
        fireEvent.click(deleteButtons[0])

        // Verify modal appears
        expect(screen.getByText('Delete Device?')).toBeInTheDocument()

        // Confirm delete in modal
        const modal = screen.getByText('Delete Device?').closest('div')!
        const confirmButton = within(modal).getByRole('button', { name: /^Delete$/ })
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(deviceService.forceLogoutDevice).toHaveBeenCalledWith('1')
            expect(toast.success).toHaveBeenCalledWith('Device deleted successfully')
            expect(screen.queryByText('Delete Device?')).not.toBeInTheDocument()
        })
    })

    it('handles pagination navigation', async () => {
        ; (deviceService.getAllDevices as jest.Mock).mockResolvedValue({
            data: mockDevices,
            pagination: { total: 100, totalPages: 2, page: 1, limit: 50 },
            success: true
        })

        render(<DeviceManagement />)
        await waitFor(() => expect(screen.getByText('Next')).toBeInTheDocument())

        fireEvent.click(screen.getByText('Next'))

        await waitFor(() => {
            expect(deviceService.getAllDevices).toHaveBeenCalledWith(2, 50)
        })
    })

    it('shows error toast on API failure', async () => {
        ; (deviceService.getAllDevices as jest.Mock).mockRejectedValue({
            response: { data: { message: 'Network error' } }
        })

        render(<DeviceManagement />)

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Network error')
        })
    })

    it('handles error in handleApprove (lines 46-48)', async () => {
        ; (deviceService.approveDevice as jest.Mock).mockRejectedValue({
            response: { data: { message: 'Approve failed' } }
        })
        render(<DeviceManagement />)
        await waitFor(() => expect(screen.getByText('Approve')).toBeInTheDocument())
        
        fireEvent.click(screen.getByText('Approve'))
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Approve failed')
        })
    })

    it('handles error in handleRevoke (lines 57-59)', async () => {
        ; (deviceService.revokeDevice as jest.Mock).mockRejectedValue({
            response: { data: { message: 'Revoke failed' } }
        })
        render(<DeviceManagement />)
        await waitFor(() => expect(screen.getByTitle('Revoke')).toBeInTheDocument())
        
        fireEvent.click(screen.getByTitle('Revoke'))
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Revoke failed')
        })
    })

    it('handles error in handleConfirmDelete (lines 74-75)', async () => {
        ; (deviceService.forceLogoutDevice as jest.Mock).mockRejectedValue({
            response: { data: { message: 'Delete failed' } }
        })
        render(<DeviceManagement />)
        await waitFor(() => expect(screen.getAllByTitle('Delete')[0]).toBeInTheDocument())
        
        fireEvent.click(screen.getAllByTitle('Delete')[0])
        const modal = screen.getByText('Delete Device?').closest('div')!
        const confirmButton = within(modal).getByRole('button', { name: /^Delete$/ })
        fireEvent.click(confirmButton)
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Delete failed')
        })
    })

    it('handles error fallbacks with generic message (lines 30, 47, 58, 75)', async () => {
        // Mock rejection without response data message
        const genericError = new Error('Generic failure')
        ;(deviceService.getAllDevices as jest.Mock).mockRejectedValue(genericError)
        ;(deviceService.approveDevice as jest.Mock).mockRejectedValue(genericError)
        ;(deviceService.revokeDevice as jest.Mock).mockRejectedValue(genericError)
        ;(deviceService.forceLogoutDevice as jest.Mock).mockRejectedValue(genericError)

        render(<DeviceManagement />)
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load devices'))

        // Reset and test approve fallback
        ;(deviceService.getAllDevices as jest.Mock).mockResolvedValue({ data: mockDevices, success: true })
        render(<DeviceManagement />)
        const approveBtn = await screen.findByText('Approve')
        fireEvent.click(approveBtn)
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to approve device'))
    })

    it('covers browser/OS unknown and lastUsedAt Never fallbacks (lines 148, 151, 166)', async () => {
        const unknownDevices = [
            { ...mockDevices[0], browser: null, os: '', lastUsedAt: null }
        ]
        ;(deviceService.getAllDevices as jest.Mock).mockResolvedValue({ data: unknownDevices, success: true })
        
        render(<DeviceManagement />)
        await waitFor(() => {
            expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0)
            expect(screen.getByText('Never')).toBeInTheDocument()
        })
    })
})
