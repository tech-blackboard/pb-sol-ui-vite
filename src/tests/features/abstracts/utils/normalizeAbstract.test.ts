import { normalizeAbstract } from '../../../../features/abstracts/utils/normalizeAbstract'
import type { AbstractItem, AbstractUser } from '../../../../services/abstracts'
import type { AbstractRecord } from '../../../../features/abstracts/types'

describe('normalizeAbstract', () => {
    const mockUser: AbstractUser = {
        id: 1,
        firstname: 'Jane',
        lastname: 'Smith',
        useremail: 'jane@example.com'
    }

    const mockItem: AbstractItem = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        aemail: 'alt@example.com',
        phone: '1234567890',
        wphone: '0987654321',
        city: 'Test City',
        country: 'Test Country',
        organization: 'Test University',
        title: 'Test Title',
        message: 'Test Message',
        intrested: 'ORAL PRESENTATION',
        file: 'test.pdf',
        fileS3Url: 'https://s3.example.com/test.pdf',
        status: { id: 1, actionType: 'Accepted' },
        isEmailSent: true,
    }

    it('correctly normalizes a full AbstractItem', () => {
        const result: AbstractRecord = normalizeAbstract(mockItem)
        expect(result).toEqual({
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            altEmail: 'alt@example.com',
            phone: '1234567890',
            whatsapp: '0987654321',
            city: 'Test City',
            country: 'Test Country',
            university: 'Test University',
            title: 'Test Title',
            message: 'Test Message',
            presentationType: 'Oral',
            file: 'test.pdf',
            fileS3Url: 'https://s3.example.com/test.pdf',
            status: 'Accepted',
            isEmailSent: true,
        })
    })

    it('handles nested status objects', () => {
        const itemWithNestedStatus: AbstractItem = {
            ...mockItem,
            status: { id: 4, actionType: 'Rejected' },
        }
        const result = normalizeAbstract(itemWithNestedStatus)
        expect(result.status).toBe('Rejected')
    })

    it('falls back to "Under Review" for invalid statuses', () => {
        const itemWithInvalidStatus: AbstractItem = {
            ...mockItem,
            status: { id: 99, actionType: 'Invalid Status' },
        }
        const result = normalizeAbstract(itemWithInvalidStatus)
        expect(result.status).toBe('Under Review')
    })

    it('extracts name from user object if item.name is missing', () => {
        const itemWithoutName: AbstractItem = {
            ...mockItem,
            name: undefined,
            user: mockUser,
        }
        const result = normalizeAbstract(itemWithoutName)
        expect(result.name).toBe('Jane Smith')
    })

    it('provides default name if both item.name and user name are missing', () => {
        // Casting only for testing edge case of incomplete source data
        const itemWithoutAnyName = {
            ...mockItem,
            name: undefined,
            user: { id: 2 } as AbstractUser,
        } as AbstractItem
        const result = normalizeAbstract(itemWithoutAnyName)
        expect(result.name).toBe('Unnamed')
    })

    it('extracts email from user object if item.email is missing', () => {
        const itemWithoutEmail: AbstractItem = {
            ...mockItem,
            email: undefined,
            user: mockUser,
        }
        const result = normalizeAbstract(itemWithoutEmail)
        expect(result.email).toBe('jane@example.com')
    })

    describe('toPresentationType', () => {
        it.each([
            ['ORAL', 'Oral'],
            ['POSTER', 'Poster'],
            ['VIRTUAL', 'Virtual'],
            ['DELEGATE', 'Delegate'],
            ['Something Else', undefined],
            [undefined, undefined],
        ])('maps "%s" to "%s"', (input, expected) => {
            const item: AbstractItem = { ...mockItem, intrested: input as string }
            const result = normalizeAbstract(item)
            expect(result.presentationType).toBe(expected)
        })
    })
})
