import {
    searchAccRegistrations,
    deleteAccRegistration,
    createAccRegistration,
    type AccRegistrationItem,
} from '../../services/accRegistrations'
import { api } from '../../lib/api'

jest.mock('../../lib/api', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn(),
        patch: jest.fn(),
    },
}))

describe('accRegistrations service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
    })

    const mockAccRegistration: AccRegistrationItem = {
        id: 1,
        name: 'John Doe',
        email: 'john@test.com',
        phone: '1234567890',
        country: 'USA',
        checkin: '2024-01-01',
        checkout: '2024-01-05',
        nights: '4',
        now: '2024-01-01',
    }

    describe('searchAccRegistrations', () => {
        it('returns accommodation registration items with pagination', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [mockAccRegistration],
                    total: 1,
                    page: 1,
                    limit: 10,
                },
            })

            const result = await searchAccRegistrations({ page: 1, limit: 10 })

            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('/search'),
                expect.objectContaining({
                    params: { page: 1, limit: 10 },
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
            expect(result.items).toEqual([mockAccRegistration])
            expect(result.total).toBe(1)
        })

        it('handles data property fallback', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {
                    data: [mockAccRegistration],
                    total: 1,
                },
            })

            const result = await searchAccRegistrations()
            expect(result.items).toEqual([mockAccRegistration])
        })

        it('handles empty items array', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {},
            })

            const result = await searchAccRegistrations()
            expect(result.items).toEqual([])
            expect(result.total).toBe(0)
        })

        it('uses param defaults when response missing values', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: { items: [mockAccRegistration] },
            })

            const result = await searchAccRegistrations({ page: 3, limit: 25 })
            expect(result.page).toBe(3)
            expect(result.limit).toBe(25)
        })
    })

    describe('deleteAccRegistration', () => {
        it('deletes accommodation registration by numeric ID', async () => {
            (api.delete as jest.Mock).mockResolvedValue({})

            await deleteAccRegistration(1)

            expect(api.delete).toHaveBeenCalledWith(
                expect.stringContaining('/1'),
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
        })

        it('deletes accommodation registration by string ID', async () => {
            (api.delete as jest.Mock).mockResolvedValue({})

            await deleteAccRegistration('acc-123')

            expect(api.delete).toHaveBeenCalledWith(
                expect.stringContaining('/acc-123'),
                expect.any(Object)
            )
        })
    })

    describe('createAccRegistration', () => {
        it('creates new accommodation registration', async () => {
            const newAccReg = {
                name: 'Jane',
                email: 'jane@test.com',
                phone: '9876543210',
                country: 'UK',
                checkin: '2024-02-01',
                checkout: '2024-02-03',
                nights: '2',
                message: 'Need accommodation',
                website_id: 1,
            }
                ; (api.post as jest.Mock).mockResolvedValue({ data: mockAccRegistration })

            const result = await createAccRegistration(newAccReg)

            expect(api.post).toHaveBeenCalledWith(
                expect.any(String),
                newAccReg,
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
            expect(result).toEqual(mockAccRegistration)
        })

        it('includes auth headers when token exists', async () => {
            localStorage.setItem('accessToken', 'test-token')
                ; (api.post as jest.Mock).mockResolvedValue({ data: mockAccRegistration })

            await createAccRegistration({ name: 'Test' })

            expect(api.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                expect.objectContaining({
                    headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
                })
            )
        })

        it('handles response with nested data property', async () => {
            const newAccReg = { name: 'Test', email: 'test@test.com' }
                ; (api.post as jest.Mock).mockResolvedValue({
                    data: mockAccRegistration,
                })

            const result = await createAccRegistration(newAccReg)
            expect(result).toEqual(mockAccRegistration)
        })
    })

    describe('updateAccRegistration', () => {
        it('updates accommodation registration by ID', async () => {
            (api.patch as jest.Mock).mockResolvedValue({ data: mockAccRegistration })

            const result = await import('../../services/accRegistrations').then(m => m.updateAccRegistration(1, { name: 'Updated Name' }))

            expect(api.patch).toHaveBeenCalledWith(
                expect.stringContaining('/1'),
                { name: 'Updated Name' },
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
            expect(result).toEqual(mockAccRegistration)
        })
    })
})
