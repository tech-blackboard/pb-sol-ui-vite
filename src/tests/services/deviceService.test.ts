import {
    getDevicesByUser,
    getAllDevices,
    approveDevice,
    revokeDevice,
    forceLogoutDevice,
    type Device
} from '../../services/deviceService'
import { api } from '../../lib/api'

jest.mock('../../lib/api', () => ({
    api: {
        get: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
    },
}))

describe('deviceService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
        sessionStorage.clear()
    })

    const mockDevice: Device = {
        id: '1',
        userId: 1,
        deviceId: 'device-123',
        isAllowed: true,
        createdAt: '2023-01-01',
    }

    it('getDevicesByUser calls correct endpoint and returns data', async () => {
        ; (api.get as jest.Mock).mockResolvedValue({ data: { data: [mockDevice] } })

        const result = await getDevicesByUser(1)
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/user/1'), expect.any(Object))
        expect(result).toEqual([mockDevice])
    })

    it('getAllDevices handles pagination params', async () => {
        ; (api.get as jest.Mock).mockResolvedValue({ data: { data: [mockDevice], count: 1 } })

        const result = await getAllDevices(2, 20)
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/all'), expect.objectContaining({
            params: { page: 2, limit: 20 }
        }))
        expect(result.data).toEqual([mockDevice])
    })

    it('approveDevice calls correct endpoint', async () => {
        ; (api.patch as jest.Mock).mockResolvedValue({ data: { success: true, data: mockDevice } })

        const result = await approveDevice('device-123')
        expect(api.patch).toHaveBeenCalledWith(expect.stringContaining('/device-123/approve'), {}, expect.any(Object))
        expect(result).toEqual(mockDevice)
    })

    it('revokeDevice calls correct endpoint', async () => {
        ; (api.patch as jest.Mock).mockResolvedValue({ data: { success: true, data: mockDevice } })

        const result = await revokeDevice('device-123')
        expect(api.patch).toHaveBeenCalledWith(expect.stringContaining('/device-123/revoke'), {}, expect.any(Object))
        expect(result).toEqual(mockDevice)
    })

    it('forceLogoutDevice calls correct endpoint', async () => {
        ; (api.delete as jest.Mock).mockResolvedValue({})

        await forceLogoutDevice('device-123')
        expect(api.delete).toHaveBeenCalledWith(expect.stringContaining('/device-123/device-logout'), expect.any(Object))
    })

    describe('getAuthHeaders', () => {
        it('includes Authorization header if token exists in localStorage', async () => {
            localStorage.setItem('accessToken', 'test-token')
                ; (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } })

            await getAllDevices()
            const callConfig = (api.get as jest.Mock).mock.calls[0][1]
            expect(callConfig.headers.Authorization).toBe('Bearer test-token')
        })

        it('includes Authorization header if token exists in sessionStorage', async () => {
            sessionStorage.setItem('accessToken', 'session-token')
                ; (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } })

            await getAllDevices()
            const callConfig = (api.get as jest.Mock).mock.calls[0][1]
            expect(callConfig.headers.Authorization).toBe('Bearer session-token')
        })

        it('does not include Authorization header if no token exists', async () => {
            ; (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } })

            await getAllDevices()
            const callConfig = (api.get as jest.Mock).mock.calls[0][1]
            expect(callConfig.headers.Authorization).toBeUndefined()
        })
    })
})
