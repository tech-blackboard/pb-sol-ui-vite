import {
    getAllAbstracts,
    getAbstractById,
    createAbstractWithFormDataFileUpload,
    updateAbstractStatus,
    searchAbstracts,
    sendInvoice,
    fetchDashboard,
    type AbstractItem
} from '../../services/abstracts'
import { api } from '../../lib/api'

jest.mock('../../lib/api', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
    },
}))

describe('abstracts service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
    })

    const mockItem: AbstractItem = { id: 1, name: 'Test' }

    describe('getAllAbstracts', () => {
        it('handles raw array response', async () => {
            ; (api.get as jest.Mock).mockResolvedValue({ data: [mockItem] })
            const result = await getAllAbstracts()
            expect(result).toEqual([mockItem])
        })

        it('handles response.data nested array', async () => {
            ; (api.get as jest.Mock).mockResolvedValue({ data: { data: [mockItem] } })
            const result = await getAllAbstracts()
            expect(result).toEqual([mockItem])
        })

        it('handles response.items nested array', async () => {
            ; (api.get as jest.Mock).mockResolvedValue({ data: { items: [mockItem] } })
            const result = await getAllAbstracts()
            expect(result).toEqual([mockItem])
        })

        it('handles response.results nested array', async () => {
            ; (api.get as jest.Mock).mockResolvedValue({ data: { results: [mockItem] } })
            const result = await getAllAbstracts()
            expect(result).toEqual([mockItem])
        })

        it('returns empty array on fallback', async () => {
            ; (api.get as jest.Mock).mockResolvedValue({ data: {} })
            const result = await getAllAbstracts()
            expect(result).toEqual([])
        })
    })

    describe('createAbstractWithFormDataFileUpload', () => {
        it('handles JSON body', async () => {
            ; (api.post as jest.Mock).mockResolvedValue({ data: mockItem })
            await createAbstractWithFormDataFileUpload({ name: 'Test' })
            expect(api.post).toHaveBeenCalledWith(expect.any(String), { name: 'Test' }, expect.objectContaining({
                headers: expect.objectContaining({ 'Content-Type': 'application/json' })
            }))
        })

        it('handles FormData body', async () => {
            const formData = new FormData()
            formData.append('name', 'Test')
                ; (api.post as jest.Mock).mockResolvedValue({ data: mockItem })

            await createAbstractWithFormDataFileUpload(formData)

            const config = (api.post as jest.Mock).mock.calls[0][2]
            expect(config.headers?.['Content-Type']).toBeUndefined() // Should let browser set it
        })
    })

    describe('updateAbstractStatus', () => {
        it('handles numeric string ID', async () => {
            ; (api.patch as jest.Mock).mockResolvedValue({ data: mockItem })
            await updateAbstractStatus('123', 2)
            expect(api.patch).toHaveBeenCalledWith(expect.stringContaining('/123/status'), { status_id: 2 }, expect.any(Object))
        })

        it('handles non-numeric string ID', async () => {
            ; (api.patch as jest.Mock).mockResolvedValue({ data: mockItem })
            await updateAbstractStatus('abc-123', 2)
            expect(api.patch).toHaveBeenCalledWith(expect.stringContaining('/abc-123/status'), { status_id: 2 }, expect.any(Object))
        })
    })

    describe('searchAbstracts', () => {
        it('maps isEmailSent boolean to number', async () => {
            ; (api.get as jest.Mock).mockResolvedValue({ data: { items: [mockItem] } })

            await searchAbstracts({ isEmailSent: true })
            expect(api.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                params: expect.objectContaining({ isEmailSent: 1 })
            }))

            await searchAbstracts({ isEmailSent: false })
            expect(api.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                params: expect.objectContaining({ isEmailSent: 0 })
            }))
        })

        it('extracts pagination data from various response fields', async () => {
            ; (api.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [mockItem],
                    pagination: { total: 100, page: 2, limit: 10, totalPages: 10 }
                }
            })
            const result = await searchAbstracts()
            expect(result.total).toBe(100)
            expect(result.page).toBe(2)
            expect(result.totalPages).toBe(10)
        })
    })

    describe('other methods', () => {
        it('getAbstractById', async () => {
            ; (api.get as jest.Mock).mockResolvedValue({ data: mockItem })
            const res = await getAbstractById(1)
            expect(res).toBe(mockItem)
        })

        it('sendInvoice', async () => {
            ; (api.post as jest.Mock).mockResolvedValue({ data: { success: true } })
            await sendInvoice(1, { invoiceAmount: 100, orderItems: [] })
            expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/send-invoice'), expect.any(Object), expect.any(Object))
        })

        it('fetchDashboard', async () => {
            ; (api.get as jest.Mock).mockResolvedValue({ data: { total: 10 } })
            await fetchDashboard({ website_id: 1 })
            expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/dashboard'), expect.objectContaining({
                params: { website_id: 1 }
            }))
        })
    })
})
