import type { AbstractStatus } from '../../../types'

export default function AbstractStatusBadge({
  status,
}: {
  status: AbstractStatus
}) {
  const styles =
    status === 'Accepted'
      ? 'bg-green-50 text-green-700'
      : status === 'Under Review'
      ? 'bg-yellow-50 text-yellow-800'
      : status === 'Rejected'
      ? 'bg-red-50 text-red-700'
      : status === 'Out of Scope'
      ? 'bg-gray-100 text-gray-700'
      : 'bg-blue-50 text-blue-700'

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${styles}`}>
      {status}
    </span>
  )
}
