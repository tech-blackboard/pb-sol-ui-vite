
import type { AbstractRecord } from '../types'
import AbstractRow from './AbstractRow'

interface Props {
  rows: AbstractRecord[]
  rawRows: any[]
  loading: boolean
  error: string | null
  errKind: 'none' | 'generic'
  onRetry: () => void
  onView: (item: any) => void
}

export default function AbstractTable({
  rows,
  rawRows,
  loading,
  error,
  errKind,
  onRetry,
  onView,
}: Props) {
  return (
    <div className="relative flex-1 min-h-0 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto overflow-y-auto h-full scrollbar-thin">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium min-w-[14rem]">Website</th>
              <th className="px-4 py-3 font-medium min-w-[14rem]">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Alternate Email</th>
              <th className="px-4 py-3 font-medium min-w-[10rem]">Phone</th>
              <th className="px-4 py-3 font-medium min-w-[10rem]">WhatsApp</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium min-w-[14rem]">University</th>
              <th className="px-4 py-3 font-medium min-w-[14rem] overflow-hidden">Title</th>
              <th className="px-4 py-3 font-medium min-w-[14rem] overflow-hidden">Message</th>
              <th className="px-4 py-3 font-medium min-w-[14rem] ">Presentation</th>
              <th className="px-4 py-3 font-medium min-w-[18rem] ">Abstract File</th>
              <th className="px-4 py-3 font-medium">Submitted On</th>
              <th className="px-4 py-3 font-medium min-w-[8rem] ">Email Sent</th>
              <th className="px-4 py-3 font-medium min-w-[8rem] ">Status</th>
              <th className="px-4 py-3 font-medium min-w-[5rem] ">Actions</th>
            </tr>
          </thead>

          <tbody className="align-top">
            {loading && (
              <tr>
                <td colSpan={17} className="px-4 py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && error && errKind === 'generic' && (
              <tr>
                <td colSpan={17} className="px-4 py-6">
                  <div className="flex justify-between items-center">
                    <span className="text-red-600">{error}</span>
                    <button
                      onClick={onRetry}
                      className="border px-3 py-1.5 text-xs rounded"
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={17} className="px-4 py-6 text-gray-500">
                  No records found
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              rows.map((r) => {
                const raw = rawRows.find(
                  (x) => String(x.id ?? x._id) === r.id
                )

                return (
                  <AbstractRow
                    key={r.id}
                    record={r}
                    raw={raw}
                    onView={() => onView(raw)}
                  />
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
