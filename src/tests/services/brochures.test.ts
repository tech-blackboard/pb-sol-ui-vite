import {
    searchBrochures,
    createBrochure,
    deleteBrochure,
    type BrochureItem,
} from '../../services/brochures'
import { api } from '../../lib/api'

jest.mock('../../lib/api', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn(),
    },
}))

describe('brochures service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
    })

    const mockBrochure: BrochureItem = {
        id: 1,
        name: 'John Doe',
        email: 'john@test.com',
        phone: '1234567890',
        country: 'USA',
        message: 'Please send brochure',
        now: '2024-01-01',
    }

    describe('searchBrochures', () => {
        it('returns brochure items with pagination', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [mockBrochure],
                    total: 1,
                    page: 1,
                    limit: 10,
                },
            })

            const result = await searchBrochures({ page: 1, limit: 10 })

            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('/search'),
                expect.objectContaining({
                    params: { page: 1, limit: 10 },
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
            expect(result.items).toEqual([mockBrochure])
            expect(result.total).toBe(1)
        })

        it('handles data property fallback', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {
                    data: [mockBrochure],
                    total: 1,
                },
            })

            const result = await searchBrochures()
            expect(result.items).toEqual([mockBrochure])
        })

        it('applies filters correctly', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: { items: [], total: 0 },
            })

            await searchBrochures({
                name: 'John',
                email: 'john@test.com',
                country: 'USA',
                website_id: 1,
            })

            expect(api.get).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    params: expect.objectContaining({
                        name: 'John',
                        email: 'john@test.com',
                        country: 'USA',
                        website_id: 1,
                    }),
                })
            )
        })
    })

    describe('createBrochure', () => {
        it('creates new brochure request', async () => {
            const newBrochure = {
                name: 'Jane',
                email: 'jane@test.com',
                phone: '9876543210',
                country: 'Canada',
                message: 'Need brochure',
                website_id: 1,
            }
                ; (api.post as jest.Mock).mockResolvedValue({ data: mockBrochure })

            const result = await createBrochure(newBrochure)

            expect(api.post).toHaveBeenCalledWith(
                expect.any(String),
                newBrochure,
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
            expect(result).toEqual(mockBrochure)
        })

        it('includes auth headers when token exists', async () => {
            localStorage.setItem('accessToken', 'test-token')
                ; (api.post as jest.Mock).mockResolvedValue({ data: mockBrochure })

            await createBrochure({ name: 'Test' })

            expect(api.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                expect.objectContaining({
                    headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
                })
            )
        })
    })

    describe('deleteBrochure', () => {
        it('deletes brochure by numeric ID', async () => {
            (api.delete as jest.Mock).mockResolvedValue({})

            await deleteBrochure(1)

            expect(api.delete).toHaveBeenCalledWith(
                expect.stringContaining('/1'),
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
        })

        it('deletes brochure by string ID', async () => {
            (api.delete as jest.Mock).mockResolvedValue({})

            await deleteBrochure('brochure-456')

            expect(api.delete).toHaveBeenCalledWith(
                expect.stringContaining('/brochure-456'),
                expect.any(Object)
            )
        })
    })
})
