jest.mock('../../../../services/registrations', () => ({
    searchRegistrations: jest.fn(),
    deleteRegistration: jest.fn(),
    createRegistration: jest.fn(),
}))

import {
    fetchRegistrations,
    deleteRegistrationThunk,
    createRegistrationThunk,
} from '../../../../store/slices/registrations/registrations.thunks'

import {
    searchRegistrations,
    deleteRegistration,
    createRegistration,
} from '../../../../services/registrations'
import type { RegistrationItem } from '../../../../services/registrations'

const dispatch = jest.fn()
const getState = jest.fn()

beforeEach(() => {
    jest.clearAllMocks()
})

describe('registrations thunks', () => {
    /* -------------------------------------------------- */
    /* fetchRegistrations                                 */
    /* -------------------------------------------------- */

    it('fetchRegistrations → calls searchRegistrations with merged filters', async () => {
        ; (searchRegistrations as jest.Mock).mockResolvedValue({ items: [], total: 0 })

        const thunk = fetchRegistrations({
            page: 1,
            limit: 10,
            filters: { search: 'Test' },
        })
        await thunk(dispatch, getState, undefined)

        expect(searchRegistrations).toHaveBeenCalledWith({
            page: 1,
            limit: 10,
            search: 'Test',
        })
    })

    it('fetchRegistrations → rejects with value on axios error', async () => {
        const axiosError = {
            isAxiosError: true,
            response: { data: { message: 'API Error Message' } },
        }
            ; (searchRegistrations as jest.Mock).mockRejectedValue(axiosError)

        const thunk = fetchRegistrations({
            page: 1,
            limit: 10,
            filters: {},
        })

        const result = await thunk(dispatch, getState, undefined)

        expect(result.type).toBe('registrations/fetch/rejected')
        expect(result.payload).toBe('API Error Message')
    })

    it('fetchRegistrations → rejects with default message on generic error', async () => {
        ; (searchRegistrations as jest.Mock).mockRejectedValue(new Error('Generic Error'))

        const thunk = fetchRegistrations({
            page: 1,
            limit: 10,
            filters: {},
        })

        const result = await thunk(dispatch, getState, undefined)

        expect(result.type).toBe('registrations/fetch/rejected')
        expect(result.payload).toBe('Failed to load registrations')
    })

    /* -------------------------------------------------- */
    /* deleteRegistrationThunk                            */
    /* -------------------------------------------------- */

    it('deleteRegistrationThunk → calls deleteRegistration and returns id', async () => {
        ; (deleteRegistration as jest.Mock).mockResolvedValue(undefined)

        const thunk = deleteRegistrationThunk(123)
        const result = await thunk(dispatch, getState, undefined)

        expect(deleteRegistration).toHaveBeenCalledWith(123)
        expect(result.payload).toBe(123)
    })

    /* -------------------------------------------------- */
    /* createRegistrationThunk                            */
    /* -------------------------------------------------- */

    it('createRegistrationThunk → calls createRegistration and returns result', async () => {
        const mockData: Partial<RegistrationItem> = { name: 'John Doe', email: 'john@example.com' }
        const mockResponse = { id: 1, ...mockData }
            ; (createRegistration as jest.Mock).mockResolvedValue(mockResponse)

        const thunk = createRegistrationThunk(mockData)
        const result = await thunk(dispatch, getState, undefined)

        expect(createRegistration).toHaveBeenCalledWith(mockData)
        expect(result.payload).toEqual(mockResponse)
    })

    it('createRegistrationThunk → rejects with value on error', async () => {
        const mockData: Partial<RegistrationItem> = { name: 'John Doe' }
            ; (createRegistration as jest.Mock).mockRejectedValue(new Error('Create Failed'))

        const thunk = createRegistrationThunk(mockData)
        const result = await thunk(dispatch, getState, undefined)

        expect(result.type).toBe('registrations/create/rejected')
        expect(result.payload).toBe('Failed to create registration')
    })
})
