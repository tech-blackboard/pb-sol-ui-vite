import { login, logout, refreshToken } from '../../services/auth'
import { publicApi } from '../../lib/publicApi'
import { api } from '../../lib/api'
import { getDeviceFingerprint } from '../../services/deviceFingerprint'
import { getBrowserAndOS } from '../../utils/deviceInfo'

jest.mock('../../lib/publicApi', () => ({
    publicApi: {
        post: jest.fn(),
    },
}))

jest.mock('../../lib/api', () => ({
    api: {
        post: jest.fn(),
    },
}))

jest.mock('../../services/deviceFingerprint', () => ({
    getDeviceFingerprint: jest.fn(),
}))

jest.mock('../../utils/deviceInfo', () => ({
    getBrowserAndOS: jest.fn(),
}))

describe('auth service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
    })

    describe('login', () => {
        it('calls publicApi.post with correct parameters including fingerprint and device info', async () => {
            ; (getDeviceFingerprint as jest.Mock).mockResolvedValue('test-fingerprint')
                ; (getBrowserAndOS as jest.Mock).mockReturnValue({ browser: 'Chrome', os: 'Windows' })
                ; (publicApi.post as jest.Mock).mockResolvedValue({ data: { accessToken: 'token123' } })

            const credentials = { useremail: 'test@example.com', userpassword: 'password123', deviceId: 'initial' }
            const response = await login(credentials)

            expect(getDeviceFingerprint).toHaveBeenCalled()
            expect(getBrowserAndOS).toHaveBeenCalled()
            expect(publicApi.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    useremail: 'test@example.com',
                    userpassword: 'password123',
                    deviceId: 'test-fingerprint',
                    browser: 'Chrome',
                    os: 'Windows',
                }),
                expect.any(Object)
            )
            expect(response.accessToken).toBe('token123')
        })
    })

    describe('logout', () => {
        it('calls api.post to logout endpoint', async () => {
            ; (api.post as jest.Mock).mockResolvedValue({})
            await logout()
            expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/logout'), null)
        })
    })

    describe('refreshToken', () => {
        it('handles "access_token" in response and updates localStorage', async () => {
            ; (api.post as jest.Mock).mockResolvedValue({ data: { access_token: 'new-token' } })

            const token = await refreshToken()
            expect(token).toBe('new-token')
            expect(localStorage.getItem('accessToken')).toBe('new-token')
        })

        it('handles "accessToken" in response', async () => {
            ; (api.post as jest.Mock).mockResolvedValue({ data: { accessToken: 'new-token-2' } })

            const token = await refreshToken()
            expect(token).toBe('new-token-2')
            expect(localStorage.getItem('accessToken')).toBe('new-token-2')
        })

        it('handles "token" in response', async () => {
            ; (api.post as jest.Mock).mockResolvedValue({ data: { token: 'new-token-3' } })

            const token = await refreshToken()
            expect(token).toBe('new-token-3')
            expect(localStorage.getItem('accessToken')).toBe('new-token-3')
        })

        it('returns undefined if no token is found in response', async () => {
            ; (api.post as jest.Mock).mockResolvedValue({ data: {} })

            const token = await refreshToken()
            expect(token).toBeUndefined()
            expect(localStorage.getItem('accessToken')).toBeNull()
        })
    })
})
