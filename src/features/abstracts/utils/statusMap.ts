import type { AbstractStatus } from '../../../types'

export const STATUS_TO_ID: Record<AbstractStatus, number> = {
  'Under Review': 1,
  Accepted: 2,
  'Out of Scope': 3,
  Rejected: 4,
  'Sent Invoice': 5,
  Registered: 6,
}
