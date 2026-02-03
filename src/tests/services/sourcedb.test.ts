import { listWebsites } from '../../services/sourcedb'
import { api } from '../../lib/api'

jest.mock('../../lib/api', () => ({
    api: {
        get: jest.fn(),
    },
}))

describe('sourcedb service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('listWebsites', () => {
        it('handles successful array response', async () => {
            const mockData = [
                { id: 1, name: 'Web 1', link: 'http://link1' },
            ]
                ; (api.get as jest.Mock).mockResolvedValue({ data: mockData })

            const result = await listWebsites()
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({ id: 1, name: 'Web 1', link: 'http://link1' })
        })

        it('handles nested "items" response', async () => {
            const mockResponse = { items: [{ id: 2, name: 'Web 2' }] }
                ; (api.get as jest.Mock).mockResolvedValue({ data: mockResponse })

            const result = await listWebsites()
            expect(result[0]).toEqual({ id: 2, name: 'Web 2', link: '' })
        })

        it('handles nested "data" response', async () => {
            const mockResponse = { data: [{ id: 3, name: 'Web 3' }] }
                ; (api.get as jest.Mock).mockResolvedValue({ data: mockResponse })

            const result = await listWebsites()
            expect(result[0]).toEqual({ id: 3, name: 'Web 3', link: '' })
        })

        it('handles fallback to "title" if "name" is missing', async () => {
            const mockData = [{ id: 4, title: 'Web 4' }]
                ; (api.get as jest.Mock).mockResolvedValue({ data: mockData })

            const result = await listWebsites()
            expect(result[0].name).toBe('Web 4')
        })

        it('handles missing id and falls back to 0', async () => {
            const mockData = [{ name: 'Web 5' }]
                ; (api.get as jest.Mock).mockResolvedValue({ data: mockData })

            const result = await listWebsites()
            expect(result[0].id).toBe(0)
        })

        it('returns empty array if data is missing or invalid', async () => {
            ; (api.get as jest.Mock).mockResolvedValue({ data: null })
            const result = await listWebsites()
            expect(result).toEqual([])

                ; (api.get as jest.Mock).mockResolvedValue({ data: { somethingElse: [] } })
            const result2 = await listWebsites()
            expect(result2).toEqual([])
        })
    })
})
