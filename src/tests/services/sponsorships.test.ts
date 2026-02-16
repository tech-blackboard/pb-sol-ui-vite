import {
    searchSponsorships,
    createSponsorship,
    deleteSponsorship,
    type SponsorshipItem,
} from '../../services/sponsorships'
import { api } from '../../lib/api'

jest.mock('../../lib/api', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn(),
    },
}))

describe('sponsorships service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
    })

    const mockSponsorship: SponsorshipItem = {
        id: 1,
        name: 'John Doe',
        email: 'john@test.com',
        phone: '1234567890',
        organization: 'Test Corp',
        country: 'USA',
        message: 'Interested in sponsorship',
        now: '2024-01-01',
    }

    describe('searchSponsorships', () => {
        it('returns sponsorship items with pagination', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [mockSponsorship],
                    total: 1,
                    page: 1,
                    limit: 10,
                },
            })

            const result = await searchSponsorships({ page: 1, limit: 10 })

            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('/search'),
                expect.objectContaining({
                    params: { page: 1, limit: 10 },
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
            expect(result.items).toEqual([mockSponsorship])
            expect(result.total).toBe(1)
        })

        it('handles data property fallback', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {
                    data: [mockSponsorship],
                    total: 1,
                },
            })

            const result = await searchSponsorships()
            expect(result.items).toEqual([mockSponsorship])
        })

        it('handles empty results', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: { items: [], total: 0 },
            })

            const result = await searchSponsorships()
            expect(result.items).toEqual([])
            expect(result.total).toBe(0)
        })
    })

    describe('createSponsorship', () => {
        it('creates new sponsorship inquiry', async () => {
            const newSponsorship = {
                name: "john",
                email: "[EMAIL_ADDRESS]",
                phone: "1234567890",
                organization: "test",
                country: "USA",
                message: "test",
                website_id: 1,
            }
                ; (api.post as jest.Mock).mockResolvedValue({ data: mockSponsorship })

            const result = await createSponsorship(newSponsorship)

            expect(api.post).toHaveBeenCalledWith(
                expect.any(String),
                newSponsorship,
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
            expect(result).toEqual(mockSponsorship)
        })

        it('includes auth headers when token exists', async () => {
            sessionStorage.setItem('accessToken', 'session-token')
                ; (api.post as jest.Mock).mockResolvedValue({ data: mockSponsorship })

            await createSponsorship({ name: 'Test' })

            expect(api.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                expect.objectContaining({
                    headers: expect.objectContaining({ Authorization: 'Bearer session-token' }),
                })
            )
        })
    })

    describe('deleteSponsorship', () => {
        it('deletes sponsorship by numeric ID', async () => {
            (api.delete as jest.Mock).mockResolvedValue({})

            await deleteSponsorship(1)

            expect(api.delete).toHaveBeenCalledWith(
                expect.stringContaining('/1'),
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
        })

        it('deletes sponsorship by string ID', async () => {
            (api.delete as jest.Mock).mockResolvedValue({})

            await deleteSponsorship('xyz-789')

            expect(api.delete).toHaveBeenCalledWith(
                expect.stringContaining('/xyz-789'),
                expect.any(Object)
            )
        })
    })
})
