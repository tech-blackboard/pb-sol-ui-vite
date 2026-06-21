import {
    searchContacts,
    createContact,
    deleteContact,
    type ContactItem,
} from '../../services/contacts'
import { api } from '../../lib/api'

jest.mock('../../lib/api', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn(),
        patch: jest.fn(),
    },
}))

describe('contacts service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorage.clear()
    })

    const mockContact: ContactItem = {
        id: 1,
        name: 'John Doe',
        email: 'john@test.com',
        phone: '1234567890',
        country: 'USA',
        message: 'Test message',
        now: '2024-01-01',
    }

    describe('searchContacts', () => {
        it('returns contact items with pagination', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [mockContact],
                    total: 1,
                    page: 1,
                    limit: 10,
                },
            })

            const result = await searchContacts({ page: 1, limit: 10 })

            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('/search'),
                expect.objectContaining({
                    params: { page: 1, limit: 10 },
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
            expect(result.items).toEqual([mockContact])
            expect(result.total).toBe(1)
        })

        it('handles data property fallback', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {
                    data: [mockContact],
                    total: 1,
                },
            })

            const result = await searchContacts()
            expect(result.items).toEqual([mockContact])
        })

        it('uses default pagination values', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {},
            })

            const result = await searchContacts({ page: 2, limit: 20 })
            expect(result.page).toBe(2)
            expect(result.limit).toBe(20)
        })
    })

    describe('createContact', () => {
        it('creates new contact', async () => {
            const newContact = {
                name: 'Jane',
                email: 'jane@test.com',
                phone: '9876543210',
                country: 'USA',
                message: 'Hello',
                website_id: 1,
            }
                ; (api.post as jest.Mock).mockResolvedValue({ data: mockContact })

            const result = await createContact(newContact)

            expect(api.post).toHaveBeenCalledWith(
                expect.any(String),
                newContact,
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
            expect(result).toEqual(mockContact)
        })

        it('includes auth headers when token exists', async () => {
            localStorage.setItem('accessToken', 'test-token')
                ; (api.post as jest.Mock).mockResolvedValue({ data: mockContact })

            await createContact({ name: 'Test' })

            expect(api.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                expect.objectContaining({
                    headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
                })
            )
        })
    })

    describe('deleteContact', () => {
        it('deletes contact by numeric ID', async () => {
            (api.delete as jest.Mock).mockResolvedValue({})

            await deleteContact(1)

            expect(api.delete).toHaveBeenCalledWith(
                expect.stringContaining('/1'),
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
        })

        it('deletes contact by string ID', async () => {
            (api.delete as jest.Mock).mockResolvedValue({})

            await deleteContact('abc-123')

            expect(api.delete).toHaveBeenCalledWith(
                expect.stringContaining('/abc-123'),
                expect.any(Object)
            )
        })
    })

    describe('updateContact', () => {
        it('updates contact by ID', async () => {
            (api.patch as jest.Mock).mockResolvedValue({ data: mockContact })

            const result = await import('../../services/contacts').then(m => m.updateContact(1, { name: 'Updated Name' }))

            expect(api.patch).toHaveBeenCalledWith(
                expect.stringContaining('/1'),
                { name: 'Updated Name' },
                expect.objectContaining({
                    headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                    withCredentials: true,
                })
            )
            expect(result).toEqual(mockContact)
        })
    })
})
