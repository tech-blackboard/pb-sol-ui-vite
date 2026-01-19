import { STATUS_TO_ID } from '../../../features/abstracts/status.constants'
import type { AbstractStatus } from '../../../features/abstracts/types'

describe('status.constants', () => {
    const statuses: AbstractStatus[] = [
        'Under Review',
        'Accepted',
        'Out of Scope',
        'Rejected',
        'Sent Invoice',
        'Registered',
    ]

    it('has correct mapping for all expected statuses', () => {
        const expectedMap: Record<AbstractStatus, number> = {
            'Under Review': 1,
            'Accepted': 2,
            'Out of Scope': 3,
            'Rejected': 4,
            'Sent Invoice': 5,
            'Registered': 6,
        }

        statuses.forEach((status) => {
            expect(STATUS_TO_ID[status]).toBe(expectedMap[status])
        })
    })

    it('has entries for exactly the defined statuses', () => {
        expect(Object.keys(STATUS_TO_ID)).toHaveLength(statuses.length)
    })
})
