import {
    searchRegistrations,
    getRegistrationById,
    deleteRegistration,
    createRegistration,
    type RegistrationItem,
} from '../../services/registrations'
import { api } from '../../lib/api'

jest.mock('../../lib/api', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn(),
    },
}))

describe('registrations service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
    })

    const mockRegistration: RegistrationItem = {
        id: 1,
        name: 'John Doe',
        email: 'john@test.com',
        phone: '1234567890',
        institution: 'Test University',
        country: 'USA',
        presentation: 'Oral',
        participants: '2',
        regtype: 'Full',
        accomm: 'Yes',
    }

    describe('searchRegistrations', () => {
        it('returns registration items with pagination', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [mockRegistration],
                    total: 1,
                    page: 1,
                    limit: 10,
                },
            })

            const result = await searchRegistrations({ page: 1, limit: 10 })

            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('/search'),
                expect.objectContaining({
                    params: { page: 1, limit: 10 },
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
            expect(result.items).toEqual([mockRegistration])
            expect(result.total).toBe(1)
        })

        it('handles data property fallback', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {
                    data: [mockRegistration],
                    total: 1,
                },
            })

            const result = await searchRegistrations()
            expect(result.items).toEqual([mockRegistration])
        })

        it('handles empty results', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: { items: [], total: 0 },
            })

            const result = await searchRegistrations()
            expect(result.items).toEqual([])
            expect(result.total).toBe(0)
        })

        it('applies search filters', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: { items: [], total: 0 },
            })

            await searchRegistrations({ search: 'John', country: 'USA' })

            expect(api.get).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    params: expect.objectContaining({ search: 'John', country: 'USA' }),
                })
            )
        })
    })

    describe('getRegistrationById', () => {
        it('fetches single registration', async () => {
            (api.get as jest.Mock).mockResolvedValue({ data: mockRegistration })

            const result = await getRegistrationById(1)

            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('/1'),
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
            expect(result).toEqual(mockRegistration)
        })

        it('handles string ID', async () => {
            (api.get as jest.Mock).mockResolvedValue({ data: mockRegistration })

            await getRegistrationById('123')

            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('/123'),
                expect.any(Object)
            )
        })
    })

    describe('deleteRegistration', () => {
        it('deletes registration by ID', async () => {
            (api.delete as jest.Mock).mockResolvedValue({})

            await deleteRegistration(1)

            expect(api.delete).toHaveBeenCalledWith(
                expect.stringContaining('/1'),
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
        })

        it('handles string ID', async () => {
            (api.delete as jest.Mock).mockResolvedValue({})

            await deleteRegistration('abc-123')

            expect(api.delete).toHaveBeenCalledWith(
                expect.stringContaining('/abc-123'),
                expect.any(Object)
            )
        })
    })

    describe('createRegistration', () => {
        it('creates new registration', async () => {
            const newRegistration = { name: 'Jane Doe', email: 'jane@test.com' }
                ; (api.post as jest.Mock).mockResolvedValue({ data: mockRegistration })

            const result = await createRegistration(newRegistration)

            expect(api.post).toHaveBeenCalledWith(
                expect.any(String),
                newRegistration,
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
            expect(result).toEqual(mockRegistration)
        })

        it('includes auth headers when token exists', async () => {
            localStorage.setItem('accessToken', 'test-token')
                ; (api.post as jest.Mock).mockResolvedValue({ data: mockRegistration })

            await createRegistration({ name: 'Test' })

            expect(api.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                expect.objectContaining({
                    headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
                })
            )
        })
    })
})
